import React, { useState, useEffect } from 'react';
import TopologyCopilot from './src/components/TopologyCopilot.jsx';

function App() {
  const [sessionStatus, setSessionStatus] = useState("Not Started");
  const [sessionName, setSessionName] = useState(""); // Track the session name state
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/init", {
          method: "GET",
          headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
        });
        const data = await response.json();
        
        setSessionStatus(data.status);
        setSessionName(data.session_name || "");
        setInitialData(data);
      } catch (err) {
        console.error("Backend unreachable on startup:", err);
        setSessionStatus("Offline");
        setInitialData({
          reply: "Connection failure: Terminal backend offline.",
          timestamp: new Date().toLocaleTimeString()
        });
      }
    };
    initializeSystem();
  }, []);

  return (
    <TopologyCopilot 
      status={sessionStatus} 
      setStatus={setSessionStatus}
      sessionName={sessionName}        // Pass name state down
      setSessionName={setSessionName}  // Pass name modifier down
      initialData={initialData}
    />
  );
}

export default App;