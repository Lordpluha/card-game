import { Router } from "express";
import { pool } from "../../db/connect.js";
import CardsService from "./Cards.service.js";
import { requireAccessToken } from "../../middleware/index.js";

const router = Router();

// получить все карточки
router.get("/cards", requireAccessToken, async (req, res) => {
  try {
    const cards = await CardsService.getAll();
    res.json(cards);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// получить все карточки текущего пользователя
router.get("/my-cards", requireAccessToken, async (req, res) => {
  try {
    const cards = await CardsService.getUserCards(req.userId);
    res.json(cards);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// получить карточку по id
router.get("/cards/:id", requireAccessToken, async (req, res) => {
  try {
    const card = await CardsService.getById(req.params.id);
    res.json(card);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// крафт карточек за fragments
router.post("/cards/craft", requireAccessToken, async (req, res) => {
  try {
    const { ids } = req.body;
    const cardsInfo = await Promise.all(
      ids.map((id) => CardsService.getById(id))
    );
    const price = cardsInfo.reduce((sum, c) => sum + c.cost, 0);

    // получаем fragments и current card_ids
    const [[user]] = await pool.execute(
      "SELECT fragments, card_ids FROM users WHERE id = ?",
      [req.userId]
    );
    if (user.fragments < price) {
      return res.status(400).json({ message: "Not enough fragments" });
    }

    // списываем fragments
    const newFragments = user.fragments - price;
    await pool.execute("UPDATE users SET fragments = ? WHERE id = ?", [
      newFragments,
      req.userId,
    ]);

    // создаём скрафченную карту
    const newCard = await CardsService.craft(ids);

    // обновляем card_ids
    const current = Array.isArray(user.card_ids)
      ? user.card_ids
      : JSON.parse(user.card_ids);
    current.push(newCard.id);
    await pool.execute("UPDATE users SET card_ids = ? WHERE id = ?", [
      JSON.stringify(current),
      req.userId,
    ]);

    return res.json({
      card: newCard,
      fragments: newFragments,
      card_ids: current,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// merge двух карточек за монеты
router.post("/cards/merge", requireAccessToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length !== 2) {
      return res.status(400).json({ message: "Provide exactly two card IDs" });
    }

    const newCard = await CardsService.merge(ids, req.userId);

    return res.json({ card: newCard });
  } catch (err) {
    res
      .status(err.status || 500)
      .json({ message: err.message || "Internal Error" });
  }
});

// улучшить карточку
router.post("/cards/:id/upgrade", requireAccessToken, async (req, res) => {
  try {
    const upgraded = await CardsService.upgrade(req.params.id, req.userId);
    res.json(upgraded);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post("/cards/open-pack", requireAccessToken, async (req, res) => {
  try {
    console.log("📩 Body:", req.body);
    console.log("👤 User ID:", req.userId);

    const { type = "common" } = req.body || {};
    console.log("🎴 Requested pack type:", type);

    const newCards = await CardsService.openPack(req.userId, type);

    console.log("✅ Cards returned:", newCards);
    res.json(newCards);
  } catch (err) {
    console.error("❌ Error opening pack:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
});

export default router;
