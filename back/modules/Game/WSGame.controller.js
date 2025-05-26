import WebSocket from "ws";
import JWTUtils from "../../utils/jwt-token.js";
import GameService from "./Game.service.js";
import { wss } from "../../index.js";

// helper для рассылки WS
const broadcastWS = (gameId, payload) => {
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.gameId === String(gameId)) {
      client.send(msg);
    }
  });
};

wss.on("connection", (ws, req) => {
  console.log(`🔌 WebSocket client connected`);

  ws.on("message", async (raw) => {
    let msg, userId;
    try {
      msg = JSON.parse(raw);
      userId = JWTUtils.verifyToken(msg.token).userId;
    } catch (e) {
      return ws.send(JSON.stringify({ event: "error", message: "Auth failed" }));
    }

    try {
      switch (msg.event) {
        case "createGame": {
          const game = await GameService.createGame(userId);
          broadcastWS(game.id, { event: "gameCreated", game });
          console.log(`[${userId}] Game created with Id = `, game.id);
          break;
        }
        case "joinGame": {
          const game = await GameService.joinGame(userId, msg.payload.gameId);
          broadcastWS(game.id, { event: "playerJoined", game });
					console.log(`[${userId}] Joined to game with Id = `, game.id);
          break;
        }
        case "startGame": {
          const game = await GameService.startGame(userId, msg.payload.gameId);
          broadcastWS(game.id, { event: "gameStarted", game });
					console.log(`[${userId}] Start game with Id = `, game.id);
          break;
        }
        case "playCard": {
          const { gameId, cardId, targetId } = msg.payload;
          const game = await GameService.playCard(userId, gameId, cardId, targetId);
          broadcastWS(game.id, { event: "cardPlayed", game, cardId, targetId });
					console.log(`[User:${userId} - Game:${game.id}] Play card with Id = `, cardId);
          if (game.status === "ENDED") {
            broadcastWS(game.id, { event: "gameEnded", winner: game.winner_id });
          } else {
            broadcastWS(game.id, { event: "turnStarted", nextPlayer: game.game_state.currentTurn });
          }
          break;
        }
        case "endTurn": {
          const { gameId } = msg.payload;
          const game = await GameService.endTurn(userId, gameId);
          broadcastWS(game.id, { event: "turnEnded", prevPlayer: userId });
          broadcastWS(game.id, { event: "turnStarted", nextPlayer: game.game_state.currentTurn });
					console.log(`[User:${userId} - Game:${game.id}] End turn`);
          break;
        }
        case "getGame": {
          const game = await GameService.getGameById(msg.payload.gameId);
          ws.send(JSON.stringify({ event: "gameData", game }));
          break;
        }
        case "surrender": {
          const game = await GameService.surrenderGame(userId, msg.payload.gameId);
          broadcastWS(game.id, { event: "playerSurrendered", player: userId });
          broadcastWS(game.id, { event: "gameEnded", winner: game.winner_id });
					console.log(`[User:${userId} - Game:${game.id}] Surrendered`);
          break;
        }
        case "getGameByCode": {
          const game = await GameService.getGameByCode(msg.payload.code);
          ws.send(JSON.stringify({ event: "gameDataByCode", game }));
          break;
        }
        case "selectDeck": {
          const { gameId, cardIds } = msg.payload;
          const game = await GameService.selectDeck(userId, gameId, cardIds);
          broadcastWS(game.id, {
            event: "deckSelected",
            player: userId,
            deck: cardIds
          });
          break;
        }
        default:
          ws.send(JSON.stringify({ event: "error", message: "Unknown event" }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ event: "error", message: err.message }));
    }
  });
});
