import { PlayersList } from "./PlayersList";

interface WaitingStateProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  startGame: () => void;
  players: Record<string, { name: string; score: number }>;
}

export function WaitingState({
  playerName,
  setPlayerName,
  startGame,
  players,
}: WaitingStateProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={startGame}
          style={{
            backgroundColor: "#646cff",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
          }}
        >
          Start Game
        </button>
      </div>

      <div style={{ margin: "20px 0" }}>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          style={{
            padding: "0.6em 1.2em",
            borderRadius: "8px",
            border: "1px solid #646cff",
            backgroundColor: "transparent",
            fontSize: "1em",
            fontFamily: "inherit",
          }}
        />
      </div>

      <PlayersList players={players} />
    </>
  );
}
