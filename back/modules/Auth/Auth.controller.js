import { Router } from 'express';
import AuthService from './Auth.service.js';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '../../config.js';
import AuthConfig from './Auth.config.js';
import { JWTUtils } from '../../utils/index.js';
import {
  USER_REGISTERED,
  USER_LOGGED_OUT,
  USER_LOGGED_IN,
  TOKEN_REFRESHED,
  INVALID_USERNAME_OR_PASSWORD
} from '../../models/errors/auth.errors.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    await AuthService.register(req.body);
    return res.status(201).json({ message: USER_REGISTERED });
  } catch (err) {
    return res.status(err.status || 400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { access, refresh } = await AuthService.login(req.body);
    res = JWTUtils.generateHttpOnlyCookie(res, access, refresh);
    return res.json({ message: USER_LOGGED_IN });
  } catch (err) {
   res = JWTUtils.clearHttpOnlyCookie(res)
    return res.status(err.status || 401).json({ message: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { access, refresh } = await AuthService.refresh(req.body);
    res = JWTUtils.generateHttpOnlyCookie(res, access, refresh);
    return res.json({ message: TOKEN_REFRESHED });
  } catch (err) {
		res = JWTUtils.clearHttpOnlyCookie(res)
    return res.status(err.status || 401).json({ message: err.message });
  }
});

router.post('/logout', async (_req, res) => {
  try {
    return res.json({ message: USER_LOGGED_OUT });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;