import jwt from 'jsonwebtoken';
import { JWT_SECRET, ACCESS_TOKEN_LIFETIME, REFRESH_TOKEN_LIFETIME } from '../config.js';
import {ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME} from '../config.js';
import AuthConfig from '../modules/Auth/Auth.config.js';

class JWTUtils {
	static generateAccessToken = (userId, username) =>
		jwt.sign(
			{ userId, username },
			JWT_SECRET,
			{ expiresIn: ACCESS_TOKEN_LIFETIME }
		);
	static generateRefreshToken = (userId, username) =>
		jwt.sign(
			{ userId, username },
			JWT_SECRET,
			{ expiresIn: REFRESH_TOKEN_LIFETIME }
		);

	static verifyToken = (token) => {
		let payload;
		try {
			payload = jwt.verify(token, JWT_SECRET);
		} catch (err) {
			const e = new Error('Invalid token');
			e.status = 401;
			throw e;
		}
		return payload;
	}

	static generateHttpOnlyCookie = (res, access, refresh) => {
		return res
      .cookie(ACCESS_TOKEN_NAME, access, { ...AuthConfig.cookieOpts, maxAge: AuthConfig.AccessMaxAge })
      .cookie(REFRESH_TOKEN_NAME, refresh, { ...AuthConfig.cookieOpts, maxAge: AuthConfig.RefreshMaxAge });
	}

	static clearHttpOnlyCookie = (res) => {
		return res
			.clearCookie(ACCESS_TOKEN_NAME, AuthConfig.cookieOpts)
			.clearCookie(REFRESH_TOKEN_NAME, AuthConfig.cookieOpts);
	}
}

export default JWTUtils;