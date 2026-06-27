import React, { useState, useEffect, useRef } from 'react'; 
import { Menu, Zap, RotateCcw, Sun, Moon } from 'lucide-react'; 
import TopologyCopilot from './src/components/TopologyCopilot.jsx'; 
import BusTopologyMap from './src/components/BusTopologyMap.jsx'; 
import AnalyticsStreamGallery from './src/components/AnalyticsStreamGallery.jsx'; 
import ChatPanel from './src/components/ChatPanel.jsx'; 
import './App.css'; 

function App() { 
  const [sessionStatus, setSessionStatus] = useState("Not Started"); 
  const [sessionName, setSessionName] = useState(""); 
  const [sessionStage, setSessionStage] = useState(1); // Master component stage indicator for standard view 
  
  // --- TIME TRAVEL & HISTORICAL STATE CORE ---
  const [historicalMessage, setHistoricalMessage] = useState(null);

  // --- INITIAL DATA ARCHIVE PROFILES --- 
  const [initialDataA, setInitialDataA] = useState(null); 
  const [initialDataB, setInitialDataB] = useState(null); 
  const [initialDataC, setInitialDataC] = useState(null); 
  
  // --- MULTI-SESSION INDEPENDENT STAGE CORES --- 
  const [stageA, setStageA] = useState(1); 
  const [stageB, setStageB] = useState(1); 
  const [stageC, setStageC] = useState(1); 
  
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
  
  // --- COMPARA-MATRIX ROUTING AND CHANNELS --- 
  const [layoutMode, setLayoutMode] = useState("analytics"); 
  const [sessionA, setSessionA] = useState(""); 
  const [sessionB, setSessionB] = useState(""); 
  const [sessionC, setSessionC] = useState(""); 
  const [compareModalOpen, setCompareModalOpen] = useState(false); 
  const [selectTrackB, setSelectTrackB] = useState(""); 
  const [selectTrackC, setSelectTrackC] = useState(""); 
  const [compareError, setCompareError] = useState(""); 

  useEffect(() => { 
    localStorage.setItem('ieee-dashboard-theme', currentTheme); 
  }, [currentTheme]); 

  useEffect(() => { 
    const initializeSystem = async () => { 
      const pathName = window.location.pathname; 
      if (pathName === '/compare') { 
        const searchParams = new URLSearchParams(window.location.search); 
        const s1 = searchParams.get('s1') || ""; 
        const s2 = searchParams.get('s2') || ""; 
        const s3 = searchParams.get('s3') || ""; 
        setLayoutMode("compare"); 
        setSessionA(s1); 
        setSessionB(s2); 
        setSessionC(s3); 
        setSessionName(s1); 
        setSessionStatus("Multi-Active"); 
        setWidths([33.33, 33.33, 33.34]); 
        try { 
          const response = await fetch(`http://127.0.0.1:8000/api/compare?s1=${encodeURIComponent(s1)}&s2=${encodeURIComponent(s2)}&s3=${encodeURIComponent(s3)}`, { 
            method: "GET", 
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" } 
          }); 
          const data = await response.json(); 
          setInitialDataA(data.s1 ? (Array.isArray(data.s1) ? { history: data.s1 } : data.s1) : { history: [] }); 
          setInitialDataB(data.s2 ? (Array.isArray(data.s2) ? { history: data.s2 } : data.s2) : { history: [] }); 
          setInitialDataC(data.s3 ? (Array.isArray(data.s3) ? { history: data.s3 } : data.s3) : { history: [] }); 
          setStageA(data.s1?.stage ?? 1); 
          setStageB(data.s2?.stage ?? 1); 
          setStageC(data.s3?.stage ?? 1); 
          setSessionStage(data.s1?.stage ?? 1); 
        } catch (err) { 
          console.error("Failed to parse cross-comparative data array profiles:", err); 
          setInitialDataA({ history: [] }); 
          setInitialDataB({ history: [] }); 
          setInitialDataC({ history: [] }); 
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
    if (layoutMode === "compare") { 
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
    setBranchNameInput(`B_${croppedBase}`); 
    setBranchError(""); 
    
    // Store historical anchor target directly inside the ref or context if branch payload passes it
    window.__pendingBranchTimestamp = historicalMsg?.timestamp || null;
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
    if (layoutMode === "compare") { 
      setStageA(mutatedStage); 
    } 
  }; 

  return ( 
    <div data-theme={currentTheme} className="w-full h-screen flex flex-col bg-canvas text-primary overflow-hidden select-none" > 
      {/* GLOBAL TOP TELEMETRY SYSTEM BAR CONTROL HUB */} 
      <header className="w-full h-14 min-h-14 flex items-center justify-between px-6 border-b-header z-50 bg-canvas"> 
        <div className="flex items-center gap-4"> 
          <button type="button" onClick={() => setIsChatOpen(true)} className="p-2 btn-nav-utility rounded-lg active:scale-95 transition-all cursor-pointer" > 
            <Menu className="w-4 h-4 icon-muted" /> 
          </button> 
          <button type="button" onClick={() => { window.history.pushState(null, '', '/'); window.location.reload(); }} className="relative flex items-center justify-center w-8 h-8 rounded-full btn-action-feature active:scale-95 hover:scale-105 transition-all cursor-pointer border-0" title="Escape back to base default route" > 
            <Zap className="w-4 h-4" /> 
          </button> 
          <div className="flex flex-col"> 
            <h1 className="text-xs md:text-sm font-black tracking-wider uppercase text-primary"> 
              {layoutMode === "compare" ? "IEEE Multi-Session Engine" : "IEEE Standard Grid Dashboard"} 
            </h1> 
            <span className="text-[9px] md:text-[10px] text-secondary font-mono tracking-tight uppercase"> 
              {layoutMode === "compare" ? "Parallel Matrix Analytics Sync" : "Supervisory Control & Topological Analytics Copilot"} 
            </span> 
          </div> 
        </div> 
        <div className="flex items-center gap-3"> 
          <button type="button" onClick={async () => { 
            if (layoutMode !== "compare") { 
              await fetchAllSessions(); 
              setSelectTrackB(sessionName || ""); 
              setSelectTrackC(sessionName || ""); 
              setCompareError(""); 
              setCompareModalOpen(true); 
            } else { 
              window.history.pushState(null, '', `/${sessionA || sessionName || ''}`); 
              window.location.reload(); 
            } 
          }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full btn-action-feature font-mono text-[10px] md:text-xs font-bold uppercase active:scale-95 transition-all cursor-pointer" > 
            <span>{layoutMode !== "compare" ? "⚡ Enter Multi-View" : "🖥️ Exit Multi-View"}</span> 
          </button> 
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full badge-telemetry"> 
            <span className="relative flex h-2 w-2"> 
              <span className="absolute inline-block h-full w-full rounded-full bg-telemetry-dot telemetry-pulse"></span> 
              <span className="relative inline-flex rounded-full h-2 w-2 bg-telemetry-dot"></span> 
            </span> 
            <span className="tracking-wide uppercase font-bold text-[9px] md:text-[10px] text-telemetry">Telemetry Active</span> </div> 
          <button type="button" onClick={handleResetLayout} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full btn-nav-utility font-mono text-[10px] md:text-xs font-bold uppercase active:scale-95 transition-all cursor-pointer" > 
            <RotateCcw className="w-3.5 h-3.5" /> 
            <span>Reset Layout</span> 
          </button> 
          <button type="button" onClick={() => setCurrentTheme(currentTheme === "dark" ? "light" : "dark")} className="p-2 rounded-lg btn-nav-utility active:scale-95 transition-all cursor-pointer" > 
            {currentTheme === "dark" ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 icon-sun" />} 
          </button> 
        </div> 
      </header> 

      {/* DASHBOARD GRID MATRIX INTERFACE VIEWPORT */} 
      <main ref={containerRef} className="w-full flex-1 flex items-end p-4 relative overflow-hidden gap-2 bg-canvas" > 
        {layoutMode === "compare" ? ( 
          <> 
            {/* COLUMN INDEX 1: TRACK A MATRIX CONTAINER */} 
            <div style={{ width: `calc(${widths[0]}% - 4px)` }} className="h-full panel-container-compare rounded-2xl overflow-y-auto overflow-x-hidden custom-scrollbar" > 
              <div className="sticky-panel-header"> 
                <div className="session-pill-indicator"> ⚡ Session A : {sessionA || 'Default'} </div> 
              </div> 
              <div className="compare-scroll-workspace"> 
                <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0"> 
                  <BusTopologyMap 
                    currentTheme={currentTheme} 
                    currentStage={stageA} 
                    targetSession={sessionA} 
                    historicalMessage={historicalMessage}
                    onClearHistoricalView={() => setHistoricalMessage(null)}
                    onBranchFromHistory={(msg) => handleOpenBranchModal(msg)}
                  /> 
                </div> 
                <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0"> 
                  <AnalyticsStreamGallery currentTheme={currentTheme} targetSession={sessionA} /> 
                </div> 
                <div className="w-full h-[440px] rounded-xl overflow-hidden relative flex-shrink-0"> 
                  <div style={{ width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }} className="absolute inset-0"> 
                    <TopologyCopilot status={sessionStatus} setStatus={setSessionStatus} onStageChange={handleStageMutation} sessionName={sessionA} setSessionName={() => {}} initialData={initialDataA} currentTheme={currentTheme} hideHeader={true} onHistoricalJump={(msg) => setHistoricalMessage(msg)} historicalMessage={historicalMessage} /> 
                  </div> 
                </div> 
              </div> 
            </div> 
            {/* Split Resizing Bar Handle Line 1 */} 
            <div onMouseDown={(e) => startResizeDrag(0, e)} className="w-2 h-full cursor-col-resize flex-shrink-0 mx-[-4px] flex items-center justify-center group z-30"> 
              <div className="w-1.5 h-16 rounded-full splitter-handle-bar transition-all" /> </div> 
            
            {/* COLUMN INDEX 2: TRACK B MATRIX CONTAINER */} 
            <div style={{ width: `calc(${widths[1]}% - 4px)` }} className="h-full panel-container-compare rounded-2xl overflow-y-auto overflow-x-hidden custom-scrollbar" > 
              <div className="sticky-panel-header"> 
                <div className="session-pill-indicator"> ⚡ Session B : {sessionB || 'Unassigned'} </div> 
              </div> 
              <div className="compare-scroll-workspace"> 
                <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0"> 
                  <BusTopologyMap currentTheme={currentTheme} currentStage={stageB} targetSession={sessionB} /> 
                </div> 
                <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0"> 
                  <AnalyticsStreamGallery currentTheme={currentTheme} targetSession={sessionB} /> 
                </div> 
                <div className="w-full h-[440px] rounded-xl overflow-hidden relative flex-shrink-0"> 
                  <div style={{ width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }} className="absolute inset-0"> 
                    <TopologyCopilot status={"Active"} setStatus={() => {}} onStageChange={(st) => setStageB(st)} sessionName={sessionB} setSessionName={() => {}} initialData={initialDataB} currentTheme={currentTheme} hideHeader={true} /> 
                  </div> 
                </div> 
              </div> 
            </div> 
            {/* Split Resizing Bar Handle Line 2 */} 
            <div onMouseDown={(e) => startResizeDrag(1, e)} className="w-2 h-full cursor-col-resize flex-shrink-0 mx-[-4px] flex items-center justify-center group z-30"> 
              <div className="w-1.5 h-16 rounded-full splitter-handle-bar transition-all" /> </div> 
            
            {/* COLUMN INDEX 3: TRACK C MATRIX CONTAINER */} 
            <div style={{ width: `calc(${widths[2]}% - 4px)` }} className="h-full panel-container-compare rounded-2xl overflow-y-auto overflow-x-hidden custom-scrollbar" > 
              <div className="sticky-panel-header"> 
                <div className="session-pill-indicator"> ⚡ Session C : {sessionC || 'Unassigned'} </div> 
              </div> 
              <div className="compare-scroll-workspace"> 
                <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0"> 
                  <BusTopologyMap currentTheme={currentTheme} currentStage={stageC} targetSession={sessionC} /> 
                </div> 
                <div className="w-full rounded-xl overflow-hidden h-[320px] flex-shrink-0"> 
                  <AnalyticsStreamGallery currentTheme={currentTheme} targetSession={sessionC} /> 
                </div> 
                <div className="w-full h-[440px] rounded-xl overflow-hidden relative flex-shrink-0"> 
                  <div style={{ width: '125%', height: '125%', transform: 'scale(0.8)', transformOrigin: 'top left' }} className="absolute inset-0"> 
                    <TopologyCopilot status={"Active"} setStatus={() => {}} onStageChange={(st) => setStageC(st)} sessionName={sessionC} setSessionName={() => {}} initialData={initialDataC} currentTheme={currentTheme} hideHeader={true} /> 
                  </div> 
                </div> 
              </div> 
            </div> 
          </> 
        ) : ( 
          /* STANDARD BASE CO-PILOT DASHBOARD STATE PANELS */ 
          <> 
            <div style={{ width: `calc(${widths[0]}% - 4px)` }} className="h-full flex-shrink-0 overflow-hidden"> 
              <BusTopologyMap 
                currentTheme={currentTheme} 
                currentStage={sessionStage} 
                targetSession={sessionName} 
                historicalMessage={historicalMessage}
                onClearHistoricalView={() => setHistoricalMessage(null)}
                onBranchFromHistory={(msg) => handleOpenBranchModal(msg)}
              /> 
            </div> 
            <div onMouseDown={(e) => startResizeDrag(0, e)} className="w-2 h-full cursor-col-resize flex-shrink-0 z-30 mx-[-4px] relative group flex items-center justify-center"> 
              <div className="w-1.5 h-12 rounded-full splitter-handle-bar transition-all" /> </div> 
            <div style={{ width: `calc(${widths[1]}% - 4px)` }} className="h-full flex-shrink-0 overflow-hidden"> 
              <AnalyticsStreamGallery currentTheme={currentTheme} targetSession={sessionName} /> </div> 
            <div onMouseDown={(e) => startResizeDrag(1, e)} className="w-2 h-full cursor-col-resize flex-shrink-0 z-30 mx-[-4px] relative group flex items-center justify-center"> 
              <div className="w-1.5 h-12 rounded-full splitter-handle-bar transition-all" /> </div> 
            <div style={{ width: `calc(${widths[2]}% - 4px)` }} className="h-full flex-shrink-0 flex justify-end items-end relative overflow-hidden"> 
              <div style={{ width: '123.333%', height: '123.333%', transform: 'scale(0.81081)', transformOrigin: 'bottom right', position: 'absolute', bottom: 0, right: 0 }}> 
                <TopologyCopilot status={sessionStatus} setStatus={setSessionStatus} onStageChange={handleStageMutation} sessionName={sessionName} setSessionName={handleSessionNameChange} initialData={initialDataA} currentTheme={currentTheme} onBranchClick={handleOpenBranchModal} onHistoricalJump={(msg) => setHistoricalMessage(msg)} historicalMessage={historicalMessage} /> 
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-modal-header">Branch Chat Session</h3> 
            <p className="text-[11px] text-modal-body-desc leading-relaxed">Enter a target identification sequence to fork telemetry state tracking maps into concurrent analysis run traces.</p> 
            <div className="flex flex-col gap-1 mt-1"> 
              <input type="text" value={branchNameInput} onChange={(e) => setBranchNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitBranchSession()} placeholder="Branch name..." className="w-full input-form-control rounded-xl py-2 px-3 text-xs font-mono focus:outline-none" maxLength={17} /> 
              {branchError && <span className="text-[10px] text-error-feedback font-semibold px-1 mt-1">⚠️ {branchError}</span>} 
            </div> 
            <div className="flex justify-end gap-2 text-[11px] font-bold mt-1"> 
              <button type="button" onClick={() => { setBranchModalOpen(false); window.__pendingBranchTimestamp = null; }} className="px-4 py-2 rounded-xl input-form-control">Cancel</button> 
              <button type="button" onClick={submitBranchSession} className="px-4 py-2 rounded-xl btn-modal-confirm">Confirm Branch</button> 
            </div> 
          </div> 
        </div> 
      )} 

      {/* MODAL WINDOW: DYNAMIC MATRIX ASSIGNMENT SELECTION */} 
      {compareModalOpen && ( 
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4"> 
          <div className="absolute inset-0 modal-overlay-bg" onClick={() => setCompareModalOpen(false)} /> 
          <div className="relative w-full max-w-md modal-frame-surface rounded-2xl shadow-2xl p-6 z-10 flex flex-col gap-5"> 
            <div> 
              <h3 className="text-sm font-bold uppercase tracking-wider text-modal-header">Configure Comparative Layout Matrix</h3> 
              <p className="text-[11px] text-modal-body-desc leading-relaxed mt-1">Map out active session indices to coordinate high-density comparative telemetry pipelines simultaneously.</p> 
            </div> 
            <div className="flex flex-col gap-3"> 
              <div className="flex flex-col gap-1"> 
                <label className="text-[10px] uppercase font-black tracking-wider label-form-input">Column Matrix 01 (Session A)</label> 
                <div className="w-full select-form-control opacity-60 rounded-xl py-2 px-3 text-xs font-mono">🔒 {sessionName || "Active Primary Pipeline Focus"}</div> 
              </div> 
              <div className="flex flex-col gap-1"> 
                <label className="text-[10px] uppercase font-black tracking-wider text-modal-header">Column Matrix 02 (Session B)</label> 
                <select value={selectTrackB} onChange={(e) => setSelectTrackB(e.target.value)} className="w-full select-form-control rounded-xl py-2 px-3 text-xs font-mono focus:outline-none cursor-pointer"> 
                  <option value="">-- Select Parallel Trace B --</option> 
                  {sessionList.map((s, idx) => { const name = typeof s === 'object' && s !== null ? s.name : s; return <option key={idx} value={name}>{name}</option>; })} 
                </select> 
              </div> 
              <div className="flex flex-col gap-1"> 
                <label className="text-[10px] uppercase font-black tracking-wider text-modal-header">Column Matrix 03 (Session C)</label> 
                <select value={selectTrackC} onChange={(e) => setSelectTrackC(e.target.value)} className="w-full select-form-control rounded-xl py-2 px-3 text-xs font-mono focus:outline-none cursor-pointer"> 
                  <option value="">-- Select Parallel Trace C --</option> 
                  {sessionList.map((s, idx) => { const name = typeof s === 'object' && s !== null ? s.name : s; return <option key={idx} value={name}>{name}</option>; })} 
                </select> 
              </div> 
              {compareError && <span className="text-[10px] text-error-feedback font-semibold px-1 mt-1">⚠️ {compareError}</span>} 
            </div> 
            <div className="flex justify-end gap-2 text-[11px] font-bold mt-1"> 
              <button type="button" onClick={() => setCompareModalOpen(false)} className="px-4 py-2 rounded-xl input-form-control">Cancel</button> 
              <button type="button" onClick={() => { 
                if (!selectTrackB || !selectTrackC) { 
                  setCompareError("Operational identifiers required across all comparative columns."); 
                  return; 
                } 
                const s1 = sessionName || "default"; 
                const s2 = selectTrackB; 
                const s3 = selectTrackC; 
                if (s1 === s2 || s1 === s3 || s2 === s3) { 
                  setCompareError("Duplicate assignment error: Each matrix column must display a unique tracking session."); 
                  return; 
                } 
                setCompareError(""); 
                setCompareModalOpen(false); 
                window.history.pushState(null, '', `/compare?s1=${encodeURIComponent(s1)}&s2=${encodeURIComponent(s2)}&s3=${encodeURIComponent(s3)}`); 
                window.location.reload(); 
              }} className="px-4 py-2 rounded-xl btn-modal-confirm" > Initialize Matrix View </button> 
            </div> 
          </div> 
        </div> 
      )} 
    </div> 
  ); 
} 

export default App;