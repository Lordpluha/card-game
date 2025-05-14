import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import router from './modules/index.js';
import cookieParser from 'cookie-parser';

const app = express()

// allow front-end to receive httpOnly cookies
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.static('public'))
app.use(express.json());
app.use(cookieParser());

app.get('/api', (res) => {
  res.send('Welcome to card-game Api!')
})
app.use('/api', router);


app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})
