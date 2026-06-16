import React, { useState } from 'react';

const ChatPanel = ({ 
  isOpen, 
  onClose, 
  sessions = [], 
  currentSessionName,
  onDeleteSuccess 
}) => {
  // Modal tracking state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionTargetForDeletion, setSessionTargetForDeletion] = useState(null);

  const handleSelectSession = (session) => {
    window.location.href = `/${encodeURIComponent(session.name)}`;
    onClose();
  };

  const handleNewChat = () => {
    window.location.href = '/';
    onClose();
  };

  // Triggers when the user clicks the initial "X" icon on the card item row
  const handleOpenDeleteModal = (targetName, e) => {
    e.stopPropagation();
    setSessionTargetForDeletion(targetName);
    setDeleteModalOpen(true);
  };

  // Triggers when the user clicks the final confirmed red "Delete" button inside the modal
  const submitDeleteSession = async () => {
    if (!sessionTargetForDeletion) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/session/${encodeURIComponent(sessionTargetForDeletion)}`, {
        method: 'DELETE'
      });
      if (response.ok && onDeleteSuccess) {
        onDeleteSuccess(); // Re-fetch active backend entries array immediately
      }
    } catch (err) {
      console.error("Backend file unlink failure:", err);
    } finally {
      setDeleteModalOpen(false);
      setSessionTargetForDeletion(null);
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
            const targetName = typeof s === 'string' ? s : s.name;
            const displayTime = s.mtime_display || "History Log";
            const isActive = currentSessionName === targetName;

            return (
              <div
                key={targetName || index}
                className={`group relative flex items-center justify-between p-3 rounded-xl border transition pointer-events-auto ${
                  isActive
                    ? 'bg-blue-950/40 border-blue-700/50 text-slate-100'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-300 hover:bg-slate-850'
                }`}
              >
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
                  onClick={(e) => handleOpenDeleteModal(targetName, e)}
                  className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800/50 transition opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 font-bold cursor-pointer"
                  title="Delete Session"
                >
                  ✕
                </button>
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

      {/* CUSTOM OVERLAY MODAL: Confirm Delete Session */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 dark:bg-[#070D1E] border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 z-10 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-400">
              Delete Chat Session
            </h3>
            <p className="text-[11px] text-slate-300 font-sans">
              Are you sure you want to delete this session? This action will securely wipe the session from storage and cannot be undone.
            </p>
            <div className="flex justify-end gap-2 text-[11px] font-bold mt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDeleteSession}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPanel;