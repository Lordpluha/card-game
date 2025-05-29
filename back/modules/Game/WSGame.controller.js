import { pool } from "../../db/connect.js";
import WebSocket from "ws";
import cookie from "cookie";
import JWTUtils from "../../utils/jwt-token.js";
import GameService from "./Game.service.js";
import { ACCESS_TOKEN_NAME } from "../../config.js";
import { WebSocketServer } from "ws";
import { HOST, PORT } from "../../config.js";

export function initGameController(server) {
  const wss = new WebSocketServer({ server, path: `/gaming` });
  console.log(`Websocket Game Server started: ws://${HOST}:${PORT}/gaming`);

  // helper для рассылки WS
  const broadcastWS = (gameId, payload) => {
    const msg = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.gameId === String(gameId)
      ) {
        client.send(msg);
      }
    });
  };

  wss.on("connection", (ws, req) => {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies[ACCESS_TOKEN_NAME];
    if (!token) {
      ws.send(JSON.stringify({ event: "error", message: "Auth required" }));
      return ws.close(1008);
    }
    try {
      ws.userId = JWTUtils.verifyToken(token).userId;
    } catch {
      ws.send(JSON.stringify({ event: "error", message: "Invalid token" }));
      return ws.close(1008);
    }

    console.log(`🔌 WebSocket client connected: user ${ws.userId}`);

    ws.on("message", async (raw) => {
      let msg,
        userId = ws.userId;
      try {
        msg = JSON.parse(raw);
      } catch (e) {
        return ws.send(
          JSON.stringify({ event: "error", message: "Invalid JSON" })
        );
      }

      try {
        switch (msg.event) {
          case "createGame": {
            const game = await GameService.createGame(userId);
            // associate this socket with new gameId
            ws.gameId = String(game.id);
            // reply immediately
            ws.send(JSON.stringify({ event: "gameCreated", game }));
            // broadcast to any others (now includes this socket)
            broadcastWS(game.id, { event: "gameCreated", game });
            console.log(`[${userId}] Game created with Id = `, game.id);
            break;
          }
          case "joinGame": {
            const game = await GameService.joinGame(userId, msg.payload.gameId);
            // tag socket so future broadcasts reach it
            ws.gameId = String(game.id);
            broadcastWS(game.id, { event: "playerJoined", game });
            console.log(`[${userId}] Joined to game with Id = `, game.id);
            if (
              Object.keys(game.game_state.decks).length ===
                game.user_ids.length &&
              game.user_ids.length === 2
            ) {
              broadcastWS(game.id, {
                event: "decksSelected",
                game: game,
              });
            }
            break;
          }
          case "startGame": {
            const game = await GameService.startGame(
              userId,
              msg.payload.gameId
            );
            broadcastWS(game.id, { event: "gameStarted", game });
            console.log(`[${userId}] Start game with Id = `, game.id);
            break;
          }
          case "playCard": {
            const { gameId, cardId, targetId } = msg.payload;
            const game = await GameService.playCard(
              userId,
              gameId,
              cardId,
              targetId
            );
            broadcastWS(game.id, {
              event: "cardPlayed",
              game,
              cardId,
              targetId,
            });
            console.log(
              `[User:${userId} - Game:${game.id}] Play card with Id = `,
              cardId
            );
            if (game.status === "ENDED") {
              broadcastWS(game.id, {
                event: "gameEnded",
                winner: game.winner_id,
              });
            } else {
              broadcastWS(game.id, {
                event: "turnStarted",
                nextPlayer: game.game_state.currentTurn,
              });
            }
            break;
          }
          case "endTurn": {
            const { gameId, timeout } = msg.payload;
            const game = await GameService.getGameById(gameId);
            const state = { ...game.game_state };

            state.playedCards = state.playedCards || {};

            if (timeout && !state.playedCards[userId]) {
              state.playedCards[userId] = {
                attack: 0,
                defense: 0,
                owner: userId,
                isDummy: true,
              };
              console.warn(`⌛ Timeout! User ${userId} played dummy card`);
            }

            await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
              JSON.stringify(state),
              gameId,
            ]);

            // викликаємо playerReady після таймаута
            const result = await GameService.playerReady(userId, gameId);

            broadcastWS(gameId, { event: "playerReady", player: userId });

            if (result.outcome) {
              broadcastWS(gameId, {
                event: "battle_result",
                outcome: result.outcome,
              });
              broadcastWS(gameId, {
                event: "update_health",
                health: result.game.game_state.health,
              });
            }

            break;
          }
          case "getGame": {
            const game = await GameService.getGameById(msg.payload.gameId);
            ws.send(JSON.stringify({ event: "gameData", game }));
            break;
          }
          case "surrender": {
            const game = await GameService.surrenderGame(
              userId,
              msg.payload.gameId
            );
            broadcastWS(game.id, {
              event: "playerSurrendered",
              player: userId,
            });
            broadcastWS(game.id, {
              event: "gameEnded",
              winner: game.winner_id,
            });
            console.log(`[User:${userId} - Game:${game.id}] Surrendered`);
            break;
          }
          case "getGameByCode": {
            const game = await GameService.getGameByCode(msg.payload.code);
            ws.send(JSON.stringify({ event: "gameDataByCode", game }));
            break;
          }
          case "selectDeck": {
            const game = await GameService.selectDeck(
              userId,
              msg.payload.gameId,
              msg.payload.cardIds
            );
            broadcastWS(game.id, {
              event: "deckSelected",
              player: userId,
              deck: msg.payload.cardIds,
            });

            // новое: когда оба игрока выбрали колоды
            if (
              Object.keys(game.game_state.decks).length ===
                game.user_ids.length &&
              game.user_ids.length === 2
            ) {
              broadcastWS(game.id, {
                event: "decksSelected",
                game: game,
              });
            }
            break;
          }
          case "mergeCards": {
            const { gameId, cardIds } = msg.payload;
            const game = await GameService.mergeCards(userId, gameId, cardIds);
            broadcastWS(game.id, { event: "cardsMerged", game, cardIds });
            console.log(
              `[User:${userId} - Game:${game.id}] Merged cards`,
              cardIds
            );
            break;
          }
          case "playerReady": {
            console.log(
              `📥 WS: playerReady from ${userId}, game = ${msg.payload.gameId}`
            );
            // передаём флаг timeout (true при истечении времени)
            const { game, outcome } = await GameService.playerReady(
              userId,
              msg.payload.gameId,
              { timeout: msg.payload.timeout === true }
            );

            broadcastWS(game.id, { event: "playerReady", player: userId });

            if (outcome) {
              console.log("📤 WS: Sending battle_result:", outcome);
              broadcastWS(game.id, { event: "battle_result", outcome });

              console.log(
                "📤 WS: Sending update_health:",
                game.game_state.health
              );
              broadcastWS(game.id, {
                event: "update_health",
                health: game.game_state.health,
              });
            }
            break;
          }
          case "playedCard": {
            console.log(`[WS] Received playedCard from ${userId}`);
            const { gameId, card } = msg.payload;
            const game = await GameService.getGameById(gameId);

            const state = { ...game.game_state };
            state.playedCards = state.playedCards || {};
            state.playedCards[userId] = card;

            await pool.execute("UPDATE games SET game_state = ? WHERE id = ?", [
              JSON.stringify(state),
              gameId,
            ]);
            console.log("💾 playedCard saved:", card);
            break;
          }

          default:
            ws.send(
              JSON.stringify({ event: "error", message: "Unknown event" })
            );
        }
      } catch (err) {
        ws.send(JSON.stringify({ event: "error", message: err.message }));
      }
    });
  });
}
