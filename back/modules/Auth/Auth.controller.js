import { Router } from 'express';
import AuthService from './Auth.service.js';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '../../config.js';

const router = Router();
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
};

router.post('/register', async (req, res) => {
  try {
    await AuthService.register(req.body);
    return res.status(201).json({ message: 'User registered' });
  } catch (err) {
    return res.status(err.status || 400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { access, refresh } = await AuthService.login(req.body);
    res
      .cookie(ACCESS_TOKEN_NAME, access, { ...cookieOpts, maxAge: 24*60*60*1000 })
      .cookie(REFRESH_TOKEN_NAME, refresh, { ...cookieOpts, maxAge: 7*24*60*60*1000 });
    return res.json({ message: 'Logged in' });
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { access, refresh } = await AuthService.refresh(req.body);
    res
      .cookie(ACCESS_TOKEN_NAME, access, { ...cookieOpts, maxAge: 24*60*60*1000 })
      .cookie(REFRESH_TOKEN_NAME, refresh, { ...cookieOpts, maxAge: 7*24*60*60*1000 });
    return res.json({ message: 'Tokens refreshed' });
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message });
  }
});

router.post('/logout', async (_req, res) => {
  try {
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;