const container = document.getElementById("top-players");

fetch("http://localhost:8080/api/users/top")
  .then((res) => {
    if (!res.ok) throw new Error("Не вдалося завантажити гравців");
    return res.json(); // JSON now valid
  })
  .then((players) => {
    if (!players.length) {
      container.innerHTML = `<p class="text-gray-400">Немає гравців 😢</p>`;
      return;
    }

    players.forEach((player) => {
      const rating = undefined;

      const div = document.createElement("div");
      div.className =
        "bg-[rgba(26,26,26,0.75)] rounded-xl shadow-lg p-4 flex flex-col items-center card-hover overflow-hidden";
      div.title = `${player.username} — Рейтинг ${rating}`;

      div.innerHTML = `
        <h4 class="text-[var(--color-text-light)] font-semibold text-lg mb-2">
          ${player.username}
        </h4>
        <p class="text-[var(--color-text-muted)]">Рейтинг: ${rating}</p>
      `;

      container.appendChild(div);
    });
  })
  .catch((err) => {
    console.error("❌ Error loading players:", err);
    container.innerHTML = `<p class="text-red-500">⚠ ${err.message}</p>`;
  });
