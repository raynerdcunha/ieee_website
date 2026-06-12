import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ChatPanel = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetch('http://127.0.0.1:8000/api/list-sessions')
        .then(res => res.json())
        .then(data => setSessions(data))
        .catch(err => console.error("Failed to load sessions", err));
    }
  }, [isOpen]);

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`absolute left-0 h-full w-80 bg-canvas border-r border-subtle transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header - Slimmer padding */}
        <div className="flex items-center justify-between p-4 border-b border-subtle">
          <h2 className="text-xs font-black tracking-widest uppercase">Chat Sessions</h2>
          <button onClick={onClose} className="icon-muted hover:text-primary"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="p-4">
          {/* Action Button - Slimmer vertical space */}
          <button className="w-full py-2 mb-4 bg-brand-soft border border-brand text-brand font-bold uppercase text-[10px] rounded-md hover:opacity-90 active:scale-95 transition-all">
            + Start New Chat
          </button>
          
          <h3 className="text-[9px] font-bold text-secondary uppercase tracking-wider mb-2">Saved History</h3>
          
          {/* History List - Reduced spacing and padding */}
          <div className="space-y-2 custom-scrollbar overflow-y-auto max-h-[calc(100vh-160px)]">
            {sessions.map(session => (
              <div key={session.name} className="p-3 rounded-md border border-subtle bg-surface hover:border-brand cursor-pointer transition-colors">
                <div className="font-bold text-xs text-primary truncate">{session.name}</div>
                <div className="text-[9px] text-secondary font-mono mt-0.5">{session.mtime}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;