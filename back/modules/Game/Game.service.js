import { pool } from '../../db/connect.js';
import { generateGameCode } from '../../utils/index.js';

class GameService {
	async createGame(userId) {
		const code = generateGameCode();
		const [result] = await pool.execute(
			'INSERT INTO games (game_code, host_user_id, user_ids) VALUES (?, ?, ?)',
			[code, userId, JSON.stringify([userId])]
		);
		return this.getGameById(result.insertId);
	}

	async joinGame(userId, gameId) {
		const game = await this.getGameById(gameId);
		if (game.user_ids.includes(userId)) {
			throw { status: 400, message: 'User already in game' };
		}
		const users = [...game.user_ids, userId];
		await pool.execute(
			'UPDATE games SET user_ids = ? WHERE id = ?',
			[JSON.stringify(users), gameId]
		);
		return this.getGameById(gameId);
	}

	async leaveGame(userId, gameId) {
		const game = await this.getGameById(gameId);
		if (!game.user_ids.includes(userId)) {
			throw { status: 400, message: 'User not part of game' };
		}
		const users = game.user_ids.filter((id) => id !== userId);
		await pool.execute(
			'UPDATE games SET user_ids = ? WHERE id = ?',
			[JSON.stringify(users), gameId]
		);
		return this.getGameById(gameId);
	}

	async getGameById(gameId) {
		const [rows] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
		if (!rows.length) {
			throw { status: 404, message: 'Game not found' };
		}
		const row = rows[0];
		// ensure user_ids is an array
		const user_ids = Array.isArray(row.user_ids)
			? row.user_ids
			: JSON.parse(row.user_ids);
		return {
			id: row.id,
			game_code: row.game_code,
			host_user_id: row.host_user_id,
			status: row.status,
			user_ids,
			winner_id: row.winner_id
		};
	}
}

export default new GameService();