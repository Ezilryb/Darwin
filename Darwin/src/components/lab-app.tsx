import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dna,
  FastForward,
  Pause,
  Pin,
  Play,
  RotateCcw,
  Skull,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type Bar,
  type Individual,
  PROTOCOL,
  backtest,
  buyHoldEquity,
  buyHoldMetrics,
  cullTo,
  cutsForGeneration,
  describeGenome,
  ENTRY_LABEL,
  living,
  mulberry32,
  reproduce,
  seedPopulation,
  type Metrics,
} from "@/lib/evolve";
import { cn, formatNum, formatPct, formatUsd } from "@/lib/utils";

type Phase = "idle" | "testing" | "selecting" | "evolving";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function fitnessTone(n: number | undefined) {
  if (n == null) return "text-muted";
  if (n >= 1.2) return "text-profit";
  if (n < 0) return "text-loss";
  return "text-fg";
}

export function LabApp() {
  const [bars, setBars] = useState<Bar[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [seed, setSeed] = useState(42);
  const [generation, setGeneration] = useState(1);
  const [tour, setTour] = useState(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [population, setPopulation] = useState<Individual[]>([]);
  const [log, setLog] = useState<{ id: number; msg: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hall, setHall] = useState<Individual[]>([]);
  const [tested, setTested] = useState(0);
  const [speed, setSpeed] = useState<"normal" | "fast">("fast");
  const [bhEquity, setBhEquity] = useState<number[]>([]);
  const [bhMetrics, setBhMetrics] = useState<Metrics | null>(null);

  const runningRef = useRef(false);
  const popRef = useRef<Individual[]>([]);
  const genRef = useRef(1);
  const tourRef = useRef(1);
  const barsRef = useRef<Bar[] | null>(null);
  const rngRef = useRef(mulberry32(42));
  const logId = useRef(0);
  const loopRef = useRef(0);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    popRef.current = population;
  }, [population]);
  useEffect(() => {
    genRef.current = generation;
  }, [generation]);
  useEffect(() => {
    tourRef.current = tour;
  }, [tour]);
  useEffect(() => {
    barsRef.current = bars;
  }, [bars]);

  const pushLog = useCallback((msg: string) => {
    logId.current += 1;
    setLog((l) => [{ id: logId.current, msg }, ...l].slice(0, 80));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/btc-daily.json")
      .then((r) => {
        if (!r.ok) throw new Error("Données BTC introuvables");
        return r.json();
      })
      .then((data: Bar[]) => {
        if (cancelled) return;
        setBars(data);
        setBhEquity(buyHoldEquity(data));
        setBhMetrics(buyHoldMetrics(data));
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const delay = speed === "fast" ? 180 : 700;

  const evaluateAll = useCallback(
    async (pop: Individual[], token: number) => {
      const data = barsRef.current;
      if (!data) return pop;
      const next = pop.map((p) => ({ ...p }));
      setTested(0);
      setPhase("testing");
      const batch = 8;
      for (let i = 0; i < next.length; i += batch) {
        if (!runningRef.current || loopRef.current !== token) return next;
        for (let j = i; j < Math.min(i + batch, next.length); j++) {
          const ind = next[j]!;
          const res = backtest(data, ind.genome);
          next[j] = { ...ind, metrics: res.metrics, equity: res.equity, status: "alive" };
        }
        setPopulation([...next]);
        setTested(Math.min(i + batch, next.length));
        await sleep(0);
      }
      return next;
    },
    [],
  );

  const loop = useCallback(
    async (token: number) => {
      while (runningRef.current && loopRef.current === token) {
        const data = barsRef.current;
        if (!data) return;
        let pop = popRef.current;
        const gen = genRef.current;
        const t = tourRef.current;
        const cuts = cutsForGeneration(gen);

        if (t <= 3) {
          const needsTest = pop.some((p) => !p.metrics);
          if (needsTest) {
            pushLog(
              `Génération ${gen} · tour ${t} — test sur 10 ans de BTC (${pop.filter((p) => p.status !== "culled").length} individus).`,
            );
            pop = await evaluateAll(
              pop.map((p) => (p.status === "culled" ? p : { ...p, metrics: p.metrics })),
              token,
            );
            if (!runningRef.current || loopRef.current !== token) return;
            popRef.current = pop;
            setPopulation(pop);
          }
          const keep = cuts[t - 1]!;
          setPhase("selecting");
          const base = t === 1 ? pop : pop.filter((p) => p.status !== "culled");
          const after = cullTo(base, keep);
          popRef.current = after;
          setPopulation(after);
          const best = after.find((p) => p.status === "alive");
          const dead = after.filter((p) => p.status === "culled").length;
          pushLog(
            `Tour ${t} — ${keep} survivent, ${dead} éliminés. Meilleur fitness ${best?.metrics ? best.metrics.fitness.toFixed(2) : "—"}.`,
          );
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
          const elites = living(pop).slice().sort((a, b) => (b.metrics?.fitness ?? 0) - (a.metrics?.fitness ?? 0));
          const top = elites.slice(0, PROTOCOL.eliteCount);
          pushLog(
            `Tour 4 — reproduction. ${top.length} survivants × ${PROTOCOL.offspringPerSurvivor} descendants → ${top.length + top.length * PROTOCOL.offspringPerSurvivor} individus.`,
          );
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
    },
    [delay, evaluateAll, pushLog],
  );

  const start = useCallback(() => {
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
    void loop(loopRef.current);
  }, [bars, loop, population.length, pushLog, seed]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setPhase("idle");
  }, []);

  const reset = useCallback(() => {
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

  const pinBest = useCallback(() => {
    const alive = living(population)
      .filter((p) => p.metrics)
      .sort((a, b) => (b.metrics!.fitness) - (a.metrics!.fitness));
    const best = alive[0];
    if (!best) return;
    setHall((h) => {
      if (h.some((x) => x.genome.id === best.genome.id)) return h;
      return [best, ...h].slice(0, 12);
    });
    pushLog(`Individu ${best.genome.id} conservé dans le hall.`);
  }, [population, pushLog]);

  const alive = useMemo(
    () =>
      living(population).sort(
        (a, b) => (b.metrics?.fitness ?? -999) - (a.metrics?.fitness ?? -999),
      ),
    [population],
  );
  const culledCount = population.filter((p) => p.status === "culled").length;
  const best = alive[0] ?? null;
  const selected = population.find((p) => p.genome.id === selectedId) ?? best;

  const chartData = useMemo(() => {
    if (!bars || !bhEquity.length) return [];
    const eq = selected?.equity ?? best?.equity;
    const n = bhEquity.length;
    const startT = bars[0]!.t;
    const endT = bars[bars.length - 1]!.t;
    return bhEquity.map((bh, i) => {
      const t = startT + ((endT - startT) * i) / Math.max(1, n - 1);
      return {
        i,
        year: new Date(t).getFullYear(),
        bh: Math.round(bh),
        strat: eq ? Math.round(eq[Math.min(i, eq.length - 1)] ?? 0) : undefined,
      };
    });
  }, [bars, best?.equity, bhEquity, selected?.equity]);

  const rangeLabel = bars
    ? `${new Date(bars[0]!.t).toLocaleDateString("fr-FR")} → ${new Date(bars[bars.length - 1]!.t).toLocaleDateString("fr-FR")} · ${bars.length} jours`
    : "Chargement des 10 ans…";

  const cuts = cutsForGeneration(generation);
  const popTarget = generation === 1 && tour <= 3 && population.length <= 100 ? PROTOCOL.gen1Start : PROTOCOL.laterStart;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">Laboratoire · long only</p>
            <h1 className="mt-1 font-sans text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Darwin Long</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted text-pretty">
              Population d’algorithmes qui n’achètent que le BTC. Les faibles sont éliminés, les forts se reproduisent — jusqu’à ce qu’une génération tienne la route.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!running ? (
              <Button onClick={start} disabled={!bars} className="min-w-36">
                <Play />
                {population.length ? "Reprendre" : "Lancer gen. 1"}
              </Button>
            ) : (
              <Button onClick={pause} variant="outline" className="min-w-36">
                <Pause />
                Pause
              </Button>
            )}
            <Button onClick={pinBest} variant="outline" disabled={!best}>
              <Pin />
              Garder le meilleur
            </Button>
            <Button onClick={reset} variant="ghost">
              <RotateCcw />
              Reset
            </Button>
            <Button
              variant={speed === "fast" ? "default" : "outline"}
              size="sm"
              onClick={() => setSpeed((s) => (s === "fast" ? "normal" : "fast"))}
            >
              <FastForward />
              {speed === "fast" ? "Rapide" : "Lent"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-4 overflow-x-hidden px-4 py-4 sm:px-6 lg:grid-cols-12">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-12 lg:grid-cols-6">
          <Stat label="Génération" value={String(generation)} />
          <Stat label="Tour" value={`${tour} / 4`} hint={tour === 4 ? "Évolution" : "Test 10 ans BTC"} />
          <Stat label="Population" value={String(living(population).length || (phase === "idle" ? popTarget : 0))} />
          <Stat label="Éliminés" value={String(culledCount)} />
          <Stat
            label="Meilleur"
            value={best?.metrics ? best.metrics.fitness.toFixed(2) : "—"}
            tone={fitnessTone(best?.metrics?.fitness)}
          />
          <Stat
            label="Buy & hold"
            value={bhMetrics ? formatPct(bhMetrics.totalReturn, 0) : "—"}
            hint="même période"
          />
        </section>

        <section className="min-w-0 rounded-xl border border-border bg-surface p-4 lg:col-span-8 lg:rounded-[28px] lg:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">Courbe d’équité · 10 000 $ de départ</h2>
              <p className="font-mono text-xs text-muted">{rangeLabel}</p>
            </div>
            <div className="flex gap-4 font-mono text-xs text-muted">
              <span className="flex items-center gap-2">
                <i className="inline-block size-2 rounded-full bg-accent" />
                Stratégie
              </span>
              <span className="flex items-center gap-2">
                <i className="inline-block size-2 rounded-full bg-hold" />
                Buy & hold
              </span>
            </div>
          </div>
          <div className="h-64 sm:h-80">
            {loadError ? (
              <p className="text-sm text-loss">{loadError}</p>
            ) : !bars ? (
              <p className="text-sm text-muted">Chargement de l’historique BTC…</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="color-mix(in oklab, var(--color-fg) 8%, transparent)" vertical={false} />
                  <XAxis
                    dataKey="year"
                    interval="preserveStartEnd"
                    tick={{ fill: "var(--color-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={40}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    width={64}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000 ? `${Math.round(v / 1_000_000)} M` : v >= 1000 ? `${Math.round(v / 1000)} k` : String(v)
                    }
                  />
                  <RTooltip
                    contentStyle={{
                      background: "#121214",
                      border: "1px solid color-mix(in oklab, #ececec 12%, transparent)",
                      borderRadius: 12,
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [
                      formatUsd(Number(value)),
                      name === "strat" ? "Stratégie" : "Buy & hold",
                    ]}
                  />
                  <Line type="monotone" dataKey="bh" stroke="var(--color-hold)" dot={false} strokeWidth={1.25} isAnimationActive={false} />
                  <Line type="monotone" dataKey="strat" stroke="var(--color-accent)" dot={false} strokeWidth={2} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          {phase === "testing" && (
            <p className="mt-3 font-mono text-xs text-muted">
              Test {tested} / {living(population).length || population.length}
            </p>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-3 lg:col-span-4">
          <div className="rounded-xl border border-border bg-surface p-4 lg:rounded-[28px] lg:p-5">
            <h2 className="text-sm font-medium">Protocole</h2>
            <ol className="mt-3 space-y-2">
              {cuts.map((n, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                    tour === i + 1 ? "bg-raised text-fg" : "text-muted",
                  )}
                >
                  <span>Tour {i + 1} · test 10 ans</span>
                  <span className="font-mono tabular-nums">{n} survivent</span>
                </li>
              ))}
              <li
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                  tour === 4 ? "bg-raised text-fg" : "text-muted",
                )}
              >
                <span>Tour 4 · reproduction</span>
                <span className="font-mono tabular-nums">×{PROTOCOL.offspringPerSurvivor}</span>
              </li>
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Frais 0,10 % · long uniquement · stop / objectif / trailing. Les 28 élites restent, chaque survivant produit 3 descendants.
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
              <span>Graine</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11"
                  disabled={running || population.length > 0}
                  onClick={() => setSeed((s) => Math.max(1, s - 1))}
                  aria-label="Diminuer la graine"
                >
                  −
                </Button>
                <span className="w-14 text-center font-mono text-sm text-fg tabular-nums">{seed}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11"
                  disabled={running || population.length > 0}
                  onClick={() => setSeed((s) => s + 1)}
                  aria-label="Augmenter la graine"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          <div className="max-h-56 overflow-auto rounded-xl border border-border bg-surface p-4 lg:rounded-[20px]">
            <h2 className="text-sm font-medium">Journal</h2>
            <ul className="mt-2 space-y-1.5">
              {log.length === 0 && <li className="text-sm text-muted">En attente du premier tour.</li>}
              {log.map((row) => (
                <li key={row.id} className="font-mono text-xs leading-relaxed text-muted">
                  {row.msg}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="min-w-0 rounded-xl border border-border bg-surface p-4 lg:col-span-7 lg:rounded-[28px] lg:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Population vivante</h2>
            <span className="font-mono text-xs text-muted">{alive.length} individus</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="font-mono text-[11px] tracking-wide text-muted uppercase">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">ID</th>
                  <th className="py-2 pr-3 font-medium">Entrée</th>
                  <th className="py-2 pr-3 font-medium">Retour</th>
                  <th className="py-2 pr-3 font-medium">Sharpe</th>
                  <th className="py-2 pr-3 font-medium">Max DD</th>
                  <th className="py-2 pr-3 font-medium">Trades</th>
                  <th className="py-2 font-medium">Fitness</th>
                </tr>
              </thead>
              <tbody>
                {alive.slice(0, 28).map((ind) => {
                  const m = ind.metrics;
                  const active = (selected?.genome.id ?? "") === ind.genome.id;
                  return (
                    <tr
                      key={ind.genome.id}
                      onClick={() => setSelectedId(ind.genome.id)}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors duration-[var(--motion-quick)]",
                        active ? "bg-raised" : "hover:bg-raised/60",
                        ind.status === "newborn" && !m ? "text-muted" : "",
                      )}
                    >
                      <td className="py-2.5 pr-3 font-mono text-xs">{ind.genome.id}</td>
                      <td className="py-2.5 pr-3">{ENTRY_LABEL[ind.genome.entry]}</td>
                      <td className={cn("py-2.5 pr-3 font-mono tabular-nums", m && m.totalReturn >= 0 ? "text-profit" : "text-loss")}>
                        {m ? formatPct(m.totalReturn, 0) : "…"}
                      </td>
                      <td className="py-2.5 pr-3 font-mono tabular-nums">{m ? formatNum(m.sharpe, 2) : "…"}</td>
                      <td className="py-2.5 pr-3 font-mono tabular-nums">{m ? formatPct(m.maxDd, 0) : "…"}</td>
                      <td className="py-2.5 pr-3 font-mono tabular-nums">{m ? m.trades : "…"}</td>
                      <td className={cn("py-2.5 font-mono tabular-nums", fitnessTone(m?.fitness))}>
                        {m ? m.fitness.toFixed(2) : "…"}
                      </td>
                    </tr>
                  );
                })}
                {alive.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted">
                      Lance la génération 1 pour créer 100 individus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-border bg-surface p-4 lg:col-span-5 lg:rounded-[28px] lg:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Dna className="size-4 text-muted" />
            <h2 className="text-sm font-medium">ADN sélectionné</h2>
          </div>
          {selected ? (
            <div>
              <p className="font-mono text-xs text-muted">
                {selected.genome.id} · gen {selected.genome.gen}
                {selected.status === "culled" ? " · éliminé" : ""}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed">
                {describeGenome(selected.genome).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {selected.metrics && (
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Mini k="Équité finale" v={formatUsd(selected.metrics.finalEquity)} />
                  <Mini k="CAGR" v={formatPct(selected.metrics.cagr)} />
                  <Mini k="Taux de gains" v={formatPct(selected.metrics.winRate)} />
                  <Mini k="Temps en position" v={formatPct(selected.metrics.timeInMarket)} />
                </dl>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">Aucun individu sélectionné.</p>
          )}

          {hall.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-xs font-medium tracking-wide text-muted uppercase">Hall — générations intéressantes</h3>
              <ul className="mt-2 space-y-2">
                {hall.map((h) => (
                  <li key={h.genome.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(h.genome.id)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-raised"
                    >
                      <span className="font-mono text-xs">{h.genome.id}</span>
                      <span className={cn("font-mono tabular-nums", fitnessTone(h.metrics?.fitness))}>
                        {h.metrics ? formatPct(h.metrics.totalReturn, 0) : "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {culledCount > 0 && tour <= 3 && (
          <p className="flex items-center gap-2 px-1 text-xs text-muted lg:col-span-12">
            <Skull className="size-3.5" />
            {culledCount} individus éliminés ce tour — ils ne se reproduisent pas.
          </p>
        )}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="font-mono text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <p className={cn("mt-1 font-mono text-xl tabular-nums", tone ?? "text-fg")}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-raised px-3 py-2">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="font-mono text-sm tabular-nums">{v}</dd>
    </div>
  );
}
