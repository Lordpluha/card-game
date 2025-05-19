import express from "express";
import cors from "cors";
import { PORT, HOST, NODE_ENV, FRONT_HOST } from "./config.js";
import router from "./modules/index.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
export const server = createServer(app);

// allow front-end to receive httpOnly cookies
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith(`http://${FRONT_HOST}`)
      ) {
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

app.get("/api", (req, res) => {
  res.send("Welcome to card-game Api!");
});
app.use("/api", router);

// заменяем app.listen на server.listen
server.listen(PORT, () => {
  console.log(`Using: ${NODE_ENV} environment`);
  console.log(`Server started: http://${HOST}:${PORT}/api`);
});

// создаём WebSocket-сервер
export const wss = new WebSocketServer({ server, path: `/gaming` });
wss.on("connection", (ws, req) => {
  console.log("🔌 WebSocket client connected");
  // извлекаем gameId из URL подключения
  const qs = req.url.split("?")[1] || "";
  const params = new URLSearchParams(qs);
  ws.gameId = params.get("gameId") || null;
  console.log("🔌 WS client subscribed to game:", ws.gameId);
});
