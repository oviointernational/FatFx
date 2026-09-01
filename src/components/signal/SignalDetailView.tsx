import React, { useState } from 'react';
import { ArrowLeft, Share2, ExternalLink, User, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Signal } from '../../types/signal';
import { LongShortChart } from './LongShortChart';
import { useSignals } from '../../context/SignalContext';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { formatPrice, MONTH_SHORT_NAMES } from '../../utils/formatters';
import clsx from 'clsx';

interface SignalDetailViewProps {
  signal: Signal;
  onBack: () => void;
}

export const SignalDetailView: React.FC<SignalDetailViewProps> = ({ signal, onBack }) => {
  const { shareSignal } = useSignals();
  const { currentUser } = useAuth();
  const [shareUsername, setShareUsername] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);

  const users = StorageService.getUsers();
  const isBuy = signal.type === 'BUY';
  const { priceLevels } = signal;

  const handleShare = () => {
    const trimmed = shareUsername.trim().toLowerCase();
    if (!trimmed) { setShareError('Enter a username'); return; }
    if (trimmed === currentUser.username.toLowerCase()) { setShareError("Can't share with yourself"); return; }
    const exists = users.find(u => u.username.toLowerCase() === trimmed);
    if (!exists) { setShareError('User not found on FatFx'); return; }

    const ok = shareSignal(signal.id, trimmed);
    if (ok) {
      setShareSuccess(true);
      setShareUsername('');
      setTimeout(() => { setShareSuccess(false); setShowSharePanel(false); }, 2000);
    } else {
      setShareError('Failed to share signal');
    }
  };

  const dateObj = new Date(signal.date);
  const dateLabel = `${dateObj.getDate()} ${MONTH_SHORT_NAMES[signal.month]} ${signal.year} · ${signal.time}`;

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-fatfx-teal-100 text-fatfx-teal-700',
    HIT_TP: 'bg-fatfx-win-bg text-fatfx-win-text',
    HIT_SL: 'bg-fatfx-loss-bg text-fatfx-loss-text',
    CLOSED: 'bg-slate-100 text-slate-600',
    CANCELLED: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-fatfx-border bg-white shrink-0 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-fatfx-surface-subtle transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 font-mono">{signal.asset}</span>
            <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-lg', isBuy ? 'bg-fatfx-win-solid text-white' : 'bg-fatfx-loss-solid text-white')}>
              {isBuy ? '▲ LONG' : '▼ SHORT'}
            </span>
            <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-lg', statusColors[signal.status])}>
              {signal.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">by @{signal.authorUsername} · {dateLabel}</p>
        </div>
        <button
          onClick={() => setShowSharePanel(!showSharePanel)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-fatfx-teal-500 text-white text-xs font-semibold rounded-xl hover:bg-fatfx-teal-600 transition-all shadow-glow-teal"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>

      {/* Main content: 80% chart / 20% prices */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* 80% — Chart */}
        <div className="flex-1 md:flex-[4] p-4 min-h-64 md:min-h-0 overflow-hidden">
          <LongShortChart signal={signal} />
        </div>

        {/* 20% — Price breakdown */}
        <div className="md:flex-1 border-t md:border-t-0 md:border-l border-fatfx-border bg-fatfx-surface-subtle overflow-y-auto shrink-0">
          <div className="p-4 space-y-3">
            {/* Price levels */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Price Levels</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-fatfx-win-bg border border-fatfx-win-border rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-fatfx-win-text">Take Profit</span>
                  <span className="text-sm font-bold text-fatfx-win-text font-mono">{formatPrice(priceLevels.takeProfit)}</span>
                </div>
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-blue-700">
                    {isBuy ? 'Buy Price' : 'Sell Price'}
                  </span>
                  <span className="text-sm font-bold text-blue-700 font-mono">{formatPrice(priceLevels.entryPrice)}</span>
                </div>
                <div className="flex items-center justify-between bg-fatfx-loss-bg border border-fatfx-loss-border rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-fatfx-loss-text">Stop Loss</span>
                  <span className="text-sm font-bold text-fatfx-loss-text font-mono">{formatPrice(priceLevels.stopLoss)}</span>
                </div>
                {priceLevels.currentPrice && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold text-amber-700">Current</span>
                    <span className="text-sm font-bold text-amber-700 font-mono">{formatPrice(priceLevels.currentPrice)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Metrics</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl p-2.5 border border-fatfx-border text-center">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">TP Pips</p>
                  <p className="text-sm font-bold text-fatfx-win-text font-mono">{priceLevels.tpPips?.toFixed(0) ?? '—'}</p>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-fatfx-border text-center">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">SL Pips</p>
                  <p className="text-sm font-bold text-fatfx-loss-text font-mono">{priceLevels.slPips?.toFixed(0) ?? '—'}</p>
                </div>
                <div className="col-span-2 bg-fatfx-teal-50 rounded-xl p-2.5 border border-fatfx-teal-100 text-center">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">Risk : Reward</p>
                  <p className="text-base font-bold text-fatfx-teal-600 font-mono">1 : {priceLevels.riskRewardRatio.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* Strategy */}
            {signal.strategy && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Strategy</p>
                <p className="text-xs text-slate-700 bg-white rounded-xl p-2.5 border border-fatfx-border leading-relaxed">{signal.strategy}</p>
              </div>
            )}

            {/* Notes */}
            {signal.notes && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Notes</p>
                <p className="text-xs text-slate-600 bg-white rounded-xl p-2.5 border border-fatfx-border leading-relaxed">{signal.notes}</p>
              </div>
            )}

            {/* TradingView link */}
            {signal.tradingViewUrl && (
              <a href={signal.tradingViewUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-3 py-2 bg-white border border-fatfx-border rounded-xl text-xs font-medium text-fatfx-teal-600 hover:bg-fatfx-teal-50 hover:border-fatfx-teal-200 transition-all">
                <ExternalLink className="w-3.5 h-3.5" />
                Open in TradingView
              </a>
            )}

            {/* Shared with */}
            {signal.sharedWith.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Shared With</p>
                <div className="flex flex-wrap gap-1">
                  {signal.sharedWith.map(sw => (
                    <span key={sw.recipientUsername} className="text-[10px] bg-fatfx-teal-100 text-fatfx-teal-700 px-1.5 py-0.5 rounded-full font-medium">
                      @{sw.recipientUsername}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share panel overlay */}
      {showSharePanel && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSharePanel(false)} />
          <div className="relative bg-white rounded-2xl shadow-futuristic border border-fatfx-border w-full max-w-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">Share Signal</p>
              <button onClick={() => setShowSharePanel(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {shareSuccess ? (
              <div className="flex flex-col items-center py-4 gap-2">
                <CheckCircle className="w-10 h-10 text-fatfx-win-text" />
                <p className="text-sm font-semibold text-slate-900">Signal shared!</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Share with username</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter username..."
                      value={shareUsername}
                      onChange={e => { setShareUsername(e.target.value); setShareError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleShare()}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400"
                      autoFocus
                    />
                    <button onClick={handleShare} className="px-3 py-2 bg-fatfx-teal-500 text-white rounded-xl hover:bg-fatfx-teal-600 transition-all">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  {shareError && <p className="text-xs text-red-500 mt-1">{shareError}</p>}
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {users.filter(u => u.id !== currentUser.id && !signal.sharedWith.some(sw => sw.recipientUsername === u.username)).slice(0, 5).map(u => (
                    <button key={u.id} onClick={() => setShareUsername(u.username)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-fatfx-surface-subtle transition-all text-left">
                      <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-fatfx-border shrink-0">
                        {u.avatarUrl ? <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center"><User className="w-3.5 h-3.5 text-fatfx-teal-500" /></div>}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">{u.fullName}</p>
                        <p className="text-[10px] text-slate-500">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
