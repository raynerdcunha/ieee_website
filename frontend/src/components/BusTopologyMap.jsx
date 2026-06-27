/* src/components/BusTopologyMap.jsx */
import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { Download, History, RotateCcw, GitFork } from 'lucide-react';
import '../styles/BusTopologyMap.css';

export default function BusTopologyMap({
  currentTheme = "light",
  currentStage = 1,
  targetSession = "",
  historicalMessage = null,        // Pass down the clicked chat message object here
  onClearHistoricalView = null,    // Callback handler to reset to live present state
  onBranchFromHistory = null       // Callback handler to trigger session creation branch wizard
}) {
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);
  const plotRef = useRef(null);
  const [revision, setRevision] = useState(0);
  const [axisRanges, setAxisRanges] = useState({
    xaxis: { autorange: true, range: undefined },
    yaxis: { autorange: true, range: undefined }
  });

  // Dual-Channel Pipeline: Fetches Live Topology or Shifts to Historical Time Travel Matrix frames
  useEffect(() => {
    if (currentStage < 2 || !targetSession) {
      setPlotData(null);
      setError("");
      return;
    }

    const fetchTopologyGraph = async () => {
      setLoading(true);
      setError("");
      
      // Determine if we are querying standard live values or hitting the memory cache dictionary
      const isHistorical = historicalMessage && historicalMessage.timestamp;
      const endpoint = isHistorical
        ? `http://127.0.0.1:8000/api/topology/historical?session_name=${encodeURIComponent(targetSession)}&timestamp=${encodeURIComponent(historicalMessage.timestamp)}`
        : `http://127.0.0.1:8000/api/topology?session_name=${encodeURIComponent(targetSession)}`;

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        if (!response.ok) throw new Error(`Server execution fault code: ${response.status}`);
        const data = await response.json();
        setPlotData(data);
        
        // Force fluid autoscale realignment boundaries on vector swaps
        setAxisRanges({
          xaxis: { autorange: true, range: undefined },
          yaxis: { autorange: true, range: undefined }
        });
      } catch (err) {
        console.error("Failed to map topology payload:", err);
        setError(isHistorical ? "Failed to stream historical vector state frame." : "Failed to stream live grid coordinates.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopologyGraph();
  }, [currentStage, targetSession, historicalMessage]);

  // --- AUTOMATED AUTOSCALE INTEGRATION ENGINE ---
  useEffect(() => {
    if (!containerRef.current) return;
    let timeoutId = null;

    const observer = new ResizeObserver(() => {
      if (plotRef.current && typeof plotRef.current.resizeHandler === 'function') {
        plotRef.current.resizeHandler();
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setAxisRanges({
          xaxis: { autorange: true, range: undefined },
          yaxis: { autorange: true, range: undefined }
        });
        setRevision(prev => prev + 1);
      }, 60);
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [plotData]);

  const handleRelayout = (eventData) => {
    if (eventData['xaxis.range[0]'] !== undefined) {
      setAxisRanges({
        xaxis: { autorange: false, range: [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']] },
        yaxis: { autorange: false, range: [eventData['yaxis.range[0]'], eventData['yaxis.range[1]']] }
      });
    } else if (eventData['xaxis.autorange'] === true || eventData['autosize'] === true) {
      setAxisRanges({
        xaxis: { autorange: true, range: undefined },
        yaxis: { autorange: true, range: undefined }
      });
    }
  };

  const isHistoricalMode = !!(historicalMessage && historicalMessage.timestamp);

  return (
    <div data-theme={currentTheme} className="bg-[var(--bus-bg-outer)] rounded-xl p-4 border border-[var(--bus-border-outer)] shadow-xl flex flex-col h-full w-full overflow-hidden min-h-0 min-w-0">
      
      {/* Header Row Layout */}
      <div className="flex items-center justify-between mb-4 w-full flex-shrink-0 border-b border-[var(--bus-border-inner)] pb-3">
        <div className="flex items-center gap-2">
          <span className={`${isHistoricalMode ? 'text-amber-500 animate-pulse' : 'text-blue-500'} text-xs md:text-sm`}>
            {isHistoricalMode ? <History className="w-4 h-4" /> : "🌐"}
          </span>
          <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--bus-text-header)] uppercase font-sans flex items-center gap-2">
            BUS TOPOLOGY MAP 
            {isHistoricalMode && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono normal-case tracking-normal">
                Historical View
              </span>
            )}
          </h2>
        </div>
        
        {/* Action Panel Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase rounded-md border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer select-none active:scale-95">
            <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Download PNG</span>
          </button>
          <button type="button" className="p-1.5 rounded-md border border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center w-7 h-7 md:w-8 md:h-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4">
              <path d="M 4 8 L 4 4 L 8 4 M 16 4 L 20 4 L 20 8 M 20 16 L 20 20 L 16 20 M 8 20 L 4 20 L 4 16" />
            </svg>
          </button>
        </div>
      </div>

      {/* --- TIME TRAVEL HISTORICAL BANNER OVERLAY --- */}
      {isHistoricalMode && (
        <div className="mb-3 w-full flex-shrink-0 bg-amber-950/40 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
            <span>Viewing state logged at <strong>{historicalMessage.timestamp}</strong></span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => onBranchFromHistory && onBranchFromHistory(historicalMessage)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500 hover:text-black transition-all font-bold text-[10px] uppercase cursor-pointer"
            >
              <GitFork className="w-3 h-3" /> Branch State
            </button>
            <button
              type="button"
              onClick={() => onClearHistoricalView && onClearHistoricalView()}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all font-bold text-[10px] uppercase cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Live Present
            </button>
          </div>
        </div>
      )}

      {/* Content Area Box */}
      <div ref={containerRef} className="flex-grow bg-[var(--bus-bg-inner)] rounded-lg border border-[var(--bus-border-inner)] flex items-center justify-center overflow-hidden relative w-full h-full min-h-0 min-w-0">
        
        {/* CONDITIONAL RENDER ENGINE */}
        {currentStage < 2 ? (
          <p className="text-[10px] text-[var(--bus-text-muted)] font-mono uppercase tracking-widest animate-pulse">
            ⚡ Awaiting Bus Standard Designation...
          </p>
        ) : loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] text-[var(--bus-text-muted)] font-mono uppercase tracking-widest">
              {isHistoricalMode ? "Scanning Timeline Registry..." : "Loading Live Grid Analytics..."}
            </p>
          </div>
        ) : error ? (
          <p className="text-[10px] text-red-400 font-mono uppercase tracking-wider">⚠️ {error}</p>
        ) : plotData ? (
          <div className="absolute inset-0 overflow-hidden flex items-center justify-center w-full h-full min-h-0 min-w-0">
            <Plot
              ref={plotRef}
              revision={revision}
              data={plotData.data || []}
              layout={{
                ...(plotData.layout || {}),
                autosize: true,
                margin: { l: 20, r: 20, t: 30, b: 20 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                xaxis: {
                  ...(plotData.layout?.xaxis || {}),
                  automargin: true,
                  fixedrange: false,
                  autorange: axisRanges.xaxis.autorange,
                  range: axisRanges.xaxis.range
                },
                yaxis: {
                  ...(plotData.layout?.yaxis || {}),
                  automargin: true,
                  fixedrange: false,
                  scaleanchor: null,
                  scaleratio: null,
                  autorange: axisRanges.yaxis.autorange,
                  range: axisRanges.yaxis.range
                }
              }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
              }}
              onRelayout={handleRelayout}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
              className="w-full h-full"
            />
          </div>
        ) : (
          <p className="text-[10px] text-[var(--bus-text-muted)] font-mono uppercase tracking-widest">
            Map Visualization Layer Empty
          </p>
        )}
      </div>
    </div>
  );
}