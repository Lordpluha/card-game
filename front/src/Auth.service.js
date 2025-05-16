class AuthService {
	params
	url
	constructor() {
		this.url = `${API_URL}/api/auth`
		this.params = {
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
		}
	}
	async login(username, password) {
		return fetch(`${url}/login`, {
			method: "POST",
			body: JSON.stringify({ username, password }),
			...params
		})
	}

	async refresh() {
		return fetch(`${url}/refresh`, {
			method: "GET",
			...params
		})
	}

	async logout() {
		return fetch(`${url}/logout`, {
			method: "POST",
			...params
		})
	}

	async register(username, password) {
		return fetch(`${url}/register`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      ...params
    })
	}
}

export default new AuthService();