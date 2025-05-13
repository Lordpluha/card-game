import fs from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pool from './connect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

async function init() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const initSQl = await fs.readFile(join(__dirname, 'queries/init.sql'), 'utf-8');
    await conn.query(initSQl);

    /* ---------- USERS ---------- */
    const usersSql = await fs.readFile(join(__dirname, 'queries/create-users-table.sql'), 'utf-8');
    await conn.query(usersSql);

    /* ---------- GAMES ---------- */
    const gamesSql = await fs.readFile(join(__dirname, 'queries/create-games-table.sql'), 'utf-8');
    await conn.query(gamesSql);

    /* ---------- GAME ↔ PLAYERS (many-to-many) ---------- */
    const playersSql = await fs.readFile(join(__dirname, 'queries/create-game-playes-relation.sql'), 'utf-8');
    await conn.query(playersSql);

    /* ---------- CHAT MESSAGES ---------- */
    const messagesSql = await fs.readFile(join(__dirname, 'queries/create-messages-table.sql'), 'utf-8');
    await conn.query(messagesSql);

    await conn.commit();
    console.info('✅  Database schema is up to date');
  } catch (err) {
    await conn.rollback();
    console.error('❌  DB init failed:', err);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();             // init – одноразовый скрипт, закрываем пул
  }
}

init();
