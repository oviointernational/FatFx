import React, { useState } from 'react';
import { X, User, UserPlus, LogIn, LogOut, Shield, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'profile' | 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, login, register, logout, isAdmin } = useAuth();
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
      setRegError(res.error || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    logout();
    setTab('login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={onClose} />
      <div className="relative mt-12 w-88 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-xl border border-fatfx-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-fatfx-border bg-fatfx-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-fatfx-teal-200 bg-fatfx-teal-50 flex items-center justify-center">
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
                  <p className="text-sm font-bold text-slate-900">FatFx Trader</p>
                  <p className="text-xs text-slate-500">Sign in to your private account</p>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-fatfx-border bg-white">
          {currentUser ? (
            <>
              <button
                onClick={() => setTab('profile')}
                className={clsx(
                  'flex-1 py-2.5 text-xs font-semibold transition-colors',
                  tab === 'profile'
                    ? 'text-fatfx-teal-600 border-b-2 border-fatfx-teal-500 bg-fatfx-teal-50/50'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                My Account
              </button>
              <button
                onClick={() => setTab('login')}
                className={clsx(
                  'flex-1 py-2.5 text-xs font-semibold transition-colors',
                  tab === 'login'
                    ? 'text-fatfx-teal-600 border-b-2 border-fatfx-teal-500 bg-fatfx-teal-50/50'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Switch / Sign In
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setTab('login')}
                className={clsx(
                  'flex-1 py-2.5 text-xs font-semibold transition-colors',
                  tab === 'login'
                    ? 'text-fatfx-teal-600 border-b-2 border-fatfx-teal-500 bg-fatfx-teal-50/50'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className={clsx(
                  'flex-1 py-2.5 text-xs font-semibold transition-colors',
                  tab === 'register'
                    ? 'text-fatfx-teal-600 border-b-2 border-fatfx-teal-500 bg-fatfx-teal-50/50'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Register
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          
          {/* PROFILE TAB (Private details only) */}
          {tab === 'profile' && currentUser && (
            <div className="space-y-4">
              <div className="bg-fatfx-surface-subtle rounded-xl p-3 border border-fatfx-border space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Account Type</span>
                  <span className={clsx(
                    'font-bold px-2 py-0.5 rounded-full text-[10px]',
                    currentUser.role === 'ADMIN' ? 'bg-amber-100 text-amber-700'
                      : currentUser.role === 'PRO_TRADER' ? 'bg-fatfx-teal-100 text-fatfx-teal-700'
                      : 'bg-slate-200 text-slate-700'
                  )}>
                    {currentUser.role === 'PRO_TRADER' ? 'Pro Trader' : currentUser.role}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-800 font-medium font-mono">{currentUser.email}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Joined</span>
                  <span className="text-slate-800 font-medium">{currentUser.joinedDate}</span>
                </div>

                {currentUser.winRate !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Win Rate</span>
                    <span className="text-fatfx-win-text font-bold">{currentUser.winRate}%</span>
                  </div>
                )}
              </div>

              {currentUser.bio && (
                <p className="text-xs text-slate-500 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "{currentUser.bio}"
                </p>
              )}

              <div className="pt-2 border-t border-fatfx-border flex gap-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* LOGIN TAB */}
          {tab === 'login' && (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-500">
                Sign in with your username or email and password.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. trader_john or john@example.com"
                    value={loginInput}
                    onChange={e => { setLoginInput(e.target.value); setLoginError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                  {loginError}
                </p>
              )}

              <button
                onClick={handleLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-fatfx-teal-500 text-white text-xs font-bold rounded-xl hover:bg-fatfx-teal-600 transition-all flex items-center justify-center gap-2 shadow-glow-teal disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setTab('register')}
                  className="text-xs text-fatfx-teal-600 hover:underline font-semibold"
                >
                  Need an account? Create one here →
                </button>
              </div>
            </div>
          )}

          {/* REGISTER TAB */}
          {tab === 'register' && (
            <div className="space-y-3">
              {regSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-fatfx-win-bg flex items-center justify-center mx-auto mb-2.5">
                    <UserPlus className="w-6 h-6 text-fatfx-win-text" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Account Created!</p>
                  <p className="text-xs text-slate-500 mt-1">Logged into your new private account.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    Create a new trading account. (You can use the same email with different usernames).
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unique Username *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. sniper_fx"
                      value={regUsername}
                      onChange={e => { setRegUsername(e.target.value); setRegError(''); }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={regEmail}
                      onChange={e => { setRegEmail(e.target.value); setRegError(''); }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Password (min 6 characters) *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Create strong password"
                        value={regPassword}
                        onChange={e => { setRegPassword(e.target.value); setRegError(''); }}
                        className="w-full px-3 pr-10 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={regConfirmPassword}
                      onChange={e => { setRegConfirmPassword(e.target.value); setRegError(''); }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
                    />
                  </div>

                  {regError && (
                    <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                      {regError}
                    </p>
                  )}

                  <button
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-fatfx-teal-500 text-white text-xs font-bold rounded-xl hover:bg-fatfx-teal-600 transition-all flex items-center justify-center gap-2 shadow-glow-teal disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </button>

                  <div className="pt-1 text-center">
                    <button
                      onClick={() => setTab('login')}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Already have an account? <span className="text-fatfx-teal-600 font-semibold">Sign in</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
