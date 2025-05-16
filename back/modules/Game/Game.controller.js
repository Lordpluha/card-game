import { Router } from 'express';
import GameService from './Game.service.js';
import { requireAccessToken } from '../../middleware/index.js';

const router = Router();

router.post(
  '/game/create',
  requireAccessToken,
  async (req, res) => {
    try {
      const game = await GameService.createGame(req.userId);
      return res.json(game);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
);

router.put(
  '/game/:id/join',
  requireAccessToken,
  async (req, res) => {
    try {
      const gameId = req.params.id;
      const game = await GameService.joinGame(req.userId, gameId);
      return res.json(game);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
);

router.get(
  '/game/:id',
  requireAccessToken,
  async (req, res) => {
    try {
      const gameId = req.params.id;
      const game = await GameService.getGameById(gameId);
      return res.json(game);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
);


export default router;