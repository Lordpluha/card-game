import { pool } from "../../db/connect.js";
import { PasswordUtils, JWTUtils } from "../../utils/index.js";
import cards from "../../utils/cards.js";
import {
  USER_REGISTERED,
  INVALID_USERNAME_OR_PASSWORD,
  REFRESH_TOKEN_MISSING,
} from "../../models/errors/auth.errors.js";

class AuthService {
  async register({ username, password, email }) {
    const [exists] = await pool.execute(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (exists.length) {
      const err = new Error(USER_REGISTERED);
      err.status = 409;
      throw err;
    }
    const hash = await PasswordUtils.hashPassword(password);
		const initial = cards.slice(0, 9).map(c => c.id);
		// Add first 9 cards to user
		const [result] = await pool.execute(
			"INSERT INTO users (username, email, password_hash, card_ids) VALUES (?, ?, ?, ?)",
			[username, email, hash, JSON.stringify(initial)]
		);
  }

  async login({ login, password }) {
    const [rows] = await pool.execute(
      "SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?",
      [login, login]
    );
    if (!rows.length) {
      const err = new Error(INVALID_USERNAME_OR_PASSWORD);
      err.status = 401;
      throw err;
    }
    const user = rows[0];
    try {
      await PasswordUtils.comparePasswords(password, user.password_hash);
    } catch {
      const err = new Error(INVALID_USERNAME_OR_PASSWORD);
      err.status = 401;
      throw err;
    }

    // проверка на существующую сессию
    const [active] = await pool.execute(
      "SELECT token FROM jwt_tokens WHERE user_id = ?",
      [user.id]
    );
    if (active.length) {
      const err = new Error("Active session exists. Log out on other device first.");
      err.status = 403;
      throw err;
    }

    const access = JWTUtils.generateAccessToken(user.id, user.username);
    const refresh = JWTUtils.generateRefreshToken(user.id, user.username);

    // persist tokens
    await pool.execute(
      "INSERT INTO jwt_tokens (token, user_id, type) VALUES (?, ?, 'access')",
      [access, user.id]
    );
    await pool.execute(
      "INSERT INTO jwt_tokens (token, user_id, type) VALUES (?, ?, 'refresh')",
      [refresh, user.id]
    );

    return { access, refresh };
  }

  async logout(access) {
    // decode userId and delete all tokens for него
    const { userId } = JWTUtils.verifyToken(access);
    await pool.execute(
      "DELETE FROM jwt_tokens WHERE user_id = ?",
      [userId]
    );
  }

  async refresh(oldRefresh) {
    if (!oldRefresh) {
      const err = new Error(REFRESH_TOKEN_MISSING);
      err.status = 401;
      throw err;
    }
    // check stored
    const [found] = await pool.execute(
      "SELECT token FROM jwt_tokens WHERE token = ? AND type = 'refresh'",
      [oldRefresh]
    );
    if (!found.length) {
      const err = new Error();
      err.status = 401;
      throw err;
    }
    // remove old
    await pool.execute(
      "DELETE FROM jwt_tokens WHERE token = ?",
      [oldRefresh]
    );

    const { userId, username } = JWTUtils.verifyToken(oldRefresh);
    const access = JWTUtils.generateAccessToken(userId, username);
    const refresh = JWTUtils.generateRefreshToken(userId, username);

    // persist new
    await pool.execute(
      "INSERT INTO jwt_tokens (token, user_id, type) VALUES (?, ?, 'access')",
      [access, userId]
    );
    await pool.execute(
      "INSERT INTO jwt_tokens (token, user_id, type) VALUES (?, ?, 'refresh')",
      [refresh, userId]
    );

    return {
      access,
      refresh
    };
  }
}

export default new AuthService();
