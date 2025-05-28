import express from "express";
import cors from "cors";
import { PORT, HOST, NODE_ENV, FRONT_HOST, FRONT_PORT } from "./config.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import router from "./modules/index.js";
import {initGameController} from "./modules/Game/WSGame.controller.js";

const app = express();
export const server = createServer(app);

// allow front-end to receive httpOnly cookies
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || origin.startsWith(`http://${FRONT_HOST}:${FRONT_PORT}`)) {
				return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Static files
app.use(express.static("public"));

// Autoparse JSON requests
app.use(express.json());

// Autoparse cookies from requests
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
initGameController(server)
