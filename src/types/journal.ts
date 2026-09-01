export type PositionType = 'BUY' | 'SELL';
export type TradeResult = 'WIN' | 'LOSS' | 'BE';

export interface PushShareRecord {
  sharedWithUsername: string;
  sharedAt: string; // ISO date
  sharedByUsername: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  authorUsername: string;
  currency: string;             // e.g. "EURUSD", "XAUUSD", "GBPUSD"
  monthlyStartBalance: number;  // Capital / Starting balance for the month
  date: string;                 // YYYY-MM-DD
  time?: string;                // HH:mm
  positionType: PositionType;   // BUY or SELL
  slPips: number;               // SL Pips
  result: TradeResult;          // WIN, LOSS, BE
  grossProfitLoss: number;      // Co Profit / Loss ($)
  commissions: number;          // Commissions ($)
  totalProfit: number;          // Net Total Profit ($ = Gross - Commissions)
  gainPercentage: number;       // Gain (% = (Total Profit / Start Balance) * 100)
  tradingViewUrl?: string;      // TradingView chart link
  notes?: string;               // Notes / Strategy / Confluences
  pushedTo?: PushShareRecord[]; // List of users pushed to
  isPushed?: boolean;           // If this was received via Push
  pushedBy?: string;            // Username of who pushed it
  pushedAt?: string;            // When it was pushed
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
