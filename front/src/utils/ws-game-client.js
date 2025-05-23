// scripts/ws-game-client.js
export function connectToGameWS(gameId, onMessage) {
  const socket = new WebSocket(`ws://localhost:8080/gaming?gameId=${gameId}`);

  socket.onopen = () => {
    console.log("✅ WS connected");
  };

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log("📨 WS message:", data);
    onMessage(data);
  };

  socket.onerror = (err) => {
    console.error("❌ WS Error:", err);
  };

  socket.onclose = () => {
    console.log("❌ WS disconnected");
  };
}
