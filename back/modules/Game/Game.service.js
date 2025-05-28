import { pool } from "../../db/connect.js";
import { generateGameCode } from "../../utils/index.js";
import cards from "../../utils/cards.js";

class GameService {
  async createGame(userId) {
    console.log("🎮 [createGame] Called by userId:", userId);

    const code = generateGameCode();
    console.log("🔢 Generated game code:", code);

    let userRow;
    try {
      const [[row]] = await pool.execute(
        "SELECT * FROM users WHERE id = ?",
        [userId]
      );
      userRow = row;
      console.log("🙋‍♂️ Found user:", row);
    } catch (e) {
      console.error("❌ DB error fetching user:", e);
      throw e;
    }

    const initialState = {
      players: {
        [userId]: {
          username: userRow?.username || "Гравець",
          avatar_url: userRow?.avatar_url || null,
        },
      },
      health: { [userId]: 100 },
      hands: { },
      battlefield: { },
      decks: { },
      currentTurn: null,
    };

    console.log("📦 Initial game state:", initialState);

    try {
      const [result] = await pool.execute(
        "INSERT INTO games (game_code, host_user_id, user_ids, game_state) VALUES (?, ?, ?, ?)",
        [code, userId, JSON.stringify([userId]), JSON.stringify(initialState)]
      );
      console.log("✅ Game inserted with ID:", result.insertId);
      return this.getGameById(result.insertId);
    } catch (e) {
      console.error("🔥 Failed to insert game:", e);
      throw e;
    }
  }
  async joinGame(userId, gameId) {
    const game = await this.getGameById(gameId);
    if (game.user_ids.includes(userId)) {
			return this.getGameById(gameId);
    }

    const users = [...game.user_ids, userId];

    const [[userRow]] = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );
    const state = game.game_state;
    state.players = state.players || {};
    state.players[userId] = userRow

    await pool.execute(
      "UPDATE games SET user_ids = ?, game_state = ? WHERE id = ?",
      [JSON.stringify(users), JSON.stringify(state), gameId]
    );

