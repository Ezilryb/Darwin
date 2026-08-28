// public/app.js
// Logique de l'interface : appelle l'API du serveur, met à jour les cartes,
// dessine la courbe d'équité, alimente le journal en direct via SSE.

const el = (id) => document.getElementById(id);

const btnRun = el('btn-run');
const btnRunLabel = el('btn-run-label');
const btnSurvivors = el('btn-survivors');
const btnReset = el('btn-reset');
const toggleFast = el('toggle-fast');
const dataWarning = el('data-warning');

const statGeneration = el('stat-generation');
const statTour = el('stat-tour');
const statPopulation = el('stat-population');
const statEliminated = el('stat-eliminated');
const statBest = el('stat-best');
const statBuyhold = el('stat-buyhold');

const journalEl = el('journal');
const protocolRows = document.querySelectorAll('.protocol-row');
const seedInput = el('seed-value');
const seedMinus = el('seed-minus');
const seedPlus = el('seed-plus');

const chartMeta = el('chart-meta');
const chartEmpty = el('chart-empty');
const chartCanvas = el('equity-chart');

const popTableBody = el('pop-table-body');
const populationCount = el('population-count');
const dnaPanel = el('dna-panel');

let currentGeneration = 0;
let selectedIndividualId = null;
let lastCurves = null; // { strategy: [...], buyHold: [...] }

// ---------- Formatting helpers ----------
const fmtPctShort = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`);
const fmtNum = (v) => (v == null ? '—' : v.toLocaleString('fr-FR'));
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

function signClass(v) {
  if (v == null) return '';
  return v >= 0 ? 'positive' : 'negative';
}

// ---------- Journal ----------
function addJournalLine(message, cls = '') {
  const line = document.createElement('div');
  line.className = `journal-line ${cls}`;
  const ts = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  line.innerHTML = `<span class="ts">${ts}</span>${escapeHtml(message)}`;
  journalEl.appendChild(line);
  journalEl.scrollTop = journalEl.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- SSE ----------
function connectStream() {
  const source = new EventSource('/api/stream');
  source.onmessage = (e) => {
    const evt = JSON.parse(e.data);
    if (evt.type === 'log') {
      addJournalLine(evt.message);
      const m = evt.message.match(/^Tour (\d)/);
      if (m) statTour.textContent = `${m[1]} / 4`;
    } else if (evt.type === 'error') {
      addJournalLine(`Erreur : ${evt.message}`, 'error');
    } else if (evt.type === 'done') {
      addJournalLine(`Génération ${evt.generation} terminée.`, 'success');
    }
  };
  source.onerror = () => {
    // le navigateur retente automatiquement la connexion
  };
}

// ---------- Data status ----------
async function refreshDataStatus() {
  const res = await fetch('/api/data-status');
  const data = await res.json();
  dataWarning.classList.toggle('hidden', data.available);
  if (data.available) {
    chartMeta.textContent = `${fmtDate(data.from)} → ${fmtDate(data.to)} · ${data.count} jours`;
  }
  return data.available;
}

// ---------- State ----------
async function refreshState() {
  const res = await fetch('/api/state');
  const state = await res.json();
  currentGeneration = state.generation;
  statGeneration.textContent = state.generation || 0;
  statPopulation.textContent = fmtNum(state.populationSize);
  seedInput.value = state.seed;
  btnRunLabel.textContent = state.generation > 0 ? `Lancer gén. ${state.generation + 1}` : 'Lancer gén. 1';
  if (state.lastResult) applyResult(state.lastResult, { silent: true });
  return state;
}

// ---------- Apply a generation result to the whole UI ----------
function applyResult(result) {
  statGeneration.textContent = result.generation;
  statTour.textContent = '4 / 4';
  statPopulation.textContent = fmtNum(result.elites.length * 4); // 28 élites + 3 enfants chacune
  statEliminated.textContent = fmtNum(result.eliminated);

  statBest.textContent = fmtPctShort(result.bestReturnPct);
  statBest.className = `stat-value ${signClass(result.bestReturnPct)}`;

  statBuyhold.textContent = fmtPctShort(result.buyAndHoldPct);

  updateProtocol(result.tours);
  renderPopulationTable(result.elites);
  drawChart(result.strategyEquityCurve, result.buyAndHoldEquityCurve);

  btnRunLabel.textContent = `Lancer gén. ${result.generation + 1}`;
}

function updateProtocol(tours) {
  protocolRows.forEach((row) => row.classList.remove('active'));
  for (const t of tours) {
    const row = document.querySelector(`.protocol-row[data-tour="${t.tour}"]`);
    if (!row) continue;
    row.classList.add('active');
    const resultEl = row.querySelector('.protocol-result');
    if (t.tour === 4) {
      const ratio = t.elites > 0 ? Math.round(t.children / t.elites) : 0;
      resultEl.textContent = `×${ratio} → ${t.children} descendants`;
    } else {
      resultEl.textContent = `${t.survivors} survivent`;
    }
    resultEl.classList.add('done');
  }
}

// ---------- Population table ----------
function renderPopulationTable(elites) {
  if (!elites.length) {
    popTableBody.innerHTML = `<tr><td colspan="7" class="empty-row">Aucun survivant.</td></tr>`;
    return;
  }
  const sorted = [...elites].sort((a, b) => b.calmar - a.calmar);
  populationCount.textContent = `${elites.length} élites`;
  popTableBody.innerHTML = sorted
    .map(
      (ind) => `
      <tr data-id="${ind.id}">
        <td>${ind.id}</td>
        <td>${fmtDate(ind.entryDate)}</td>
        <td class="${signClass(ind.totalReturnPct)}">${fmtPctShort(ind.totalReturnPct)}</td>
        <td>${ind.sharpe.toFixed(2)}</td>
        <td class="negative">${ind.maxDrawdownPct.toFixed(1)} %</td>
        <td>${ind.trades}</td>
        <td>${ind.calmar.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  popTableBody.querySelectorAll('tr[data-id]').forEach((row) => {
    row.addEventListener('click', () => selectIndividual(row.dataset.id));
  });
}

