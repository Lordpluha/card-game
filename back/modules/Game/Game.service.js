import { pool } from "../../db/connect.js";
import { generateGameCode } from "../../utils/index.js";
import CardsService from "../Cards/Cards.service.js";
import UserService from "../User/User.service.js";

class GameService {
	async getGameById(gameId) {
		const [[game]] = await pool.execute("SELECT * FROM games WHERE id = ?", [
			gameId,
		]);

		if (!game) {
			throw { status: 404, message: "Game not found" };
		}

		// Parse JSON fields from the database if they are strings
		const user_ids =
			typeof game.user_ids === "string"
				? JSON.parse(game.user_ids)
				: game.user_ids;
		const game_state =
			typeof game.game_state === "string"
				? JSON.parse(game.game_state)
				: game.game_state;

		return {
			...game,
			user_ids,
			game_state,
		};
	}
	async getGameByCode(gameCode) {
		const [[game]] = await pool.execute("SELECT * FROM games WHERE game_code = ?", [
			gameCode,
		]);

		if (!game) {
			throw { status: 404, message: "Game not found" };
		}

		// Parse JSON fields from the database if they are strings
		const user_ids =
			typeof game.user_ids === "string"
				? JSON.parse(game.user_ids)
				: game.user_ids;
		const game_state =
			typeof game.game_state === "string"
				? JSON.parse(game.game_state)
				: game.game_state;

		return {
			...game,
			user_ids,
			game_state,
		};
	}
  async create(userId) {
		const user = await UserService.getById(userId);

    const initialState = {
			// Для отображения игроков на фронте
      players: {
        [userId]: {
          username: user.username,
          avatar_url: user.avatar_url,
        },
      },
			// Для отображения на фронте и логики игры
      health: {},
			// Оставшиеся карты у игроков
      decks: {},
			// Карты в поле "выброса"
			selected: {},
    };

    try {
      const [game] = await pool.execute(
        "INSERT INTO games (game_code, host_user_id, user_ids, game_state) VALUES (?, ?, ?, ?)",
        [generateGameCode(), userId, JSON.stringify([userId]), JSON.stringify(initialState)]
      );
      return this.getGameById(game.insertId);
    } catch (e) {
      throw e;
    }
  }
  async joinGame(userId, gameId) {
    const game = await this.getGameById(gameId);

		// Если пользователь уже в игре, возвращаем её
    if (game.user_ids.includes(userId)) {
      return this.getGameById(gameId);
    }

		// Если в игре уже 2 игрока, не даём присоединиться
		if (game.user_ids.length === 2) {
			throw { status: 400, message: "Game is full" };
		}

		if (game.status === "IN_PROGRESS") {
			throw { status: 400, message: "Game already started" };
		} else if (game.status === "ENDED") {
			throw { status: 400, message: "Game already ended" };
		}

		// Добавляем пользователя в игру
    const new_user_ids = [...game.user_ids, userId];
    const [[user]] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    const new_game_state = {
			...game.game_state,
			players: {
				...game.game_state.players,
				[userId]: {
					username: user.username,
					avatar_url: user.avatar_url,
				},
			},
		};
    await pool.execute(
      "UPDATE games SET user_ids = ?, game_state = ? WHERE id = ?",
      [JSON.stringify(new_user_ids), JSON.stringify(new_game_state), gameId]
    );

    return this.getGameById(gameId);
  }
	async deleteGameById(gameId) {
		const game = await this.getGameById(gameId);
		if (game.status !== "CREATED") {
			throw { status: 400, message: "Cannot delete game" };
		}
		await pool.execute("DELETE FROM games WHERE id = ?", [gameId]);
		return null;
	}
  async leaveGame(userId, gameId) {
    const game = await this.getGameById(gameId);

    if (!game.user_ids.includes(userId)) {
      throw { status: 400, message: "User not part of game" };
    }

		// Удаляем пользователя из user_ids и game_state.players
    const new_user_ids = game.user_ids.filter((id) => id !== userId);
		const new_game_state = {
			...game.game_state,
			players: Object.fromEntries(
				Object.entries(game.game_state.players).filter(
					([id]) => id !== userId
				)
			),
		};

		// Если остался только хост, удаляем игру
		if (new_user_ids.length === 0) {
			await this.deleteGameById(gameId);
			return null;
		}

		// Если остались игроки, меняем хоста
		await pool.execute(
			"UPDATE games SET user_ids = ?, game_state = ?, host_user_id = ? WHERE id = ?",
			[JSON.stringify(new_user_ids), JSON.stringify(new_game_state), new_user_ids[0], gameId]
		);

		return null;
  }
  async selectDeck(userId, gameId, card_ids) {
    const game = await this.getGameById(gameId);

    // Проверяем, что игра создана и пользователь в ней
    if (game.status !== "CREATED") {
      throw { status: 400, message: "You cannot select deck for this game" };
    }
    if (!game.user_ids.includes(userId)) {
      throw { status: 403, message: "You are not in this game" };
    }

    // Проверяем, что пользователь владеет карточками
    const [[user]] = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );
    if (!card_ids.every((id) => user.card_ids.includes(id))) {
      throw { status: 400, message: "Invalid card selection" };
    }

