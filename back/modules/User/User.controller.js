import { Router } from 'express';
import UserService from './User.service.js';
import { requireAccessToken } from '../../middleware/index.js';

const router = Router();

router.get(
  '/user/:id',
  requireAccessToken,
  async (req, res) => {
    try {
      const userId = req.params.id
      const resp = await UserService.getUserById(userId);
      return res.json(resp);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
);

router.get(
  '/user',
  requireAccessToken,
  async (req, res) => {
    try {
      const user = await UserService.getUserById(req.userId);
      return res.json(user);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
);

export default router;