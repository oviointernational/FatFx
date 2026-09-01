export type SignalType = 'BUY' | 'SELL';
export type SignalStatus = 'ACTIVE' | 'HIT_TP' | 'HIT_SL' | 'CLOSED' | 'CANCELLED';

export interface PriceLevels {
  entryPrice: number;    // Where red ends and green starts (Buy/Sell Price)
  stopLoss: number;      // Bottom of long box / Top of short box
  takeProfit: number;    // End of green box
  currentPrice?: number;
  tpPips?: number;
  slPips?: number;
  riskRewardRatio: number; // e.g. 3.5 (meaning 1:3.5)
}

export interface SignalShareRecord {
  recipientUsername: string;
  sharedAt: string;
}

export interface Signal {
  id: string;
  authorId: string;
  authorUsername: string;
  asset: string;             // e.g. "XAUUSD", "EURUSD", "GBPUSD", "US30"
  type: SignalType;          // 'BUY' | 'SELL'
  status: SignalStatus;
  timeframe: string;         // e.g. "15M", "1H", "4H", "1D"
  year: number;              // e.g. 2026
  month: number;             // 0-11 (Jan=0, Dec=11)
  date: string;              // YYYY-MM-DD
  time: string;              // HH:mm
  priceLevels: PriceLevels;
  notes?: string;
  strategy?: string;         // e.g. "ICT FVG + Liquidity Sweep"
  tradingViewUrl?: string;
  sharedWith: SignalShareRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface SignalFilter {
  year: number;
  month?: number;
  asset?: string;
  type?: SignalType;
  status?: SignalStatus;
}

export type CreateSignalPayload = Omit<Signal, 'id' | 'createdAt' | 'updatedAt'>;
