import express from "express";
import cors from "cors";
import { PORT, HOST, NODE_ENV, FRONT_HOST } from "./config.js";
import router from "./modules/index.js";
import cookieParser from "cookie-parser";

const app = express();

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

app.listen(PORT, () => {
  console.log(`Using: ${NODE_ENV} environment`)
  console.log(`Server started: http://${HOST}:${PORT}/api`);
});
