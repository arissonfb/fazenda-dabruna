/* ════════════════════════════════════════════════════════════════════
   Wolf Agricultura e Pecuária — Pastagens / Custo por Hectare
   Carregado depois de app.js / __commercial_new.js / bruna-extras.js.
   Reaproveita as globais já existentes: state, runtime, elements,
   saveData, render, formatInteger, formatCurrency, formatWeight,
   formatDate, formatMonthYear, escapeHtml, cloneDeep, slugify,
   getAllFarms, getFarm, isAdmin, isAuthenticated,
   logAuditEvent, drawChartFallback, loadLogoForPdf, Chart, jsPDF.
   ════════════════════════════════════════════════════════════════════ */

/* ── Constantes ───────────────────────────────────────────────────── */
const PASTURE_CULTURES = [
  { id: "milho", name: "Milho" },
  { id: "milheto", name: "Milheto" },
  { id: "azevem", name: "Azevém" },
  { id: "aveia", name: "Aveia" },
  { id: "sorgo", name: "Sorgo" },
  { id: "tifton", name: "Tifton" },
  { id: "braquiaria", name: "Braquiária" },
  { id: "campo-nativo-melhorado", name: "Campo nativo melhorado" },
  { id: "outra", name: "Outra" }
];

const PASTURE_PROCEDURE_TYPES = [
  { id: "nivelamento", name: "Nivelamento com grade" },
  { id: "preparo-solo", name: "Preparo de solo" },
  { id: "implementacao-maquinario", name: "Implementação com maquinário" },
  { id: "plantio-aviao", name: "Plantio com avião" },
  { id: "aplicacao-ureia", name: "Aplicação de ureia" },
  { id: "aplicacao-adubo-calcario", name: "Aplicação de adubo/calcário" },
  { id: "semeadura", name: "Semeadura" },
  { id: "pulverizacao", name: "Pulverização" },
  { id: "irrigacao", name: "Irrigação" },
  { id: "replantio", name: "Replantio" },
  { id: "mao-obra", name: "Mão de obra" },
  { id: "combustivel", name: "Combustível" },
  { id: "terceirizacao", name: "Terceirização de serviço" },
  { id: "colheita", name: "Colheita / Corte" },
  { id: "outros", name: "Outros custos operacionais" }
];

const PASTURE_UNITS = [
  { id: "kg", name: "Kg" },
  { id: "saco", name: "Saco" },
  { id: "litro", name: "Litro" },
  { id: "hora-maquina", name: "Hora-máquina" },
  { id: "hectare", name: "Hectare" },
  { id: "tonelada", name: "Tonelada" },
  { id: "diaria", name: "Diária" },
  { id: "unidade", name: "Unidade" }
];

const PASTURE_STATUSES = [
  { id: "planejada", name: "Planejada" },
  { id: "preparo", name: "Em preparo" },
  { id: "implantacao", name: "Em implantação" },
  { id: "implantada", name: "Implantada" },
  { id: "utilizacao", name: "Em utilização" },
  { id: "descanso", name: "Em descanso" },
  { id: "encerrada", name: "Encerrada" }
];

const PASTURE_PREPARO_TYPES = [
  { id: "gradagem", name: "Gradagem" },
  { id: "rolo-faca", name: "Rolo-faca" },
  { id: "outro", name: "Outro" }
];

const PASTURE_DESSECACAO_METHODS = [
  { id: "terrestre", name: "Pulverizador terrestre" },
  { id: "aviao", name: "Avião" }
];

const PASTURE_IMPLANTACAO_METHODS = [
  { id: "plantio-direto", name: "Plantio direto" },
  { id: "lanco", name: "Semeadura a lanço" },
  { id: "aviao", name: "Avião" }
];

const PASTURE_CHART_PALETTE = [
  "#8a6d1f", "#375b43", "#0e4f6b", "#7c1d4f", "#7a4f00",
  "#1e3a5f", "#134e27", "#c98c4f", "#5b3a1e", "#6b4226", "#9c6b30", "#3f6212"
];

/* ── Ficha da pastagem: abas e mini-formulários ──────────────────────
   Cada área ganha 4 baldes de custo estruturados (preparoOperations,
   desiccationApplications, implantationRecords, grazingPeriods) além do
   `procedures` genérico já existente, que agora representa "Outros
   insumos". Ver plano em C:\Users\Home\.claude\plans\deep-bubbling-crayon.md */
const PASTURE_FICHA_TABS = [
  { id: "identificacao", label: "Identificação" },
  { id: "preparo", label: "Preparo da área" },
  { id: "implantacao", label: "Implantação" },
  { id: "resumo", label: "Resumo financeiro" },
  { id: "utilizacao", label: "Utilização" }
];

/* ── Helpers de dados ─────────────────────────────────────────────── */
function getPastureAreas(farm) {
  return Array.isArray(farm?.pastureAreas) ? farm.pastureAreas : [];
}

function getAllPastureAreasWithFarm() {
  const rows = [];
  getAllFarms().forEach((farm) => {
    getPastureAreas(farm).forEach((area) => rows.push({ farm, area }));
  });
  return rows;
}

function getPastureCultureLabel(area) {
  if (area.culture === "outra") return area.customCulture?.trim() || "Outra";
  const found = PASTURE_CULTURES.find((c) => c.id === area.culture);
  return found ? found.name : (area.culture || "—");
}

function getPastureProcedureTypeLabel(procedure) {
  if (procedure.type === "outros" && procedure.customType?.trim()) return procedure.customType.trim();
  const found = PASTURE_PROCEDURE_TYPES.find((t) => t.id === procedure.type);
  return found ? found.name : (procedure.type || "—");
}

function getPastureUnitLabel(unitId) {
  const found = PASTURE_UNITS.find((u) => u.id === unitId);
  return found ? found.name : (unitId || "—");
}

function getPastureStatusLabel(statusId) {
  const found = PASTURE_STATUSES.find((s) => s.id === statusId);
  return found ? found.name : (statusId || "—");
}

function labelFromOptions(options, id, customLabel) {
  if (id === "outro" && customLabel?.trim()) return customLabel.trim();
  const found = options.find((o) => o.id === id);
  return found ? found.name : (id || "—");
}

function getPreparoTypeLabel(op) {
  return labelFromOptions(PASTURE_PREPARO_TYPES, op.tipo, op.customTipo);
}

function getDessecacaoMethodLabel(app) {
  return labelFromOptions(PASTURE_DESSECACAO_METHODS, app.metodo);
}

function getImplantacaoMethodLabel(rec) {
  return labelFromOptions(PASTURE_IMPLANTACAO_METHODS, rec.metodo);
}

/* ── Cálculo de custos (4 baldes por área) ────────────────────────────
   preparoOperations/desiccationApplications/implantationRecords/procedures
   já trazem seu próprio `custoTotal`/`totalValue` calculado no momento do
   lançamento (ver handlers *Submit abaixo) — aqui só somamos. */
function getAreaPreparoCost(area) {
  return (area.preparoOperations || []).reduce((sum, op) => sum + (Number(op.custoTotal) || 0), 0);
}

function getAreaDessecacaoCost(area) {
  return (area.desiccationApplications || []).reduce((sum, app) => sum + (Number(app.custoTotal) || 0), 0);
}

function getAreaImplantacaoCost(area) {
  return (area.implantationRecords || []).reduce((sum, rec) => sum + (Number(rec.custoTotal) || 0), 0);
}

function getAreaOutrosCost(area) {
  return (area.procedures || []).reduce((sum, p) => sum + (Number(p.totalValue) || 0), 0);
}

function getAreaTotalCost(area) {
  return getAreaPreparoCost(area) + getAreaDessecacaoCost(area) + getAreaImplantacaoCost(area) + getAreaOutrosCost(area);
}

function getAreaCostPerHa(area) {
  const ha = Number(area.sizeHa) || 0;
  return ha > 0 ? getAreaTotalCost(area) / ha : 0;
}

/* Lista unificada de lançamentos de custo da área (todas as 4 fontes),
   usada pelos gráficos/PDF/Excel/exec-cards que antes só liam `procedures`. */
function getAreaCostEntries(area) {
  const entries = [];
  (area.preparoOperations || []).forEach((op) => entries.push({
    date: op.data, typeLabel: `Preparo — ${getPreparoTypeLabel(op)}`, value: Number(op.custoTotal) || 0, responsible: ""
  }));
  (area.desiccationApplications || []).forEach((app) => entries.push({
    date: app.data, typeLabel: `Dessecação — ${app.produto?.trim() || getDessecacaoMethodLabel(app)}`, value: Number(app.custoTotal) || 0, responsible: ""
  }));
  (area.implantationRecords || []).forEach((rec) => entries.push({
    date: rec.data, typeLabel: `Implantação — ${rec.tipoSemente?.trim() || getImplantacaoMethodLabel(rec)}`, value: Number(rec.custoTotal) || 0, responsible: ""
  }));
  (area.procedures || []).forEach((p) => entries.push({
    date: p.date, typeLabel: getPastureProcedureTypeLabel(p), value: Number(p.totalValue) || 0, responsible: p.responsible || ""
  }));
  return entries;
}

function formatHa(value) {
  return `${formatWeight(value)} ha`;
}

function createPastureId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

function populatePastureAreaPotreiroSelect(farm) {
  const select = document.getElementById("pastureAreaPotreiro");
  if (!select) return;
  const potreiros = farm?.potreiros || [];
  select.innerHTML = potreiros.length
    ? potreiros.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")
    : `<option value="">Nenhum potreiro cadastrado nesta fazenda</option>`;
}

/* ── Filtros ──────────────────────────────────────────────────────── */
function createDefaultPastureFilters() {
  return {
    farmId: "all",
    areaId: "all",
    culture: "all",
    season: "all",
    procedureType: "all",
    responsible: "all",
    status: "all"
  };
}

runtime.pastureFilters = runtime.pastureFilters || createDefaultPastureFilters();

function getPastureScopeFarms() {
  if (state.data.selectedFarmId === TOTAL_FARM_ID) return getAllFarms();
  const farm = state.data.farms[state.data.selectedFarmId];
  return farm ? [farm] : [];
}

function pastureMatchesPeriod(dateStr) {
  if (!dateStr) return true;
  const yearFilter = state.filters.year;
  const monthFilter = state.filters.month;
  if (yearFilter === "all" && monthFilter === "all") return true;
  const match = /^(\d{4})-(\d{2})/.exec(dateStr);
  if (!match) return true;
  const [, yr, mo] = match;
  if (yearFilter !== "all" && yr !== String(yearFilter)) return false;
  if (monthFilter !== "all" && mo !== String(monthFilter).padStart(2, "0")) return false;
  return true;
}

function getFilteredPastureRows() {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const f = runtime.pastureFilters;
  let rows = getPastureScopeFarms().flatMap((farm) =>
    getPastureAreas(farm).map((area) => ({ farm, area }))
  );

  if (isTotalView && f.farmId !== "all") {
    rows = rows.filter((row) => row.farm.id === f.farmId);
  }
  if (f.areaId !== "all") rows = rows.filter((row) => row.area.id === f.areaId);
  if (f.culture !== "all") rows = rows.filter((row) => row.area.culture === f.culture);
  if (f.season !== "all") rows = rows.filter((row) => row.area.season === f.season);
  if (f.status !== "all") rows = rows.filter((row) => row.area.status === f.status);

  const hasProcedureFilter = f.procedureType !== "all" || f.responsible !== "all" ||
    state.filters.year !== "all" || state.filters.month !== "all";
  if (hasProcedureFilter) {
    rows = rows.map((row) => {
      const procedures = (row.area.procedures || []).filter((p) => {
        if (f.procedureType !== "all" && p.type !== f.procedureType) return false;
        if (f.responsible !== "all" && p.responsible !== f.responsible) return false;
        if (!pastureMatchesPeriod(p.date)) return false;
        return true;
      });
      return { ...row, area: { ...row.area, procedures } };
    });
  }

  return rows;
}

/* ── Métricas (cards executivos) ─────────────────────────────────── */
function computePastureMetrics(rows) {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  let totalCost = 0;
  let totalHa = 0;
  const cultureCost = new Map();
  const groupCost = new Map();
  const procedureCost = new Map();
  let lastEntry = null;

  rows.forEach(({ farm, area }) => {
    const areaCost = getAreaTotalCost(area);
    totalCost += areaCost;
    totalHa += Number(area.sizeHa) || 0;

    const cultureLabel = getPastureCultureLabel(area);
    cultureCost.set(cultureLabel, (cultureCost.get(cultureLabel) || 0) + areaCost);

    const groupLabel = isTotalView ? farm.name : area.name;
    groupCost.set(groupLabel, (groupCost.get(groupLabel) || 0) + areaCost);

    getAreaCostEntries(area).forEach((entry) => {
      procedureCost.set(entry.typeLabel, (procedureCost.get(entry.typeLabel) || 0) + entry.value);
      if (!lastEntry || String(entry.date || "") > String(lastEntry.date || "")) {
        lastEntry = { ...entry, areaName: area.name, farmName: farm.name };
      }
    });
  });

  const topCulture = [...cultureCost.entries()].sort((a, b) => b[1] - a[1])[0];
  const topGroup = [...groupCost.entries()].sort((a, b) => b[1] - a[1])[0];
  const topProcedure = [...procedureCost.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    isTotalView,
    totalCost,
    totalHa,
    avgCostHa: totalHa > 0 ? totalCost / totalHa : 0,
    areaCount: rows.length,
    topCulture: topCulture ? { label: topCulture[0], value: topCulture[1] } : null,
    topGroup: topGroup ? { label: topGroup[0], value: topGroup[1] } : null,
    topProcedure: topProcedure ? { label: topProcedure[0], value: topProcedure[1] } : null,
    lastEntry
  };
}

