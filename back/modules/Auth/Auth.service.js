import pool from '../../db/connect.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  JWT_SECRET, ACCESS_TOKEN_LIFETIME,
   REFRESH_TOKEN_LIFETIME
} from '../../config.js';

class AuthService {
  async register({ username, password }) {
    const [exists] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (exists.length) {
      const err = new Error('Username already exists');
      err.status = 409;
      throw err;
    }
    const hash = await bcrypt.hash(password, 10);
    const [res] = await pool.execute(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hash]
    );
  };

  async login({ username, password }) {
    const [rows] = await pool.execute(
      'SELECT id, password_hash FROM users WHERE username = ?',
      [username]
    );
    if (!rows.length) {
      const err = new Error('Invalid username or password');
      err.status = 401;
      throw err;
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const err = new Error('Invalid username or password');
      err.status = 401;
      throw err;
    }
    const token = jwt.sign(
      { userId: user.id, username },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_LIFETIME }
    );
    const refresh = jwt.sign(
      { userId: user.id, username },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_LIFETIME }
    );
    return { access: token, refresh };
  };

  async logout() {
    return { message: 'Logged out successfully' };
  };

  async refresh({ refresh: refreshToken }) {
    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
      const e = new Error('Invalid refresh token');
      e.status = 401;
      throw e;
    }
    const { userId, username } = payload;
    const access = jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: ACCESS_LIFETIME }
    );
    const refresh = jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_LIFETIME }
    );
    return { access, refresh };
  }
}

export default new AuthService();