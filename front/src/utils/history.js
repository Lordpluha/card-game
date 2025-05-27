const tbody = document.getElementById("history-body");

fetch("http://localhost:8080/api/game/history", {
  credentials: "include",
})
  .then((res) => {
    if (!res.ok) throw new Error("Не вдалося завантажити історію");
    return res.json();
  })
  .then((historyData) => {
    if (!Array.isArray(historyData) || historyData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-yellow-400 px-6 py-4 text-center">У вас ще не було матчів</td></tr>`;
      return;
    }

    const resultColor = (result) => {
      if (result.includes("Нічия")) return "text-[#facc15]";
      if (result.includes("Перемога") && result.includes("1"))
        return "text-[#4ade80]";
      if (result.includes("Перемога")) return "text-[#ef4444]";
      return "text-white";
    };

    historyData.forEach((match) => {
      const tr = document.createElement("tr");
      tr.className =
        "border-b border-[var(--color-accent-dark)] hover:bg-[rgba(183,98,242,0.1)] transition";
      tr.innerHTML = `
        <td class="py-3 px-6 text-[var(--color-text-light)]">${match.p1}</td>
        <td class="py-3 px-6 text-[var(--color-text-light)]">${match.p2}</td>
        <td class="py-3 px-6 font-semibold ${resultColor(match.result)}">${
        match.result
      }</td>
        <td class="py-3 px-6 text-[var(--color-text-light)]">${
          match.date || "-"
        }</td>
      `;
      tbody.appendChild(tr);
    });
  })
  .catch((err) => {
    tbody.innerHTML = `<tr><td colspan="4" class="text-red-500 px-6 py-4 text-center">⚠ ${err.message}</td></tr>`;
  });