/* ── Gráficos ─────────────────────────────────────────────────────── */
function renderPastureCultureChart(rows) {
  const map = new Map();
  rows.forEach(({ area }) => {
    const label = getPastureCultureLabel(area);
    const entry = map.get(label) || { cost: 0, ha: 0 };
    entry.cost += getAreaTotalCost(area);
    entry.ha += Number(area.sizeHa) || 0;
    map.set(label, entry);
  });
  const entries = [...map.entries()].filter(([, v]) => v.ha > 0);
  const canvasId = "pastureCultureChart";
  if (state.charts.pastureCulture) { state.charts.pastureCulture.destroy(); state.charts.pastureCulture = null; }
  if (!entries.length) { drawChartFallback(canvasId, "Sem dados de pastagem para o filtro atual."); return; }
  const ctx = document.getElementById(canvasId).getContext("2d");
  state.charts.pastureCulture = new Chart(ctx, {
    type: "bar",
    data: {
      labels: entries.map(([label]) => label),
      datasets: [{ label: "Custo/ha", data: entries.map(([, v]) => v.cost / v.ha), backgroundColor: "#8a6d1f", borderRadius: 6 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatCurrency(c.parsed.y) } } },
      scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } }
    }
  });
}

function renderPastureGroupChart(rows) {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const map = new Map();
  rows.forEach(({ farm, area }) => {
    const label = isTotalView ? farm.name : area.name;
    map.set(label, (map.get(label) || 0) + getAreaTotalCost(area));
  });
  const entries = [...map.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const canvasId = "pastureGroupChart";
  if (state.charts.pastureGroup) { state.charts.pastureGroup.destroy(); state.charts.pastureGroup = null; }
  if (!entries.length) { drawChartFallback(canvasId, "Sem custos registrados para o filtro atual."); return; }
  const ctx = document.getElementById(canvasId).getContext("2d");
  state.charts.pastureGroup = new Chart(ctx, {
    type: "bar",
    data: {
      labels: entries.map(([l]) => l),
      datasets: [{ label: "Custo total", data: entries.map(([, v]) => v), backgroundColor: PASTURE_CHART_PALETTE, borderRadius: 6 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatCurrency(c.parsed.y) } } },
      scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } }
    }
  });
}

function renderPastureProcedureChart(rows) {
  const map = new Map();
  rows.forEach(({ area }) => {
    getAreaCostEntries(area).forEach((entry) => {
      map.set(entry.typeLabel, (map.get(entry.typeLabel) || 0) + entry.value);
    });
  });
  const entries = [...map.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const canvasId = "pastureProcedureChart";
  if (state.charts.pastureProcedure) { state.charts.pastureProcedure.destroy(); state.charts.pastureProcedure = null; }
  if (!entries.length) { drawChartFallback(canvasId, "Sem procedimentos registrados."); return; }
  const ctx = document.getElementById(canvasId).getContext("2d");
  state.charts.pastureProcedure = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: entries.map(([label]) => label),
      datasets: [{ data: entries.map(([, v]) => v), backgroundColor: PASTURE_CHART_PALETTE }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 12, font: { size: 10 } } },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${formatCurrency(c.parsed)}` } }
      }
    }
  });
}

function renderPastureMonthlyChart(rows) {
  const map = new Map();
  rows.forEach(({ area }) => {
    getAreaCostEntries(area).forEach((entry) => {
      const period = String(entry.date || "").slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(period)) return;
      map.set(period, (map.get(period) || 0) + entry.value);
    });
  });
  const periods = [...map.keys()].sort();
  const canvasId = "pastureMonthlyChart";
  if (state.charts.pastureMonthly) { state.charts.pastureMonthly.destroy(); state.charts.pastureMonthly = null; }
  if (!periods.length) { drawChartFallback(canvasId, "Sem lançamentos no período selecionado."); return; }
  const ctx = document.getElementById(canvasId).getContext("2d");
  state.charts.pastureMonthly = new Chart(ctx, {
    type: "line",
    data: {
      labels: periods.map((p) => formatMonthYear(p)),
      datasets: [{
        label: "Custo mensal",
        data: periods.map((p) => map.get(p)),
        borderColor: "#375b43",
        backgroundColor: "rgba(55,91,67,0.18)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatCurrency(c.parsed.y) } } },
      scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } }
    }
  });
}

function renderPastureRankingChart(rows) {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const ranked = rows
    .map(({ farm, area }) => ({
      label: isTotalView ? `${area.name} (${farm.name})` : area.name,
      value: getAreaCostPerHa(area)
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const canvasId = "pastureRankingChart";
  if (state.charts.pastureRanking) { state.charts.pastureRanking.destroy(); state.charts.pastureRanking = null; }
  if (!ranked.length) { drawChartFallback(canvasId, "Sem áreas com custo registrado."); return; }
  const ctx = document.getElementById(canvasId).getContext("2d");
  state.charts.pastureRanking = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ranked.map((r) => r.label),
      datasets: [{ label: "Custo/ha", data: ranked.map((r) => r.value), backgroundColor: "#0e4f6b", borderRadius: 6 }]
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatCurrency(c.parsed.x) } } },
      scales: { x: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } }
    }
  });
}

function renderPastureSeasonChart(rows) {
  const map = new Map();
  rows.forEach(({ area }) => {
    const season = area.season || "—";
    map.set(season, (map.get(season) || 0) + getAreaTotalCost(area));
  });
  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const canvasId = "pastureSeasonChart";
  if (state.charts.pastureSeason) { state.charts.pastureSeason.destroy(); state.charts.pastureSeason = null; }
  if (!entries.length) { drawChartFallback(canvasId, "Sem safras cadastradas."); return; }
  const ctx = document.getElementById(canvasId).getContext("2d");
  state.charts.pastureSeason = new Chart(ctx, {
    type: "bar",
    data: {
      labels: entries.map(([l]) => l),
      datasets: [{ label: "Custo total por safra", data: entries.map(([, v]) => v), backgroundColor: "#7a4f00", borderRadius: 6 }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatCurrency(c.parsed.y) } } },
      scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } }
    }
  });
}

function renderPastureCharts(rows) {
  renderPastureCultureChart(rows);
  renderPastureGroupChart(rows);
  renderPastureProcedureChart(rows);
  renderPastureMonthlyChart(rows);
  renderPastureRankingChart(rows);
  renderPastureSeasonChart(rows);
}

/* ── Cards executivos ─────────────────────────────────────────────── */
function renderPastureExecCards(metrics) {
  const groupTitle = metrics.isTotalView ? "Fazenda com maior investimento" : "Área com maior investimento";
  const cards = [
    { title: "Total investido", value: formatCurrency(metrics.totalCost), detail: `${formatInteger(metrics.areaCount)} área(s) no filtro atual` },
    { title: "Área total implantada", value: formatHa(metrics.totalHa), detail: "soma das áreas no filtro atual" },
    { title: "Custo médio / ha", value: formatCurrency(metrics.avgCostHa), detail: "considerando toda a área implantada" },
    {
      title: "Cultura com maior custo",
      value: metrics.topCulture ? metrics.topCulture.label : "—",
      detail: metrics.topCulture ? formatCurrency(metrics.topCulture.value) : "sem dados"
    },
    {
      title: groupTitle,
      value: metrics.topGroup ? metrics.topGroup.label : "—",
      detail: metrics.topGroup ? formatCurrency(metrics.topGroup.value) : "sem dados"
    },
    {
      title: "Procedimento mais oneroso",
      value: metrics.topProcedure ? metrics.topProcedure.label : "—",
      detail: metrics.topProcedure ? formatCurrency(metrics.topProcedure.value) : "sem dados"
    },
    {
      title: "Último lançamento",
      value: metrics.lastEntry ? formatDate(metrics.lastEntry.date) : "—",
      detail: metrics.lastEntry
        ? `${escapeHtml(metrics.lastEntry.typeLabel)} · ${escapeHtml(metrics.lastEntry.areaName)}`
        : "nenhum procedimento registrado"
    }
  ];

  return cards.map((card) => `
    <article class="pasture-summary-card">
      <p class="panel-kicker">${escapeHtml(card.title)}</p>
      <strong>${escapeHtml(String(card.value))}</strong>
      <span class="pasture-summary-detail">${card.detail}</span>
    </article>
  `).join("");
}

/* ── Filtros (UI) ─────────────────────────────────────────────────── */
function renderPastureFiltersBar(isTotalView) {
  const farmFieldHtml = isTotalView ? `
    <label>Fazenda
      <select data-pasture-filter="farmId">
        <option value="all">Todas</option>
        ${getAllFarms().map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)}</option>`).join("")}
      </select>
    </label>
  ` : "";

  return `
    <div class="pasture-filters">
      ${farmFieldHtml}
      <label>Área / Potreiro
        <select data-pasture-filter="areaId">
          <option value="all">Todas</option>
        </select>
      </label>
      <label>Cultura
        <select data-pasture-filter="culture">
          <option value="all">Todas</option>
          ${PASTURE_CULTURES.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}
        </select>
      </label>
      <label>Safra
        <select data-pasture-filter="season">
          <option value="all">Todas</option>
        </select>
      </label>
      <label>Procedimento
        <select data-pasture-filter="procedureType">
          <option value="all">Todos</option>
          ${PASTURE_PROCEDURE_TYPES.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}
        </select>
      </label>
      <label>Responsável
        <select data-pasture-filter="responsible">
          <option value="all">Todos</option>
        </select>
      </label>
      <label>Status
        <select data-pasture-filter="status">
          <option value="all">Todos</option>
          ${PASTURE_STATUSES.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </label>
      <div class="pasture-filters-actions">
        <button type="button" class="ghost-btn" data-pasture-action="clear-filters">Limpar filtros</button>
      </div>
    </div>
  `;
}

function populatePastureFilterOptions(isTotalView) {
  const view = elements.pastagensView;
  const f = runtime.pastureFilters;
  const scopeFarms = getPastureScopeFarms();
  const areas = scopeFarms.flatMap((farm) => getPastureAreas(farm).map((area) => ({ farm, area })))
    .filter((row) => !isTotalView || f.farmId === "all" || row.farm.id === f.farmId);

  const areaSelect = view.querySelector('[data-pasture-filter="areaId"]');
  if (areaSelect) {
    areaSelect.innerHTML = `<option value="all">Todas</option>` + areas.map(({ farm, area }) => `
      <option value="${escapeHtml(area.id)}">${escapeHtml(area.name)}${isTotalView ? ` (${escapeHtml(farm.name)})` : ""}</option>
    `).join("");
    if (!areas.some(({ area }) => area.id === f.areaId)) f.areaId = "all";
    areaSelect.value = f.areaId;
  }

  const seasons = [...new Set(scopeFarms.flatMap((farm) => getPastureAreas(farm).map((a) => a.season).filter(Boolean)))].sort();
  const seasonSelect = view.querySelector('[data-pasture-filter="season"]');
  if (seasonSelect) {
    seasonSelect.innerHTML = `<option value="all">Todas</option>` + seasons.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
    seasonSelect.value = seasons.includes(f.season) ? f.season : "all";
  }

  const responsibles = [...new Set(scopeFarms.flatMap((farm) =>
    getPastureAreas(farm).flatMap((a) => (a.procedures || []).map((p) => p.responsible).filter(Boolean))
  ))].sort();
  const responsibleSelect = view.querySelector('[data-pasture-filter="responsible"]');
  if (responsibleSelect) {
    responsibleSelect.innerHTML = `<option value="all">Todos</option>` + responsibles.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");
    responsibleSelect.value = responsibles.includes(f.responsible) ? f.responsible : "all";
  }

  ["farmId", "culture", "procedureType", "status"].forEach((key) => {
    const select = view.querySelector(`[data-pasture-filter="${key}"]`);
    if (select) select.value = f[key];
  });
}

