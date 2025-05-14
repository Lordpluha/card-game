import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import router from './modules/index.js';

const app = express()

console.log('Hello from the back-end!');

// allow front-end to receive httpOnly cookies
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.static('public'))

app.use(express.json());
app.get('/api', (req, res) => {
  res.send('Welcome to card-game Api!')
})
app.use('/api', router);


app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})
