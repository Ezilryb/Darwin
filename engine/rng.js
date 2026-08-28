// engine/rng.js
// Générateur pseudo-aléatoire "seedable" (mulberry32).
// Avec la même graine, une génération produit toujours exactement
// la même population initiale et les mêmes mutations -> runs reproductibles.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randRange(rng, min, max) {
  return min + rng() * (max - min);
}

export function randInt(rng, min, max) {
  return Math.floor(randRange(rng, min, max + 1));
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Bruit gaussien (Box-Muller) utilisé pour les mutations "douces" des gènes numériques.
export function gaussian(rng, mean = 0, std = 1) {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * std;
}
