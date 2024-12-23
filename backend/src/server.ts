import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { WebSocket, WebSocketServer } from "ws";

interface Player {
  name: string;
}

interface Game {
  players: Record<string, Player>;
  gameState: "waiting" | "in-progress";
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

  games[gameId].players[playerId] = { name };

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
  games[gameId].gameState = "in-progress";

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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
