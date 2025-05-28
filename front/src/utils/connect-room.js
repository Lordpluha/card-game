const input = document.querySelector("input");
const button = document.querySelector("button");

button.addEventListener("click", async () => {
  const code = input.value.trim().toUpperCase();
  if (!code) return alert("Введи код!");

  // ✅ Получаем игру по коду
  const game = await fetch(`http://localhost:8080/api/by-code/${code}`, {
    credentials: "include",
  })
		.then(resp => resp.json())
		.catch(err => {
			return alert("Комната не найдена");
		});

  // ✅ Всё прошло — идём в prelobby
  window.location.href = `/pages/prelobby.html?gameId=${game.id}`;
});
