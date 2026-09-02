import { JournalEntry, MonthSummary, DayJournalSummary, MonthCapitalConfig } from '../types/journal';
import { MONTH_NAMES, getDaysInMonth, formatDateString, parseDateString } from '../utils/formatters';

export const calculateJournalMetrics = (
  entries: JournalEntry[],
  year: number,
  capitalConfigs: MonthCapitalConfig[]
): MonthSummary[] => {
  const summaries: MonthSummary[] = [];

  for (let m = 0; m < 12; m++) {
    const daysInMonth = getDaysInMonth(year, m);
    
    // Find capital configuration for this year/month or default to $10,000
    const config = capitalConfigs.find(c => c.year === year && c.month === m);
    const startCapital = config ? config.capital : 10000;

    // Filter entries belonging to this month and year
    const monthEntries = entries.filter(e => {
      const parsed = parseDateString(e.date);
      return parsed.year === year && parsed.month === m;
    });

    let monthNetPnL = 0;
    let winCount = 0;
    let lossCount = 0;
    let beCount = 0;

    const days: DayJournalSummary[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateString(year, m, d);
      const dayTrades = monthEntries.filter(e => e.date === dateStr);

      const publishedTrades = dayTrades.filter(e => e.publishStatus === 'PUBLISHED');
      const draftTrades = dayTrades.filter(e => e.publishStatus !== 'PUBLISHED');

      let dayNetPnL = 0;
      let dayWins = 0;
      let dayLosses = 0;
      let dayBE = 0;

      // Only published trades contribute to actual PnL outcome
      publishedTrades.forEach(trade => {
        const pnl = trade.netPnL !== undefined ? trade.netPnL : (trade.totalProfit ?? 0);
        dayNetPnL += pnl;
        if (pnl > 0) dayWins++;
        else if (pnl < 0) dayLosses++;
        else dayBE++;
      });

      monthNetPnL += dayNetPnL;
      winCount += dayWins;
      lossCount += dayLosses;
      beCount += dayBE;

      let publishStatus: 'NONE' | 'DRAFT' | 'PUBLISHED' = 'NONE';
      let status: 'NONE' | 'WIN' | 'LOSS' | 'BE' = 'NONE';

      if (dayTrades.length === 0) {
        publishStatus = 'NONE';
        status = 'NONE';
      } else if (publishedTrades.length > 0) {
        publishStatus = 'PUBLISHED';
        if (dayNetPnL > 0) {
          status = 'WIN';
        } else if (dayNetPnL < 0) {
          status = 'LOSS';
        } else {
          status = 'BE';
        }
      } else {
        // Only draft trades exist on this day
        publishStatus = 'DRAFT';
        status = 'NONE';
      }

      days.push({
        date: dateStr,
        dayNumber: d,
        totalTrades: dayTrades.length,
        winTrades: dayWins,
        lossTrades: dayLosses,
        beTrades: dayBE,
        netPnL: dayNetPnL,
        publishStatus,
        hasDraft: draftTrades.length > 0,
        hasPublished: publishedTrades.length > 0,
        status,
        entries: dayTrades,
      });
    }

    const gainPercentage = startCapital > 0 ? (monthNetPnL / startCapital) * 100 : 0;

    summaries.push({
      monthIndex: m,
      monthName: MONTH_NAMES[m],
      capital: startCapital,
      netPnL: monthNetPnL,
      gainPercentage,
      winCount,
      lossCount,
      totalTrades: monthEntries.length,
      days,
    });
  }

  return summaries;
};

export const calculateRR = (entry: number, sl: number, tp: number, isBuy: boolean): number => {
  if (isBuy) {
    const risk = entry - sl;
    const reward = tp - entry;
    if (risk <= 0) return 0;
    return parseFloat((reward / risk).toFixed(2));
  } else {
    const risk = sl - entry;
    const reward = entry - tp;
    if (risk <= 0) return 0;
    return parseFloat((reward / risk).toFixed(2));
  }
};
