import React, { useState } from 'react';
import {
  Shield, Users, TrendingUp, BookOpen, Trash2, Edit3, CheckCircle,
  Award, AlertTriangle, RefreshCw, Plus, Lock, Unlock, Eye,
  UserCheck, UserX, Sliders, Activity, Download, Search, Check, X,
  Radio, Send, ShieldAlert, Key, Globe, Ban
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UserContext';
import { useSignals } from '../../context/SignalContext';
import { useJournal } from '../../context/JournalContext';
import { StorageService } from '../../services/storage';
import { formatSignedCurrency, formatPercent } from '../../utils/formatters';
import { UserProfile, UserRole, AccountStatus, UserPermissions } from '../../types/user';
import { Signal, SignalType, SignalStatus } from '../../types/signal';
import clsx from 'clsx';

type AdminTab = 'users' | 'signals' | 'journals' | 'activity' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin, switchUser, users } = useAuth();
  const {
    adminCreateUser,
    adminUpdateUserRole,
    adminToggleUserStatus,
    adminToggleVerified,
    adminUpdatePermissions,
    adminDeleteUser,
    activityLogs,
    systemConfig,
    updateSystemConfig,
    logAdminAction,
  } = useUsers();

  const { signals, deleteSignal, updateSignal, addSignal } = useSignals();
  const { journals, deleteJournal } = useJournal();

  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [signalSearch, setSignalSearch] = useState('');
  const [signalStatusFilter, setSignalStatusFilter] = useState<string>('ALL');
  const [journalSearch, setJournalSearch] = useState('');
  const [journalResultFilter, setJournalResultFilter] = useState<string>('ALL');
  const [activitySeverityFilter, setActivitySeverityFilter] = useState<string>('ALL');

  // Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<UserProfile | null>(null);
  const [showBanModal, setShowBanModal] = useState<UserProfile | null>(null);
  const [banReason, setBanReason] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [newVerified, setNewVerified] = useState(false);
  const [newUserError, setNewUserError] = useState('');

  // Broadcast Signal Form
  const [bAsset, setBAsset] = useState('XAUUSD');
  const [bType, setBType] = useState<SignalType>('BUY');
  const [bTimeframe, setBTimeframe] = useState('15M');
  const [bEntry, setBEntry] = useState('');
  const [bSL, setBSL] = useState('');
  const [bTP, setBTP] = useState('');
  const [bStrategy, setBStrategy] = useState('');
  const [bNotes, setBNotes] = useState('');

  // --- ACCESS CONTROL SECURITY GATE ---
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-fatfx-bg">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
          The Admin Control Center and Access Control panel requires <span className="font-semibold text-slate-700">Administrator privileges</span>. You are currently logged in as <span className="font-mono font-bold text-fatfx-teal-700">@{currentUser.username}</span> ({currentUser.role}).
        </p>

        {/* Quick Elevation Button for development testing */}
        <div className="bg-white p-4 rounded-2xl border border-fatfx-border shadow-subtle max-w-sm w-full space-y-3">
          <p className="text-xs font-semibold text-slate-700">Developer / Admin Access</p>
          <button
            onClick={() => {
              const adminAcc = users.find(u => u.role === 'ADMIN');
              if (adminAcc) {
                switchUser(adminAcc.id);
              } else {
                adminUpdateUserRole(currentUser.id, 'ADMIN');
              }
            }}
            className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-fatfx-teal-600 transition-all flex items-center justify-center gap-2"
          >
            <Key className="w-3.5 h-3.5" />
            Switch to Master Admin Account
          </button>
        </div>
      </div>
    );
  }

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter === 'SUSPENDED') return u.status === 'SUSPENDED';
    if (roleFilter !== 'ALL') return u.role === roleFilter;
    return true;
  });

  const filteredSignals = signals.filter(s => {
    const matchesSearch =
      s.asset.toLowerCase().includes(signalSearch.toLowerCase()) ||
      s.authorUsername.toLowerCase().includes(signalSearch.toLowerCase()) ||
      (s.strategy && s.strategy.toLowerCase().includes(signalSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (signalStatusFilter !== 'ALL') return s.status === signalStatusFilter;
    return true;
  });

  const filteredJournals = journals.filter(j => {
    const matchesSearch =
      j.currency.toLowerCase().includes(journalSearch.toLowerCase()) ||
      j.authorUsername.toLowerCase().includes(journalSearch.toLowerCase()) ||
      (j.notes && j.notes.toLowerCase().includes(journalSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (journalResultFilter !== 'ALL') return j.result === journalResultFilter;
    return true;
  });

  const filteredActivity = activityLogs.filter(log => {
    if (activitySeverityFilter !== 'ALL') return log.severity === activitySeverityFilter;
    return true;
  });

  // Handlers
  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newEmail.trim()) {
      setNewUserError('Username and email are required');
      return;
    }
    const success = await adminCreateUser({
      username: newUsername,
      fullName: newFullName,
      email: newEmail,
      role: newRole,
      isVerified: newVerified,
    });
    if (success) {
      setShowCreateUserModal(false);
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewUserError('');
    } else {
      setNewUserError('Username or email already exists.');
    }
  };

  const handleConfirmBan = () => {
    if (showBanModal) {
      adminToggleUserStatus(showBanModal.id, 'SUSPENDED', banReason);
      setShowBanModal(null);
      setBanReason('');
    }
  };

  const handleBroadcastSignal = () => {
    const entryN = parseFloat(bEntry) || 0;
    const slN = parseFloat(bSL) || 0;
    const tpN = parseFloat(bTP) || 0;
    if (!entryN || !slN || !tpN) return;

    const isBuy = bType === 'BUY';
    const risk = isBuy ? entryN - slN : slN - entryN;
    const reward = isBuy ? tpN - entryN : entryN - tpN;
    const rr = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 3.0;

    const now = new Date();
    addSignal({
      authorId: currentUser.id,
      authorUsername: currentUser.username,
      asset: bAsset,
      type: bType,
      status: 'ACTIVE',
      timeframe: bTimeframe,
      year: now.getFullYear(),
      month: now.getMonth(),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priceLevels: {
        entryPrice: entryN,
        stopLoss: slN,
        takeProfit: tpN,
        slPips: Math.abs(entryN - slN) * (bAsset.includes('JPY') ? 100 : 10),
        tpPips: Math.abs(tpN - entryN) * (bAsset.includes('JPY') ? 100 : 10),
        riskRewardRatio: rr,
      },
      strategy: bStrategy.trim() || 'Official Institutional Signal',
      notes: bNotes.trim() || undefined,
      sharedWith: [],
    });

    logAdminAction('SIGNAL_APPROVED', `Admin published official broadcast signal for ${bAsset} (${bType}).`, bAsset, 'INFO');
    setShowBroadcastModal(false);
    setBEntry('');
    setBSL('');
    setBTP('');
    setBStrategy('');
    setBNotes('');
  };

  const handleExportAudit = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      systemConfig,
      totalUsers: users.length,
      users: users.map(u => ({ id: u.id, username: u.username, role: u.role, status: u.status, isVerified: u.isVerified })),
      totalSignals: signals.length,
      signals,
      totalJournals: journals.length,
      journals,
      activityLogs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fatfx-system-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#FBFDFD] overflow-hidden">
      {/* Top Admin Navigation & Metric Summary */}
      <div className="px-6 py-3.5 border-b border-fatfx-border bg-white shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-fatfx-teal-50 border border-fatfx-teal-200 flex items-center justify-center text-fatfx-teal-600">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Admin Control & Access Center
                <span className="text-[10px] bg-fatfx-teal-100 text-fatfx-teal-800 font-semibold px-2 py-0.5 rounded-full">
                  RBAC Active
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Full system governance, access control & live monitoring</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Radio className="w-3.5 h-3.5" />
              Broadcast Signal
            </button>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>

            <button
              onClick={handleExportAudit}
              title="Export Full System Audit JSON"
              className="p-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 overflow-x-auto bg-slate-100/70 p-1 rounded-xl border border-slate-200/80">
          {[
            { id: 'users' as AdminTab, label: 'Users & Permissions', icon: Users, count: users.length },
            { id: 'signals' as AdminTab, label: 'Signal Moderation', icon: TrendingUp, count: signals.length },
            { id: 'journals' as AdminTab, label: 'Journal Audit', icon: BookOpen, count: journals.length },
            { id: 'activity' as AdminTab, label: 'Audit Trail', icon: Activity, count: activityLogs.length },
            { id: 'settings' as AdminTab, label: 'Access Config', icon: Sliders, count: null },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-white text-fatfx-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                )}
              >
                <Icon className={clsx('w-3.5 h-3.5', isActive ? 'text-fatfx-teal-600' : 'text-slate-500')} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={clsx('text-[10px] px-1.5 py-0.2 rounded-full', isActive ? 'bg-fatfx-teal-100 text-fatfx-teal-800' : 'bg-slate-200 text-slate-600')}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ========================================================================= */}
        {/* TAB 1: USERS & PERMISSIONS MATRIX */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-white p-3 rounded-xl border border-fatfx-border">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-400 bg-slate-50"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
                {['ALL', 'USER', 'PRO_TRADER', 'MODERATOR', 'ADMIN', 'SUSPENDED'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0',
                      roleFilter === r
                        ? 'bg-fatfx-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table / List */}
            <div className="grid grid-cols-1 gap-3">
              {filteredUsers.map(u => {
                const isCurrent = u.id === currentUser.id;
                const isSuspended = u.status === 'SUSPENDED';

                return (
                  <div
                    key={u.id}
                    className={clsx(
                      'bg-white rounded-xl border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3',
                      isSuspended ? 'border-red-200 bg-red-50/20' : 'border-fatfx-border hover:border-slate-300'
                    )}
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-slate-200">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center text-fatfx-teal-700 font-bold">
                              {u.username.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {u.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-fatfx-teal-600 text-white rounded-full p-0.5 shadow-xs" title="Verified Trader">
                            <Award className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900">{u.fullName}</p>
                          <span className="text-xs text-slate-500 font-mono">@{u.username}</span>

                          {/* Role Pill */}
                          <span
                            className={clsx(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                              u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                              u.role === 'MODERATOR' ? 'bg-blue-100 text-blue-800' :
                              u.role === 'PRO_TRADER' ? 'bg-fatfx-teal-100 text-fatfx-teal-800' :
                              'bg-slate-100 text-slate-700'
                            )}
                          >
                            {u.role.replace('_', ' ')}
                          </span>

                          {/* Status Pill */}
                          {isSuspended && (
                            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Ban className="w-2.5 h-2.5" /> Suspended
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>{u.email}</span>
                          <span>•</span>
                          <span>{u.totalSignalsCount} signals</span>
                          <span>•</span>
                          <span>{u.totalJournalsCount} journals</span>
                          <span>•</span>
                          <span>Joined {u.joinedDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                      {/* Role Dropdown */}
                      <select
                        value={u.role}
                        onChange={e => adminUpdateUserRole(u.id, e.target.value as UserRole)}
                        disabled={isCurrent}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="USER">Standard Trader</option>
                        <option value="PRO_TRADER">Pro Trader</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="ADMIN">Administrator</option>
                      </select>

                      {/* Verified Toggle */}
                      <button
                        onClick={() => adminToggleVerified(u.id)}
                        className={clsx(
                          'px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                          u.isVerified
                            ? 'bg-fatfx-teal-50 text-fatfx-teal-700 border-fatfx-teal-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        )}
                        title="Toggle Verified Checkmark"
                      >
                        {u.isVerified ? 'Verified ✓' : 'Verify'}
                      </button>

                      {/* Permissions Drawer Trigger */}
                      <button
                        onClick={() => setShowPermissionsModal(u)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        title="Configure Permissions"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>

                      {/* Impersonate / Switch */}
                      {!isCurrent && (
                        <button
                          onClick={() => switchUser(u.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          title="Switch to this user session"
                        >
                          Switch User
                        </button>
                      )}

                      {/* Ban / Unban Toggle */}
                      {!isCurrent && (
                        isSuspended ? (
                          <button
                            onClick={() => adminToggleUserStatus(u.id, 'ACTIVE')}
                            className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200 transition-colors"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowBanModal(u)}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors"
                          >
                            Suspend
                          </button>
                        )
                      )}

                      {/* Delete */}
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Permanently delete @${u.username}? This cannot be undone.`)) {
                              adminDeleteUser(u.id);
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SIGNAL MODERATION & BROADCAST */}
        {/* ========================================================================= */}
        {activeTab === 'signals' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-white p-3 rounded-xl border border-fatfx-border">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search signals by asset, author, strategy..."
                  value={signalSearch}
                  onChange={e => setSignalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-400 bg-slate-50"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
                {['ALL', 'ACTIVE', 'HIT_TP', 'HIT_SL', 'CLOSED', 'CANCELLED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setSignalStatusFilter(st)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0',
                      signalStatusFilter === st
                        ? 'bg-fatfx-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Signals Table */}
            <div className="space-y-2.5">
              {filteredSignals.map(sig => {
                const isBuy = sig.type === 'BUY';
                return (
                  <div
                    key={sig.id}
                    className="bg-white rounded-xl border border-fatfx-border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0',
                          isBuy ? 'bg-[#0E9F6E]' : 'bg-[#E02424]'
                        )}
                      >
                        {sig.type}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-slate-900">{sig.asset}</span>
                          <span className="text-xs text-slate-500 font-medium">@{sig.authorUsername}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {sig.timeframe}
                          </span>
                          <span className="text-xs text-slate-400">{sig.date} {sig.time}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 font-mono">
                          <span>Entry: <strong className="text-blue-600">{sig.priceLevels.entryPrice}</strong></span>
                          <span>TP: <strong className="text-green-600">{sig.priceLevels.takeProfit}</strong></span>
                          <span>SL: <strong className="text-red-600">{sig.priceLevels.stopLoss}</strong></span>
                          <span>R:R: <strong>1:{sig.priceLevels.riskRewardRatio.toFixed(1)}</strong></span>
                        </div>

                        {sig.strategy && (
                          <p className="text-[11px] text-slate-500 mt-1">{sig.strategy}</p>
                        )}
                      </div>
                    </div>

                    {/* Status & Moderation Controls */}
                    <div className="flex items-center gap-2">
                      <select
                        value={sig.status}
                        onChange={e => updateSignal(sig.id, { status: e.target.value as SignalStatus })}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="HIT_TP">HIT_TP</option>
                        <option value="HIT_SL">HIT_SL</option>
                        <option value="CLOSED">CLOSED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete signal ${sig.asset} from @${sig.authorUsername}?`)) {
                            deleteSignal(sig.id);
                            logAdminAction('SIGNAL_DELETED', `Deleted signal ${sig.asset} by @${sig.authorUsername}.`, sig.asset, 'WARNING');
                          }
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Signal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: JOURNAL COMPLIANCE & AUDIT */}
        {/* ========================================================================= */}
        {activeTab === 'journals' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-white p-3 rounded-xl border border-fatfx-border">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Audit journals by currency, author, notes..."
                  value={journalSearch}
                  onChange={e => setJournalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-400 bg-slate-50"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
                {['ALL', 'WIN', 'LOSS', 'BE'].map(res => (
                  <button
                    key={res}
                    onClick={() => setJournalResultFilter(res)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0',
                      journalResultFilter === res
                        ? 'bg-fatfx-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Journals List */}
            <div className="space-y-2.5">
              {filteredJournals.map(jrn => (
                <div
                  key={jrn.id}
                  className="bg-white rounded-xl border border-fatfx-border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-slate-900">{jrn.currency}</span>
                      <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded text-white', jrn.positionType === 'BUY' ? 'bg-[#0E9F6E]' : 'bg-[#E02424]')}>
                        {jrn.positionType}
                      </span>
                      <span className={clsx('text-xs font-bold', jrn.result === 'WIN' ? 'text-green-600' : jrn.result === 'LOSS' ? 'text-red-600' : 'text-slate-600')}>
                        {jrn.result}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">@{jrn.authorUsername}</span>
                      <span className="text-xs text-slate-400">Date: {jrn.date}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-700 mt-1 font-mono font-medium">
                      <span>Gross: {formatSignedCurrency(jrn.grossProfitLoss)}</span>
                      <span>Comm: -${jrn.commissions.toFixed(2)}</span>
                      <span>Net: <strong className={jrn.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatSignedCurrency(jrn.totalProfit)} ({formatPercent(jrn.gainPercentage)})</strong></span>
                      <span>SL: {jrn.slPips} pips</span>
                    </div>

                    {jrn.notes && <p className="text-[11px] text-slate-500 mt-1">{jrn.notes}</p>}
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`Audit removal of trade ${jrn.currency} from @${jrn.authorUsername}?`)) {
                        deleteJournal(jrn.id);
                        logAdminAction('JOURNAL_AUDITED', `Audited & deleted journal entry ${jrn.currency} by @${jrn.authorUsername}.`, jrn.currency, 'WARNING');
                      }
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end md:self-auto"
                    title="Audit & Remove Trade"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AUDIT TRAIL / ACTIVITY LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-fatfx-border">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-fatfx-teal-600" />
                <span className="text-xs font-bold text-slate-800">System Activity Stream</span>
              </div>

              <div className="flex gap-1">
                {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setActivitySeverityFilter(sev)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                      activitySeverityFilter === sev
                        ? 'bg-fatfx-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-fatfx-border divide-y divide-slate-100 overflow-hidden">
              {filteredActivity.map(log => (
                <div key={log.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase',
                        log.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        log.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      )}>
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="font-semibold text-slate-900">@{log.actorUsername}</span>
                      {log.target && <span className="text-slate-500">→ {log.target}</span>}
                    </div>
                    <p className="text-slate-600 leading-relaxed">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ACCESS CONFIG & SYSTEM SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-5">
            {/* Dynamic Menu Access Controls */}
            <div className="bg-white rounded-xl border border-fatfx-border p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-fatfx-teal-600" />
                Master Menu Access & Visibility Controls
              </h2>
              <p className="text-xs text-slate-500">
                Instantly enable or disable any top-level menu. When disabled, the menu is hidden from users and all nested activities are paused.
              </p>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                {/* Journal Menu Toggle */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-fatfx-teal-600" />
                      Journal Menu & Trade Calendar
                    </p>
                    <p className="text-slate-500 text-[11px]">Controls trader journal logging, 12-month calendar, PnL analytics, and Push sharing.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.isJournalEnabled}
                    onChange={e => updateSystemConfig({ isJournalEnabled: e.target.checked })}
                    className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Signals Menu Toggle */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-fatfx-teal-600" />
                      Signals Menu & Interactive Risk/Reward Charts
                    </p>
                    <p className="text-slate-500 text-[11px]">Controls live forex/crypto trade signals, month grids, and TradingView price levels.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.isSignalsEnabled}
                    onChange={e => updateSystemConfig({ isSignalsEnabled: e.target.checked })}
                    className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Feeds Menu Toggle */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-fatfx-teal-600" />
                      Feeds Menu, Posts & Discussions
                    </p>
                    <p className="text-slate-500 text-[11px]">Controls community posts, stepper analysis, video/image embeds, comments, and reactions.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.isFeedsEnabled}
                    onChange={e => updateSystemConfig({ isFeedsEnabled: e.target.checked })}
                    className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Users Menu Toggle */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-fatfx-teal-600" />
                      Users Menu & Trader Directory
                    </p>
                    <p className="text-slate-500 text-[11px]">Controls the user directory, peer connection requests, and chain push permissions.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.isUsersEnabled}
                    onChange={e => updateSystemConfig({ isUsersEnabled: e.target.checked })}
                    className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Global Access Controls */}
            <div className="bg-white rounded-xl border border-fatfx-border p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-fatfx-teal-600" />
                Security Policies & Feature Flags
              </h2>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                {/* Require Signal Approval */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Require Signal Moderation Approval</p>
                    <p className="text-slate-500 text-[11px]">When enabled, community signals must be approved by an Admin before appearing publicly.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.requireSignalApproval}
                    onChange={e => updateSystemConfig({ requireSignalApproval: e.target.checked })}
                    className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Allow Public Registration */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Allow Public Account Registration</p>
                    <p className="text-slate-500 text-[11px]">Enable or disable new user signups.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.allowPublicRegistration}
                    onChange={e => updateSystemConfig({ allowPublicRegistration: e.target.checked })}
                    className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Allow Push Sharing */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Enable Direct Peer Push Sharing</p>
                    <p className="text-slate-500 text-[11px]">Allow traders to push private journals to specific connected usernames.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.allowPushSharing}
                    onChange={e => updateSystemConfig({ allowPushSharing: e.target.checked })}
                    className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Pro Traders Only Signals */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Restrict Signal Publishing to Pro Traders</p>
                    <p className="text-slate-500 text-[11px]">Only Pro Traders, Moderators, and Admins can publish trade signals.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.allowProTraderSignalsOnly}
                    onChange={e => updateSystemConfig({ allowProTraderSignalsOnly: e.target.checked })}
                    className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                  />
                </div>

                {/* Maintenance Mode */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-600">System Maintenance Mode</p>
                    <p className="text-slate-500 text-[11px]">Locks platform modifications for non-admin accounts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemConfig.maintenanceMode}
                    onChange={e => updateSystemConfig({ maintenanceMode: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Database Reset Helper */}
            <div className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
              <h2 className="text-sm font-bold text-red-600 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Reset System Database
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Restore the seed database with pre-configured users, signals across all months, and journal test entries.
              </p>

              {resetConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      StorageService.resetToDefault();
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Confirm Reset & Reload
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                >
                  Reset to Default Seed Data
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE USER */}
      {/* ========================================================================= */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setShowCreateUserModal(false)} />
          <div className="relative bg-white rounded-2xl border border-fatfx-border shadow-lg w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-fatfx-teal-600" />
                Provision New Trader Account
              </h3>
              <button onClick={() => setShowCreateUserModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  placeholder="e.g. trader_john"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="e.g. john@forex.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500 bg-white"
                  >
                    <option value="USER">Standard Trader</option>
                    <option value="PRO_TRADER">Pro Trader</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="newVerified"
                    checked={newVerified}
                    onChange={e => setNewVerified(e.target.checked)}
                    className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                  />
                  <label htmlFor="newVerified" className="font-semibold text-slate-700 cursor-pointer">Verified Badge</label>
                </div>
              </div>

              {newUserError && <p className="text-red-500 font-semibold">{newUserError}</p>}
            </div>

            <button
              onClick={handleCreateUser}
              className="w-full py-2.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PERMISSIONS MATRIX DRAWER */}
      {/* ========================================================================= */}
      {showPermissionsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setShowPermissionsModal(null)} />
          <div className="relative bg-white rounded-2xl border border-fatfx-border shadow-lg w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Custom Permissions Matrix</h3>
                <p className="text-xs text-slate-500">@{showPermissionsModal.username} ({showPermissionsModal.role})</p>
              </div>
              <button onClick={() => setShowPermissionsModal(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Can Publish Signals</p>
                  <p className="text-slate-500 text-[11px]">Allow authoring and broadcasting trade signals</p>
                </div>
                <input
                  type="checkbox"
                  checked={showPermissionsModal.permissions?.canPublishSignals ?? true}
                  onChange={e => {
                    adminUpdatePermissions(showPermissionsModal.id, { canPublishSignals: e.target.checked });
                    setShowPermissionsModal({
                      ...showPermissionsModal,
                      permissions: { ...showPermissionsModal.permissions, canPublishSignals: e.target.checked } as UserPermissions
                    });
                  }}
                  className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Can Push Journals</p>
                  <p className="text-slate-500 text-[11px]">Allow peer-to-peer Push journal transfers</p>
                </div>
                <input
                  type="checkbox"
                  checked={showPermissionsModal.permissions?.canPushJournals ?? true}
                  onChange={e => {
                    adminUpdatePermissions(showPermissionsModal.id, { canPushJournals: e.target.checked });
                    setShowPermissionsModal({
                      ...showPermissionsModal,
                      permissions: { ...showPermissionsModal.permissions, canPushJournals: e.target.checked } as UserPermissions
                    });
                  }}
                  className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Can Moderate Community Signals</p>
                  <p className="text-slate-500 text-[11px]">Allow status updates & trade approvals</p>
                </div>
                <input
                  type="checkbox"
                  checked={showPermissionsModal.permissions?.canModerateSignals ?? false}
                  onChange={e => {
                    adminUpdatePermissions(showPermissionsModal.id, { canModerateSignals: e.target.checked });
                    setShowPermissionsModal({
                      ...showPermissionsModal,
                      permissions: { ...showPermissionsModal.permissions, canModerateSignals: e.target.checked } as UserPermissions
                    });
                  }}
                  className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Can View All Private Journals</p>
                  <p className="text-slate-500 text-[11px]">Audit oversight permission</p>
                </div>
                <input
                  type="checkbox"
                  checked={showPermissionsModal.permissions?.canViewAllJournals ?? false}
                  onChange={e => {
                    adminUpdatePermissions(showPermissionsModal.id, { canViewAllJournals: e.target.checked });
                    setShowPermissionsModal({
                      ...showPermissionsModal,
                      permissions: { ...showPermissionsModal.permissions, canViewAllJournals: e.target.checked } as UserPermissions
                    });
                  }}
                  className="w-4 h-4 text-fatfx-teal-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => setShowPermissionsModal(null)}
              className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BAN / SUSPEND */}
      {/* ========================================================================= */}
      {showBanModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setShowBanModal(null)} />
          <div className="relative bg-white rounded-2xl border border-red-200 shadow-lg w-full max-w-md p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <Ban className="w-5 h-5" />
              <h3 className="text-sm font-bold">Suspend Account @{showBanModal.username}</h3>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600">
                Suspending this account will block their signals from appearing in public feeds and disable trade logging.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for suspension</label>
                <textarea
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  placeholder="e.g. Suspected fraudulent trade reporting or abusive behavior"
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmBan}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Confirm Suspension
              </button>
              <button
                onClick={() => setShowBanModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BROADCAST SIGNAL */}
      {/* ========================================================================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setShowBroadcastModal(false)} />
          <div className="relative bg-white rounded-2xl border border-fatfx-border shadow-lg w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-fatfx-teal-600" />
                Broadcast Official Signal
              </h3>
              <button onClick={() => setShowBroadcastModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asset</label>
                  <select value={bAsset} onChange={e => setBAsset(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono">
                    {['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'NAS100', 'US30', 'BTCUSD'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Direction</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200">
                    <button onClick={() => setBType('BUY')} className={clsx('flex-1 py-1.5 font-bold', bType === 'BUY' ? 'bg-[#0E9F6E] text-white' : 'bg-white text-slate-600')}>BUY</button>
                    <button onClick={() => setBType('SELL')} className={clsx('flex-1 py-1.5 font-bold', bType === 'SELL' ? 'bg-[#E02424] text-white' : 'bg-white text-slate-600')}>SELL</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entry Price</label>
                  <input type="number" step="0.00001" placeholder="0.00" value={bEntry} onChange={e => setBEntry(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-red-600 mb-1">Stop Loss</label>
                  <input type="number" step="0.00001" placeholder="0.00" value={bSL} onChange={e => setBSL(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-red-200 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-green-600 mb-1">Take Profit</label>
                  <input type="number" step="0.00001" placeholder="0.00" value={bTP} onChange={e => setBTP(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-green-200 font-mono" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Strategy / Narrative</label>
                <input type="text" placeholder="e.g. ICT London Open Displacement + 5M FVG Retest" value={bStrategy} onChange={e => setBStrategy(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Execution Notes</label>
                <textarea placeholder="Trade management notes..." rows={2} value={bNotes} onChange={e => setBNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 resize-none" />
              </div>
            </div>

            <button
              onClick={handleBroadcastSignal}
              className="w-full py-2.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Broadcast Signal to Network
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
