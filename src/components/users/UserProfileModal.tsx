import React, { useState } from 'react';
import { X, User, Link, Award, Shield, Check, Clock, UserPlus, BookOpen, TrendingUp, Lock } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useJournal } from '../../context/JournalContext';
import { useSignals } from '../../context/SignalContext';
import { formatSignedCurrency, formatPercent } from '../../utils/formatters';
import clsx from 'clsx';

interface UserProfileModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSignal?: (signalId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSelectSignal }) => {
  const { hasPushWithUser, getConnectionState, sendConnectionRequest, acceptConnectionRequest } = useUsers();
  const { currentUser } = useAuth();
  const { journals } = useJournal();
  const { signals } = useSignals();
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'journals'>('overview');

  if (!isOpen || !user) return null;

  const isMe = user.id === currentUser?.id;
  const hasPush = hasPushWithUser(user.username);
  const connState = getConnectionState(user.id);
  const isApproved = isMe || connState === 'CONNECTED' || hasPush;

  // Filter signals authored by this user
  const userSignals = signals.filter(s => s.authorId === user.id || s.authorUsername.toLowerCase() === user.username.toLowerCase());
  
  // Filter journals authored by this user that are visible (either pushed to me or user is approved)
  const userJournals = journals.filter(j => 
    (j.authorUsername.toLowerCase() === user.username.toLowerCase()) &&
    (isApproved || Boolean(currentUser && j.pushedTo?.some(p => p.sharedWithUsername === currentUser.username)))
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-futuristic border border-fatfx-border w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-fatfx-teal-600 to-fatfx-teal-800 p-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/30 shadow-lg bg-white">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-fatfx-teal-600" />
                  </div>
                )}
              </div>
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white text-fatfx-teal-600 rounded-full p-1 shadow-md">
                  <Award className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{user.fullName}</h2>
                {hasPush && (
                  <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Link className="w-3 h-3" /> Pushed
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80">@{user.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                  {user.role === 'PRO_TRADER' ? '⭐ Pro Trader' : user.role === 'ADMIN' ? '🛡️ Admin' : 'Trader'}
                </span>
                <span className="text-[10px] text-white/70">Joined {user.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Header */}
        <div className="px-4 py-2.5 bg-fatfx-surface-subtle border-b border-fatfx-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isMe && (
              connState === 'CONNECTED' ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-fatfx-win-text bg-fatfx-win-bg px-2.5 py-1 rounded-lg border border-fatfx-win-border">
                  <Check className="w-3.5 h-3.5" /> Connected
                </span>
              ) : connState === 'PENDING_SENT' ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Request Sent
                </span>
              ) : connState === 'PENDING_RECEIVED' ? (
                <button
                  onClick={() => acceptConnectionRequest(user.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-fatfx-teal-500 hover:bg-fatfx-teal-600 px-3 py-1 rounded-lg shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Accept Connection
                </button>
              ) : (
                <button
                  onClick={() => sendConnectionRequest(user.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-slate-900 hover:bg-fatfx-teal-600 px-3 py-1 rounded-lg transition-colors shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Connect to view private trades
                </button>
              )
            )}
          </div>

          {/* Tab buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={clsx(
                'text-xs font-semibold px-2.5 py-1 rounded-lg transition-all',
                activeTab === 'overview' ? 'bg-white text-fatfx-teal-600 shadow-subtle' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={clsx(
                'text-xs font-semibold px-2.5 py-1 rounded-lg transition-all',
                activeTab === 'signals' ? 'bg-white text-fatfx-teal-600 shadow-subtle' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Signals ({userSignals.length})
            </button>
            <button
              onClick={() => setActiveTab('journals')}
              className={clsx(
                'text-xs font-semibold px-2.5 py-1 rounded-lg transition-all',
                activeTab === 'journals' ? 'bg-white text-fatfx-teal-600 shadow-subtle' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Journals ({userJournals.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {user.bio && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">About</p>
                  <p className="text-xs text-slate-700 bg-fatfx-surface-subtle p-3 rounded-xl border border-fatfx-border leading-relaxed">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Performance Stats</p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-fatfx-teal-50 border border-fatfx-teal-100 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Win Rate</p>
                    <p className="text-base font-bold text-fatfx-teal-700 font-mono">{user.winRate || 68}%</p>
                  </div>
                  <div className="bg-fatfx-surface-subtle border border-fatfx-border rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Signals</p>
                    <p className="text-base font-bold text-slate-900 font-mono">{user.totalSignalsCount}</p>
                  </div>
                  <div className="bg-fatfx-surface-subtle border border-fatfx-border rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Journals</p>
                    <p className="text-base font-bold text-slate-900 font-mono">{user.totalJournalsCount}</p>
                  </div>
                </div>
              </div>

              {/* Privacy Notice */}
              {!isApproved && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">Journals are Private</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      This trader's journal is private. Connect with @{user.username} or receive a direct Push to view their trade logs.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'signals' && (
            <div className="space-y-2.5">
              {userSignals.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No signals published by this trader yet.</p>
              ) : (
                userSignals.map(sig => (
                  <div
                    key={sig.id}
                    className={clsx(
                      'p-3 rounded-xl border text-left flex items-center justify-between',
                      sig.type === 'BUY' ? 'bg-fatfx-win-bg border-fatfx-win-border' : 'bg-fatfx-loss-bg border-fatfx-loss-border'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-mono text-slate-900">{sig.asset}</span>
                        <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded text-white', sig.type === 'BUY' ? 'bg-fatfx-win-solid' : 'bg-fatfx-loss-solid')}>
                          {sig.type}
                        </span>
                        <span className="text-[10px] text-slate-500">{sig.timeframe}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Entry: {sig.priceLevels.entryPrice} · TP: {sig.priceLevels.takeProfit} · SL: {sig.priceLevels.stopLoss}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 font-mono">1:{sig.priceLevels.riskRewardRatio.toFixed(1)}</span>
                      <p className="text-[10px] text-slate-500">{sig.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'journals' && (
            <div className="space-y-2.5">
              {!isApproved ? (
                <div className="bg-fatfx-surface-subtle rounded-xl p-6 text-center border border-fatfx-border">
                  <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Protected Trading Journal</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Connect with @{user.username} to request access to their trading journal.
                  </p>
                </div>
              ) : userJournals.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No journal entries logged by this trader yet.</p>
              ) : (
                userJournals.map(jrn => (
                  <div key={jrn.id} className="p-3 rounded-xl border border-fatfx-border bg-white shadow-subtle">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono text-slate-900">{jrn.currency}</span>
                        <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded text-white', jrn.positionType === 'BUY' ? 'bg-fatfx-win-solid' : 'bg-fatfx-loss-solid')}>
                          {jrn.positionType}
                        </span>
                        <span className={clsx('text-[10px] font-bold', jrn.result === 'WIN' ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>
                          {jrn.result}
                        </span>
                      </div>
                      <span className={clsx('font-bold text-xs font-mono', (jrn.netPnL ?? jrn.totalProfit ?? 0) >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>
                        {formatSignedCurrency(jrn.netPnL ?? jrn.totalProfit ?? 0)}
                      </span>
                    </div>
                    {jrn.notes && <p className="text-[11px] text-slate-600 line-clamp-2">{jrn.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
