const AuthConfig = {
	// Compare with .env.dev!!!
	AccessMaxAge: 24*60*60*1000, // 1d
	RefreshMaxAge: 7*24*60*60*1000, // 7d
	cookieOpts: {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax'
	}
}

export default AuthConfig;