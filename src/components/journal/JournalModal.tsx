import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { JournalEntry, PositionType, TradeResult } from '../../types/journal';
import { useJournal } from '../../context/JournalContext';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEntry?: JournalEntry | null;
  defaultDate?: string;
}

const CURRENCIES = [
  'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD',
  'NZDUSD', 'USDCHF', 'EURGBP', 'EURJPY', 'GBPJPY',
  'US30', 'NAS100', 'US500', 'BTCUSD', 'ETHUSD', 'Other'
];

export const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, editEntry, defaultDate }) => {
  const { addJournal, updateJournal, capitalConfigs } = useJournal();
  const { currentUser } = useAuth();

  const today = defaultDate || new Date().toISOString().split('T')[0];

  const getDefaultCapital = (dateStr: string) => {
    const d = new Date(dateStr);
    const config = capitalConfigs.find(c => c.year === d.getFullYear() && c.month === d.getMonth());
    return config ? config.capital : 10000;
  };

  const [currency, setCurrency] = useState('XAUUSD');
  const [customCurrency, setCustomCurrency] = useState('');
  const [monthlyStartBalance, setMonthlyStartBalance] = useState(getDefaultCapital(today));
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('09:00');
  const [positionType, setPositionType] = useState<PositionType>('BUY');
  const [slPips, setSlPips] = useState(20);
  const [result, setResult] = useState<TradeResult>('WIN');
  const [grossPL, setGrossPL] = useState(0);
  const [commissions, setCommissions] = useState(0);
  const [tradingViewUrl, setTradingViewUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editEntry) {
      setCurrency(editEntry.currency);
      setMonthlyStartBalance(editEntry.monthlyStartBalance);
      setDate(editEntry.date);
      setTime(editEntry.time || '09:00');
      setPositionType(editEntry.positionType);
      setSlPips(editEntry.slPips);
      setResult(editEntry.result);
      setGrossPL(editEntry.grossProfitLoss);
      setCommissions(editEntry.commissions);
      setTradingViewUrl(editEntry.tradingViewUrl || '');
      setNotes(editEntry.notes || '');
    } else {
      setCurrency('XAUUSD');
      setCustomCurrency('');
      setMonthlyStartBalance(getDefaultCapital(today));
      setDate(today);
      setTime('09:00');
      setPositionType('BUY');
      setSlPips(20);
      setResult('WIN');
      setGrossPL(0);
      setCommissions(0);
      setTradingViewUrl('');
      setNotes('');
    }
  }, [editEntry, isOpen]);

  if (!isOpen) return null;

  const totalProfit = grossPL - commissions;
  const gainPct = monthlyStartBalance > 0 ? (totalProfit / monthlyStartBalance) * 100 : 0;

  const handleSubmit = () => {
    const finalCurrency = currency === 'Other' ? customCurrency.toUpperCase().trim() : currency;
    if (!finalCurrency) return;

    const payload = {
      userId: currentUser.id,
      authorUsername: currentUser.username,
      currency: finalCurrency,
      monthlyStartBalance,
      date,
      time,
      positionType,
      slPips,
      result,
      grossProfitLoss: grossPL,
      commissions,
      totalProfit,
      gainPercentage: gainPct,
      tradingViewUrl: tradingViewUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      pushedTo: editEntry?.pushedTo || [],
    };

    if (editEntry) {
      updateJournal(editEntry.id, payload);
    } else {
      addJournal(payload);
    }
    onClose();
  };

  const inp = "w-full px-3 py-2 text-sm rounded-xl border border-fatfx-border bg-white focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400 focus:border-transparent transition-all";
  const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{children}</label>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-futuristic border border-fatfx-border max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fatfx-border bg-fatfx-surface-subtle shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">{editEntry ? 'Edit Journal Entry' : 'New Journal Entry'}</p>
            <p className="text-[11px] text-slate-500">Log your trade details</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Currency & Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Currency / Pair</Label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={inp}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {currency === 'Other' && (
                <input type="text" placeholder="e.g. USDMXN" value={customCurrency} onChange={e => setCustomCurrency(e.target.value)} className={`${inp} mt-2`} />
              )}
            </div>
            <div>
              <Label>Monthly Start Balance ($)</Label>
              <input type="number" value={monthlyStartBalance} onChange={e => setMonthlyStartBalance(Number(e.target.value))} className={inp} min={0} step={100} />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
            </div>
            <div>
              <Label>Time</Label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inp} />
            </div>
          </div>

          {/* Direction & SL Pips */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Direction</Label>
              <div className="flex rounded-xl overflow-hidden border border-fatfx-border">
                <button onClick={() => setPositionType('BUY')} className={clsx('flex-1 py-2 text-sm font-semibold transition-all', positionType === 'BUY' ? 'bg-fatfx-win-solid text-white' : 'bg-white text-slate-600 hover:bg-fatfx-win-bg')}>BUY</button>
                <button onClick={() => setPositionType('SELL')} className={clsx('flex-1 py-2 text-sm font-semibold transition-all', positionType === 'SELL' ? 'bg-fatfx-loss-solid text-white' : 'bg-white text-slate-600 hover:bg-fatfx-loss-bg')}>SELL</button>
              </div>
            </div>
            <div>
              <Label>SL Pips</Label>
              <input type="number" value={slPips} onChange={e => setSlPips(Number(e.target.value))} className={inp} min={0} step={0.5} />
            </div>
          </div>

          {/* Result */}
          <div>
            <Label>Result</Label>
            <div className="flex gap-2">
              {(['WIN', 'LOSS', 'BE'] as TradeResult[]).map(r => (
                <button
                  key={r}
                  onClick={() => setResult(r)}
                  className={clsx(
                    'flex-1 py-2 text-sm font-semibold rounded-xl border transition-all',
                    result === r
                      ? r === 'WIN' ? 'bg-fatfx-win-solid text-white border-fatfx-win-solid shadow-glow-green'
                        : r === 'LOSS' ? 'bg-fatfx-loss-solid text-white border-fatfx-loss-solid shadow-glow-red'
                        : 'bg-slate-500 text-white border-slate-500'
                      : 'bg-white text-slate-600 border-fatfx-border hover:bg-fatfx-surface-subtle'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Gross P/L & Commissions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gross Profit / Loss ($)</Label>
              <input type="number" value={grossPL} onChange={e => setGrossPL(Number(e.target.value))} className={inp} step={0.01} placeholder="e.g. 450.00 or -220.00" />
            </div>
            <div>
              <Label>Commissions ($)</Label>
              <input type="number" value={commissions} onChange={e => setCommissions(Number(e.target.value))} className={inp} min={0} step={0.01} />
            </div>
          </div>

          {/* Auto-calculated */}
          <div className="bg-fatfx-surface-subtle rounded-xl p-3 border border-fatfx-border grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Net Total Profit</p>
              <p className={clsx('text-base font-bold font-mono', totalProfit >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Gain %</p>
              <p className={clsx('text-base font-bold font-mono', gainPct >= 0 ? 'text-fatfx-win-text' : 'text-fatfx-loss-text')}>
                {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* TradingView URL */}
          <div>
            <Label>TradingView Chart URL (optional)</Label>
            <input type="url" value={tradingViewUrl} onChange={e => setTradingViewUrl(e.target.value)} placeholder="https://www.tradingview.com/chart/..." className={inp} />
          </div>

          {/* Notes */}
          <div>
            <Label>Trade Notes / Strategy</Label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe your setup, confluences, thought process..." rows={3} className={`${inp} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-fatfx-border bg-fatfx-surface-subtle shrink-0">
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-fatfx-teal-500 text-white text-sm font-bold rounded-xl hover:bg-fatfx-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-glow-teal"
          >
            <Save className="w-4 h-4" />
            {editEntry ? 'Update Journal' : 'Save Journal Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};
