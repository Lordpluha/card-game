import AuthRouter from "./Auth/Auth.module.js";
import GameRouter from "./Game/Game.module.js";
import UserRouter from "./User/User.module.js";
import CardsRouter from "./Cards/Cards.module.js";

const router = [AuthRouter, CardsRouter, GameRouter, UserRouter];

export default router;
