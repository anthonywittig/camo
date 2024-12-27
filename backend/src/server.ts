import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { WebSocket, WebSocketServer } from "ws";
import { topics } from "./topics";

interface Player {
  name: string;
  score: number;
  lastSkipTime?: number;
}

interface Game {
  players: Record<
    string,
    { name: string; score: number; lastSkipTime?: number }
  >;
  gameState:
    | "waiting"
    | "ready"
    | "round_started"
    | "voting_phase_1"
    | "voting_phase_2"
    | "review_results";
  words?: string[];
  secretWord?: string;
  susPlayer?: string;
  votes?: Record<string, string>;
  pointsGained?: {
    playerId: string;
    points: number;
  }[];
}

const games: Record<string, Game> = {};

interface WebSocketWithPlayerId extends WebSocket {
  playerId?: string;
  gameId?: string;
  isAlive?: boolean;
}

const gameConnections: Record<string, WebSocketWithPlayerId[]> = {};

dotenv.config();

const app: Express = express();
const port = 5001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Add after your Express app initialization
const wss = new WebSocketServer({ port: 5002 });

const PING_INTERVAL = 10000; // 10 seconds

function heartbeat(this: WebSocketWithPlayerId) {
  this.isAlive = true;
}

// Add ping/pong interval
const interval = setInterval(() => {
  wss.clients.forEach((ws: WebSocketWithPlayerId) => {
    if (ws.isAlive === false) {
      // Connection is dead, clean up
      if (ws.gameId && ws.playerId) {
        const game = games[ws.gameId];
        if (game?.players[ws.playerId]) {
          delete game.players[ws.playerId];

          // Handle sus player disconnection
          if (game.susPlayer === ws.playerId) {
            game.gameState = "ready";
            // Notify remaining players
            gameConnections[ws.gameId]?.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "game_state_update",
                    gameState: game.gameState,
                    players: game.players,
                  })
                );
              }
            });
          }

          // Notify others about player removal
          gameConnections[ws.gameId]?.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "players_update",
                  players: game.players,
                })
              );
            }
          });
        }

        // Clean up connections
        if (gameConnections[ws.gameId]) {
          gameConnections[ws.gameId] = gameConnections[ws.gameId].filter(
            (conn) => conn !== ws
          );
        }
      }
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, PING_INTERVAL);

// Clean up interval on server shutdown
wss.on("close", () => {
  clearInterval(interval);
});

wss.on("connection", (ws: WebSocketWithPlayerId) => {
  ws.isAlive = true;
  ws.on("pong", heartbeat);

  ws.on("message", (message: string) => {
    const data = JSON.parse(message);
    if (data.type === "join") {
      const { gameId, playerId } = data;
      ws.gameId = gameId;
      ws.playerId = playerId;

      if (!gameConnections[gameId]) {
        gameConnections[gameId] = [];
      }
      gameConnections[gameId].push(ws);

      // Send current players list to the newly connected client
      if (games[gameId]) {
        ws.send(
          JSON.stringify({
            type: "players_update",
            players: games[gameId].players,
          })
        );
      }
    }
  });

  ws.on("close", () => {
    if (ws.gameId && ws.playerId) {
      const game = games[ws.gameId];
      if (!game) return;

      // Remove player from game's player list
      if (game.players[ws.playerId]) {
        delete game.players[ws.playerId];

        // If this was the sus player, skip to next round
        if (game.susPlayer === ws.playerId) {
          game.gameState = "ready";
          // Notify remaining players to start new round
          if (gameConnections[ws.gameId]) {
            const stateUpdate = JSON.stringify({
              type: "game_state_update",
              gameState: game.gameState,
              players: game.players,
            });
            gameConnections[ws.gameId].forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(stateUpdate);
              }
            });
          }
        }

        // Notify other players about the player removal
        if (gameConnections[ws.gameId]) {
          const playerUpdate = JSON.stringify({
            type: "players_update",
            players: game.players,
          });
          gameConnections[ws.gameId].forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(playerUpdate);
            }
          });
        }
      }

      // Clean up connections
      if (gameConnections[ws.gameId]) {
        gameConnections[ws.gameId] = gameConnections[ws.gameId].filter(
          (conn) => conn !== ws
        );
      }
    }
  });
});

app.get("/api/test", (req: Request, res: Response) => {
  res.json({ message: "Backend is working!" });
});

