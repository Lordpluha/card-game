class GameService {
  params; url;
  constructor() {
    this.url = `http://localhost:8080/api`;
    this.params = {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    };
  }

  async getGames() {
    return await fetch(`${this.url}/games`, {
      method: "GET", ...this.params
    }).then(r=>r.json());
  }

  async getGame(id) {
    return await fetch(`${this.url}/game/${id}`, {
      method: "GET", ...this.params
    }).then(r=>r.json());
  }

  async getHistory() {
    return await fetch(`${this.url}/history`, {
      method: "GET", ...this.params
    }).then(r=>r.json());
  }
}

// The real implementation above is untouched; the static demo build swaps in a
// fixture-backed stand-in. Set window.CARD_GAME_LIVE_API = true to use the API.
import { DEMO } from "../demo/mode.js";
import { demoGameService } from "../demo/services.js";

export default DEMO ? demoGameService : new GameService();
