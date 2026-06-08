import React, { useState, useEffect } from 'react';
import TopologyCopilot from './src/components/TopologyCopilot.jsx';

function App() {
  const [sessionStatus, setSessionStatus] = useState("Active");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/health");
        const data = await response.json();
        if (data.status === "online") {
          setSessionStatus("Active");
        }
      } catch (err) {
        console.log("Backend not reachable");
        setSessionStatus("Offline");
      }
    };
    checkBackend();
  }, []);

  return <TopologyCopilot status={sessionStatus} />;
}

export default App;