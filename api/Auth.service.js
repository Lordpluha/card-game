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

  async login(login, password) {
    return await fetch(`${this.url}/login`, {
      method: "POST",
      body: JSON.stringify({ login, password }),
      ...this.params,
    });
  }

  async refresh() {
    return await fetch(`${this.url}/refresh`, {
      method: "POST",
      credentials: "include",
      ...this.params,
    }).then((res) => res.ok ? res.json() : Promise.reject(res.json()));;
  }

  async logout() {
    return await fetch(`${this.url}/logout`, {
      method: "POST",
      ...this.params,
    });
  }

  async register(username, password, email) {
    return await fetch(`${this.url}/register`, {
      method: "POST",
      body: JSON.stringify({ username, password, email }),
      ...this.params,
    });
  }
}

// The real implementation above is untouched; the static demo build swaps in a
// fixture-backed stand-in. Set window.CARD_GAME_LIVE_API = true to use the API.
import { DEMO } from "../demo/mode.js";
import { demoAuthService } from "../demo/services.js";

export default DEMO ? demoAuthService : new AuthService();
