import { PlayersList } from "./PlayersList";
import { WordsList } from "./WordsList";

interface ReviewResultsStateProps {
  players: Record<string, { name: string; score: number }>;
  susPlayer?: string;
  votes?: Record<string, string>;
  handleNextRound: () => void;
  words?: string[];
}

export function ReviewResultsState({
  players,
  susPlayer,
  votes,
  handleNextRound,
  words,
}: ReviewResultsStateProps) {
  return (
    <div
      style={{
        marginTop: "20px",
        padding: "20px",
        border: "1px solid #646cff",
        borderRadius: "8px",
      }}
    >
      <h3>Results:</h3>
      <p style={{ color: "#646cff" }}>
        The sus player was: {players[susPlayer || ""].name}
      </p>

      <PlayersList players={players} title="Final Scores:" />

      <h4>Votes:</h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {Object.entries(votes || {}).map(([voterId, votedForId]) => (
          <li key={voterId}>
            {players[voterId].name} voted for {players[votedForId].name}
          </li>
        ))}
      </ul>

      {words && <WordsList words={words} />}

      <button
        onClick={handleNextRound}
        style={{
          marginTop: "20px",
          backgroundColor: "#646cff",
          color: "white",
          padding: "10px 20px",
          borderRadius: "8px",
        }}
      >
        Next Round
      </button>
    </div>
  );
}
