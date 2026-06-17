import React from 'react';
import '../styles/AnalyticsStreamGallery.css'; 

export default function AnalyticsStreamGallery({ currentTheme = "light" }) {
  return (
    <div data-theme={currentTheme} className="bg-[var(--analytics-bg-outer)] rounded-xl p-4 border border-[var(--analytics-border-outer)] shadow-xl flex flex-col h-full w-full overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 w-full flex-shrink-0 border-b border-[var(--analytics-border-inner)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-xs md:text-sm">📊</span>
          <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--analytics-text-header)] uppercase font-sans">
            ANALYTICS STREAM GALLERY
          </h2>
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