/* ── Linha de registro de área ────────────────────────────────────── */
function renderPastureAreaRows(rows, isTotalView) {
  if (!rows.length) {
    return `<div class="pasture-empty">Nenhuma área de pastagem encontrada para os filtros selecionados.</div>`;
  }

  return `
    <div class="pasture-areas-table-wrap">
      <div class="table-wrap">
        <table class="pasture-areas-table">
          <thead>
            <tr>
              ${isTotalView ? "<th>Fazenda</th>" : ""}
              <th>Área</th>
              <th>Cultura / Safra</th>
              <th>Início</th>
              <th>Status</th>
              <th>Hectares</th>
              <th>Custo total</th>
              <th>Custo / ha</th>
              <th>Lançamentos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ farm, area }) => {
              const totalCost = getAreaTotalCost(area);
              const costHa = getAreaCostPerHa(area);
              const entryCount = getAreaCostEntries(area).length;
              const status = area.status || "planejada";
              const subtitle = `${escapeHtml(getPastureCultureLabel(area))} · Safra ${escapeHtml(area.season || "—")}`;

              return `
                <tr class="pasture-area-row">
                  ${isTotalView ? `<td data-label="Fazenda">${escapeHtml(farm.name)}</td>` : ""}
                  <td data-label="Área">
                    <strong>${escapeHtml(area.name)}</strong>
                    <div class="pasture-area-meta">${subtitle}</div>
                  </td>
                  <td data-label="Cultura / Safra">${escapeHtml(getPastureCultureLabel(area))} · ${escapeHtml(area.season || "—")}</td>
                  <td data-label="Início">${formatDate(area.startDate)}</td>
                  <td data-label="Status"><span class="pasture-status ${escapeHtml(status)}">${escapeHtml(getPastureStatusLabel(status))}</span></td>
                  <td data-label="Hectares">${formatHa(area.sizeHa)}</td>
                  <td data-label="Custo total">${formatCurrency(totalCost)}</td>
                  <td data-label="Custo / ha">${formatCurrency(costHa)}</td>
                  <td data-label="Lançamentos">${formatInteger(entryCount)}</td>
                  <td data-label="Ações">
                    <div class="pasture-row-actions">
                      <button type="button" data-pasture-action="open-ficha" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Abrir ficha</button>
                      <button type="button" data-pasture-action="duplicate-area" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Duplicar</button>
                      <button type="button" class="danger" data-pasture-action="delete-area" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Excluir</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── View principal ───────────────────────────────────────────────── */
function renderPastagensView() {
  const view = elements.pastagensView;
  if (!view) return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farm = getFarm();
  const rows = getFilteredPastureRows();
  const metrics = computePastureMetrics(rows);

  view.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">${isTotalView ? "Consolidado · Todas as Fazendas" : escapeHtml(farm?.name || "Fazenda")}</p>
          <h2>Pastagens / Custo por Hectare</h2>
        </div>
        <div class="form-actions">
          <button type="button" class="ghost-btn" data-pasture-action="export-excel">Exportar Excel</button>
          <button type="button" class="ghost-btn" data-pasture-action="export-pdf">Exportar PDF</button>
          <button type="button" class="action-btn purchase" data-pasture-action="new-area">+ Nova área</button>
        </div>
      </div>

      <div class="pasture-summary-grid">
        ${renderPastureExecCards(metrics)}
      </div>

      ${renderPastureFiltersBar(isTotalView)}

      <div class="pasture-charts-grid">
        <article class="pasture-chart-card"><h3>Custo por hectare por cultura</h3><canvas id="pastureCultureChart"></canvas></article>
        <article class="pasture-chart-card"><h3>${isTotalView ? "Custo total por fazenda" : "Custo total por área"}</h3><canvas id="pastureGroupChart"></canvas></article>
        <article class="pasture-chart-card"><h3>Composição de custos por procedimento</h3><canvas id="pastureProcedureChart"></canvas></article>
        <article class="pasture-chart-card"><h3>Evolução mensal de custos</h3><canvas id="pastureMonthlyChart"></canvas></article>
        <article class="pasture-chart-card"><h3>Ranking de custo/ha por área</h3><canvas id="pastureRankingChart"></canvas></article>
        <article class="pasture-chart-card"><h3>Comparativo entre safras</h3><canvas id="pastureSeasonChart"></canvas></article>
      </div>

      <div class="pasture-areas-header">
        <h3>Áreas de pastagem</h3>
        <span class="field-note">${formatInteger(rows.length)} área(s) encontrada(s)</span>
      </div>
      <div class="pasture-areas-grid">
        ${renderPastureAreaRows(rows, isTotalView)}
      </div>
    </section>
  `;

  populatePastureFilterOptions(isTotalView);
  renderPastureCharts(rows);
}

/* ── Eventos delegados ────────────────────────────────────────────── */
function handlePastagensViewClick(event) {
  const target = event.target.closest("[data-pasture-action]");
  if (!target) return;
  const action = target.dataset.pastureAction;
  const farmId = target.dataset.farmId;
  const areaId = target.dataset.areaId;
  const farm = farmId ? state.data.farms[farmId] : null;
  const area = farm ? getPastureAreas(farm).find((a) => a.id === areaId) : null;

  switch (action) {
    case "new-area": {
      const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
      const defaultFarm = isTotalView
        ? (state.data.farms[runtime.pastureFilters.farmId] || getAllFarms()[0])
        : getFarm();
      openPastureAreaDialog(null, defaultFarm);
      break;
    }
    case "open-ficha":
      if (area) openPastureFichaDialog(farm, area);
      break;
    case "duplicate-area":
      if (area && confirm(`Duplicar a área "${area.name}"?`)) duplicatePastureArea(farm, area);
      break;
    case "delete-area":
      if (area && confirm(`Excluir a área "${area.name}" e todos os seus lançamentos?`)) deletePastureArea(farm, area);
      break;
    case "clear-filters":
      runtime.pastureFilters = createDefaultPastureFilters();
      renderPastagensView();
      break;
    case "export-pdf":
      exportPasturePdf();
      break;
    case "export-excel":
      exportPastureExcel();
      break;
  }
}

function handlePastagensViewChange(event) {
  const target = event.target.closest("[data-pasture-filter]");
  if (!target) return;
  runtime.pastureFilters[target.dataset.pastureFilter] = target.value;
  if (target.dataset.pastureFilter === "farmId") runtime.pastureFilters.areaId = "all";
  renderPastagensView();
}

/* ── Diálogos ─────────────────────────────────────────────────────── */
let pastureAreaDialogContext = { areaId: null };
let pastureProcDialogContext = { farmId: null, areaId: null, procedureId: null, attachment: null };

function injectPastureDialogs() {
  if (document.getElementById("pastureAreaDialog")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <dialog id="pastureAreaDialog" class="modal">
      <form class="modal-card modal-card-wide" id="pastureAreaForm">
        <div class="modal-header">
          <div>
            <p class="panel-kicker">Pastagens</p>
            <h2 id="pastureAreaDialogTitle">Nova área de pastagem</h2>
          </div>
          <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureAreaDialog">Fechar</button>
        </div>
        <div class="form-grid">
          <label class="span-2" id="pastureAreaFarmField" hidden>Fazenda
            <select id="pastureAreaFarm"></select>
          </label>
          <label>Potreiro
            <select id="pastureAreaPotreiro" required></select>
          </label>
          <label>Área total do potreiro (ha)
            <input type="number" id="pastureAreaPotreiroTotalHa" min="0" step="0.1" />
          </label>
          <label>Área destinada à pastagem (ha)
            <input type="number" id="pastureAreaSizeHa" min="0" step="0.1" required />
          </label>
          <label>Cultura
            <select id="pastureAreaCulture">
              ${PASTURE_CULTURES.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}
            </select>
          </label>
          <label id="pastureAreaCustomCultureField" hidden>Qual cultura?
            <input type="text" id="pastureAreaCustomCulture" maxlength="40" />
          </label>
          <label>Safra
            <input type="text" id="pastureAreaSeason" maxlength="20" placeholder="Ex: 2025/2026" required />
          </label>
          <label>Data prevista de início
            <input type="date" id="pastureAreaStartDate" />
          </label>
          <label>Status
            <select id="pastureAreaStatus">
              ${PASTURE_STATUSES.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
          </label>
          <label class="span-2">Observações
            <textarea id="pastureAreaNotes" rows="2" maxlength="240"></textarea>
          </label>
          <div class="form-actions">
            <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureAreaDialog">Cancelar</button>
            <button type="submit" class="action-btn purchase">Salvar</button>
          </div>
        </div>
      </form>
    </dialog>

    <dialog id="pastureProcedureDialog" class="modal">
      <form class="modal-card modal-card-wide" id="pastureProcedureForm">
        <div class="modal-header">
          <div>
            <p class="panel-kicker" id="pastureProcedureAreaLabel">Área</p>
            <h2 id="pastureProcedureDialogTitle">Novo procedimento</h2>
          </div>
          <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureProcedureDialog">Fechar</button>
        </div>
        <div class="form-grid">
          <label>Data
            <input type="date" id="pastureProcDate" required />
          </label>
          <label>Tipo de procedimento
            <select id="pastureProcType">
              ${PASTURE_PROCEDURE_TYPES.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}
            </select>
          </label>
          <label id="pastureProcCustomTypeField" class="span-2" hidden>Qual procedimento?
            <input type="text" id="pastureProcCustomType" maxlength="60" />
          </label>
          <label class="span-2">Descrição
            <input type="text" id="pastureProcDescription" maxlength="160" />
          </label>
          <label>Responsável
            <input type="text" id="pastureProcResponsible" maxlength="60" />
          </label>
          <label>Área aplicada (ha)
            <input type="number" id="pastureProcAreaHa" min="0" step="0.1" />
          </label>
          <label>Quantidade
            <input type="number" id="pastureProcQuantity" min="0" step="0.01" required />
          </label>
          <label>Unidade
            <select id="pastureProcUnit">
              ${PASTURE_UNITS.map((u) => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join("")}
            </select>
          </label>
          <label>Valor unitário (R$)
            <input type="number" id="pastureProcUnitValue" min="0" step="0.01" required />
          </label>
          <label>Valor total (R$)
            <input type="text" id="pastureProcTotalValue" readonly />
          </label>
          <label class="span-2">Observações
            <textarea id="pastureProcNotes" rows="2" maxlength="240"></textarea>
          </label>
          <label class="span-2">Anexo (opcional)
            <input type="file" id="pastureProcAttachment" accept="image/*,.pdf" />
            <span class="field-note" id="pastureProcAttachmentInfo"></span>
          </label>
          <div class="form-actions">
            <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureProcedureDialog">Cancelar</button>
            <button type="submit" class="action-btn purchase">Salvar</button>
          </div>
        </div>
      </form>
    </dialog>

    <dialog id="pastureGradagemDialog" class="modal">
      <form class="modal-card" id="pastureGradagemForm">
        <div class="modal-header">
          <div>
            <p class="panel-kicker" id="pastureGradagemAreaLabel">Área</p>
            <h2 id="pastureGradagemDialogTitle">Gradagem / rolo-faca</h2>
          </div>
          <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureGradagemDialog">Fechar</button>
        </div>
        <div class="form-grid">
          <label>Tipo da operação
            <select id="pastureGradagemTipo">
              ${PASTURE_PREPARO_TYPES.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}
            </select>
          </label>
          <label id="pastureGradagemCustomTipoField" hidden>Qual operação?
            <input type="text" id="pastureGradagemCustomTipo" maxlength="60" />
          </label>
          <label>Data
            <input type="date" id="pastureGradagemData" required />
          </label>
          <label>Quantidade de passadas
            <input type="number" id="pastureGradagemPassadas" min="0" step="1" />
          </label>
          <label>Custo por hectare (R$)
            <input type="number" id="pastureGradagemCustoPorHa" min="0" step="0.01" required />
          </label>
          <label>Área trabalhada (ha)
            <input type="number" id="pastureGradagemAreaTrabalhada" min="0" step="0.1" required />
          </label>
          <label>Custo total (R$)
            <input type="text" id="pastureGradagemCustoTotal" readonly />
          </label>
          <div class="form-actions">
            <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureGradagemDialog">Cancelar</button>
            <button type="submit" class="action-btn purchase">Salvar</button>
          </div>
        </div>
      </form>
    </dialog>

    <dialog id="pastureDessecacaoDialog" class="modal">
      <form class="modal-card" id="pastureDessecacaoForm">
        <div class="modal-header">
          <div>
            <p class="panel-kicker" id="pastureDessecacaoAreaLabel">Área</p>
            <h2 id="pastureDessecacaoDialogTitle">Dessecação</h2>
          </div>
          <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureDessecacaoDialog">Fechar</button>
        </div>
        <div class="form-grid">
          <label>Data
            <input type="date" id="pastureDessecacaoData" required />
          </label>
          <label>Produto utilizado
            <input type="text" id="pastureDessecacaoProduto" maxlength="60" required />
          </label>
          <label>Método
            <select id="pastureDessecacaoMetodo">
              ${PASTURE_DESSECACAO_METHODS.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("")}
            </select>
          </label>
          <label>Vazão (L/ha)
            <input type="number" id="pastureDessecacaoVazao" min="0" step="0.01" required />
          </label>
          <label>Hectares
            <input type="number" id="pastureDessecacaoHectares" min="0" step="0.1" required />
          </label>
          <label>Quantidade total (L)
            <input type="text" id="pastureDessecacaoQuantidadeTotal" readonly />
          </label>
          <label>Preço por litro (R$)
            <input type="number" id="pastureDessecacaoPrecoLitro" min="0" step="0.01" required />
          </label>
          <label>Custo do produto (R$)
            <input type="text" id="pastureDessecacaoCustoProduto" readonly />
          </label>
          <label>Custo de aplicação por hectare (R$)
            <input type="number" id="pastureDessecacaoCustoAplicacaoHa" min="0" step="0.01" />
          </label>
          <label>Custo de aplicação total (R$)
            <input type="text" id="pastureDessecacaoCustoAplicacaoTotal" readonly />
          </label>
          <label>Custo total da dessecação (R$)
            <input type="text" id="pastureDessecacaoCustoTotal" readonly />
          </label>
          <div class="form-actions">
            <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureDessecacaoDialog">Cancelar</button>
            <button type="submit" class="action-btn purchase">Salvar</button>
          </div>
        </div>
      </form>
    </dialog>

    <dialog id="pastureImplantacaoDialog" class="modal">
      <form class="modal-card" id="pastureImplantacaoForm">
        <div class="modal-header">
          <div>
            <p class="panel-kicker" id="pastureImplantacaoAreaLabel">Área</p>
            <h2 id="pastureImplantacaoDialogTitle">Implantação</h2>
          </div>
          <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureImplantacaoDialog">Fechar</button>
        </div>
        <div class="form-grid">
          <label>Método
            <select id="pastureImplantacaoMetodo">
              ${PASTURE_IMPLANTACAO_METHODS.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("")}
            </select>
          </label>
          <label>Data da implantação
            <input type="date" id="pastureImplantacaoData" required />
          </label>
          <label>Tipo / variedade da semente
            <input type="text" id="pastureImplantacaoTipoSemente" maxlength="60" required />
          </label>
          <label>Quantidade de semente (kg/ha)
            <input type="number" id="pastureImplantacaoKgHa" min="0" step="0.01" required />
          </label>
          <label>Hectares
            <input type="number" id="pastureImplantacaoHectares" min="0" step="0.1" required />
          </label>
          <label>Quantidade total de sementes (kg)
            <input type="text" id="pastureImplantacaoQuantidadeTotal" readonly />
          </label>
          <label>Custo por kg (R$)
            <input type="number" id="pastureImplantacaoCustoPorKg" min="0" step="0.01" required />
          </label>
          <label>Custo total das sementes (R$)
            <input type="text" id="pastureImplantacaoCustoSementes" readonly />
          </label>
          <label>Custo da semeadura por hectare (R$)
            <input type="number" id="pastureImplantacaoCustoSemeaduraHa" min="0" step="0.01" />
          </label>
          <label>Custo total da operação (R$)
            <input type="text" id="pastureImplantacaoCustoOperacao" readonly />
          </label>
          <label>Total da implantação (R$)
            <input type="text" id="pastureImplantacaoCustoTotal" readonly />
          </label>
          <div class="form-actions">
            <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureImplantacaoDialog">Cancelar</button>
            <button type="submit" class="action-btn purchase">Salvar</button>
          </div>
        </div>
      </form>
    </dialog>

    <dialog id="pastureUtilizacaoDialog" class="modal">
      <form class="modal-card" id="pastureUtilizacaoForm">
        <div class="modal-header">
          <div>
            <p class="panel-kicker" id="pastureUtilizacaoAreaLabel">Área</p>
            <h2 id="pastureUtilizacaoDialogTitle">Utilização da pastagem</h2>
          </div>
          <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureUtilizacaoDialog">Fechar</button>
        </div>
        <div class="form-grid">
          <label>Data de entrada
            <input type="date" id="pastureUtilizacaoEntrada" required />
          </label>
          <label>Data de saída
            <input type="date" id="pastureUtilizacaoSaida" />
          </label>
          <label>Categoria animal
            <input type="text" id="pastureUtilizacaoCategoria" maxlength="60" placeholder="Ex.: Vacas, Novilhas, Terneiros, Bois, Ovinos" required />
          </label>
          <label>Quantidade de animais
            <input type="number" id="pastureUtilizacaoQuantidade" min="0" step="1" required />
          </label>
          <label>Peso médio de entrada (kg)
            <input type="number" id="pastureUtilizacaoPesoEntrada" min="0" step="0.1" />
          </label>
          <label>Peso médio de saída (kg)
            <input type="number" id="pastureUtilizacaoPesoSaida" min="0" step="0.1" />
          </label>
          <label>Dias de utilização
            <input type="text" id="pastureUtilizacaoDias" readonly />
          </label>
          <label>Lotação (cab./ha)
            <input type="text" id="pastureUtilizacaoLotacao" readonly />
          </label>
          <label class="span-2">Observações
            <textarea id="pastureUtilizacaoNotes" rows="2" maxlength="240"></textarea>
          </label>
          <div class="form-actions">
            <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureUtilizacaoDialog">Cancelar</button>
            <button type="submit" class="action-btn purchase">Salvar</button>
          </div>
        </div>
      </form>
    </dialog>

    <dialog id="pastureFichaDialog" class="modal">
      <div class="modal-card modal-card-wide pasture-ficha-card">
        <div class="modal-header">
          <div>
            <p class="panel-kicker" id="pastureFichaKicker">Fazenda · Potreiro</p>
            <h2 id="pastureFichaTitle">Ficha da pastagem</h2>
          </div>
          <button type="button" class="ghost-btn" data-pasture-dialog-close="pastureFichaDialog">Fechar</button>
        </div>

        <div class="pasture-ficha-tabs" id="pastureFichaTabs">
          ${PASTURE_FICHA_TABS.map((t) => `<button type="button" class="view-tab" data-ficha-tab="${t.id}">${escapeHtml(t.label)}</button>`).join("")}
        </div>

        <div class="pasture-ficha-panel" data-ficha-panel="identificacao"></div>
        <div class="pasture-ficha-panel" data-ficha-panel="preparo" hidden></div>
        <div class="pasture-ficha-panel" data-ficha-panel="implantacao" hidden></div>
        <div class="pasture-ficha-panel" data-ficha-panel="resumo" hidden></div>
        <div class="pasture-ficha-panel" data-ficha-panel="utilizacao" hidden></div>
      </div>
    </dialog>
  `);

  document.querySelectorAll("[data-pasture-dialog-close]").forEach((btn) => {
    btn.addEventListener("click", () => document.getElementById(btn.dataset.pastureDialogClose).close());
  });

  const cultureSelect = document.getElementById("pastureAreaCulture");
  const customCultureField = document.getElementById("pastureAreaCustomCultureField");
  cultureSelect.addEventListener("change", () => {
    customCultureField.hidden = cultureSelect.value !== "outra";
  });

  const farmSelect = document.getElementById("pastureAreaFarm");
  const potreiroSelect = document.getElementById("pastureAreaPotreiro");
  const potreiroTotalHaInput = document.getElementById("pastureAreaPotreiroTotalHa");
  potreiroSelect.addEventListener("change", () => {
    const f = state.data.farms[farmSelect.value] || getFarm();
    const potreiro = (f?.potreiros || []).find((p) => p.id === potreiroSelect.value);
    potreiroTotalHaInput.value = potreiro?.areaHa ?? "";
  });
  farmSelect.addEventListener("change", () => {
    populatePastureAreaPotreiroSelect(state.data.farms[farmSelect.value]);
    potreiroSelect.dispatchEvent(new Event("change"));
  });

  const procTypeSelect = document.getElementById("pastureProcType");
  const customTypeField = document.getElementById("pastureProcCustomTypeField");
  procTypeSelect.addEventListener("change", () => {
    customTypeField.hidden = procTypeSelect.value !== "outros";
  });

  const qtyInput = document.getElementById("pastureProcQuantity");
  const unitValueInput = document.getElementById("pastureProcUnitValue");
  const totalInput = document.getElementById("pastureProcTotalValue");
  function recalcProcTotal() {
    const total = (Number(qtyInput.value) || 0) * (Number(unitValueInput.value) || 0);
    totalInput.value = formatCurrency(total);
  }
  qtyInput.addEventListener("input", recalcProcTotal);
  unitValueInput.addEventListener("input", recalcProcTotal);

  const attachmentInput = document.getElementById("pastureProcAttachment");
  attachmentInput.addEventListener("change", () => {
    const file = attachmentInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pastureProcDialogContext.attachment = { name: file.name, dataUrl: reader.result };
      document.getElementById("pastureProcAttachmentInfo").textContent = `Anexo: ${file.name}`;
    };
    reader.readAsDataURL(file);
  });

  const gradagemTipoSelect = document.getElementById("pastureGradagemTipo");
  const gradagemCustomTipoField = document.getElementById("pastureGradagemCustomTipoField");
  gradagemTipoSelect.addEventListener("change", () => {
    gradagemCustomTipoField.hidden = gradagemTipoSelect.value !== "outro";
  });
  function recalcGradagemTotal() {
    const custoPorHa = Number(document.getElementById("pastureGradagemCustoPorHa").value) || 0;
    const areaTrabalhada = Number(document.getElementById("pastureGradagemAreaTrabalhada").value) || 0;
    document.getElementById("pastureGradagemCustoTotal").value = formatCurrency(custoPorHa * areaTrabalhada);
  }
  document.getElementById("pastureGradagemCustoPorHa").addEventListener("input", recalcGradagemTotal);
  document.getElementById("pastureGradagemAreaTrabalhada").addEventListener("input", recalcGradagemTotal);

  function recalcDessecacaoTotal() {
    const vazao = Number(document.getElementById("pastureDessecacaoVazao").value) || 0;
    const hectares = Number(document.getElementById("pastureDessecacaoHectares").value) || 0;
    const precoLitro = Number(document.getElementById("pastureDessecacaoPrecoLitro").value) || 0;
    const custoAplicacaoHa = Number(document.getElementById("pastureDessecacaoCustoAplicacaoHa").value) || 0;
    const quantidadeTotal = vazao * hectares;
    const custoProduto = quantidadeTotal * precoLitro;
    const custoAplicacaoTotal = custoAplicacaoHa * hectares;
    document.getElementById("pastureDessecacaoQuantidadeTotal").value = `${formatWeight(quantidadeTotal)} L`;
    document.getElementById("pastureDessecacaoCustoProduto").value = formatCurrency(custoProduto);
    document.getElementById("pastureDessecacaoCustoAplicacaoTotal").value = formatCurrency(custoAplicacaoTotal);
    document.getElementById("pastureDessecacaoCustoTotal").value = formatCurrency(custoProduto + custoAplicacaoTotal);
  }
  ["pastureDessecacaoVazao", "pastureDessecacaoHectares", "pastureDessecacaoPrecoLitro", "pastureDessecacaoCustoAplicacaoHa"]
    .forEach((id) => document.getElementById(id).addEventListener("input", recalcDessecacaoTotal));

  function recalcImplantacaoTotal() {
    const kgHa = Number(document.getElementById("pastureImplantacaoKgHa").value) || 0;
    const hectares = Number(document.getElementById("pastureImplantacaoHectares").value) || 0;
    const custoPorKg = Number(document.getElementById("pastureImplantacaoCustoPorKg").value) || 0;
    const custoSemeaduraHa = Number(document.getElementById("pastureImplantacaoCustoSemeaduraHa").value) || 0;
    const quantidadeTotalSementes = kgHa * hectares;
    const custoSementes = quantidadeTotalSementes * custoPorKg;
    const custoOperacao = custoSemeaduraHa * hectares;
    document.getElementById("pastureImplantacaoQuantidadeTotal").value = `${formatWeight(quantidadeTotalSementes)} kg`;
    document.getElementById("pastureImplantacaoCustoSementes").value = formatCurrency(custoSementes);
    document.getElementById("pastureImplantacaoCustoOperacao").value = formatCurrency(custoOperacao);
    document.getElementById("pastureImplantacaoCustoTotal").value = formatCurrency(custoSementes + custoOperacao);
  }
  ["pastureImplantacaoKgHa", "pastureImplantacaoHectares", "pastureImplantacaoCustoPorKg", "pastureImplantacaoCustoSemeaduraHa"]
    .forEach((id) => document.getElementById(id).addEventListener("input", recalcImplantacaoTotal));

  function recalcUtilizacaoDerived() {
    const entrada = document.getElementById("pastureUtilizacaoEntrada").value;
    const saida = document.getElementById("pastureUtilizacaoSaida").value;
    const quantidade = Number(document.getElementById("pastureUtilizacaoQuantidade").value) || 0;
    const dias = entrada && saida ? Math.max(0, Math.round((new Date(saida) - new Date(entrada)) / 86400000)) : null;
    document.getElementById("pastureUtilizacaoDias").value = dias === null ? "Em andamento" : `${formatInteger(dias)} dia(s)`;
    const sizeHa = Number(state.data.farms[pastureFichaContext.farmId]?.pastureAreas?.find((a) => a.id === pastureFichaContext.areaId)?.sizeHa) || 0;
    document.getElementById("pastureUtilizacaoLotacao").value = sizeHa > 0 ? formatWeight(quantidade / sizeHa) : "—";
  }
  ["pastureUtilizacaoEntrada", "pastureUtilizacaoSaida", "pastureUtilizacaoQuantidade"]
    .forEach((id) => document.getElementById(id).addEventListener("input", recalcUtilizacaoDerived));

  document.getElementById("pastureFichaTabs").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-ficha-tab]");
    if (btn) switchPastureFichaTab(btn.dataset.fichaTab);
  });

  document.getElementById("pastureAreaForm").addEventListener("submit", handlePastureAreaSubmit);
  document.getElementById("pastureProcedureForm").addEventListener("submit", handlePastureProcedureSubmit);
  document.getElementById("pastureGradagemForm").addEventListener("submit", handlePastureGradagemSubmit);
  document.getElementById("pastureDessecacaoForm").addEventListener("submit", handlePastureDessecacaoSubmit);
  document.getElementById("pastureImplantacaoForm").addEventListener("submit", handlePastureImplantacaoSubmit);
  document.getElementById("pastureUtilizacaoForm").addEventListener("submit", handlePastureUtilizacaoSubmit);
  document.getElementById("pastureFichaDialog").addEventListener("click", handlePastureFichaClick);
}

