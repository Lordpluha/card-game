window.addEventListener("DOMContentLoaded", async () => {
	const API_URL = 'http://localhost:8080/api';
	const WS_URL = 'ws://localhost:8080/gaming';

	// 1) хост создаёт игру fetch
	const createRes = await fetch(`${API_URL}/game/create`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	const game = await createRes.json();
	console.log('Game created:', game);

	// 2) подключаем хоста по WS
	const hostWs = new WebSocket(
		`${WS_URL}?gameId=${game.id}`,
		// { headers: { Authorization: `Bearer ${TOKENS.host}` } }
	);
	hostWs.onopen   = () => console.log('Host WS open');
	hostWs.onmessage= e => console.log('Host received:', e.data);
	hostWs.onclose  = () => console.log('Host WS closed');

	// 3) через 1s присоединяем гостя (fetch вместо axios)
	setTimeout(async () => {
		const joinRes = await fetch(`${API_URL}/game/${game.id}/join`, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const joined = await joinRes.json();
		console.log('Guest joined:', joined);

		const guestWs = new WebSocket(
			`${WS_URL}?gameId=${game.id}`
		);
		guestWs.onopen    = () => console.log('Guest WS open');
		guestWs.onmessage = e => console.log('Guest received:', e.data);
		guestWs.onclose   = () => console.log('Guest WS closed');

		// 4) через 3s после присоединения гостя закрываем его WS
		setTimeout(() => guestWs.close(), 3000);
	}, 1000);

	// 5) через 7s после старта закрываем WS хоста
	setTimeout(() => hostWs.close(), 7000);
})
