import { pool } from "../../db/connect.js";
import WebSocket from "ws";
import cookie from "cookie";
import JWTUtils from "../../utils/jwt-token.js";
import GameService from "./Game.service.js";
import { ACCESS_TOKEN_NAME } from "../../config.js";
import { WebSocketServer } from "ws";
import { HOST, PORT } from "../../config.js";

var gameTimers = {};

export function initGameController(server) {
  const wss = new WebSocketServer({ server, path: `/gaming` });
  console.log(`Websocket Game Server started: ws://${HOST}:${PORT}/gaming`);

  // helper для рассылки WS
  const broadcastGameWS = (gameId, payload) => {
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

  const ROUND_DURATION = 60;
  // gameId => { startTime: timestamp, intervalId }

  function startTimer(gameId) {
    // очистим старый
    if (gameTimers[gameId]?.intervalId) {
      clearInterval(gameTimers[gameId].intervalId);
    }
    const startTime = Date.now();
    // сразу отправляем полный круг
    broadcastTimer(gameId, ROUND_DURATION);
    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const timeLeft = Math.max(0, ROUND_DURATION - elapsed);
      broadcastTimer(gameId, timeLeft);
      if (timeLeft <= 0) {
        clearInterval(intervalId);
        delete gameTimers[gameId];
        broadcastTimerEnd(gameId);
      }
    }, 1000);

    gameTimers[gameId] = { startTime, intervalId };
  }

  function broadcastTimer(gameId, timeLeft) {
    const msg = JSON.stringify({ event: "updateTimer", payload: { timeLeft } });
    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.gameId === String(gameId)
      ) {
        client.send(msg);
      }
    });
  }

  function broadcastTimerEnd(gameId) {
    const msg = JSON.stringify({ event: "endTimer" });
    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.gameId === String(gameId)
      ) {
        client.send(msg);
      }
    });
  }

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

    ws.on("message", async (raw) => {
      let msg, userId = ws.userId;
      try {
        msg = JSON.parse(raw);
      } catch (e) {
        return ws.send(
          JSON.stringify({ event: "error", message: "Invalid JSON" })
        );
      }

      try {
        switch (msg.event) {
          // Lobby
          case "createGame": {
            const game = await GameService.create(userId);
            ws.gameId = String(game.id);
            broadcastGameWS(game.id, { event: "gameCreated", game });
            break;
          }
          case "joinGame": {
            const game = await GameService.joinGame(userId, msg.payload.gameId);
            ws.gameId = String(game.id);
            broadcastGameWS(game.id, { event: "playerJoined", game });
            if (
              Object.keys(game.game_state.decks).length === game.user_ids.length &&
              game.user_ids.length === 2
            ) {
              if (game.status === "CREATED") {
                broadcastGameWS(game.id, {
                  event: "decksSelected",
                  game: game,
                });
              } else {
                broadcastGameWS(game.id, {
                  event: "gameStarted",
                  game: game,
                });
              }
            }
            break;
          }
          case "startGame": {
            const game = await GameService.startGame(
              userId,
              msg.payload.gameId
            );
            ws.gameId = String(game.id);
            broadcastGameWS(game.id, { event: "gameStarted", game });
            // новый раунд после старта игры
            broadcastGameWS(game.id, { event: "startRound", game });
            startTimer(game.id);
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
            broadcastGameWS(game.id, {
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
              broadcastGameWS(game.id, {
                event: "decksSelected",
                game: game,
              });
            }
            break;
          }
          case "getGame": {
            const game = await GameService.getGameById(msg.payload.gameId);
            broadcastGameWS(game.id, {
              event: "gameData",
              game
            })
            break;
          }

          // Battlefield
          case "playCard": {
            const game = await GameService.playCard(
              userId,
              msg.payload.gameId,
              msg.payload.cardId
            );

            // Отправляем событие о сыгранной карте противника для отрисовки на фронте
            broadcastGameWS(game.id, {
              event: "cardPlayed",
              game,
            })

            // Если оба игрока выбрали карты - завершаем раунд и отдаем обновленное состояние игры
            if (Object.keys(game.game_state.selected).length === 2) {
              const r = await GameService.endRound(msg.payload.gameId)
              broadcastGameWS(r.id, { event: "endRound", game: r });

							startTimer(r.id);
							// hp + cards
              const noWinner = Object.entries(r.game_state.health).every(
								([userId, hp]) => +hp > 0 && r.game_state.decks[userId].length > 0
							);
							console.log("noWinner", noWinner, JSON.stringify(r.game_state.health, null, 2), JSON.stringify(r.game_state.decks, null, 2));
              if (noWinner) {
                setTimeout(() => {
                  broadcastGameWS(r.id, { event: "startRound", game: r });

                  startTimer(r.id);
                }, 2000);
              }	else {
								const finishedGame = await GameService.finishGame(r.id);
								broadcastGameWS(finishedGame.id, {
									event: "gameEnded",
									game: finishedGame,
								});
							}
            }

            break;
          }
          case "surrender": {
            const game = await GameService.surrenderUser(
              userId,
              msg.payload.gameId
            );
            broadcastGameWS(game.id, {
              event: "playerSurrendered",
              player: userId,
            });
            broadcastGameWS(game.id, {
              event: "gameEnded",
              winner: game.winner_id,
            });
            break;
          }
          case "mergeCards": {
            const { gameId, cardIds } = msg.payload;
            const game = await GameService.mergeCards(userId, gameId, cardIds);
            broadcastGameWS(game.id, { event: "mergedCards", game });
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
