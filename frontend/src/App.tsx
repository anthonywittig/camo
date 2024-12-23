import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { v4 as uuidv4 } from "uuid";
import { WaitingState } from "./components/WaitingState";
import { RoundStartedState } from "./components/RoundStartedState";
import { VotingState } from "./components/VotingState";
import { ReviewResultsState } from "./components/ReviewResultsState";

interface ApiResponse {
  message: string;
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
  votes?: Record<string, string>; // key: voterId, value: votedForId
}

function App() {
  const [message, setMessage] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerId] = useState(() => uuidv4());
  const [game, setGame] = useState<Game>({ players: {}, gameState: "waiting" });
  const wsRef = useRef<WebSocket | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showSecretWord, setShowSecretWord] = useState(false);

  const isGameRoute = window.location.pathname.length > 1;
  const gameId = isGameRoute ? window.location.pathname.slice(1) : "";

  const wsUrl = `ws://${window.location.hostname}:5002`;

  useEffect(() => {
    fetch("/api/test")
      .then((response) => response.json())
      .then((data: ApiResponse) => setMessage(data.message))
      .catch((error) => console.error("Error:", error));
  }, []);

  useEffect(() => {
    if (isGameRoute) {
      // Connect to WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Join the specific game room
        ws.send(JSON.stringify({ type: "join", gameId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "players_update") {
            setGame((prevGame) => ({ ...prevGame, players: data.players }));
          } else if (data.type === "game_state_update") {
            setGame((prevGame) => ({
              ...prevGame,
              gameState: data.gameState,
              votes: data.votes,
              players: data.players || prevGame.players,
            }));
          } else if (data.type === "round_start") {
            setGame((prevGame) => ({
              ...prevGame,
              words: data.words,
              secretWord: data.secretWord,
              susPlayer: data.susPlayer,
              votes: {}, // Reset votes at the start of a new round
            }));
            // Start countdown for all players
            setCountdown(5);
            const timer = setInterval(() => {
              setCountdown((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                  clearInterval(timer);
                  setShowSecretWord(true);
                  setTimeout(() => {
                    setShowSecretWord(false);
                    setGame((prevGame) => ({
                      ...prevGame,
                      gameState: "voting",
                    }));
                  }, 3000);
                  return null;
                }
                return prev - 1;
              });
            }, 1000);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      return () => {
        ws.close();
      };
    }
  }, [gameId, isGameRoute]);

  useEffect(() => {
    if (isGameRoute && playerName) {
      fetch(`/api/games/${gameId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, name: playerName }),
      }).catch((error) => console.error("Error:", error));
    }
  }, [gameId, playerId, playerName, isGameRoute]);

  const toggleQR = () => {
    setShowQR(!showQR);
  };

  const createNewGame = () => {
    const gameId = uuidv4();
    window.location.href = `/${gameId}`;
  };

  const goBack = () => {
    window.location.href = "/";
  };

  const startGame = () => {
    fetch(`/api/games/${gameId}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((error) => console.error("Error:", error));
  };

  const handleNextRound = () => {
    fetch(`/api/games/${gameId}/next-round`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((error) => console.error("Error:", error));
  };

  const handleVote = (votedForId: string) => {
    fetch(`/api/games/${gameId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voterId: playerId,
        votedForId,
      }),
    }).catch((error) => console.error("Error:", error));
  };

  if (isGameRoute) {
    return (
      <div className="App">
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <button onClick={goBack}>Back</button>
        </div>

        {game.gameState === "waiting" && (
          <WaitingState
            playerName={playerName}
            setPlayerName={setPlayerName}
            showQR={showQR}
            toggleQR={toggleQR}
            startGame={startGame}
            players={game.players}
          />
        )}

        {game.gameState === "round_started" && (
          <RoundStartedState
            countdown={countdown}
            showSecretWord={showSecretWord}
            secretWord={game.secretWord}
            susPlayer={game.susPlayer}
            playerId={playerId}
            words={game.words}
            players={game.players}
          />
        )}

        {game.gameState === "voting" && (
          <VotingState
            players={game.players}
            playerId={playerId}
            votes={game.votes}
            handleVote={handleVote}
          />
        )}

        {game.gameState === "review_results" && (
          <ReviewResultsState
            players={game.players}
            susPlayer={game.susPlayer}
            votes={game.votes}
            handleNextRound={handleNextRound}
          />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>My Full Stack App</h1>
      <p>Message from backend: {message}</p>

      <button onClick={createNewGame} style={{ marginBottom: "20px" }}>
        Create New Game
      </button>

      <button onClick={toggleQR}>
        {showQR ? "Hide QR Code" : "Show QR Code"}
      </button>

      {showQR && (
        <div style={{ marginTop: "20px" }}>
          <QRCodeSVG value={window.location.href} size={256} level="H" />
        </div>
      )}
    </div>
  );
}

export default App;
