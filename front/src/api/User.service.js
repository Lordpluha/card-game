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
}

export default new UserService();
