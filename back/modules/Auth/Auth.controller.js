import { Router } from 'express';
import AuthService from './Auth.service.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const data = await AuthService.register(req.body);
    return res.status(201).json(data);
  } catch (err) {
    return res.status(err.status || 400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = await AuthService.login(req.body);
    return res.json(data);
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const data = await AuthService.refresh(req.body);
    return res.json(data);
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const data = await AuthService.logout();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;