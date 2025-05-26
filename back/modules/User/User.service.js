import { pool } from "../../db/connect.js";

class UserService {
	// получить профиль по ID
	async getUserById(userId) {
		const [rows] = await pool.execute(
			"SELECT id, username, email, avatar_url, created_at, last_game_date FROM users WHERE id = ?",
			[userId]
		);
		if (!rows.length) throw { status: 404, message: "User not found" };
		return rows[0];
	}

	// получить профиль по username
	async getUserByUsername(username) {
		const [rows] = await pool.execute(
			"SELECT id, username, email, avatar_url, created_at, last_game_date FROM users WHERE username = ?",
			[username]
		);
		if (!rows.length) throw { status: 404, message: "User not found" };
		return rows[0];
	}

	// изменение настроек профиля
	async changeSettings(userId, settings) {
		const fields = [];
		const values = [];
		if (settings.username) {
			fields.push("username = ?");
			values.push(settings.username);
		}
		if (settings.email) {
			fields.push("email = ?");
			values.push(settings.email);
		}
		if (settings.avatar_url) {
			fields.push("avatar_url = ?");
			values.push(settings.avatar_url);
		}
		if (settings.password) {
			const hash = await PasswordUtils.hashPassword(settings.password);
			fields.push("password_hash = ?");
			values.push(hash);
		}
		if (!fields.length) throw { status: 400, message: "No settings provided" };
		values.push(userId);
		const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
		await pool.execute(sql, values);
		return this.getUserById(userId);
	}
}

export default new UserService();