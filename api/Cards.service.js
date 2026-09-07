class CardsService {
  params;
  url;
  constructor() {
    this.url = `http://localhost:8080/api`;
    this.params = {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    };
  }

  async getAll() {
    return fetch(`${this.url}/cards`, { method: "GET", ...this.params }).then(
      (r) => r.json()
    );
  }

  async getMyCards() {
    return fetch(`${this.url}/my-cards`, {
      method: "GET",
      ...this.params,
    }).then((r) => r.json());
  }

  async getById(id) {
    return fetch(`${this.url}/cards/${id}`, {
      method: "GET",
      ...this.params,
    }).then((r) => r.json());
  }

  async craft(ids) {
    return fetch(`${this.url}/cards/craft`, {
      method: "POST",
      body: JSON.stringify({ ids }),
      ...this.params,
    }).then((r) => r.json());
  }

  async merge(ids) {
    return fetch(`${this.url}/cards/merge`, {
      method: "POST",
      body: JSON.stringify({ ids }),
      ...this.params,
    }).then((r) => r.json());
  }

  async upgrade(id) {
    return fetch(`${this.url}/cards/${id}/upgrade`, {
      method: "POST",
      ...this.params,
    }).then((r) => r.json());
  }

  async addToUserCards(newCards) {
    const existing = JSON.parse(sessionStorage.getItem("myCards") || "[]");
    sessionStorage.setItem(
      "myCards",
      JSON.stringify([...existing, ...newCards])
    );
  }

  async openPack() {
    console.log("🚀 Отправляем запрос на открытие пака");

    const res = await fetch(`${this.url}/cards/open-pack`, {
      method: "POST",
      body: JSON.stringify({ type: "common" }),
      ...this.params,
    });

    console.log("📥 Ответ от сервера:", res.status);

    if (!res.ok) {
      const errText = await res.text(); // лог текст ошибки
      console.error("❌ Сервер вернул ошибку:", errText);
      throw new Error("Не вдалося відкрити пак");
    }

    const data = await res.json();
    console.log("🎴 Полученные карты:", data);
    return data;
  }
}

// The real implementation above is untouched; the static demo build swaps in a
// fixture-backed stand-in. Set window.CARD_GAME_LIVE_API = true to use the API.
import { DEMO } from "../demo/mode.js";
import { demoCardsService } from "../demo/services.js";

export default DEMO ? demoCardsService : new CardsService();
