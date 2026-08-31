// engine/store.js
// Persistance sur disque : un dossier par génération, un fichier JSON par individu,
// + un fichier "pool" cumulant tous les survivants de toutes les générations.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'generations');
const SURVIVORS_DIR = path.resolve(process.cwd(), 'survivors_pool');
const SURVIVORS_FILE = path.join(SURVIVORS_DIR, 'all_time_survivors.json');

export function ensureDirs() {
  fs.mkdirSync(ROOT, { recursive: true });
  fs.mkdirSync(SURVIVORS_DIR, { recursive: true });
}

export function generationDir(gen) {
  return path.join(ROOT, `gen_${String(gen).padStart(3, '0')}`);
}

export function saveGeneration(gen, summary, individuals) {
  ensureDirs();
  const dir = generationDir(gen);
  const indDir = path.join(dir, 'individuals');
  fs.mkdirSync(indDir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
  for (const ind of individuals) {
    fs.writeFileSync(path.join(indDir, `${ind.id}.json`), JSON.stringify(ind, null, 2));
  }
  // Document humain, lisible directement, listant la stratégie de chaque individu.
  const lines = [
    `# Génération ${gen}`,
    '',
    `Graine : ${summary.seed}`,
    `Éliminés ce tour : ${summary.eliminated}`,
    `Meilleur individu : ${summary.bestId ?? '—'}`,
    `Buy & hold (même période) : ${summary.buyAndHold?.totalReturnPct ?? '—'}%`,
    '',
    '## Individus',
    '',
  ];
  for (const ind of individuals) {
    const r = ind.results || {};
    lines.push(`### ${ind.id}${ind.parentIds?.length ? ` (parents : ${ind.parentIds.join(', ')})` : ''}`);
    lines.push(`- Rendement total : ${r.totalReturnPct ?? '—'}%`);
    lines.push(`- Sharpe : ${r.sharpe ?? '—'}`);
    lines.push(`- Drawdown max : ${r.maxDrawdownPct ?? '—'}%`);
    lines.push(`- Trades : ${r.trades ?? '—'}`);
    lines.push('');
  }
  fs.writeFileSync(path.join(dir, 'generation.md'), lines.join('\n'));
}

export function loadGeneration(gen) {
  const dir = generationDir(gen);
  const summaryPath = path.join(dir, 'summary.json');
  if (!fs.existsSync(summaryPath)) return null;
  let summary;
  try {
    summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  } catch {
    return null; // summary.json corrompu (écriture interrompue)
  }
  const indDir = path.join(dir, 'individuals');
  const individuals = fs.existsSync(indDir)
    ? fs.readdirSync(indDir)
        .map((f) => {
          try {
            return JSON.parse(fs.readFileSync(path.join(indDir, f), 'utf-8'));
          } catch {
            return null; // fichier individu corrompu -> ignoré
          }
        })
        .filter(Boolean)
    : [];
  return { summary, individuals };
}

export function listGenerations() {
  ensureDirs();
  return fs
    .readdirSync(ROOT)
    .filter((f) => f.startsWith('gen_'))
    .map((f) => parseInt(f.replace('gen_', ''), 10))
    .sort((a, b) => a - b);
}

export function loadSurvivorsPool() {
  if (!fs.existsSync(SURVIVORS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SURVIVORS_FILE, 'utf-8'));
}

export function saveSurvivorsPool(survivors) {
  ensureDirs();
  fs.writeFileSync(SURVIVORS_FILE, JSON.stringify(survivors, null, 2));
}

export function appendSurvivors(newSurvivors) {
  const pool = loadSurvivorsPool();
  const byId = new Map(pool.map((s) => [s.id, s]));
  for (const s of newSurvivors) byId.set(s.id, s);
  saveSurvivorsPool([...byId.values()]);
}

export function resetAll() {
  fs.rmSync(ROOT, { recursive: true, force: true });
  fs.rmSync(SURVIVORS_DIR, { recursive: true, force: true });
  ensureDirs();
}
