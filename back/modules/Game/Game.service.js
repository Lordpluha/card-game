import { pool } from "../../db/connect.js";
import { generateGameCode } from "../../utils/index.js";
import cards from "../../utils/cards.js";

class GameService {
  async createGame(userId) {
    const code = generateGameCode();
    const initialState = {
      health: { [userId]: 20 },
      hands: { [userId]: [] },
      battlefield: { [userId]: [] },
      currentTurn: null,
    };
    const [result] = await pool.execute(
      // changed to include game_state
      "INSERT INTO games (game_code, host_user_id, user_ids, game_state) VALUES (?, ?, ?, ?)",
      [code, userId, JSON.stringify([userId]), JSON.stringify(initialState)]
    );
    return this.getGameById(result.insertId);
  }

  async joinGame(userId, gameId) {
    const game = await this.getGameById(gameId);
    if (game.user_ids.includes(userId)) {
      throw { status: 400, message: "User already in game" };
    }
    const users = [...game.user_ids, userId];
    await pool.execute("UPDATE games SET user_ids = ? WHERE id = ?", [
      JSON.stringify(users),
      gameId,
    ]);
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
      health: Object.fromEntries(
        game.user_ids.map((id) => [id, 20])
      ),
      currentTurn: game.user_ids[Math.floor(Math.random() * game.user_ids.length)],
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
    }

    // сохраняем новое состояние игры
    await pool.execute(
      "UPDATE games SET game_state = ? WHERE id = ?",
      [JSON.stringify(state), gameId]
    );
    return this.getGameById(gameId);
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
    await pool.execute(
      "UPDATE games SET game_state = ? WHERE id = ?",
      [JSON.stringify(newState), gameId]
    );
    return this.getGameById(gameId);
  }

  async finishGame(userId, gameId) {
    const game = await this.getGameById(gameId);
    // только участник (или хост) может завершить игру
    if (!game.user_ids.includes(userId) && game.host_user_id !== userId) {
      throw { status: 403, message: 'No rights to finish game' };
    }
    await pool.execute(
      'UPDATE games SET status = ?, winner_id = ? WHERE id = ?',
      ['ENDED', userId, gameId]
    );
    return this.getGameById(gameId);
  }

  async surrenderGame(userId, gameId) {
    const game = await this.getGameById(gameId);
    if (!game.user_ids.includes(userId)) {
      throw { status: 403, message: 'Not in this game' };
    }
    const opponents = game.user_ids.filter(id => id !== userId);
    if (!opponents.length) {
      throw { status: 400, message: 'No opponent to surrender to' };
    }
    const winner = opponents[0];
    await pool.execute(
      'UPDATE games SET status = ?, winner_id = ? WHERE id = ?',
      ['ENDED', winner, gameId]
    );
    return this.getGameById(gameId);
  }
}

export default new GameService();
