import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { v4 as uuidv4 } from "uuid";

interface ApiResponse {
  message: string;
}

function App() {
  const [message, setMessage] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const isGameRoute = window.location.pathname.length > 1;

  useEffect(() => {
    fetch("/api/test")
      .then((response) => response.json())
      .then((data: ApiResponse) => setMessage(data.message))
      .catch((error) => console.error("Error:", error));
  }, []);

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
          <button onClick={toggleQR}>
            {showQR ? "Hide QR Code" : "Show QR Code"}
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

        {showQR && (
          <div style={{ marginTop: "20px" }}>
            <QRCodeSVG value={window.location.href} size={256} level="H" />
          </div>
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
