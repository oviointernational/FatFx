import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle2, TrendingUp, TrendingDown, Image, AlertCircle, Sparkles } from 'lucide-react';
import { JournalEntry, TradeDirection, MarketCondition, EmotionalState, PublishStatus } from '../../types/journal';
import { useJournal } from '../../context/JournalContext';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEntry?: JournalEntry | null;
  defaultDate?: string;
}

const ASSET_TICKERS = [
  'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD',
  'NZDUSD', 'USDCHF', 'EURGBP', 'EURJPY', 'GBPJPY',
  'US30', 'NAS100', 'US500', 'BTCUSD', 'ETHUSD', 'Other'
];

const EMOTIONAL_STATES: { value: EmotionalState; label: string; emoji: string }[] = [
  { value: 'CALM', label: 'Calm & Centered', emoji: '😌' },
  { value: 'DISCIPLINED', label: 'Disciplined', emoji: '🎯' },
  { value: 'CONFIDENT', label: 'Confident', emoji: '💪' },
  { value: 'PATIENT', label: 'Patient', emoji: '⏳' },
  { value: 'NEUTRAL', label: 'Neutral', emoji: '😐' },
  { value: 'ANXIOUS', label: 'Anxious', emoji: '😰' },
  { value: 'FEARFUL', label: 'Fearful / Hesitant', emoji: '😨' },
  { value: 'GREEDY', label: 'Greedy / FOMO', emoji: '🤑' },
  { value: 'IMPULSIVE', label: 'Impulsive', emoji: '⚡' },
  { value: 'FRUSTRATED', label: 'Frustrated / Revenge', emoji: '😤' },
];

const MARKET_CONDITIONS: { value: MarketCondition; label: string }[] = [
  { value: 'TREND', label: 'Trending Market' },
  { value: 'RANGE', label: 'Range-Bound / Consolidating' },
  { value: 'VOLATILE', label: 'High Volatility / News Event' },
  { value: 'OTHER', label: 'Other' },
];

