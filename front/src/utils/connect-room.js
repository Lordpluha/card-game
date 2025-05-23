import { connectToGameWS } from "./ws-game-client.js";

const input = document.querySelector("input");
const button = document.querySelector("button");

button.addEventListener("click", async () => {
  const code = input.value.trim().toUpperCase();
  if (!code) return alert("Введи код!");

  // Получаем игру по коду
  const res = await fetch(`http://localhost:8080/api/game/by-code/${code}`, {
    credentials: "include",
  });

  if (!res.ok) {
    return alert("Комната не найдена");
  }

  const game = await res.json();
  const gameId = game.id;

  // Подключаемся по WS ДО join
  connectToGameWS(gameId, (msg) => {
    if (msg.event === "playerJoined") {
      window.location.href = `/pages/prelobby.html?gameId=${gameId}`;
    }
  });

  // Присоединяемся
  const joinRes = await fetch(`http://localhost:8080/api/game/${gameId}/join`, {
    method: "PUT",
    credentials: "include",
  });

  if (!joinRes.ok) {
    const err = await joinRes.json();
    alert("⛔ " + err.message);
  }
});
