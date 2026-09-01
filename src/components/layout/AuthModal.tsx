import React, { useState } from 'react';
import { X, User, UserPlus, LogIn, LogOut, Shield, Key, Eye, EyeOff, Lock } from 'lucide-react';
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

  // Login form states
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Registration form states
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async () => {
    if (!loginInput.trim()) {
      setLoginError('Please enter your username or email');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    const res = await login(loginInput.trim(), loginPassword);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
      setLoginInput('');
      setLoginPassword('');
      setLoginError('');
    } else {
      setLoginError(res.error || 'Invalid credentials. Please check your username/email and password.');
    }
  };

  const handleRegister = async () => {
    if (!regUsername.trim()) {
      setRegError('Username is required');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('Email address is required');
      return;
    }
    if (!regPassword) {
      setRegError('Password is required');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const res = await register(regUsername, regFullName, regEmail, regPassword);
    setIsSubmitting(false);

    if (res.success) {
      setRegSuccess(true);
      setTimeout(() => {
        onClose();
        setRegSuccess(false);
        setRegUsername('');
        setRegFullName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
      }, 1500);
    } else {
      setRegError(res.error || 'Username or email already exists.');
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
      <div className="relative mt-10 mr-2 w-88 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-lg border border-fatfx-border overflow-hidden">
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

        <div className="p-4 max-h-[80vh] overflow-y-auto">
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
              <p className="text-xs text-slate-500">Sign in with your credentials.</p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter username or email"
                    value={loginInput}
                    onChange={e => { setLoginInput(e.target.value); setLoginError(''); }}
                    className="w-full pl-8.5 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-8.5 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {loginError && <p className="text-xs text-red-500 font-medium">{loginError}</p>}

              <button
                onClick={handleLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="text-xs font-bold text-fatfx-teal-600 hover:underline"
                >
                  Create one now
                </button>
              </div>
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
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      placeholder="Choose a username"
                      value={regUsername}
                      onChange={e => { setRegUsername(e.target.value); setRegError(''); }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Full Name (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Your display name"
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="trader@domain.com"
                      value={regEmail}
                      onChange={e => { setRegEmail(e.target.value); setRegError(''); }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={regPassword}
                        onChange={e => { setRegPassword(e.target.value); setRegError(''); }}
                        className="w-full px-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={regConfirmPassword}
                      onChange={e => { setRegConfirmPassword(e.target.value); setRegError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleRegister()}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                    />
                  </div>

                  {regError && <p className="text-xs text-red-500 font-medium">{regError}</p>}

                  <button
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <div className="text-center pt-1">
                    <span className="text-xs text-slate-500">Already registered? </span>
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="text-xs font-bold text-fatfx-teal-600 hover:underline"
                    >
                      Sign In
                    </button>
                  </div>
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
