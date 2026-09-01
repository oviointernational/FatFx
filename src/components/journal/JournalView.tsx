import React, { useState } from 'react';
import { Plus, Calendar, Filter } from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import { useAuth } from '../../context/AuthContext';
import { calculateJournalMetrics } from '../../services/calculations';
import { MonthCard } from './MonthCard';
import { DayDetailView } from './DayDetailView';
import { DayJournalSummary } from '../../types/journal';
import clsx from 'clsx';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export const JournalView: React.FC = () => {
  const { getMyJournals, getPushedJournals, capitalConfigs } = useJournal();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<'mine' | 'pushed'>('mine');
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedDay, setSelectedDay] = useState<{ date: string; summary: DayJournalSummary } | null>(null);

  const myJournals = getMyJournals();
  const pushedJournals = getPushedJournals();
  const activeJournals = tab === 'mine' ? myJournals : pushedJournals;

  const monthlySummaries = calculateJournalMetrics(activeJournals, selectedYear, capitalConfigs);

  const handleDayClick = (date: string, summary: DayJournalSummary) => {
    setSelectedDay({ date, summary });
  };

  if (selectedDay) {
    return (
      <DayDetailView
        date={selectedDay.date}
        entries={selectedDay.summary.entries}
        onBack={() => setSelectedDay(null)}
        isPushedView={tab === 'pushed'}
      />
    );
  }

  const totalYearPnL = monthlySummaries.reduce((sum, m) => sum + m.netPnL, 0);
  const totalTrades = monthlySummaries.reduce((sum, m) => sum + m.totalTrades, 0);
  const totalWins = monthlySummaries.reduce((sum, m) => sum + m.winCount, 0);
  const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-4 py-3 border-b border-fatfx-border bg-white shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-slate-900">Trading Journal</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-fatfx-surface-subtle rounded-lg px-2 py-1 border border-fatfx-border">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="text-xs font-semibold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Mine / Pushed tabs */}
        <div className="flex gap-1 bg-fatfx-surface-subtle rounded-xl p-0.5 border border-fatfx-border">
          <button
            onClick={() => { setTab('mine'); setSelectedDay(null); }}
            className={clsx(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
              tab === 'mine' ? 'bg-white text-fatfx-teal-700 shadow-subtle' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            My Journal
            <span className="ml-1 text-[10px] bg-fatfx-teal-100 text-fatfx-teal-700 px-1.5 py-0.5 rounded-full">{myJournals.length}</span>
          </button>
          <button
            onClick={() => { setTab('pushed'); setSelectedDay(null); }}
            className={clsx(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
              tab === 'pushed' ? 'bg-white text-fatfx-teal-700 shadow-subtle' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Pushed
            <span className="ml-1 text-[10px] bg-fatfx-teal-100 text-fatfx-teal-700 px-1.5 py-0.5 rounded-full">{pushedJournals.length}</span>
          </button>
        </div>

        {/* Year stats bar */}
        {totalTrades > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className={clsx('rounded-xl px-3 py-2 text-center', totalYearPnL >= 0 ? 'bg-fatfx-win-bg' : 'bg-fatfx-loss-bg')}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Year PnL</p>
              <p className={clsx('text-sm font-bold font-mono', totalYearPnL >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>
                {totalYearPnL >= 0 ? '+' : ''}{totalYearPnL.toFixed(2)}
              </p>
            </div>
            <div className="bg-fatfx-surface-subtle rounded-xl px-3 py-2 text-center border border-fatfx-border">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Trades</p>
              <p className="text-sm font-bold text-slate-900">{totalTrades}</p>
            </div>
            <div className="bg-fatfx-surface-subtle rounded-xl px-3 py-2 text-center border border-fatfx-border">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Win Rate</p>
              <p className="text-sm font-bold text-fatfx-teal-600">{winRate}%</p>
            </div>
          </div>
        )}
      </div>

      {/* 12 month grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeJournals.length === 0 && tab === 'pushed' ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-14 h-14 rounded-2xl bg-fatfx-surface-subtle flex items-center justify-center mb-3">
              <Filter className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">No pushed journals yet</p>
            <p className="text-xs text-slate-400 mt-1">When someone pushes a trade to you, it will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {monthlySummaries.map(summary => (
              <MonthCard
                key={summary.monthIndex}
                summary={summary}
                year={selectedYear}
                onDayClick={handleDayClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
