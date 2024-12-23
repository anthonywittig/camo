import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

interface Player {
  name: string;
  score: number;
}

interface Game {
  players: Record<string, { name: string; score: number }>;
  gameState:
    | "waiting"
    | "ready"
    | "round_started"
    | "voting"
    | "review_results";
  words?: string[];
  secretWord?: string;
  susPlayer?: string;
  votes?: Record<string, string>;
}

const games: Record<string, Game> = {};

dotenv.config();

const app: Express = express();
const port = 5001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Add after your Express app initialization
const wss = new WebSocketServer({ port: 5002 });

// Store WebSocket connections by gameId
const gameConnections: Record<string, WebSocket[]> = {};

wss.on("connection", (ws: WebSocket) => {
  let clientGameId: string;

  ws.on("message", (message: string) => {
    const data = JSON.parse(message);
    if (data.type === "join") {
      clientGameId = data.gameId;
      if (!gameConnections[clientGameId]) {
        gameConnections[clientGameId] = [];
      }
      gameConnections[clientGameId].push(ws);

      // Send current players list to the newly connected client
      if (games[clientGameId]) {
        ws.send(
          JSON.stringify({
            type: "players_update",
            players: games[clientGameId].players,
          })
        );
      }
    }
  });

  ws.on("close", () => {
    if (clientGameId && gameConnections[clientGameId]) {
      gameConnections[clientGameId] = gameConnections[clientGameId].filter(
        (conn) => conn !== ws
      );
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
    games[gameId] = { players: {}, gameState: "waiting" };
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
  if (!games[gameId]) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  games[gameId].votes = {};
  games[gameId].gameState = "round_started";

  const words = ["apple", "salsa", "pop", uuidv4()];
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
  games[gameId].gameState = "voting";

  // Check if everyone has voted
  const playerCount = Object.keys(games[gameId].players).length;
  const voteCount = Object.keys(games[gameId].votes).length;

  if (voteCount === playerCount) {
    // Calculate results
    const voteCounts: Record<string, number> = {};
    Object.values(games[gameId].votes).forEach((votedId) => {
      voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    });

    // Find player with most votes
    let maxVotes = 0;
    let mostVotedPlayer = "";
    Object.entries(voteCounts).forEach(([playerId, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        mostVotedPlayer = playerId;
      }
    });

    // Award points
    if (mostVotedPlayer === games[gameId].susPlayer) {
      // Non-sus players win
      Object.entries(games[gameId].players).forEach(([playerId, player]) => {
        if (playerId !== games[gameId].susPlayer) {
          games[gameId].players[playerId].score += 1;
        }
      });
    } else {
      // Sus player wins
      if (games[gameId].susPlayer) {
        games[gameId].players[games[gameId].susPlayer].score += 2;
      }
    }

    games[gameId].gameState = "review_results";
  }

  // Broadcast updated game state
  if (gameConnections[gameId]) {
    const message = JSON.stringify({
      type: "game_state_update",
      gameState: games[gameId].gameState,
      players: games[gameId].players,
      votes: games[gameId].votes,
      susPlayer: games[gameId].susPlayer,
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
