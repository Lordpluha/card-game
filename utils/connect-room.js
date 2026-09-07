import { DEMO } from "../demo/mode.js";

const input = document.querySelector("input");
const button = document.querySelector("button");

button.addEventListener("click", async () => {
  const code = input.value.trim().toUpperCase();
  if (!code) return alert("Введи код!");

  // In the static demo any code opens the scripted room; against a live backend
  // this is a lookup on GET /api/by-code/:code.
  if (DEMO) {
    window.location.href = `./lobby.html?gameId=412&code=${encodeURIComponent(code)}`;
    return;
  }

  const game = await fetch(`http://localhost:8080/api/by-code/${code}`, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .catch(() => null);

  if (!game || !game.id) return alert("Room not found");

  window.location.href = `./lobby.html?gameId=${game.id}`;
});
