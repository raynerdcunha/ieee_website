/* src/App.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Zap, RotateCcw, Sun, Moon, History, Hourglass, X } from 'lucide-react';
import TopologyCopilot from './src/components/TopologyCopilot.jsx';
import BusTopologyMap from './src/components/BusTopologyMap.jsx';
import AnalyticsStreamGallery from './src/components/AnalyticsStreamGallery.jsx';
import ChatPanel from './src/components/ChatPanel.jsx';
import './App.css';

function App() {
  const [sessionStatus, setSessionStatus] = useState("Not Started");
  const [sessionName, setSessionName] = useState("");
  const [sessionStage, setSessionStage] = useState(1); // Master component stage indicator for standard view
  const [refreshTick, setRefreshTick] = useState(0); // Live grid modification update broadcaster

  // --- TIME TRAVEL & HISTORICAL STATE CORE ---
  const [historicalMessage, setHistoricalMessage] = useState(null);

  // --- DYNAMIC GRAPH TELEMETRY ARRAYS ---
  const [sessionData, setSessionData] = useState({ active: null });
  const [userPromptOutput, setUserPromptOutput] = useState(null);

  // --- INITIAL DATA ARCHIVE PROFILES ---
  const [initialDataA, setInitialDataA] = useState(null);
  const [initialDataB, setInitialDataB] = useState(null);
  const [initialDataC, setInitialDataC] = useState(null);

  // --- MULTI-SESSION INDEPENDENT STAGE CORES ---
  const [stageA, setStageA] = useState(1);
  const [stageB, setStageB] = useState(1);
  const [stageC, setStageC] = useState(1);

  // --- FULLSCREEN EXPANSION CONTROLLER ---
  const [fullscreenSession, setFullscreenSession] = useState(null); // Tracks { sessionName: string, stage: number }

  // --- DRAGGABLE INTERFACE SPLIT ENGINE ---
  const [widths, setWidths] = useState([33.33, 33.33, 33.34]);
  const containerRef = useRef(null);
  const dragInfoRef = useRef({ isDragging: false, handleIndex: -1, startX: 0, startWidths: [] });

  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('ieee-dashboard-theme') || 'dark';
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionList, setSessionList] = useState([]);

  // --- REPLICATION CONFIGURATION MODALS ---
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchNameInput, setBranchNameInput] = useState("");
  const [branchError, setBranchError] = useState("");
  const [branchType, setBranchType] = useState("chat"); // Tracks "chat" (B_) or "state" (C_)

  // --- COMPARA-MATRIX ROUTING AND CHANNELS ---
  const [layoutMode, setLayoutMode] = useState("analytics");
  const [sessionA, setSessionA] = useState("");
  const [sessionB, setSessionB] = useState("");
  const [sessionC, setSessionC] = useState("");
  const [sessionD, setSessionD] = useState("");
  const [selectTrackB, setSelectTrackB] = useState("");
  const [selectTrackC, setSelectTrackC] = useState("");
  const [selectTrackD, setSelectTrackD] = useState("");
  const [stageD, setStageD] = useState(1);
  const [initialDataD, setInitialDataD] = useState(null);
  
  // MODALS
  const [layoutSelectionModalOpen, setLayoutSelectionModalOpen] = useState(false);
  const [sessionSelectionModalOpen, setSessionSelectionModalOpen] = useState(false);
  const [selectedLayoutType, setSelectedLayoutType] = useState(null);
  const [compareError, setCompareError] = useState("");

  useEffect(() => {
    localStorage.setItem('ieee-dashboard-theme', currentTheme);
  }, [currentTheme]);

  // --- LIVE TELEMETRY STREAM FEED AUTOMATION ENGINE ---
  useEffect(() => {
    if (!sessionName || sessionStatus === "Not Started") {
      setSessionData({ active: null });
      return;
    }

    const syncPipelineDataStream = async () => {
      try {
        const url = historicalMessage?.state_seq_id 
          ? `http://127.0.0.1:8000/api/topology/historical?session_name=${encodeURIComponent(sessionName)}&state_seq_id=${historicalMessage.state_seq_id}`
          : `http://127.0.0.1:8000/api/topology?session_name=${encodeURIComponent(sessionName)}`;

        const res = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
        const gridGraphPayload = await res.json();
        
        if (gridGraphPayload && (gridGraphPayload.v || gridGraphPayload.p || gridGraphPayload.q)) {
          setSessionData({
            active: {
              v: gridGraphPayload.v || [],
              p: gridGraphPayload.p || [],
              q: gridGraphPayload.q || []
            }
          });
        }
      } catch (err) {
        console.error("Critical grid matrix synchronization failure:", err);
      }
    };

    syncPipelineDataStream();
  }, [sessionName, sessionStatus, refreshTick, historicalMessage]);

  useEffect(() => {
    const initializeSystem = async () => {
      const pathName = window.location.pathname;
      if (pathName === '/compare') {
        const searchParams = new URLSearchParams(window.location.search);
        const s1 = searchParams.get('s1') || "";
        const s2 = searchParams.get('s2') || "";
        const s3 = searchParams.get('s3') || "";
        const s4 = searchParams.get('s4') || "";
        const mode = searchParams.get('mode') || "3-column";
        setLayoutMode(mode);
        setSessionA(s1);
        setSessionB(s2);
        setSessionC(s3);
        setSessionD(s4);
        setSessionName(s1);
        setSessionStatus("Multi-Active");
        setWidths([33.33, 33.33, 33.34]);

        const loadSlotData = async (sessionName, setInitialData, setStage) => {
          if (!sessionName) return;
          try {
            const res = await fetch(`http://127.0.0.1:8000/api/session/${encodeURIComponent(sessionName)}`, {
              method: "GET",
              headers: { "Cache-Control": "no-cache" }
            });
            const data = await res.json();
            setInitialData(data);
            setStage(data.stage || 1);
          } catch (err) {
            console.error(`Failed to fetch session ${sessionName}:`, err);
          }
        };

        try {
          await loadSlotData(s1, setInitialDataA, setStageA);
          await loadSlotData(s2, setInitialDataB, setStageB);
          await loadSlotData(s3, setInitialDataC, setStageC);
          await loadSlotData(s4, setInitialDataD, setStageD);
          if (s1) {
            setSessionStage(stageA);
          }
        } catch (err) {
          console.error("Failed to parse cross-comparative data array profiles:", err);
          setInitialDataA({ history: [] });
          setInitialDataB({ history: [] });
          setInitialDataC({ history: [] });
          setInitialDataD({ history: [] });
        }
        return;
      }

      const pathSlug = pathName.replace(/^\//, '').trim();
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
            setSessionStage(1);
            setInitialDataA(data);
          } else {
            setSessionStatus("Active");
            setSessionName(data.session_name || pathSlug);
            setSessionStage(data.stage || 1);
            setInitialDataA(data);
          }
        } else {
          const response = await fetch("http://127.0.0.1:8000/api/init", {
            method: "GET",
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
          });
          const data = await response.json();
          setSessionStatus(data.status);
          setSessionName("");
          setSessionStage(data.stage || 1);
          setInitialDataA(data);
        }
      } catch (err) {
        console.error("Backend link down failure:", err);
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
    if (layoutMode === "2-column") {
      setWidths([50, 50, 0]);
    } else if (layoutMode === "3-column" || layoutMode === "compare") {
      setWidths([33.33, 33.33, 33.34]);
    } else {
      setWidths([35, 35, 30]);
    }
  };

  const fetchAllSessions = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/list-sessions");
      const data = await response.json();
      setSessionList(data);
    } catch (err) {
      console.error("Failed synchronization mapping query array:", err);
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      fetchAllSessions();
    }
  }, [isChatOpen]);

  const handleOpenBranchModal = (historicalMsg = null) => {
    if (sessionStatus === "Not Started" || !sessionName) return;
    const croppedBase = sessionName.slice(0, 13);
    if (historicalMsg && historicalMsg.timestamp) {
      setBranchType("state");
      setBranchNameInput(`C_${croppedBase}`);
      window.__pendingBranchTimestamp = historicalMsg.timestamp;
    } else {
      setBranchType("chat");
      setBranchNameInput(`B_${croppedBase}`);
      window.__pendingBranchTimestamp = null;
    }
    setBranchError("");
    setBranchModalOpen(true);
  };

  const submitBranchSession = async () => {
    const trimmedName = branchNameInput.trim();
    setBranchError("");
    if (!trimmedName) {
      setBranchError("Session branch descriptor string required.");
      return;
    }
    if (trimmedName.length >= 18) {
      setBranchError("Session branch length constraint threshold overflow.");
      return;
    }
    try {
      const payload = { name: trimmedName };
      if (window.__pendingBranchTimestamp) {
        payload.timestamp = window.__pendingBranchTimestamp;
      }
      const res = await fetch(`http://127.0.0.1:8000/api/session/${encodeURIComponent(sessionName)}/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        setBranchModalOpen(false);
        window.__pendingBranchTimestamp = null;
        setHistoricalMessage(null);
        handleSessionNameChange(data.new_session);
        window.location.reload();
        return;
      } else {
        setBranchError(data.message || "Failed to finalize pipeline replication logic branch.");
      }
    } catch (err) {
      console.error("Transmission error cloning trace target:", err);
      setBranchError("Server infrastructure communication breakdown.");
    }
  };

  const startResizeDrag = (handleIndex, e) => {
    e.preventDefault();
    dragInfoRef.current = { isDragging: true, handleIndex, startX: e.clientX, startWidths: [...widths] };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragInfoRef.current.isDragging || !containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - dragInfoRef.current.startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const { handleIndex, startWidths } = dragInfoRef.current;
      const nextWidths = [...startWidths];
      const minPanelWidth = 14;

      if (handleIndex === 0) {
        const requestedLeft = startWidths[0] + deltaPercent;
        const requestedCenter = startWidths[1] - deltaPercent;
        if (requestedLeft >= minPanelWidth && requestedCenter >= minPanelWidth) {
          nextWidths[0] = requestedLeft;
          nextWidths[1] = requestedCenter;
          nextWidths[2] = startWidths[2];
          setWidths(nextWidths);
        }
      } else if (handleIndex === 1) {
        const requestedCenter = startWidths[1] + deltaPercent;
        const requestedRight = startWidths[2] - deltaPercent;
        if (requestedCenter >= minPanelWidth && requestedRight >= minPanelWidth) {
          nextWidths[0] = startWidths[0];
          nextWidths[1] = requestedCenter;
          nextWidths[2] = requestedRight;
          setWidths(nextWidths);
        }
      }
    };

    const handleMouseUp = () => {
      if (dragInfoRef.current.isDragging) {
        dragInfoRef.current.isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [widths]);

  const handleStageMutation = (mutatedStage) => {
    setSessionStage(mutatedStage);
    setRefreshTick(prev => prev + 1);
    if (layoutMode === "compare" || layoutMode === "2-column" || layoutMode === "3-column" || layoutMode === "4-quadrant") {
      setStageA(mutatedStage);
    }
  };

  const renderSlot = (sName, stg, setStg, initData, label, isPrimary = false) => {
    if (isPrimary) {
      return (
        <div className="h-full panel-container-compare rounded-2xl overflow-y-auto overflow-x-hidden custom-scrollbar" style={{ flex: 1, minWidth: 0 }}>
          <div className="sticky-panel-header">
            <div className="session-pill-indicator"> ⚡ {label} : {sName || 'Default'} </div>
          </div>
          <div className="compare-scroll-workspace">
            <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0">
              <BusTopologyMap currentTheme={currentTheme} currentStage={stg} targetSession={sName} refreshTrigger={refreshTick} historicalMessage={historicalMessage} onClearHistoricalView={() => setHistoricalMessage(null)} onBranchFromHistory={(msg) => handleOpenBranchModal(msg)} onMaximizeToggle={() => setFullscreenSession({ sessionName: sName, stage: stg, hasHistory: true })} />
            </div>
            <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0">
              <AnalyticsStreamGallery sessionData={sessionData} userPromptOutput={userPromptOutput} currentTheme={currentTheme} historicalMessage={historicalMessage} />
            </div>
            <div className="w-full h-[440px] rounded-xl overflow-hidden relative flex-shrink-0">
              <div style={{ width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }} className="absolute inset-0">
                <TopologyCopilot status={sessionStatus} setStatus={setSessionStatus} onStageChange={handleStageMutation} sessionName={sName} setSessionName={() => {}} initialData={initData} currentTheme={currentTheme} hideHeader={true} onHistoricalJump={(msg) => setHistoricalMessage(msg)} historicalMessage={historicalMessage} onBranchClick={() => handleOpenBranchModal(null)} onBranchFromHistory={(msg) => handleOpenBranchModal(msg)} dashboardHistoricalMode={isHistoricalMode} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full panel-container-compare rounded-2xl overflow-y-auto overflow-x-hidden custom-scrollbar" style={{ flex: 1, minWidth: 0 }}>
        <div className="sticky-panel-header">
          <div className="session-pill-indicator"> ⚡ {label} : {sName || 'Unassigned'} </div>
        </div>
        <div className="compare-scroll-workspace">
          <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0">
            <BusTopologyMap currentTheme={currentTheme} currentStage={stg} targetSession={sName} refreshTrigger={refreshTick} onMaximizeToggle={() => setFullscreenSession({ sessionName: sName, stage: stg, hasHistory: false })} />
          </div>
          <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0">
            <AnalyticsStreamGallery sessionData={{ active: null }} userPromptOutput={null} currentTheme={currentTheme} />
          </div>
          <div className="w-full h-[440px] rounded-xl overflow-hidden relative flex-shrink-0">
            <div style={{ width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }} className="absolute inset-0">
              <TopologyCopilot status={"Active"} setStatus={() => {}} onStageChange={(st) => setStg(st)} sessionName={sName} setSessionName={() => {}} initialData={initData} currentTheme={currentTheme} hideHeader={true} onBranchClick={() => handleOpenBranchModal(null)} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isHistoricalMode = !!(historicalMessage && historicalMessage.timestamp);

  return (
    <div data-theme={currentTheme} className="w-full h-screen flex flex-col bg-canvas text-primary overflow-hidden select-none" >
      {/* GLOBAL TOP TELEMETRY SYSTEM BAR CONTROL HUB */}
      <header className="w-full h-14 min-h-14 flex items-center justify-between px-6 border-b-header z-50 bg-canvas gap-4">
        {/* LEFT BRAND CLUSTER */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button type="button" onClick={() => setIsChatOpen(true)} className="p-2 btn-menu-sidebar rounded-lg active:scale-95 transition-all cursor-pointer" >
            <Menu className="w-4 h-4 icon-menu-sidebar" />
          </button>
          <button type="button" onClick={() => { window.history.pushState(null, '', '/'); window.location.reload(); }} className={`relative flex items-center justify-center w-8 h-8 rounded-full border-0 transition-all duration-300 cursor-pointer ${ isHistoricalMode ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105' : 'btn-home-zap active:scale-95 hover:scale-105' }`} title={isHistoricalMode ? "Historical tracking locked - Click to escape back to present route" : "Escape back to base default route"} >
            {isHistoricalMode ? (
              <Hourglass className="w-4 h-4 animate-[spin_4s_linear_infinite]" />
            ) : (
              <Zap className="w-4 h-4 icon-home-zap" />
            )}
          </button>
          <div className="flex flex-col">
            <h1 className="text-xs md:text-sm font-black tracking-wider uppercase text-primary">
              {layoutMode !== "analytics" ? "IEEE Multi-Session Engine" : "IEEE Standard Grid Dashboard"}
            </h1>
            <span className="text-[9px] md:text-[10px] text-secondary font-mono tracking-tight uppercase">
              {layoutMode !== "analytics" ? "Parallel Matrix Analytics Sync" : "Supervisory Control & Topological Analytics Copilot"}
            </span>
          </div>
        </div>

        {/* EXPANDED CENTRAL TIME-TRAVEL NOTIFICATION BAR */}
        <div className="flex-1 flex items-center justify-center px-4 min-w-0">
          {isHistoricalMode ? (
            <div className="w-full max-w-2xl flex items-center justify-between px-4 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] uppercase shadow-inner animate-fade-in">
              <div className="flex items-center gap-2 truncate">
                <History className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 animate-pulse" />
                <span className="truncate">Active Archive Track Frame: <strong>{historicalMessage.timestamp}</strong></span>
              </div>
              <button type="button" onClick={() => setHistoricalMessage(null)} className="ml-4 flex items-center gap-1 font-sans font-black tracking-wide text-[9px] btn-hist-back px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 flex-shrink-0" >
                <RotateCcw className="w-2.5 h-2.5 stroke-[3] icon-hist-back" /> Back to Present
              </button>
            </div>
          ) : (
            <div className="w-full" />
          )}
        </div>

        {/* RIGHT CONTROL DECK SIDE CLUSTER */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button type="button" onClick={async () => { if (layoutMode === "analytics") { await fetchAllSessions(); setSelectTrackB(""); setSelectTrackC(""); setSelectTrackD(""); setCompareError(""); setLayoutSelectionModalOpen(true); } else { window.history.pushState(null, '', `/${sessionA || sessionName || ''}`); window.location.reload(); } }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full btn-multiview font-mono text-[10px] md:text-xs font-bold uppercase active:scale-95 transition-all cursor-pointer" >
            <span>{layoutMode === "analytics" ? "⚡ Enter Multi-View" : "🖥️ Exit Multi-View"}</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full badge-telemetry">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-block h-full w-full rounded-full bg-telemetry-dot telemetry-pulse"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-telemetry-dot"></span>
            </span>
            <span className="tracking-wide uppercase font-bold text-[9px] md:text-[10px] text-telemetry">Telemetry Active</span>
          </div>
          <button type="button" onClick={handleResetLayout} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full btn-reset-layout font-mono text-[10px] md:text-xs font-bold uppercase active:scale-95 transition-all cursor-pointer" >
            <RotateCcw className="w-3.5 h-3.5 icon-reset-layout" /> <span>Reset Layout</span>
          </button>
          <button type="button" onClick={() => setCurrentTheme(currentTheme === "dark" ? "light" : "dark")} className="p-2 rounded-lg btn-theme-toggle active:scale-95 transition-all cursor-pointer" >
            {currentTheme === "dark" ? <Moon className="w-4 h-4 icon-moon" /> : <Sun className="w-4 h-4 icon-sun" />}
          </button>
        </div>
      </header>

      {/* DASHBOARD GRID MATRIX INTERFACE VIEWPORT */}
      <main ref={containerRef} className="w-full flex-1 flex items-end p-4 relative overflow-hidden gap-2 bg-canvas" >
        {layoutMode === "2-column" ? (
          <>
            {renderSlot(sessionA, stageA, setStageA, initialDataA, "Session A (Slot 1)", true)}
            <div onMouseDown={(e) => startResizeDrag(0, e)} className="w-2 h-full cursor-col-resize flex-shrink-0 mx-[-4px] flex items-center justify-center group z-30">
              <div className="w-1.5 h-16 rounded-full splitter-handle-bar transition-all" />
            </div>
            {renderSlot(sessionB, stageB, setStageB, initialDataB, "Session B (Slot 2)", false)}
          </>
        ) : layoutMode === "3-column" || layoutMode === "compare" ? (
          <>
            {/* COLUMN INDEX 1: TRACK A CONTAINER */}
            {renderSlot(sessionA, stageA, setStageA, initialDataA, "Session A (Slot 1)", true)}
            <div onMouseDown={(e) => startResizeDrag(0, e)} className="w-2 h-full cursor-col-resize flex-shrink-0 mx-[-4px] flex items-center justify-center group z-30">
              <div className="w-1.5 h-16 rounded-full splitter-handle-bar transition-all" />
            </div>

            {/* COLUMN INDEX 2: TRACK B CONTAINER */}
            {renderSlot(sessionB, stageB, setStageB, initialDataB, "Session B (Slot 2)", false)}
            <div onMouseDown={(e) => startResizeDrag(1, e)} className="w-2 h-full cursor-col-resize flex-shrink-0 mx-[-4px] flex items-center justify-center group z-30">
              <div className="w-1.5 h-16 rounded-full splitter-handle-bar transition-all" />
            </div>

            {/* COLUMN INDEX 3: TRACK C CONTAINER */}
            {renderSlot(sessionC, stageC, setStageC, initialDataC, "Session C (Slot 3)", false)}
          </>
        ) : layoutMode === "4-quadrant" ? (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-4 overflow-y-auto">
            <div className="h-[48vh] min-h-[300px]">
              {renderSlot(sessionA, stageA, setStageA, initialDataA, "Session A (Slot 1)", true)}
            </div>
            <div className="h-[48vh] min-h-[300px]">
              {renderSlot(sessionB, stageB, setStageB, initialDataB, "Session B (Slot 2)", false)}
            </div>
            <div className="h-[48vh] min-h-[300px]">
              {renderSlot(sessionC, stageC, setStageC, initialDataC, "Session C (Slot 3)", false)}
            </div>
            <div className="h-[48vh] min-h-[300px]">
              {renderSlot(sessionD, stageD, setStageD, initialDataD, "Session D (Slot 4)", false)}
            </div>
          </div>
        ) : (
          /* STANDARD BASE CO-PILOT DASHBOARD STATE PANELS */
          <>
            <div style={{ width: `calc(${widths[0]}% - 4px)` }} className="h-full flex-shrink-0 overflow-hidden">
              <BusTopologyMap currentTheme={currentTheme} currentStage={sessionStage} targetSession={sessionName} refreshTrigger={refreshTick} historicalMessage={historicalMessage} onClearHistoricalView={() => setHistoricalMessage(null)} onBranchFromHistory={(msg) => handleOpenBranchModal(msg)} onMaximizeToggle={() => setFullscreenSession({ sessionName: sessionName, stage: sessionStage, hasHistory: true })} />
            </div>
            <div onMouseDown={(e) => startResizeDrag(0, e)} className="w-2 h-full cursor-col-resize flex-shrink-0 z-30 mx-[-4px] relative group flex items-center justify-center">
              <div className="w-1.5 h-12 rounded-full splitter-handle-bar transition-all" />
            </div>
            <div style={{ width: `calc(${widths[1]}% - 4px)` }} className="h-full flex-shrink-0 overflow-hidden">
              <AnalyticsStreamGallery sessionData={sessionData} userPromptOutput={userPromptOutput} currentTheme={currentTheme} historicalMessage={historicalMessage} />
            </div>
            <div onMouseDown={(e) => startResizeDrag(1, e)} className="w-2 h-full cursor-col-resize flex-shrink-0 z-30 mx-[-4px] relative group flex items-center justify-center">
              <div className="w-1.5 h-12 rounded-full splitter-handle-bar transition-all" />
            </div>
            <div style={{ width: `calc(${widths[2]}% - 4px)` }} className="h-full flex-shrink-0 flex justify-end items-end relative overflow-hidden">
              <div style={{ width: '123.333%', height: '123.333%', transform: 'scale(0.81081)', transformOrigin: 'bottom right', position: 'absolute', bottom: 0, right: 0 }}>
                <TopologyCopilot status={sessionStatus} setStatus={setSessionStatus} onStageChange={(stage) => { handleStageMutation(stage); }} sessionName={sessionName} setSessionName={handleSessionNameChange} initialData={initialDataA} currentTheme={currentTheme} onBranchClick={() => handleOpenBranchModal(null)} onBranchFromHistory={(msg) => handleOpenBranchModal(msg)} onHistoricalJump={(msg) => setHistoricalMessage(msg)} historicalMessage={historicalMessage} dashboardHistoricalMode={isHistoricalMode} setUserPromptOutput={setUserPromptOutput} />
              </div>
            </div>
          </>
        )}
      </main>

      {/* BACKEND SESSION REGISTRY CHAT LIST OVERLAY */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} sessions={sessionList} currentSessionName={sessionName} onDeleteSuccess={fetchAllSessions} />

      {/* MODAL WINDOW: TOPOLOGY FORK PIPELINE CHANNEL */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-overlay-bg" onClick={() => { setBranchModalOpen(false); window.__pendingBranchTimestamp = null; }} />
          <div className="relative w-full max-w-sm modal-frame-surface rounded-2xl shadow-2xl p-6 z-10 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-modal-header">
              {branchType === "state" ? "Branch State Profile Snapshot" : "Branch Chat Session"}
            </h3>
            <p className="text-[11px] text-modal-body-desc leading-relaxed">
              {branchType === "state" ? "Generate a target simulation run environment pinned cleanly up to this selected historical logging frame instance." : "Enter a target identification sequence to fork telemetry state tracking maps into concurrent analysis run traces."}
            </p>
            <div className="flex flex-col gap-1 mt-1">
              <input type="text" value={branchNameInput} onChange={(e) => setBranchNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitBranchSession()} className="w-full input-form-control rounded-xl py-2 px-3 text-xs font-mono focus:outline-none" maxLength={17} />
              {branchError && <span className="text-[10px] text-error-feedback font-semibold px-1 mt-1">⚠️ {branchError}</span>}
            </div>
            <div className="flex justify-end gap-2 text-[11px] font-bold mt-1">
              <button type="button" onClick={() => { setBranchModalOpen(false); window.__pendingBranchTimestamp = null; }} className="px-4 py-2 rounded-xl input-form-control">Cancel</button>
              <button type="button" onClick={submitBranchSession} className="px-4 py-2 rounded-xl btn-modal-confirm">Confirm Branch</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WINDOW: LAYOUT SELECTION POPUP */}
      {layoutSelectionModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-overlay-bg" onClick={() => setLayoutSelectionModalOpen(false)} />
          <div className="relative w-full max-w-lg modal-frame-surface rounded-2xl shadow-2xl p-6 z-10 flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-modal-header">Select Multi-View Grid Layout</h3>
              <p className="text-[11px] text-modal-body-desc leading-relaxed mt-1">Choose one of the multi-viewport slot configurations below to initiate parallel trace comparisons.</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 my-2">
              {/* Box 1 (2-Column Grid) */}
              <div onClick={() => { setSelectedLayoutType("2-column"); setLayoutSelectionModalOpen(false); setSessionSelectionModalOpen(true); }} className="layout-box-item cursor-pointer border border-slate-700/50 p-4 rounded-xl hover:border-blue-500 hover:bg-slate-800/20 transition-all flex flex-col items-center gap-3">
                <div className="w-full h-20 grid grid-cols-2 gap-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <div className="bg-blue-600/30 rounded border border-blue-500/20 h-full"></div>
                  <div className="bg-blue-600/30 rounded border border-blue-500/20 h-full"></div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-center">2-Column Grid</span>
              </div>

              {/* Box 2 (3-Column Grid) */}
              <div onClick={() => { setSelectedLayoutType("3-column"); setLayoutSelectionModalOpen(false); setSessionSelectionModalOpen(true); }} className="layout-box-item cursor-pointer border border-slate-700/50 p-4 rounded-xl hover:border-blue-500 hover:bg-slate-800/20 transition-all flex flex-col items-center gap-3">
                <div className="w-full h-20 grid grid-cols-3 gap-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <div className="bg-blue-600/30 rounded border border-blue-500/20 h-full"></div>
                  <div className="bg-blue-600/30 rounded border border-blue-500/20 h-full"></div>
                  <div className="bg-blue-600/30 rounded border border-blue-500/20 h-full"></div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-center">3-Column Grid</span>
              </div>

              {/* Box 3 (4-Quadrant Grid) */}
              <div onClick={() => { setSelectedLayoutType("4-quadrant"); setLayoutSelectionModalOpen(false); setSessionSelectionModalOpen(true); }} className="layout-box-item cursor-pointer border border-slate-700/50 p-4 rounded-xl hover:border-blue-500 hover:bg-slate-800/20 transition-all flex flex-col items-center gap-3">
                <div className="w-full h-20 grid grid-cols-2 grid-rows-2 gap-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  <div className="bg-blue-600/30 rounded border border-blue-500/20 h-full"></div>
                  <div className="bg-blue-600/30 rounded border border-blue-500/20 h-full"></div>
                  <div className="bg-blue-600/30 rounded border border-blue-500/20 h-full"></div>
                  <div className="bg-blue-600/30 rounded border border-blue-500/20 h-full"></div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-center">4-Quadrant Grid</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-[11px] font-bold mt-1">
              <button type="button" onClick={() => setLayoutSelectionModalOpen(false)} className="px-4 py-2 rounded-xl input-form-control">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WINDOW: DYNAMIC MATRIX ASSIGNMENT SELECTION */}
      {sessionSelectionModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-overlay-bg" onClick={() => setSessionSelectionModalOpen(false)} />
          <div className="relative w-full max-w-md modal-frame-surface rounded-2xl shadow-2xl p-6 z-10 flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-modal-header">Configure {selectedLayoutType === "2-column" ? "2-Column" : selectedLayoutType === "3-column" ? "3-Column" : "4-Quadrant"} layout</h3>
              <p className="text-[11px] text-modal-body-desc leading-relaxed mt-1">Map out active session indices to coordinate high-density comparative telemetry pipelines simultaneously.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-black tracking-wider label-form-input">Slot 1 (Session A)</label>
                <div className="w-full select-form-control opacity-60 rounded-xl py-2 px-3 text-xs font-mono">🔒 {sessionName || "Active Primary Pipeline Focus"}</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-modal-header">Slot 2 (Session B)</label>
                <select value={selectTrackB} onChange={(e) => setSelectTrackB(e.target.value)} className="w-full select-form-control rounded-xl py-2 px-3 text-xs font-mono focus:outline-none cursor-pointer">
                  <option value="">-- Select Parallel Trace B --</option>
                  {sessionList.map((s, idx) => {
                    const name = typeof s === 'object' && s !== null ? s.name : s;
                    return <option key={idx} value={name}>{name}</option>;
                  })}
                </select>
              </div>

              {(selectedLayoutType === "3-column" || selectedLayoutType === "4-quadrant") && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-modal-header">Slot 3 (Session C)</label>
                  <select value={selectTrackC} onChange={(e) => setSelectTrackC(e.target.value)} className="w-full select-form-control rounded-xl py-2 px-3 text-xs font-mono focus:outline-none cursor-pointer">
                    <option value="">-- Select Parallel Trace C --</option>
                    {sessionList.map((s, idx) => {
                      const name = typeof s === 'object' && s !== null ? s.name : s;
                      return <option key={idx} value={name}>{name}</option>;
                    })}
                  </select>
                </div>
              )}

              {selectedLayoutType === "4-quadrant" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-modal-header">Slot 4 (Session D)</label>
                  <select value={selectTrackD} onChange={(e) => setSelectTrackD(e.target.value)} className="w-full select-form-control rounded-xl py-2 px-3 text-xs font-mono focus:outline-none cursor-pointer">
                    <option value="">-- Select Parallel Trace D --</option>
                    {sessionList.map((s, idx) => {
                      const name = typeof s === 'object' && s !== null ? s.name : s;
                      return <option key={idx} value={name}>{name}</option>;
                    })}
                  </select>
                </div>
              )}

              {compareError && <span className="text-[10px] text-error-feedback font-semibold px-1 mt-1">⚠️ {compareError}</span>}
            </div>

            <div className="flex justify-end gap-2 text-[11px] font-bold mt-1">
              <button type="button" onClick={() => setSessionSelectionModalOpen(false)} className="px-4 py-2 rounded-xl input-form-control">Cancel</button>
              <button type="button" onClick={() => {
                const s1 = sessionName || "default";
                const s2 = selectTrackB;
                const s3 = selectTrackC;
                const s4 = selectTrackD;
                
                if (!s2) {
                  setCompareError("Slot 2 assignment is required.");
                  return;
                }
                if (selectedLayoutType === "3-column" && !s3) {
                  setCompareError("Slot 3 assignment is required.");
                  return;
                }
                if (selectedLayoutType === "4-quadrant" && (!s3 || !s4)) {
                  setCompareError("Slots 3 and 4 assignments are required.");
                  return;
                }

                // Check duplicates
                const activeSlots = [s1, s2];
                if (selectedLayoutType === "3-column") activeSlots.push(s3);
                if (selectedLayoutType === "4-quadrant") {
                  activeSlots.push(s3);
                  activeSlots.push(s4);
                }
                const hasDuplicates = new Set(activeSlots).size !== activeSlots.length;
                if (hasDuplicates) {
                  setCompareError("Duplicate assignment error: Each slot must display a unique tracking session.");
                  return;
                }

                setCompareError("");
                setSessionSelectionModalOpen(false);
                
                // Build search parameters
                let query = `?s1=${encodeURIComponent(s1)}&s2=${encodeURIComponent(s2)}`;
                if (s3) query += `&s3=${encodeURIComponent(s3)}`;
                if (s4) query += `&s4=${encodeURIComponent(s4)}`;
                query += `&mode=${encodeURIComponent(selectedLayoutType)}`;
                
                window.history.pushState(null, '', `/compare${query}`);
                window.location.reload();
              }} className="px-4 py-2 rounded-xl btn-modal-confirm"> Initialize Grid Layout </button>
            </div>
          </div>
        </div>
      )}

      {/* 🖥️ LIGHTBOX MODAL LAYER: FULL-SCREEN TOPOLOGY MAP PORTAL */}
      {fullscreenSession && (
        <div className="fixed inset-0 z-[200] flex flex-col p-6 modal-overlay-bg animate-fade-in backdrop-blur-md">
          <div className="w-full flex justify-end mb-2">
            <button type="button" onClick={() => setFullscreenSession(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase rounded-xl border border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95" >
              <X className="w-4 h-4" /> <span>Exit View Screen</span>
            </button>
          </div>
          <div className="flex-1 w-full h-full min-h-0 min-w-0 bg-canvas rounded-2xl border border-[var(--bus-border-outer)] shadow-2xl p-2 relative">
            <BusTopologyMap currentTheme={currentTheme} currentStage={fullscreenSession.stage} targetSession={fullscreenSession.sessionName} refreshTrigger={refreshTick} historicalMessage={fullscreenSession.hasHistory ? historicalMessage : null} onMaximizeToggle={() => setFullscreenSession(null)} isFullscreen={true} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;