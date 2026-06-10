import React, { useState, useEffect, useRef } from 'react';
import { Zap, GitFork, Send, Smile } from 'lucide-react';

export default function TopologyCopilot({ status, setStatus }) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  // 1. Fetch initial welcome criteria straight from backend upon component mount
useEffect(() => {
  const fetchWelcomeMessage = async () => {
    try {
      // ADDED CACHE BYPASS OPTIONS IN FETCH HOOK
      const response = await fetch("http://127.0.0.1:8000/api/init", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      const data = await response.json();
      setMessages([{ sender: 'system', content: data.reply }]);
      if (setStatus) setStatus(data.status);
    } catch (err) {
      console.error("Failed to fetch initial message:", err);
      setMessages([{ sender: 'system', content: 'Connection failure: Terminal backend offline.' }]);
    }
  };
  fetchWelcomeMessage();
}, [setStatus]);

  // 2. Smoothly scroll down view screen when new lines join the chat queue
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handlePillClick = (commandText) => {
    setInputValue(commandText);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

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
      
      // Update the chat stream with the response payload
      setMessages((prev) => [...prev, { sender: 'system', content: data.reply }]);
      
      // Propagate system operational status state upward if parent handler exists
      if (setStatus && data.status) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error("Backend transmission error:", err);
    }
  };

  return (
    <div className="bg-[#0b1329] rounded-xl p-4 border border-blue-900/40 shadow-xl flex flex-col h-full min-h-[600px]">
      
      {/* Header telemetry metadata metrics row */}
      <div className="grid grid-cols-3 items-center mb-4 w-full">
        <div className="flex items-center gap-2">
          <span className="text-orange-600 text-sm">🤖</span>
          <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">Topology Copilot</h2>
        </div>
        <div className="flex justify-center">
          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider font-mono px-3 py-1 rounded-full border ${status === "Not Started" ? "bg-red-900/30 text-red-400 border-red-800/50" : "bg-blue-900/30 text-blue-400 border-blue-800/50"}`}>
            <Zap size={12} />
            Session: {status}
          </span>
        </div>
        <div className="flex justify-end">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-green-900/30 text-green-400 font-mono px-3 py-1 rounded-full border border-blue-800/50">
            <GitFork size={12} />
            Branch Chat
          </span>
        </div>
      </div>

      {/* Terminal Display Output Screen with Frosted Steel Blue Background */}
      <div className="flex-grow bg-[#111a2e] p-4 rounded-lg font-mono text-xs border border-slate-800 overflow-y-auto space-y-4 min-h-[350px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            {m.sender === 'user' ? (
              <div className="text-right w-full flex justify-end">
                <div className="bg-blue-900/20 px-4 py-3 rounded-xl rounded-tr-none border border-blue-500/30 font-mono shadow-md text-left max-w-[60%]">
                  <span className="text-[9px] text-blue-400 font-mono tracking-wider font-bold uppercase block mb-2 text-left opacity-80">
                    USER • {new Date().toLocaleTimeString()}
                  </span>
                  <div className="text-slate-100 font-mono leading-relaxed break-all">
                    {m.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-left w-full">
                <div className="bg-slate-900/40 px-4 py-3 rounded-xl rounded-tl-none border border-slate-800/60 shadow-md w-fit max-w-[75%]">
                  <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wider uppercase block mb-1.5">
                    SYSTEM • {new Date().toLocaleTimeString()}
                  </span>
                  <div className="text-slate-100 font-mono leading-relaxed break-all">
                    {m.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Access Macro Command Selection Grid Buttons */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button 
            onClick={() => handlePillClick('Isolate [33, 34, 35]')}
            className="bg-slate-800 hover:bg-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300 border border-slate-700 transition-colors"
          >
            Isolate 33,34,35
          </button>
          <button 
            onClick={() => handlePillClick('Reset Network')}
            className="bg-slate-800 hover:bg-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300 border border-slate-700 transition-colors"
          >
            Reset Network
          </button>
          <button 
            onClick={() => handlePillClick('Power Factor')}
            className="bg-slate-800 hover:bg-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300 border border-slate-700 transition-colors"
          >
            Power Factor
          </button>
          <button 
            onClick={() => handlePillClick('Reset Parameters')}
            className="bg-slate-800 hover:bg-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300 border border-slate-700 transition-colors"
          >
            Reset Parameters
          </button>
          <button 
            onClick={() => handlePillClick('Display Smiley Face')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] px-3 py-1 rounded-full text-slate-300 border border-slate-700 transition-colors"
          >
            <Smile className="w-3.5 h-3.5 text-slate-400" />
            Smiley Face
          </button>
        </div>
      </div>

      {/* Input Entry Prompt Command Execution Frame */}
      <div className="flex gap-2 items-center w-full mt-2">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
          placeholder="isolate [34] or reset |..."
          className="flex-grow bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-slate-700"
        />
        <button 
          onClick={handleSendMessage} 
          className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-lg border border-slate-700 text-blue-400 transition-colors cursor-pointer">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}