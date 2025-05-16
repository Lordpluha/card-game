import express from "express";
import { register, login, logout, refresh } from "./Auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/refresh", refresh);

export default router;
