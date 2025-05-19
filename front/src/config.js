const env =
  typeof process !== "undefined" ? process.env : window.process?.env || {};

export const NODE_ENV = env.NODE_ENV;
export const PORT = env.FRONT_PORT;
export const HOST = env.FRONT_HOST;
export const API_URL = env.BACK_HOST;
export const API_PORT = env.BACK_PORT;

export const ACCESS_TOKEN_NAME = env.ACCESS_TOKEN_NAME;
export const REFRESH_TOKEN_NAME = env.REFRESH_TOKEN_NAME;
