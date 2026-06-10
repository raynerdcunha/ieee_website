import React, { useState, useEffect } from 'react';
import TopologyCopilot from './src/components/TopologyCopilot.jsx';

function App() {
  const [sessionStatus, setSessionStatus] = useState("Not Started");
  const [sessionName, setSessionName] = useState("");
  const [initialData, setInitialData] = useState(null);
  /* STATE TRACKING: Holds theme preferences, defaulting to dark mode layout configurations */
  const [currentTheme, setCurrentTheme] = useState("dark");

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

          if (data.status === "INVALID" || data.status === "NOT_FOUND") {
            window.history.pushState(null, '', '/'); 
            setSessionStatus("Not Started");
            setSessionName("");
            
            setInitialData({
              reply: data.status === "INVALID" ? `Session rejected: ${data.reply}` : `Redirected: ${data.reply}`,
              timestamp: data.timestamp
            });
          } else {
            setSessionStatus("Active"); 
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

  const handleSessionNameChange = (newName) => {
    setSessionName(newName);
    if (newName) {
      window.history.pushState(null, '', `/${newName}`);
    } else {
      window.history.pushState(null, '', '/');
    }
  };

  return (
    /* Outer layout remains full screen and securely positions the panel in the bottom right corner */
    <div className="w-full h-full min-h-screen flex justify-end items-end bg-[#020617] p-4 overflow-hidden">
      
      {/* THE PERFECT FIX: 
        1. Outer bounding box enforces the exact target proportions on your viewport: 30% width, 81.081% height.
        2. Flex layouts push content to the bottom right edge internally.
        3. Scaled inner layout component remains 100% visible with a uniform scaling matrix applied smoothly.
      */}
      <div className="w-[30%] h-[93%] flex justify-end items-end relative">
        <div 
          style={{
            width: '123.333%',   // Math to cleanly invert 30% back to its 37% base canvas width
            height: '123.333%',  // Math to cleanly invert 81.081% back to its 100% base height
            transform: 'scale(0.81081)',
            transformOrigin: 'bottom right',
            position: 'absolute',
            bottom: 0,
            right: 0
          }}
        >
          <TopologyCopilot 
            status={sessionStatus} 
            setStatus={setSessionStatus}
            sessionName={sessionName}        
            setSessionName={handleSessionNameChange}  
            initialData={initialData}
            currentTheme={currentTheme}
          />
        </div>
      </div>

    </div>
  );
}

export default App;