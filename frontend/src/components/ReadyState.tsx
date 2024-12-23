import { FC } from "react";

interface ReadyStateProps {
  players: Record<string, { name: string; score: number }>;
  handleNextRound: () => void;
}

export const ReadyState: FC<ReadyStateProps> = ({
  players,
  handleNextRound,
}) => {
  return (
    <div className="ready-state">
      <h2>Game Ready!</h2>

      <div className="players-list" style={{ marginBottom: "20px" }}>
        <h3>Players:</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {Object.entries(players).map(([id, player]) => (
            <li key={id}>
              {player.name} - Score: {player.score}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={handleNextRound}>Start First Round</button>
    </div>
  );
};
