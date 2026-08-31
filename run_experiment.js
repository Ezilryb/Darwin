// run_experiment.js
// Rejoue le moteur évolutif (SANS LE MODIFIER) sur UN SEUL marché synthétique,
// avec deux graines évolutives différentes (42 = celle par défaut de l'appli,
// 7 = une graine totalement différente), pour vérifier si l'effondrement de
// diversité observé par l'utilisateur est spécifique à une graine ou systématique.

import { mulberry32 } from './engine/rng.js';
import { initialPopulation, runGeneration } from './engine/evolution.js';

function generateMarket(seed, days) {
  // Même logique que scripts/generate_sample_data.js du projet.
  const rng = mulberry32(seed);
  let price = 580;
  const candles = [];
  const start = new Date('2016-08-17T00:00:00Z');
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 86400000);
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
  return candles;
}

function plateauStart(log) {
  const finalVal = log[log.length - 1].bestCalmar;
  let start = log[log.length - 1].gen;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].bestCalmar === finalVal) start = log[i].gen;
    else break;
  }
  return start;
}

async function runExperiment(evoSeed, candles, generations) {
  const rng = mulberry32(evoSeed);
  let population = initialPopulation(rng);
  const log = [];

  for (let g = 1; g <= generations; g++) {
    const result = await runGeneration({ generation: g, population, candles, rng });
    const elites = result.elites;
    const calmars = elites.map((e) => e.results.calmar);
    const bestCalmar = Math.max(...calmars);
    const rules = new Set(elites.map((e) => e.genome.entryRule));
    const cloneCount = calmars.filter((c) => c === bestCalmar).length;
    const bestElite = elites.find((e) => e.results.calmar === bestCalmar);

    log.push({
      gen: g,
      bestCalmar: +bestCalmar.toFixed(3),
      distinctRules: rules.size,
      cloneCount,
      eliteCount: elites.length,
      bestGenome: bestElite.genome,
      bestReturn: bestElite.results.totalReturnPct,
    });
    population = result.nextGenPopulation;
  }

  const firstRuleCollapse = log.find((l) => l.distinctRules === 1)?.gen ?? null;
  const plateau = plateauStart(log);

  return { log, firstRuleCollapse, plateau };
}

const candles = generateMarket(1234, 3650);
const bh = ((candles[candles.length - 1].close - candles[0].close) / candles[0].close) * 100;
console.log(`Marché synthétique (graine 1234) : ${candles.length} bougies, ${candles[0].date} -> ${candles[candles.length - 1].date}`);
console.log(`Buy & hold sur ce marché : ${bh.toFixed(1)} %\n`);

for (const seed of [42, 7]) {
  console.time(`graine evo ${seed}`);
  const { log, firstRuleCollapse, plateau } = await runExperiment(seed, candles, 25);
  console.timeEnd(`graine evo ${seed}`);

  console.log(`\n=== Graine évolutive ${seed} ===`);
  [1, 2, 3, 4, 5, 8, 12, 16, 20, 25].forEach((g) => {
    const l = log[g - 1];
    if (l) {
      console.log(
        `gen ${String(l.gen).padStart(2)}: bestCalmar=${String(l.bestCalmar).padStart(8)}  return=${String(l.bestReturn).padStart(10)}%  reglesDistinctes=${l.distinctRules}  clonesDuMeilleur=${l.cloneCount}/${l.eliteCount}  entryRule=${l.bestGenome.entryRule}`
      );
    }
  });
  console.log(`-> une seule regle d'entree dans l'elite des la generation : ${firstRuleCollapse}`);
  console.log(`-> plateau de fitness (calmar fige jusqu'a la fin) des la generation : ${plateau}`);
  const last = log[log.length - 1];
  console.log(
    `-> champion final : entryRule=${last.bestGenome.entryRule}, stopLossPct=${last.bestGenome.stopLossPct}, useTakeProfit=${last.bestGenome.useTakeProfit}, takeProfitPct=${last.bestGenome.takeProfitPct}, useTrailingStop=${last.bestGenome.useTrailingStop}, trailingStopPct=${last.bestGenome.trailingStopPct}, useExitSignal=${last.bestGenome.useExitSignal}`
  );
}
