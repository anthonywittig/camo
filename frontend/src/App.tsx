import { useState, useEffect } from "react";

interface ApiResponse {
  message: string;
}

function App() {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch("http://localhost:5001/api/test")
      .then((response) => response.json())
      .then((data: ApiResponse) => setMessage(data.message))
      .catch((error) => console.error("Error:", error));
  }, []);

  return (
    <div className="App">
      <h1>My Full Stack App</h1>
      <p>Message from backend: {message}</p>
    </div>
  );
}

export default App;
