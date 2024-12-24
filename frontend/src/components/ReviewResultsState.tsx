import { PlayersList } from "./PlayersList";
import { WordsList } from "./WordsList";

interface ReviewResultsStateProps {
  players: Record<string, { name: string; score: number }>;
  susPlayer?: string;
  votes?: Record<string, string>;
  handleNextRound: () => void;
  words?: string[];
  secretWord?: string;
  pointsGained?: {
    playerId: string;
    points: number;
  }[];
}

export function ReviewResultsState({
  players,
  susPlayer,
  votes,
  handleNextRound,
  words,
  secretWord,
  pointsGained = [],
}: ReviewResultsStateProps) {
  return (
    <>
      <h3>Results:</h3>
      <p style={{ color: "#646cff" }}>
        The sus player was: {players[susPlayer || ""].name}
      </p>

      <h4>Votes:</h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {Object.entries(votes || {}).map(([voterId, votedForId]) => (
          <li
            key={voterId}
            style={{
              color: votedForId === susPlayer ? "#646cff" : "inherit",
            }}
          >
            {players[voterId].name} voted for {players[votedForId].name}
          </li>
        ))}
      </ul>

      <p>
        The secret word was: <strong>{secretWord}</strong>
      </p>

      <div style={{ margin: "10px 0" }}>
        <h4>Points Gained:</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pointsGained.map(({ playerId, points }, index) => (
            <li key={index}>
              {players[playerId].name}: +{points} points
            </li>
          ))}
        </ul>
      </div>

      <PlayersList players={players} title="Scores:" />

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
    </>
  );
}
