class AuthService {
  params;
  url;
  constructor() {
    this.url = `http://localhost:8080/api/auth`;
    this.params = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  async login(username, password) {
    return await fetch(`${this.url}/login`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      ...this.params,
    });
  }

  // async refresh() {
  // 	return await fetch(`${this.url}/refresh`, {
  // 		method: "POST",
  // 		...this.params
  // 	})
  // }

  async refresh() {
    const res = await fetch(`${this.url}/refresh`, {
      method: "POST",
      ...this.params,
    });
    const json = await res.json();
    // console.log("📥 [AuthService.refresh] response:", json);

    if (!res.ok) throw new Error("Unauthorized");

    return json;
  }

  async logout() {
    return await fetch(`${this.url}/logout`, {
      method: "POST",
      ...this.params,
    });
  }

  async register(username, password) {
    return await fetch(`${this.url}/register`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      ...this.params,
    });
  }
}

export default new AuthService();
