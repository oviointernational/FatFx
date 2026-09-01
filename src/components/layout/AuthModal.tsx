import React, { useState } from 'react';
import { X, User, UserPlus, LogIn, LogOut, Shield, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'profile' | 'login' | 'register' | 'switch';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, users, login, register, logout, switchUser, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>(currentUser ? 'profile' : 'login');
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async () => {
    if (!loginInput.trim()) { setLoginError('Enter username or email'); return; }
    setIsSubmitting(true);
    const ok = await login(loginInput.trim());
    setIsSubmitting(false);
    if (ok) {
      onClose();
      setLoginInput('');
      setLoginError('');
    } else {
      setLoginError('User not found. Check username or create a new account.');
    }
  };

  const handleRegister = async () => {
    if (!regUsername.trim() || !regEmail.trim()) { setRegError('Username and email required'); return; }
    setIsSubmitting(true);
    const ok = await register(regUsername, regFullName, regEmail);
    setIsSubmitting(false);
    if (ok) {
      setRegSuccess(true);
      setTimeout(() => { onClose(); setRegSuccess(false); }, 1500);
    } else {
      setRegError('Username or email already exists.');
    }
  };

  const handleSwitch = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  const availableTabs: Tab[] = currentUser
    ? ['profile', 'switch', 'register']
    : ['login', 'register'];

  const tabLabel = (t: Tab) => {
    if (t === 'switch') return 'Accounts';
    if (t === 'login') return 'Sign In';
    if (t === 'register') return 'Register';
    return 'Profile';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={onClose} />
      <div className="relative mt-10 mr-2 w-84 bg-white rounded-2xl shadow-lg border border-fatfx-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fatfx-border bg-fatfx-surface-subtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-fatfx-teal-200 bg-fatfx-teal-50 flex items-center justify-center">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-fatfx-teal-600" />
              )}
            </div>
            <div>
              {currentUser ? (
                <>
                  <p className="text-sm font-bold text-slate-900">{currentUser.fullName}</p>
                  <p className="text-xs text-fatfx-teal-600">@{currentUser.username}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-900">Welcome to FatFx</p>
                  <p className="text-xs text-slate-500">Sign in to your trading account</p>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-fatfx-border bg-white">
          {availableTabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'flex-1 py-2 text-xs font-semibold transition-colors',
                tab === t
                  ? 'text-fatfx-teal-700 border-b-2 border-fatfx-teal-600 bg-fatfx-teal-50/70'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Profile Tab */}
          {tab === 'profile' && currentUser && (
            <div className="space-y-3">
              <div className="bg-fatfx-surface-subtle rounded-xl p-3 border border-fatfx-border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Role</span>
                  <span className={clsx('font-bold', currentUser.role === 'ADMIN' ? 'text-amber-600' : currentUser.role === 'PRO_TRADER' ? 'text-fatfx-teal-600' : 'text-slate-700')}>
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Joined</span>
                  <span className="text-slate-700 font-semibold">{currentUser.joinedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="text-green-600 font-bold">{currentUser.status}</span>
                </div>
              </div>

              {currentUser.bio && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg">{currentUser.bio}</p>
              )}

              <button
                onClick={() => {
                  logout();
                  setTab('login');
                }}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}

          {/* Login Tab */}
          {tab === 'login' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Enter your username or email to sign in.</p>
              <input
                type="text"
                placeholder="Username or email"
                value={loginInput}
                onChange={e => { setLoginInput(e.target.value); setLoginError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                autoFocus
              />
              {loginError && <p className="text-xs text-red-500 font-medium">{loginError}</p>}
              <button
                onClick={handleLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          )}

          {/* Register Tab */}
          {tab === 'register' && (
            <div className="space-y-3">
              {regSuccess ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <UserPlus className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Account Created!</p>
                  <p className="text-xs text-slate-500 mt-1">Welcome to FatFx</p>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Username *"
                    value={regUsername}
                    onChange={e => { setRegUsername(e.target.value); setRegError(''); }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Full Name (optional)"
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={regEmail}
                    onChange={e => { setRegEmail(e.target.value); setRegError(''); }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                  />
                  {regError && <p className="text-xs text-red-500 font-medium">{regError}</p>}
                  <button
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Switch Accounts Tab */}
          {tab === 'switch' && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSwitch(u.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left border',
                    u.id === currentUser?.id
                      ? 'bg-fatfx-teal-50 border-fatfx-teal-200'
                      : 'hover:bg-slate-50 border-transparent'
                  )}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-slate-200 shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center font-bold text-xs text-fatfx-teal-700">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{u.fullName}</p>
                    <p className="text-[10px] text-slate-500">@{u.username} • {u.role}</p>
                  </div>
                  {u.id === currentUser?.id && (
                    <span className="text-[9px] text-fatfx-teal-700 font-bold bg-fatfx-teal-100 px-1.5 py-0.5 rounded-full">Active</span>
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
