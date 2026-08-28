// engine/backtest.js
// Simule UN génome sur une série de bougies (long uniquement, tout ou rien).
// Le moteur lui-même ne change jamais : seul le génome passé en paramètre varie.

import { sma, ema, rsi, donchianHigh, donchianLow } from './indicators.js';

const FEE_PCT = 0.001; // 0,10 % par côté (entrée et sortie)

export function runBacktest(genome, candles, { recordEquityCurve = false, startCapital = 10000 } = {}) {
  const closes = candles.map((c) => c.close);
  const n = closes.length;

  const needsSma = genome.entryRule === 'sma_cross' || (genome.useExitSignal && genome.entryRule === 'sma_cross');
  const smaFastArr = needsSma ? sma(closes, genome.smaFast) : null;
  const smaSlowArr = needsSma ? sma(closes, genome.smaSlow) : null;
  const rsiArr = genome.entryRule === 'rsi_oversold' ? rsi(closes, genome.rsiPeriod) : null;
  const donHighArr = genome.entryRule === 'breakout' ? donchianHigh(closes, genome.breakoutPeriod) : null;
  const donLowArr = genome.entryRule === 'breakout' && genome.useExitSignal ? donchianLow(closes, genome.breakoutPeriod) : null;
  const emaArr = genome.entryRule === 'ema_trend' ? ema(closes, genome.emaPeriod) : null;

  let cash = startCapital;
  let btc = 0;
  let inPosition = false;
  let entryPrice = 0;
  let peakPrice = 0;
  let entryDate = null;
  let trades = 0;
  let wins = 0;

  const equityCurve = recordEquityCurve ? [] : null;
  const dailyReturns = [];
  let prevEquity = startCapital;
  let peakEquity = startCapital;
  let maxDrawdown = 0;

  function signalEntry(i) {
    switch (genome.entryRule) {
      case 'sma_cross':
        if (smaFastArr[i] == null || smaSlowArr[i] == null || smaFastArr[i - 1] == null || smaSlowArr[i - 1] == null) return false;
        return smaFastArr[i - 1] <= smaSlowArr[i - 1] && smaFastArr[i] > smaSlowArr[i];
      case 'rsi_oversold':
        if (rsiArr[i] == null || rsiArr[i - 1] == null) return false;
        return rsiArr[i - 1] <= genome.rsiThreshold && rsiArr[i] > genome.rsiThreshold;
      case 'breakout':
        if (donHighArr[i] == null) return false;
        return closes[i] > donHighArr[i];
      case 'ema_trend':
        if (emaArr[i] == null || emaArr[i - 1] == null) return false;
        return closes[i - 1] <= emaArr[i - 1] && closes[i] > emaArr[i];
      default:
        return false;
    }
  }

  function signalExit(i) {
    if (!genome.useExitSignal) return false;
    switch (genome.entryRule) {
      case 'sma_cross':
        if (smaFastArr[i] == null || smaSlowArr[i] == null) return false;
        return smaFastArr[i] < smaSlowArr[i];
      case 'rsi_oversold':
        if (rsiArr[i] == null) return false;
        return rsiArr[i] > 100 - genome.rsiThreshold;
      case 'breakout':
        if (donLowArr[i] == null) return false;
        return closes[i] < donLowArr[i];
      case 'ema_trend':
        if (emaArr[i] == null) return false;
        return closes[i] < emaArr[i];
      default:
        return false;
    }
  }

  for (let i = 1; i < n; i++) {
    const price = closes[i];

    if (inPosition) {
      peakPrice = Math.max(peakPrice, price);
      const changePct = ((price - entryPrice) / entryPrice) * 100;
      const dropFromPeakPct = ((peakPrice - price) / peakPrice) * 100;

      let shouldExit = false;
      if (changePct <= -genome.stopLossPct) shouldExit = true;
      if (genome.useTakeProfit && changePct >= genome.takeProfitPct) shouldExit = true;
      if (genome.useTrailingStop && dropFromPeakPct >= genome.trailingStopPct) shouldExit = true;
      if (signalExit(i)) shouldExit = true;

      if (shouldExit) {
        cash = btc * price * (1 - FEE_PCT);
        if (price > entryPrice) wins++;
        btc = 0;
        inPosition = false;
        trades++;
      }
    } else if (signalEntry(i)) {
      btc = (cash * (1 - FEE_PCT)) / price;
      cash = 0;
      entryPrice = price;
      peakPrice = price;
      if (!entryDate) entryDate = candles[i].date;
      inPosition = true;
    }

    const equity = inPosition ? btc * price : cash;
    if (equity > peakEquity) peakEquity = equity;
    const dd = ((peakEquity - equity) / peakEquity) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;

    if (prevEquity > 0) dailyReturns.push((equity - prevEquity) / prevEquity);
    prevEquity = equity;

    if (equityCurve) equityCurve.push({ date: candles[i].date, equity });
  }

  const finalEquity = inPosition ? btc * closes[n - 1] : cash;
  const totalReturnPct = ((finalEquity - startCapital) / startCapital) * 100;

  const meanRet = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
  const variance = dailyReturns.reduce((a, b) => a + (b - meanRet) ** 2, 0) / (dailyReturns.length || 1);
  const std = Math.sqrt(variance);
  const sharpe = std > 0 ? (meanRet / std) * Math.sqrt(365) : 0;

  const calmar = maxDrawdown > 0.01 ? totalReturnPct / maxDrawdown : totalReturnPct;
  const winRate = trades > 0 ? (wins / trades) * 100 : 0;

  return {
    entryDate: entryDate || candles[0].date,
    finalEquity: +finalEquity.toFixed(2),
    totalReturnPct: +totalReturnPct.toFixed(2),
    sharpe: +sharpe.toFixed(3),
    maxDrawdownPct: +maxDrawdown.toFixed(2),
    calmar: +calmar.toFixed(3),
    trades,
    winRate: +winRate.toFixed(1),
    equityCurve,
  };
}

export function buyAndHold(candles, { recordEquityCurve = false, startCapital = 10000 } = {}) {
  const first = candles[0].close;
  const last = candles[candles.length - 1].close;
  const totalReturnPct = ((last - first) / first) * 100;
  const equityCurve = recordEquityCurve
    ? candles.map((c) => ({ date: c.date, equity: (startCapital * c.close) / first }))
    : null;
  return { totalReturnPct: +totalReturnPct.toFixed(2), equityCurve };
}
