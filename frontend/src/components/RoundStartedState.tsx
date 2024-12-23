interface RoundStartedStateProps {
  countdown: number | null;
  showSecretWord: boolean;
  secretWord?: string;
  susPlayer?: string;
  playerId: string;
  words?: string[];
  players: Record<string, { name: string; score: number }>;
}

export function RoundStartedState({
  countdown,
  showSecretWord,
  secretWord,
  susPlayer,
  playerId,
  words,
  players,
}: RoundStartedStateProps) {
  return (
    <>
      <div style={{ margin: "20px 0" }}>
        <h3>Players in game:</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {Object.entries(players).map(([id, player]) => (
            <li key={id}>
              <span>
                {player.name}: {player.score}
              </span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: "20px" }}>
          {countdown !== null && (
            <div style={{ fontSize: "24px", margin: "10px 0" }}>
              {countdown}
            </div>
          )}
          {showSecretWord && (
            <div
              style={{ fontSize: "24px", margin: "10px 0", color: "#646cff" }}
            >
              {susPlayer === playerId ? "you sus" : secretWord}
            </div>
          )}
        </div>
      </div>

      {words && (
        <div style={{ marginTop: "20px" }}>
          <h3>Words:</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {words.map((word, index) => (
              <li key={index}>{word}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