    return this.getGameById(gameId);
  }

  async leaveGame(userId, gameId) {
    const game = await this.getGameById(gameId);
    if (!game.user_ids.includes(userId)) {
      throw { status: 400, message: "User not part of game" };
    }
    const users = game.user_ids.filter((id) => id !== userId);
    await pool.execute("UPDATE games SET user_ids = ? WHERE id = ?", [
      JSON.stringify(users),
      gameId,
    ]);
    return this.getGameById(gameId);
  }

  async getGameById(gameId) {
    const [rows] = await pool.execute("SELECT * FROM games WHERE id = ?", [
      gameId,
    ]);

    if (!rows.length) {
      throw { status: 404, message: "Game not found" };
    }

    const row = rows[0];

    const user_ids =
      typeof row.user_ids === "string"
        ? JSON.parse(row.user_ids)
        : row.user_ids;

    const game_state =
      typeof row.game_state === "string"
        ? JSON.parse(row.game_state)
        : row.game_state;

    return {
      id: row.id,
      game_code: row.game_code,
      host_user_id: row.host_user_id,
      status: row.status,
      user_ids,
      winner_id: row.winner_id,
      game_state,
    };
  }
  async getGameByCode(gameCode) {
    console.log("🔍 Searching game by code:", gameCode);

    const [rows] = await pool.execute(
      "SELECT * FROM games WHERE game_code = ?",
      [gameCode]
    );

    if (!rows.length) {
      throw { status: 404, message: "Game not found" };
    }

    const row = rows[0];
    const user_ids = Array.isArray(row.user_ids)
      ? row.user_ids
      : JSON.parse(row.user_ids);

    return {
      id: row.id,
      game_code: row.game_code,
      host_user_id: row.host_user_id,
      status: row.status,
      user_ids,
      winner_id: row.winner_id,
    };
  }

  async startGame(userId, gameId) {
    const game = await this.getGameById(gameId);
    if (game.host_user_id !== userId) {
      throw { status: 403, message: "Only host can start" };
    }
    // shuffle deck & deal N cards per player (stub logic)
    const deck = [...cards];
    deck.sort(() => Math.random() - 0.5);
    const handSize = 5;
    const hands = {};
    game.user_ids.forEach((uid) => {
      hands[uid] = deck.splice(0, handSize);
    });
    const newState = {
      ...game.game_state,
      deck,
      hands,
      battlefield: {},
      health: Object.fromEntries(game.user_ids.map((id) => [id, 20])),
      decks: game.game_state.decks,
      playedCards: {}, // <- add
      readies: {}, // <- add
      currentTurn:
        game.user_ids[Math.floor(Math.random() * game.user_ids.length)],
    };
    await pool.execute(
      "UPDATE games SET status = ?, game_state = ? WHERE id = ?",
      ["IN_PROGRESS", JSON.stringify(newState), gameId]
    );
    return this.getGameById(gameId);
  }

  async playCard(userId, gameId, cardId, targetId) {
    const game = await this.getGameById(gameId);
    if (game.status !== "IN_PROGRESS") {
      throw { status: 400, message: "Game not in progress" };
    }
    if (game.game_state.currentTurn !== userId) {
      throw { status: 403, message: "Not your turn" };
    }
    const state = { ...game.game_state };
    const hand = state.hands[userId] || [];
    const cardIndex = hand.findIndex((c) => c.id === cardId);
    if (cardIndex < 0) {
      throw { status: 400, message: "Card not in hand" };
    }
    const [card] = hand.splice(cardIndex, 1);
    state.battlefield[userId] = (state.battlefield[userId] || []).concat(card);

    // наносим урон
    if (targetId) {
      state.health[targetId] -= card.attack;
    }

    // определяем победителя
    let winner = null;
    if (targetId && state.health[targetId] <= 0) {
      winner = userId;
      // сразу сохраняем статус и победителя
      await pool.execute(
        "UPDATE games SET status = ?, winner_id = ? WHERE id = ?",
        ["ENDED", winner, gameId]
      );
      // обновляем дату последней игры для всех участников
      await pool.execute(
        "UPDATE users SET last_game_date = NOW() WHERE id IN (?)",
        [game.user_ids]
      );
    }

    // сохраняем новое состояние игры
    await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
      JSON.stringify(state),
      gameId,
    ]);
    return this.getGameById(gameId);
  }

  // игрок готов; когда оба готовы — даем хосту возможность запустить игру
  async playerReady(userId, gameId) {
    const game = await this.getGameById(gameId);
    const state = { ...game.game_state };
    state.readies = state.readies || {};
    state.readies[userId] = true;

    let outcome = null;
    const [pA, pB] = game.user_ids;
    if (state.readies[pA] && state.readies[pB]) {
      const cA = state.playedCards[pA],
        cB = state.playedCards[pB];
      const diff = Math.abs(cA.attack - cB.attack);
      let winner = null,
        loser = null;
      if (cA.attack > cB.attack) {
        winner = pA;
        loser = pB;
      } else if (cB.attack > cA.attack) {
        winner = pB;
        loser = pA;
      }
      if (winner) state.health[loser] -= diff;
      outcome = { cardA: cA, cardB: cB, winner, damage: diff };
      state.playedCards = {};
      state.readies = {};
    }

    await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
      JSON.stringify(state),
      gameId,
    ]);
    return { game: await this.getGameById(gameId), outcome };
  }

  async endTurn(userId, gameId) {
    const game = await this.getGameById(gameId);
    if (game.status !== "IN_PROGRESS") {
      throw { status: 400, message: "Game not in progress" };
    }
    if (game.game_state.currentTurn !== userId) {
      throw { status: 403, message: "Not your turn" };
    }
    // rotate turn
    const idx = game.user_ids.indexOf(userId);
    const next = game.user_ids[(idx + 1) % game.user_ids.length];
    const newState = { ...game.game_state, currentTurn: next };
    await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
      JSON.stringify(newState),
      gameId,
    ]);
    return this.getGameById(gameId);
  }

  async finishGame(userId, gameId) {
    const game = await this.getGameById(gameId);
    // только участник (или хост) может завершить игру
    if (!game.user_ids.includes(userId) && game.host_user_id !== userId) {
      throw { status: 403, message: "No rights to finish game" };
    }
    await pool.execute(
      "UPDATE games SET status = ?, winner_id = ? WHERE id = ?",
      ["ENDED", userId, gameId]
    );
    // обновляем дату последней игры для всех участников
    await pool.execute(
      "UPDATE users SET last_game_date = NOW() WHERE id IN (?)",
      [game.user_ids]
    );
    return this.getGameById(gameId);
  }

  async surrenderGame(userId, gameId) {
    const game = await this.getGameById(gameId);
    if (!game.user_ids.includes(userId)) {
      throw { status: 403, message: "Not in this game" };
    }
    const opponents = game.user_ids.filter((id) => id !== userId);
    if (!opponents.length) {
      throw { status: 400, message: "No opponent to surrender to" };
    }
    const winner = opponents[0];
    await pool.execute(
      "UPDATE games SET status = ?, winner_id = ? WHERE id = ?",
      ["ENDED", winner, gameId]
    );
    return this.getGameById(gameId);
  }

  async getGamesByUser(userId) {
    const [rows] = await pool.execute(
      "SELECT * FROM games WHERE JSON_CONTAINS(user_ids, JSON_ARRAY(?))",
      [userId]
    );
    return rows.map((row) => {
      const user_ids = Array.isArray(row.user_ids)
        ? row.user_ids
        : JSON.parse(row.user_ids);
      const game_state =
        typeof row.game_state === "object"
          ? row.game_state
          : JSON.parse(row.game_state);
      return {
        id: row.id,
        game_code: row.game_code,
        host_user_id: row.host_user_id,
        status: row.status,
        user_ids,
        winner_id: row.winner_id,
        game_state,
      };
    });
  }

  async selectDeck(userId, gameId, cardIds) {
    const game = await this.getGameById(gameId);
    if (game.status !== "CREATED") {
      throw { status: 400, message: "Game already started" };
    }
    if (!game.user_ids.includes(userId)) {
      throw { status: 403, message: "Not in this game" };
    }
    // Проверяем, что пользователь владеет карточками
    const [[user]] = await pool.execute(
      "SELECT card_ids FROM users WHERE id = ?",
      [userId]
    );
    if (!cardIds.every((id) => user.card_ids.includes(id))) {
      throw { status: 400, message: "Invalid card selection" };
    }
    // Обновляем состояние
    const state = {
      ...game.game_state,
      decks: { ...game.game_state.decks, [userId]: cardIds },
    };
    await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
      JSON.stringify(state),
      gameId,
    ]);
    return this.getGameById(gameId);
  }

  // во время игры объединить две карточки на battlefield
  async mergeCards(userId, gameId, [id1, id2]) {
    const game = await this.getGameById(gameId);
    if (game.status !== "IN_PROGRESS")
      throw { status: 400, message: "Game not in progress" };

    const state = { ...game.game_state };
    const bf = state.battlefield[userId] || [];

    const idx1 = bf.findIndex((c) => c.id === id1);
    const idx2 = bf.findIndex((c) => c.id === id2);
    if (idx1 < 0 || idx2 < 0)
      throw { status: 400, message: "Cards not on battlefield" };

    // удаляем карточки
    const [card1] = bf.splice(idx1, 1);
    const secondIdx = idx2 > idx1 ? idx2 - 1 : idx2;
    const [card2] = bf.splice(secondIdx, 1);

    // рассчитываем новый стат по каждому ключу
    const calc = (key) =>
      Math.max(0, Math.floor((card1[key] + card2[key]) / 1.5) - 1);

    const newCard = {
      id: `m-${Date.now()}`,
      name: `Merged:${card1.name}+${card2.name}`,
      attack: calc("attack"),
      defense: calc("defense"),
      cost: calc("cost"),
    };

    bf.push(newCard);
    state.battlefield[userId] = bf;

    await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
      JSON.stringify(state),
      gameId,
    ]);

    return this.getGameById(gameId);
  }
  async getGameHistory(userId) {
    const [rows] = await pool.execute(
      `
    SELECT
      g.id,
      g.winner_id,
			g.status,
			g.created_at,
      u1.username AS player1,
      u2.username AS player2
    FROM games g
    JOIN users u1 ON JSON_EXTRACT(g.user_ids, '$[0]') = u1.id
    JOIN users u2 ON JSON_EXTRACT(g.user_ids, '$[1]') = u2.id
    WHERE JSON_CONTAINS(g.user_ids, JSON_ARRAY(?))
      AND JSON_LENGTH(g.user_ids) = 2
    ORDER BY g.id DESC
    LIMIT 10
    `,
      [userId]
    );

    return rows.map((row) => ({
      p1: row.player1,
      p2: row.player2,
      result:
        row.winner_id === null
          ? row.status
          : row.winner_id === row.player1
          ? `Перемога ${row.player1}`
          : `Перемога ${row.player2}`,
			created_at: row.created_at
    }));
  }
}

export default new GameService();
