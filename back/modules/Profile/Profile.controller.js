import { Router } from 'express';
import ProfileService from './Profile.service.js';
import { ACCESS_TOKEN_NAME } from '../../config.js';
import { JWTUtils } from '../../utils/index.js';
import { requireAccessToken } from '../../middleware/index.js';

const router = Router();

router.patch(
  '/profile',
  requireAccessToken,
  async (req, res) => {
    try {
      const userProfile = await ProfileService.getProfileById(req.userId);
      return res.json(userProfile);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
);

router.patch(
  '/profile',
  requireAccessToken,
  async (req, res) => {
    try {
      const settings = req.body
      const resp = await ProfileService.changeSettings(req.userId, settings);
      return res.json(resp);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
);

export default router;