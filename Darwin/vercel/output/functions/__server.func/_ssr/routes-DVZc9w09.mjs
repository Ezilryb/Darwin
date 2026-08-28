import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pin, c as Dna, i as Play, n as Skull, o as Pause, r as RotateCcw, s as FastForward } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { a as CartesianGrid, i as Line, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as LineChart } from "../_libs/recharts+[...].mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DVZc9w09.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatPct(n, digits = 1) {
	if (!Number.isFinite(n)) return "—";
	return `${(n * 100).toLocaleString("fr-FR", {
		maximumFractionDigits: digits,
		minimumFractionDigits: digits
	})} %`;
}
function formatNum(n, digits = 2) {
	if (!Number.isFinite(n)) return "—";
	return n.toLocaleString("fr-FR", {
		maximumFractionDigits: digits,
		minimumFractionDigits: 0
	});
}
function formatUsd(n) {
	if (!Number.isFinite(n)) return "—";
	return n.toLocaleString("fr-FR", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: n >= 1e3 ? 0 : 2
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,color] duration-[var(--motion-quick)] ease-[var(--ease-smooth-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			outline: "border border-border bg-transparent text-fg hover:bg-surface",
			ghost: "text-muted hover:bg-surface hover:text-fg",
			danger: "bg-loss/15 text-loss hover:bg-loss/25"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var ENTRY_LABEL = {
	sma_cross: "Croisement SMA",
	ema_cross: "Croisement EMA",
	rsi_oversold: "RSI survendu",
	breakout: "Cassage Donchian",
	macd: "MACD",
	bb_bounce: "Rebond Bollinger",
	trend_rsi: "Tendance + RSI"
};
var ENTRY_KINDS = [
	"sma_cross",
	"ema_cross",
	"rsi_oversold",
	"breakout",
	"macd",
	"bb_bounce",
	"trend_rsi"
];
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function ri(rng, min, max) {
	return Math.floor(rng() * (max - min + 1)) + min;
}
function rf(rng, min, max) {
	return min + rng() * (max - min);
}
function pick(rng, arr) {
	return arr[Math.floor(rng() * arr.length)];
}
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function uid(rng, gen) {
	return `G${gen}-${Math.floor(rng() * 1e9).toString(36).padStart(6, "0")}`;
}
function normalize(g) {
	let fast = clamp(Math.round(g.fast), 3, 60);
	let slow = clamp(Math.round(g.slow), 10, 240);
	if (fast >= slow) slow = fast + 5;
	return {
		...g,
		fast,
		slow,
		rsiPeriod: clamp(Math.round(g.rsiPeriod), 5, 32),
		rsiBuy: clamp(Math.round(g.rsiBuy), 10, 45),
		rsiSell: clamp(Math.round(g.rsiSell), 50, 90),
		lookback: clamp(Math.round(g.lookback), 8, 80),
		bbMult: clamp(+g.bbMult.toFixed(2), 1.2, 3.2),
		stopLoss: clamp(+g.stopLoss.toFixed(3), .02, .35),
		takeProfit: clamp(+g.takeProfit.toFixed(3), 0, 1.2),
		trailing: clamp(+g.trailing.toFixed(3), 0, .28),
		maxHold: clamp(Math.round(g.maxHold), 4, 500),
		sizeFrac: clamp(+g.sizeFrac.toFixed(2), .25, 1)
	};
}
function randomGenome(rng, gen, parentId = null) {
	const fast = ri(rng, 5, 30);
	return normalize({
		id: uid(rng, gen),
		gen,
		parentId,
		entry: pick(rng, ENTRY_KINDS),
		fast,
		slow: ri(rng, fast + 8, 180),
		rsiPeriod: ri(rng, 8, 21),
		rsiBuy: ri(rng, 18, 40),
		rsiSell: ri(rng, 60, 82),
		lookback: ri(rng, 12, 55),
		bbMult: rf(rng, 1.6, 2.6),
		stopLoss: rf(rng, .05, .18),
		takeProfit: rng() < .25 ? 0 : rf(rng, .12, .7),
		trailing: rng() < .4 ? 0 : rf(rng, .06, .18),
		maxHold: ri(rng, 12, 220),
		sizeFrac: rng() < .35 ? 1 : rf(rng, .4, 1),
		confirmTrend: rng() < .55
	});
}
function mutateGenome(rng, parent, gen) {
	const g = {
		...parent,
		id: uid(rng, gen),
		gen,
		parentId: parent.id
	};
	const rate = .28;
	if (rng() < .18) g.entry = pick(rng, ENTRY_KINDS);
	if (rng() < rate) g.fast += ri(rng, -6, 6);
	if (rng() < rate) g.slow += ri(rng, -16, 16);
	if (rng() < rate) g.rsiPeriod += ri(rng, -4, 4);
	if (rng() < rate) g.rsiBuy += ri(rng, -6, 6);
	if (rng() < rate) g.rsiSell += ri(rng, -6, 6);
	if (rng() < rate) g.lookback += ri(rng, -8, 8);
	if (rng() < rate) g.bbMult += rf(rng, -.3, .3);
	if (rng() < rate) g.stopLoss *= rf(rng, .7, 1.35);
	if (rng() < rate) g.takeProfit = rng() < .15 ? 0 : g.takeProfit * rf(rng, .7, 1.4) || rf(rng, .12, .5);
	if (rng() < rate) g.trailing = rng() < .2 ? 0 : (g.trailing || .1) * rf(rng, .7, 1.35);
	if (rng() < rate) g.maxHold += ri(rng, -30, 40);
	if (rng() < rate) g.sizeFrac += rf(rng, -.2, .2);
	if (rng() < .12) g.confirmTrend = !g.confirmTrend;
	return normalize(g);
}
function crossover(rng, a, b, gen) {
	const src = (x, y) => rng() < .5 ? x : y;
	const mix = src(a, b);
	return normalize({
		id: uid(rng, gen),
		gen,
		parentId: a.id,
		entry: src(a, b).entry,
		fast: mix.fast,
		slow: src(a, b).slow,
		rsiPeriod: src(a, b).rsiPeriod,
		rsiBuy: src(a, b).rsiBuy,
		rsiSell: src(a, b).rsiSell,
		lookback: src(a, b).lookback,
		bbMult: (a.bbMult + b.bbMult) / 2,
		stopLoss: src(a, b).stopLoss,
		takeProfit: src(a, b).takeProfit,
		trailing: src(a, b).trailing,
		maxHold: src(a, b).maxHold,
		sizeFrac: (a.sizeFrac + b.sizeFrac) / 2,
		confirmTrend: src(a, b).confirmTrend
	});
}
function sma(values, period, i) {
	if (i + 1 < period) return NaN;
	let s = 0;
	for (let k = i - period + 1; k <= i; k++) s += values[k];
	return s / period;
}
function emaSeries(values, period) {
	const out = new Float64Array(values.length);
	const k = 2 / (period + 1);
	let prev = values[0];
	out[0] = prev;
	for (let i = 1; i < values.length; i++) {
		prev = values[i] * k + prev * (1 - k);
		out[i] = prev;
	}
	return out;
}
function rsiSeries(values, period) {
	const out = new Float64Array(values.length);
	out[0] = 50;
	let avgG = 0;
	let avgL = 0;
	for (let i = 1; i <= period && i < values.length; i++) {
		const d = values[i] - values[i - 1];
		if (d >= 0) avgG += d;
		else avgL -= d;
	}
	avgG /= period;
	avgL /= period;
	out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
	for (let i = period + 1; i < values.length; i++) {
		const d = values[i] - values[i - 1];
		const g = d > 0 ? d : 0;
		const l = d < 0 ? -d : 0;
		avgG = (avgG * (period - 1) + g) / period;
		avgL = (avgL * (period - 1) + l) / period;
		out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
	}
	return out;
}
function stdev(values, period, i, mean) {
	if (i + 1 < period) return NaN;
	let s = 0;
	for (let k = i - period + 1; k <= i; k++) {
		const d = values[k] - mean;
		s += d * d;
	}
	return Math.sqrt(s / period);
}
var START_EQUITY = 1e4;
var EQUITY_STEP = 8;
function buyHoldEquity(bars) {
	const p0 = bars[0].c;
	const out = [];
	for (let i = 0; i < bars.length; i += EQUITY_STEP) out.push(START_EQUITY * (bars[i].c / p0));
	const last = bars.length - 1;
	if (last % EQUITY_STEP !== 0) out.push(START_EQUITY * (bars[last].c / p0));
	return out;
}
function buyHoldMetrics(bars) {
	const p0 = bars[0].c;
	const p1 = bars[bars.length - 1].c;
	const rets = [];
	for (let i = 1; i < bars.length; i++) rets.push(bars[i].c / bars[i - 1].c - 1);
	return scoreFromPath(START_EQUITY * (p1 / p0), rets, 1, 1, bars.length, bars.length);
}
function scoreFromPath(finalEquity, dailyRets, trades, wins, daysIn, nBars) {
	const totalReturn = finalEquity / START_EQUITY - 1;
	const years = nBars / 365.25;
	const cagr = years > 0 ? Math.pow(Math.max(finalEquity, 1) / START_EQUITY, 1 / years) - 1 : 0;
	let mean = 0;
	for (const r of dailyRets) mean += r;
	mean = dailyRets.length ? mean / dailyRets.length : 0;
	let v = 0;
	for (const r of dailyRets) {
		const d = r - mean;
		v += d * d;
	}
	const sd = dailyRets.length > 2 ? Math.sqrt(v / (dailyRets.length - 1)) : 0;
	const sharpe = sd > 1e-12 ? mean / sd * Math.sqrt(365) : 0;
	let peak = START_EQUITY;
	let eq = START_EQUITY;
	let maxDd = 0;
	for (const r of dailyRets) {
		eq *= 1 + r;
		if (eq > peak) peak = eq;
		const dd = peak > 0 ? 1 - eq / peak : 0;
		if (dd > maxDd) maxDd = dd;
	}
	const winRate = trades > 0 ? wins / trades : 0;
	const timeInMarket = nBars > 0 ? daysIn / nBars : 0;
	const calmar = maxDd > .02 ? cagr / maxDd : cagr;
	const retT = Math.tanh(totalReturn / 25);
	const tradeBonus = trades < 4 ? -1.8 : Math.min(.5, Math.log10(trades + 1) * .35);
	const fitness = 1.15 * sharpe + .55 * calmar + 2.1 * retT - 1.35 * maxDd + tradeBonus - (timeInMarket > .98 ? .15 : 0);
	return {
		finalEquity,
		totalReturn,
		cagr,
		sharpe,
		maxDd,
		trades,
		winRate,
		timeInMarket,
		fitness
	};
}
function backtest(bars, g) {
	const n = bars.length;
	const close = new Array(n);
	const high = new Array(n);
	const low = new Array(n);
	for (let i = 0; i < n; i++) {
		close[i] = bars[i].c;
		high[i] = bars[i].h;
		low[i] = bars[i].l;
	}
	const emaFast = g.entry === "ema_cross" || g.entry === "macd" || g.entry === "trend_rsi" ? emaSeries(close, g.fast) : null;
	const emaSlow = g.entry === "ema_cross" || g.entry === "macd" || g.confirmTrend || g.entry === "trend_rsi" ? emaSeries(close, g.slow) : null;
	const rsi = g.entry === "rsi_oversold" || g.entry === "trend_rsi" ? rsiSeries(close, g.rsiPeriod) : null;
	const macdLine = g.entry === "macd" && emaFast && emaSlow ? emaFast.map((v, i) => v - emaSlow[i]) : null;
	const macdSignal = macdLine ? emaSeries(Array.from(macdLine), Math.max(5, Math.round(g.fast * .7))) : null;
	let cash = START_EQUITY;
	let shares = 0;
	let entryPx = 0;
	let peakPx = 0;
	let held = 0;
	let trades = 0;
	let wins = 0;
	let daysIn = 0;
	const dailyRets = [];
	const equitySample = [];
	let prevEq = START_EQUITY;
	const inPos = () => shares > 0;
	const trendOk = (i) => {
		if (!g.confirmTrend) return true;
		if (emaSlow) return close[i] > emaSlow[i];
		const s = sma(close, g.slow, i);
		return Number.isFinite(s) && close[i] > s;
	};
	const entryAt = (i) => {
		if (i < 3) return false;
		if (!trendOk(i)) return false;
		switch (g.entry) {
			case "sma_cross": {
				const f0 = sma(close, g.fast, i - 1);
				const s0 = sma(close, g.slow, i - 1);
				const f1 = sma(close, g.fast, i);
				const s1 = sma(close, g.slow, i);
				return f0 <= s0 && f1 > s1;
			}
			case "ema_cross":
				if (!emaFast || !emaSlow) return false;
				return emaFast[i - 1] <= emaSlow[i - 1] && emaFast[i] > emaSlow[i];
			case "rsi_oversold":
				if (!rsi) return false;
				return rsi[i - 1] < g.rsiBuy && rsi[i] >= g.rsiBuy;
			case "breakout": {
				let m = -Infinity;
				const from = i - g.lookback;
				if (from < 0) return false;
				for (let k = from; k < i; k++) m = Math.max(m, high[k]);
				return close[i] > m;
			}
			case "macd":
				if (!macdLine || !macdSignal) return false;
				return macdLine[i - 1] <= macdSignal[i - 1] && macdLine[i] > macdSignal[i];
			case "bb_bounce": {
				const mean = sma(close, g.lookback, i);
				const sd = stdev(close, g.lookback, i, mean);
				if (!Number.isFinite(mean) || !Number.isFinite(sd)) return false;
				const lower = mean - g.bbMult * sd;
				return close[i - 1] < lower && close[i] >= lower;
			}
			case "trend_rsi":
				if (!rsi || !emaSlow) return false;
				return close[i] > emaSlow[i] && rsi[i] < g.rsiBuy + 8 && rsi[i] > rsi[i - 1];
			default: return false;
		}
	};
	const exitSignal = (i) => {
		switch (g.entry) {
			case "sma_cross": {
				const f1 = sma(close, g.fast, i);
				const s1 = sma(close, g.slow, i);
				return Number.isFinite(f1) && f1 < s1;
			}
			case "ema_cross": return !!(emaFast && emaSlow && emaFast[i] < emaSlow[i]);
			case "rsi_oversold":
			case "trend_rsi": return !!(rsi && rsi[i] > g.rsiSell);
			case "macd": return !!(macdLine && macdSignal && macdLine[i] < macdSignal[i]);
			case "breakout":
			case "bb_bounce": return false;
			default: return false;
		}
	};
	const sell = (px) => {
		if (shares <= 0) return;
		cash += shares * px * .999;
		trades += 1;
		if (px > entryPx) wins += 1;
		shares = 0;
		held = 0;
		entryPx = 0;
		peakPx = 0;
	};
	const buy = (px) => {
		const budget = cash * g.sizeFrac;
		if (budget < 10) return;
		const qty = budget / (px * 1.001);
		cash -= qty * px * 1.001;
		shares = qty;
		entryPx = px;
		peakPx = px;
		held = 0;
	};
	for (let i = 0; i < n; i++) {
		const px = close[i];
		if (inPos()) {
			daysIn += 1;
			held += 1;
			peakPx = Math.max(peakPx, high[i]);
			const sl = entryPx * (1 - g.stopLoss);
			if (low[i] <= sl) sell(sl);
			else if (g.takeProfit > 0 && high[i] >= entryPx * (1 + g.takeProfit)) sell(entryPx * (1 + g.takeProfit));
			else if (g.trailing > 0 && low[i] <= peakPx * (1 - g.trailing)) sell(peakPx * (1 - g.trailing));
			else if (held >= g.maxHold) sell(px);
			else if (exitSignal(i)) sell(px);
		}
		if (!inPos() && i < n - 1 && entryAt(i)) buy(px);
		const eq = cash + shares * px;
		dailyRets.push(eq / prevEq - 1);
		prevEq = eq;
		if (i % EQUITY_STEP === 0 || i === n - 1) equitySample.push(eq);
	}
	if (shares > 0) {
		sell(close[n - 1]);
		prevEq = cash;
		if (equitySample.length) equitySample[equitySample.length - 1] = prevEq;
	}
	return {
		metrics: scoreFromPath(prevEq, dailyRets, trades, wins, daysIn, n),
		equity: equitySample
	};
}
var PROTOCOL = {
	gen1Start: 100,
	gen1Cuts: [
		50,
		35,
		28
	],
	laterStart: 112,
	laterCuts: [
		56,
		41,
		28
	],
	offspringPerSurvivor: 3,
	eliteCount: 28
};
function cutsForGeneration(gen) {
	return gen <= 1 ? PROTOCOL.gen1Cuts : PROTOCOL.laterCuts;
}
function describeGenome(g) {
	const lines = [`Entrée · ${ENTRY_LABEL[g.entry]}`, `Fenêtres · rapide ${g.fast} / lente ${g.slow}`];
	if (g.entry === "rsi_oversold" || g.entry === "trend_rsi") lines.push(`RSI ${g.rsiPeriod} · achat ≤ ${g.rsiBuy} · vente ≥ ${g.rsiSell}`);
	if (g.entry === "breakout" || g.entry === "bb_bounce") lines.push(`Lookback ${g.lookback}${g.entry === "bb_bounce" ? ` · σ ${g.bbMult}` : ""}`);
	lines.push(`Stop ${Math.round(g.stopLoss * 100)} %` + (g.takeProfit > 0 ? ` · objectif ${Math.round(g.takeProfit * 100)} %` : " · sans objectif") + (g.trailing > 0 ? ` · trailing ${Math.round(g.trailing * 100)} %` : ""));
	lines.push(`Durée max ${g.maxHold} j · taille ${(g.sizeFrac * 100).toFixed(0)} % du cash`);
	if (g.confirmTrend) lines.push("Filtre de tendance · prix au-dessus de la lente");
	if (g.parentId) lines.push(`Lignée · ${g.parentId}`);
	return lines;
}
function seedPopulation(rng, gen, n) {
	const pop = [];
	for (let i = 0; i < n; i++) pop.push({
		genome: randomGenome(rng, gen),
		metrics: null,
		equity: null,
		status: "newborn"
	});
	return pop;
}
function reproduce(rng, elites, nextGen) {
	const parents = elites.map((e) => e.genome);
	const children = elites.map((e) => ({
		genome: { ...e.genome },
		metrics: null,
		equity: null,
		status: "alive"
	}));
	for (const p of parents) {
		children.push({
			genome: mutateGenome(rng, p, nextGen),
			metrics: null,
			equity: null,
			status: "newborn"
		});
		children.push({
			genome: mutateGenome(rng, p, nextGen),
			metrics: null,
			equity: null,
			status: "newborn"
		});
		const other = pick(rng, parents);
		children.push({
			genome: crossover(rng, p, other, nextGen),
			metrics: null,
			equity: null,
			status: "newborn"
		});
	}
	return children;
}
function cullTo(pop, keep) {
	return [...pop].sort((a, b) => (b.metrics?.fitness ?? -999) - (a.metrics?.fitness ?? -999)).map((ind, i) => ({
		...ind,
		status: i < keep ? "alive" : "culled"
	}));
}
function living(pop) {
	return pop.filter((p) => p.status !== "culled");
}
function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}
function fitnessTone(n) {
	if (n == null) return "text-muted";
	if (n >= 1.2) return "text-profit";
	if (n < 0) return "text-loss";
	return "text-fg";
}
function LabApp() {
	const [bars, setBars] = (0, import_react.useState)(null);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const [seed, setSeed] = (0, import_react.useState)(42);
	const [generation, setGeneration] = (0, import_react.useState)(1);
	const [tour, setTour] = (0, import_react.useState)(1);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [running, setRunning] = (0, import_react.useState)(false);
	const [population, setPopulation] = (0, import_react.useState)([]);
	const [log, setLog] = (0, import_react.useState)([]);
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [hall, setHall] = (0, import_react.useState)([]);
	const [tested, setTested] = (0, import_react.useState)(0);
	const [speed, setSpeed] = (0, import_react.useState)("fast");
	const [bhEquity, setBhEquity] = (0, import_react.useState)([]);
	const [bhMetrics, setBhMetrics] = (0, import_react.useState)(null);
	const runningRef = (0, import_react.useRef)(false);
	const popRef = (0, import_react.useRef)([]);
	const genRef = (0, import_react.useRef)(1);
	const tourRef = (0, import_react.useRef)(1);
	const barsRef = (0, import_react.useRef)(null);
	const rngRef = (0, import_react.useRef)(mulberry32(42));
	const logId = (0, import_react.useRef)(0);
	const loopRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		runningRef.current = running;
	}, [running]);
	(0, import_react.useEffect)(() => {
		popRef.current = population;
	}, [population]);
	(0, import_react.useEffect)(() => {
		genRef.current = generation;
	}, [generation]);
	(0, import_react.useEffect)(() => {
		tourRef.current = tour;
	}, [tour]);
	(0, import_react.useEffect)(() => {
		barsRef.current = bars;
	}, [bars]);
	const pushLog = (0, import_react.useCallback)((msg) => {
		logId.current += 1;
		setLog((l) => [{
			id: logId.current,
			msg
		}, ...l].slice(0, 80));
	}, []);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		fetch("/btc-daily.json").then((r) => {
			if (!r.ok) throw new Error("Données BTC introuvables");
			return r.json();
		}).then((data) => {
			if (cancelled) return;
			setBars(data);
			setBhEquity(buyHoldEquity(data));
			setBhMetrics(buyHoldMetrics(data));
		}).catch((e) => {
			if (!cancelled) setLoadError(e.message);
		});
		return () => {
			cancelled = true;
		};
	}, []);
	const delay = speed === "fast" ? 180 : 700;
	const evaluateAll = (0, import_react.useCallback)(async (pop, token) => {
		const data = barsRef.current;
		if (!data) return pop;
		const next = pop.map((p) => ({ ...p }));
		setTested(0);
		setPhase("testing");
		const batch = 8;
		for (let i = 0; i < next.length; i += batch) {
			if (!runningRef.current || loopRef.current !== token) return next;
			for (let j = i; j < Math.min(i + batch, next.length); j++) {
				const ind = next[j];
				const res = backtest(data, ind.genome);
				next[j] = {
					...ind,
					metrics: res.metrics,
					equity: res.equity,
					status: "alive"
				};
			}
			setPopulation([...next]);
			setTested(Math.min(i + batch, next.length));
			await sleep(0);
		}
		return next;
	}, []);
	const loop = (0, import_react.useCallback)(async (token) => {
		while (runningRef.current && loopRef.current === token) {
			if (!barsRef.current) return;
			let pop = popRef.current;
			const gen = genRef.current;
			const t = tourRef.current;
			const cuts = cutsForGeneration(gen);
			if (t <= 3) {
				if (pop.some((p) => !p.metrics)) {
					pushLog(`Génération ${gen} · tour ${t} — test sur 10 ans de BTC (${pop.filter((p) => p.status !== "culled").length} individus).`);
					pop = await evaluateAll(pop.map((p) => p.status === "culled" ? p : {
						...p,
						metrics: p.metrics
					}), token);
					if (!runningRef.current || loopRef.current !== token) return;
					popRef.current = pop;
					setPopulation(pop);
				}
				const keep = cuts[t - 1];
				setPhase("selecting");
				const after = cullTo(t === 1 ? pop : pop.filter((p) => p.status !== "culled"), keep);
				popRef.current = after;
				setPopulation(after);
				const best = after.find((p) => p.status === "alive");
				const dead = after.filter((p) => p.status === "culled").length;
				pushLog(`Tour ${t} — ${keep} survivent, ${dead} éliminés. Meilleur fitness ${best?.metrics ? best.metrics.fitness.toFixed(2) : "—"}.`);
				await sleep(delay);
				if (!runningRef.current || loopRef.current !== token) return;
				if (t < 3) {
					setTour(t + 1);
					tourRef.current = t + 1;
				} else {
					setTour(4);
					tourRef.current = 4;
				}
			} else {
				setPhase("evolving");
				const top = living(pop).slice().sort((a, b) => (b.metrics?.fitness ?? 0) - (a.metrics?.fitness ?? 0)).slice(0, PROTOCOL.eliteCount);
				pushLog(`Tour 4 — reproduction. ${top.length} survivants × ${PROTOCOL.offspringPerSurvivor} descendants → ${top.length + top.length * PROTOCOL.offspringPerSurvivor} individus.`);
				await sleep(delay);
				if (!runningRef.current || loopRef.current !== token) return;
				const nextGen = gen + 1;
				const children = reproduce(rngRef.current, top, nextGen);
				popRef.current = children;
				setPopulation(children);
				setGeneration(nextGen);
				genRef.current = nextGen;
				setTour(1);
				tourRef.current = 1;
				setPhase("testing");
				pushLog(`Génération ${nextGen} lancée · ${children.length} individus.`);
			}
		}
	}, [
		delay,
		evaluateAll,
		pushLog
	]);
	const start = (0, import_react.useCallback)(() => {
		if (!bars) return;
		if (population.length === 0) {
			rngRef.current = mulberry32(seed);
			const pop = seedPopulation(rngRef.current, 1, PROTOCOL.gen1Start);
			popRef.current = pop;
			setPopulation(pop);
			setGeneration(1);
			genRef.current = 1;
			setTour(1);
			tourRef.current = 1;
			pushLog(`Génération 1 · ${PROTOCOL.gen1Start} individus aléatoires. Graine ${seed}.`);
		}
		loopRef.current += 1;
		runningRef.current = true;
		setRunning(true);
		loop(loopRef.current);
	}, [
		bars,
		loop,
		population.length,
		pushLog,
		seed
	]);
	const pause = (0, import_react.useCallback)(() => {
		runningRef.current = false;
		setRunning(false);
		setPhase("idle");
	}, []);
	const reset = (0, import_react.useCallback)(() => {
		runningRef.current = false;
		loopRef.current += 1;
		setRunning(false);
		setPhase("idle");
		setPopulation([]);
		popRef.current = [];
		setGeneration(1);
		setTour(1);
		setTested(0);
		setSelectedId(null);
		setLog([]);
		rngRef.current = mulberry32(seed);
		pushLog("Population réinitialisée.");
	}, [pushLog, seed]);
	const pinBest = (0, import_react.useCallback)(() => {
		const best = living(population).filter((p) => p.metrics).sort((a, b) => b.metrics.fitness - a.metrics.fitness)[0];
		if (!best) return;
		setHall((h) => {
			if (h.some((x) => x.genome.id === best.genome.id)) return h;
			return [best, ...h].slice(0, 12);
		});
		pushLog(`Individu ${best.genome.id} conservé dans le hall.`);
	}, [population, pushLog]);
	const alive = (0, import_react.useMemo)(() => living(population).sort((a, b) => (b.metrics?.fitness ?? -999) - (a.metrics?.fitness ?? -999)), [population]);
	const culledCount = population.filter((p) => p.status === "culled").length;
	const best = alive[0] ?? null;
	const selected = population.find((p) => p.genome.id === selectedId) ?? best;
	const chartData = (0, import_react.useMemo)(() => {
		if (!bars || !bhEquity.length) return [];
		const eq = selected?.equity ?? best?.equity;
		const n = bhEquity.length;
		const startT = bars[0].t;
		const endT = bars[bars.length - 1].t;
		return bhEquity.map((bh, i) => {
			const t = startT + (endT - startT) * i / Math.max(1, n - 1);
			return {
				i,
				year: new Date(t).getFullYear(),
				bh: Math.round(bh),
				strat: eq ? Math.round(eq[Math.min(i, eq.length - 1)] ?? 0) : void 0
			};
		});
	}, [
		bars,
		best?.equity,
		bhEquity,
		selected?.equity
	]);
	const rangeLabel = bars ? `${new Date(bars[0].t).toLocaleDateString("fr-FR")} → ${new Date(bars[bars.length - 1].t).toLocaleDateString("fr-FR")} · ${bars.length} jours` : "Chargement des 10 ans…";
	const cuts = cutsForGeneration(generation);
	const popTarget = generation === 1 && tour <= 3 && population.length <= 100 ? PROTOCOL.gen1Start : PROTOCOL.laterStart;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border px-4 py-4 sm:px-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs tracking-[0.18em] text-muted uppercase",
						children: "Laboratoire · long only"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-sans text-3xl font-semibold tracking-[-0.03em] sm:text-4xl",
						children: "Darwin Long"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm leading-relaxed text-muted text-pretty",
						children: "Population d’algorithmes qui n’achètent que le BTC. Les faibles sont éliminés, les forts se reproduisent — jusqu’à ce qu’une génération tienne la route."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						!running ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: start,
							disabled: !bars,
							className: "min-w-36",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {}), population.length ? "Reprendre" : "Lancer gen. 1"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: pause,
							variant: "outline",
							className: "min-w-36",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {}), "Pause"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: pinBest,
							variant: "outline",
							disabled: !best,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, {}), "Garder le meilleur"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: reset,
							variant: "ghost",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}), "Reset"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: speed === "fast" ? "default" : "outline",
							size: "sm",
							onClick: () => setSpeed((s) => s === "fast" ? "normal" : "fast"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FastForward, {}), speed === "fast" ? "Rapide" : "Lent"]
						})
					]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto grid max-w-[1400px] gap-4 overflow-x-hidden px-4 py-4 sm:px-6 lg:grid-cols-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-12 lg:grid-cols-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Génération",
							value: String(generation)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Tour",
							value: `${tour} / 4`,
							hint: tour === 4 ? "Évolution" : "Test 10 ans BTC"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Population",
							value: String(living(population).length || (phase === "idle" ? popTarget : 0))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Éliminés",
							value: String(culledCount)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Meilleur",
							value: best?.metrics ? best.metrics.fitness.toFixed(2) : "—",
							tone: fitnessTone(best?.metrics?.fitness)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Buy & hold",
							value: bhMetrics ? formatPct(bhMetrics.totalReturn, 0) : "—",
							hint: "même période"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "min-w-0 rounded-xl border border-border bg-surface p-4 lg:col-span-8 lg:rounded-[28px] lg:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 flex flex-wrap items-end justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium",
								children: "Courbe d’équité · 10 000 $ de départ"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-xs text-muted",
								children: rangeLabel
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-4 font-mono text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "inline-block size-2 rounded-full bg-accent" }), "Stratégie"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "inline-block size-2 rounded-full bg-hold" }), "Buy & hold"]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-64 sm:h-80",
							children: loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-loss",
								children: loadError
							}) : !bars ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Chargement de l’historique BTC…"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
								width: "100%",
								height: "100%",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
									data: chartData,
									margin: {
										top: 8,
										right: 8,
										left: 0,
										bottom: 0
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
											stroke: "color-mix(in oklab, var(--color-fg) 8%, transparent)",
											vertical: false
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
											dataKey: "year",
											interval: "preserveStartEnd",
											tick: {
												fill: "var(--color-muted)",
												fontSize: 11,
												fontFamily: "var(--font-mono)"
											},
											tickLine: false,
											axisLine: false,
											minTickGap: 40
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
											tick: {
												fill: "var(--color-muted)",
												fontSize: 11,
												fontFamily: "var(--font-mono)"
											},
											tickLine: false,
											axisLine: false,
											width: 64,
											tickFormatter: (v) => v >= 1e6 ? `${Math.round(v / 1e6)} M` : v >= 1e3 ? `${Math.round(v / 1e3)} k` : String(v)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
											contentStyle: {
												background: "#121214",
												border: "1px solid color-mix(in oklab, #ececec 12%, transparent)",
												borderRadius: 12,
												fontFamily: "var(--font-mono)",
												fontSize: 12
											},
											formatter: (value, name) => [formatUsd(Number(value)), name === "strat" ? "Stratégie" : "Buy & hold"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
											type: "monotone",
											dataKey: "bh",
											stroke: "var(--color-hold)",
											dot: false,
											strokeWidth: 1.25,
											isAnimationActive: false
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
											type: "monotone",
											dataKey: "strat",
											stroke: "var(--color-accent)",
											dot: false,
											strokeWidth: 2,
											isAnimationActive: false
										})
									]
								})
							})
						}),
						phase === "testing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 font-mono text-xs text-muted",
							children: [
								"Test ",
								tested,
								" / ",
								living(population).length || population.length
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "flex min-w-0 flex-col gap-3 lg:col-span-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-surface p-4 lg:rounded-[28px] lg:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium",
								children: "Protocole"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
								className: "mt-3 space-y-2",
								children: [cuts.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: cn("flex items-center justify-between rounded-md px-3 py-2 text-sm", tour === i + 1 ? "bg-raised text-fg" : "text-muted"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"Tour ",
										i + 1,
										" · test 10 ans"
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono tabular-nums",
										children: [n, " survivent"]
									})]
								}, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: cn("flex items-center justify-between rounded-md px-3 py-2 text-sm", tour === 4 ? "bg-raised text-fg" : "text-muted"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Tour 4 · reproduction" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono tabular-nums",
										children: ["×", PROTOCOL.offspringPerSurvivor]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-xs leading-relaxed text-muted",
								children: "Frais 0,10 % · long uniquement · stop / objectif / trailing. Les 28 élites restent, chaque survivant produit 3 descendants."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex items-center justify-between gap-3 text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Graine" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "icon",
											className: "size-11",
											disabled: running || population.length > 0,
											onClick: () => setSeed((s) => Math.max(1, s - 1)),
											"aria-label": "Diminuer la graine",
											children: "−"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w-14 text-center font-mono text-sm text-fg tabular-nums",
											children: seed
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "icon",
											className: "size-11",
											disabled: running || population.length > 0,
											onClick: () => setSeed((s) => s + 1),
											"aria-label": "Augmenter la graine",
											children: "+"
										})
									]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-56 overflow-auto rounded-xl border border-border bg-surface p-4 lg:rounded-[20px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium",
							children: "Journal"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-2 space-y-1.5",
							children: [log.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-muted",
								children: "En attente du premier tour."
							}), log.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "font-mono text-xs leading-relaxed text-muted",
								children: row.msg
							}, row.id))]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "min-w-0 rounded-xl border border-border bg-surface p-4 lg:col-span-7 lg:rounded-[28px] lg:p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium",
							children: "Population vivante"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono text-xs text-muted",
							children: [alive.length, " individus"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[640px] text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "font-mono text-[11px] tracking-wide text-muted uppercase",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-3 font-medium",
											children: "ID"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-3 font-medium",
											children: "Entrée"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-3 font-medium",
											children: "Retour"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-3 font-medium",
											children: "Sharpe"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-3 font-medium",
											children: "Max DD"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 pr-3 font-medium",
											children: "Trades"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2 font-medium",
											children: "Fitness"
										})
									]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [alive.slice(0, 28).map((ind) => {
								const m = ind.metrics;
								const active = (selected?.genome.id ?? "") === ind.genome.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									onClick: () => setSelectedId(ind.genome.id),
									className: cn("cursor-pointer border-b border-border/60 transition-colors duration-[var(--motion-quick)]", active ? "bg-raised" : "hover:bg-raised/60", ind.status === "newborn" && !m ? "text-muted" : ""),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2.5 pr-3 font-mono text-xs",
											children: ind.genome.id
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2.5 pr-3",
											children: ENTRY_LABEL[ind.genome.entry]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: cn("py-2.5 pr-3 font-mono tabular-nums", m && m.totalReturn >= 0 ? "text-profit" : "text-loss"),
											children: m ? formatPct(m.totalReturn, 0) : "…"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2.5 pr-3 font-mono tabular-nums",
											children: m ? formatNum(m.sharpe, 2) : "…"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2.5 pr-3 font-mono tabular-nums",
											children: m ? formatPct(m.maxDd, 0) : "…"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2.5 pr-3 font-mono tabular-nums",
											children: m ? m.trades : "…"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: cn("py-2.5 font-mono tabular-nums", fitnessTone(m?.fitness)),
											children: m ? m.fitness.toFixed(2) : "…"
										})
									]
								}, ind.genome.id);
							}), alive.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 7,
								className: "py-8 text-center text-sm text-muted",
								children: "Lance la génération 1 pour créer 100 individus."
							}) })] })]
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "min-w-0 rounded-xl border border-border bg-surface p-4 lg:col-span-5 lg:rounded-[28px] lg:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dna, { className: "size-4 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium",
								children: "ADN sélectionné"
							})]
						}),
						selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-mono text-xs text-muted",
								children: [
									selected.genome.id,
									" · gen ",
									selected.genome.gen,
									selected.status === "culled" ? " · éliminé" : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-1.5 text-sm leading-relaxed",
								children: describeGenome(selected.genome).map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, line))
							}),
							selected.metrics && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mt-4 grid grid-cols-2 gap-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
										k: "Équité finale",
										v: formatUsd(selected.metrics.finalEquity)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
										k: "CAGR",
										v: formatPct(selected.metrics.cagr)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
										k: "Taux de gains",
										v: formatPct(selected.metrics.winRate)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
										k: "Temps en position",
										v: formatPct(selected.metrics.timeInMarket)
									})
								]
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Aucun individu sélectionné."
						}),
						hall.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 border-t border-border pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-xs font-medium tracking-wide text-muted uppercase",
								children: "Hall — générations intéressantes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 space-y-2",
								children: hall.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setSelectedId(h.genome.id),
									className: "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-raised",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs",
										children: h.genome.id
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("font-mono tabular-nums", fitnessTone(h.metrics?.fitness)),
										children: h.metrics ? formatPct(h.metrics.totalReturn, 0) : "—"
									})]
								}) }, h.genome.id))
							})]
						})
					]
				}),
				culledCount > 0 && tour <= 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-2 px-1 text-xs text-muted lg:col-span-12",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skull, { className: "size-3.5" }),
						culledCount,
						" individus éliminés ce tour — ils ne se reproduisent pas."
					]
				})
			]
		})]
	});
}
function Stat({ label, value, hint, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-surface px-4 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[11px] tracking-wide text-muted uppercase",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("mt-1 font-mono text-xl tabular-nums", tone ?? "text-fg"),
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-xs text-subtle",
				children: hint
			}) : null
		]
	});
}
function Mini({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-raised px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "font-mono text-sm tabular-nums",
			children: v
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabApp, {});
}
//#endregion
export { Home as component };
