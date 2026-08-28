# Darwin Long — Laboratoire d'algorithmes évolutifs (long only, BTC)

Population d'algorithmes de trading qui évoluent par sélection naturelle : les
plus faibles sont éliminés à chaque tour, les 28 meilleurs de chaque génération
se reproduisent (mutation + croisement) pour produire la génération suivante.

## Installation

```bash
npm install
```

## 1. Récupérer les données BTC (10 ans, daily)

```bash
node scripts/fetch_btc.js
```

Ce script télécharge l'historique BTC/USDT depuis l'API publique de Binance
(aucune clé API requise) et écrit le résultat dans `data/btc_10y_daily.json`.

Pour tester l'application immédiatement sans connexion internet (données
factices, à ne jamais utiliser pour de vraies conclusions) :

```bash
node scripts/generate_sample_data.js
```

## 2. Lancer le laboratoire

```bash
npm start
```

Puis ouvre **http://localhost:3000**.

⚠️ Important : contrairement à Live Server (l'extension VSCode/Cursor), ce
projet a besoin d'un vrai serveur Node, car il doit écrire un fichier par
génération sur le disque (`generations/gen_XXX/...`). Live Server ne sert que
des fichiers statiques et ne peut pas exécuter ce code ni écrire de fichiers.
Lance donc toujours `npm start`, pas Live Server, pour ce projet.

## Comment ça marche

Chaque génération se déroule en 4 tours :

- **Tour 1** — tous les individus sont testés sur les 10 ans de BTC, classés
  par **rendement total**, les 50 % du haut survivent.
- **Tour 2** — les survivants sont reclassés par **ratio de Sharpe**
  (rendement ajusté au risque), ~70 % du reste survivent.
- **Tour 3** — reclassement par **ratio rendement / drawdown max**, seuls les
  28 meilleurs (l'élite) survivent.
- **Tour 4** — chaque élite produit 3 descendants (mutation, parfois
  croisement avec une autre élite). Population suivante = 28 + 84 = 112.

Tester successivement sur 3 critères différents (plutôt que 3 fois le même
test) évite de ne garder que des stratégies chanceuses sur un seul indicateur,
et réduit le risque de sur-apprentissage (overfitting) sur les données
historiques.

## Fichiers générés

```
generations/
  gen_001/
    summary.json        # résumé de la génération (tours, éliminés, meilleur)
    generation.md        # même résumé en lisible humain
    individuals/
      gen001_ind001.json # génome + résultats complets de chaque individu
      ...
survivors_pool/
  all_time_survivors.json  # cumul dédupliqué de tous les survivants, toutes générations
```

## Reprendre avec les survivants déjà trouvés

Le bouton **« Garder le meilleur »** dans l'interface recharge tous les
survivants enregistrés dans `survivors_pool/all_time_survivors.json` (toutes
générations confondues) comme population de départ, puis tu peux relancer une
génération dessus au lieu de repartir de zéro avec 100 individus aléatoires.

## Structure du code

```
engine/
  rng.js          # RNG seedable (mulberry32) — runs reproductibles via la graine
  indicators.js   # SMA, EMA, RSI, canal de Donchian
  genome.js       # génome (ADN) d'un individu : règle d'entrée + règles de sortie
  backtest.js     # simule un génome sur les bougies (long only, frais 0.10%)
  selection.js    # classement et découpe d'une population
  evolution.js    # orchestre les 4 tours d'une génération
  store.js        # lecture/écriture des fichiers de génération sur disque
server.js         # API Express + flux SSE pour le journal en direct
public/           # interface (HTML/CSS/JS, aucune dépendance externe)
scripts/
  fetch_btc.js            # télécharge les vraies données BTC (Binance)
  generate_sample_data.js # données factices pour tester hors-ligne
```

## Limites à connaître

- Les données de test sont limitées à ~10 ans de BTC en tendance
  majoritairement haussière : beaucoup de stratégies "survivantes" seront
  proches d'un simple "reste investi le plus longtemps possible". Compare
  toujours au Buy & Hold affiché dans l'interface.
- Aucun découpage train/test n'est fait par défaut : les stratégies sont
  sélectionnées et évaluées sur la même période. Pour des conclusions plus
  fiables, envisage de séparer une période d'entraînement (ex. 2016-2023) et
  une période de test (2023-2026) avant de faire confiance à une stratégie.
- Ceci est un outil de recherche/backtesting, pas un conseil en investissement.
