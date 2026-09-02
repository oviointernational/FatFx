import React, { useState } from 'react';
import { Edit2, Check } from 'lucide-react';
import { MonthSummary, DayJournalSummary } from '../../types/journal';
import { useJournal } from '../../context/JournalContext';
import { formatSignedCurrency, formatPercent } from '../../utils/formatters';
import clsx from 'clsx';

interface MonthCardProps {
  summary: MonthSummary;
  year: number;
  onDayClick: (date: string, daySummary: DayJournalSummary) => void;
}

export const MonthCard: React.FC<MonthCardProps> = ({ summary, year, onDayClick }) => {
  const { updateCapital } = useJournal();
  const [editingCapital, setEditingCapital] = useState(false);
  const [capitalInput, setCapitalInput] = useState(summary.capital.toString());

  const firstDayOfWeek = new Date(year, summary.monthIndex, 1).getDay();

  const saveCapital = () => {
    const val = parseFloat(capitalInput);
    if (!isNaN(val) && val > 0) {
      updateCapital(year, summary.monthIndex, val);
    } else {
      setCapitalInput(summary.capital.toString());
    }
    setEditingCapital(false);
  };

  const pnlPositive = summary.netPnL >= 0;

  return (
    <div className="bg-white rounded-2xl border border-fatfx-border shadow-subtle overflow-hidden hover:shadow-futuristic transition-all duration-200">
      {/* Month header */}
      <div className="px-3.5 py-2.5 bg-fatfx-surface-subtle border-b border-fatfx-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-900 tracking-tight">{summary.monthName}</span>
          <div className={clsx(
            'text-xs font-bold font-mono px-1.5 py-0.5 rounded-lg border-none',
            summary.totalTrades > 0
              ? pnlPositive
                ? 'text-fatfx-win-text bg-fatfx-win-bg'
                : 'text-fatfx-loss-text bg-fatfx-loss-bg'
              : 'text-slate-400 bg-transparent'
          )}>
            {summary.totalTrades > 0 ? formatSignedCurrency(summary.netPnL) : '—'}
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          {/* Capital editable */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 uppercase tracking-wide">Capital</span>
            {editingCapital ? (
              <div className="flex items-center gap-1">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  value={capitalInput}
                  onChange={e => setCapitalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveCapital(); if (e.key === 'Escape') setEditingCapital(false); }}
                  className="w-20 px-1 py-0.5 text-[10px] border border-fatfx-teal-400 rounded-md focus:outline-none bg-white"
                  autoFocus
                />
                <button onClick={saveCapital} className="p-0.5 hover:text-fatfx-teal-600">
                  <Check className="w-3 h-3 text-fatfx-teal-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setCapitalInput(summary.capital.toString()); setEditingCapital(true); }}
                className="flex items-center gap-0.5 text-slate-600 hover:text-fatfx-teal-600 transition-colors group"
              >
                <span className="font-semibold">${summary.capital.toLocaleString()}</span>
                <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
          {/* PnL % */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 uppercase tracking-wide">PnL</span>
            <span className={clsx('font-bold', summary.gainPercentage >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>
              {summary.totalTrades > 0 ? formatPercent(summary.gainPercentage) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-2.5">
        {/* Day of week labels */}
        <div className="grid grid-cols-7 mb-1.5">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-semibold text-slate-400 py-0.5">{d}</div>
          ))}
        </div>

        {/* Day boxes: transparent if no journal, grey if draft only, green if published win, red if published loss */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Blank cells for starting offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {summary.days.map(day => {
            const hasEntries = day.totalTrades > 0;
            const isPublished = day.publishStatus === 'PUBLISHED';
            const isDraftOnly = day.publishStatus === 'DRAFT';

            let cellStyle = 'bg-transparent text-slate-400 hover:text-slate-700 hover:bg-fatfx-surface-subtle';
            if (isDraftOnly) {
              cellStyle = 'bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 shadow-sm';
            } else if (isPublished) {
              if (day.netPnL > 0) {
                cellStyle = 'bg-fatfx-win-bg text-fatfx-win-text font-bold hover:opacity-90 hover:scale-105 shadow-sm';
              } else {
                cellStyle = 'bg-fatfx-loss-bg text-fatfx-loss-text font-bold hover:opacity-90 hover:scale-105 shadow-sm';
              }
            }

            return (
              <button
                key={day.dayNumber}
                onClick={() => onDayClick(day.date, day)}
                title={
                  hasEntries
                    ? `${day.totalTrades} trade(s) — ${isPublished ? `PnL: ${formatSignedCurrency(day.netPnL)} (Published)` : 'Draft (Unpublished)'}`
                    : day.date
                }
                className={clsx(
                  'aspect-square flex items-center justify-center text-[11px] font-semibold rounded-lg transition-all duration-150 relative border-none',
                  cellStyle
                )}
              >
                {day.dayNumber}
                {day.totalTrades > 1 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-fatfx-teal-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {day.totalTrades}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month footer stats */}
      {summary.totalTrades > 0 && (
        <div className="px-3.5 py-1.5 border-t border-fatfx-border bg-fatfx-surface-subtle flex items-center justify-between text-[10px]">
          <span className="text-slate-500">{summary.totalTrades} trades</span>
          <div className="flex items-center gap-2">
            <span className="text-fatfx-win-text font-semibold">{summary.winCount}W</span>
            <span className="text-fatfx-loss-text font-semibold">{summary.lossCount}L</span>
          </div>
        </div>
      )}
    </div>
  );
};