// ---------- DNA panel ----------
async function selectIndividual(id) {
  selectedIndividualId = id;
  popTableBody.querySelectorAll('tr').forEach((r) => r.classList.toggle('selected', r.dataset.id === id));

  dnaPanel.innerHTML = '<p class="muted">Chargement…</p>';
  try {
    const res = await fetch(`/api/individual/${id}`);
    if (!res.ok) throw new Error('introuvable');
    const ind = await res.json();
    const r = ind.results || {};
    dnaPanel.innerHTML = `
      <div class="dna-id">${ind.id}</div>
      <div class="dna-stats">
        <div><div class="dna-stat-label">Rendement</div><div class="dna-stat-value ${signClass(r.totalReturnPct)}">${fmtPctShort(r.totalReturnPct)}</div></div>
        <div><div class="dna-stat-label">Sharpe</div><div class="dna-stat-value">${(r.sharpe ?? 0).toFixed(2)}</div></div>
        <div><div class="dna-stat-label">Drawdown max</div><div class="dna-stat-value negative">${(r.maxDrawdownPct ?? 0).toFixed(1)} %</div></div>
        <div><div class="dna-stat-label">Trades</div><div class="dna-stat-value">${r.trades ?? '—'}</div></div>
      </div>
      <div class="dna-desc">${ind.description}</div>
      <div class="dna-lineage">${ind.parentIds?.length ? `Parent(s) : ${ind.parentIds.join(', ')}` : 'Individu de la génération 1 (aucun parent).'}</div>
    `;
  } catch {
    dnaPanel.innerHTML = '<p class="muted">Individu introuvable (peut-être un enfant pas encore testé).</p>';
  }
}

// ---------- Chart ----------
function drawChart(strategyCurve, buyHoldCurve) {
  if (!strategyCurve || !buyHoldCurve || !strategyCurve.length) {
    chartEmpty.classList.remove('hidden');
    return;
  }
  chartEmpty.classList.add('hidden');
  lastCurves = { strategy: strategyCurve, buyHold: buyHoldCurve };
  renderChart();
}

