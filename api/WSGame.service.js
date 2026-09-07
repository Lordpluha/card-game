class WSGameService {
  socket = null;
  listeners = {};

  connect() {
    const wsUrl = window.location.origin.replace(/^http/, "ws");
    this.socket = new WebSocket(wsUrl);
    this.socket.onmessage = ({ data }) => {
      let msg;
      try { msg = JSON.parse(data); } catch { return; }
      const cb = this.listeners[msg.event];
      if (cb) cb(msg);
    };
  }

  on(event, callback) {
    this.listeners[event] = callback;
  }

  off(event) {
    delete this.listeners[event];
  }

  send(event, payload = {}) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, payload }));
    }
  }

  // create/join/start
  createGame() { this.send("createGame"); }
  onGameCreated(cb) { this.on("gameCreated", ({ game }) => cb(game)); }

  joinGame(gameId) { this.send("joinGame", { gameId }); }
  onPlayerJoined(cb) { this.on("playerJoined", ({ game }) => cb(game)); }

  startGame(gameId) { this.send("startGame", { gameId }); }
  onGameStarted(cb) { this.on("gameStarted", ({ game }) => cb(game)); }

  // play / turn
  playCard(gameId, cardId, targetId) {
    this.send("playCard", { gameId, cardId, targetId });
  }
  onCardPlayed(cb) { this.on("cardPlayed", ({ game, cardId, targetId }) => cb({ game, cardId, targetId })); }

  onTurnEnded(cb) { this.on("turnEnded", ({ prevPlayer }) => cb(prevPlayer)); }
  onTurnStarted(cb) { this.on("turnStarted", ({ nextPlayer }) => cb(nextPlayer)); }

  // fetch state
  getGame(gameId) { this.send("getGame", { gameId }); }
  onGameData(cb) { this.on("gameData", ({ game }) => cb(game)); }

  // surrender
  surrender(gameId) { this.send("surrender", { gameId }); }
  onPlayerSurrendered(cb) { this.on("playerSurrendered", ({ player }) => cb(player)); }
  onGameEnded(cb) { this.on("gameEnded", ({ winner }) => cb(winner)); }

  // lookup by code
  getGameByCode(code) { this.send("getGameByCode", { code }); }
  onGameDataByCode(cb) { this.on("gameDataByCode", ({ game }) => cb(game)); }

  // deck selection & merge
  selectDeck(gameId, cardIds) {
    this.send("selectDeck", { gameId, cardIds });
  }
  onDeckSelected(cb) { this.on("deckSelected", ({ player, deck }) => cb({ player, deck })); }

  mergeCards(gameId, cardIds) {
    this.send("mergeCards", { gameId, cardIds });
  }
  onCardsMerged(cb) { this.on("cardsMerged", ({ game, cardIds }) => cb({ game, cardIds })); }
}

export default new WSGameService();