function openPastureAreaDialog(area, farm) {
  const isEdit = !!area;
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  document.getElementById("pastureAreaDialogTitle").textContent = isEdit ? "Editar área de pastagem" : "Nova área de pastagem";
  pastureAreaDialogContext = { areaId: area ? area.id : null };

  const farmField = document.getElementById("pastureAreaFarmField");
  const farmSelect = document.getElementById("pastureAreaFarm");
  if (isTotalView) {
    farmField.hidden = false;
    farmSelect.innerHTML = getAllFarms().map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)}</option>`).join("");
    farmSelect.value = (farm || getAllFarms()[0]).id;
    farmSelect.disabled = isEdit;
  } else {
    farmField.hidden = true;
    farmSelect.innerHTML = "";
    farmSelect.disabled = false;
  }

  const resolvedFarm = isTotalView ? state.data.farms[farmSelect.value] : getFarm();
  populatePastureAreaPotreiroSelect(resolvedFarm);
  const potreiroSelect = document.getElementById("pastureAreaPotreiro");
  const potreiro = area ? (resolvedFarm?.potreiros || []).find((p) => p.id === area.potreiroId) : null;
  potreiroSelect.value = potreiro?.id || "";
  document.getElementById("pastureAreaPotreiroTotalHa").value = area?.potreiroTotalHa ?? potreiro?.areaHa ?? "";

  const cultureSelect = document.getElementById("pastureAreaCulture");
  const customCultureField = document.getElementById("pastureAreaCustomCultureField");

  document.getElementById("pastureAreaSizeHa").value = area?.sizeHa ?? "";
  document.getElementById("pastureAreaStatus").value = area?.status || "planejada";
  cultureSelect.value = area?.culture || PASTURE_CULTURES[0].id;
  document.getElementById("pastureAreaCustomCulture").value = area?.customCulture || "";
  customCultureField.hidden = cultureSelect.value !== "outra";
  document.getElementById("pastureAreaSeason").value = area?.season || "";
  document.getElementById("pastureAreaStartDate").value = area?.startDate || "";
  document.getElementById("pastureAreaNotes").value = area?.notes || "";

  document.getElementById("pastureAreaDialog").showModal();
}

function handlePastureAreaSubmit(event) {
  event.preventDefault();
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farmId = isTotalView ? document.getElementById("pastureAreaFarm").value : getFarm().id;
  const farm = state.data.farms[farmId];
  if (!farm) return;

  const potreiroId = document.getElementById("pastureAreaPotreiro").value;
  const potreiro = (farm.potreiros || []).find((p) => p.id === potreiroId);
  if (!potreiro) {
    alert("Selecione um potreiro cadastrado nesta fazenda.");
    return;
  }

  const potreiroTotalHa = Number(document.getElementById("pastureAreaPotreiroTotalHa").value) || 0;
  potreiro.areaHa = potreiroTotalHa; // mantém a área do potreiro sincronizada para as próximas pastagens

  const culture = document.getElementById("pastureAreaCulture").value;
  const payload = {
    potreiroId,
    name: potreiro.name,
    potreiroTotalHa,
    sizeHa: Number(document.getElementById("pastureAreaSizeHa").value) || 0,
    status: document.getElementById("pastureAreaStatus").value,
    culture,
    customCulture: culture === "outra" ? document.getElementById("pastureAreaCustomCulture").value.trim() : "",
    season: document.getElementById("pastureAreaSeason").value.trim(),
    startDate: document.getElementById("pastureAreaStartDate").value || "",
    notes: document.getElementById("pastureAreaNotes").value.trim()
  };

  if (!Array.isArray(farm.pastureAreas)) farm.pastureAreas = [];

  let savedArea;
  if (pastureAreaDialogContext.areaId) {
    savedArea = farm.pastureAreas.find((a) => a.id === pastureAreaDialogContext.areaId);
    if (savedArea) Object.assign(savedArea, payload);
    logAuditEvent("Editar área de pastagem", "pastagens", `${payload.name} (${farm.name})`);
  } else {
    savedArea = {
      id: createPastureId("area"),
      preparoOperations: [],
      desiccationApplications: [],
      implantationRecords: [],
      grazingPeriods: [],
      procedures: [],
      ...payload
    };
    farm.pastureAreas.push(savedArea);
    logAuditEvent("Nova área de pastagem", "pastagens", `${payload.name} (${farm.name})`);
  }

  saveData();
  document.getElementById("pastureAreaDialog").close();
  render();
  if (savedArea) openPastureFichaDialog(farm, savedArea);
}

function openPastureProcedureDialog(farm, area, procedure) {
  const isEdit = !!procedure;
  pastureProcDialogContext = {
    farmId: farm.id,
    areaId: area.id,
    procedureId: procedure ? procedure.id : null,
    attachment: procedure?.attachment || null
  };

  document.getElementById("pastureProcedureDialogTitle").textContent = isEdit ? "Editar procedimento" : "Novo procedimento";
  document.getElementById("pastureProcedureAreaLabel").textContent = `${area.name} · ${farm.name}`;

  const typeSelect = document.getElementById("pastureProcType");
  const customTypeField = document.getElementById("pastureProcCustomTypeField");

  document.getElementById("pastureProcDate").value = procedure?.date || "";
  typeSelect.value = procedure?.type || PASTURE_PROCEDURE_TYPES[0].id;
  document.getElementById("pastureProcCustomType").value = procedure?.customType || "";
  customTypeField.hidden = typeSelect.value !== "outros";
  document.getElementById("pastureProcDescription").value = procedure?.description || "";
  document.getElementById("pastureProcResponsible").value = procedure?.responsible || "";
  document.getElementById("pastureProcAreaHa").value = procedure?.areaHa ?? "";
  document.getElementById("pastureProcQuantity").value = procedure?.quantity ?? "";
  document.getElementById("pastureProcUnit").value = procedure?.unit || PASTURE_UNITS[0].id;
  document.getElementById("pastureProcUnitValue").value = procedure?.unitValue ?? "";
  document.getElementById("pastureProcTotalValue").value = formatCurrency(procedure?.totalValue || 0);
  document.getElementById("pastureProcNotes").value = procedure?.notes || "";
  document.getElementById("pastureProcAttachment").value = "";
  document.getElementById("pastureProcAttachmentInfo").textContent = procedure?.attachment ? `Anexo: ${procedure.attachment.name}` : "";

  document.getElementById("pastureProcedureDialog").showModal();
}

function handlePastureProcedureSubmit(event) {
  event.preventDefault();
  const farm = state.data.farms[pastureProcDialogContext.farmId];
  const area = farm ? getPastureAreas(farm).find((a) => a.id === pastureProcDialogContext.areaId) : null;
  if (!farm || !area) return;

  const type = document.getElementById("pastureProcType").value;
  const quantity = Number(document.getElementById("pastureProcQuantity").value) || 0;
  const unitValue = Number(document.getElementById("pastureProcUnitValue").value) || 0;

  const payload = {
    date: document.getElementById("pastureProcDate").value || "",
    type,
    customType: type === "outros" ? document.getElementById("pastureProcCustomType").value.trim() : "",
    description: document.getElementById("pastureProcDescription").value.trim(),
    responsible: document.getElementById("pastureProcResponsible").value.trim(),
    areaHa: Number(document.getElementById("pastureProcAreaHa").value) || 0,
    quantity,
    unit: document.getElementById("pastureProcUnit").value,
    unitValue,
    totalValue: quantity * unitValue,
    notes: document.getElementById("pastureProcNotes").value.trim(),
    attachment: pastureProcDialogContext.attachment || null
  };

  if (!Array.isArray(area.procedures)) area.procedures = [];

  if (pastureProcDialogContext.procedureId) {
    const procedure = area.procedures.find((p) => p.id === pastureProcDialogContext.procedureId);
    if (procedure) Object.assign(procedure, payload);
    logAuditEvent("Editar procedimento de pastagem", "pastagens", `${getPastureProcedureTypeLabel(payload)} · ${area.name}`);
  } else {
    area.procedures.push({ id: createPastureId("proc"), ...payload });
    logAuditEvent("Novo procedimento de pastagem", "pastagens", `${getPastureProcedureTypeLabel(payload)} · ${area.name}`);
  }

  saveData();
  document.getElementById("pastureProcedureDialog").close();
  render();
  refreshOpenPastureFicha();
}

/* ── Ficha da pastagem (abas) ─────────────────────────────────────── */
let pastureFichaContext = { farmId: null, areaId: null, activeTab: "identificacao" };

function getPastureFichaContext() {
  const farm = state.data.farms[pastureFichaContext.farmId];
  const area = farm ? getPastureAreas(farm).find((a) => a.id === pastureFichaContext.areaId) : null;
  return { farm, area };
}

function refreshOpenPastureFicha() {
  const dialog = document.getElementById("pastureFichaDialog");
  if (!dialog?.open || !pastureFichaContext.areaId) return;
  renderPastureFichaActivePanel();
}

function openPastureFichaDialog(farm, area) {
  pastureFichaContext = { farmId: farm.id, areaId: area.id, activeTab: "identificacao" };
  document.getElementById("pastureFichaKicker").textContent = `${farm.name} · ${area.name}`;
  if (document.getElementById("pastureFichaDialog").open) document.getElementById("pastureFichaDialog").close();
  document.getElementById("pastureFichaDialog").showModal();
  switchPastureFichaTab("identificacao");
}

function switchPastureFichaTab(tabId) {
  pastureFichaContext.activeTab = tabId;
  document.querySelectorAll("#pastureFichaTabs [data-ficha-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.fichaTab === tabId);
  });
  document.querySelectorAll(".pasture-ficha-panel").forEach((panel) => {
    panel.hidden = panel.dataset.fichaPanel !== tabId;
  });
  renderPastureFichaActivePanel();
}

function renderPastureFichaActivePanel() {
  const { farm, area } = getPastureFichaContext();
  if (!farm || !area) {
    document.getElementById("pastureFichaDialog").close();
    return;
  }
  switch (pastureFichaContext.activeTab) {
    case "identificacao": renderPastureFichaIdentificacao(farm, area); break;
    case "preparo": renderPastureFichaPreparo(farm, area); break;
    case "implantacao": renderPastureFichaImplantacao(farm, area); break;
    case "resumo": renderPastureFichaResumo(farm, area); break;
    case "utilizacao": renderPastureFichaUtilizacao(farm, area); break;
  }
}

function renderPastureFichaIdentificacao(farm, area) {
  const panel = document.querySelector('[data-ficha-panel="identificacao"]');
  panel.innerHTML = `
    <div class="pasture-ficha-id-grid">
      <div><span class="field-note">Fazenda</span><strong>${escapeHtml(farm.name)}</strong></div>
      <div><span class="field-note">Potreiro</span><strong>${escapeHtml(area.name)}</strong></div>
      <div><span class="field-note">Área total do potreiro</span><strong>${formatHa(area.potreiroTotalHa || 0)}</strong></div>
      <div><span class="field-note">Área destinada à pastagem</span><strong>${formatHa(area.sizeHa)}</strong></div>
      <div><span class="field-note">Cultura</span><strong>${escapeHtml(getPastureCultureLabel(area))}</strong></div>
      <div><span class="field-note">Safra</span><strong>${escapeHtml(area.season || "—")}</strong></div>
      <div><span class="field-note">Data prevista de início</span><strong>${formatDate(area.startDate)}</strong></div>
      <div><span class="field-note">Status</span><strong><span class="pasture-status ${escapeHtml(area.status)}">${escapeHtml(getPastureStatusLabel(area.status))}</span></strong></div>
    </div>
    ${area.notes ? `<p class="pasture-ficha-notes"><strong>Observações:</strong> ${escapeHtml(area.notes)}</p>` : ""}
    <div class="form-actions">
      <button type="button" class="ghost-btn" data-ficha-action="edit-basic">Editar dados básicos</button>
    </div>
  `;
}

function renderPastureFichaPreparo(farm, area) {
  const panel = document.querySelector('[data-ficha-panel="preparo"]');

  const gradagemRows = (area.preparoOperations || []).map((op) => `
    <tr>
      <td data-label="Data">${formatDate(op.data)}</td>
      <td data-label="Tipo">${escapeHtml(getPreparoTypeLabel(op))}</td>
      <td data-label="Passadas">${formatInteger(op.passadas || 0)}</td>
      <td data-label="Custo/ha">${formatCurrency(op.custoPorHa)}</td>
      <td data-label="Área (ha)">${formatHa(op.areaTrabalhada)}</td>
      <td data-label="Total">${formatCurrency(op.custoTotal)}</td>
      <td data-label="Ações">
        <div class="pasture-row-actions">
          <button type="button" data-ficha-action="edit-gradagem" data-entry-id="${escapeHtml(op.id)}">Editar</button>
          <button type="button" class="danger" data-ficha-action="delete-gradagem" data-entry-id="${escapeHtml(op.id)}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");

  const dessecacaoRows = (area.desiccationApplications || []).map((app) => `
    <tr>
      <td data-label="Data">${formatDate(app.data)}</td>
      <td data-label="Produto">${escapeHtml(app.produto || "—")}</td>
      <td data-label="Método">${escapeHtml(getDessecacaoMethodLabel(app))}</td>
      <td data-label="Vazão">${formatWeight(app.vazaoLHa || 0)} L/ha</td>
      <td data-label="Hectares">${formatHa(app.hectares)}</td>
      <td data-label="Total">${formatCurrency(app.custoTotal)}</td>
      <td data-label="Ações">
        <div class="pasture-row-actions">
          <button type="button" data-ficha-action="edit-dessecacao" data-entry-id="${escapeHtml(app.id)}">Editar</button>
          <button type="button" class="danger" data-ficha-action="delete-dessecacao" data-entry-id="${escapeHtml(app.id)}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");

  const outrosRows = (area.procedures || []).map((p) => `
    <tr>
      <td data-label="Data">${formatDate(p.date)}</td>
      <td data-label="Tipo">${escapeHtml(getPastureProcedureTypeLabel(p))}</td>
      <td data-label="Descrição">${escapeHtml(p.description || "—")}</td>
      <td data-label="Qtd.">${formatWeight(p.quantity || 0)} ${escapeHtml(getPastureUnitLabel(p.unit))}</td>
      <td data-label="Total">${formatCurrency(p.totalValue)}</td>
      <td data-label="Ações">
        <div class="pasture-row-actions">
          <button type="button" data-ficha-action="edit-procedure" data-entry-id="${escapeHtml(p.id)}">Editar</button>
          <button type="button" class="danger" data-ficha-action="delete-procedure" data-entry-id="${escapeHtml(p.id)}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");

  panel.innerHTML = `
    <section class="pasture-ficha-subsection">
      <div class="pasture-ficha-subsection-header">
        <h3>Gradagem / rolo-faca</h3>
        <button type="button" class="ghost-btn" data-ficha-action="new-gradagem">+ Nova operação</button>
      </div>
      ${gradagemRows ? `<div class="table-wrap"><table class="pasture-areas-table"><thead><tr><th>Data</th><th>Tipo</th><th>Passadas</th><th>Custo/ha</th><th>Área</th><th>Total</th><th></th></tr></thead><tbody>${gradagemRows}</tbody></table></div>` : `<p class="field-note">Nenhuma operação registrada.</p>`}
    </section>

    <section class="pasture-ficha-subsection">
      <div class="pasture-ficha-subsection-header">
        <h3>Dessecação</h3>
        <button type="button" class="ghost-btn" data-ficha-action="new-dessecacao">+ Nova aplicação</button>
      </div>
      ${dessecacaoRows ? `<div class="table-wrap"><table class="pasture-areas-table"><thead><tr><th>Data</th><th>Produto</th><th>Método</th><th>Vazão</th><th>Hectares</th><th>Total</th><th></th></tr></thead><tbody>${dessecacaoRows}</tbody></table></div>` : `<p class="field-note">Nenhuma aplicação registrada.</p>`}
    </section>

    <section class="pasture-ficha-subsection">
      <div class="pasture-ficha-subsection-header">
        <h3>Outros insumos</h3>
        <button type="button" class="ghost-btn" data-ficha-action="new-procedure">+ Novo insumo</button>
      </div>
      ${outrosRows ? `<div class="table-wrap"><table class="pasture-areas-table"><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Total</th><th></th></tr></thead><tbody>${outrosRows}</tbody></table></div>` : `<p class="field-note">Nenhum insumo registrado.</p>`}
    </section>
  `;
}

