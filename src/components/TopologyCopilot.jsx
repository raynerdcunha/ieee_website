import React, { useState } from 'react';

export default function TopologyCopilot() {
  const [inputValue, setInputValue] = useState('');

  // Handle Quick Pill clicks to populate the text input (without auto-submitting)
  const handlePillClick = (commandText) => {
    setInputValue(commandText);
  };

  return (
    <div className="bg-[#0b1329] rounded-xl p-4 border border-blue-900/40 shadow-xl flex flex-col h-full min-h-[600px]">
      {/* Header section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-orange-600 text-sm">🤖</span>
          <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">Topology Copilot</h2>
        </div>
        <span className="text-[10px] font-bold bg-blue-900/30 text-blue-400 font-mono px-2 py-0.5 rounded border border-blue-800/50">
          SESSION: active
        </span>
      </div>

      {/* Terminal Display Output Screen */}
      <div className="flex-grow bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 border border-slate-900 overflow-y-auto space-y-3 min-h-[350px]">
        <div className="text-slate-500">/* IEEE 33-Bus System Copilot Terminal online. */</div>
        <div className="text-emerald-400">rayner@grid-system:~$ Ready for parameter input...</div>
      </div>

      {/* Quick Pills Action Row */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button 
            onClick={() => handlePillClick('Isolate 33, 34, 35')}
            className="bg-slate-800 hover:bg-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300 border border-slate-700 transition-colors"
          >
            Isolate 33, 34, 35
          </button>
          <button 
            onClick={() => handlePillClick('Reset Map')}
            className="bg-slate-800 hover:bg-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300 border border-slate-700 transition-colors"
          >
            Reset Map
          </button>
          <button 
            onClick={() => handlePillClick('Power Factor')}
            className="bg-slate-800 hover:bg-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300 border border-slate-700 transition-colors"
          >
            Power Factor
          </button>
        </div>
      </div>

      {/* Input Action Command Line */}
      <div className="relative flex items-center">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="disconnect [34] or reset |..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-3 pr-10 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-slate-700"
        />
        <button className="absolute right-2 text-blue-500 hover:text-blue-400 p-1">
          ➔
        </button>
      </div>
    </div>
  );
}