function renderChart() {
  if (!lastCurves) return;
  const { strategy, buyHold } = lastCurves;
  const dpr = window.devicePixelRatio || 1;
  const rect = chartCanvas.parentElement.getBoundingClientRect();
  chartCanvas.width = rect.width * dpr;
  chartCanvas.height = rect.height * dpr;
  chartCanvas.style.width = `${rect.width}px`;
  chartCanvas.style.height = `${rect.height}px`;
  const ctx = chartCanvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const padL = 56;
  const padR = 12;
  const padT = 10;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  ctx.clearRect(0, 0, W, H);

  const allValues = [...strategy.map((p) => p.equity), ...buyHold.map((p) => p.equity)];
  const maxV = Math.max(...allValues);
  const minV = Math.min(0, Math.min(...allValues));

  const n = Math.max(strategy.length, buyHold.length);
  const x = (i) => padL + (i / (n - 1)) * plotW;
  const y = (v) => padT + plotH - ((v - minV) / (maxV - minV || 1)) * plotH;

  // Grille horizontale + labels
  const gridLines = 4;
  ctx.strokeStyle = '#1b1b20';
  ctx.lineWidth = 1;
  ctx.font = '11px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#5c5c66';
  ctx.textBaseline = 'middle';
  for (let g = 0; g <= gridLines; g++) {
    const v = minV + ((maxV - minV) * g) / gridLines;
    const yy = y(v);
    ctx.beginPath();
    ctx.moveTo(padL, yy);
    ctx.lineTo(W - padR, yy);
    ctx.stroke();
    ctx.fillText(formatMoney(v), 6, yy);
  }

  // Labels d'années (axe X)
  ctx.textBaseline = 'alphabetic';
  const dates = strategy.map((p) => p.date);
  const years = [...new Set(dates.map((d) => d.slice(0, 4)))];
  years.forEach((yr) => {
    const idx = dates.findIndex((d) => d.startsWith(yr));
    if (idx === -1) return;
    const xx = x(idx);
    ctx.fillText(yr, xx - 12, H - 6);
  });

  // Ligne Buy & hold
  drawLine(ctx, buyHold, x, y, '#5c5c66', 1.5);
  // Ligne Stratégie (au-dessus, plus marquée)
  drawLine(ctx, strategy, x, y, '#3ddc84', 2);
}

function drawLine(ctx, points, x, y, color, width) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  points.forEach((p, i) => {
    const xx = x(i);
    const yy = y(p.equity);
    if (i === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  });
  ctx.stroke();
}

function formatMoney(v) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1000)} k`;
  return `${Math.round(v)}`;
}

window.addEventListener('resize', () => {
  if (lastCurves) renderChart();
});

// ---------- Actions ----------
btnRun.addEventListener('click', async () => {
  const available = await refreshDataStatus();
  if (!available) {
    addJournalLine("Impossible de démarrer : données BTC manquantes.", 'error');
    return;
  }
  btnRun.disabled = true;
  btnSurvivors.disabled = true;
  const fast = toggleFast.checked;
  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fast }),
    });
    const data = await res.json();
    if (!res.ok) {
      addJournalLine(`Erreur : ${data.error}`, 'error');
    } else {
      applyResult(data);
    }
  } catch (err) {
    addJournalLine(`Erreur réseau : ${err.message}`, 'error');
  } finally {
    btnRun.disabled = false;
    btnSurvivors.disabled = false;
  }
});

btnSurvivors.addEventListener('click', async () => {
  const res = await fetch('/api/load-survivors', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) {
    addJournalLine(`Erreur : ${data.error}`, 'error');
    return;
  }
  addJournalLine(`${data.loaded} survivants de toutes les générations rechargés comme population de départ.`, 'success');
  await refreshState();
});

btnReset.addEventListener('click', async () => {
  if (!confirm('Réinitialiser le laboratoire ? Toutes les générations et survivants enregistrés seront supprimés.')) return;
  await fetch('/api/reset', { method: 'POST' });
  journalEl.innerHTML = '';
  popTableBody.innerHTML = `<tr><td colspan="7" class="empty-row">Lance la génération 1 pour créer 100 individus.</td></tr>`;
  dnaPanel.innerHTML = '<p class="muted">Aucun individu sélectionné.</p>';
  populationCount.textContent = '0 individus';
  statGeneration.textContent = '0';
  statTour.textContent = '— / 4';
  statPopulation.textContent = '0';
  statEliminated.textContent = '0';
  statBest.textContent = '—';
  statBest.className = 'stat-value';
  statBuyhold.textContent = '—';
  protocolRows.forEach((row) => {
    row.classList.remove('active');
    row.querySelector('.protocol-result').textContent = '—';
    row.querySelector('.protocol-result').classList.remove('done');
  });
  chartEmpty.classList.remove('hidden');
  lastCurves = null;
  await refreshState();
});

seedMinus.addEventListener('click', () => updateSeed(parseInt(seedInput.value || '0', 10) - 1));
seedPlus.addEventListener('click', () => updateSeed(parseInt(seedInput.value || '0', 10) + 1));
seedInput.addEventListener('change', () => updateSeed(parseInt(seedInput.value || '0', 10)));

async function updateSeed(value) {
  seedInput.value = value;
  await fetch('/api/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seed: value }),
  });
}

// ---------- Init ----------
(async function init() {
  connectStream();
  await refreshDataStatus();
  await refreshState();
})();
