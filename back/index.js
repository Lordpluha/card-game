import express from "express";
import cors from "cors";
import { PORT, HOST, NODE_ENV, FRONT_HOST } from "./config.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import router from "./modules/index.js";

const app = express();
export const server = createServer(app);

// allow front-end to receive httpOnly cookies
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith(`http://${FRONT_HOST}:3000`)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// Точка входа
app.get("/api", (req, res) => {
  res.send("Welcome to card-game Api!");
});

// 👇 Остальные модули (auth, cards, game)
app.use("/api", router);

// Глобальный обработчик 404
app.use((req, res) => res.status(404).json({ message: "Not Found" }));

// Запуск HTTP-сервера
server.listen(PORT, () => {
  console.log(`Using: ${NODE_ENV} environment`);
  console.log(`Server started: http://${HOST}:${PORT}/api`);
});

// WebSocket-сервер
export const wss = new WebSocketServer({ server, path: `/gaming` });
console.log(`Websocket Game Server started: ws://${HOST}:${PORT}/gaming`);
