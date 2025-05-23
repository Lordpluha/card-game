import { Router } from "express";
import GameService from "./Game.service.js";
import { requireAccessToken } from "../../middleware/index.js";
import WebSocket from "ws";
import { wss } from "../../index.js";

const router = Router();

const broadcast = (gameId, payload) => {
  const msg = JSON.stringify(payload);
  let count = 0;

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.gameId === String(gameId)
    ) {
      client.send(msg);
      count++;
    }
  });

  console.log(`📢 Broadcasted to ${count} clients for game ${gameId}`);
};

router.post("/game/create", requireAccessToken, async (req, res) => {
  try {
    const game = await GameService.createGame(req.userId);
    broadcast(game.id, { event: "gameCreated", game });
    return res.json(game);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// router.put("/game/:id/join", requireAccessToken, async (req, res) => {
//   try {
//     const gameId = req.params.id;
//     const game = await GameService.joinGame(req.userId, gameId);
//     broadcast(game.id, { event: "playerJoined", game });
//     return res.json(game);
//   } catch (err) {
//     return res.status(err.status || 500).json({ message: err.message });
//   }
// });

router.put("/game/:id/join", requireAccessToken, async (req, res) => {
  try {
    const gameId = req.params.id;

    const game = await GameService.joinGame(req.userId, gameId);
    broadcast(game.id, { event: "playerJoined", game });
    return res.json(game);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/game/:id", requireAccessToken, async (req, res) => {
  try {
    const gameId = req.params.id;
    const game = await GameService.getGameById(gameId);
    return res.json(game);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/game/by-code/:code", requireAccessToken, async (req, res) => {
  try {
    const game = await GameService.getGameByCode(req.params.code);
    return res.json(game);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

export default router;
