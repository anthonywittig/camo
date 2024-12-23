import { QRCodeSVG } from "qrcode.react";

interface WaitingStateProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  showQR: boolean;
  toggleQR: () => void;
  startGame: () => void;
  players: Record<string, { name: string; score: number }>;
}

export function WaitingState({
  playerName,
  setPlayerName,
  showQR,
  toggleQR,
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
        <button onClick={toggleQR}>
          {showQR ? "Hide QR Code" : "Show QR Code"}
        </button>
        <button onClick={startGame}>Start Game</button>
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
      </div>

      {showQR && (
        <div style={{ marginTop: "20px" }}>
          <QRCodeSVG value={window.location.href} size={256} level="H" />
        </div>
      )}
    </>
  );
}