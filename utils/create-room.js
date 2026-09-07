// NOTE: this file is not referenced by any page and imports "./ws-game-client.js",
// which does not exist in the repository. Left as found, with the dead import
// commented out so the folder can be loaded as ES modules.
// import { connectToGameWS } from "./ws-game-client.js";

const codeDisplay = document.querySelector(".code-display");
let gameId = null;

window.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("http://localhost:8080/api/game/create", {
    method: "POST",
    credentials: "include",
  });
  const game = await res.json();
  gameId = game.id;

  codeDisplay.textContent = `Ваш код: ${game.game_code}`;

  // 🎯 Ждём подключения второго игрока
  // connectToGameWS(game.id, (msg) => {
    if (msg.event === "playerJoined") {
      window.location.href = `./lobby.html?gameId=${game.id}`;
    }
  });
});
