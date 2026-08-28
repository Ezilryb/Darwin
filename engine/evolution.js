// engine/evolution.js
// Orchestre une génération complète : 3 tours de sélection + 1 tour de reproduction.
//
// Pourquoi 3 tours avec 3 critères différents plutôt que 3 fois le même test ?
// Parce qu'un seul critère (ex: rendement brut) favorise des stratégies qui prennent
// des risques énormes et font un coup de chance. En filtrant successivement sur le
// rendement, puis le ratio de Sharpe (rendement/risque), puis le ratio rendement/drawdown,
// on ne garde en finale que des stratégies solides sur les 3 plans à la fois — et on
// réduit le risque de sur-apprentissage (overfitting) sur une seule mesure.

import { randomGenome, mutate, crossover } from './genome.js';
import { runBacktest, buyAndHold } from './backtest.js';
import { rankBy, cutTop } from './selection.js';

export const CONFIG = {
  initialPopulation: 100,     // population de départ, génération 1 uniquement
  eliteSize: 28,               // nombre d'élites conservées à l'issue du tour 3
  childrenPerSurvivor: 3,      // enfants produits par élite au tour 4
  tour1CutRatio: 0.5,          // tour 1 : on garde 50 % (classement par rendement)
  tour2CutRatio: 0.7,          // tour 2 : on garde 70 % du reste (classement par Sharpe)
  crossoverProb: 0.3,          // probabilité qu'un enfant vienne d'un croisement plutôt que d'un clone muté
};

function makeIndividual(id, generation, genome, parentIds = []) {
  return { id, generation, parentIds, genome, results: null, survivedRounds: [] };
}

function evaluate(individuals, candles) {
  for (const ind of individuals) {
    ind.results = runBacktest(ind.genome, candles);
  }
}

export function initialPopulation(rng) {
  const pop = [];
  for (let i = 1; i <= CONFIG.initialPopulation; i++) {
    pop.push(makeIndividual(`gen001_ind${String(i).padStart(3, '0')}`, 1, randomGenome(rng)));
  }
  return pop;
}

// Reprend les survivants de toutes les générations (fichier "pool") comme population de départ.
export function seedFromSurvivors(survivors, generation) {
  return survivors.map((s, i) =>
    makeIndividual(`gen${String(generation).padStart(3, '0')}_ind${String(i + 1).padStart(3, '0')}`, generation, s.genome, [s.id])
  );
}

export async function runGeneration({ generation, population, candles, rng, onProgress }) {
  const report = { generation, tours: [] };

  // --- Tour 1 : rendement total ---
  evaluate(population, candles);
  let ranked = rankBy(population, 'totalReturnPct');
  const survivors1 = cutTop(ranked, Math.ceil(population.length * CONFIG.tour1CutRatio));
  survivors1.forEach((s) => s.survivedRounds.push(1));
  report.tours.push({ tour: 1, metric: 'totalReturnPct', population: population.length, survivors: survivors1.length });
  await onProgress?.({ type: 'tour', tour: 1, metric: 'totalReturnPct', population: population.length, survivors: survivors1.length });

  // --- Tour 2 : ratio de Sharpe (rendement ajusté au risque) ---
  ranked = rankBy(survivors1, 'sharpe');
  const survivors2 = cutTop(ranked, Math.round(survivors1.length * CONFIG.tour2CutRatio));
  survivors2.forEach((s) => s.survivedRounds.push(2));
  report.tours.push({ tour: 2, metric: 'sharpe', population: survivors1.length, survivors: survivors2.length });
  await onProgress?.({ type: 'tour', tour: 2, metric: 'sharpe', population: survivors1.length, survivors: survivors2.length });

  // --- Tour 3 : ratio rendement / drawdown max -> élite finale ---
  ranked = rankBy(survivors2, 'calmar');
  const elites = cutTop(ranked, Math.min(CONFIG.eliteSize, ranked.length));
  elites.forEach((s) => s.survivedRounds.push(3));
  report.tours.push({ tour: 3, metric: 'calmar', population: survivors2.length, survivors: elites.length });
  await onProgress?.({ type: 'tour', tour: 3, metric: 'calmar', population: survivors2.length, survivors: elites.length });

  // --- Tour 4 : reproduction ---
  const children = [];
  let nextId = 1;
  for (const parent of elites) {
    for (let c = 0; c < CONFIG.childrenPerSurvivor; c++) {
      let childGenome;
      let parentIds = [parent.id];
      if (elites.length > 1 && rng() < CONFIG.crossoverProb) {
        let partner = elites[Math.floor(rng() * elites.length)];
        while (partner === parent) partner = elites[Math.floor(rng() * elites.length)];
        childGenome = mutate(crossover(parent.genome, partner.genome, rng), rng);
        parentIds = [parent.id, partner.id];
      } else {
        childGenome = mutate(parent.genome, rng);
      }
      children.push(
        makeIndividual(
          `gen${String(generation + 1).padStart(3, '0')}_ind${String(nextId).padStart(3, '0')}`,
          generation + 1,
          childGenome,
          parentIds
        )
      );
      nextId++;
    }
  }
  report.tours.push({ tour: 4, type: 'reproduction', elites: elites.length, children: children.length });
  await onProgress?.({ type: 'reproduction', tour: 4, elites: elites.length, children: children.length });

  const eliminated = population.length - elites.length;
  const best = rankBy(elites, 'calmar')[0] || null;
  if (best) best.results = runBacktest(best.genome, candles, { recordEquityCurve: true });

  const nextGenPopulation = [...elites, ...children];

  return {
    report,
    eliminated,
    elites,
    children,
    best,
    buyAndHold: buyAndHold(candles, { recordEquityCurve: true }),
    nextGenPopulation,
  };
}

export { describeGenome } from './genome.js';
