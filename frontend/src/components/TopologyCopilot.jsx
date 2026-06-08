import React, { useState } from 'react';
import { Zap, GitFork, Send } from 'lucide-react';

export default function TopologyCopilot({ status }) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'system', content: 'IEEE 33-Bus System Copilot Terminal online.' }
  ]);

  // FIX: This function was missing
  const handlePillClick = (commandText) => {
    setInputValue(commandText);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // FIX: Using the same variable name consistently
    const msg = { sender: 'user', content: inputValue };
    setMessages((prev) => [...prev, msg]);
    setInputValue(''); 

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg.content }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { sender: 'system', content: data.reply }]);
    } catch (err) {
      console.error("Backend error:", err);
    }
  };

  return (
    <div className="bg-[#0b1329] rounded-xl p-4 border border-blue-900/40 shadow-xl flex flex-col h-full min-h-[600px]">
      
      {/* Header section: Removed the redundant flex div, using grid directly */}
      <div className="grid grid-cols-3 items-center mb-4 w-full">
        <div className="flex items-center gap-2">
          <span className="text-orange-600 text-sm">🤖</span>
          <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">Topology Copilot</h2>
        </div>
        <div className="flex justify-center">
          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider font-mono px-3 py-1 rounded-full border ${status === "Not Started" ? "bg-red-900/30 text-red-400 border-red-800/50" : "bg-blue-900/30 text-blue-400 border-blue-800/50"}`}>
            <Zap size={12} />
            Session: { status}
          </span>
        </div>
        <div className="flex justify-end">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-green-900/30 text-green-400 font-mono px-3 py-1 rounded-full border border-blue-800/50">
          <GitFork size={12} />
          Branch Chat
          </span>
        </div>
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
      <div className="flex gap-2 items-center w-full mt-2">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="disconnect [34] or reset |..."
          className="flex-grow bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-slate-700"
        />
        <button className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-lg border border-slate-700 text-blue-400 transition-colors">
          <Send size={16} /> {/* Make sure to import { Send } from 'lucide-react' */}
        </button>
      </div>
    </div>
  );
}