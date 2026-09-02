import React, { useState } from 'react';
import { X, Send, Link, User, CheckCircle } from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import { useAuth } from '../../context/AuthContext';

interface PushDialogProps {
  journalId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PushDialog: React.FC<PushDialogProps> = ({ journalId, isOpen, onClose }) => {
  const { pushJournal, journals } = useJournal();
  const { currentUser, users } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;
  if (!currentUser) return null;

  const journal = journals.find(j => j.id === journalId);
  const alreadyPushedTo = journal?.pushedTo?.map(p => p.sharedWithUsername) || [];
  const otherUsers = users.filter(u => u.id !== currentUser.id && !alreadyPushedTo.includes(u.username));

  const handlePush = () => {
    if (journal?.publishStatus !== 'PUBLISHED') {
      setError('You must publish the trade outcome before pushing it to other traders.');
      return;
    }
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) { setError('Enter a username'); return; }
    if (trimmed === currentUser.username.toLowerCase()) { setError("You can't push to yourself"); return; }
    const exists = users.find(u => u.username.toLowerCase() === trimmed);
    if (!exists) { setError('User not found on FatFx'); return; }
    if (alreadyPushedTo.includes(trimmed)) { setError('Already pushed to this user'); return; }

    const ok = pushJournal(journalId, trimmed);
    if (ok) {
      setSuccess(true);
      setUsername('');
      setError('');
      setTimeout(() => { setSuccess(false); onClose(); }, 1800);
    } else {
      setError('Failed to push. Make sure the trade is published and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-futuristic border border-fatfx-border w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fatfx-border bg-fatfx-surface-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-fatfx-teal-100 flex items-center justify-center">
              <Send className="w-3.5 h-3.5 text-fatfx-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Push Journal</p>
              <p className="text-[10px] text-slate-500">Share this trade with another trader</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {success ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-fatfx-win-bg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-fatfx-win-text" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Pushed successfully!</p>
              <p className="text-xs text-slate-500">The trader can now see this journal entry.</p>
            </div>
          ) : (
            <>
              {alreadyPushedTo.length > 0 && (
                <div className="bg-fatfx-teal-50 rounded-xl p-3 border border-fatfx-teal-100">
                  <p className="text-[10px] font-semibold text-fatfx-teal-700 mb-1.5 uppercase tracking-wide">Already Pushed To</p>
                  <div className="flex flex-wrap gap-1.5">
                    {alreadyPushedTo.map(u => (
                      <span key={u} className="flex items-center gap-1 text-[11px] bg-fatfx-teal-100 text-fatfx-teal-700 px-2 py-0.5 rounded-full font-medium">
                        <Link className="w-2.5 h-2.5" />
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Push to username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter username..."
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handlePush()}
                    className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
                    autoFocus
                  />
                </div>
                {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
              </div>

              {otherUsers.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Traders on FatFx</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {otherUsers.slice(0, 5).map(u => (
                      <button
                        key={u.id}
                        onClick={() => setUsername(u.username)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-fatfx-surface-subtle transition-all text-left border border-transparent hover:border-fatfx-border"
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-fatfx-border shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-fatfx-teal-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">{u.fullName}</p>
                          <p className="text-[10px] text-slate-500">@{u.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handlePush}
                className="w-full py-2.5 bg-fatfx-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-fatfx-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-glow-teal"
              >
                <Send className="w-4 h-4" />
                Push Journal
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
