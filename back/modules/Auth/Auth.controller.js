import { Router } from 'express';
import AuthService from './Auth.service.js';
import { JWTUtils } from '../../utils/index.js';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '../../config.js';
import { requireAccessToken, requireRefreshToken } from '../../middleware/index.js';
import {
  USER_REGISTERED,
  USER_LOGGED_OUT,
  USER_LOGGED_IN,
  TOKEN_REFRESHED,
} from '../../models/errors/auth.errors.js';

const router = Router();

router.post('/auth/register', async (req, res) => {
  try {
    await AuthService.register(req.body);
    return res.status(201).json({ message: USER_REGISTERED });
  } catch (err) {
    res = JWTUtils.clearHttpOnlyCookie(res)
    return res.status(err.status || 400).json({ message: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { access, refresh } = await AuthService.login(req.body);
    res = JWTUtils.generateHttpOnlyCookie(res, access, refresh);
    return res.json({ message: USER_LOGGED_IN });
  } catch (err) {
   res = JWTUtils.clearHttpOnlyCookie(res)
    return res.status(err.status || 401).json({ message: err.message });
  }
});

router.post(
  '/auth/refresh',
  requireRefreshToken,
  async (req, res) => {
    try {
      const oldRefresh = req.cookies?.[REFRESH_TOKEN_NAME]
      const { access, refresh } = await AuthService.refresh(oldRefresh);
      res = JWTUtils.generateHttpOnlyCookie(res, access, refresh);
      return res.json({ message: TOKEN_REFRESHED });
    } catch (err) {
      res = JWTUtils.clearHttpOnlyCookie(res);
      return res.status(err.status || 401).json({ message: err.message });
    }
  }
);

router.post(
  '/auth/logout',
  requireAccessToken,
  async (req, res) => {
    try {
      const access = req.cookies[ACCESS_TOKEN_NAME]
      await AuthService.logout(access);
      res = JWTUtils.clearHttpOnlyCookie(res);
      return res.json({ message: USER_LOGGED_OUT });
    } catch (err) {
      res = JWTUtils.clearHttpOnlyCookie(res);
      return res.status(500).json({ message: err.message });
    }
  }
);

export default router;