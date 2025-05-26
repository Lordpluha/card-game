import { Router } from 'express';
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

// крафт карточек
router.post('/craft', requireAccessToken, async (req, res) => {
  try {
    const { ids } = req.body;
    const crafted = await CardsService.craft(ids);
    res.json(crafted);
  } catch (err) {
    res.status(err.status||500).json({ message: err.message });
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
