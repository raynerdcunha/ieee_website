import React, { useState, useEffect } from 'react';
import { Menu, Zap, RotateCcw, Sun, Moon } from 'lucide-react';
import TopologyCopilot from './src/components/TopologyCopilot.jsx';
import './App.css'; 

function App() {
  const [sessionStatus, setSessionStatus] = useState("Not Started");
  const [sessionName, setSessionName] = useState("");
  const [initialData, setInitialData] = useState(null);
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
    const handlePopState = () => window.location.reload();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSessionNameChange = (newName) => {
    setSessionName(newName);
    window.history.pushState(null, '', newName ? `/${newName}` : '/');
  };

  const handleResetLayout = () => {
    console.log("Resetting topology map...");
  };

  return (
    <div 
      data-theme={currentTheme} 
      className="w-full h-screen flex flex-col bg-canvas text-primary overflow-hidden select-none"
    >
      {/* 1. TOP NAVIGATION HEADER BAR */}
      <header className="w-full h-14 min-h-14 flex items-center justify-between px-6 border-b border-subtle z-50">
        <div className="flex items-center gap-4">
          <button className="p-2 icon-muted hover:text-primary hover:bg-surface rounded-lg border border-subtle active:scale-95 transition-all">
            <Menu className="w-4 h-4" />
          </button>

          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-brand-soft border border-brand">
            <Zap className="w-4 h-4 text-brand animate-pulse" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-xs md:text-sm font-black tracking-wider uppercase">IEEE Standard Grid Dashboard</h1>
            <span className="text-[9px] md:text-[10px] text-secondary font-mono tracking-tight uppercase">Supervisory Control & Topological Analytics Copilot</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-telemetry-fill/20 border border-telemetry">
            <span className="relative flex h-2 w-2">
              {/* Added 'bg-telemetry' here to ensure the color is applied */}
              <span className="absolute inline-block h-full w-full rounded-full bg-telemetry telemetry-pulse"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-telemetry"></span>
            </span>
            <span className="tracking-wide uppercase font-bold text-[9px] md:text-[10px] text-telemetry">Telemetry Stream Active</span>
          </div>

          <button 
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-action bg-action hover:border-subtle font-mono text-[10px] md:text-xs font-bold uppercase active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Layout</span>
          </button>

          <button 
            onClick={() => setCurrentTheme(currentTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg border border-action bg-action hover:border-subtle text-primary active:scale-95 transition-all"
          >
            {currentTheme === "dark" ? (
              // MOON: Gentle pulse effect to mimic soft ambient night light
              <Moon className="w-4 h-4 text-brand animate-pulse" />
            ) : (
              // SUN: Crisp rotation effect for the "shifting into light" feel
              // Inside your return statement, look for the Sun component:
              <Sun className="w-4 h-4 icon-sun" />
            )}
          </button>
        </div>
      </header>

      {/* 2. LOWER WORKING AREA */}
      <main className="w-full flex-1 flex justify-end items-end p-4 relative overflow-hidden">
        <div className="w-[30%] h-full flex justify-end items-end relative">
          <div style={{ width: '123.333%', height: '123.333%', transform: 'scale(0.81081)', transformOrigin: 'bottom right', position: 'absolute', bottom: 0, right: 0 }}>
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
      </main>
    </div>
  );
}

export default App;