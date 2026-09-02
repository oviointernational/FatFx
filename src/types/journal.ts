export type PositionType = 'BUY' | 'SELL';
export type TradeDirection = 'LONG' | 'SHORT';
export type TradeResult = 'WIN' | 'LOSS' | 'BE';
export type MarketCondition = 'TREND' | 'RANGE' | 'VOLATILE' | 'OTHER';
export type EmotionalState =
  | 'CALM'
  | 'GREEDY'
  | 'FEARFUL'
  | 'CONFIDENT'
  | 'ANXIOUS'
  | 'IMPULSIVE'
  | 'PATIENT'
  | 'FRUSTRATED'
  | 'NEUTRAL'
  | 'DISCIPLINED';

export type PublishStatus = 'DRAFT' | 'PUBLISHED';

export interface PushShareRecord {
  sharedWithUsername: string;
  sharedAt: string; // ISO date
  sharedByUsername: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  authorUsername: string;

  // ── Phase 1 Fields (required to Save as Draft) ──────────────────────────
  currency: string;             // Asset ticker: e.g. "EURUSD", "XAUUSD"
  monthlyStartBalance: number;  // Account starting balance for the month
  date: string;                 // YYYY-MM-DD (execution date)
  time: string;                 // HH:mm (execution time)
  direction: TradeDirection;    // LONG or SHORT
  strategy: string;             // Setup name / strategy used
  positionSize: number;         // Lots / contracts
  entryPrice: number;           // Exact fill level
  stopLossLevel: number;        // Initial stop-loss price
  takeProfitLevel: number;      // Initial take-profit price
  fees: number;                 // Commissions + slippage ($)
  marketCondition: MarketCondition;  // TREND, RANGE, VOLATILE, OTHER
  setupScreenshotUrl?: string;  // Chart URL (optional)
  notes?: string;               // Additional trade notes

  // ── Phase 2 Fields (added when publishing after trade plays out) ─────────
  exitPrice?: number;           // Actual closing level
  netPnL?: number;              // Final cash outcome ($) — drives calendar color
  rMultiple?: number;           // R-multiple achieved (e.g. 2.5 = 1:2.5 R)
  emotionalState?: EmotionalState;
  ruleCompliance?: number;      // 0–10 discipline score
  mistakesMade?: string;        // Deviations from plan

  // ── Status ───────────────────────────────────────────────────────────────
  publishStatus: PublishStatus; // DRAFT or PUBLISHED

  // ── Legacy / computed fields kept for backward compat ───────────────────
  positionType?: PositionType;  // Legacy BUY/SELL (mapped from direction)
  slPips?: number;              // Legacy SL pips
  result?: TradeResult;
  grossProfitLoss?: number;
  commissions?: number;
  totalProfit?: number;
  gainPercentage?: number;
  tradingViewUrl?: string;

  // ── Push sharing ─────────────────────────────────────────────────────────
  pushedTo?: PushShareRecord[];
  isPushed?: boolean;
  pushedBy?: string;
  pushedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface MonthCapitalConfig {
  year: number;
  month: number; // 0-11
  capital: number;
}

export interface DayJournalSummary {
  date: string;
  dayNumber: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  beTrades: number;
  netPnL: number;
  publishStatus: 'NONE' | 'DRAFT' | 'PUBLISHED'; // Determines calendar color
  hasDraft: boolean;       // Has at least one unpublished entry
  hasPublished: boolean;   // Has at least one published entry
  status: 'NONE' | 'WIN' | 'LOSS' | 'BE';
  entries: JournalEntry[];
}

export interface MonthSummary {
  monthIndex: number;
  monthName: string;
  capital: number;
  netPnL: number;
  gainPercentage: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  days: DayJournalSummary[];
}
