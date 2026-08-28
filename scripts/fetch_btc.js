// scripts/fetch_btc.js
// Télécharge l'historique journalier du BTC (Binance, endpoint public, pas de clé requise)
// et l'enregistre dans data/btc_10y_daily.json.
//
// Utilisation :
//   node scripts/fetch_btc.js
//
// Options (variables d'env) :
//   BTC_START=2016-08-17 node scripts/fetch_btc.js   -> change la date de départ

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SYMBOL = 'BTCUSDT';
const INTERVAL = '1d';
const START = new Date(process.env.BTC_START || '2016-08-17T00:00:00Z').getTime();
const END = Date.now();
const OUT_PATH = path.join(__dirname, '..', 'data', 'btc_10y_daily.json');

async function fetchAll() {
  let allCandles = [];
  let cursor = START;

  console.log(`Téléchargement ${SYMBOL} (${INTERVAL}) depuis ${new Date(START).toISOString().slice(0, 10)}...`);

  while (cursor < END) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${INTERVAL}&startTime=${cursor}&limit=1000`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Erreur API Binance : ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.length) break;

    allCandles = allCandles.concat(data);
    const last = data[data.length - 1][0];
    cursor = last + 24 * 60 * 60 * 1000;
    process.stdout.write(`\r  ...jusqu'au ${new Date(last).toISOString().slice(0, 10)} (${allCandles.length} bougies)`);
    await new Promise((r) => setTimeout(r, 250)); // reste sous la limite de requêtes
  }
  console.log('');

  const formatted = allCandles.map((c) => ({
    date: new Date(c[0]).toISOString().slice(0, 10),
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[5]),
  }));

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(formatted, null, 2));
  console.log(`✅ ${formatted.length} bougies enregistrées dans ${path.relative(process.cwd(), OUT_PATH)}`);
}

fetchAll().catch((err) => {
  console.error('❌ Échec du téléchargement :', err.message);
  process.exit(1);
});
