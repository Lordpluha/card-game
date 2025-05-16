// const AuthConfig = {
// 	// Compare with .env.dev!!!
// 	AccessMaxAge: 24*60*60*1000, // 1d
// 	RefreshMaxAge: 7*24*60*60*1000, // 7d
// 	cookieOpts: {
// 		httpOnly: true,
// 		secure: process.env.NODE_ENV === 'production',
// 		sameSite: 'lax'
// 	}
// }

// export default AuthConfig;

const AuthConfig = {
  // Max-Age для access и refresh токенов
  AccessMaxAge: 24 * 60 * 60 * 1000, // 1 день
  RefreshMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней

  cookieOpts: {
    httpOnly: true,
    secure: false, // ✅ для локального dev-сервера (не https)
    sameSite: "lax", // ✅ чтобы куки передавались на GET /refresh
    path: "/", // ✅ чтобы куки были видны на всех страницах
  },
};

export default AuthConfig;
