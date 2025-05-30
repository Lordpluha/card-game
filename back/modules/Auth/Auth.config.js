import { NODE_ENV } from '../../config.js'

const AuthConfig = {
  // Compare with .env
  AccessMaxAge: 3 * 60 * 1000, // 3d
  RefreshMaxAge: 7 * 24 * 60 * 60 * 1000, // 7d

  cookieOpts: {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
  },
};

export default AuthConfig;
