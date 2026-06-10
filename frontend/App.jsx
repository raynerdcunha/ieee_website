import React, { useState, useEffect } from 'react';
import TopologyCopilot from './src/components/TopologyCopilot.jsx';

function App() {
  // 1. FIXED: Set the initial default state to "Not Started" instead of hardcoding "Active"
  const [sessionStatus, setSessionStatus] = useState("Not Started");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/health");
        const data = await response.json();
        if (data.status === "online") {
          // If you want your health check to force it active immediately, keep this.
          // Otherwise, your terminal's /api/init will handle setting "Not Started".
          setSessionStatus("Not Started"); 
        }
      } catch (err) {
        console.log("Backend not reachable");
        setSessionStatus("Offline");
      }
    };
    checkBackend();
  }, []);

  // 2. FIXED: Passed setStatus down so the terminal can talk back to the parent component
  return (
    <TopologyCopilot 
      status={sessionStatus} 
      setStatus={setSessionStatus} 
    />
  );
}

export default App;