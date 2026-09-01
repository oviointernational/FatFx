import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Send, ExternalLink, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { JournalEntry } from '../../types/journal';
import { useJournal } from '../../context/JournalContext';
import { useAuth } from '../../context/AuthContext';
import { JournalModal } from './JournalModal';
import { PushDialog } from './PushDialog';
import { formatSignedCurrency, formatPercent, MONTH_NAMES, parseDateString } from '../../utils/formatters';
import clsx from 'clsx';

interface DayDetailViewProps {
  date: string;
  entries: JournalEntry[];
  onBack: () => void;
  isPushedView?: boolean;
}

export const DayDetailView: React.FC<DayDetailViewProps> = ({ date, entries, onBack, isPushedView = false }) => {
  const { deleteJournal } = useJournal();
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [pushJournalId, setPushJournalId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const parsed = parseDateString(date);
  const dayLabel = `${parsed.day} ${MONTH_NAMES[parsed.month]} ${parsed.year}`;

  const totalPnL = entries.reduce((sum, e) => sum + e.totalProfit, 0);
  const wins = entries.filter(e => e.result === 'WIN').length;
  const losses = entries.filter(e => e.result === 'LOSS').length;

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteJournal(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const canEditDelete = (entry: JournalEntry) => !isPushedView && entry.userId === currentUser.id;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-fatfx-border bg-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-fatfx-surface-subtle transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900">{dayLabel}</h2>
            <p className="text-[11px] text-slate-500">{entries.length} {entries.length === 1 ? 'trade' : 'trades'} logged</p>
          </div>
          {!isPushedView && (
            <button
              onClick={() => { setEditEntry(null); setShowModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-fatfx-teal-500 text-white text-xs font-semibold rounded-xl hover:bg-fatfx-teal-600 transition-all shadow-glow-teal"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Trade
            </button>
          )}
        </div>

        {entries.length > 0 && (
          <div className="mt-3 flex gap-3">
            <div className={clsx(
              'flex-1 rounded-xl px-3 py-2 flex items-center justify-between',
              totalPnL >= 0 ? 'bg-fatfx-win-bg border border-fatfx-win-border' : 'bg-fatfx-loss-bg border border-fatfx-loss-border'
            )}>
              <span className="text-xs text-slate-600 font-medium">Day PnL</span>
              <span className={clsx('font-bold text-sm font-mono', totalPnL >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>
                {formatSignedCurrency(totalPnL)}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="bg-fatfx-win-bg border border-fatfx-win-border rounded-xl px-3 py-2 text-center min-w-[2.5rem]">
                <p className="text-[10px] text-slate-500">W</p>
                <p className="text-sm font-bold text-fatfx-win-text">{wins}</p>
              </div>
              <div className="bg-fatfx-loss-bg border border-fatfx-loss-border rounded-xl px-3 py-2 text-center min-w-[2.5rem]">
                <p className="text-[10px] text-slate-500">L</p>
                <p className="text-sm font-bold text-fatfx-loss-text">{losses}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-14 h-14 rounded-2xl bg-fatfx-surface-subtle flex items-center justify-center mb-3">
              <Plus className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No trades on this day</p>
            {!isPushedView && (
              <button
                onClick={() => { setEditEntry(null); setShowModal(true); }}
                className="mt-3 px-4 py-2 bg-fatfx-teal-500 text-white text-xs font-semibold rounded-xl hover:bg-fatfx-teal-600 transition-all"
              >
                Log a Trade
              </button>
            )}
          </div>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              className={clsx(
                'bg-white rounded-2xl border shadow-subtle overflow-hidden transition-all hover:shadow-futuristic',
                entry.result === 'WIN' ? 'border-fatfx-win-border'
                  : entry.result === 'LOSS' ? 'border-fatfx-loss-border'
                  : 'border-fatfx-border'
              )}
            >
              {/* Card header */}
              <div className={clsx(
                'px-4 py-2.5 flex items-center justify-between',
                entry.result === 'WIN' ? 'bg-fatfx-win-bg' : entry.result === 'LOSS' ? 'bg-fatfx-loss-bg' : 'bg-slate-50'
              )}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-lg', entry.positionType === 'BUY' ? 'bg-fatfx-win-solid text-white' : 'bg-fatfx-loss-solid text-white')}>
                    {entry.positionType}
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{entry.currency}</span>
                  {entry.time && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-2.5 h-2.5" />{entry.time}
                    </span>
                  )}
                  {entry.isPushed && entry.pushedBy && (
                    <span className="text-[10px] bg-fatfx-teal-100 text-fatfx-teal-700 px-1.5 py-0.5 rounded-full font-medium">
                      from @{entry.pushedBy}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {entry.result === 'WIN' ? <TrendingUp className="w-4 h-4 text-fatfx-win-text" />
                    : entry.result === 'LOSS' ? <TrendingDown className="w-4 h-4 text-fatfx-loss-text" />
                    : <Minus className="w-4 h-4 text-slate-500" />}
                  <span className={clsx('text-xs font-bold', entry.result === 'WIN' ? 'text-fatfx-win-text' : entry.result === 'LOSS' ? 'text-fatfx-loss-text' : 'text-slate-600')}>
                    {entry.result}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="px-4 py-3">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Gross P/L</p>
                    <p className={clsx('text-sm font-bold font-mono', entry.grossProfitLoss >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>{formatSignedCurrency(entry.grossProfitLoss)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Commission</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono">-${entry.commissions.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Net Profit</p>
                    <p className={clsx('text-sm font-bold font-mono', entry.totalProfit >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>{formatSignedCurrency(entry.totalProfit)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">SL Pips</p>
                    <p className="text-sm font-semibold text-slate-700">{entry.slPips}p</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Gain %</p>
                    <p className={clsx('text-sm font-bold font-mono', entry.gainPercentage >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>{formatPercent(entry.gainPercentage)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Capital</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono">${entry.monthlyStartBalance.toLocaleString()}</p>
                  </div>
                </div>

                {entry.notes && (
                  <p className="text-xs text-slate-500 leading-relaxed bg-fatfx-surface-subtle rounded-lg px-3 py-2 mb-3 border border-fatfx-border">
                    {entry.notes}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {entry.tradingViewUrl && (
                    <a href={entry.tradingViewUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-medium text-fatfx-teal-600 hover:text-fatfx-teal-700 bg-fatfx-teal-50 hover:bg-fatfx-teal-100 px-2.5 py-1.5 rounded-lg transition-all border border-fatfx-teal-100">
                      <ExternalLink className="w-3 h-3" />TradingView
                    </a>
                  )}
                  {canEditDelete(entry) && (
                    <>
                      <button onClick={() => { setEditEntry(entry); setShowModal(true); }}
                        className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all">
                        <Edit2 className="w-3 h-3" />Edit
                      </button>
                      <button onClick={() => setPushJournalId(entry.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-fatfx-teal-600 hover:text-fatfx-teal-700 bg-fatfx-teal-50 hover:bg-fatfx-teal-100 px-2.5 py-1.5 rounded-lg transition-all border border-fatfx-teal-100">
                        <Send className="w-3 h-3" />Push
                        {entry.pushedTo && entry.pushedTo.length > 0 && (
                          <span className="ml-0.5 text-[9px] bg-fatfx-teal-500 text-white rounded-full px-1.5">{entry.pushedTo.length}</span>
                        )}
                      </button>
                      <button onClick={() => handleDelete(entry.id)}
                        className={clsx(
                          'flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all',
                          deleteConfirm === entry.id ? 'bg-red-500 text-white' : 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100'
                        )}>
                        <Trash2 className="w-3 h-3" />{deleteConfirm === entry.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <JournalModal isOpen={showModal} onClose={() => { setShowModal(false); setEditEntry(null); }} editEntry={editEntry} defaultDate={date} />
      {pushJournalId && (
        <PushDialog journalId={pushJournalId} isOpen={!!pushJournalId} onClose={() => setPushJournalId(null)} />
      )}
    </div>
  );
};
