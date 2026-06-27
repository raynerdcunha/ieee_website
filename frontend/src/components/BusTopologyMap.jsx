/* src/components/BusTopologyMap.jsx */
import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { Download } from 'lucide-react';
import '../styles/BusTopologyMap.css';

export default function BusTopologyMap({ currentTheme = "light", currentStage = 1, targetSession = "" }) {
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const plotRef = useRef(null);
  const [revision, setRevision] = useState(0);

  // Track the autorange state explicitly in React to force fresh rendering passes
  const [axisRanges, setAxisRanges] = useState({
    xaxis: { autorange: true, range: undefined },
    yaxis: { autorange: true, range: undefined }
  });

  // Stream grid payload structural coordinates from API backend
  useEffect(() => {
    if (currentStage < 2 || !targetSession) {
      setPlotData(null);
      setError("");
      return;
    }

    const fetchTopologyGraph = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/topology?session_name=${encodeURIComponent(targetSession)}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        if (!response.ok) throw new Error(`Server execution fault code: ${response.status}`);
        const data = await response.json();
        setPlotData(data);
        
        // Initialize fresh autoranges when a new topology loads
        setAxisRanges({
          xaxis: { autorange: true, range: undefined },
          yaxis: { autorange: true, range: undefined }
        });
      } catch (err) {
        console.error("Failed to map topology payload:", err);
        setError("Failed to stream grid coordinates.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopologyGraph();
  }, [currentStage, targetSession]);

  // --- AUTOMATED AUTOSCALE INTEGRATION ENGINE ---
  useEffect(() => {
    if (!containerRef.current) return;
    let timeoutId = null;

    const observer = new ResizeObserver(() => {
      // 1. Immediately trigger the standard container fluid dimensions recalculation
      if (plotRef.current && typeof plotRef.current.resizeHandler === 'function') {
        plotRef.current.resizeHandler();
      }

      clearTimeout(timeoutId);

      // 2. Wipe manual user zoom states on container resize and force full viewport maximization
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

  // Handle manual zooming or panning by the user so they can still look around
  const handleRelayout = (eventData) => {
    // If the user manually zooms or pans, track their new viewport bounds
    if (eventData['xaxis.range[0]'] !== undefined) {
      setAxisRanges({
        xaxis: { autorange: false, range: [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']] },
        yaxis: { autorange: false, range: [eventData['yaxis.range[0]'], eventData['yaxis.range[1]']] }
      });
    }
    // If they double click the graph to manual autoscale, reset tracking states
    else if (eventData['xaxis.autorange'] === true || eventData['autosize'] === true) {
      setAxisRanges({
        xaxis: { autorange: true, range: undefined },
        yaxis: { autorange: true, range: undefined }
      });
    }
  };

  return (
    <div data-theme={currentTheme} className="bg-[var(--bus-bg-outer)] rounded-xl p-4 border border-[var(--bus-border-outer)] shadow-xl flex flex-col h-full w-full overflow-hidden min-h-0 min-w-0">
      {/* Header Row Layout */}
      <div className="flex items-center justify-between mb-4 w-full flex-shrink-0 border-b border-[var(--bus-border-inner)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 text-xs md:text-sm">🌐</span>
          <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--bus-text-header)] uppercase font-sans">
            BUS TOPOLOGY MAP
          </h2>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            type="button" 
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase rounded-md border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer select-none active:scale-95"
          >
            <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Download PNG</span>
          </button>
          <button 
            type="button" 
            className="p-1.5 rounded-md border border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center w-7 h-7 md:w-8 md:h-8"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4">
              <path d="M 4 8 L 4 4 L 8 4 M 16 4 L 20 4 L 20 8 M 20 16 L 20 20 L 16 20 M 8 20 L 4 20 L 4 16" />
            </svg>
          </button>
        </div>
      </div>

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
              Loading Grid Analytics...
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