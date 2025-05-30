import { pool } from "../../db/connect.js";
import PasswordUtils from "../../utils/password.js";

class UserService {
  // получить профиль по ID
  async getById(userId) {
    const [row] = await pool.execute(
      "SELECT id, username, email, avatar_url, created_at, last_game_date, card_ids, rating, fragments, coins FROM users WHERE id = ?",
      [userId]
    );
		const user = row[0];
    if (!user) throw { status: 404, message: "User not found" };
    return user;
  }

	async updateRating(userId, rating) {
		const [result] = await pool.execute(
			"UPDATE users SET rating = ? WHERE id = ?",
			[+rating, userId]
		);
		console.log(result[0])
		return await this.getById(userId);
	}

	async winnerReward(userId, coins, fragments) {
		const [result] = await pool.execute(
			"UPDATE users SET coins = coins + ?, fragments = fragments + ? WHERE id = ?",
			[coins, fragments, userId]
		);
		return await this.getById(userId);
	}

  // получить профиль по username
  async getByUsername(username) {
    const [rows] = await pool.execute(
      "SELECT id, username, email, avatar_url, created_at, last_game_date, card_ids, coins FROM users WHERE username = ?",
      [username]
    );
    if (!rows.length) throw { status: 404, message: "User not found" };
    const user = rows[0];
    user.card_ids = JSON.parse(user.card_ids);
    return user;
  }

  // изменение настроек профиля
  async patchSettings(userId, settings) {
    const fields = [];
    const values = [];

    if (settings.newPassword && settings.currentPassword) {
      // Получаем текущий хеш пароля пользователя
      const [userRows] = await pool.execute(
        "SELECT password_hash FROM users WHERE id = ?",
        [userId]
      );

      if (!userRows.length) {
        throw { status: 404, message: "User not found" };
      }

      // Проверяем текущий пароль
      try {
        await PasswordUtils.comparePasswords(settings.currentPassword, userRows[0].password_hash);
      } catch (error) {
        throw { status: 400, message: "Невірний поточний пароль" };
      }

      // Хешируем новый пароль
      const hash = await PasswordUtils.hashPassword(settings.newPassword);
      fields.push("password_hash = ?");
      values.push(hash);
    }

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

    if (!fields.length) throw { status: 400, message: "No settings provided" };
    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    await pool.execute(sql, values);
    return this.getById(userId);
  }

  async getTopPlayers() {
    const [topUsers] = await pool.execute(`
			SELECT id, username, rating FROM users
			ORDER BY rating DESC
		`);

    return topUsers.map((user) => ({
      id: user.id,
      username: user.username,
			avatar_url: user.avatar_url,
			created_at: user.created_at,
			last_game_date: user.last_game_date,
			rating: user.rating,
    }));
  }
}

export default new UserService();
