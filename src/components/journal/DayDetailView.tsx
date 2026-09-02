import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Send, ExternalLink, TrendingUp, TrendingDown, Minus, Clock, ShieldCheck, AlertTriangle, Image } from 'lucide-react';
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

  const publishedEntries = entries.filter(e => e.publishStatus === 'PUBLISHED');
  const totalPnL = publishedEntries.reduce((sum, e) => sum + (e.netPnL !== undefined ? e.netPnL : (e.totalProfit ?? 0)), 0);
  const wins = publishedEntries.filter(e => (e.netPnL ?? e.totalProfit ?? 0) > 0).length;
  const losses = publishedEntries.filter(e => (e.netPnL ?? e.totalProfit ?? 0) < 0).length;

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteJournal(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const canEditDelete = (entry: JournalEntry) => !isPushedView && entry.userId === currentUser?.id;

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
              publishedEntries.length > 0
                ? totalPnL >= 0
                  ? 'bg-fatfx-win-bg border border-fatfx-win-border'
                  : 'bg-fatfx-loss-bg border border-fatfx-loss-border'
                : 'bg-slate-100 border border-slate-200'
            )}>
              <span className="text-xs text-slate-600 font-medium">Published PnL</span>
              <span className={clsx(
                'font-bold text-sm font-mono',
                publishedEntries.length > 0
                  ? totalPnL >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text'
                  : 'text-slate-500'
              )}>
                {publishedEntries.length > 0 ? formatSignedCurrency(totalPnL) : 'Drafts only'}
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
          entries.map(entry => {
            const isPublished = entry.publishStatus === 'PUBLISHED';
            const netProfit = entry.netPnL !== undefined ? entry.netPnL : (entry.totalProfit ?? 0);
            const isWin = isPublished && netProfit > 0;
            const isLoss = isPublished && netProfit < 0;
            const direction = entry.direction || (entry.positionType === 'SELL' ? 'SHORT' : 'LONG');

            return (
              <div
                key={entry.id}
                className={clsx(
                  'bg-white rounded-2xl border shadow-subtle overflow-hidden transition-all hover:shadow-futuristic',
                  isWin ? 'border-fatfx-win-border'
                    : isLoss ? 'border-fatfx-loss-border'
                    : isPublished ? 'border-slate-200'
                    : 'border-slate-300 bg-slate-50/50'
                )}
              >
                {/* Card Header */}
                <div className={clsx(
                  'px-4 py-2.5 flex items-center justify-between border-b',
                  isWin ? 'bg-fatfx-win-bg border-fatfx-win-border'
                    : isLoss ? 'bg-fatfx-loss-bg border-fatfx-loss-border'
                    : 'bg-slate-100 border-slate-200'
                )}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx(
                      'text-xs font-bold px-2 py-0.5 rounded-lg shadow-sm',
                      direction === 'LONG' ? 'bg-fatfx-win-solid text-white' : 'bg-fatfx-loss-solid text-white'
                    )}>
                      {direction}
                    </span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{entry.currency}</span>
                    {entry.time && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-2.5 h-2.5" />{entry.time}
                      </span>
                    )}
                    {isPublished ? (
                      <span className="text-[10px] bg-fatfx-win-bg text-fatfx-win-text border border-fatfx-win-border px-1.5 py-0.5 rounded-full font-bold">
                        PUBLISHED
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                        DRAFT
                      </span>
                    )}
                    {entry.isPushed && entry.pushedBy && (
                      <span className="text-[10px] bg-fatfx-teal-100 text-fatfx-teal-700 px-1.5 py-0.5 rounded-full font-medium">
                        from @{entry.pushedBy}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPublished ? (
                      isWin ? (
                        <div className="flex items-center gap-1 text-fatfx-win-text font-bold text-xs">
                          <TrendingUp className="w-4 h-4" />
                          <span>+{formatSignedCurrency(netProfit)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-fatfx-loss-text font-bold text-xs">
                          <TrendingDown className="w-4 h-4" />
                          <span>{formatSignedCurrency(netProfit)}</span>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">In Play / Draft</span>
                    )}
                  </div>
                </div>

                {/* Card Body with Detailed Metrics */}
                <div className="px-4 py-3 space-y-3">
                  {/* Grid 1: Strategy, Position Size, Market Condition */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Strategy</p>
                      <p className="font-semibold text-slate-800 truncate">{entry.strategy || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Size (Lots)</p>
                      <p className="font-semibold text-slate-800 font-mono">{entry.positionSize || 0.1}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Market Condition</p>
                      <p className="font-semibold text-slate-800">{entry.marketCondition || 'TREND'}</p>
                    </div>
                  </div>

                  {/* Grid 2: Entry Price, Stop Loss, Take Profit, Exit Price */}
                  <div className="grid grid-cols-4 gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-fatfx-border">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Entry Price</p>
                      <p className="font-bold text-slate-900 font-mono">{entry.entryPrice || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Stop Loss</p>
                      <p className="font-bold text-red-600 font-mono">{entry.stopLossLevel || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Take Profit</p>
                      <p className="font-bold text-fatfx-teal-600 font-mono">{entry.takeProfitLevel || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Exit Price</p>
                      <p className="font-bold text-slate-900 font-mono">{entry.exitPrice || '—'}</p>
                    </div>
                  </div>

                  {/* Grid 3: Fees, R-Multiple, Discipline/Compliance, Emotional State */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Fees ($)</p>
                      <p className="font-semibold text-slate-700 font-mono">${(entry.fees || entry.commissions || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">R-Multiple</p>
                      <p className="font-bold text-slate-900 font-mono">{entry.rMultiple ? `${entry.rMultiple}R` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Discipline</p>
                      <p className="font-bold text-fatfx-teal-700">{entry.ruleCompliance ? `${entry.ruleCompliance}/10` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Emotional State</p>
                      <p className="font-semibold text-slate-800 truncate">{entry.emotionalState || '—'}</p>
                    </div>
                  </div>

                  {/* Mistakes Made */}
                  {entry.mistakesMade && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Mistakes / Deviations: </span>
                        <span>{entry.mistakesMade}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {entry.notes && (
                    <p className="text-xs text-slate-500 leading-relaxed bg-fatfx-surface-subtle rounded-lg px-3 py-2 border border-fatfx-border">
                      {entry.notes}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {(entry.setupScreenshotUrl || entry.tradingViewUrl) && (
                      <a
                        href={entry.setupScreenshotUrl || entry.tradingViewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-medium text-fatfx-teal-600 hover:text-fatfx-teal-700 bg-fatfx-teal-50 hover:bg-fatfx-teal-100 px-2.5 py-1.5 rounded-lg transition-all border border-fatfx-teal-100"
                      >
                        <Image className="w-3 h-3" />
                        Setup Chart
                      </a>
                    )}

                    {canEditDelete(entry) && (
                      <>
                        <button
                          onClick={() => { setEditEntry(entry); setShowModal(true); }}
                          className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                          {isPublished ? 'Edit' : 'Publish / Edit'}
                        </button>

                        {isPublished ? (
                          <button
                            onClick={() => setPushJournalId(entry.id)}
                            className="flex items-center gap-1 text-[11px] font-medium text-fatfx-teal-600 hover:text-fatfx-teal-700 bg-fatfx-teal-50 hover:bg-fatfx-teal-100 px-2.5 py-1.5 rounded-lg transition-all border border-fatfx-teal-100"
                          >
                            <Send className="w-3 h-3" />
                            Push
                            {entry.pushedTo && entry.pushedTo.length > 0 && (
                              <span className="ml-0.5 text-[9px] bg-fatfx-teal-500 text-white rounded-full px-1.5">
                                {entry.pushedTo.length}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span
                            title="You must publish the trade outcome before pushing to other traders"
                            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg cursor-not-allowed"
                          >
                            <Send className="w-3 h-3 text-slate-300" />
                            Publish to Push
                          </span>
                        )}

                        <button
                          onClick={() => handleDelete(entry.id)}
                          className={clsx(
                            'flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all',
                            deleteConfirm === entry.id ? 'bg-red-500 text-white' : 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100'
                          )}
                        >
                          <Trash2 className="w-3 h-3" />
                          {deleteConfirm === entry.id ? 'Confirm?' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <JournalModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditEntry(null); }}
        editEntry={editEntry}
        defaultDate={date}
      />

      {pushJournalId && (
        <PushDialog
          journalId={pushJournalId}
          isOpen={!!pushJournalId}
          onClose={() => setPushJournalId(null)}
        />
      )}
    </div>
  );
};
