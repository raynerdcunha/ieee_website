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
  onHistoricalJump,     // Callback hooks for time travel triggers
  historicalMessage,    // Tracks currently active time-jump target reference
  onBranchFromHistory   // Connects historical data snapshot fork executions up here
}) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // ✅ Updated tracking conditional using sequence numbers
  const isHistoricalMode = !!(historicalMessage && historicalMessage.state_seq_id !== undefined && historicalMessage.state_seq_id !== 0);

  useEffect(() => {
    if (initialData) {
      if (initialData.history) {
        setMessages(initialData.history);
      } else {
        setMessages([
          {
            sender: initialData.sender || initialData.role || 'system',
            content: initialData.content || initialData.reply,
            timestamp: initialData.timestamp,
            state_seq_id: initialData.state_seq_id || 0 // ✅ Safeguard initialization fallback
          }
        ]);
      }
    }
  }, [initialData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePillClick = (commandText) => {
    if (isHistoricalMode) return; // Prevent action while tracking history logs
    setInputValue(commandText);
  };

  const handleSendMessage = async () => {
    if (isHistoricalMode || !inputValue.trim()) return;

    const userContent = inputValue;
    setInputValue('');

    try {
      const response = await fetch("http://127.0.0.1:9700/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userContent, session_name: sessionName }),
      });
      const data = await response.json();

      // Step 1: Render your UI text messages completely first
      if (data.history) {
        setMessages(data.history);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'user',
            content: userContent,
            timestamp: data.user_time || new Date().toLocaleTimeString(),
            state_seq_id: data.state_seq_id // ✅ Dynamic tracking alignment
          },
          {
            sender: 'system',
            content: data.reply || data.content,
            timestamp: data.system_time || data.timestamp || new Date().toLocaleTimeString(),
            state_seq_id: data.state_seq_id // ✅ Dynamic tracking alignment
          }
        ]);
      }

      if (setStatus && data.status) setStatus(data.status);
      if (setSessionName && data.session_name !== undefined) setSessionName(data.session_name);

      // Step 2: Allow message rendering and file-write processes to fully settle down
      if (data.stage && typeof onStageChange === 'function') {
        setTimeout(() => {
          onStageChange(data.stage);
        }, 50);
      }
    } catch (err) {
      console.error("Backend transmission error:", err);
    }
  };

  return (
    <div
      data-theme={currentTheme}
      className={`bg-[var(--copilot-bg-outer)] rounded-xl p-4 border shadow-xl flex flex-col h-full w-full overflow-hidden transition-all duration-300 ${
        isHistoricalMode
          ? 'border-amber-500/50 shadow-amber-950/20 ring-1 ring-amber-500/20'
          : 'border-[var(--copilot-border-outer)]'
      }`}
    >
      {/* Header Panel */}
      <div className="flex items-center justify-between gap-2 mb-4 w-full flex-shrink-0 border-b border-[var(--copilot-border-inner)] pb-3">
        <div className="flex items-center gap-3 min-w-0 flex-shrink">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`${isHistoricalMode ? 'text-amber-500 animate-pulse' : 'text-orange-600'} text-xs md:text-sm flex-shrink-0`}>
              {isHistoricalMode ? <History className="w-4 h-4" /> : "🤖"}
            </span>
            <h2 className="text-xs md:text-sm font-black tracking-[0.1em] text-[var(--copilot-text-header)] uppercase font-sans flex items-center gap-1">
              TOPOLOGY COPILOT
            </h2>
          </div>
          <span className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider font-mono px-2.5 py-1 rounded-full border whitespace-nowrap ${
            status === "Not Started"
              ? "bg-[var(--copilot-bg-status-inactive)] text-[var(--copilot-text-status-inactive)] border-red-800/50"
              : "bg-[var(--copilot-bg-status-active)] text-[var(--copilot-text-status-active)] border-blue-800/50"
          }`}>
            <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
            <span>Session: {status === "Not Started" ? "Not Started" : (sessionName || "Active")}</span>
          </span>
        </div>

        {/* Dynamic Action Buttons Section */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isHistoricalMode ? (
            <button
              type="button"
              onClick={() => onBranchFromHistory && onBranchFromHistory(historicalMessage)}
              className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none active:scale-95 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--copilot-branch-hist-btn-bg)',
                borderColor: 'var(--copilot-branch-hist-btn-border)',
                color: 'var(--copilot-branch-hist-btn-text)'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--copilot-branch-hist-btn-bg-hover)'; e.currentTarget.style.color = 'var(--copilot-branch-hist-btn-text-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--copilot-branch-hist-btn-bg)'; e.currentTarget.style.color = 'var(--copilot-branch-hist-btn-text)'; }}
            >
              <GitFork className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" style={{ color: 'var(--copilot-branch-hist-icon-clr)' }} />
              <span>Branch State</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={status === "Not Started"}
              onClick={onBranchClick}
              className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider font-mono px-2.5 py-1 rounded-full border whitespace-nowrap transition-all select-none ${
                status === "Not Started"
                  ? "opacity-40 cursor-not-allowed border-slate-800"
                  : "cursor-pointer active:scale-95"
              }`}
              style={status !== "Not Started" ? {
                backgroundColor: 'var(--copilot-branch-live-btn-bg)',
                borderColor: 'var(--copilot-branch-live-btn-border)',
                color: 'var(--copilot-branch-live-btn-text)'
              } : {}}
              onMouseEnter={e => status !== "Not Started" && (e.currentTarget.style.backgroundColor = 'var(--copilot-branch-live-btn-bg-hover)')}
              onMouseLeave={e => status !== "Not Started" && (e.currentTarget.style.backgroundColor = 'var(--copilot-branch-live-btn-bg)')}
              title={status === "Not Started" ? "Initialize a valid session stream to unlock parallel branching options" : "Fork parallel history trace"}
            >
              <GitFork className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" style={{ color: 'var(--copilot-branch-live-icon-clr)' }} />
              <span className="inline">Branch Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Output Workspace */}
      <div className="flex-grow h-0 min-h-0 bg-[var(--copilot-bg-inner)] p-4 rounded-lg font-mono text-xs md:text-sm border border-[var(--copilot-border-inner)] overflow-y-auto space-y-4 custom-scrollbar">
        {messages.map((m, i) => {
          const isUser = m.sender === 'user' || m.role === 'user';
          const msgContent = m.content || m.text;
          const msgTime = m.timestamp;
          
          // ✅ Block selection logic: Only system messages with sequence numbers > 0 can be clicked
          const isSelectableSnapshot = !isUser && m.state_seq_id !== undefined && m.state_seq_id > 0;
          // ✅ Only flag as an active highlight track if it passes selection rules first
          const isCurrentlyTargetedFrame = isSelectableSnapshot && historicalMessage && historicalMessage.state_seq_id !== undefined && historicalMessage.state_seq_id === m.state_seq_id;

          return (
            <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              {isUser ? (
                <div className="text-right w-full flex justify-end">
                  <div className="bg-[var(--copilot-bg-user-bubble)] px-4 py-3 rounded-xl rounded-tr-none border border-[var(--copilot-border-user-bubble)] font-mono shadow-md text-left max-w-[60%]">
                    <span className="text-[10px] md:text-xs text-[var(--copilot-text-user-timestamp)] font-mono tracking-wider font-bold uppercase block mb-2 text-left opacity-90">
                      USER • {msgTime} [ID: {m.state_seq_id ?? 0}]
                    </span>
                    <div className="text-[var(--copilot-text-main)] font-mono leading-relaxed break-words [overflow-wrap:anywhere]">
                      {msgContent}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-left w-full">
                  <div
                    // ✅ Blocks jump callback handler execution entirely if tracking a setup window log
                    onClick={() => isSelectableSnapshot && onHistoricalJump && onHistoricalJump(m)}
                    className={`bg-[var(--copilot-bg-system-bubble)] px-4 py-3 rounded-xl rounded-tl-none border shadow-md w-fit max-w-[75%] transition-all ${
                      isSelectableSnapshot ? 'cursor-pointer select-none hover:scale-[1.01]' : 'cursor-default select-text'
                    } ${
                      isCurrentlyTargetedFrame
                        ? 'border-amber-500 bg-amber-950/20 shadow-amber-950/40 shadow-lg'
                        : isSelectableSnapshot
                        ? 'border-[var(--copilot-border-system-bubble)] hover:border-slate-500'
                        : 'border-[var(--copilot-border-system-bubble)] opacity-85'
                    }`}
                    title={isSelectableSnapshot ? "Click message profile frame to view historical topology grid alignment" : undefined}
                  >
                    <span className="text-[10px] md:text-xs text-[var(--copilot-text-system-timestamp)] font-mono font-bold tracking-wider uppercase block mb-1.5 flex items-center gap-1.5">
                      SYSTEM • {msgTime} [ID: {m.state_seq_id ?? 0}]
                      {isCurrentlyTargetedFrame && (
                        <span className="text-[9px] font-semibold text-amber-400 font-sans tracking-wide lowercase bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30 animate-pulse">
                          active track
                        </span>
                      )}
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

      {/* Command Pill Box Options */}
      <div className="mt-4 flex-shrink-0">
        <div className="flex flex-wrap gap-2 mb-3 max-h-[120px] overflow-y-auto custom-scrollbar">
          {[
            { text: 'Change Voltage', type: 'reset-n', command: 'v*2 [all]' },
            { text: 'Isolate 33,34,35', type: 'isolate', command: 'Isolate 33,34,35' },
            { text: 'Power Factor', type: 'p-factor', command: 'Power Factor' },
            { text: 'Reset Network', type: 'reset-p', command: 'Reset Network' }
          ].map((cmd) => (
            <button
              type="button"
              key={cmd.text}
              disabled={isHistoricalMode}
              onClick={() => handlePillClick(cmd.command)}
              style={{
                backgroundColor: `var(--copilot-bg-pill-${cmd.type})`,
                borderColor: `var(--copilot-border-pill-${cmd.type})`,
                color: `var(--copilot-text-pill-${cmd.type})`
              }}
              className={`text-[11px] font-bold uppercase tracking-wide font-sans px-4 py-1.5 rounded-full border transition-all shadow-sm transform ${
                isHistoricalMode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] active:scale-95'
              }`}
            >
              {cmd.text}
            </button>
          ))}
          <button
            type="button"
            disabled={isHistoricalMode}
            onClick={() => handlePillClick('Display Smiley Face')}
            style={{
              backgroundColor: 'var(--copilot-bg-pill-smiley)',
              borderColor: 'var(--copilot-border-pill-smiley)',
              color: 'var(--copilot-text-pill-smiley)'
            }}
            className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide font-sans px-4 py-1.5 rounded-full border transition-all shadow-sm transform ${
              isHistoricalMode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] active:scale-95'
            }`}
          >
            <Smile className="w-3.5 h-3.5" style={{ color: 'var(--copilot-text-pill-smiley)' }} />
            Smiley Face
          </button>
        </div>
      </div>

      {/* Chat Form Input Panel Frame */}
      <div className="flex gap-2 items-center w-full mt-2 flex-shrink-0">
        <input
          type="text"
          value={inputValue}
          disabled={isHistoricalMode}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={isHistoricalMode ? "Input disabled during historical tracking mode..." : "isolate [34] or reset |..."}
          className={`flex-grow border rounded-lg py-2.5 px-3 text-xs md:text-sm font-mono text-[var(--copilot-text-input)] focus:outline-none transition-all ${
            isHistoricalMode
              ? 'bg-amber-950/10 border-amber-900/40 text-amber-600/70 placeholder-amber-700/40 cursor-not-allowed'
              : 'bg-[var(--copilot-bg-input)] border-[var(--copilot-border-inner)] placeholder-[var(--copilot-placeholder-input)] focus:border-[var(--copilot-text-muted)]'
          }`}
        />
        <button
          type="button"
          disabled={isHistoricalMode || !inputValue.trim()}
          onClick={handleSendMessage}
          className={`p-2.5 rounded-lg border transition-all flex items-center justify-center ${
            isHistoricalMode || !inputValue.trim()
              ? 'bg-slate-800/20 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              : 'cursor-pointer active:scale-95'
          }`}
          style={(!isHistoricalMode && inputValue.trim()) ? {
            backgroundColor: 'var(--copilot-send-btn-bg)',
            borderColor: 'var(--copilot-send-btn-border)',
          } : {}}
          onMouseEnter={e => (!isHistoricalMode && inputValue.trim()) && (e.currentTarget.style.borderColor = 'var(--copilot-send-btn-border-hover)')}
          onMouseLeave={e => (!isHistoricalMode && inputValue.trim()) && (e.currentTarget.style.borderColor = 'var(--copilot-send-btn-border)')}
        >
          <Send className="w-4 h-4 md:w-4.5 md:h-4.5" style={{ color: 'var(--copilot-send-icon-clr)' }} />
        </button>
      </div>
    </div>
  );
}