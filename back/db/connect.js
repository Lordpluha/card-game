import mysql from 'mysql2/promise';
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from '../config.js';

const pool = mysql.createPool({
  host:     DB_HOST     || 'localhost',
  port:     DB_PORT     || 3306,
  user:     DB_USER     || 'username',
  password: DB_PASSWORD || 'password',
  database: DB_NAME     || 'database',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

export default pool;