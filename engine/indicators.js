// engine/indicators.js
// Indicateurs techniques utilisés comme "gènes" par les stratégies.
// Chaque fonction retourne un tableau de même longueur que l'entrée,
// avec `null` tant que la fenêtre de calcul n'est pas encore remplie.

export function sma(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values, period) {
  const out = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j <= i; j++) sum += values[j];
      prev = sum / period;
      out[i] = prev;
    } else if (i >= period) {
      prev = values[i] * k + prev * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

export function rsi(closes, period) {
  const out = new Array(closes.length).fill(null);
  let gainSum = 0;
  let lossSum = 0;
  let prevAvgGain = 0;
  let prevAvgLoss = 0;
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (i <= period) {
      gainSum += gain;
      lossSum += loss;
      if (i === period) {
        prevAvgGain = gainSum / period;
        prevAvgLoss = lossSum / period;
        out[i] = prevAvgLoss === 0 ? 100 : 100 - 100 / (1 + prevAvgGain / prevAvgLoss);
      }
    } else {
      prevAvgGain = (prevAvgGain * (period - 1) + gain) / period;
      prevAvgLoss = (prevAvgLoss * (period - 1) + loss) / period;
      out[i] = prevAvgLoss === 0 ? 100 : 100 - 100 / (1 + prevAvgGain / prevAvgLoss);
    }
  }
  return out;
}

// Canal de Donchian : plus haut / plus bas des `period` derniers jours (hors jour courant).
export function donchianHigh(values, period) {
  const out = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    if (i >= period) {
      let max = -Infinity;
      for (let j = i - period; j < i; j++) max = Math.max(max, values[j]);
      out[i] = max;
    }
  }
  return out;
}

export function donchianLow(values, period) {
  const out = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    if (i >= period) {
      let min = Infinity;
      for (let j = i - period; j < i; j++) min = Math.min(min, values[j]);
      out[i] = min;
    }
  }
  return out;
}
