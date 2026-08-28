export type Bar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type EntryKind =
  | "sma_cross"
  | "ema_cross"
  | "rsi_oversold"
  | "breakout"
  | "macd"
  | "bb_bounce"
  | "trend_rsi";

export const ENTRY_LABEL: Record<EntryKind, string> = {
  sma_cross: "Croisement SMA",
  ema_cross: "Croisement EMA",
  rsi_oversold: "RSI survendu",
  breakout: "Cassage Donchian",
  macd: "MACD",
  bb_bounce: "Rebond Bollinger",
  trend_rsi: "Tendance + RSI",
};

export const ENTRY_KINDS: EntryKind[] = [
  "sma_cross",
  "ema_cross",
  "rsi_oversold",
  "breakout",
  "macd",
  "bb_bounce",
  "trend_rsi",
];

export type Genome = {
  id: string;
  gen: number;
  parentId: string | null;
  entry: EntryKind;
  fast: number;
  slow: number;
  rsiPeriod: number;
  rsiBuy: number;
  rsiSell: number;
  lookback: number;
  bbMult: number;
  stopLoss: number;
  takeProfit: number;
  trailing: number;
  maxHold: number;
  sizeFrac: number;
  confirmTrend: boolean;
};

export type Metrics = {
  finalEquity: number;
  totalReturn: number;
  cagr: number;
  sharpe: number;
  maxDd: number;
  trades: number;
  winRate: number;
  timeInMarket: number;
  fitness: number;
};

