import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '../config.js';
import JWTUtils from '../utils/jwt-token.js';

export const requireAccessToken = (req, res, next) => {
  const access = req.cookies?.[ACCESS_TOKEN_NAME];
  try {
    const {userId, username} = JWTUtils.verifyToken(access);
    // Need to add checking for userId and username
    req.userId = userId;
    req.username = username;
    req.accessCookie = access;
    next();
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message });
  }
};

export const requireRefreshToken = (req, res, next) => {
  const refresh = req.cookies?.[REFRESH_TOKEN_NAME];
  try {
    const {userId, username} = JWTUtils.verifyToken(refresh);
    // Need to add checking for userId and username
    req.userId = userId;
    req.username = username;
    req.refreshCookie = refresh;
    next();
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message });
  }
};

export default { requireAccessToken, requireRefreshToken };