app.post("/api/games/:gameId/players", (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { playerId, name } = req.body;

  if (!games[gameId]) {
    games[gameId] = { players: {}, gameState: "waiting", pointsGained: [] };
  }

  games[gameId].players[playerId] = { name, score: 0 };

  // Broadcast to all clients in this game
  if (gameConnections[gameId]) {
    const message = JSON.stringify({
      type: "players_update",
      players: games[gameId].players,
    });
    gameConnections[gameId].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  res.json(games[gameId]);
});

app.get("/api/games/:gameId", (req: Request, res: Response) => {
  const { gameId } = req.params;
  res.json(games[gameId] || { players: {} });
});

app.post("/api/games/:gameId/start", (req: Request, res: Response) => {
  const { gameId } = req.params;
  if (!games[gameId]) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  games[gameId].gameState = "ready";

  if (gameConnections[gameId]) {
    const message = JSON.stringify({
      type: "game_state_update",
      gameState: games[gameId].gameState,
    });
    gameConnections[gameId].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  res.json(games[gameId]);
});

app.post("/api/games/:gameId/next-round", (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { playerId } = req.body;

  if (!games[gameId]) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  // Verify that the player exists in the game
  if (!games[gameId].players[playerId]) {
    res.status(403).json({ error: "Player not found in game" });
    return;
  }

  // Check if player's last skip was within 5 minutes
  const lastSkipTime = games[gameId].players[playerId].lastSkipTime;
  if (lastSkipTime) {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes in milliseconds
    if (lastSkipTime > fiveMinutesAgo) {
      res.status(429).json({
        error: "Please wait before skipping again",
        remainingTime: Math.ceil((lastSkipTime - fiveMinutesAgo) / 1000), // remaining seconds
      });
      return;
    }
  }

  // Track skip time if the game is already in round_started state
  if (games[gameId].gameState === "round_started") {
    games[gameId].players[playerId].lastSkipTime = Date.now();
  }

  games[gameId].votes = {};
  games[gameId].gameState = "round_started";

  const words = topics[Math.floor(Math.random() * topics.length)];
  const randomIndex = Math.floor(Math.random() * words.length);
  games[gameId].secretWord = words[randomIndex];

  // Randomly select a sus player from the list of players
  const playerIds = Object.keys(games[gameId].players);
  const randomPlayerIndex = Math.floor(Math.random() * playerIds.length);
  games[gameId].susPlayer = playerIds[randomPlayerIndex];

  // Send the countdown start and words update to all connected clients
  if (gameConnections[gameId]) {
    gameConnections[gameId].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
          type: "round_start",
          gameState: games[gameId].gameState,
          words: words,
          secretWord: games[gameId].secretWord,
          susPlayer: games[gameId].susPlayer,
          players: games[gameId].players,
        });
        client.send(message);
      }
    });
  }

  res.json({
    words,
    secretWord: games[gameId].secretWord,
    susPlayer: games[gameId].susPlayer,
  });
});

app.post("/api/games/:gameId/vote", (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { voterId, votedForId } = req.body;

  if (!games[gameId]) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  if (!games[gameId].votes) {
    games[gameId].votes = {};
  }

  games[gameId].votes[voterId] = votedForId;
  games[gameId].gameState = "voting_phase_1";

  // Check if everyone has voted
  const playerCount = Object.keys(games[gameId].players).length;
  const voteCount = Object.keys(games[gameId].votes).length;

  if (voteCount === playerCount) {
    // Calculate results
    const voteCounts: Record<string, number> = {};
    Object.values(games[gameId].votes).forEach((votedId) => {
      voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    });

    // Find highest vote count
    const maxVotes = Math.max(...Object.values(voteCounts));

    // Check for ties by counting how many players have maxVotes
    const playersWithMaxVotes = Object.entries(voteCounts).filter(
      ([_, votes]) => votes === maxVotes
    );

    // Only set mostVotedPlayer if there's exactly one player with max votes
    let mostVotedPlayer =
      playersWithMaxVotes.length === 1 ? playersWithMaxVotes[0][0] : "";

    games[gameId].pointsGained = [];

    if (mostVotedPlayer === games[gameId].susPlayer) {
      games[gameId].gameState = "voting_phase_2";
    } else {
      // Sus player wins
      if (games[gameId].susPlayer) {
        if (!games[gameId].pointsGained) {
          games[gameId].pointsGained = [];
        }
        // Award points to sus player
        games[gameId].players[games[gameId].susPlayer].score += 2;
        games[gameId].pointsGained.push({
          playerId: games[gameId].susPlayer,
          points: 2,
        });

        // Award points to players who voted for sus player
        Object.entries(games[gameId].votes).forEach(([voterId, votedForId]) => {
          if (votedForId === games[gameId].susPlayer) {
            games[gameId].players[voterId].score += 1;
            if (!games[gameId].pointsGained) {
              games[gameId].pointsGained = [];
            }
            games[gameId].pointsGained.push({
              playerId: voterId,
              points: 1,
            });
          }
        });
      }
      games[gameId].gameState = "review_results";
    }
  }

  // Broadcast updated game state
  if (gameConnections[gameId]) {
    const message = JSON.stringify({
      type: "game_state_update",
      gameState: games[gameId].gameState,
      players: games[gameId].players,
      votes: games[gameId].votes,
      susPlayer: games[gameId].susPlayer,
      pointsGained: games[gameId].pointsGained,
    });
    gameConnections[gameId].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  res.json({ success: true });
});

app.post("/api/games/:gameId/guess-word", (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { playerId, word } = req.body;

  if (!games[gameId]) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  if (playerId !== games[gameId].susPlayer) {
    res.status(403).json({ error: "Only the sus player can guess" });
    return;
  }

  games[gameId].pointsGained = [];

  // Check if the guessed word matches the secret word
  if (word === games[gameId].secretWord) {
    // Award point to sus player for correct guess
    games[gameId].players[playerId].score += 1;
    games[gameId].pointsGained.push({
      playerId: playerId,
      points: 1,
    });
  } else {
    // Award points to everyone else
    Object.keys(games[gameId].players).forEach((pid) => {
      if (pid !== games[gameId].susPlayer) {
        if (!games[gameId].pointsGained) {
          games[gameId].pointsGained = [];
        }
        games[gameId].players[pid].score += 2;
        games[gameId].pointsGained.push({
          playerId: pid,
          points: 2,
        });
      }
    });
  }

  games[gameId].gameState = "review_results";

  // Update WebSocket message to include pointsGained
  if (gameConnections[gameId]) {
    const message = JSON.stringify({
      type: "game_state_update",
      gameState: games[gameId].gameState,
      players: games[gameId].players,
      votes: games[gameId].votes,
      susPlayer: games[gameId].susPlayer,
      pointsGained: games[gameId].pointsGained,
    });
    gameConnections[gameId].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  res.json({ success: true });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
