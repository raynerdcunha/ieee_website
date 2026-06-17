/* frontend/App.jsx */

import React, { useState, useEffect } from 'react';
import { Menu, Zap, RotateCcw, Sun, Moon } from 'lucide-react';
import TopologyCopilot from './src/components/TopologyCopilot.jsx';
import './App.css'; 
import ChatPanel from './src/components/ChatPanel.jsx';

function App() {
  const [sessionStatus, setSessionStatus] = useState("Not Started");
  const [sessionName, setSessionName] = useState("");
  const [initialData, setInitialData] = useState(null);
  
  // Instantly intercept browser disk memory on initial frame load, defaulting cleanly to 'light'
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('ieee-dashboard-theme') || 'light';
  });
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionList, setSessionList] = useState([]);

  // --- BRANCHING MODAL STATES ---
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchNameInput, setBranchNameInput] = useState("");
  const [branchError, setBranchError] = useState("");

  // Natively update browser local storage disk space whenever theme state changes
  useEffect(() => {
    localStorage.setItem('ieee-dashboard-theme', currentTheme);
  }, [currentTheme]);

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

  const fetchAllSessions = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/list-sessions");
      const data = await response.json();
      setSessionList(data);
    } catch (err) {
      console.error("Registry mapping breakdown reaching server filesystem:", err);
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      fetchAllSessions();
    }
  }, [isChatOpen]);

  // --- TRIGGER ACTION FOR BRANCHING ---
  const handleOpenBranchModal = () => {
    if (sessionStatus === "Not Started" || !sessionName) return;
    
    const croppedBase = sessionName.slice(0, 13);
    setBranchNameInput(`B_${croppedBase}`);
    setBranchError("");
    setBranchModalOpen(true);
  };

  // --- SUBMIT WORKSPACE DUPLICATION PIPELINE ---
  const submitBranchSession = async () => {
    const trimmedName = branchNameInput.trim();
    setBranchError("");

    if (!trimmedName) {
      setBranchError("Session name cannot be empty.");
      return;
    }
    if (trimmedName.length >= 18) {
      setBranchError("Session name must be under 18 characters.");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/session/${encodeURIComponent(sessionName)}/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });
      
      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        setBranchModalOpen(false);
        handleSessionNameChange(data.new_session);
        window.location.reload(); 
        return;
      } else {
        setBranchError(data.message || "Failed to create branch session.");
      }
    } catch (err) {
      console.error("Transmission error cloning file track:", err);
      setBranchError("Server connectivity loss during replication sequence.");
    }
  };

  return (
    <div 
      data-theme={currentTheme} 
      className="w-full h-screen flex flex-col bg-canvas text-primary overflow-hidden select-none"
    >
      {/* 1. TOP NAVIGATION HEADER BAR */}
      <header className="w-full h-14 min-h-14 flex items-center justify-between px-6 border-b border-subtle z-50">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="p-2 icon-muted hover:text-primary hover:bg-surface rounded-lg border border-subtle active:scale-95 transition-all cursor-pointer"
          >
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
              <span className="absolute inline-block h-full w-full rounded-full bg-telemetry telemetry-pulse"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-telemetry"></span>
            </span>
            <span className="tracking-wide uppercase font-bold text-[9px] md:text-[10px] text-telemetry">Telemetry Stream Active</span>
          </div>

          <button 
            type="button"
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-action bg-action hover:border-subtle font-mono text-[10px] md:text-xs font-bold uppercase active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Layout</span>
          </button>

          <button 
            type="button"
            onClick={() => setCurrentTheme(currentTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg border border-action bg-action hover:border-subtle text-primary active:scale-95 transition-all cursor-pointer"
          >
            {currentTheme === "dark" ? (
              <Moon className="w-4 h-4 text-brand animate-pulse" />
            ) : (
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
              onBranchClick={handleOpenBranchModal} 
            />
          </div>
        </div>
      </main>

      {/* 3. CHAT PANEL OVERLAY REGISTRY DRAWER */}
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        sessions={sessionList} 
        currentSessionName={sessionName}
        onDeleteSuccess={fetchAllSessions} 
      />

      {/* --- CUSTOM OVERLAY MODAL: Branch Chat Session --- */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBranchModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 dark:bg-[#070D1E] border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 z-10 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 font-sans">
              Branch Chat Session
            </h3>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Enter a unique name to clone your ongoing simulation history into a separate parallel session trace.
            </p>
            
            <div className="flex flex-col gap-1 mt-1">
              <input 
                type="text"
                value={branchNameInput}
                onChange={(e) => setBranchNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitBranchSession()}
                placeholder="Branch name..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                maxLength={17}
              />
              {branchError && (
                <span className="text-[10px] text-red-400 font-semibold font-sans px-1 mt-1">
                  ⚠️ {branchError}
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2 text-[11px] font-bold mt-1">
              <button
                type="button"
                onClick={() => setBranchModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitBranchSession}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer font-sans"
              >
                Confirm Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;