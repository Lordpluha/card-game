import { connectToGameWS } from "./ws-game-client.js";
import AuthService from "../api/Auth.service.js";

const input = document.querySelector("input");
const button = document.querySelector("button");

button.addEventListener("click", async () => {
  const code = input.value.trim().toUpperCase();
  if (!code) return alert("Введи код!");

  try {
    // 🟡 Пытаемся авторизоваться через refresh
    await AuthService.refresh();
    console.log("✅ Авторизован — пробуем получить игру по коду");
  } catch (err) {
    console.warn("❌ Не авторизован:", err.message);
    alert("Ви не авторизовані. Перейдіть на сторінку входу.");
    window.location.href = "/pages/login.html";
    return;
  }

  // ✅ Получаем игру по коду
  const res = await fetch(`http://localhost:8080/api/by-code/${code}`, {
    credentials: "include",
  });

  if (!res.ok) {
    return alert("Комната не найдена");
  }

  const game = await res.json();
  const gameId = game.id;

  // 🔌 Подключаемся по WS ДО join (можно слушать, но не полагаться на WS для редиректа)
  connectToGameWS(gameId, (msg) => {
    console.log("📨 WS message:", msg);

    if (msg.event === "playerJoined") {
      console.log("✅ WS подтвердил вход");
    }

    // опционально: можно показать UI, что второй игрок в комнате
  });

  // 🔁 Присоединяемся
  const joinRes = await fetch(`http://localhost:8080/api/game/${gameId}/join`, {
    method: "PUT",
    credentials: "include",
  });

  if (!joinRes.ok) {
    const err = await joinRes.json();
    alert("⛔ " + err.message);
    return;
  }

  // ✅ Всё прошло — идём в prelobby
  window.location.href = `/pages/prelobby.html?gameId=${gameId}&code=${code}`;
});
