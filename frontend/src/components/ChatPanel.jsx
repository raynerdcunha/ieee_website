import React, { useState } from 'react';

const ChatPanel = ({ 
  isOpen, 
  onClose, 
  sessions = [], 
  currentSessionName,
  onDeleteSuccess 
}) => {
  // Local state to keep track of a two-step wipe right inside the card frame
  const [deletingSessionName, setDeletingSessionName] = useState(null);

  const handleSelectSession = (session) => {
    if (deletingSessionName) return;
    // Route browser to the session file name path slug
    window.location.href = `/${encodeURIComponent(session.name)}`;
    onClose();
  };

  const handleNewChat = () => {
    // Navigate back to core root workspace to run /api/init initialization
    window.location.href = '/';
    onClose();
  };

  const executeDelete = async (targetName, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/session/${encodeURIComponent(targetName)}`, {
        method: 'DELETE'
      });
      if (response.ok && onDeleteSuccess) {
        onDeleteSuccess(); // Instantly runs fetchAllSessions() in your App.jsx
      }
    } catch (err) {
      console.error("Backend file unlink failure:", err);
    } finally {
      setDeletingSessionName(null);
    }
  };

  return (
    <>
      {/* Sliding Left Drawer Overlay Mask */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 backdrop-blur-sm ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-[#0d1527] dark:bg-[#070D1E] border-r border-slate-800/80 shadow-2xl flex flex-col z-50 transition-transform duration-300 transform pointer-events-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-100">Chat Sessions</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm cursor-pointer pointer-events-auto"
          >
            ✕
          </button>
        </div>
        <div className="p-4 border-b border-slate-800/80">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wide cursor-pointer pointer-events-auto transition-colors"
          >
            + Start New Chat
          </button>
        </div>
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Saved History</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5 scrollbar-thin pointer-events-auto">
          {sessions.map((s, index) => {
            // Handles if backend outputs array of strings or raw file objects
            const targetName = typeof s === 'string' ? s : s.name;
            const displayTime = s.mtime_display || "History Log";
            
            const isActive = currentSessionName === targetName;
            const isConfirmingDelete = deletingSessionName === targetName;

            return (
              <div
                key={targetName || index}
                className={`group relative flex items-center justify-between p-3 rounded-xl border transition pointer-events-auto ${
                  isActive
                    ? 'bg-blue-950/40 border-blue-700/50 text-slate-100'
                    : isConfirmingDelete
                    ? 'bg-red-950/20 border-red-900/50 text-red-200'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-300 hover:bg-slate-850'
                }`}
              >
                {!isConfirmingDelete ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectSession(s)}
                      className="flex-1 text-left min-w-0 bg-transparent border-0 p-0 cursor-pointer"
                    >
                      <div className="text-[11px] font-semibold truncate pr-4">{targetName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{displayTime}</div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingSessionName(targetName);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800/50 transition opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 font-bold cursor-pointer"
                      title="Delete Session"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  /* Inline Action Overwrite Block that maintains your friend's exact card dimensions */
                  <div className="flex items-center justify-between w-full gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 font-sans">
                      Delete?
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => executeDelete(targetName, e)}
                        className="text-[9px] font-bold uppercase px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer transition-colors"
                      >
                        Wipe
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSessionName(null)}
                        className="text-[9px] font-bold uppercase px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="text-center py-8 border border-dashed border-slate-800/40 rounded-xl">
              <div className="text-slate-600 text-[10px] font-bold uppercase tracking-wider">No Backlogs Logged</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ChatPanel;