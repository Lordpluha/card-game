import dotenv from 'dotenv';

dotenv.config({
  path: '../.env.dev'
});

export const PORT = process.env.BACK_PORT || 8080;
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT || 3306;
export const DB_USER = process.env.DB_USER || "username";
export const DB_PASSWORD = process.env.DB_PASSWORD || "root";
export const DB_NAME = process.env.DB_NAME || "card_game";
export const JWT_SECRET   = process.env.JWT_SECRET   || 'your_jwt_secret';
export const JWT_LIFETIME = process.env.JWT_LIFETIME || '1d';