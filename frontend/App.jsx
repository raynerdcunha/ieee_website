import React, { useState, useEffect } from 'react';
import TopologyCopilot from './src/components/TopologyCopilot.jsx';

function App() {
  const [sessionStatus, setSessionStatus] = useState("Not Started");
  const [sessionName, setSessionName] = useState("");
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const initializeSystem = async () => {
      const pathSlug = window.location.pathname.replace(/^\//, '').trim();

      try {
        if (pathSlug) {
          const response = await fetch(`http://127.0.0.1:8000/api/session/${pathSlug}`, {
            method: "GET",
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
          });
          const data = await response.json();

          if (data.status === "INVALID") {
            window.history.pushState(null, '', '/');
            setSessionStatus("Not Started");
            setSessionName("");
            setInitialData({
              reply: `Session rejected: ${data.reply}`,
              timestamp: data.timestamp
            });
          } else {
            setSessionStatus(data.status);
            setSessionName(data.session_name || pathSlug);
            setInitialData(data);
          }
        } else {
          const response = await fetch("http://127.0.0.1:8000/api/init", {
            method: "GET",
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
          });
          const data = await response.json();
          
          setSessionStatus(data.status);
          setSessionName("");
          setInitialData(data);
        }
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

    const handlePopState = () => {
      window.location.reload();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync state and push URL parameter ONLY when the name is locked in (not empty)
  const handleSessionNameChange = (newName) => {
    setSessionName(newName);
    if (newName) {
      window.history.pushState(null, '', `/${newName}`);
    } else {
      window.history.pushState(null, '', '/');
    }
  };

  return (
    <div className="w-full h-[600px] p-4 flex flex-col bg-[#020617]">
      <TopologyCopilot 
        status={sessionStatus} 
        setStatus={setSessionStatus}
        sessionName={sessionName}        
        setSessionName={handleSessionNameChange}  
        initialData={initialData}
      />
    </div>
  );
}

export default App;