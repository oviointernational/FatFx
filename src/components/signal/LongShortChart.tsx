import React from 'react';
import { Signal } from '../../types/signal';
import { formatPrice } from '../../utils/formatters';
import clsx from 'clsx';

interface LongShortChartProps {
  signal: Signal;
}

export const LongShortChart: React.FC<LongShortChartProps> = ({ signal }) => {
  const { type, priceLevels } = signal;
  const { entryPrice, stopLoss, takeProfit } = priceLevels;
  const isBuy = type === 'BUY';

  const riskSize = Math.abs(entryPrice - stopLoss);
  const rewardSize = Math.abs(takeProfit - entryPrice);
  const total = riskSize + rewardSize || 1;

  const riskFlex = (riskSize / total) * 100;
  const rewardFlex = (rewardSize / total) * 100;

  const fp = (p: number) => formatPrice(p);

  return (
    <div className="flex flex-col h-full bg-fatfx-dark-800 rounded-2xl overflow-hidden shadow-none border border-white/5">
      {/* Chart header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm font-mono">{signal.asset}</span>
          <span
            className={clsx(
              'text-xs font-bold px-2 py-0.5 rounded-lg text-white',
              isBuy ? 'bg-[#0E9F6E]' : 'bg-[#E02424]'
            )}
          >
            {isBuy ? '▲ LONG' : '▼ SHORT'}
          </span>
          <span className="text-[10px] text-white/50 font-mono">{signal.timeframe}</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase tracking-wide">Risk:Reward</p>
          <p className="text-sm font-bold text-fatfx-teal-400 font-mono">
            1:{priceLevels.riskRewardRatio.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Chart body */}
      <div className="flex-1 flex p-4 gap-3 min-h-0">
        {/* Main interactive chart container with aligned Left Prices, Center Bars, and Right Labels */}
        <div className="flex-1 flex gap-3 h-full min-h-0">
          {/* Left Price Axis — Aligned with the respective zones & blue paint */}
          <div className="flex flex-col w-20 shrink-0 select-none">
            {isBuy ? (
              <>
                {/* Top of Take Profit Zone */}
                <div style={{ flex: rewardFlex }} className="flex flex-col justify-between items-end pb-1">
                  <span className="text-[11px] font-mono text-green-400 font-semibold">{fp(takeProfit)}</span>
                </div>
                {/* Aligned with Blue Paint Entry */}
                <div className="h-8 shrink-0 flex items-center justify-end">
                  <span className="text-[11px] font-mono text-blue-400 font-bold">{fp(entryPrice)}</span>
                </div>
                {/* Bottom of Stop Loss Zone */}
                <div style={{ flex: riskFlex }} className="flex flex-col justify-end items-end pt-1">
                  <span className="text-[11px] font-mono text-red-400 font-semibold">{fp(stopLoss)}</span>
                </div>
              </>
            ) : (
              <>
                {/* Top of Stop Loss Zone */}
                <div style={{ flex: riskFlex }} className="flex flex-col justify-between items-end pb-1">
                  <span className="text-[11px] font-mono text-red-400 font-semibold">{fp(stopLoss)}</span>
                </div>
                {/* Aligned with Blue Paint Entry */}
                <div className="h-8 shrink-0 flex items-center justify-end">
                  <span className="text-[11px] font-mono text-blue-400 font-bold">{fp(entryPrice)}</span>
                </div>
                {/* Bottom of Take Profit Zone */}
                <div style={{ flex: rewardFlex }} className="flex flex-col justify-end items-end pt-1">
                  <span className="text-[11px] font-mono text-green-400 font-semibold">{fp(takeProfit)}</span>
                </div>
              </>
            )}
          </div>

          {/* Central Long/Short Structure Bars */}
          <div className="flex-1 flex flex-col relative rounded-xl overflow-hidden select-none">
            {isBuy ? (
              <>
                {/* Take Profit (Reward) Zone — Green */}
                <div className="relative flex items-center justify-center min-h-[40px]" style={{ flex: rewardFlex }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-green-500/35 to-green-500/15 border border-green-500/30" />
                  <span className="relative text-[10px] font-bold text-green-400 uppercase tracking-widest z-10">
                    Take Profit
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-blue-400/60" />
                </div>

                {/* Blue Paint Entry Line — Centered BUY text with left blue dot */}
                <div className="relative h-8 shrink-0 flex items-center z-10">
                  <div className="absolute inset-0 bg-blue-500/20 border-y border-blue-400/60" />

                  {/* Blue glowing dot on the left */}
                  <div className="absolute left-3.5 flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_3px_rgba(96,165,250,0.7)]" />
                  </div>

                  {/* Centered BUY label (no @ price) */}
                  <div className="w-full flex items-center justify-center">
                    <span className="text-[11px] font-bold text-blue-300 uppercase tracking-widest">
                      BUY
                    </span>
                  </div>
                </div>

                {/* Stop Loss (Risk) Zone — Red */}
                <div className="relative flex items-center justify-center min-h-[40px]" style={{ flex: riskFlex }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/15 to-red-500/35 border border-red-500/30" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-red-400/40" />
                  <span className="relative text-[10px] font-bold text-red-400 uppercase tracking-widest z-10">
                    Stop Loss
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Stop Loss (Risk) Zone — Red (top for short) */}
                <div className="relative flex items-center justify-center min-h-[40px]" style={{ flex: riskFlex }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/35 to-red-500/15 border border-red-500/30" />
                  <span className="relative text-[10px] font-bold text-red-400 uppercase tracking-widest z-10">
                    Stop Loss
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-blue-400/60" />
                </div>

                {/* Blue Paint Entry Line — Centered SELL text with left blue dot */}
                <div className="relative h-8 shrink-0 flex items-center z-10">
                  <div className="absolute inset-0 bg-blue-500/20 border-y border-blue-400/60" />

                  {/* Blue glowing dot on the left */}
                  <div className="absolute left-3.5 flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_3px_rgba(96,165,250,0.7)]" />
                  </div>

                  {/* Centered SELL label (no @ price) */}
                  <div className="w-full flex items-center justify-center">
                    <span className="text-[11px] font-bold text-blue-300 uppercase tracking-widest">
                      SELL
                    </span>
                  </div>
                </div>

                {/* Take Profit (Reward) Zone — Green (bottom for short) */}
                <div className="relative flex items-center justify-center min-h-[40px]" style={{ flex: rewardFlex }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-green-500/15 to-green-500/35 border border-green-500/30" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-green-400/40" />
                  <span className="relative text-[10px] font-bold text-green-400 uppercase tracking-widest z-10">
                    Take Profit
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right Labels Axis — Aligned directly with TP, Blue Paint (BUY/SELL), and SL */}
          <div className="flex flex-col w-12 shrink-0 select-none">
            {isBuy ? (
              <>
                {/* TP Label aligned with Take Profit zone */}
                <div style={{ flex: rewardFlex }} className="flex items-center pl-1">
                  <span className="text-[10px] font-bold text-green-400/80 uppercase">TP</span>
                </div>
                {/* BUY Label aligned directly at the right side point of the blue paint */}
                <div className="h-8 shrink-0 flex items-center pl-1">
                  <span className="text-[11px] font-bold text-blue-400 uppercase">BUY</span>
                </div>
                {/* SL Label aligned with Stop Loss zone */}
                <div style={{ flex: riskFlex }} className="flex items-center pl-1">
                  <span className="text-[10px] font-bold text-red-400/80 uppercase">SL</span>
                </div>
              </>
            ) : (
              <>
                {/* SL Label aligned with Stop Loss zone */}
                <div style={{ flex: riskFlex }} className="flex items-center pl-1">
                  <span className="text-[10px] font-bold text-red-400/80 uppercase">SL</span>
                </div>
                {/* SELL Label aligned directly at the right side point of the blue paint */}
                <div className="h-8 shrink-0 flex items-center pl-1">
                  <span className="text-[11px] font-bold text-blue-400 uppercase">SELL</span>
                </div>
                {/* TP Label aligned with Take Profit zone */}
                <div style={{ flex: rewardFlex }} className="flex items-center pl-1">
                  <span className="text-[10px] font-bold text-green-400/80 uppercase">TP</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="px-4 py-2.5 border-t border-white/10 bg-fatfx-dark-900 grid grid-cols-4 gap-2 shrink-0">
        <div className="text-center">
          <p className="text-[9px] text-white/40 uppercase tracking-wide">SL Pips</p>
          <p className="text-xs font-bold text-red-400 font-mono">{priceLevels.slPips?.toFixed(0) ?? '—'}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/40 uppercase tracking-wide">TP Pips</p>
          <p className="text-xs font-bold text-green-400 font-mono">{priceLevels.tpPips?.toFixed(0) ?? '—'}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/40 uppercase tracking-wide">R:R</p>
          <p className="text-xs font-bold text-fatfx-teal-400 font-mono">1:{priceLevels.riskRewardRatio.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/40 uppercase tracking-wide">TF</p>
          <p className="text-xs font-bold text-white/80 font-mono">{signal.timeframe}</p>
        </div>
      </div>
    </div>
  );
};
