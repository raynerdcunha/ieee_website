/* frontend/src/components/ChatPanel.jsx */

import React, { useState } from 'react';
import '../styles/ChatPanel.css'; 

const ChatPanel = ({ 
  isOpen, 
  onClose, 
  sessions = [], 
  currentSessionName,
  onDeleteSuccess 
}) => {
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

  const handleOpenDeleteModal = (targetName, e) => {
    e.stopPropagation();
    setSessionTargetForDeletion(targetName);
    setDeleteModalOpen(true);
  };

  const submitDeleteSession = async () => {
    if (!sessionTargetForDeletion) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/session/${encodeURIComponent(sessionTargetForDeletion)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Logic: If we are deleting the session currently active, redirect to root.
        // Otherwise, just refresh the list and keep the drawer open.
        if (sessionTargetForDeletion === currentSessionName) {
          window.location.href = '/';
        } else if (onDeleteSuccess) {
          onDeleteSuccess(sessionTargetForDeletion);
        }
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
        className={`fixed left-0 top-0 bottom-0 w-80 max-w-[90vw] border-r shadow-2xl flex flex-col z-50 transition-transform duration-300 transform pointer-events-auto cp-drawer ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b cp-header">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] cp-header-title">Chat Sessions</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm cursor-pointer pointer-events-auto bg-transparent border-0 cp-close-btn"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 border-b cp-action-container">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wide cursor-pointer pointer-events-auto transition-colors"
          >
            + Start New Chat
          </button>
        </div>
        
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest cp-section-tag">Saved History</p>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5 scrollbar-thin pointer-events-auto">
          {sessions.map((s, index) => {
            const targetName = typeof s === 'string' ? s : s.name;
            const displayTime = s.mtime_display || "History Log";
            const isActive = currentSessionName === targetName;

            return (
              <div
                key={targetName || index}
                className={`group relative flex items-center justify-between p-3 rounded-xl border cp-history-card ${
                  isActive ? 'active' : 'idle'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectSession(s)}
                  className="flex-1 text-left min-w-0 bg-transparent border-0 p-0 cursor-pointer"
                >
                  <div className="text-[11px] font-semibold truncate pr-4 cp-card-title">{targetName}</div>
                  <div className="text-[10px] mt-0.5 font-mono cp-card-timestamp">{displayTime}</div>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleOpenDeleteModal(targetName, e)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 font-bold cursor-pointer bg-transparent border-0 cp-delete-trigger"
                  title="Delete Session"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="text-center py-8 border border-dashed rounded-xl cp-empty-backlog-box" style={{ borderColor: 'var(--border-inner)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider cp-section-tag">No Backlogs Logged</div>
            </div>
          )}
        </div>
      </aside>

      {/* CUSTOM OVERLAY MODAL: Confirm Delete Session */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative w-full max-w-sm border rounded-2xl shadow-2xl p-6 z-10 flex flex-col gap-4 cp-modal-panel">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-400">
              Delete Chat Session
            </h3>
            
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-sans leading-relaxed text-slate-300 dark:text-slate-400">
                Are you sure you want to delete this specific trace? This action will securely wipe all configuration backups from storage.
              </p>
              
              <div className="w-full border rounded-xl p-3 flex items-center gap-2.5 cp-modal-target-box">
                <span className="text-xs text-red-400 select-none">📁</span>
                <span className="text-xs font-mono font-bold text-blue-500 dark:text-blue-400 tracking-wide truncate" title={sessionTargetForDeletion}>
                  {sessionTargetForDeletion}.jsonl
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-[11px] font-bold mt-1">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-slate-300 transition-colors cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDeleteSession}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer border-0"
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