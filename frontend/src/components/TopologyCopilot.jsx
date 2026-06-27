/* src/components/TopologyCopilot.jsx */ 
import React, { useState, useEffect, useRef } from 'react'; 
import { Zap, GitFork, Send, Smile, History } from 'lucide-react'; 
import '../styles/TopologyCopilot.css'; 

export default function TopologyCopilot({ 
  status, 
  setStatus, 
  sessionName, 
  setSessionName, 
  initialData, 
  currentTheme = "dark", 
  onBranchClick, 
  onStageChange,
  onHistoricalJump,     // ADDED: Callback hooks for time travel triggers
  historicalMessage     // ADDED: Tracks currently active time-jump target reference
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
      const response = await fetch("http://127.0.0.1:8000/api/chat", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ message: userContent, session_name: sessionName }), 
      }); 
      const data = await response.json(); 
      if (data.history) { 
        setMessages(data.history); 
      } else { 
        setMessages((prev) => [ 
          ...prev, 
          { sender: 'user', content: userContent, timestamp: data.user_time || new Date().toLocaleTimeString() }, 
          { sender: 'system', content: data.reply || data.content, timestamp: data.system_time || data.timestamp || new Date().toLocaleTimeString() } 
        ]); 
      } 
      // FIXED: Dispatches state stage alterations to App.jsx to unlock the mapping view canvas instantly 
      if (data.stage && typeof onStageChange === 'function') { 
        onStageChange(data.stage); 
      } 
      if (setStatus && data.status) setStatus(data.status); 
      if (setSessionName && data.session_name !== undefined) setSessionName(data.session_name); 
    } catch (err) { 
      console.error("Backend transmission error:", err); 
    } 
  }; 

  return ( 
    <div data-theme={currentTheme} className="bg-[var(--copilot-bg-outer)] rounded-xl p-4 border border-[var(--copilot-border-outer)] shadow-xl flex flex-col h-full w-full overflow-hidden"> 
      <div className="flex items-center justify-between gap-2 mb-4 w-full flex-shrink-0 border-b border-[var(--copilot-border-inner)] pb-3"> 
        <div className="flex items-center gap-3 min-w-0 flex-shrink"> 
          <div className="flex items-center gap-1.5 flex-shrink-0"> 
            <span className="text-orange-600 text-xs md:text-sm flex-shrink-0">🤖</span> 
            <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--copilot-text-header)] uppercase font-sans flex items-center gap-1"> 
              Topology Copilot 
              {historicalMessage && <History className="w-3 h-3 text-amber-500 animate-pulse ml-0.5" />}
            </h2> 
          </div> 
          <span className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider font-mono px-2.5 py-1 rounded-full border whitespace-nowrap ${ status === "Not Started" ? "bg-[var(--copilot-bg-status-inactive)] text-[var(--copilot-text-status-inactive)] border-red-800/50" : "bg-[var(--copilot-bg-status-active)] text-[var(--copilot-text-status-active)] border-blue-800/50" }`}> 
            <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" /> 
            <span> Session: {status === "Not Started" ? "Not Started" : (sessionName || "Active")} </span> 
          </span> 
        </div> 
        <div className="flex-shrink-0"> 
          <button type="button" disabled={status === "Not Started"} onClick={onBranchClick} className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-[var(--copilot-bg-branch)] text-[var(--copilot-text-branch)] font-mono px-2.5 py-1 rounded-full border border-blue-800/50 whitespace-nowrap transition-all select-none ${ status === "Not Started" ? "opacity-40 cursor-not-allowed border-slate-800" : "cursor-pointer hover:bg-blue-950/40 active:scale-95" }`} title={status === "Not Started" ? "Initialize a valid session stream to unlock parallel branching options" : "Fork parallel history trace"} > 
            <GitFork className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" /> 
            <span className="inline">Branch Chat</span> 
          </button> 
        </div> 
      </div> 

      <div className="flex-grow h-0 min-h-0 bg-[var(--copilot-bg-inner)] p-4 rounded-lg font-mono text-xs md:text-sm border border-[var(--copilot-border-inner)] overflow-y-auto space-y-4 custom-scrollbar"> 
        {messages.map((m, i) => { 
          const isUser = m.sender === 'user' || m.role === 'user'; 
          const msgContent = m.content || m.text; 
          const msgTime = m.timestamp; 
          
          // Check if this specific item is the active historical focus block
          const isCurrentlyTargetedFrame = historicalMessage && historicalMessage.timestamp === msgTime;

          return ( 
            <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}> 
              {isUser ? ( 
                <div className="text-right w-full flex justify-end"> 
                  <div className="bg-[var(--copilot-bg-user-bubble)] px-4 py-3 rounded-xl rounded-tr-none border border-[var(--copilot-border-user-bubble)] font-mono shadow-md text-left max-w-[60%]"> 
                    <span className="text-[10px] md:text-xs text-[var(--copilot-text-user-timestamp)] font-mono tracking-wider font-bold uppercase block mb-2 text-left opacity-90"> USER • {msgTime} </span> 
                    <div className="text-[var(--copilot-text-main)] font-mono leading-relaxed break-words [overflow-wrap:anywhere]"> 
                      {msgContent} 
                    </div> 
                  </div> 
                </div> 
              ) : ( 
                <div className="text-left w-full"> 
                  <div 
                    onClick={() => onHistoricalJump && onHistoricalJump(m)}
                    className={`bg-[var(--copilot-bg-system-bubble)] px-4 py-3 rounded-xl rounded-tl-none border shadow-md w-fit max-w-[75%] cursor-pointer select-none transition-all hover:scale-[1.01] ${
                      isCurrentlyTargetedFrame 
                        ? 'border-amber-500 bg-amber-950/20 shadow-amber-950/40 shadow-lg' 
                        : 'border-[var(--copilot-border-system-bubble)] hover:border-slate-500'
                    }`}
                    title="Click message profile frame to view historical topology grid alignment"
                  > 
                    <span className="text-[10px] md:text-xs text-[var(--copilot-text-system-timestamp)] font-mono font-bold tracking-wider uppercase block mb-1.5 flex items-center gap-1.5"> 
                      SYSTEM • {msgTime} 
                      {isCurrentlyTargetedFrame && <span className="text-[9px] font-semibold text-amber-400 font-sans tracking-wide lowercase bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30">active track</span>}
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

      <div className="mt-4 flex-shrink-0"> 
        <div className="flex flex-wrap gap-2 mb-3 max-h-[120px] overflow-y-auto custom-scrollbar"> 
          {[ 
            { text: 'Isolate 33,34,35', type: 'isolate' }, 
            { text: 'Reset Network', type: 'reset-n' }, 
            { text: 'Power Factor', type: 'p-factor' }, 
            { text: 'Reset Parameters', type: 'reset-p' } 
          ].map((cmd) => ( 
            <button type="button" key={cmd.text} onClick={() => handlePillClick(cmd.text)} style={{ backgroundColor: `var(--copilot-bg-pill-${cmd.type})`, borderColor: `var(--copilot-border-pill-${cmd.type})`, color: `var(--copilot-text-pill-${cmd.type})` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--copilot-hover-pill-${cmd.type})`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `var(--copilot-bg-pill-${cmd.type})`} className="text-[11px] font-bold uppercase tracking-wide font-sans px-4 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm transform active:scale-95" > 
              {cmd.text} 
            </button> 
          ))} 
          <button type="button" onClick={() => handlePillClick('Display Smiley Face')} style={{ backgroundColor: 'var(--copilot-bg-pill-smiley)', borderColor: 'var(--copilot-border-pill-smiley)', color: 'var(--copilot-text-pill-smiley)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--copilot-hover-pill-smiley)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--copilot-bg-pill-smiley)'} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide font-sans px-4 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm transform active:scale-95" > 
            <Smile className="w-3.5 h-3.5" style={{ color: 'var(--copilot-text-pill-smiley)' }} /> Smiley Face 
          </button> 
        </div> 
      </div> 

      <div className="flex gap-2 items-center w-full mt-2 flex-shrink-0"> 
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="isolate [34] or reset |..." className="flex-grow bg-[var(--copilot-bg-input)] border border-[var(--copilot-border-inner)] rounded-lg py-2.5 px-3 text-xs md:text-sm font-mono text-[var(--copilot-text-input)] placeholder-[var(--copilot-placeholder-input)] focus:outline-none focus:border-[var(--copilot-text-muted)]" /> 
        <button type="button" onClick={handleSendMessage} className="bg-[var(--copilot-bg-action)] hover:border-[var(--copilot-border-subtle)] p-2.5 rounded-lg border border-[var(--copilot-border-action)] text-[var(--copilot-text-status-active)] transition-all active:scale-95 cursor-pointer flex items-center justify-center" > 
          <Send className="w-4 h-4 md:w-4.5 md:h-4.5" /> 
        </button> 
      </div> 
    </div> 
  ); 
}