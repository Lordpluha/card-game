import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:8080/gaming?gameId=1234');

ws.on('open', () => {
	console.log('WebSocket connected');
	// auto-close after 3s to test "leaving" the game
	setTimeout(() => {
		ws.close();
	}, 3000);
});

ws.on('message', (data) => {
	console.log('Received:', data.toString());
});

ws.on('error', (err) => {
	console.error('WebSocket error:', err);
});

ws.on('close', (code, reason) => {
	console.log('WebSocket disconnected', code, reason);
});