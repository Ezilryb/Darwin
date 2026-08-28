// engine/genome.js
// Un "génome" = l'ADN d'un individu : une règle d'entrée + des règles de sortie.
// Le moteur de backtest est fixe ; seul le génome évolue (mutation / croisement).
// C'est le choix le plus sûr : pas de code arbitraire qui se réécrit lui-même,
// seulement des paramètres interprétés par un moteur figé et auditable.

import { randRange, randInt, pick, gaussian } from './rng.js';

export const ENTRY_RULES = ['sma_cross', 'rsi_oversold', 'breakout', 'ema_trend'];

const RANGES = {
  smaFast: [5, 50],
  smaSlow: [30, 200],
  rsiPeriod: [7, 30],
  rsiThreshold: [15, 45],
  breakoutPeriod: [10, 100],
  emaPeriod: [10, 200],
  stopLossPct: [3, 25],
  takeProfitPct: [10, 200],
  trailingStopPct: [3, 30],
};

function fixSmaOrder(g) {
  if (g.smaFast >= g.smaSlow) {
    const fast = Math.min(g.smaFast, g.smaSlow);
    g.smaFast = fast;
    g.smaSlow = fast + 5;
  }
  return g;
}

export function randomGenome(rng) {
  const g = {
    entryRule: pick(rng, ENTRY_RULES),
    smaFast: randInt(rng, ...RANGES.smaFast),
    smaSlow: randInt(rng, ...RANGES.smaSlow),
    rsiPeriod: randInt(rng, ...RANGES.rsiPeriod),
    rsiThreshold: randInt(rng, ...RANGES.rsiThreshold),
    breakoutPeriod: randInt(rng, ...RANGES.breakoutPeriod),
    emaPeriod: randInt(rng, ...RANGES.emaPeriod),
    stopLossPct: +randRange(rng, ...RANGES.stopLossPct).toFixed(2),
    useTakeProfit: rng() < 0.5,
    takeProfitPct: +randRange(rng, ...RANGES.takeProfitPct).toFixed(2),
    useTrailingStop: rng() < 0.5,
    trailingStopPct: +randRange(rng, ...RANGES.trailingStopPct).toFixed(2),
    useExitSignal: rng() < 0.5,
  };
  return fixSmaOrder(g);
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

const NUMERIC_KEYS = [
  'smaFast', 'smaSlow', 'rsiPeriod', 'rsiThreshold',
  'breakoutPeriod', 'emaPeriod', 'stopLossPct', 'takeProfitPct', 'trailingStopPct',
];

export function mutate(genome, rng, rate = 0.35) {
  const g = { ...genome };

  if (rng() < 0.08) g.entryRule = pick(rng, ENTRY_RULES);

  for (const key of NUMERIC_KEYS) {
    if (rng() < rate) {
      const [min, max] = RANGES[key];
      const span = max - min;
      const delta = gaussian(rng, 0, span * 0.15);
      const v = clamp(g[key] + delta, min, max);
      g[key] = key.endsWith('Pct') ? +v.toFixed(2) : Math.round(v);
    }
  }
  fixSmaOrder(g);

  if (rng() < 0.1) g.useTakeProfit = !g.useTakeProfit;
  if (rng() < 0.1) g.useTrailingStop = !g.useTrailingStop;
  if (rng() < 0.1) g.useExitSignal = !g.useExitSignal;

  return g;
}

// Croisement uniforme : chaque gène vient au hasard de l'un des deux parents.
export function crossover(a, b, rng) {
  const child = {};
  for (const key of Object.keys(a)) {
    child[key] = rng() < 0.5 ? a[key] : b[key];
  }
  fixSmaOrder(child);
  return child;
}

export function describeGenome(g) {
  const parts = [];
  if (g.entryRule === 'sma_cross') parts.push(`Entrée : SMA${g.smaFast} croise au-dessus de SMA${g.smaSlow}`);
  if (g.entryRule === 'rsi_oversold') parts.push(`Entrée : RSI${g.rsiPeriod} repasse au-dessus de ${g.rsiThreshold}`);
  if (g.entryRule === 'breakout') parts.push(`Entrée : cassure du plus haut sur ${g.breakoutPeriod} j`);
  if (g.entryRule === 'ema_trend') parts.push(`Entrée : clôture repasse au-dessus de l'EMA${g.emaPeriod}`);

  parts.push(`Stop loss : -${g.stopLossPct}%`);
  if (g.useTakeProfit) parts.push(`Take profit : +${g.takeProfitPct}%`);
  if (g.useTrailingStop) parts.push(`Trailing stop : ${g.trailingStopPct}%`);
  if (g.useExitSignal) parts.push('Sortie sur signal inverse');

  return parts.join(' · ');
}
