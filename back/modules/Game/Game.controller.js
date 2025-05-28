import { Router } from "express";
import GameService from "./Game.service.js";
import { requireAccessToken } from "../../middleware/index.js";

const router = Router();

router.get("/games", requireAccessToken, async (req, res) => {
  try {
    const games = await GameService.getGamesByUser(req.userId);
    return res.json(games);
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

router.put("/game/:id/join", requireAccessToken, async (req, res) => {
  try {
    const gameId = req.params.id;
    const userId = req.userId;

    const game = await GameService.joinGame(userId, gameId);
    res.json(game);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get("/history", requireAccessToken, async (req, res) => {
  try {
    const history = await GameService.getGameHistory(req.userId);
    res.json(history);
  } catch (err) {
    console.error("❌ Історія не завантажена:", err);
    res.status(500).json({ message: "Помилка при отриманні історії матчів" });
  }
});

router.post("/create", requireAccessToken, async (req, res) => {
  try {
    console.log("🎯 Creating game for user:", req.userId);

    const game = await GameService.createGame(req.userId);

    if (!game) {
      console.error("❌ GameService.createGame returned null/undefined");
      return res.status(500).json({ message: "Game not returned" });
    }

    console.log("📤 Returning created game:", JSON.stringify(game, null, 2));
    res.json(game);
  } catch (err) {
    console.error("🔥 Error in POST /create:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Internal error" });
  }
});

router.get("/by-code/:code", requireAccessToken, async (req, res) => {
  try {
    const game = await GameService.getGameByCode(req.params.code);
    res.json(game);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

export default router;
