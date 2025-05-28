class UserService {
  params;
  url;
  constructor() {
    this.url = `http://localhost:8080/api`;
    this.params = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  async getUser() {
    return await fetch(`${this.url}/user`, {
      method: "GET",
      ...this.params,
    }).then((res) => res.json());
  }

  // update current user settings
  async updateSettings(settings) {
    return await fetch(`${this.url}/user`, {
      method: "PATCH",
      body: JSON.stringify(settings),
      ...this.params,
    }).then((res) => res.json());
  }

  // get profile by username
  async getByUsername(username) {
    return await fetch(`${this.url}/user/username/${username}`, {
      method: "GET",
      ...this.params,
    }).then((res) => res.json());
  }

  // get top players
  async getTopPlayers() {
    return await fetch(`${this.url}/top`, {
      method: "GET",
      ...this.params,
    }).then((res) => res.json());
  }
}

export default new UserService();
