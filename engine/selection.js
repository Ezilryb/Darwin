// engine/selection.js
// Petits utilitaires de sélection naturelle : classer et couper une population.

export function rankBy(individuals, metric) {
  return [...individuals].sort((a, b) => b.results[metric] - a.results[metric]);
}

export function cutTop(individuals, count) {
  const n = Math.max(0, Math.min(count, individuals.length));
  return individuals.slice(0, n);
}
