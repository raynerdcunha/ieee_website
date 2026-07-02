/* src/components/BusTopologyMap.jsx */
import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { Download, History } from 'lucide-react';
import '../styles/BusTopologyMap.css';

export default function BusTopologyMap({
  currentTheme = "light",
  currentStage = 1,
  targetSession = "",
  refreshTrigger = 0,
  historicalMessage = null,
  onClearHistoricalView = null,
  onBranchFromHistory = null
}) {
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);
  const plotRef = useRef(null); // ⚡ Holds reference to the raw underlying Plotly DOM element
  const plotlyInstanceRef = useRef(null);
  const [revision, setRevision] = useState(0);
  const [axisRanges, setAxisRanges] = useState({
    xaxis: { autorange: true, range: undefined },
    yaxis: { autorange: true, range: undefined }
  });

  // ✅ Updated conditional tracking state using state_seq_id
  const isHistoricalMode = !!(historicalMessage && historicalMessage.state_seq_id !== undefined && historicalMessage.state_seq_id !== 0);

  useEffect(() => {
    if (currentStage < 2 || !targetSession) {
      setPlotData(null);
      setError("");
      return;
    }

    let isCurrentRequest = true;

    // ⚡ STEP 1: Clear out outdated topology structures immediately to prevent rendering lag
    setPlotData(null);
    setLoading(true);
    setError("");

    const fetchTopologyGraph = async () => {
      // ✅ Evaluates execution router context safely with fallback values
      const endpoint = isHistoricalMode
        ? `http://127.0.0.1:8000/api/topology/historical?session_name=${encodeURIComponent(targetSession)}&state_seq_id=${encodeURIComponent(historicalMessage.state_seq_id)}`
        : `http://127.0.0.1:8000/api/topology?session_name=${encodeURIComponent(targetSession)}`;

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
        });
        if (!response.ok) throw new Error(`Server execution fault code: ${response.status}`);
        const data = await response.json();

        if (isCurrentRequest) {
          setPlotData(data);
          setAxisRanges({
            xaxis: { autorange: true, range: undefined },
            yaxis: { autorange: true, range: undefined }
          });
          setRevision(prev => prev + 1);
        }
      } catch (err) {
        console.error("Failed to map topology payload:", err);
        if (isCurrentRequest) {
          setError(isHistoricalMode ? "Failed to stream historical vector state frame." : "Failed to stream live grid coordinates.");
        }
      } finally {
        if (isCurrentRequest) {
          setLoading(false);
        }
      }
    };

    // ⚡ STEP 2: Use a small timeout buffer so context ticks finish resetting cleanly
    const delayDebounceId = setTimeout(() => {
      fetchTopologyGraph();
    }, 40);

    return () => {
      isCurrentRequest = false;
      clearTimeout(delayDebounceId);
    };
  }, [currentStage, targetSession, historicalMessage, refreshTrigger, isHistoricalMode]);

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

  const handleDownloadPNG = () => {
    const el = plotlyInstanceRef.current;
    if (!el) {
      console.error("Download blocked: Plotly DOM handle instance target not bound yet.");
      return;
    }
    const displayWidth = el.clientWidth || 1;
    const displayHeight = el.clientHeight || 1;
    const aspectRatio = displayHeight / displayWidth;
    const exportWidth = 1400;
    const exportHeight = Math.round(exportWidth * aspectRatio);

    const PlotlyLib = window.Plotly || el._plotlySVG?.parentElement?.__Plotly || window?.Plotly;
    if (PlotlyLib) {
      PlotlyLib.downloadImage(el, { format: 'png', width: exportWidth, height: exportHeight, filename: `${targetSession || 'ieee33'}_grid_topology` });
    } else {
      console.error("Core engine exception: Global Plotly vector exporter module missing.");
    }
  };

  const handleToggleFullscreenModal = () => {
    console.log("Future implementation hook: Launching viewport lightbox canvas...");
  };

  return (
    <div
      ref={containerRef}
      data-theme={currentTheme}
      className={`bg-[var(--bus-bg-outer)] rounded-xl p-4 border shadow-xl flex flex-col h-full w-full overflow-hidden min-h-0 min-w-0 transition-all duration-300 ${
        isHistoricalMode ? 'border-amber-500/50 shadow-amber-950/20 ring-1 ring-amber-500/20' : 'border-[var(--bus-border-outer)]'
      }`}
    >
      {/* Header Row Layout */}
      <div className="flex items-center justify-between mb-4 w-full flex-shrink-0 border-b border-[var(--bus-border-inner)] pb-3">
        <div className="flex items-center gap-2">
          <span className={`${isHistoricalMode ? 'text-amber-500 animate-pulse' : 'text-blue-500'} text-xs md:text-sm`}>
            {isHistoricalMode ? <History className="w-4 h-4" /> : "🌐"}
          </span>
          <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--bus-text-header)] uppercase font-sans flex items-center gap-2">
            BUS TOPOLOGY MAP{' '}
            {isHistoricalMode && (
              <span className="text-[9px] font-mono tracking-wide px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase animate-pulse">
                Archive Frame View
              </span>
            )}
          </h2>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase rounded-md border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer select-none active:scale-95"
          >
            <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Download PNG</span>
          </button>
          <button
            type="button"
            onClick={handleToggleFullscreenModal}
            title="Expand View Screen"
            className="p-1.5 rounded-md border border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center w-7 h-7 md:w-8 md:h-8"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4">
              <path d="M 4 8 L 4 4 L 8 4 M 16 4 L 20 4 L 20 8 M 20 16 L 20 20 L 16 20 M 8 20 L 4 20 L 4 16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area Box */}
      <div className="flex-grow bg-[var(--bus-bg-inner)] rounded-lg border border-[var(--bus-border-inner)] flex items-center justify-center overflow-hidden relative w-full h-full min-h-0 min-w-0">
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
              onInitialized={(figure, graphDiv) => { plotlyInstanceRef.current = graphDiv; }}
              onUpdate={(figure, graphDiv) => { plotlyInstanceRef.current = graphDiv; }}
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
                modeBarButtonsToRemove: [
                  'toImage', 'zoom2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'toggleSpikelines'
                ]
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