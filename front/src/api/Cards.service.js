class CardsService {
  params; url;
  constructor() {
    this.url = `http://localhost:8080/api`;
    this.params = {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    };
  }

  async getAll() {
    return fetch(`${this.url}/cards`, { method: "GET", ...this.params })
      .then((r) => r.json());
  }

  async getMyCards() {
    return fetch(`${this.url}/my-cards`, { method: "GET", ...this.params })
      .then((r) => r.json());
  }

  async getById(id) {
    return fetch(`${this.url}/cards/${id}`, { method: "GET", ...this.params })
      .then((r) => r.json());
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
}

export default new CardsService();
