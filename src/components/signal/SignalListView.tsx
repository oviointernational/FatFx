import React, { useState } from 'react';
import { Plus, ChevronDown, Filter } from 'lucide-react';
import { useSignals } from '../../context/SignalContext';
import { useAuth } from '../../context/AuthContext';
import { SignalDetailView } from './SignalDetailView';
import { CreateSignalModal } from './CreateSignalModal';
import { Signal } from '../../types/signal';
import { MONTH_NAMES } from '../../utils/formatters';
import clsx from 'clsx';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export const SignalListView: React.FC = () => {
  const { signals } = useSignals();
  const { currentUser } = useAuth();
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (selectedSignal) {
    return <SignalDetailView signal={selectedSignal} onBack={() => setSelectedSignal(null)} />;
  }

  // Filter signals by selected year
  const yearSignals = signals.filter(s => s.year === selectedYear);

  // Group signals by month index (0 to 11)
  const monthsWithSignals = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthSignals = yearSignals.filter(s => s.month === monthIndex);
    return {
      monthIndex,
      monthName: MONTH_NAMES[monthIndex].toUpperCase(),
      signals: monthSignals,
    };
  }).filter(group => group.signals.length > 0);

  // Author display helper: If the logged-in user is author, display "@you", else "@username"
  const formatAuthor = (authorUsername: string) => {
    if (authorUsername.toLowerCase() === currentUser.username.toLowerCase() || authorUsername === 'you') {
      return '@you';
    }
    return `@${authorUsername}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#FBFDFD] overflow-y-auto">
      {/* Top Header matching Image 1 */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-fatfx-border/50 bg-white shrink-0">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Signals</h1>

        <div className="flex items-center gap-3">
          {/* Year selector dropdown */}
          <div className="relative inline-flex items-center bg-white border border-slate-200/90 rounded-lg px-3 py-1.5 shadow-none hover:border-slate-300 transition-colors">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-transparent pr-6 text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          {/* + New signal button */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>New signal</span>
          </button>
        </div>
      </div>

      {/* Main Body: List of Months with Multi-column / Multi-row Signals matching Image 1 */}
      <div className="flex-1 p-6 space-y-7">
        {monthsWithSignals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-14 h-14 rounded-2xl bg-fatfx-surface-subtle flex items-center justify-center mb-3">
              <Filter className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No signals for {selectedYear}</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Publish your first trade signal for this year</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Signal
            </button>
          </div>
        ) : (
          monthsWithSignals.map(group => (
            <div key={group.monthIndex} className="space-y-2.5">
              {/* Month Heading */}
              <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                {group.monthName}
              </h2>

              {/* Signals Grid (Multiple Columns & Multiple Rows) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {group.signals.map(signal => {
                  const isBuy = signal.type === 'BUY';
                  const author = formatAuthor(signal.authorUsername);

                  return (
                    <button
                      key={signal.id}
                      onClick={() => setSelectedSignal(signal)}
                      className={clsx(
                        'w-full text-left rounded-xl p-4 transition-all duration-150 relative text-white flex flex-col justify-between h-24 hover:opacity-95 focus:outline-none',
                        isBuy
                          ? 'bg-[#0E9F6E]' // Clean flat green matching Image 1
                          : 'bg-[#E02424]'  // Clean flat red matching Image 1
                      )}
                    >
                      {/* Top row: Asset Name */}
                      <div>
                        <span className="font-extrabold text-base tracking-wide font-sans text-white">
                          {signal.asset}
                        </span>
                      </div>

                      {/* Bottom row: Direction (LONG/SHORT) & Author */}
                      <div className="flex items-center justify-between text-xs font-medium text-white/95">
                        <span className="font-semibold uppercase tracking-wider text-[11px]">
                          {isBuy ? 'LONG' : 'SHORT'}
                        </span>
                        <span className="text-[11px] text-white/80 font-normal">
                          {author}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Signal Modal */}
      <CreateSignalModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
};
