import { NODE_ENV } from '../../config.js'

const AuthConfig = {
  // Compare with .env.dev!!!
  AccessMaxAge: 3 * 60 * 1000, // 3m
  RefreshMaxAge: 7 * 24 * 60 * 60 * 1000, // 7d

  cookieOpts: {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
  },
};

export default AuthConfig;
