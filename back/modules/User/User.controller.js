import { Router } from "express";
import UserService from "./User.service.js";
import { requireAccessToken } from "../../middleware/index.js";

const router = Router();

// профиль текущего пользователя
router.get("/user", requireAccessToken, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.userId);
    return res.json(user);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// профиль по ID
router.get("/user/:id", requireAccessToken, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    return res.json(user);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// профиль по username
router.get("/user/username/:username", requireAccessToken, async (req, res) => {
  try {
    const user = await UserService.getUserByUsername(req.params.username);
    return res.json(user);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// изменить профиль (username, email, avatar, password)
router.patch("/user", requireAccessToken, async (req, res) => {
  try {
    const updated = await UserService.changeSettings(req.userId, req.body);
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});
// топ гравців
router.get("/users/top", async (req, res) => {
  try {
    const players = await UserService.getTopPlayers();
    return res.json(players);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

export default router;
