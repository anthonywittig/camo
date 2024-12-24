import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { WaitingState } from "./components/WaitingState";
import { RoundStartedState } from "./components/RoundStartedState";
import { VotingPhase1State } from "./components/VotingPhase1State";
import { ReviewResultsState } from "./components/ReviewResultsState";
import { VotingPhase2State } from "./components/VotingPhase2State";

interface ApiResponse {
  message: string;
}

interface Game {
  players: Record<string, { name: string; score: number }>;
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
  votes?: Record<string, string>; // key: voterId, value: votedForId
  pointsGained?: {
    playerId: string;
    points: number;
  }[];
}

function App() {
  const [message, setMessage] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerId] = useState(() => uuidv4());
  const [game, setGame] = useState<Game>({
    players: {},
    gameState: "waiting",
    pointsGained: [],
  });
  const wsRef = useRef<WebSocket | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const isGameRoute = window.location.pathname.length > 1;
  const gameId = isGameRoute ? window.location.pathname.slice(1) : "";

  const wsUrl = `ws://${window.location.hostname}:5002`;

  useEffect(() => {
    fetch("/api/test")
      .then((response) => response.json())
      .then((data: ApiResponse) => setMessage(data.message))
      .catch((error) => {
        console.error("Error:", error);
        setShowWarning(true);
      });
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
              pointsGained: data.pointsGained || prevGame.pointsGained,
            }));
          } else if (data.type === "round_start") {
            setGame((prevGame) => ({
              ...prevGame,
              gameState: data.gameState,
              words: data.words,
              secretWord: data.secretWord,
              susPlayer: data.susPlayer,
              votes: {}, // Reset votes at the start of a new round
            }));
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

  const handleWordGuess = (word: string) => {
    fetch(`/api/games/${gameId}/guess-word`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId,
        word,
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
          <button onClick={goBack}>Quit</button>
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

        {game.gameState === "ready" && (
          <div>
            <h2>Get Ready!</h2>
            <p>The game is about to begin...</p>
            <p>All players have joined and we're preparing the first round.</p>
            <div className="players-list">
              <h3>Players:</h3>
              {Object.entries(game.players).map(([id, player]) => (
                <div key={id}>
                  {player.name} - Score: {player.score}
                </div>
              ))}
            </div>
            <button onClick={handleNextRound} style={{ marginTop: "20px" }}>
              Start Round
            </button>
          </div>
        )}

        {game.gameState === "round_started" && (
          <RoundStartedState
            secretWord={game.secretWord}
            susPlayer={game.susPlayer}
            playerId={playerId}
            words={game.words}
            players={game.players}
            onTransitionToVoting={() =>
              setGame((prevGame) => ({
                ...prevGame,
                gameState: "voting_phase_1",
              }))
            }
          />
        )}

        {game.gameState === "voting_phase_1" && (
          <VotingPhase1State
            players={game.players}
            playerId={playerId}
            votes={game.votes}
            handleVote={handleVote}
            words={game.words}
          />
        )}

        {game.gameState === "voting_phase_2" && (
          <VotingPhase2State
            words={game.words}
            playerId={playerId}
            susPlayer={game.susPlayer}
            handleWordGuess={handleWordGuess}
          />
        )}

        {game.gameState === "review_results" && (
          <ReviewResultsState
            players={game.players}
            susPlayer={game.susPlayer}
            votes={game.votes}
            handleNextRound={handleNextRound}
            words={game.words}
            secretWord={game.secretWord}
            pointsGained={game.pointsGained}
          />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>My Full Stack App</h1>
      {showWarning ? (
        <div style={{ color: "red", marginBottom: "20px" }}>
          Warning: Cannot connect to backend server. Please try again later.
        </div>
      ) : message ? (
        <>
          <p>Message from backend: {message}</p>
          <button onClick={createNewGame} style={{ marginBottom: "20px" }}>
            Create New Game
          </button>
        </>
      ) : (
        <p>Connecting to backend...</p>
      )}
    </div>
  );
}

export default App;
