/* src/components/TopologyCopilot.jsx */

import React, { useState, useEffect, useRef } from 'react';
import { Zap, GitFork, Send, Smile } from 'lucide-react';
import '../styles/TopologyCopilot.css'; 

export default function TopologyCopilot({ 
  status, 
  setStatus, 
  sessionName, 
  setSessionName, 
  initialData, 
  currentTheme = "dark",
  onBranchClick 
}) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.history) {
        setMessages(initialData.history);
      } else {
        setMessages([{ 
          sender: initialData.sender || initialData.role || 'system', 
          content: initialData.content || initialData.reply, 
          timestamp: initialData.timestamp 
        }]);
      }
    }
  }, [initialData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handlePillClick = (commandText) => {
    setInputValue(commandText);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userContent = inputValue;
    setInputValue(''); 

    try {
      // Maps to your session specific endpoint matching your App.jsx routing logic
      const targetUrl = sessionName 
        ? `http://127.0.0.1:8000/api/session/${encodeURIComponent(sessionName)}/message`
        : "http://127.0.0.1:8000/api/message";

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userContent,
          session_name: sessionName 
        }),
      });
      
      const data = await response.json();
      
      if (data.history) {
        setMessages(data.history);
      } else {
        setMessages((prev) => [
          ...prev, 
          { 
            sender: 'user', 
            content: userContent, 
            timestamp: data.user_time || new Date().toLocaleTimeString() 
          },
          { 
            sender: 'system', 
            content: data.reply || data.content, 
            timestamp: data.system_time || data.timestamp || new Date().toLocaleTimeString() 
          }
        ]);
      }
      
      if (setStatus && data.status) setStatus(data.status);
      if (setSessionName && data.session_name !== undefined) setSessionName(data.session_name);
      
    } catch (err) {
      console.error("Backend transmission error:", err);
    }
  };

  return (
    <div data-theme={currentTheme} className="bg-[var(--copilot-bg-outer)] rounded-xl p-4 border border-[var(--copilot-border-outer)] shadow-xl flex flex-col h-full w-full overflow-hidden">
      
      {/* Header telemetry metadata metrics row */}
      <div className="flex items-center justify-between gap-2 mb-4 w-full flex-shrink-0 border-b border-[var(--copilot-border-inner)] pb-3">
        
        {/* Left Group: Topology Copilot title and Session badge */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-orange-600 text-xs md:text-sm flex-shrink-0">🤖</span>
            <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--copilot-text-header)] uppercase font-sans">
              Topology Copilot
            </h2>
          </div>

          {/* Session Status Badge */}
          <span className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider font-mono px-2.5 py-1 rounded-full border whitespace-nowrap ${
            status === "Not Started" 
              ? "bg-[var(--copilot-bg-status-inactive)] text-[var(--copilot-text-status-inactive)] border-red-800/50" 
              : "bg-[var(--copilot-bg-status-active)] text-[var(--copilot-text-status-active)] border-blue-800/50"
          }`}>
            <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
            <span>
              Session: {status === "Not Started" ? "Not Started" : (sessionName || "Active")}
            </span>
          </span>
        </div>

        {/* Right Group: Reconfigured Interactive Branch Chat Button Badge */}
        <div className="flex-shrink-0">
          <button
            type="button"
            disabled={status === "Not Started"}
            onClick={onBranchClick}
            className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-[var(--copilot-bg-branch)] text-[var(--copilot-text-branch)] font-mono px-2.5 py-1 rounded-full border border-blue-800/50 whitespace-nowrap transition-all select-none ${
              status === "Not Started"
                ? "opacity-40 cursor-not-allowed border-slate-800"
                : "cursor-pointer hover:bg-blue-950/40 active:scale-95"
            }`}
            title={status === "Not Started" ? "Initialize a valid session stream to unlock parallel branching options" : "Fork parallel history trace"}
          >
            <GitFork className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
            <span className="inline">Branch Chat</span>
          </button>
        </div>

      </div>

      {/* Localized contained scroll view container frame */}
      <div className="flex-grow h-0 min-h-0 bg-[var(--copilot-bg-inner)] p-4 rounded-lg font-mono text-xs md:text-sm border border-[var(--copilot-border-inner)] overflow-y-auto space-y-4 custom-scrollbar">
        {messages.map((m, i) => {
          // Normalize sender check to safely parse both 'user' vs 'sender' formats
          const isUser = m.sender === 'user' || m.role === 'user';
          const msgContent = m.content || m.text;
          const msgTime = m.timestamp;

          return (
            <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              {isUser ? (
                <div className="text-right w-full flex justify-end">
                  <div className="bg-[var(--copilot-bg-user-bubble)] px-4 py-3 rounded-xl rounded-tr-none border border-[var(--copilot-border-user-bubble)] font-mono shadow-md text-left max-w-[60%]">
                    <span className="text-[10px] md:text-xs text-[var(--copilot-text-user-timestamp)] font-mono tracking-wider font-bold uppercase block mb-2 text-left opacity-90">
                      USER • {msgTime}
                    </span>
                    <div className="text-[var(--copilot-text-main)] font-mono leading-relaxed break-words [overflow-wrap:anywhere]">
                      {msgContent}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-left w-full">
                  <div className="bg-[var(--copilot-bg-system-bubble)] px-4 py-3 rounded-xl rounded-tl-none border border-[var(--copilot-border-system-bubble)] shadow-md w-fit max-w-[75%]">
                    <span className="text-[10px] md:text-xs text-[var(--copilot-text-system-timestamp)] font-mono font-bold tracking-wider uppercase block mb-1.5">
                      SYSTEM • {msgTime}
                    </span>
                    <div className="text-[var(--copilot-text-main)] font-mono leading-relaxed break-words [overflow-wrap:anywhere]">
                      {msgContent}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Access Macro Command Selection Grid Buttons */}
      <div className="mt-4 flex-shrink-0">
        <div className="flex flex-wrap gap-2 mb-3 max-h-[120px] overflow-y-auto custom-scrollbar">
          {[
            { text: 'Isolate 33,34,35', type: 'isolate' },
            { text: 'Reset Network', type: 'reset-n' },
            { text: 'Power Factor', type: 'p-factor' },
            { text: 'Reset Parameters', type: 'reset-p' }
          ].map((cmd) => (
            <button 
              type="button"
              key={cmd.text}
              onClick={() => handlePillClick(cmd.text)}
              style={{
                backgroundColor: `var(--copilot-bg-pill-${cmd.type})`,
                borderColor: `var(--copilot-border-pill-${cmd.type})`,
                color: `var(--copilot-text-pill-${cmd.type})`
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--copilot-hover-pill-${cmd.type})`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `var(--copilot-bg-pill-${cmd.type})`}
              className="text-[11px] font-bold uppercase tracking-wide font-sans px-4 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm transform active:scale-95"
            >
              {cmd.text}
            </button>
          ))}
          
          {/* Dedicated Smiley Button mapping to its split variable setup */}
          <button 
            type="button"
            onClick={() => handlePillClick('Display Smiley Face')}
            style={{
              backgroundColor: 'var(--copilot-bg-pill-smiley)',
              borderColor: 'var(--copilot-border-pill-smiley)',
              color: 'var(--copilot-text-pill-smiley)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--copilot-hover-pill-smiley)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--copilot-bg-pill-smiley)'}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide font-sans px-4 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm transform active:scale-95"
          >
            <Smile className="w-3.5 h-3.5" style={{ color: 'var(--copilot-text-pill-smiley)' }} />
            Smiley Face
          </button>
        </div>
      </div>

      {/* Input Entry Prompt Command Execution Frame */}
      <div className="flex gap-2 items-center w-full mt-2 flex-shrink-0">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
          placeholder="isolate [34] or reset |..."
          className="flex-grow bg-[var(--copilot-bg-input)] border border-[var(--copilot-border-inner)] rounded-lg py-2.5 px-3 text-xs md:text-sm font-mono text-[var(--copilot-text-input)] placeholder-[var(--copilot-placeholder-input)] focus:outline-none focus:border-[var(--copilot-text-muted)]"
        />
        <button 
          type="button"
          onClick={handleSendMessage} 
          className="bg-[var(--copilot-bg-action)] hover:border-[var(--copilot-border-subtle)] p-2.5 rounded-lg border border-[var(--copilot-border-action)] text-[var(--copilot-text-status-active)] transition-all active:scale-95 cursor-pointer flex items-center justify-center"
        >
          <Send className="w-4 h-4 md:w-4.5 md:h-4.5" />
        </button>
      </div>
    </div>
  );
}