import pool from "../../db/connect.js";
import { PasswordUtils, JWTUtils } from "../../utils/index.js";
import {
  USER_REGISTERED,
  INVALID_USERNAME_OR_PASSWORD,
  REFRESH_TOKEN_MISSING,
} from "../../models/errors/auth.errors.js";

class AuthService {
  async register({ username, password }) {
    const [exists] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (exists.length) {
      const err = new Error(USER_REGISTERED);
      err.status = 409;
      throw err;
    }
    const hash = await PasswordUtils.hashPassword(password);
    await pool.execute(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, hash]
    );
  }

  async login({ username, password }) {
    const [rows] = await pool.execute(
      "SELECT id, password_hash FROM users WHERE username = ?",
      [username]
    );
    if (!rows.length) {
      const err = new Error(INVALID_USERNAME_OR_PASSWORD);
      err.status = 401;
      throw err;
    }
    const user = rows[0];
    try {
      await PasswordUtils.comparePasswords(password, user.password_hash);
    } catch (e) {
      const err = new Error(INVALID_USERNAME_OR_PASSWORD);
      err.status = 401;
      throw err;
    }
    const access = JWTUtils.generateAccessToken(user.id, username);
    const refresh = JWTUtils.generateRefreshToken(user.id, username);

    return { access, refresh };
  }

  async logout(access) {

  }

  async refresh(oldRefresh) {
    if (!oldRefresh) {
      const err = new Error(REFRESH_TOKEN_MISSING);
      err.status = 401;
      throw err;
    }

    const { userId, username } = JWTUtils.verifyToken(oldRefresh);
    const access = JWTUtils.generateAccessToken(userId, username);
    const refresh = JWTUtils.generateRefreshToken(userId, username);
    return { access, refresh };
  }
}

export default new AuthService();
