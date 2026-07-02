/* src/components/AnalyticsStreamGallery.jsx */
import React from 'react';
import { Download, History } from 'lucide-react';
import '../styles/AnalyticsStreamGallery.css';

export default function AnalyticsStreamGallery({ currentTheme = "light", historicalMessage = null }) {
  // ✅ Updated conditional tracking logic to look for explicit tracking IDs rather than arbitrary clock parameters
  const isHistoricalMode = !!(historicalMessage && historicalMessage.state_seq_id !== undefined && historicalMessage.state_seq_id !== 0);

  return (
    <div
      data-theme={currentTheme}
      className={`bg-[var(--analytics-bg-outer)] rounded-xl p-4 border shadow-xl flex flex-col h-full w-full overflow-hidden transition-all duration-300 ${
        isHistoricalMode ? 'border-amber-500/50 shadow-amber-950/20 ring-1 ring-amber-500/20' : 'border-[var(--analytics-border-outer)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 w-full flex-shrink-0 border-b border-[var(--analytics-border-inner)] pb-3">
        <div className="flex items-center gap-2">
          <span className={`${isHistoricalMode ? 'text-amber-500 animate-pulse' : 'text-green-500'} text-xs md:text-sm`}>
            {isHistoricalMode ? <History className="w-4 h-4" /> : "📊"}
          </span>
          <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--analytics-text-header)] uppercase font-sans flex items-center gap-2">
            ANALYTICS STREAM GALLERY
            {isHistoricalMode && (
              <span className="text-[9px] font-mono tracking-wide px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase animate-pulse">
                ARCHIVE GRAPH VIEW
              </span>
            )}
          </h2>
        </div>

        {/* Action Controls: Download ZIP Action & Structural Layout Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase rounded-md border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer select-none active:scale-95"
          >
            <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">DOWNLOAD ZIP</span>
          </button>
          
          {/* Inactive Structural Resize Action triggers */}
          <button
            type="button"
            disabled
            className="p-1.5 rounded-md border border-slate-800 bg-slate-900/20 text-slate-600 transition-all select-none opacity-40 cursor-not-allowed flex items-center justify-center w-7 h-7 md:w-8 md:h-8"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4">
              <path d="M 4 8 L 4 4 L 8 4 M 16 4 L 20 4 L 20 8 M 20 16 L 20 20 L 16 20 M 8 20 L 4 20 L 4 16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow bg-[var(--analytics-bg-inner)] rounded-lg border border-[var(--analytics-border-inner)] flex items-center justify-center">
        <p className="text-[10px] text-[var(--analytics-text-muted)] font-mono uppercase tracking-widest">
          Data Stream Gallery
        </p>
      </div>
    </div>
  );
}