export type Individual = {
  genome: Genome;
  metrics: Metrics | null;
  equity: number[] | null;
  status: "alive" | "culled" | "newborn";
};

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ri(rng: Rng, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function rf(rng: Rng, min: number, max: number) {
  return min + rng() * (max - min);
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function uid(rng: Rng, gen: number) {
  const n = Math.floor(rng() * 1e9)
    .toString(36)
    .padStart(6, "0");
  return `G${gen}-${n}`;
}

function normalize(g: Genome): Genome {
  let fast = clamp(Math.round(g.fast), 3, 60);
  let slow = clamp(Math.round(g.slow), 10, 240);
  if (fast >= slow) slow = fast + 5;
  return {
    ...g,
    fast,
    slow,
    rsiPeriod: clamp(Math.round(g.rsiPeriod), 5, 32),
    rsiBuy: clamp(Math.round(g.rsiBuy), 10, 45),
    rsiSell: clamp(Math.round(g.rsiSell), 50, 90),
    lookback: clamp(Math.round(g.lookback), 8, 80),
    bbMult: clamp(+g.bbMult.toFixed(2), 1.2, 3.2),
    stopLoss: clamp(+g.stopLoss.toFixed(3), 0.02, 0.35),
    takeProfit: clamp(+g.takeProfit.toFixed(3), 0, 1.2),
    trailing: clamp(+g.trailing.toFixed(3), 0, 0.28),
    maxHold: clamp(Math.round(g.maxHold), 4, 500),
    sizeFrac: clamp(+g.sizeFrac.toFixed(2), 0.25, 1),
  };
}

export function randomGenome(rng: Rng, gen: number, parentId: string | null = null): Genome {
  const fast = ri(rng, 5, 30);
  return normalize({
    id: uid(rng, gen),
    gen,
    parentId,
    entry: pick(rng, ENTRY_KINDS),
    fast,
    slow: ri(rng, fast + 8, 180),
    rsiPeriod: ri(rng, 8, 21),
    rsiBuy: ri(rng, 18, 40),
    rsiSell: ri(rng, 60, 82),
    lookback: ri(rng, 12, 55),
    bbMult: rf(rng, 1.6, 2.6),
    stopLoss: rf(rng, 0.05, 0.18),
    takeProfit: rng() < 0.25 ? 0 : rf(rng, 0.12, 0.7),
    trailing: rng() < 0.4 ? 0 : rf(rng, 0.06, 0.18),
    maxHold: ri(rng, 12, 220),
    sizeFrac: rng() < 0.35 ? 1 : rf(rng, 0.4, 1),
    confirmTrend: rng() < 0.55,
  });
}

export function mutateGenome(rng: Rng, parent: Genome, gen: number): Genome {
  const g: Genome = { ...parent, id: uid(rng, gen), gen, parentId: parent.id };
  const rate = 0.28;
  if (rng() < 0.18) g.entry = pick(rng, ENTRY_KINDS);
  if (rng() < rate) g.fast += ri(rng, -6, 6);
  if (rng() < rate) g.slow += ri(rng, -16, 16);
  if (rng() < rate) g.rsiPeriod += ri(rng, -4, 4);
  if (rng() < rate) g.rsiBuy += ri(rng, -6, 6);
  if (rng() < rate) g.rsiSell += ri(rng, -6, 6);
  if (rng() < rate) g.lookback += ri(rng, -8, 8);
  if (rng() < rate) g.bbMult += rf(rng, -0.3, 0.3);
  if (rng() < rate) g.stopLoss *= rf(rng, 0.7, 1.35);
  if (rng() < rate) g.takeProfit = rng() < 0.15 ? 0 : g.takeProfit * rf(rng, 0.7, 1.4) || rf(rng, 0.12, 0.5);
  if (rng() < rate) g.trailing = rng() < 0.2 ? 0 : (g.trailing || 0.1) * rf(rng, 0.7, 1.35);
  if (rng() < rate) g.maxHold += ri(rng, -30, 40);
  if (rng() < rate) g.sizeFrac += rf(rng, -0.2, 0.2);
  if (rng() < 0.12) g.confirmTrend = !g.confirmTrend;
  return normalize(g);
}

export function crossover(rng: Rng, a: Genome, b: Genome, gen: number): Genome {
  const src = (x: Genome, y: Genome) => (rng() < 0.5 ? x : y);
  const mix = src(a, b);
  return normalize({
    id: uid(rng, gen),
    gen,
    parentId: a.id,
    entry: src(a, b).entry,
    fast: mix.fast,
    slow: src(a, b).slow,
    rsiPeriod: src(a, b).rsiPeriod,
    rsiBuy: src(a, b).rsiBuy,
    rsiSell: src(a, b).rsiSell,
    lookback: src(a, b).lookback,
    bbMult: (a.bbMult + b.bbMult) / 2,
    stopLoss: src(a, b).stopLoss,
    takeProfit: src(a, b).takeProfit,
    trailing: src(a, b).trailing,
    maxHold: src(a, b).maxHold,
    sizeFrac: (a.sizeFrac + b.sizeFrac) / 2,
    confirmTrend: src(a, b).confirmTrend,
  });
}

function sma(values: number[], period: number, i: number) {
  if (i + 1 < period) return NaN;
  let s = 0;
  for (let k = i - period + 1; k <= i; k++) s += values[k]!;
  return s / period;
}

function emaSeries(values: ArrayLike<number>, period: number) {
  const out = new Float64Array(values.length);
  const k = 2 / (period + 1);
  let prev = values[0]!;
  out[0] = prev;
  for (let i = 1; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

function rsiSeries(values: number[], period: number) {
  const out = new Float64Array(values.length);
  out[0] = 50;
  let avgG = 0;
  let avgL = 0;
  for (let i = 1; i <= period && i < values.length; i++) {
    const d = values[i]! - values[i - 1]!;
    if (d >= 0) avgG += d;
    else avgL -= d;
  }
  avgG /= period;
  avgL /= period;
  out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i]! - values[i - 1]!;
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

function stdev(values: number[], period: number, i: number, mean: number) {
  if (i + 1 < period) return NaN;
  let s = 0;
  for (let k = i - period + 1; k <= i; k++) {
    const d = values[k]! - mean;
    s += d * d;
  }
  return Math.sqrt(s / period);
}

const FEE = 0.001;
const START_EQUITY = 10_000;
const EQUITY_STEP = 8;

export function buyHoldEquity(bars: Bar[]): number[] {
  const p0 = bars[0]!.c;
  const out: number[] = [];
  for (let i = 0; i < bars.length; i += EQUITY_STEP) {
    out.push(START_EQUITY * (bars[i]!.c / p0));
  }
  const last = bars.length - 1;
  if (last % EQUITY_STEP !== 0) out.push(START_EQUITY * (bars[last]!.c / p0));
  return out;
}

export function buyHoldMetrics(bars: Bar[]): Metrics {
  const p0 = bars[0]!.c;
  const p1 = bars[bars.length - 1]!.c;
  const rets: number[] = [];
  for (let i = 1; i < bars.length; i++) rets.push(bars[i]!.c / bars[i - 1]!.c - 1);
  return scoreFromPath(
    START_EQUITY * (p1 / p0),
    rets,
    1,
    1,
    bars.length,
    bars.length,
  );
}

function scoreFromPath(
  finalEquity: number,
  dailyRets: number[],
  trades: number,
  wins: number,
  daysIn: number,
  nBars: number,
): Metrics {
  const totalReturn = finalEquity / START_EQUITY - 1;
  const years = nBars / 365.25;
  const cagr = years > 0 ? Math.pow(Math.max(finalEquity, 1) / START_EQUITY, 1 / years) - 1 : 0;
  let mean = 0;
  for (const r of dailyRets) mean += r;
  mean = dailyRets.length ? mean / dailyRets.length : 0;
  let v = 0;
  for (const r of dailyRets) {
    const d = r - mean;
    v += d * d;
  }
  const sd = dailyRets.length > 2 ? Math.sqrt(v / (dailyRets.length - 1)) : 0;
  const sharpe = sd > 1e-12 ? (mean / sd) * Math.sqrt(365) : 0;
  let peak = START_EQUITY;
  let eq = START_EQUITY;
  let maxDd = 0;
  for (const r of dailyRets) {
    eq *= 1 + r;
    if (eq > peak) peak = eq;
    const dd = peak > 0 ? 1 - eq / peak : 0;
    if (dd > maxDd) maxDd = dd;
  }
  const winRate = trades > 0 ? wins / trades : 0;
  const timeInMarket = nBars > 0 ? daysIn / nBars : 0;
  const calmar = maxDd > 0.02 ? cagr / maxDd : cagr;
  const retT = Math.tanh(totalReturn / 25);
  const tradeBonus = trades < 4 ? -1.8 : Math.min(0.5, Math.log10(trades + 1) * 0.35);
  const fitness =
    1.15 * sharpe + 0.55 * calmar + 2.1 * retT - 1.35 * maxDd + tradeBonus - (timeInMarket > 0.98 ? 0.15 : 0);
  return {
    finalEquity,
    totalReturn,
    cagr,
    sharpe,
    maxDd,
    trades,
    winRate,
    timeInMarket,
    fitness,
  };
}

export function backtest(bars: Bar[], g: Genome): { metrics: Metrics; equity: number[] } {
  const n = bars.length;
  const close = new Array<number>(n);
  const high = new Array<number>(n);
  const low = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    close[i] = bars[i]!.c;
    high[i] = bars[i]!.h;
    low[i] = bars[i]!.l;
  }

  const emaFast = g.entry === "ema_cross" || g.entry === "macd" || g.entry === "trend_rsi" ? emaSeries(close, g.fast) : null;
  const emaSlow = g.entry === "ema_cross" || g.entry === "macd" || g.confirmTrend || g.entry === "trend_rsi" ? emaSeries(close, g.slow) : null;
  const rsi = g.entry === "rsi_oversold" || g.entry === "trend_rsi" ? rsiSeries(close, g.rsiPeriod) : null;
  const macdLine = g.entry === "macd" && emaFast && emaSlow ? emaFast.map((v, i) => v - emaSlow[i]!) : null;
  const macdSignal = macdLine ? emaSeries(Array.from(macdLine), Math.max(5, Math.round(g.fast * 0.7))) : null;

  let cash = START_EQUITY;
  let shares = 0;
  let entryPx = 0;
  let peakPx = 0;
  let held = 0;
  let trades = 0;
  let wins = 0;
  let daysIn = 0;
  const dailyRets: number[] = [];
  const equitySample: number[] = [];
  let prevEq = START_EQUITY;

  const inPos = () => shares > 0;

  const trendOk = (i: number) => {
    if (!g.confirmTrend) return true;
    if (emaSlow) return close[i]! > emaSlow[i]!;
    const s = sma(close, g.slow, i);
    return Number.isFinite(s) && close[i]! > s;
  };

  const entryAt = (i: number) => {
    if (i < 3) return false;
    if (!trendOk(i)) return false;
    switch (g.entry) {
      case "sma_cross": {
        const f0 = sma(close, g.fast, i - 1);
        const s0 = sma(close, g.slow, i - 1);
        const f1 = sma(close, g.fast, i);
        const s1 = sma(close, g.slow, i);
        return f0 <= s0 && f1 > s1;
      }
      case "ema_cross": {
        if (!emaFast || !emaSlow) return false;
        return emaFast[i - 1]! <= emaSlow[i - 1]! && emaFast[i]! > emaSlow[i]!;
      }
      case "rsi_oversold": {
        if (!rsi) return false;
        return rsi[i - 1]! < g.rsiBuy && rsi[i]! >= g.rsiBuy;
      }
      case "breakout": {
        let m = -Infinity;
        const from = i - g.lookback;
        if (from < 0) return false;
        for (let k = from; k < i; k++) m = Math.max(m, high[k]!);
        return close[i]! > m;
      }
      case "macd": {
        if (!macdLine || !macdSignal) return false;
        return macdLine[i - 1]! <= macdSignal[i - 1]! && macdLine[i]! > macdSignal[i]!;
      }
      case "bb_bounce": {
        const mean = sma(close, g.lookback, i);
        const sd = stdev(close, g.lookback, i, mean);
        if (!Number.isFinite(mean) || !Number.isFinite(sd)) return false;
        const lower = mean - g.bbMult * sd;
        return close[i - 1]! < lower && close[i]! >= lower;
      }
      case "trend_rsi": {
        if (!rsi || !emaSlow) return false;
        return close[i]! > emaSlow[i]! && rsi[i]! < g.rsiBuy + 8 && rsi[i]! > rsi[i - 1]!;
      }
      default:
        return false;
    }
  };

  const exitSignal = (i: number) => {
    switch (g.entry) {
      case "sma_cross": {
        const f1 = sma(close, g.fast, i);
        const s1 = sma(close, g.slow, i);
        return Number.isFinite(f1) && f1 < s1;
      }
      case "ema_cross":
        return !!(emaFast && emaSlow && emaFast[i]! < emaSlow[i]!);
      case "rsi_oversold":
      case "trend_rsi":
        return !!(rsi && rsi[i]! > g.rsiSell);
      case "macd":
        return !!(macdLine && macdSignal && macdLine[i]! < macdSignal[i]!);
      case "breakout":
      case "bb_bounce":
        return false;
      default:
        return false;
    }
  };

  const sell = (px: number) => {
    if (shares <= 0) return;
    cash += shares * px * (1 - FEE);
    trades += 1;
    if (px > entryPx) wins += 1;
    shares = 0;
    held = 0;
    entryPx = 0;
    peakPx = 0;
  };

  const buy = (px: number) => {
    const budget = cash * g.sizeFrac;
    if (budget < 10) return;
    const qty = budget / (px * (1 + FEE));
    cash -= qty * px * (1 + FEE);
    shares = qty;
    entryPx = px;
    peakPx = px;
    held = 0;
  };

  for (let i = 0; i < n; i++) {
    const px = close[i]!;
    if (inPos()) {
      daysIn += 1;
      held += 1;
      peakPx = Math.max(peakPx, high[i]!);
      const sl = entryPx * (1 - g.stopLoss);
      if (low[i]! <= sl) {
        sell(sl);
      } else if (g.takeProfit > 0 && high[i]! >= entryPx * (1 + g.takeProfit)) {
        sell(entryPx * (1 + g.takeProfit));
      } else if (g.trailing > 0 && low[i]! <= peakPx * (1 - g.trailing)) {
        sell(peakPx * (1 - g.trailing));
      } else if (held >= g.maxHold) {
        sell(px);
      } else if (exitSignal(i)) {
        sell(px);
      }
    }
    if (!inPos() && i < n - 1 && entryAt(i)) {
      buy(px);
    }
    const eq = cash + shares * px;
    dailyRets.push(eq / prevEq - 1);
    prevEq = eq;
    if (i % EQUITY_STEP === 0 || i === n - 1) equitySample.push(eq);
  }

  if (shares > 0) {
    sell(close[n - 1]!);
    prevEq = cash;
    if (equitySample.length) equitySample[equitySample.length - 1] = prevEq;
  }

  const metrics = scoreFromPath(prevEq, dailyRets, trades, wins, daysIn, n);
  return { metrics, equity: equitySample };
}

export const PROTOCOL = {
  gen1Start: 100,
  gen1Cuts: [50, 35, 28] as const,
  laterStart: 112,
  laterCuts: [56, 41, 28] as const,
  offspringPerSurvivor: 3,
  eliteCount: 28,
};

export function cutsForGeneration(gen: number) {
  return gen <= 1 ? PROTOCOL.gen1Cuts : PROTOCOL.laterCuts;
}

export function describeGenome(g: Genome): string[] {
  const lines = [
    `Entrée · ${ENTRY_LABEL[g.entry]}`,
    `Fenêtres · rapide ${g.fast} / lente ${g.slow}`,
  ];
  if (g.entry === "rsi_oversold" || g.entry === "trend_rsi") {
    lines.push(`RSI ${g.rsiPeriod} · achat ≤ ${g.rsiBuy} · vente ≥ ${g.rsiSell}`);
  }
  if (g.entry === "breakout" || g.entry === "bb_bounce") {
    lines.push(`Lookback ${g.lookback}${g.entry === "bb_bounce" ? ` · σ ${g.bbMult}` : ""}`);
  }
  lines.push(
    `Stop ${Math.round(g.stopLoss * 100)} %` +
      (g.takeProfit > 0 ? ` · objectif ${Math.round(g.takeProfit * 100)} %` : " · sans objectif") +
      (g.trailing > 0 ? ` · trailing ${Math.round(g.trailing * 100)} %` : ""),
  );
  lines.push(`Durée max ${g.maxHold} j · taille ${(g.sizeFrac * 100).toFixed(0)} % du cash`);
  if (g.confirmTrend) lines.push("Filtre de tendance · prix au-dessus de la lente");
  if (g.parentId) lines.push(`Lignée · ${g.parentId}`);
  return lines;
}

export function seedPopulation(rng: Rng, gen: number, n: number): Individual[] {
  const pop: Individual[] = [];
  for (let i = 0; i < n; i++) {
    pop.push({ genome: randomGenome(rng, gen), metrics: null, equity: null, status: "newborn" });
  }
  return pop;
}

export function reproduce(rng: Rng, elites: Individual[], nextGen: number): Individual[] {
  const parents = elites.map((e) => e.genome);
  const children: Individual[] = elites.map((e) => ({
    genome: { ...e.genome },
    metrics: null,
    equity: null,
    status: "alive",
  }));
  for (const p of parents) {
    children.push({
      genome: mutateGenome(rng, p, nextGen),
      metrics: null,
      equity: null,
      status: "newborn",
    });
    children.push({
      genome: mutateGenome(rng, p, nextGen),
      metrics: null,
      equity: null,
      status: "newborn",
    });
    const other = pick(rng, parents);
    children.push({
      genome: crossover(rng, p, other, nextGen),
      metrics: null,
      equity: null,
      status: "newborn",
    });
  }
  return children;
}

export function cullTo(pop: Individual[], keep: number): Individual[] {
  const ranked = [...pop].sort((a, b) => (b.metrics?.fitness ?? -999) - (a.metrics?.fitness ?? -999));
  return ranked.map((ind, i) => ({
    ...ind,
    status: i < keep ? "alive" : "culled",
  }));
}

export function living(pop: Individual[]) {
  return pop.filter((p) => p.status !== "culled");
}