export const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, editEntry, defaultDate }) => {
  const { addJournal, updateJournal, publishJournal, capitalConfigs } = useJournal();
  const { currentUser } = useAuth();

  const today = defaultDate || new Date().toISOString().split('T')[0];

  const getDefaultCapital = (dateStr: string) => {
    const d = new Date(dateStr);
    const config = capitalConfigs.find(c => c.year === d.getFullYear() && c.month === d.getMonth());
    return config ? config.capital : 10000;
  };

  // Phase 1 (Entry / Draft) Form State
  const [currency, setCurrency] = useState('XAUUSD');
  const [customCurrency, setCustomCurrency] = useState('');
  const [monthlyStartBalance, setMonthlyStartBalance] = useState(getDefaultCapital(today));
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('09:00');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [strategy, setStrategy] = useState('');
  const [positionSize, setPositionSize] = useState<number>(0.1);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLossLevel, setStopLossLevel] = useState<number>(0);
  const [takeProfitLevel, setTakeProfitLevel] = useState<number>(0);
  const [fees, setFees] = useState<number>(0);
  const [marketCondition, setMarketCondition] = useState<MarketCondition>('TREND');
  const [setupScreenshotUrl, setSetupScreenshotUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Phase 2 (Outcome / Publish) Form State
  const [isPublishSectionOpen, setIsPublishSectionOpen] = useState(false);
  const [exitPrice, setExitPrice] = useState<string>('');
  const [netPnL, setNetPnL] = useState<string>('');
  const [rMultiple, setRMultiple] = useState<string>('');
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('CALM');
  const [ruleCompliance, setRuleCompliance] = useState<number>(10);
  const [mistakesMade, setMistakesMade] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (editEntry) {
      setCurrency(ASSET_TICKERS.includes(editEntry.currency) ? editEntry.currency : 'Other');
      setCustomCurrency(ASSET_TICKERS.includes(editEntry.currency) ? '' : editEntry.currency);
      setMonthlyStartBalance(editEntry.monthlyStartBalance);
      setDate(editEntry.date);
      setTime(editEntry.time || '09:00');
      setDirection(editEntry.direction || (editEntry.positionType === 'SELL' ? 'SHORT' : 'LONG'));
      setStrategy(editEntry.strategy || '');
      setPositionSize(editEntry.positionSize || 0.1);
      setEntryPrice(editEntry.entryPrice || 0);
      setStopLossLevel(editEntry.stopLossLevel || 0);
      setTakeProfitLevel(editEntry.takeProfitLevel || 0);
      setFees(editEntry.fees || editEntry.commissions || 0);
      setMarketCondition(editEntry.marketCondition || 'TREND');
      setSetupScreenshotUrl(editEntry.setupScreenshotUrl || editEntry.tradingViewUrl || '');
      setNotes(editEntry.notes || '');

      // Phase 2
      if (editEntry.publishStatus === 'PUBLISHED' || editEntry.netPnL !== undefined || editEntry.exitPrice !== undefined) {
        setIsPublishSectionOpen(true);
        setExitPrice(editEntry.exitPrice !== undefined ? editEntry.exitPrice.toString() : '');
        setNetPnL(editEntry.netPnL !== undefined ? editEntry.netPnL.toString() : (editEntry.totalProfit !== undefined ? editEntry.totalProfit.toString() : ''));
        setRMultiple(editEntry.rMultiple !== undefined ? editEntry.rMultiple.toString() : '');
        setEmotionalState(editEntry.emotionalState || 'CALM');
        setRuleCompliance(editEntry.ruleCompliance !== undefined ? editEntry.ruleCompliance : 10);
        setMistakesMade(editEntry.mistakesMade || '');
      } else {
        setIsPublishSectionOpen(false);
        setExitPrice('');
        setNetPnL('');
        setRMultiple('');
        setEmotionalState('CALM');
        setRuleCompliance(10);
        setMistakesMade('');
      }
    } else {
      setCurrency('XAUUSD');
      setCustomCurrency('');
      setMonthlyStartBalance(getDefaultCapital(today));
      setDate(today);
      setTime('09:00');
      setDirection('LONG');
      setStrategy('');
      setPositionSize(0.1);
      setEntryPrice(0);
      setStopLossLevel(0);
      setTakeProfitLevel(0);
      setFees(0);
      setMarketCondition('TREND');
      setSetupScreenshotUrl('');
      setNotes('');

      setIsPublishSectionOpen(false);
      setExitPrice('');
      setNetPnL('');
      setRMultiple('');
      setEmotionalState('CALM');
      setRuleCompliance(10);
      setMistakesMade('');
    }
    setError('');
  }, [editEntry, isOpen]);

  // Auto calculate R-Multiple when entry, exit, and SL are populated
  useEffect(() => {
    const numEntry = Number(entryPrice);
    const numSl = Number(stopLossLevel);
    const numExit = parseFloat(exitPrice);

    if (numEntry > 0 && numSl > 0 && !isNaN(numExit) && numExit > 0) {
      const risk = Math.abs(numEntry - numSl);
      if (risk > 0) {
        const reward = direction === 'LONG' ? (numExit - numEntry) : (numEntry - numExit);
        const calculatedR = (reward / risk).toFixed(2);
        if (!rMultiple || rMultiple === '0') {
          setRMultiple(calculatedR);
        }
      }
    }
  }, [entryPrice, stopLossLevel, exitPrice, direction]);

  if (!isOpen) return null;
  if (!currentUser) return null;

  const handleSaveDraft = async () => {
    const finalCurrency = currency === 'Other' ? customCurrency.toUpperCase().trim() : currency;
    if (!finalCurrency) {
      setError('Please select or specify an asset ticker');
      return;
    }

    const payload = {
      userId: currentUser.id,
      authorUsername: currentUser.username,
      currency: finalCurrency,
      monthlyStartBalance,
      date,
      time,
      direction,
      strategy: strategy.trim(),
      positionSize: Number(positionSize) || 0.01,
      entryPrice: Number(entryPrice) || 0,
      stopLossLevel: Number(stopLossLevel) || 0,
      takeProfitLevel: Number(takeProfitLevel) || 0,
      fees: Number(fees) || 0,
      marketCondition,
      setupScreenshotUrl: setupScreenshotUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      publishStatus: 'DRAFT' as PublishStatus,
      // Optional draft exit if user partially filled
      exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
      netPnL: netPnL ? parseFloat(netPnL) : undefined,
      rMultiple: rMultiple ? parseFloat(rMultiple) : undefined,
      emotionalState: emotionalState || undefined,
      ruleCompliance: Number(ruleCompliance) || undefined,
      mistakesMade: mistakesMade.trim() || undefined,
    };

    if (editEntry) {
      updateJournal(editEntry.id, payload);
    } else {
      await addJournal(payload);
    }
    onClose();
  };

  const handlePublish = async () => {
    const finalCurrency = currency === 'Other' ? customCurrency.toUpperCase().trim() : currency;
    if (!finalCurrency) {
      setError('Please select or specify an asset ticker');
      return;
    }

    if (netPnL === '' || isNaN(parseFloat(netPnL))) {
      setError('Net Profit/Loss is required to publish this trade.');
      return;
    }

    const parsedExit = exitPrice ? parseFloat(exitPrice) : Number(entryPrice);
    const parsedPnL = parseFloat(netPnL);
    const parsedR = rMultiple ? parseFloat(rMultiple) : 0;

    const basePayload = {
      userId: currentUser.id,
      authorUsername: currentUser.username,
      currency: finalCurrency,
      monthlyStartBalance,
      date,
      time,
      direction,
      strategy: strategy.trim(),
      positionSize: Number(positionSize) || 0.01,
      entryPrice: Number(entryPrice) || 0,
      stopLossLevel: Number(stopLossLevel) || 0,
      takeProfitLevel: Number(takeProfitLevel) || 0,
      fees: Number(fees) || 0,
      marketCondition,
      setupScreenshotUrl: setupScreenshotUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      exitPrice: parsedExit,
      netPnL: parsedPnL,
      rMultiple: parsedR,
      emotionalState,
      ruleCompliance: Number(ruleCompliance),
      mistakesMade: mistakesMade.trim() || undefined,
      publishStatus: 'PUBLISHED' as PublishStatus,
      result: parsedPnL > 0 ? 'WIN' : parsedPnL < 0 ? 'LOSS' : 'BE',
      totalProfit: parsedPnL,
      grossProfitLoss: parsedPnL + Number(fees),
    };

    if (editEntry) {
      await publishJournal(editEntry.id, {
        exitPrice: parsedExit,
        netPnL: parsedPnL,
        rMultiple: parsedR,
        emotionalState,
        ruleCompliance: Number(ruleCompliance),
        mistakesMade: mistakesMade.trim() || undefined,
      });
      updateJournal(editEntry.id, basePayload as any);
    } else {
      await addJournal(basePayload as any);
    }
    onClose();
  };

  const inp = "w-full px-3 py-2 text-sm rounded-xl border border-fatfx-border bg-white focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400 focus:border-transparent transition-all";
  const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl border border-fatfx-border max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-fatfx-border bg-fatfx-surface-subtle shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-slate-900">
                {editEntry ? 'Edit Trading Journal' : 'Log Trade Entry'}
              </p>
              {editEntry?.publishStatus === 'PUBLISHED' ? (
                <span className="text-[10px] bg-fatfx-win-bg text-fatfx-win-text font-bold px-2 py-0.5 rounded-full border border-fatfx-win-border">
                  PUBLISHED
                </span>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  DRAFT / IN-PLAY
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Save execution details during the trade, then publish outcome when closed.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PHASE 1: TRADE EXECUTION (SAVED AS DRAFT)                     */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-2 h-2 rounded-full bg-fatfx-teal-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Phase 1: Trade Setup & Execution
              </h3>
            </div>

            {/* Row 1: Date, Time & Asset Ticker */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label required>Execution Date</Label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
              </div>
              <div>
                <Label required>Execution Time</Label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inp} />
              </div>
              <div>
                <Label required>Asset Ticker</Label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={inp}>
                  {ASSET_TICKERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {currency === 'Other' && (
                  <input
                    type="text"
                    placeholder="e.g. USDMXN"
                    value={customCurrency}
                    onChange={e => setCustomCurrency(e.target.value)}
                    className={`${inp} mt-2`}
                  />
                )}
              </div>
            </div>

            {/* Row 2: Direction, Strategy, Position Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label required>Direction</Label>
                <div className="flex rounded-xl overflow-hidden border border-fatfx-border">
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    className={clsx(
                      'flex-1 py-2 text-xs font-bold transition-all',
                      direction === 'LONG'
                        ? 'bg-fatfx-win-solid text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-fatfx-win-bg'
                    )}
                  >
                    LONG / BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    className={clsx(
                      'flex-1 py-2 text-xs font-bold transition-all',
                      direction === 'SHORT'
                        ? 'bg-fatfx-loss-solid text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-fatfx-loss-bg'
                    )}
                  >
                    SHORT / SELL
                  </button>
                </div>
              </div>

              <div>
                <Label required>Strategy / Setup Name</Label>
                <input
                  type="text"
                  placeholder="e.g. ICT FVG + Liquidity Sweep"
                  value={strategy}
                  onChange={e => setStrategy(e.target.value)}
                  className={inp}
                />
              </div>

              <div>
                <Label required>Position Size (Lots/Contracts)</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={positionSize}
                  onChange={e => setPositionSize(parseFloat(e.target.value) || 0)}
                  className={inp}
                />
              </div>
            </div>

            {/* Row 3: Entry Price, Stop Loss, Take Profit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label required>Entry Price</Label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder="e.g. 2650.50"
                  value={entryPrice || ''}
                  onChange={e => setEntryPrice(parseFloat(e.target.value) || 0)}
                  className={inp}
                />
              </div>
              <div>
                <Label required>Stop-Loss Level</Label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder="e.g. 2640.00"
                  value={stopLossLevel || ''}
                  onChange={e => setStopLossLevel(parseFloat(e.target.value) || 0)}
                  className={inp}
                />
              </div>
              <div>
                <Label required>Take-Profit Level</Label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder="e.g. 2680.00"
                  value={takeProfitLevel || ''}
                  onChange={e => setTakeProfitLevel(parseFloat(e.target.value) || 0)}
                  className={inp}
                />
              </div>
            </div>

            {/* Row 4: Fees, Market Condition, Starting Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Fees (Commissions & Slippage $)</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={fees}
                  onChange={e => setFees(parseFloat(e.target.value) || 0)}
                  className={inp}
                />
              </div>
              <div>
                <Label>Market Condition</Label>
                <select
                  value={marketCondition}
                  onChange={e => setMarketCondition(e.target.value as MarketCondition)}
                  className={inp}
                >
                  {MARKET_CONDITIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Monthly Start Balance ($)</Label>
                <input
                  type="number"
                  step="100"
                  value={monthlyStartBalance}
                  onChange={e => setMonthlyStartBalance(parseFloat(e.target.value) || 10000)}
                  className={inp}
                />
              </div>
            </div>

            {/* Row 5: Screenshot URL & Notes */}
            <div>
              <Label>Setup Screenshot / TradingView Chart URL</Label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://www.tradingview.com/x/..."
                  value={setupScreenshotUrl}
                  onChange={e => setSetupScreenshotUrl(e.target.value)}
                  className={`${inp} pl-9`}
                />
              </div>
            </div>

            <div>
              <Label>Trade Plan / Confluences</Label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What was the catalyst? HTF bias, key support/resistance zones, session context..."
                rows={2}
                className={`${inp} resize-none`}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PHASE 2: OUTCOME & PUBLISHING (AFTER TRADE PLAYS OUT)           */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Phase 2: Trade Outcome & Publish
                </h3>
              </div>
              {!isPublishSectionOpen && (
                <button
                  type="button"
                  onClick={() => setIsPublishSectionOpen(true)}
                  className="text-xs text-fatfx-teal-600 font-semibold hover:underline"
                >
                  + Add Outcome & Publish Now
                </button>
              )}
            </div>

            {isPublishSectionOpen && (
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-fatfx-border space-y-4 animate-in fade-in duration-150">
                <p className="text-xs text-slate-600">
                  Fill in your closing metrics to publish. Once published, your calendar day turns 
                  <strong className="text-fatfx-win-text"> Green</strong> (profit) or 
                  <strong className="text-fatfx-loss-text"> Red</strong> (loss).
                </p>

                {/* Outcome Metrics: Exit Price, Net P/L, R-Multiple */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label required>Exit Price (Fill Level)</Label>
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="e.g. 2675.00"
                      value={exitPrice}
                      onChange={e => setExitPrice(e.target.value)}
                      className={inp}
                    />
                  </div>

                  <div>
                    <Label required>Net Profit / Loss ($ Final Outcome)</Label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 450.00 or -150.00"
                      value={netPnL}
                      onChange={e => setNetPnL(e.target.value)}
                      className={clsx(
                        inp,
                        netPnL && parseFloat(netPnL) > 0 && 'border-fatfx-win-border text-fatfx-win-text font-bold',
                        netPnL && parseFloat(netPnL) < 0 && 'border-fatfx-loss-border text-fatfx-loss-text font-bold'
                      )}
                    />
                  </div>

                  <div>
                    <Label>R-Multiple Achieved (R)</Label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 2.5"
                      value={rMultiple}
                      onChange={e => setRMultiple(e.target.value)}
                      className={inp}
                    />
                  </div>
                </div>

                {/* Emotional State (Dropdown of 10) & Rule Compliance (0-10) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label required>Emotional State During Trade</Label>
                    <select
                      value={emotionalState}
                      onChange={e => setEmotionalState(e.target.value as EmotionalState)}
                      className={inp}
                    >
                      {EMOTIONAL_STATES.map(st => (
                        <option key={st.value} value={st.value}>
                          {st.emoji} {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label required>Rule Compliance (Discipline Metric)</Label>
                      <span className="text-xs font-bold font-mono text-fatfx-teal-700 bg-fatfx-teal-100 px-2 py-0.5 rounded-md">
                        {ruleCompliance} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={ruleCompliance}
                      onChange={e => setRuleCompliance(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-fatfx-teal-500 mt-2"
                    />
                  </div>
                </div>

                {/* Mistakes Made / Deviations */}
                <div>
                  <Label>Mistakes Made / Deviations from Plan</Label>
                  <textarea
                    value={mistakesMade}
                    onChange={e => setMistakesMade(e.target.value)}
                    placeholder="e.g. Moved SL too early, took early profit before TP, traded outside session hours..."
                    rows={2}
                    className={`${inp} resize-none`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-5 py-3.5 border-t border-fatfx-border bg-fatfx-surface-subtle flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft (Grey on Calendar)
          </button>

          <button
            type="button"
            onClick={isPublishSectionOpen ? handlePublish : () => setIsPublishSectionOpen(true)}
            className="flex-1 max-w-xs py-2.5 bg-fatfx-teal-500 hover:bg-fatfx-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-glow-teal flex items-center justify-center gap-2 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isPublishSectionOpen ? 'Publish Trade (Color Calendar)' : 'Add Outcome & Publish'}
          </button>
        </div>

      </div>
    </div>
  );
};
