import fs from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import {
  DB_HOST, DB_PORT,
  DB_USER, DB_PASSWORD,
  DB_NAME
} from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

async function init() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true
  });

  try {
    await conn.beginTransaction();

    // 2) создаём БД, юзера, права
    const initSql = await fs.readFile(join(__dirname, 'queries/init.sql'), 'utf-8');
    await conn.query(initSql);

    // 3) переключаемся на созданную БД
    await conn.query(`USE \`${DB_NAME}\``);

    // 4) создаём таблицы
    const usersSql    = await fs.readFile(join(__dirname, 'queries/create-users-table.sql'),    'utf-8');
    const gamesSql    = await fs.readFile(join(__dirname, 'queries/create-games-table.sql'),    'utf-8');

    await conn.query(usersSql);
    await conn.query(gamesSql);

    await conn.commit();
    console.info('✅  Database schema is up to date');
  } catch (err) {
    await conn.rollback();
    console.error('❌  DB init failed:', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

init();
