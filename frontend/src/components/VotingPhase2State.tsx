interface VotingPhase2StateProps {
  words?: string[];
  playerId: string;
  susPlayer?: string;
  handleWordGuess: (word: string) => void;
}

export function VotingPhase2State({
  words,
  playerId,
  susPlayer,
  handleWordGuess,
}: VotingPhase2StateProps) {
  if (!words || playerId !== susPlayer) {
    return <div>Waiting for sus player to guess...</div>;
  }

  return (
    <div style={{ margin: "20px 0" }}>
      <h3>You are the sus player! Choose the secret word:</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {words.map((word, index) => (
          <button
            key={index}
            onClick={() => handleWordGuess(word)}
            style={{
              margin: "5px auto",
              width: "100%",
              maxWidth: "200px",
              backgroundColor: "#646cff",
              color: "white",
            }}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
