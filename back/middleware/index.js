import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '../config.js';
import JWTUtils from '../utils/jwt-token.js';
import { pool } from '../db/connect.js';

export const requireAccessToken = async (req, res, next) => {
  const access = req.cookies?.[ACCESS_TOKEN_NAME];
  try {
    const { userId, username } = JWTUtils.verifyToken(access);
    // DB-check
    const [rows] = await pool.execute(
      "SELECT token FROM jwt_tokens WHERE token = ? AND type = 'access'",
      [access]
    );
    if (!rows.length) throw { status: 401, message: 'Access token revoked' };

    req.userId = userId;
    req.username = username;
    req.accessCookie = access;
    next();
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message });
  }
};

export const requireRefreshToken = async (req, res, next) => {
  const refresh = req.cookies?.[REFRESH_TOKEN_NAME];
  try {
    const { userId, username } = JWTUtils.verifyToken(refresh);
    // DB-check
    const [rows] = await pool.execute(
      "SELECT token FROM jwt_tokens WHERE token = ? AND type = 'refresh'",
      [refresh]
    );
    if (!rows.length) throw { status: 401, message: 'Refresh token revoked' };

    req.userId = userId;
    req.username = username;
    req.refreshCookie = refresh;
    next();
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message });
  }
};

export default { requireAccessToken, requireRefreshToken };