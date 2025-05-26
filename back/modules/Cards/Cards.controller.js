import { Router } from 'express';
import { pool } from '../../db/connect.js';
import CardsService from './Cards.service.js';
import { requireAccessToken } from '../../middleware/index.js';

const router = Router();

// получить все карточки
router.get('/', requireAccessToken, async (req, res) => {
  try {
    const cards = await CardsService.getAll();
    res.json(cards);
  } catch (err) {
    res.status(err.status||500).json({ message: err.message });
  }
});

// получить карточку по id
router.get('/:id', requireAccessToken, async (req, res) => {
  try {
    const card = await CardsService.getById(req.params.id);
    res.json(card);
  } catch (err) {
    res.status(err.status||500).json({ message: err.message });
  }
});

// создать новую карточку
router.post('/', requireAccessToken, async (req, res) => {
  try {
    const card = await CardsService.create(req.body);
    res.status(201).json(card);
  } catch (err) {
    res.status(err.status||500).json({ message: err.message });
  }
});

// обновить карточку
router.put('/:id', requireAccessToken, async (req, res) => {
  try {
    const card = await CardsService.update(req.params.id, req.body);
    res.json(card);
  } catch (err) {
    res.status(err.status||500).json({ message: err.message });
  }
});

// удалить карточку
router.delete('/:id', requireAccessToken, async (req, res) => {
  try {
    const resp = await CardsService.delete(req.params.id);
    res.json(resp);
  } catch (err) {
    res.status(err.status||500).json({ message: err.message });
  }
});

// крафт карточек за coins
router.post('/craft', requireAccessToken, async (req, res) => {
  try {
    const { ids } = req.body;
    // рассчитываем цену по сумме cost выбранных карт
    const cardsInfo = await Promise.all(ids.map(id => CardsService.getById(id)));
    const price = cardsInfo.reduce((sum, c) => sum + c.cost, 0);

    // получаем баланс и текущие card_ids пользователя
    const [[user]] = await pool.execute(
      'SELECT coins, card_ids FROM users WHERE id = ?',
      [req.userId]
    );
    if (user.coins < price) {
      return res.status(400).json({ message: 'Not enough coins' });
    }

    // списываем монеты
    const newCoins = user.coins - price;
    await pool.execute(
      'UPDATE users SET coins = ? WHERE id = ?',
      [newCoins, req.userId]
    );

    // создаём скрафченную карту
    const newCard = await CardsService.craft(ids);

    // обновляем список card_ids пользователя
    const current = Array.isArray(user.card_ids)
      ? user.card_ids
      : JSON.parse(user.card_ids);
    current.push(newCard.id);
    await pool.execute(
      'UPDATE users SET card_ids = ? WHERE id = ?',
      [JSON.stringify(current), req.userId]
    );

    return res.json({ card: newCard, coins: newCoins, card_ids: current });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// улучшить карточку
router.post('/:id/upgrade', requireAccessToken, async (req, res) => {
  try {
    const upgraded = await CardsService.upgrade(req.params.id);
    res.json(upgraded);
  } catch (err) {
    res.status(err.status||500).json({ message: err.message });
  }
});

export default router;
