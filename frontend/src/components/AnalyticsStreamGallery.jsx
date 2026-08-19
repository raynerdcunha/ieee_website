/* src/components/AnalyticsStreamGallery.jsx */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Download, Maximize2, Minimize2, FileArchive, History } from 'lucide-react';
import '../styles/AnalyticsStreamGallery.css';

export default function AnalyticsStreamGallery({ 
  sessionData, 
  userPromptOutput, 
  currentTheme = "light", 
  historicalMessage = null 
}) {
  const [maximizedChart, setMaximizedChart] = useState(null);
  const [showPowerFactor, setShowPowerFactor] = useState(false);
  // Decorative tab row — matches 5174's "Function decoupled" disabled-tab style.
  // All permanently disabled: no active/selected state, ever, for any of them.
  const galleryTabs = [
    { id: 'branch-load', label: 'Branch Load' },
    { id: 'indices', label: 'Indices' },
    { id: 'elec-distance', label: 'Elec. Distance' },
    { id: 'sensitivity', label: 'Sensitivity' },
    { id: 'feeder-zones', label: 'Feeder Zones' },
    { id: 'risk-score', label: 'Risk Score' },
  ];

  // Individual chart references bound for DOM-canvas extraction
  const vRef = useRef(null);
  const pRef = useRef(null);
  const qRef = useRef(null);
  const pfRef = useRef(null);

  // Monitor chat actions or historical commands for Power Factor state modification
  useEffect(() => {
    if (!userPromptOutput) return;
    if (userPromptOutput.show_pf) setShowPowerFactor(true);
    if (userPromptOutput.hide_pf) setShowPowerFactor(false);
  }, [userPromptOutput]);

  // Historical state activation flag tracking sequence indices
  const isHistoricalMode = !!(
    historicalMessage && 
    historicalMessage.state_seq_id !== undefined && 
    historicalMessage.state_seq_id !== 0
  );

  // Parse active payload vectors and calculate True Power Factor dynamically
  const plotData = useMemo(() => {
    if (!sessionData || !sessionData.active) {
      return { labels: [], v: [], p: [], q: [], pf: [] };
    }

    const { v = [], p = [], q = [] } = sessionData.active;
    const labels = v.map((_, index) => `Bus ${index + 1}`);
    
    const pf = p.map((pVal, idx) => {
      const qVal = q[idx] || 0;
      const den = Math.sqrt(pVal * pVal + qVal * qVal);
      return den === 0 ? 1.0 : parseFloat((pVal / den).toFixed(4));
    });

    return { labels, v, p, q, pf };
  }, [sessionData]);

  // Triggers client-side browser download of individual images
  const handleIndividualDownload = async (chartRef, title) => {
    if (!chartRef.current) return;
    const Plotly = window.Plotly;
    await Plotly.downloadImage(chartRef.current.el, {
      format: 'png',
      width: 1000,
      height: 500,
      filename: `${title.toLowerCase().replace(/\s+/g, '_')}`
    });
  };

  // Packs active canvases and hits backend API pipeline for archival zip bundling
  const handleZipDownload = async () => {
    const Plotly = window.Plotly;
    const refs = [
      { r: vRef, n: 'voltage' },
      { r: pRef, n: 'active_power' },
      { r: qRef, n: 'reactive_power' }
    ];

    if (showPowerFactor) {
      refs.push({ r: pfRef, n: 'power_factor' });
    }

    const images = {};
    try {
      await Promise.all(
        refs.map(async (t) => {
          if (t.r.current) {
            const dataUrl = await Plotly.toImage(t.r.current.el, {
              format: 'png',
              width: 1000,
              height: 500
            });
            images[t.n] = dataUrl;
          }
        })
      );

      const res = await fetch("http://127.0.0.1:9700/api/analytics/zip-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images })
      });

      if (!res.ok) throw new Error("Backend compilation error");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "grid_analytics.zip";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate zip export stream:", err);
    }
  };

  // Setup dynamic list of parameters to generate
  const charts = [
    { id: 'v', title: 'Voltage Profile', data: plotData.v, color: '#3b82f6', ref: vRef },
    { id: 'p', title: 'Active Power', data: plotData.p, color: '#f97316', ref: pRef },
    { id: 'q', title: 'Reactive Power', data: plotData.q, color: '#22c55e', ref: qRef },
    ...(showPowerFactor ? [{ id: 'pf', title: 'Power Factor', data: plotData.pf, color: '#a855f7', ref: pfRef }] : [])
  ];

  const renderPlot = (c, isModal = false) => (
    <div 
      key={c.id} 
      className={`bg-white rounded-lg border border-slate-200 p-3 flex flex-col ${
        isModal ? 'h-[75vh] w-full' : 'h-[280px] w-full'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">{c.title}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleIndividualDownload(c.ref, c.title)}
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            title="Download PNG Plot"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {isModal ? (
            <button
              type="button"
              onClick={() => setMaximizedChart(null)}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMaximizedChart(c.id)}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-grow w-full h-full min-h-0">
        <Plot 
          ref={c.ref} 
          data={[{ 
            x: plotData.labels, 
            y: c.data, 
            type: 'bar', 
            marker: { color: c.color } 
          }]} 
          layout={{
            autosize: true,
            margin: { l: 35, r: 15, t: 15, b: 35 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { tickfont: { size: 9, family: 'monospace' } },
            yaxis: { tickfont: { size: 9, family: 'monospace' } }
          }} 
          config={{ displayModeBar: false, responsive: true }} 
          className="w-full h-full"
        />
      </div>
    </div>
  );

  return (
    <div 
      data-theme={currentTheme} 
      className={`bg-[var(--analytics-bg-outer)] rounded-xl p-4 border shadow-xl flex flex-col h-full w-full overflow-hidden transition-all duration-300 ${
        isHistoricalMode 
          ? 'border-amber-500/50 shadow-amber-950/20 ring-1 ring-amber-500/20' 
          : 'border-[var(--analytics-border-outer)]'
      }`}
    >
      {/* Header Panel */}
      <div className="flex items-center justify-between mb-4 w-full flex-shrink-0 border-b border-[var(--analytics-border-inner)] pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`${isHistoricalMode ? 'text-amber-500 animate-pulse' : 'text-green-500'} text-xs md:text-sm flex-shrink-0`}>
            {isHistoricalMode ? <History className="w-4 h-4" /> : "📊"}
          </span>
          <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--analytics-text-header)] uppercase font-sans flex items-center gap-2 truncate">
            ANALYTICS STREAM GALLERY
            {isHistoricalMode && (
              <span className="text-[9px] font-mono tracking-wide px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase animate-pulse hidden sm:inline-block">
                ARCHIVE GRAPH VIEW
              </span>
            )}
          </h2>
        </div>

        {/* Global Zip Trigger Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            type="button" 
            onClick={handleZipDownload}
            disabled={!sessionData || !sessionData.active}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase rounded-md border text-slate-300 transition-all select-none active:scale-95 ${
              (!sessionData || !sessionData.active)
                ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/20 text-slate-600'
                : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:text-white cursor-pointer'
            }`}
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DOWNLOAD ZIP</span>
          </button>
        </div>
      </div>

      {/* Decorative Tab Row — matches 5174's own "Function decoupled" disabled-tab style */}
      <div className="w-full flex items-center gap-1.5 py-1.5 mb-2 border-b border-slate-200 dark:border-slate-800/60 overflow-x-auto flex-shrink-0 hide-scrollbar">
        {galleryTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            disabled
            title="Function decoupled"
            className="px-3 py-1 text-[10px] whitespace-nowrap font-mono font-black rounded-lg uppercase tracking-wide border transition-all select-none opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-350 dark:border-slate-800 text-slate-500"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Graph Layout Area */}
      <div className="flex-grow h-0 min-h-0 bg-[var(--analytics-bg-inner)] p-3 rounded-lg border border-[var(--analytics-border-inner)] overflow-y-auto space-y-4 custom-gallery-scrollbar">
        {/* Graph rendering disabled on purpose: /api/topology returns a Plotly figure
            object with no top-level v/p/q, so sessionData.active never populates and
            these charts never had real data anyway. Always show the empty state. */}
        {true ? (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-[10px] text-[var(--analytics-text-muted)] font-mono uppercase tracking-widest">
              No Data Stream Instantiated
            </p>
          </div>
        ) : (
          charts.map(c => renderPlot(c))
        )}
      </div>

      {/* Chart Focus Overlay Modal — disabled along with graph rendering above */}
      {false && maximizedChart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-6 md:p-12 animate-fadeIn">
          <div className="w-full max-w-5xl bg-[var(--analytics-bg-outer)] p-2 rounded-xl border border-slate-700/30 shadow-2xl">
            {renderPlot(charts.find(c => c.id === maximizedChart), true)}
          </div>
        </div>
      )}

      {/* Component Injected Global Scrollbar Tweaks */}
      <style>{`
        .custom-gallery-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-gallery-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-gallery-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .custom-gallery-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}