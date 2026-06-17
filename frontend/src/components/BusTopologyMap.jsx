/* src/components/BusTopologyMap.jsx */

import React from 'react';
import '../styles/BusTopologyMap.css'; // Purely segregated styles

export default function BusTopologyMap({ currentTheme = "light" }) {
  return (
    <div data-theme={currentTheme} className="bg-[var(--bus-bg-outer)] rounded-xl p-4 border border-[var(--bus-border-outer)] shadow-xl flex flex-col h-full w-full overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 w-full flex-shrink-0 border-b border-[var(--bus-border-inner)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 text-xs md:text-sm">🌐</span>
          <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--bus-text-header)] uppercase font-sans">
            BUS TOPOLOGY MAP
          </h2>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow bg-[var(--bus-bg-inner)] rounded-lg border border-[var(--bus-border-inner)] flex items-center justify-center">
        <p className="text-[10px] text-[var(--bus-text-muted)] font-mono uppercase tracking-widest">
          Map Visualization Layer
        </p>
      </div>
    </div>
  );
}