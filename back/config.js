import dotenv from 'dotenv';

dotenv.config({
  path: '../.env.dev'
});

export const PORT = process.env.BACK_PORT;
export const HOST = process.env.BACK_HOST

export const DB_HOST = process.env.DB_HOST;
export const DB_PORT = process.env.DB_PORT;
export const DB_USER = process.env.DB_USER;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_NAME = process.env.DB_NAME;

export const JWT_SECRET   = process.env.JWT_SECRET;

export const ACCESS_TOKEN_LIFETIME = process.env.ACCESS_TOKEN_LIFETIME;
export const REFRESH_TOKEN_LIFETIME = process.env.REFRESH_TOKEN_LIFETIME;

export const ACCESS_TOKEN_NAME = process.env.ACCESS_TOKEN_NAME;
export const REFRESH_TOKEN_NAME = process.env.REFRESH_TOKEN_NAME;