import React, { useState } from 'react';
import { X, Save, TrendingUp } from 'lucide-react';
import { SignalType, SignalStatus } from '../../types/signal';
import { useSignals } from '../../context/SignalContext';
import { useAuth } from '../../context/AuthContext';
import { calculateRR } from '../../services/calculations';
import clsx from 'clsx';

interface CreateSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ASSETS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'EURGBP', 'EURJPY', 'GBPJPY', 'US30', 'NAS100', 'US500', 'BTCUSD', 'ETHUSD'];
const TIMEFRAMES = ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'];

export const CreateSignalModal: React.FC<CreateSignalModalProps> = ({ isOpen, onClose }) => {
  const { addSignal } = useSignals();
  const { currentUser } = useAuth();

  const now = new Date();
  const [asset, setAsset] = useState('XAUUSD');
  const [type, setType] = useState<SignalType>('BUY');
  const [timeframe, setTimeframe] = useState('15M');
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [strategy, setStrategy] = useState('');
  const [notes, setNotes] = useState('');
  const [tvUrl, setTvUrl] = useState('');

  if (!isOpen) return null;

  const entryNum = parseFloat(entry) || 0;
  const slNum = parseFloat(sl) || 0;
  const tpNum = parseFloat(tp) || 0;

  const rr = entryNum && slNum && tpNum ? calculateRR(entryNum, slNum, tpNum, type === 'BUY') : 0;
  const isJpy = asset.includes('JPY');
  const multiplier = isJpy ? 100 : asset === 'XAUUSD' || asset.includes('US') ? 10 : 10000;
  const slPips = entryNum && slNum ? Math.abs(entryNum - slNum) * multiplier : 0;
  const tpPips = entryNum && tpNum ? Math.abs(tpNum - entryNum) * multiplier : 0;

  const handleSave = () => {
    if (!entryNum || !slNum || !tpNum) return;
    const dateObj = new Date(date);
    addSignal({
      authorId: currentUser.id,
      authorUsername: currentUser.username,
      asset,
      type,
      status: 'ACTIVE',
      timeframe,
      year: dateObj.getFullYear(),
      month: dateObj.getMonth(),
      date,
      time,
      priceLevels: {
        entryPrice: entryNum,
        stopLoss: slNum,
        takeProfit: tpNum,
        slPips,
        tpPips,
        riskRewardRatio: rr,
      },
      strategy: strategy.trim() || undefined,
      notes: notes.trim() || undefined,
      tradingViewUrl: tvUrl.trim() || undefined,
      sharedWith: [],
    });
    onClose();
  };

  const inp = "w-full px-3 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400 transition-all";
  const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
    <label className={clsx('block text-[11px] font-semibold uppercase tracking-wide mb-1', color || 'text-slate-500')}>{children}</label>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-futuristic border border-fatfx-border max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-fatfx-border bg-fatfx-surface-subtle shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-fatfx-teal-500" />
            <p className="text-sm font-bold text-slate-900">New Signal</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Asset</Label>
              <select value={asset} onChange={e => setAsset(e.target.value)} className={inp}>
                {ASSETS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <Label>Timeframe</Label>
              <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className={inp}>
                {TIMEFRAMES.map(tf => <option key={tf}>{tf}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>Signal Type</Label>
            <div className="flex rounded-xl overflow-hidden border border-fatfx-border">
              <button onClick={() => setType('BUY')} className={clsx('flex-1 py-2.5 text-sm font-bold transition-all', type === 'BUY' ? 'bg-fatfx-win-solid text-white' : 'bg-white text-slate-500 hover:bg-fatfx-win-bg')}>
                ▲ LONG (BUY)
              </button>
              <button onClick={() => setType('SELL')} className={clsx('flex-1 py-2.5 text-sm font-bold transition-all', type === 'SELL' ? 'bg-fatfx-loss-solid text-white' : 'bg-white text-slate-500 hover:bg-fatfx-loss-bg')}>
                ▼ SHORT (SELL)
              </button>
            </div>
          </div>

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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Entry</Label>
              <input type="number" value={entry} onChange={e => setEntry(e.target.value)} className={inp} step="0.00001" placeholder="0.00000" />
            </div>
            <div>
              <Label color="text-red-500">Stop Loss</Label>
              <input type="number" value={sl} onChange={e => setSl(e.target.value)} className={`${inp} border-red-200 focus:ring-red-400`} step="0.00001" placeholder="0.00000" />
            </div>
            <div>
              <Label color="text-green-600">Take Profit</Label>
              <input type="number" value={tp} onChange={e => setTp(e.target.value)} className={`${inp} border-green-200 focus:ring-green-400`} step="0.00001" placeholder="0.00000" />
            </div>
          </div>

          {rr > 0 && (
            <div className="bg-fatfx-teal-50 rounded-xl p-3 border border-fatfx-teal-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">SL Pips</p>
                <p className="text-sm font-bold text-red-500 font-mono">{slPips.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">TP Pips</p>
                <p className="text-sm font-bold text-green-600 font-mono">{tpPips.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">R:R</p>
                <p className="text-sm font-bold text-fatfx-teal-600 font-mono">1:{rr.toFixed(1)}</p>
              </div>
            </div>
          )}

          <div>
            <Label>Strategy</Label>
            <input type="text" value={strategy} onChange={e => setStrategy(e.target.value)} className={inp} placeholder="e.g. ICT FVG + OB Mitigation" />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inp} resize-none`} placeholder="Trade thesis and confluences..." />
          </div>
          <div>
            <Label>TradingView URL</Label>
            <input type="url" value={tvUrl} onChange={e => setTvUrl(e.target.value)} className={inp} placeholder="https://www.tradingview.com/chart/..." />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-fatfx-border bg-fatfx-surface-subtle shrink-0">
          <button
            onClick={handleSave}
            disabled={!entryNum || !slNum || !tpNum}
            className="w-full py-2.5 bg-fatfx-teal-500 text-white text-sm font-bold rounded-xl hover:bg-fatfx-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-glow-teal"
          >
            <Save className="w-4 h-4" />
            Publish Signal
          </button>
        </div>
      </div>
    </div>
  );
};
