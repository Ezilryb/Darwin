// server.js
// Serveur unique : sert l'interface (public/) ET expose l'API du moteur évolutif.
//
// Important : Live Server (l'extension VSCode/Cursor) ne sert QUE des fichiers
// statiques, il ne peut pas exécuter de code ni écrire de fichiers sur disque.
// Comme le protocole demande d'écrire un document par génération, il faut un
// vrai petit serveur Node — c'est le rôle de ce fichier.
//
// Démarrage :
//   npm install
//   npm start
// puis ouvrir http://localhost:3000

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { mulberry32 } from './engine/rng.js';
import { CONFIG, initialPopulation, runGeneration, seedFromSurvivors, describeGenome } from './engine/evolution.js';
import * as store from './engine/store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, 'data', 'btc_10y_daily.json');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

store.ensureDirs();

let state = {
  seed: 42,
  rng: null,
  generation: 0,
  population: null, // population prête à être testée au prochain /api/run
  lastResult: null,
  running: false,
};

const sseClients = new Set();
function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) res.write(payload);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadCandles() {
  if (!fs.existsSync(DATA_PATH)) return null;
  const candles = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  return Array.isArray(candles) && candles.length ? candles : null;
}

function progressMessage(evt) {
  if (evt.type === 'reproduction') {
    return `Tour 4 — reproduction : ${evt.elites} élites produisent ${evt.children} descendants (×${CONFIG.childrenPerSurvivor}).`;
  }
  const labels = {
    totalReturnPct: 'rendement total',
    sharpe: 'ratio de Sharpe',
    calmar: 'rendement / drawdown',
  };
  return `Tour ${evt.tour} (${labels[evt.metric] || evt.metric}) — ${evt.survivors} survivants sur ${evt.population}.`;
}

function summarizeResult(result, generation) {
  return {
    generation,
    eliminated: result.eliminated,
    bestId: result.best?.id ?? null,
    bestReturnPct: result.best?.results?.totalReturnPct ?? null,
    buyAndHoldPct: result.buyAndHold?.totalReturnPct ?? null,
    strategyEquityCurve: result.best?.results?.equityCurve ?? null,
    buyAndHoldEquityCurve: result.buyAndHold?.equityCurve ?? null,
    tours: result.report.tours,
    elites: result.elites.map((e) => ({
      id: e.id,
      entryDate: e.results.entryDate,
      totalReturnPct: e.results.totalReturnPct,
      sharpe: e.results.sharpe,
      maxDrawdownPct: e.results.maxDrawdownPct,
      trades: e.results.trades,
      calmar: e.results.calmar,
    })),
  };
}

// --- Données ---
app.get('/api/data-status', (req, res) => {
  const candles = loadCandles();
  res.json({
    available: !!candles,
    count: candles ? candles.length : 0,
    from: candles?.[0]?.date ?? null,
    to: candles?.[candles.length - 1]?.date ?? null,
  });
});

// --- État courant ---
app.get('/api/state', (req, res) => {
  res.json({
    seed: state.seed,
    generation: state.generation,
    populationSize: state.population ? state.population.length : 0,
    running: state.running,
    lastResult: state.lastResult ? summarizeResult(state.lastResult, state.generation) : null,
    config: CONFIG,
  });
});

// --- Flux temps réel pour le journal ---
app.get('/api/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

app.post('/api/seed', (req, res) => {
  const seed = parseInt(req.body.seed, 10);
  if (!Number.isFinite(seed)) return res.status(400).json({ error: 'Graine invalide.' });
  state.seed = seed;
  state.rng = null; // sera recréé au prochain run avec la nouvelle graine
  res.json({ ok: true, seed: state.seed });
});

app.post('/api/reset', (req, res) => {
  store.resetAll();
  state = { seed: state.seed, rng: null, generation: 0, population: null, lastResult: null, running: false };
  broadcast({ type: 'log', message: 'Laboratoire réinitialisé.' });
  res.json({ ok: true });
});

// Recharge tous les survivants enregistrés (toutes générations confondues)
// comme population de départ pour une nouvelle génération.
app.post('/api/load-survivors', (req, res) => {
  const pool = store.loadSurvivorsPool();
  if (!pool.length) {
    return res.status(400).json({ error: "Aucun survivant enregistré pour l'instant." });
  }
  if (!state.rng) state.rng = mulberry32(state.seed);
  state.population = seedFromSurvivors(pool, state.generation + 1);
  broadcast({ type: 'log', message: `${pool.length} survivants rechargés depuis toutes les générations précédentes.` });
  res.json({ ok: true, loaded: pool.length });
});

// --- Lance la génération suivante (tours 1 à 4) ---
app.post('/api/run', async (req, res) => {
  if (state.running) return res.status(409).json({ error: 'Une génération est déjà en cours.' });

  const candles = loadCandles();
  if (!candles || candles.length < 200) {
    return res.status(400).json({
      error: "Données BTC manquantes ou insuffisantes. Lance d'abord : node scripts/fetch_btc.js",
    });
  }

  const fast = !!req.body?.fast;
  state.running = true;

  try {
    if (!state.rng) state.rng = mulberry32(state.seed);
    if (!state.population) {
      state.population = initialPopulation(state.rng);
      state.generation = 1;
    } else {
      state.generation += 1;
    }

    broadcast({ type: 'log', message: `Génération ${state.generation} — population de ${state.population.length} individus.` });
    if (!fast) await sleep(250);

    const result = await runGeneration({
      generation: state.generation,
      population: state.population,
      candles,
      rng: state.rng,
      onProgress: async (evt) => {
        broadcast({ type: 'log', message: progressMessage(evt) });
        if (!fast) await sleep(350);
      },
    });

    store.saveGeneration(
      state.generation,
      {
        generation: state.generation,
        seed: state.seed,
        config: CONFIG,
        tours: result.report.tours,
        eliminated: result.eliminated,
        bestId: result.best?.id ?? null,
        buyAndHold: { totalReturnPct: result.buyAndHold.totalReturnPct },
      },
      [...result.elites, ...result.children]
    );
    store.appendSurvivors(result.elites);

    state.population = result.nextGenPopulation;
    state.lastResult = result;
    state.running = false;

    const summary = summarizeResult(result, state.generation);
    broadcast({ type: 'done', ...summary });
    res.json({ ok: true, ...summary });
  } catch (err) {
    state.running = false;
    console.error(err);
    broadcast({ type: 'error', message: err.message });
    res.status(500).json({ error: err.message });
  }
});

// --- Historique ---
app.get('/api/generations', (req, res) => {
  res.json({ generations: store.listGenerations() });
});

app.get('/api/generation/:n', (req, res) => {
  const data = store.loadGeneration(parseInt(req.params.n, 10));
  if (!data) return res.status(404).json({ error: 'Génération introuvable.' });
  res.json(data);
});

app.get('/api/individual/:id', (req, res) => {
  for (const gen of store.listGenerations()) {
    const data = store.loadGeneration(gen);
    if (!data) continue; // génération cassée -> on l'ignore et on continue
    const found = data.individuals.find((i) => i.id === req.params.id);
    if (found) return res.json({ ...found, description: describeGenome(found.genome) });
  }
  res.status(404).json({ error: 'Individu introuvable.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Darwin Long en écoute sur http://localhost:${PORT}`));
