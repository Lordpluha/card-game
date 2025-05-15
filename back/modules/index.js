import AuthRouter from './Auth/Auth.module.js';
import GameRouter from './Game/Game.module.js';
import UserRouter from './User/User.module.js';
import ProfileRouter from './Profile/Profile.module.js';

const router = [
  AuthRouter,
	GameRouter,
	UserRouter,
	ProfileRouter,
]

export default router