import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.BACK_PORT || 8080;