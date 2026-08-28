// scripts/generate_sample_data.js
// Génère des données SYNTHÉTIQUES (marche aléatoire) pour tester l'application
// immédiatement, sans connexion internet ni appel à Binance.
//
// ⚠️ Ce ne sont PAS des vraies données BTC. Pour les vraies données :
//   node scripts/fetch_btc.js
//
// Utilisation :
//   node scripts/generate_sample_data.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'data', 'btc_10y_daily.json');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(1234);
const start = new Date('2016-08-17T00:00:00Z');
const days = 365 * 10;

let price = 580; // prix BTC approx. mi-2016, juste pour un ordre de grandeur réaliste
const candles = [];

for (let i = 0; i < days; i++) {
  const date = new Date(start.getTime() + i * 86400000);
  // dérive haussière légère + bruit + quelques chocs de volatilité, pour imiter
  // grossièrement la forme d'un marché crypto (mais SANS valeur prédictive réelle)
  const drift = 0.0006;
  const shock = rng() < 0.01 ? (rng() - 0.5) * 0.3 : 0;
  const noise = (rng() - 0.5) * 0.06;
  const changePct = drift + noise + shock;
  const open = price;
  price = Math.max(1, price * (1 + changePct));
  const close = price;
  const high = Math.max(open, close) * (1 + rng() * 0.02);
  const low = Math.min(open, close) * (1 - rng() * 0.02);
  candles.push({
    date: date.toISOString().slice(0, 10),
    open: +open.toFixed(2),
    high: +high.toFixed(2),
    low: +low.toFixed(2),
    close: +close.toFixed(2),
    volume: +(rng() * 50000).toFixed(2),
  });
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(candles, null, 2));
console.log(`✅ ${candles.length} bougies SYNTHÉTIQUES (test uniquement) écrites dans ${path.relative(process.cwd(), OUT_PATH)}`);
console.log('   Pour les vraies données BTC : node scripts/fetch_btc.js');
