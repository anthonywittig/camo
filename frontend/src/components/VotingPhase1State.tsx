import { WordsList } from "./WordsList";

interface VotingPhase1StateProps {
  players: Record<string, { name: string; score: number }>;
  playerId: string;
  votes?: Record<string, string>;
  handleVote: (votedForId: string) => void;
  words?: string[];
}

export function VotingPhase1State({
  players,
  playerId,
  votes,
  handleVote,
  words,
}: VotingPhase1StateProps) {
  return (
    <div style={{ margin: "20px 0" }}>
      <h3>Players in game:</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {Object.entries(players).map(([id, player]) => (
          <li key={id}>
            {id !== playerId ? (
              <button
                onClick={() => handleVote(id)}
                style={{
                  margin: "5px 0",
                  width: "100%",
                  maxWidth: "200px",
                  backgroundColor: "#646cff",
                  color: "white",
                }}
              >
                Vote for {player.name}
              </button>
            ) : (
              <span>
                {player.name}: {player.score}
                {votes && votes[playerId] && " (You voted)"}
              </span>
            )}
          </li>
        ))}
      </ul>
      {words && <WordsList words={words} />}
    </div>
  );
}
