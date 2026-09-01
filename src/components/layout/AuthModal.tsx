import React, { useState } from 'react';
import { X, User, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'profile' | 'login' | 'register' | 'switch';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, users, login, register, switchUser, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = () => {
    if (!loginInput.trim()) { setLoginError('Enter username or email'); return; }
    const ok = login(loginInput.trim());
    if (ok) { onClose(); setLoginInput(''); setLoginError(''); }
    else setLoginError('User not found. Check username/email.');
  };

  const handleRegister = async () => {
    if (!regUsername.trim() || !regEmail.trim()) { setRegError('Username and email required'); return; }
    const ok = await register(regUsername, regFullName, regEmail);
    if (ok) { setRegSuccess(true); setTimeout(() => { onClose(); setRegSuccess(false); }, 1500); }
    else setRegError('Username or email already exists.');
  };

  const handleSwitch = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  const TABS: Tab[] = ['profile', 'login', 'register', 'switch'];
  const tabLabel = (t: Tab) => t === 'switch' ? 'Accounts' : t.charAt(0).toUpperCase() + t.slice(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-10 mr-2 w-80 bg-white rounded-2xl shadow-futuristic border border-fatfx-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fatfx-border bg-fatfx-surface-subtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-fatfx-teal-200">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-fatfx-teal-600" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{currentUser.fullName}</p>
              <p className="text-xs text-fatfx-teal-600">@{currentUser.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-fatfx-border bg-white">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'flex-1 py-2 text-[11px] font-medium transition-colors',
                tab === t
                  ? 'text-fatfx-teal-600 border-b-2 border-fatfx-teal-500 bg-fatfx-teal-50'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="space-y-3">
              <div className="bg-fatfx-teal-50 rounded-xl p-3 border border-fatfx-teal-100 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Role</span>
                  <span className={clsx('font-semibold', currentUser.role === 'ADMIN' ? 'text-amber-600' : currentUser.role === 'PRO_TRADER' ? 'text-fatfx-teal-600' : 'text-slate-600')}>
                    {currentUser.role === 'PRO_TRADER' ? 'Pro Trader' : currentUser.role}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Joined</span>
                  <span className="text-slate-700 font-medium">{currentUser.joinedDate}</span>
                </div>
                {currentUser.winRate !== undefined && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Win Rate</span>
                    <span className="text-fatfx-win-text font-semibold">{currentUser.winRate}%</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Signals</span>
                  <span className="text-slate-700 font-medium">{currentUser.totalSignalsCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Journal Entries</span>
                  <span className="text-slate-700 font-medium">{currentUser.totalJournalsCount}</span>
                </div>
              </div>
              {currentUser.bio && (
                <p className="text-xs text-slate-500 leading-relaxed">{currentUser.bio}</p>
              )}
            </div>
          )}

          {/* Login Tab */}
          {tab === 'login' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Enter your username or email to switch accounts.</p>
              <input
                type="text"
                placeholder="Username or email"
                value={loginInput}
                onChange={e => { setLoginInput(e.target.value); setLoginError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2 text-sm rounded-lg border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
              />
              {loginError && <p className="text-xs text-red-500">{loginError}</p>}
              <button onClick={handleLogin} className="w-full py-2 bg-fatfx-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-fatfx-teal-600 transition-colors">
                Sign In
              </button>
            </div>
          )}

          {/* Register Tab */}
          {tab === 'register' && (
            <div className="space-y-3">
              {regSuccess ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 rounded-full bg-fatfx-win-bg flex items-center justify-center mx-auto mb-2">
                    <UserPlus className="w-5 h-5 text-fatfx-win-text" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Account created!</p>
                  <p className="text-xs text-slate-500 mt-1">Welcome to FatFx</p>
                </div>
              ) : (
                <>
                  <input type="text" placeholder="Username" value={regUsername} onChange={e => { setRegUsername(e.target.value); setRegError(''); }} className="w-full px-3 py-2 text-sm rounded-lg border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400" />
                  <input type="text" placeholder="Full name (optional)" value={regFullName} onChange={e => setRegFullName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400" />
                  <input type="email" placeholder="Email" value={regEmail} onChange={e => { setRegEmail(e.target.value); setRegError(''); }} className="w-full px-3 py-2 text-sm rounded-lg border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400" />
                  {regError && <p className="text-xs text-red-500">{regError}</p>}
                  <button onClick={handleRegister} className="w-full py-2 bg-fatfx-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-fatfx-teal-600 transition-colors">
                    Create Account
                  </button>
                </>
              )}
            </div>
          )}

          {/* Switch Accounts */}
          {tab === 'switch' && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSwitch(u.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left',
                    u.id === currentUser.id
                      ? 'bg-fatfx-teal-50 border border-fatfx-teal-200'
                      : 'hover:bg-fatfx-surface-subtle border border-transparent'
                  )}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-fatfx-border shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-fatfx-teal-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{u.fullName}</p>
                    <p className="text-[10px] text-slate-500">
                      @{u.username} · {u.role === 'ADMIN' ? '🛡️ Admin' : u.role === 'PRO_TRADER' ? '⭐ Pro' : 'Trader'}
                    </p>
                  </div>
                  {u.id === currentUser.id && (
                    <span className="text-[10px] text-fatfx-teal-600 font-semibold bg-fatfx-teal-100 px-1.5 py-0.5 rounded-full">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