function renderPastureFichaImplantacao(farm, area) {
  const panel = document.querySelector('[data-ficha-panel="implantacao"]');
  const rows = (area.implantationRecords || []).map((rec) => `
    <tr>
      <td data-label="Data">${formatDate(rec.data)}</td>
      <td data-label="Método">${escapeHtml(getImplantacaoMethodLabel(rec))}</td>
      <td data-label="Semente">${escapeHtml(rec.tipoSemente || "—")}</td>
      <td data-label="Kg/ha">${formatWeight(rec.kgHa || 0)}</td>
      <td data-label="Hectares">${formatHa(rec.hectares)}</td>
      <td data-label="Total">${formatCurrency(rec.custoTotal)}</td>
      <td data-label="Ações">
        <div class="pasture-row-actions">
          <button type="button" data-ficha-action="edit-implantacao" data-entry-id="${escapeHtml(rec.id)}">Editar</button>
          <button type="button" class="danger" data-ficha-action="delete-implantacao" data-entry-id="${escapeHtml(rec.id)}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");

  panel.innerHTML = `
    <section class="pasture-ficha-subsection">
      <div class="pasture-ficha-subsection-header">
        <h3>Implantação (semeadura)</h3>
        <button type="button" class="ghost-btn" data-ficha-action="new-implantacao">+ Nova implantação</button>
      </div>
      ${rows ? `<div class="table-wrap"><table class="pasture-areas-table"><thead><tr><th>Data</th><th>Método</th><th>Semente</th><th>Kg/ha</th><th>Hectares</th><th>Total</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="field-note">Nenhuma implantação registrada.</p>`}
    </section>
  `;
}

function renderPastureFichaResumo(farm, area) {
  const panel = document.querySelector('[data-ficha-panel="resumo"]');
  const preparo = getAreaPreparoCost(area);
  const dessecacao = getAreaDessecacaoCost(area);
  const implantacao = getAreaImplantacaoCost(area);
  const outros = getAreaOutrosCost(area);
  const total = preparo + dessecacao + implantacao + outros;
  const costHa = getAreaCostPerHa(area);

  panel.innerHTML = `
    <div class="pasture-summary-grid">
      <article class="pasture-summary-card"><p class="panel-kicker">Custo do preparo</p><strong>${formatCurrency(preparo)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Custo da dessecação</p><strong>${formatCurrency(dessecacao)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Custo da implantação</p><strong>${formatCurrency(implantacao)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Outros insumos</p><strong>${formatCurrency(outros)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Custo total da área</p><strong>${formatCurrency(total)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Custo final por hectare</p><strong>${formatCurrency(costHa)}</strong><span class="pasture-summary-detail">${formatHa(area.sizeHa)} implantados</span></article>
    </div>
  `;
}

function renderPastureFichaUtilizacao(farm, area) {
  const panel = document.querySelector('[data-ficha-panel="utilizacao"]');
  const rows = (area.grazingPeriods || []).map((g) => `
    <tr>
      <td data-label="Entrada">${formatDate(g.dataEntrada)}</td>
      <td data-label="Saída">${g.dataSaida ? formatDate(g.dataSaida) : "Em andamento"}</td>
      <td data-label="Categoria">${escapeHtml(g.categoriaAnimal || "—")}</td>
      <td data-label="Qtd.">${formatInteger(g.quantidade || 0)}</td>
      <td data-label="Peso entrada">${g.pesoMedioEntrada ? `${formatWeight(g.pesoMedioEntrada)} kg` : "—"}</td>
      <td data-label="Peso saída">${g.pesoMedioSaida ? `${formatWeight(g.pesoMedioSaida)} kg` : "—"}</td>
      <td data-label="Dias">${g.diasUtilizacao != null ? formatInteger(g.diasUtilizacao) : "—"}</td>
      <td data-label="Lotação/ha">${g.lotacaoPorHa ? formatWeight(g.lotacaoPorHa) : "—"}</td>
      <td data-label="Ações">
        <div class="pasture-row-actions">
          <button type="button" data-ficha-action="edit-utilizacao" data-entry-id="${escapeHtml(g.id)}">Editar</button>
          <button type="button" class="danger" data-ficha-action="delete-utilizacao" data-entry-id="${escapeHtml(g.id)}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");

  panel.innerHTML = `
    <section class="pasture-ficha-subsection">
      <div class="pasture-ficha-subsection-header">
        <h3>Utilização da pastagem</h3>
        <button type="button" class="ghost-btn" data-ficha-action="new-utilizacao">+ Novo período</button>
      </div>
      ${rows ? `<div class="table-wrap"><table class="pasture-areas-table"><thead><tr><th>Entrada</th><th>Saída</th><th>Categoria</th><th>Qtd.</th><th>Peso entrada</th><th>Peso saída</th><th>Dias</th><th>Lotação/ha</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="field-note">Nenhum período de utilização registrado.</p>`}
    </section>
  `;
}

function handlePastureFichaClick(event) {
  const target = event.target.closest("[data-ficha-action]");
  if (!target) return;
  const { farm, area } = getPastureFichaContext();
  if (!farm || !area) return;
  const action = target.dataset.fichaAction;
  const entryId = target.dataset.entryId;

  switch (action) {
    case "edit-basic":
      document.getElementById("pastureFichaDialog").close();
      openPastureAreaDialog(area, farm);
      break;
    case "new-gradagem":
      openPastureGradagemDialog(farm, area, null);
      break;
    case "edit-gradagem":
      openPastureGradagemDialog(farm, area, (area.preparoOperations || []).find((op) => op.id === entryId));
      break;
    case "delete-gradagem":
      if (confirm("Excluir esta operação de preparo?")) deletePastureGradagem(farm, area, entryId);
      break;
    case "new-dessecacao":
      openPastureDessecacaoDialog(farm, area, null);
      break;
    case "edit-dessecacao":
      openPastureDessecacaoDialog(farm, area, (area.desiccationApplications || []).find((a) => a.id === entryId));
      break;
    case "delete-dessecacao":
      if (confirm("Excluir esta aplicação de dessecação?")) deletePastureDessecacao(farm, area, entryId);
      break;
    case "new-procedure":
      openPastureProcedureDialog(farm, area, null);
      break;
    case "edit-procedure":
      openPastureProcedureDialog(farm, area, (area.procedures || []).find((p) => p.id === entryId));
      break;
    case "delete-procedure":
      if (confirm("Excluir este insumo?")) deletePastureProcedure(farm, area, entryId);
      break;
    case "new-implantacao":
      openPastureImplantacaoDialog(farm, area, null);
      break;
    case "edit-implantacao":
      openPastureImplantacaoDialog(farm, area, (area.implantationRecords || []).find((r) => r.id === entryId));
      break;
    case "delete-implantacao":
      if (confirm("Excluir este lançamento de implantação?")) deletePastureImplantacao(farm, area, entryId);
      break;
    case "new-utilizacao":
      openPastureUtilizacaoDialog(farm, area, null);
      break;
    case "edit-utilizacao":
      openPastureUtilizacaoDialog(farm, area, (area.grazingPeriods || []).find((g) => g.id === entryId));
      break;
    case "delete-utilizacao":
      if (confirm("Excluir este período de utilização?")) deletePastureUtilizacao(farm, area, entryId);
      break;
  }
}

/* ── Gradagem / rolo-faca ─────────────────────────────────────────── */
let pastureGradagemDialogContext = { farmId: null, areaId: null, entryId: null };

function openPastureGradagemDialog(farm, area, entry) {
  const isEdit = !!entry;
  pastureGradagemDialogContext = { farmId: farm.id, areaId: area.id, entryId: entry ? entry.id : null };
  document.getElementById("pastureGradagemDialogTitle").textContent = isEdit ? "Editar gradagem / rolo-faca" : "Gradagem / rolo-faca";
  document.getElementById("pastureGradagemAreaLabel").textContent = `${area.name} · ${farm.name}`;

  const tipoSelect = document.getElementById("pastureGradagemTipo");
  const customField = document.getElementById("pastureGradagemCustomTipoField");
  tipoSelect.value = entry?.tipo || PASTURE_PREPARO_TYPES[0].id;
  document.getElementById("pastureGradagemCustomTipo").value = entry?.customTipo || "";
  customField.hidden = tipoSelect.value !== "outro";
  document.getElementById("pastureGradagemData").value = entry?.data || "";
  document.getElementById("pastureGradagemPassadas").value = entry?.passadas ?? "";
  document.getElementById("pastureGradagemCustoPorHa").value = entry?.custoPorHa ?? "";
  document.getElementById("pastureGradagemAreaTrabalhada").value = entry?.areaTrabalhada ?? "";
  document.getElementById("pastureGradagemCustoTotal").value = formatCurrency(entry?.custoTotal || 0);

  document.getElementById("pastureGradagemDialog").showModal();
}

function handlePastureGradagemSubmit(event) {
  event.preventDefault();
  const farm = state.data.farms[pastureGradagemDialogContext.farmId];
  const area = farm ? getPastureAreas(farm).find((a) => a.id === pastureGradagemDialogContext.areaId) : null;
  if (!farm || !area) return;

  const tipo = document.getElementById("pastureGradagemTipo").value;
  const custoPorHa = Number(document.getElementById("pastureGradagemCustoPorHa").value) || 0;
  const areaTrabalhada = Number(document.getElementById("pastureGradagemAreaTrabalhada").value) || 0;
  const payload = {
    tipo,
    customTipo: tipo === "outro" ? document.getElementById("pastureGradagemCustomTipo").value.trim() : "",
    data: document.getElementById("pastureGradagemData").value || "",
    passadas: Number(document.getElementById("pastureGradagemPassadas").value) || 0,
    custoPorHa,
    areaTrabalhada,
    custoTotal: custoPorHa * areaTrabalhada
  };

  if (!Array.isArray(area.preparoOperations)) area.preparoOperations = [];
  if (pastureGradagemDialogContext.entryId) {
    const entry = area.preparoOperations.find((op) => op.id === pastureGradagemDialogContext.entryId);
    if (entry) Object.assign(entry, payload);
    logAuditEvent("Editar preparo de área (pastagem)", "pastagens", `${getPreparoTypeLabel(payload)} · ${area.name}`);
  } else {
    area.preparoOperations.push({ id: createPastureId("prep"), ...payload });
    logAuditEvent("Novo preparo de área (pastagem)", "pastagens", `${getPreparoTypeLabel(payload)} · ${area.name}`);
  }

  saveData();
  document.getElementById("pastureGradagemDialog").close();
  render();
  refreshOpenPastureFicha();
}

function deletePastureGradagem(farm, area, entryId) {
  area.preparoOperations = (area.preparoOperations || []).filter((op) => op.id !== entryId);
  logAuditEvent("Excluir preparo de área (pastagem)", "pastagens", area.name);
  saveData();
  render();
  refreshOpenPastureFicha();
}

/* ── Dessecação ───────────────────────────────────────────────────── */
let pastureDessecacaoDialogContext = { farmId: null, areaId: null, entryId: null };

function openPastureDessecacaoDialog(farm, area, entry) {
  const isEdit = !!entry;
  pastureDessecacaoDialogContext = { farmId: farm.id, areaId: area.id, entryId: entry ? entry.id : null };
  document.getElementById("pastureDessecacaoDialogTitle").textContent = isEdit ? "Editar dessecação" : "Dessecação";
  document.getElementById("pastureDessecacaoAreaLabel").textContent = `${area.name} · ${farm.name}`;

  document.getElementById("pastureDessecacaoData").value = entry?.data || "";
  document.getElementById("pastureDessecacaoProduto").value = entry?.produto || "";
  document.getElementById("pastureDessecacaoMetodo").value = entry?.metodo || PASTURE_DESSECACAO_METHODS[0].id;
  document.getElementById("pastureDessecacaoVazao").value = entry?.vazaoLHa ?? "";
  document.getElementById("pastureDessecacaoHectares").value = entry?.hectares ?? "";
  document.getElementById("pastureDessecacaoPrecoLitro").value = entry?.precoLitro ?? "";
  document.getElementById("pastureDessecacaoCustoAplicacaoHa").value = entry?.custoAplicacaoHa ?? "";
  document.getElementById("pastureDessecacaoQuantidadeTotal").value = entry ? `${formatWeight(entry.quantidadeTotal || 0)} L` : "";
  document.getElementById("pastureDessecacaoCustoProduto").value = formatCurrency(entry?.custoProduto || 0);
  document.getElementById("pastureDessecacaoCustoAplicacaoTotal").value = formatCurrency(entry?.custoAplicacaoTotal || 0);
  document.getElementById("pastureDessecacaoCustoTotal").value = formatCurrency(entry?.custoTotal || 0);

  document.getElementById("pastureDessecacaoDialog").showModal();
}

function handlePastureDessecacaoSubmit(event) {
  event.preventDefault();
  const farm = state.data.farms[pastureDessecacaoDialogContext.farmId];
  const area = farm ? getPastureAreas(farm).find((a) => a.id === pastureDessecacaoDialogContext.areaId) : null;
  if (!farm || !area) return;

  const vazaoLHa = Number(document.getElementById("pastureDessecacaoVazao").value) || 0;
  const hectares = Number(document.getElementById("pastureDessecacaoHectares").value) || 0;
  const precoLitro = Number(document.getElementById("pastureDessecacaoPrecoLitro").value) || 0;
  const custoAplicacaoHa = Number(document.getElementById("pastureDessecacaoCustoAplicacaoHa").value) || 0;
  const quantidadeTotal = vazaoLHa * hectares;
  const custoProduto = quantidadeTotal * precoLitro;
  const custoAplicacaoTotal = custoAplicacaoHa * hectares;

  const payload = {
    data: document.getElementById("pastureDessecacaoData").value || "",
    produto: document.getElementById("pastureDessecacaoProduto").value.trim(),
    metodo: document.getElementById("pastureDessecacaoMetodo").value,
    vazaoLHa,
    hectares,
    quantidadeTotal,
    precoLitro,
    custoProduto,
    custoAplicacaoHa,
    custoAplicacaoTotal,
    custoTotal: custoProduto + custoAplicacaoTotal
  };

  if (!Array.isArray(area.desiccationApplications)) area.desiccationApplications = [];
  if (pastureDessecacaoDialogContext.entryId) {
    const entry = area.desiccationApplications.find((a) => a.id === pastureDessecacaoDialogContext.entryId);
    if (entry) Object.assign(entry, payload);
    logAuditEvent("Editar dessecação (pastagem)", "pastagens", `${payload.produto} · ${area.name}`);
  } else {
    area.desiccationApplications.push({ id: createPastureId("dess"), ...payload });
    logAuditEvent("Nova dessecação (pastagem)", "pastagens", `${payload.produto} · ${area.name}`);
  }

  saveData();
  document.getElementById("pastureDessecacaoDialog").close();
  render();
  refreshOpenPastureFicha();
}

function deletePastureDessecacao(farm, area, entryId) {
  area.desiccationApplications = (area.desiccationApplications || []).filter((a) => a.id !== entryId);
  logAuditEvent("Excluir dessecação (pastagem)", "pastagens", area.name);
  saveData();
  render();
  refreshOpenPastureFicha();
}

/* ── Implantação ──────────────────────────────────────────────────── */
let pastureImplantacaoDialogContext = { farmId: null, areaId: null, entryId: null };

function openPastureImplantacaoDialog(farm, area, entry) {
  const isEdit = !!entry;
  pastureImplantacaoDialogContext = { farmId: farm.id, areaId: area.id, entryId: entry ? entry.id : null };
  document.getElementById("pastureImplantacaoDialogTitle").textContent = isEdit ? "Editar implantação" : "Implantação";
  document.getElementById("pastureImplantacaoAreaLabel").textContent = `${area.name} · ${farm.name}`;

  document.getElementById("pastureImplantacaoMetodo").value = entry?.metodo || PASTURE_IMPLANTACAO_METHODS[0].id;
  document.getElementById("pastureImplantacaoData").value = entry?.data || "";
  document.getElementById("pastureImplantacaoTipoSemente").value = entry?.tipoSemente || "";
  document.getElementById("pastureImplantacaoKgHa").value = entry?.kgHa ?? "";
  document.getElementById("pastureImplantacaoHectares").value = entry?.hectares ?? "";
  document.getElementById("pastureImplantacaoQuantidadeTotal").value = entry ? `${formatWeight(entry.quantidadeTotalSementes || 0)} kg` : "";
  document.getElementById("pastureImplantacaoCustoPorKg").value = entry?.custoPorKg ?? "";
  document.getElementById("pastureImplantacaoCustoSementes").value = formatCurrency(entry?.custoSementes || 0);
  document.getElementById("pastureImplantacaoCustoSemeaduraHa").value = entry?.custoSemeaduraHa ?? "";
  document.getElementById("pastureImplantacaoCustoOperacao").value = formatCurrency(entry?.custoOperacao || 0);
  document.getElementById("pastureImplantacaoCustoTotal").value = formatCurrency(entry?.custoTotal || 0);

  document.getElementById("pastureImplantacaoDialog").showModal();
}

function handlePastureImplantacaoSubmit(event) {
  event.preventDefault();
  const farm = state.data.farms[pastureImplantacaoDialogContext.farmId];
  const area = farm ? getPastureAreas(farm).find((a) => a.id === pastureImplantacaoDialogContext.areaId) : null;
  if (!farm || !area) return;

  const kgHa = Number(document.getElementById("pastureImplantacaoKgHa").value) || 0;
  const hectares = Number(document.getElementById("pastureImplantacaoHectares").value) || 0;
  const custoPorKg = Number(document.getElementById("pastureImplantacaoCustoPorKg").value) || 0;
  const custoSemeaduraHa = Number(document.getElementById("pastureImplantacaoCustoSemeaduraHa").value) || 0;
  const quantidadeTotalSementes = kgHa * hectares;
  const custoSementes = quantidadeTotalSementes * custoPorKg;
  const custoOperacao = custoSemeaduraHa * hectares;

  const payload = {
    metodo: document.getElementById("pastureImplantacaoMetodo").value,
    data: document.getElementById("pastureImplantacaoData").value || "",
    tipoSemente: document.getElementById("pastureImplantacaoTipoSemente").value.trim(),
    kgHa,
    hectares,
    quantidadeTotalSementes,
    custoPorKg,
    custoSementes,
    custoSemeaduraHa,
    custoOperacao,
    custoTotal: custoSementes + custoOperacao
  };

  if (!Array.isArray(area.implantationRecords)) area.implantationRecords = [];
  if (pastureImplantacaoDialogContext.entryId) {
    const entry = area.implantationRecords.find((r) => r.id === pastureImplantacaoDialogContext.entryId);
    if (entry) Object.assign(entry, payload);
    logAuditEvent("Editar implantação (pastagem)", "pastagens", `${payload.tipoSemente} · ${area.name}`);
  } else {
    area.implantationRecords.push({ id: createPastureId("impl"), ...payload });
    logAuditEvent("Nova implantação (pastagem)", "pastagens", `${payload.tipoSemente} · ${area.name}`);
  }

  saveData();
  document.getElementById("pastureImplantacaoDialog").close();
  render();
  refreshOpenPastureFicha();
}

function deletePastureImplantacao(farm, area, entryId) {
  area.implantationRecords = (area.implantationRecords || []).filter((r) => r.id !== entryId);
  logAuditEvent("Excluir implantação (pastagem)", "pastagens", area.name);
  saveData();
  render();
  refreshOpenPastureFicha();
}

/* ── Utilização da pastagem ───────────────────────────────────────── */
let pastureUtilizacaoDialogContext = { farmId: null, areaId: null, entryId: null };

function openPastureUtilizacaoDialog(farm, area, entry) {
  const isEdit = !!entry;
  pastureUtilizacaoDialogContext = { farmId: farm.id, areaId: area.id, entryId: entry ? entry.id : null };
  document.getElementById("pastureUtilizacaoDialogTitle").textContent = isEdit ? "Editar utilização" : "Utilização da pastagem";
  document.getElementById("pastureUtilizacaoAreaLabel").textContent = `${area.name} · ${farm.name}`;

  document.getElementById("pastureUtilizacaoEntrada").value = entry?.dataEntrada || "";
  document.getElementById("pastureUtilizacaoSaida").value = entry?.dataSaida || "";
  document.getElementById("pastureUtilizacaoCategoria").value = entry?.categoriaAnimal || "";
  document.getElementById("pastureUtilizacaoQuantidade").value = entry?.quantidade ?? "";
  document.getElementById("pastureUtilizacaoPesoEntrada").value = entry?.pesoMedioEntrada ?? "";
  document.getElementById("pastureUtilizacaoPesoSaida").value = entry?.pesoMedioSaida ?? "";
  document.getElementById("pastureUtilizacaoNotes").value = entry?.notes || "";
  document.getElementById("pastureUtilizacaoDias").value = entry?.diasUtilizacao != null ? `${formatInteger(entry.diasUtilizacao)} dia(s)` : "Em andamento";
  document.getElementById("pastureUtilizacaoLotacao").value = entry?.lotacaoPorHa ? formatWeight(entry.lotacaoPorHa) : "—";

  document.getElementById("pastureUtilizacaoDialog").showModal();
}

function handlePastureUtilizacaoSubmit(event) {
  event.preventDefault();
  const farm = state.data.farms[pastureUtilizacaoDialogContext.farmId];
  const area = farm ? getPastureAreas(farm).find((a) => a.id === pastureUtilizacaoDialogContext.areaId) : null;
  if (!farm || !area) return;

  const dataEntrada = document.getElementById("pastureUtilizacaoEntrada").value || "";
  const dataSaida = document.getElementById("pastureUtilizacaoSaida").value || "";
  const quantidade = Number(document.getElementById("pastureUtilizacaoQuantidade").value) || 0;
  const diasUtilizacao = dataEntrada && dataSaida
    ? Math.max(0, Math.round((new Date(dataSaida) - new Date(dataEntrada)) / 86400000))
    : null;
  const sizeHa = Number(area.sizeHa) || 0;
  const lotacaoPorHa = sizeHa > 0 ? quantidade / sizeHa : 0;

  const payload = {
    dataEntrada,
    dataSaida,
    categoriaAnimal: document.getElementById("pastureUtilizacaoCategoria").value.trim(),
    quantidade,
    pesoMedioEntrada: Number(document.getElementById("pastureUtilizacaoPesoEntrada").value) || 0,
    pesoMedioSaida: Number(document.getElementById("pastureUtilizacaoPesoSaida").value) || 0,
    diasUtilizacao,
    lotacaoPorHa,
    notes: document.getElementById("pastureUtilizacaoNotes").value.trim()
  };

  if (!Array.isArray(area.grazingPeriods)) area.grazingPeriods = [];
  if (pastureUtilizacaoDialogContext.entryId) {
    const entry = area.grazingPeriods.find((g) => g.id === pastureUtilizacaoDialogContext.entryId);
    if (entry) Object.assign(entry, payload);
    logAuditEvent("Editar utilização (pastagem)", "pastagens", `${payload.categoriaAnimal} · ${area.name}`);
  } else {
    area.grazingPeriods.push({ id: createPastureId("util"), ...payload });
    logAuditEvent("Nova utilização (pastagem)", "pastagens", `${payload.categoriaAnimal} · ${area.name}`);
  }

  saveData();
  document.getElementById("pastureUtilizacaoDialog").close();
  render();
  refreshOpenPastureFicha();
}

function deletePastureUtilizacao(farm, area, entryId) {
  area.grazingPeriods = (area.grazingPeriods || []).filter((g) => g.id !== entryId);
  logAuditEvent("Excluir utilização (pastagem)", "pastagens", area.name);
  saveData();
  render();
  refreshOpenPastureFicha();
}

/* ── CRUD: excluir/duplicar ───────────────────────────────────────── */
function deletePastureArea(farm, area) {
  farm.pastureAreas = getPastureAreas(farm).filter((a) => a.id !== area.id);
  logAuditEvent("Excluir área de pastagem", "pastagens", `${area.name} (${farm.name})`);
  saveData();
  render();
}

function duplicatePastureArea(farm, area) {
  const copy = cloneDeep(area);
  copy.id = createPastureId("area");
  copy.name = `${area.name} (cópia)`;
  copy.procedures = (copy.procedures || []).map((p) => ({ ...p, id: createPastureId("proc") }));
  copy.preparoOperations = (copy.preparoOperations || []).map((op) => ({ ...op, id: createPastureId("prep") }));
  copy.desiccationApplications = (copy.desiccationApplications || []).map((a) => ({ ...a, id: createPastureId("dess") }));
  copy.implantationRecords = (copy.implantationRecords || []).map((r) => ({ ...r, id: createPastureId("impl") }));
  copy.grazingPeriods = (copy.grazingPeriods || []).map((g) => ({ ...g, id: createPastureId("util") }));
  farm.pastureAreas.push(copy);
  logAuditEvent("Duplicar área de pastagem", "pastagens", `${area.name} (${farm.name})`);
  saveData();
  render();
}

function deletePastureProcedure(farm, area, procedureId) {
  area.procedures = (area.procedures || []).filter((p) => p.id !== procedureId);
  logAuditEvent("Excluir procedimento de pastagem", "pastagens", `${area.name} (${farm.name})`);
  saveData();
  render();
  refreshOpenPastureFicha();
}

function duplicatePastureProcedure(farm, area, procedureId) {
  const procedure = (area.procedures || []).find((p) => p.id === procedureId);
  if (!procedure) return;
  const copy = cloneDeep(procedure);
  copy.id = createPastureId("proc");
  area.procedures.push(copy);
  logAuditEvent("Duplicar procedimento de pastagem", "pastagens", `${area.name} (${farm.name})`);
  saveData();
  render();
  refreshOpenPastureFicha();
}

/* ── Exportação PDF ───────────────────────────────────────────────── */
async function exportPasturePdf() {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("Biblioteca de PDF não disponível. Verifique sua conexão e recarregue a página.");
    return;
  }
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farm = getFarm();
  const rows = getFilteredPastureRows();
  const metrics = computePastureMetrics(rows);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  try {
    const imageData = await loadLogoForPdf("#ffffff");
    doc.addImage(imageData, "JPEG", 14, 10, 22, 22);
  } catch (error) {
    console.warn("Não foi possível carregar o logo para o PDF.", error);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Wolf Agricultura e Pecuária", 42, 18);
  doc.setFontSize(15);
  doc.text("Pastagens / Custo por Hectare", 42, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`Escopo: ${isTotalView ? "Todas as Fazendas" : (farm?.name || "—")}`, 42, 33);
  doc.text(`Responsável técnico: ${TECHNICAL_MANAGER_NAME}`, 42, 39);
  doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 150, 33);

  let y = 52;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Resumo executivo", 14, y);
  y += 4;

  doc.autoTable({
    startY: y,
    theme: "grid",
    head: [["Indicador", "Valor"]],
    body: [
      ["Total investido", formatCurrency(metrics.totalCost)],
      ["Área total implantada", formatHa(metrics.totalHa)],
      ["Custo médio / ha", formatCurrency(metrics.avgCostHa)],
      ["Cultura com maior custo", metrics.topCulture ? `${metrics.topCulture.label} (${formatCurrency(metrics.topCulture.value)})` : "—"],
      [metrics.isTotalView ? "Fazenda com maior investimento" : "Área com maior investimento", metrics.topGroup ? `${metrics.topGroup.label} (${formatCurrency(metrics.topGroup.value)})` : "—"],
      ["Procedimento mais oneroso", metrics.topProcedure ? `${metrics.topProcedure.label} (${formatCurrency(metrics.topProcedure.value)})` : "—"],
      ["Áreas cadastradas", formatInteger(metrics.areaCount)]
    ],
    headStyles: { fillColor: [43, 132, 184] },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Áreas de pastagem", 14, y);
  y += 4;

  doc.autoTable({
    startY: y,
    theme: "striped",
    head: [["Fazenda", "Área", "Cultura", "Safra", "Status", "Procedimentos", "Hectares", "Custo total", "Custo/ha"]],
    body: rows.map(({ farm: rowFarm, area }) => [
      rowFarm.name,
      area.name,
      getPastureCultureLabel(area),
      area.season || "—",
      getPastureStatusLabel(area.status),
      formatInteger((area.procedures || []).length),
      formatHa(area.sizeHa),
      formatCurrency(getAreaTotalCost(area)),
      formatCurrency(getAreaCostPerHa(area))
    ]),
    headStyles: { fillColor: [43, 132, 184] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5 }
  });

  y = doc.lastAutoTable.finalY + 10;
  if (y > 170) { doc.addPage(); y = 16; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Procedimentos detalhados", 14, y);
  y += 4;

  const procBody = [];
  rows.forEach(({ farm: rowFarm, area }) => {
    getAreaCostEntries(area).forEach((entry) => {
      procBody.push([
        rowFarm.name,
        area.name,
        formatDate(entry.date),
        entry.typeLabel,
        entry.responsible || "—",
        formatCurrency(entry.value)
      ]);
    });
  });

  doc.autoTable({
    startY: y,
    theme: "striped",
    head: [["Fazenda", "Área", "Data", "Lançamento", "Responsável", "Total"]],
    body: procBody.length ? procBody : [["—", "—", "—", "—", "—", "—"]],
    headStyles: { fillColor: [43, 132, 184] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 }
  });

  const fileFarmLabel = isTotalView ? "todas-as-fazendas" : slugify(farm?.name || "fazenda");
  doc.save(`pastagens-custo-por-hectare-${fileFarmLabel}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/* ── Exportação Excel ─────────────────────────────────────────────── */
async function exportPastureExcel() {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farm = getFarm();
  const rows = getFilteredPastureRows();
  const metrics = computePastureMetrics(rows);
  const scopeLabel = isTotalView ? "Todas as Fazendas" : (farm?.name || "—");
  const emittedLabel = new Date().toLocaleDateString("pt-BR");

  let logoDataUrl = "";
  try {
    logoDataUrl = await loadLogoForPdf("#ffffff");
  } catch (error) {
    console.warn("Não foi possível carregar o logo para o Excel.", error);
  }

  let html = `<table border="0" cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px;font-family:Arial, sans-serif;">`;
  html += `<tr>`;
  if (logoDataUrl) {
    html += `<td rowspan="4" style="width:90px;"><img src="${logoDataUrl}" width="80" height="80" alt="Wolf Agricultura e Pecuária"></td>`;
  }
  html += `<td style="font-size:18pt;font-weight:bold;color:#375b43;">Wolf Agricultura e Pecuária</td></tr>`;
  html += `<tr><td style="font-size:13pt;font-weight:bold;color:#c9a84c;">Pastagens / Custo por Hectare</td></tr>`;
  html += `<tr><td>Escopo: ${escapeHtml(scopeLabel)}</td></tr>`;
  html += `<tr><td>Responsável técnico: ${escapeHtml(TECHNICAL_MANAGER_NAME)} &nbsp;|&nbsp; Emitido em: ${escapeHtml(emittedLabel)}</td></tr>`;
  html += `</table>`;

  html += `<table border="1"><thead><tr><th colspan="2">Resumo executivo</th></tr></thead><tbody>`;
  html += `<tr><td>Escopo</td><td>${escapeHtml(scopeLabel)}</td></tr>`;
  html += `<tr><td>Total investido</td><td>${formatCurrency(metrics.totalCost)}</td></tr>`;
  html += `<tr><td>Área total implantada</td><td>${formatHa(metrics.totalHa)}</td></tr>`;
  html += `<tr><td>Custo médio / ha</td><td>${formatCurrency(metrics.avgCostHa)}</td></tr>`;
  html += `</tbody></table><br/>`;

  html += `<table border="1"><thead><tr><th>Fazenda</th><th>Área</th><th>Cultura</th><th>Safra</th><th>Status</th><th>Procedimentos</th><th>Hectares</th><th>Custo total</th><th>Custo/ha</th></tr></thead><tbody>`;
  rows.forEach(({ farm: rowFarm, area }) => {
    html += `<tr>
      <td>${escapeHtml(rowFarm.name)}</td>
      <td>${escapeHtml(area.name)}</td>
      <td>${escapeHtml(getPastureCultureLabel(area))}</td>
      <td>${escapeHtml(area.season || "—")}</td>
      <td>${escapeHtml(getPastureStatusLabel(area.status))}</td>
      <td>${formatInteger(getAreaCostEntries(area).length)}</td>
      <td>${Number(area.sizeHa) || 0}</td>
      <td>${getAreaTotalCost(area).toFixed(2)}</td>
      <td>${getAreaCostPerHa(area).toFixed(2)}</td>
    </tr>`;
  });
  html += `</tbody></table><br/>`;

  html += `<table border="1"><thead><tr><th>Fazenda</th><th>Área</th><th>Data</th><th>Lançamento</th><th>Responsável</th><th>Valor total</th></tr></thead><tbody>`;
  rows.forEach(({ farm: rowFarm, area }) => {
    getAreaCostEntries(area).forEach((entry) => {
      html += `<tr>
        <td>${escapeHtml(rowFarm.name)}</td>
        <td>${escapeHtml(area.name)}</td>
        <td>${escapeHtml(formatDate(entry.date))}</td>
        <td>${escapeHtml(entry.typeLabel)}</td>
        <td>${escapeHtml(entry.responsible || "—")}</td>
        <td>${entry.value.toFixed(2)}</td>
      </tr>`;
    });
  });
  html += `</tbody></table>`;

  const blob = new Blob(["﻿", html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const fileFarmLabel = isTotalView ? "todas-as-fazendas" : slugify(farm?.name || "fazenda");
  link.download = `pastagens-custo-por-hectare-${fileFarmLabel}-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

/* ── Card no painel inicial (Home) ────────────────────────────────── */
const PASTURE_HOME_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c0-4.4-2-6.4-2-10a4 4 0 0 1 8 0c0 3.6-2 5.6-2 10"/><path d="M12 14c-4 0-7-2-7-6 4 0 7 2 7 6z"/><path d="M12 14c4 0 7-2 7-6-4 0-7 2-7 6z"/></svg>`;

function injectPastagensHomeCard() {
  const grid = document.querySelector(".home-module-grid");
  if (!grid) return;

  const existing = grid.querySelector('[data-nav-home="pastagens"]');
  if (existing) existing.remove();

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const rows = isTotalView ? getAllPastureAreasWithFarm() : getPastureAreas(getFarm()).map((area) => ({ farm: getFarm(), area }));
  const totalCost = rows.reduce((s, { area }) => s + getAreaTotalCost(area), 0);
  const totalHa = rows.reduce((s, { area }) => s + (Number(area.sizeHa) || 0), 0);
  const avgCostHa = totalHa > 0 ? totalCost / totalHa : 0;

  grid.insertAdjacentHTML("beforeend", `
    <div class="home-module-card" data-nav-home="pastagens" tabindex="0" role="button">
      <div class="hmc-top">
        <div class="hmc-icon" style="background:#f7ecd0;color:#8a6d1f">${PASTURE_HOME_ICON}</div>
        ${avgCostHa > 0 ? `<span class="hmc-badge" style="color:#8a6d1f;background:#f7ecd0">Custo médio: ${formatCurrency(avgCostHa)}/ha</span>` : ""}
      </div>
      <div class="hmc-body">
        <h3 class="hmc-title">Pastagens / Custo por Hectare</h3>
        <p class="hmc-desc">Áreas de pastagem, procedimentos e custo por hectare por cultura e safra</p>
        <div class="hmc-metric">
          <strong class="hmc-value" style="color:#8a6d1f">${formatCurrency(totalCost)}</strong>
          <span class="hmc-unit">${formatHa(totalHa)} implantados</span>
        </div>
      </div>
      <div class="hmc-actions">
        <button type="button" class="hmc-btn-primary" style="background:#8a6d1f" data-nav-home="pastagens" data-pasture-home-action="new-area">Nova área</button>
        <button type="button" class="hmc-btn-secondary" data-nav-home="pastagens">Ver pastagens</button>
      </div>
    </div>
  `);

  const card = grid.querySelector('[data-nav-home="pastagens"]');
  [card, ...card.querySelectorAll("[data-nav-home]")].forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const openNew = trigger.dataset.pastureHomeAction === "new-area";
      state.activeView = "pastagens";
      render();
      if (openNew) {
        const defaultFarm = isTotalView ? (state.data.farms[runtime.pastureFilters.farmId] || getAllFarms()[0]) : getFarm();
        openPastureAreaDialog(null, defaultFarm);
      }
    });
  });
}

const brunaOriginalRenderHomeView = renderHomeView;
renderHomeView = function () {
  brunaOriginalRenderHomeView();
  injectPastagensHomeCard();
};

/* ── Resumo no painel da fazenda (dashboard) ─────────────────────── */
(function injectPastureSummarySection() {
  const globalPanel = document.querySelector(".global-panel");
  if (globalPanel && !document.getElementById("pastureSummarySection")) {
    globalPanel.insertAdjacentHTML("beforeend", `<section class="pasture-summary-section" id="pastureSummarySection"></section>`);
  }
})();

function renderPastureSummarySection() {
  const section = document.getElementById("pastureSummarySection");
  if (!section) return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farm = getFarm();
  const rows = isTotalView ? getAllPastureAreasWithFarm() : getPastureAreas(farm).map((area) => ({ farm, area }));
  const totalCost = rows.reduce((s, { area }) => s + getAreaTotalCost(area), 0);
  const totalHa = rows.reduce((s, { area }) => s + (Number(area.sizeHa) || 0), 0);
  const avgCostHa = totalHa > 0 ? totalCost / totalHa : 0;
  const areasEmUtilizacao = rows.filter(({ area }) => area.status === "utilizacao").length;

  section.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="panel-kicker">Custos agrícolas</p>
        <h2>Pastagens / Custo por Hectare</h2>
      </div>
      <button type="button" class="ghost-btn" id="pastureSummaryDetailsBtn">Ver detalhes</button>
    </div>
    <div class="pasture-summary-grid">
      <article class="pasture-summary-card">
        <p class="panel-kicker">Total investido</p>
        <strong>${formatCurrency(totalCost)}</strong>
        <span class="pasture-summary-detail">${formatInteger(rows.length)} área(s) cadastrada(s)</span>
      </article>
      <article class="pasture-summary-card">
        <p class="panel-kicker">Custo médio / ha</p>
        <strong>${formatCurrency(avgCostHa)}</strong>
        <span class="pasture-summary-detail">considerando toda a área implantada</span>
      </article>
      <article class="pasture-summary-card">
        <p class="panel-kicker">Área implantada</p>
        <strong>${formatHa(totalHa)}</strong>
        <span class="pasture-summary-detail">somatório das áreas cadastradas</span>
      </article>
      <article class="pasture-summary-card">
        <p class="panel-kicker">Áreas em utilização</p>
        <strong>${formatInteger(areasEmUtilizacao)}</strong>
        <span class="pasture-summary-detail">${isTotalView ? "em todas as fazendas" : `em ${escapeHtml(farm?.name || "fazenda")}`}</span>
      </article>
    </div>
  `;

  document.getElementById("pastureSummaryDetailsBtn").addEventListener("click", () => {
    state.activeView = "pastagens";
    render();
  });
}

const brunaOriginalRenderOverviewPanelForPastagens = renderOverviewPanel;
renderOverviewPanel = function () {
  brunaOriginalRenderOverviewPanelForPastagens();
  renderPastureSummarySection();
};

/* ── Navegação: view "pastagens" ─────────────────────────────────── */
function injectPastagensBackButton() {
  const el = elements.pastagensView;
  if (!el || el.querySelector(".back-to-home-bar")) return;

  const farmLabel = state.data.selectedFarmId === TOTAL_FARM_ID ? "Todas as Fazendas" : (getFarm()?.name || "Fazenda");
  const bar = document.createElement("div");
  bar.className = "back-to-home-bar";
  bar.innerHTML = `
    <button type="button" class="btn-back-home">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
      Painel
    </button>
    <span class="back-breadcrumb">
      <span class="back-farm">${escapeHtml(farmLabel)}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      <span>Pastagens / Custo por Hectare</span>
    </span>
  `;
  bar.querySelector(".btn-back-home").addEventListener("click", () => {
    state.activeView = "home";
    render();
  });
  el.insertBefore(bar, el.firstChild);
}

const brunaOriginalRenderActiveViewForPastagens = renderActiveView;
renderActiveView = function () {
  brunaOriginalRenderActiveViewForPastagens();
  const view = state.activeView;
  if (elements.pastagensView) elements.pastagensView.hidden = view !== "pastagens";
  if (view === "pastagens") {
    renderPastagensView();
    injectPastagensBackButton();
  }
};

/* ── Inicialização ────────────────────────────────────────────────── */
function injectPastagensView() {
  if (document.getElementById("pastagensView")) {
    elements.pastagensView = document.getElementById("pastagensView");
    return;
  }
  const view = document.createElement("div");
  view.id = "pastagensView";
  view.hidden = true;
  elements.dashboardView.insertAdjacentElement("afterend", view);
  elements.pastagensView = view;
  injectPastureDialogs();
  view.addEventListener("click", handlePastagensViewClick);
  view.addEventListener("change", handlePastagensViewChange);
}

injectPastagensView();

/* Garante que tudo (ovinos, pastagens, fazendas renomeadas) apareça
   corretamente caso a sessão já esteja autenticada ao recarregar a
   página — boot() roda antes deste script terminar de aplicar os
   monkeypatches acima. */
if (isAuthenticated()) {
  render();
}
