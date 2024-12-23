import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ApiResponse {
  message: string;
}

function App() {
  const [message, setMessage] = useState<string>("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetch("/api/test")
      .then((response) => response.json())
      .then((data: ApiResponse) => setMessage(data.message))
      .catch((error) => console.error("Error:", error));
  }, []);

  const toggleQR = () => {
    setShowQR(!showQR);
  };

  return (
    <div className="App">
      <h1>My Full Stack App</h1>
      <p>Message from backend: {message}</p>

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