    // Добавляем карточки в колоду пользователя
    const new_game_state = {
      ...game.game_state,
      decks: { ...game.game_state.decks, [userId]: card_ids },
    };
    await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
      JSON.stringify(new_game_state),
      gameId,
    ]);
    return this.getGameById(gameId);
  }
  async startGame(userId, gameId) {
    const game = await this.getGameById(gameId);

    if (game.status !== "CREATED") {
      throw { status: 400, message: "Game couldn't be started" };
    }

    if (game.host_user_id !== userId) {
      throw { status: 403, message: "Only host can start" };
    }

    const decks_entries = await Promise.all(
      Object.entries(game.game_state.decks).map(async ([user_id, cardIds]) => {
        const cards = await Promise.all(cardIds.map(async (cardId) => ({ ...await CardsService.getById(cardId) })));
        return [user_id, cards];
      })
    );

    const new_game_state = {
      ...game.game_state,
      decks: Object.fromEntries(decks_entries),
      health: Object.fromEntries(game.user_ids.map((id) => [id, 50]))
    };

		await pool.execute(
      "UPDATE games SET status = ?, game_state = ? WHERE id = ?",
      ["IN_PROGRESS", JSON.stringify(new_game_state), gameId]
    );

    return this.getGameById(gameId);
  }
  async playCard(userId, gameId, cardId) {
    const game = await this.getGameById(gameId);
		const user = await UserService.getById(userId)

    if (game.status === "CREATED") {
      throw { status: 400, message: "Game is not started" };
    } else if (game.status === "ENDED") {
      throw { status: 400, message: "Game already ended" };
    }
		let selected_card;
		try {
			selected_card = await CardsService.getById(cardId);

			if (!user.card_ids.includes(cardId)) {
				throw { status: 400, message: "Card not owned by user" };
			}
		} catch (e) {
			// Для merged-карт, которые не хранятся в базе
			selected_card = game.game_state.decks[userId]?.find(card => card.id === cardId);
		}

		if (!game.game_state.decks[userId]?.find(deckCard => deckCard.id === cardId)) {
			throw { status: 400, message: "Card not in user's deck" };
		}

		// Обработка использования карты
		const new_game_state = {
			...game.game_state,
			// Удаляем карту из колоды игрока
			decks: Object.fromEntries(Object.entries(game.game_state.decks)
				.map(([user_id, user_current_cards]) => [user_id, user_current_cards.filter((c) => c.id !== cardId)])),
			// Добавляем карту в selected для отображения на фронте и логики боя
			selected: {
				...game.game_state.selected,
				[userId]: selected_card,
			}
		};
		await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
			JSON.stringify(new_game_state),
			gameId,
		]);

    return this.getGameById(gameId);
  }
  async endRound(gameId) {
    const game = await this.getGameById(gameId);

    if (game.status !== "IN_PROGRESS") throw { status: 400, message: "Game not in progress" };

    // Логика боя между картами
    const [user1, user2] = game.user_ids;
    const card1 = game.game_state.selected[user1];
    const card2 = game.game_state.selected[user2];
    if (!card1 || !card2) throw { status: 400, message: "Both players must select a card" };
    const health = {
			...game.game_state.health
		};

    // Пример простой логики боя
    if (card1.attack > card2.defense) {
    	health[user2] -= Math.max(0, card1.attack - card2.defense);
    }
		if (card2.attack > card1.defense) {
    	health[user1] -= Math.max(0, card2.attack - card1.defense);
    }

		// Удаляем выбранные карты из selected
		const new_game_state = {
			...game.game_state,
			selected: {},
			health,
		};
		await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
			JSON.stringify(new_game_state),
			gameId,
		]);

    return this.getGameById(gameId);
  }
  async finishGame(gameId) {
    const game = await this.getGameById(gameId);

		if (game.status !== "IN_PROGRESS") {
			throw { status: 400, message: "Game not in progress" };
		}

		// По умолчанию - ничья
		let winner_id = null;

		// Проверяем есть ли у кого-то здоровье <= 0
		const looser_id = game.user_ids.find(
			(id) => game.game_state.health[id] <= 0
		);

		if (looser_id) {
			winner_id = game.user_ids.find((id) => id !== looser_id);
		}

		// Если есть победитель, то обновляем рейтинг игроков
		if (winner_id !== null) {
			const winner = await UserService.getById(winner_id);
			const looser = await UserService.getById(looser_id);
			console.log("Winner:", winner, "Looser:", looser);
			console.log("Winner rating:", winner.rating, "Looser rating:", looser.rating);

			const winnerWithRating = await UserService.updateRating(winner_id, +(winner.rating) + 10);
			const looserWithRating = await UserService.updateRating(looser_id, Math.max(0, +(looser.rating) - 15));
		}

		// Завершаем игру
    await pool.execute(
      "UPDATE games SET status = ?, winner_id = ? WHERE id = ?",
      ["ENDED", winner_id, gameId]
    );

		console.log("Game finished:", gameId, "Winner:", winner_id);

		const newWinner = await UserService.winnerReward(winner_id, 15, 2);

		return this.getGameById(gameId);
  }
  async surrenderUser(userId, gameId) {
    const game = await this.getGameById(gameId);

		if (game.user_ids.length < 2) {
			throw { status: 400, message: "No opponent to surrender to" };
		}
    if (!game.user_ids.includes(userId)) {
      throw { status: 403, message: "Not in this game" };
    }

    const winner_id = game.user_ids.find((id) => id !== userId);

    await pool.execute(
      "UPDATE games SET status = ?, winner_id = ? WHERE id = ?",
      ["ENDED", winner_id, gameId]
    );

    return this.getGameById(gameId);
  }
  async mergeCards(userId, gameId, cardIds) {
		const game = await this.getGameById(gameId);
		const user = await UserService.getById(userId);

		// Игра должна быть в процессе
		if (game.status !== "IN_PROGRESS") {
			throw { status: 400, message: "Game not in progress" };
		}
		// Проверяем, что пользователь в игре
		if (!game.user_ids.includes(userId)) {
			throw { status: 403, message: "You are not in this game" };
		}
		// Проверяем, что карты принадлежат пользователю
		if (!cardIds.every((id) => user.card_ids.includes(+id))) {
			throw { status: 400, message: "You do not own these cards" };
		}
		// Проверяем, что карты в колоде пользователя
		if (!cardIds.every(id => !!game.game_state.decks[userId]?.find(card => card.id === +id))) {
			throw { status: 400, message: "Cards not in user's deck" };
		}

    const new_game_state = JSON.parse(JSON.stringify(game.game_state));

		new_game_state.decks[userId] = new_game_state.decks[userId].filter(
			(card) => card.id !== +cardIds[0] && card.id !== +cardIds[1]
		)

    const card1 = await CardsService.getById(cardIds[0]);
    const card2 = await CardsService.getById(cardIds[1]);

    // Крафтим новую карту
    const calc = (key) => Math.max(0, Math.floor((card1[key] + card2[key]) / 1.1) - 1);
		const card1_points = (card1.attack + card1.defense) / card1.cost;
		const card2_points = (card2.attack + card2.defense) / card2.cost;
		const rare_order = ['COMMON','RARE','EPIC','MYTHICAL','LEGENDARY'];
    const newCard = {
			id: +(Math.random()* 1000000).toFixed(0),
			name: card1_points > card2_points ? card1.name : card2.name,
			image_url: card1_points > card2_points ? card1.image_url : card2.image_url,
      attack: calc("attack"),
      defense: calc("defense"),
      cost: calc("cost"),
			type: rare_order.indexOf(card1.rare) > rare_order.indexOf(card2.rare) ? card1.type : card2.type,
			categories: [...new Set([...card1.categories, ...card2.categories])],
			description: card1_points > card2_points ? card1.description : card2.description,
    };

		new_game_state.decks[userId].push(newCard)

		console.log("New game state:", new_game_state);

    await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
      JSON.stringify(new_game_state),
      gameId,
    ]);

    return this.getGameById(gameId);
  }
  async getGameHistory(userId) {
    const [games] = await pool.execute(
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

    return games.map((game) => ({
      p1: game.player1,
      p2: game.player2,
      result:
        game.winner_id === null
          ? game.status
          : game.winner_id === game.player1
          ? `Перемога ${game.player1}`
          : `Перемога ${game.player2}`,
      created_at: game.created_at,
    }));
  }
}

export default new GameService();
