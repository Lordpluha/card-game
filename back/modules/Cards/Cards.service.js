import { pool } from "../../db/connect.js";
import cards from "../../utils/cards.js";

class CardsService {
  async getAll() {
    return cards;
  }

  async getById(id) {
    const [rows] = await pool.execute("SELECT * FROM cards WHERE id = ?", [id]);
    if (!rows.length) throw { status: 404, message: "Card not found" };
    return rows[0];
  }

  async create(data) {
    const { name, image_url, attack, defense, cost, description } = data;
    const [result] = await pool.execute(
      "INSERT INTO cards (name, image_url, attack, defense, cost, description) VALUES (?, ?, ?, ?, ?, ?)",
      [name, image_url, attack, defense, cost, description || null]
    );
    return this.getById(result.insertId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    for (let key of [
      "name",
      "image_url",
      "attack",
      "defense",
      "cost",
      "description",
    ]) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) throw { status: 400, message: "No fields to update" };
    values.push(id);
    await pool.execute(
      `UPDATE cards SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    return this.getById(id);
  }

  async delete(id) {
    await pool.execute("DELETE FROM cards WHERE id = ?", [id]);
    return { message: "Deleted" };
  }

  // craft: объединить две карточки в новую со средними статами +1
  async craft(ids) {
    if (ids.length < 2)
      throw { status: 400, message: "Need at least two cards to craft" };
    const cards = await Promise.all(ids.map((id) => this.getById(id)));
    const avg = (key) =>
      Math.floor(cards.reduce((s, c) => s + c[key], 0) / cards.length) + 1;
    const name = "Crafted: " + cards.map((c) => c.name).join("+");
    const image_url = cards[0].image_url;
    const attack = avg("attack"),
      defense = avg("defense"),
      cost = avg("cost");
    const [result] = await pool.execute(
      "INSERT INTO cards (name,image_url,attack,defense,cost) VALUES (?,?,?,?,?)",
      [name, image_url, attack, defense, cost]
    );
    return this.getById(result.insertId);
  }

  // upgrade: увеличить атаку и защиту на 10%
  async upgrade(id, userId) {
    const card = await this.getById(id);

    // Получаем текущие монеты юзера
    const [[user]] = await pool.execute(
      "SELECT coins FROM users WHERE id = ?",
      [userId]
    );

    if (user.coins < 50) {
      throw { status: 400, message: "Not enough coins" };
    }

    // 🛡 Если карта нулевая — поднимаем до 1
    let newAttack =
      card.attack === 0 ? 1 : Math.min(Math.ceil(card.attack * 1.1), 100);
    let newDefense =
      card.defense === 0 ? 1 : Math.min(Math.ceil(card.defense * 1.1), 100);

    // ❌ Если уже максимум
    if (card.attack >= 100 && card.defense >= 100) {
      throw { status: 400, message: "Max level reached" };
    }

    // 💰 Снимаем 50 монет
    await pool.execute("UPDATE users SET coins = coins - 50 WHERE id = ?", [
      userId,
    ]);

    // 🔄 Обновляем карточку
    await pool.execute(
      "UPDATE cards SET attack = ?, defense = ? WHERE id = ?",
      [newAttack, newDefense, id]
    );

    return this.getById(id);
  }
  // merge: объединить две карточки в новую со (суммой стат / 1.5) - 1
  async merge([id1, id2], userId) {
    const [card1, card2] = await Promise.all([
      this.getById(id1),
      this.getById(id2),
    ]);

    if (!card1 || !card2) throw new Error("Invalid card IDs");
    if (id1 === id2)
      throw { status: 400, message: "Cannot merge the same card" };

    const [[user]] = await pool.execute(
      "SELECT coins, card_ids FROM users WHERE id = ?",
      [userId]
    );

    if (user.coins < 50) throw { status: 400, message: "Not enough coins" };

    const calc = (key) => Math.max(1, Math.floor(card1[key] + card2[key]));
    const rarities = ["COMMON", "RARE", "EPIC", "MYTHICAL", "LEGENDARY"];

    const resultCard = {
      name:
        card1.attack + card1.defense > card2.attack + card2.defense
          ? card1.name
          : card2.name,
      image_url:
        card1.attack + card1.defense > card2.attack + card2.defense
          ? card1.image_url
          : card2.image_url,
      attack: calc("attack"),
      defense: calc("defense"),
      cost: calc("cost"),
      type: rarities[
        Math.max(rarities.indexOf(card1.type), rarities.indexOf(card2.type))
      ],
      description: card1.description || card2.description || "Merged card",
      categories: JSON.stringify([
        ...new Set([...(card1.categories || []), ...(card2.categories || [])]),
      ]),
    };

    const [insertResult] = await pool.execute(
      "INSERT INTO cards (name, image_url, attack, defense, cost, type, description, categories) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        resultCard.name,
        resultCard.image_url,
        resultCard.attack,
        resultCard.defense,
        resultCard.cost,
        resultCard.type,
        resultCard.description,
        resultCard.categories,
      ]
    );

    const [newCardRows] = await pool.execute(
      "SELECT * FROM cards WHERE id = ?",
      [insertResult.insertId]
    );
    const newCard = newCardRows[0];

    const current = Array.isArray(user.card_ids)
      ? user.card_ids
      : JSON.parse(user.card_ids);
    const updated = current.filter((id) => ![id1, id2].includes(id));
    updated.push(newCard.id);

    await pool.execute(
      "UPDATE users SET coins = coins - 50, card_ids = ? WHERE id = ?",
      [JSON.stringify(updated), userId]
    );

    return newCard;
  }

  async getUserCards(userId) {
    // fetch stored card_ids JSON for this user
    const [[user]] = await pool.execute(
      "SELECT card_ids FROM users WHERE id = ?",
      [userId]
    );
    if (!user) throw { status: 404, message: "User not found" };

    // parse JSON array of ids
    const ids = Array.isArray(user.card_ids)
      ? user.card_ids
      : JSON.parse(user.card_ids || "[]");
    if (!ids.length) return [];

    // retrieve and return all cards matching those ids
    const [cards] = await pool.query("SELECT * FROM cards WHERE id IN (?)", [
      ids,
    ]);
    return cards;
  }
  async openPack(userId, type = "common") {
    const sizes = {
      common: 1,
      rare: 1,
      epic: 1,
      legendary: 1,
    };

    const size = sizes[type] || 1;

    // Получаем все базовые карты (в т.ч. "locked") из utils/cards.js
    const all = cards;
    const newCards = [];

    for (let i = 0; i < size; i++) {
      const base = all[Math.floor(Math.random() * all.length)];
      const card = { ...base };

      // Вставляем дубликат карты в БД
      const [result] = await pool.execute(
        "INSERT INTO cards (name, image_url, attack, defense, cost, description, type, categories) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          card.name,
          card.image_url,
          card.attack,
          card.defense,
          card.cost || 1,
          card.description || null,
          card.type || "COMMON",
          JSON.stringify(card.categories || []),
        ]
      );

      const [[newCard]] = await pool.query("SELECT * FROM cards WHERE id = ?", [
        result.insertId,
      ]);

      newCards.push(newCard);
    }

    // Обновляем card_ids пользователя
    const [[user]] = await pool.query(
      "SELECT card_ids FROM users WHERE id = ?",
      [userId]
    );
    const existing = Array.isArray(user.card_ids)
      ? user.card_ids
      : JSON.parse(user.card_ids || "[]");

    const updated = [...existing, ...newCards.map((c) => c.id)];
    await pool.execute("UPDATE users SET card_ids = ? WHERE id = ?", [
      JSON.stringify(updated),
      userId,
    ]);

    return newCards;
  }

  // async mergeCards(userId, gameId, [card1_id, card2_id]) {
  //   const game = await this.getGameById(gameId);
  //   const user = await UserService.getById(userId);

  //   // Игра должна быть в процессе
  //   if (game.status !== "IN_PROGRESS") {
  //     throw { status: 400, message: "Game not in progress" };
  //   }
  //   // Проверяем, что пользователь в игре
  //   if (!game.user_ids.includes(userId)) {
  //     throw { status: 403, message: "You are not in this game" };
  //   }
  //   // Проверяем, что карты принадлежат пользователю
  //   if (![card1_id, card2_id].every((id) => user.card_ids.includes(id))) {
  //     throw { status: 400, message: "You do not own these cards" };
  //   }
  //   // Проверяем, что карты в колоде пользователя
  //   if (
  //     !game.game_state.decks[userId]?.includes(card1_id) ||
  //     !game.game_state.decks[userId]?.includes(card2_id)
  //   ) {
  //     throw { status: 400, message: "Cards not in user's deck" };
  //   }

  //   const new_game_state = { ...game.game_state };

  //   new_game_state.decks = new_game_state.decks.filter(
  //     (deck) => !deck.includes(card1_id) && !deck.includes(card2_id)
  //   );

  //   const card1 = await CardsService.getById(card1_id);
  //   const card2 = await CardsService.getById(card2_id);

  //   // Крафтим новую карту
  //   const calc = (key) =>
  //     Math.max(0, Math.floor((card1[key] + card2[key]) / 1.5) - 1);
  //   const card1_points = (card1.attack + card1.defense) / card1.cost;
  //   const card2_points = (card2.attack + card2.defense) / card2.cost;
  //   const rare_order = ["COMMON", "RARE", "EPIC", "MYTHICAL", "LEGENDARY"];
  //   const newCard = {
  //     name: card1_points > card2_points ? card1.name : card2.name,
  //     image_url:
  //       card1_points > card2_points ? card1.image_url : card2.image_url,
  //     attack: calc("attack"),
  //     defense: calc("defense"),
  //     cost: calc("cost"),
  //     type:
  //       rare_order.indexOf(card1.rare) > rare_order.indexOf(card2.rare)
  //         ? card1.type
  //         : card2.type,
  //     categories: [...new Set([...card1.categories, ...card2.categories])],
  //     description:
  //       card1_points > card2_points ? card1.description : card2.description,
  //   };

  //   const newCardFromDB = await CardsService.create(newCard);

  //   new_game_state.decks.push(newCardFromDB);

  //   await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
  //     JSON.stringify(new_game_state),
  //     gameId,
  //   ]);

  //   return this.getGameById(gameId);
  // }
}

export default new CardsService();
