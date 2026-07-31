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
  { id: "capim-sudao", name: "Capim-sudão" },
  { id: "trevo", name: "Trevo" },
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
  { id: "dessecacao", name: "Em dessecação" },
  { id: "implantacao", name: "Em implantação" },
  { id: "implantada", name: "Implantada" },
  { id: "utilizacao", name: "Em utilização" },
  { id: "descanso", name: "Em descanso" },
  { id: "encerrada", name: "Encerrada" }
];

const PASTURE_PREPARO_TYPES = [
  { id: "grade", name: "Grade" },
  { id: "rolo-faca", name: "Rolo-faca" },
  { id: "subsolagem", name: "Subsolagem" },
  { id: "nivelamento", name: "Nivelamento" },
  { id: "outro", name: "Outro" }
];

const PASTURE_DESSECACAO_METHODS = [
  { id: "terrestre", name: "Pulverizador terrestre" },
  { id: "aviao", name: "Avião" },
  { id: "drone", name: "Drone" },
  { id: "outro", name: "Outro" }
];

const PASTURE_IMPLANTACAO_METHODS = [
  { id: "plantio-direto", name: "Plantio direto" },
  { id: "lanco", name: "Semeadura a lanço" },
  { id: "aviao", name: "Avião" },
  { id: "drone", name: "Drone" },
  { id: "outro", name: "Outro" }
];

const PASTURE_SPECIES = [
  { id: "bovinos", name: "Bovinos" },
  { id: "ovinos", name: "Ovinos" }
];

const PASTURE_BOVINE_CATEGORIES = ["Terneiros", "Terneiras", "Novilhas", "Vacas", "Bois", "Touros", "Outra"];
const PASTURE_OVINE_CATEGORIES = ["Cordeiros", "Cordeiras", "Ovelhas", "Carneiros", "Outra"];
const PASTURE_LEGACY_PERIOD_KEY = ["sea", "son"].join("");

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
  { id: "dessecacao", label: "Dessecação" },
  { id: "implantacao", label: "Implantação" },
  { id: "utilizacao", label: "Utilização" },
  { id: "resumo", label: "Custos e relatório" }
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
  if (op.tipo === "gradagem") return "Grade";
  return labelFromOptions(PASTURE_PREPARO_TYPES, op.tipo, op.customTipo);
}

function getDessecacaoMethodLabel(app) {
  return labelFromOptions(PASTURE_DESSECACAO_METHODS, app.metodo, app.customMetodo);
}

function getImplantacaoMethodLabel(rec) {
  return labelFromOptions(PASTURE_IMPLANTACAO_METHODS, rec.metodo, rec.customMetodo);
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

function getAreaImplantedHa(area) {
  const implanted = (area.implantationRecords || []).reduce((sum, rec) => sum + (Number(rec.hectares) || 0), 0);
  return implanted > 0 ? implanted : (Number(area.sizeHa) || 0);
}

function getAreaCostPerHa(area) {
  const ha = getAreaImplantedHa(area);
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

function createPastureCode() {
  const maxCode = getAllPastureAreasWithFarm().reduce((max, { area }) => {
    const match = /^PAS-(\d+)$/i.exec(String(area.code || ""));
    return match ? Math.max(max, Number(match[1]) || 0) : max;
  }, 0);
  return `PAS-${String(maxCode + 1).padStart(4, "0")}`;
}

function getPastureDisplayCode(area) {
  return area.code || area.id || "PAS-0000";
}

function getPastureUtilizationSituation(area) {
  const periods = area.grazingPeriods || [];
  if (periods.some((g) => !g.dataSaida)) return "Em utilização";
  return periods.length ? "Utilização encerrada" : "Sem utilização";
}

function getPastureLastOperation(area) {
  const entries = [
    ...getAreaCostEntries(area).map((entry) => ({ date: entry.date, label: entry.typeLabel })),
    ...(area.grazingPeriods || []).map((g) => ({ date: g.dataSaida || g.dataEntrada, label: g.dataSaida ? "Saída dos animais" : "Entrada dos animais" }))
  ].filter((entry) => entry.date);
  entries.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return entries[0]?.label || "—";
}

function populatePastureAreaPotreiroSelect(farm) {
  const select = document.getElementById("pastureAreaPotreiro");
  if (!select) return;
  const potreiros = farm?.potreiros || [];
  const registeredOptions = potreiros.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("");
  select.innerHTML = `${registeredOptions}<option value="__outro__">Outro</option>`;
}

function normalizePastureAreaRecords() {
  let changed = false;
  getAllFarms().forEach((farm) => {
    getPastureAreas(farm).forEach((area) => {
      if (!area.code) {
        area.code = createPastureCode();
        changed = true;
      }
      if (!area.createdAt) {
        area.createdAt = area.startDate ? new Date(`${area.startDate}T00:00:00`).toISOString() : new Date().toISOString();
        changed = true;
      }
      if (!area.updatedAt) {
        area.updatedAt = area.createdAt;
        changed = true;
      }
      if (Object.prototype.hasOwnProperty.call(area, PASTURE_LEGACY_PERIOD_KEY)) {
        delete area[PASTURE_LEGACY_PERIOD_KEY];
        changed = true;
      }
    });
  });
  if (changed) saveData({ silent: true });
}

/* ── Filtros ──────────────────────────────────────────────────────── */
function createDefaultPastureFilters() {
  return {
    farmId: "all",
    areaId: "all",
    culture: "all",
    procedureType: "all",
    responsible: "all",
    status: "all",
    utilization: "all",
    search: ""
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
  if (f.status !== "all") rows = rows.filter((row) => row.area.status === f.status);
  if (f.utilization !== "all") {
    rows = rows.filter((row) => {
      const situation = getPastureUtilizationSituation(row.area);
      if (f.utilization === "active") return situation === "Em utilização";
      if (f.utilization === "closed") return situation === "Utilização encerrada";
      if (f.utilization === "none") return situation === "Sem utilização";
      return true;
    });
  }
  if (f.search?.trim()) {
    const term = f.search.trim().toLowerCase();
    rows = rows.filter(({ farm, area }) => [
      getPastureDisplayCode(area),
      farm.name,
      area.name,
      getPastureCultureLabel(area)
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }

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
  let activeUseCount = 0;
  const cultureCost = new Map();
  const groupCost = new Map();
  const procedureCost = new Map();
  let lastEntry = null;

  rows.forEach(({ farm, area }) => {
    const areaCost = getAreaTotalCost(area);
    totalCost += areaCost;
    totalHa += getAreaImplantedHa(area);
    if (area.status === "utilizacao" || getPastureUtilizationSituation(area) === "Em utilização") activeUseCount += 1;

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
    activeUseCount,
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

function renderPastureCharts(rows) {
  renderPastureCultureChart(rows);
  renderPastureGroupChart(rows);
  renderPastureProcedureChart(rows);
  renderPastureMonthlyChart(rows);
  renderPastureRankingChart(rows);
}

/* ── Cards executivos ─────────────────────────────────────────────── */
function renderPastureExecCards(metrics) {
  const groupTitle = metrics.isTotalView ? "Fazenda com maior investimento" : "Área com maior investimento";
  const cards = [
    { title: "Total investido", value: formatCurrency(metrics.totalCost), detail: "investidos em pastagens" },
    { title: "Custo médio / ha", value: `${formatCurrency(metrics.avgCostHa)}/ha`, detail: "custo médio por hectare" },
    { title: "Hectares implantados", value: formatHa(metrics.totalHa), detail: "total de hectares implantados" },
    { title: "Áreas em utilização", value: formatInteger(metrics.activeUseCount), detail: "pastagens com animais em campo" },
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
      <label>Situação da utilização
        <select data-pasture-filter="utilization">
          <option value="all">Todas</option>
          <option value="active">Em utilização</option>
          <option value="closed">Utilização encerrada</option>
          <option value="none">Sem utilização</option>
        </select>
      </label>
      <label class="span-2">Pesquisar
        <input type="search" data-pasture-filter="search" placeholder="Código, fazenda, potreiro ou cultura" value="${escapeHtml(runtime.pastureFilters.search || "")}">
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

  const responsibles = [...new Set(scopeFarms.flatMap((farm) =>
    getPastureAreas(farm).flatMap((a) => (a.procedures || []).map((p) => p.responsible).filter(Boolean))
  ))].sort();
  const responsibleSelect = view.querySelector('[data-pasture-filter="responsible"]');
  if (responsibleSelect) {
    responsibleSelect.innerHTML = `<option value="all">Todos</option>` + responsibles.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");
    responsibleSelect.value = responsibles.includes(f.responsible) ? f.responsible : "all";
  }

  ["farmId", "culture", "procedureType", "status", "utilization"].forEach((key) => {
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
              <th>Código</th>
              <th>Potreiro</th>
              <th>Cultura</th>
              <th>Início</th>
              <th>Status</th>
              <th>Hectares</th>
              <th>Custo total</th>
              <th>Custo / ha</th>
              <th>Última operação</th>
              <th>Utilização</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ farm, area }) => {
              const totalCost = getAreaTotalCost(area);
              const costHa = getAreaCostPerHa(area);
              const status = area.status || "planejada";
              const utilization = getPastureUtilizationSituation(area);

              return `
                <tr class="pasture-area-row">
                  ${isTotalView ? `<td data-label="Fazenda">${escapeHtml(farm.name)}</td>` : ""}
                  <td data-label="Código"><strong>${escapeHtml(getPastureDisplayCode(area))}</strong></td>
                  <td data-label="Potreiro">
                    <strong>${escapeHtml(area.name)}</strong>
                    <div class="pasture-area-meta">${escapeHtml(farm.name)}</div>
                  </td>
                  <td data-label="Cultura">${escapeHtml(getPastureCultureLabel(area))}</td>
                  <td data-label="Início">${formatDate(area.startDate)}</td>
                  <td data-label="Status"><span class="pasture-status ${escapeHtml(status)}">${escapeHtml(getPastureStatusLabel(status))}</span></td>
                  <td data-label="Hectares">${formatHa(getAreaImplantedHa(area))}</td>
                  <td data-label="Custo total">${formatCurrency(totalCost)}</td>
                  <td data-label="Custo / ha">${formatCurrency(costHa)}</td>
                  <td data-label="Última operação">${escapeHtml(getPastureLastOperation(area))}</td>
                  <td data-label="Utilização">${escapeHtml(utilization)}</td>
                  <td data-label="Ações">
                    <div class="pasture-row-actions">
                      <button type="button" data-pasture-action="open-ficha" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Visualizar</button>
                      <button type="button" data-pasture-action="edit-area" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Editar</button>
                      <button type="button" data-pasture-action="new-preparo" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Registrar preparo</button>
                      <button type="button" data-pasture-action="new-dessecacao" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Registrar dessecação</button>
                      <button type="button" data-pasture-action="new-implantacao" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Registrar implantação</button>
                      <button type="button" data-pasture-action="new-utilizacao" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Registrar utilização</button>
                      <button type="button" data-pasture-action="report-area" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Gerar relatório</button>
                      <button type="button" data-pasture-action="close-area" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Encerrar</button>
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
          <button type="button" class="card-btn-report" data-pasture-action="export-pdf">Gerar Relatório</button>
          <button type="button" class="card-btn-new" data-pasture-action="new-area">+ Nova área</button>
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
    case "edit-area":
      if (area) openPastureAreaDialog(area, farm);
      break;
    case "new-preparo":
      if (area) openPastureGradagemDialog(farm, area, null);
      break;
    case "new-dessecacao":
      if (area) openPastureDessecacaoDialog(farm, area, null);
      break;
    case "new-implantacao":
      if (area) openPastureImplantacaoDialog(farm, area, null);
      break;
    case "new-utilizacao":
      if (area) openPastureUtilizacaoDialog(farm, area, null);
      break;
    case "report-area":
      if (area) exportPastureIndividualPdf(farm, area);
      break;
    case "close-area":
      if (area && confirm(`Encerrar a pastagem "${area.name}"?`)) {
        area.status = "encerrada";
        area.updatedAt = new Date().toISOString();
        logAuditEvent("Encerrar área de pastagem", "pastagens", `${area.name} (${farm.name})`);
        saveData();
        renderPastagensView();
      }
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

function handlePastagensViewInput(event) {
  const target = event.target.closest('[data-pasture-filter="search"]');
  if (!target) return;
  runtime.pastureFilters.search = target.value;
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
          <label class="span-2" id="pastureAreaFarmDisplayField" hidden>Fazenda selecionada
            <input type="text" id="pastureAreaFarmDisplay" readonly />
          </label>
          <label>Potreiro
            <select id="pastureAreaPotreiro" required></select>
          </label>
          <label id="pastureAreaCustomPotreiroField" hidden>Qual potreiro?
            <input type="text" id="pastureAreaCustomPotreiro" maxlength="80" />
          </label>
          <label>Área total da cultura (ha)
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
          <label>Data de início
            <input type="date" id="pastureAreaStartDate" required />
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
            <h2 id="pastureGradagemDialogTitle">Preparo da área</h2>
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
            <input type="number" id="pastureGradagemPassadas" min="1" step="1" value="1" />
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
          <label id="pastureDessecacaoCustomMetodoField" hidden>Qual método?
            <input type="text" id="pastureDessecacaoCustomMetodo" maxlength="60" />
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
          <label id="pastureImplantacaoCustomMetodoField" hidden>Qual método?
            <input type="text" id="pastureImplantacaoCustomMetodo" maxlength="60" />
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
          <label>Espécie
            <select id="pastureUtilizacaoEspecie">
              ${PASTURE_SPECIES.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
          </label>
          <label>Categoria animal
            <select id="pastureUtilizacaoCategoria"></select>
          </label>
          <label id="pastureUtilizacaoCategoriaOutraField" hidden>Qual categoria?
            <input type="text" id="pastureUtilizacaoCategoriaOutra" maxlength="60" />
          </label>
          <label>Quantidade de animais
            <input type="number" id="pastureUtilizacaoQuantidade" min="0" step="1" required />
          </label>
          <label>Peso médio dos animais (kg)
            <input type="number" id="pastureUtilizacaoPesoMedio" min="0" step="0.1" />
          </label>
          <label>Data de saída
            <input type="date" id="pastureUtilizacaoSaida" />
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
        <div class="pasture-ficha-panel" data-ficha-panel="dessecacao" hidden></div>
        <div class="pasture-ficha-panel" data-ficha-panel="implantacao" hidden></div>
        <div class="pasture-ficha-panel" data-ficha-panel="utilizacao" hidden></div>
        <div class="pasture-ficha-panel" data-ficha-panel="resumo" hidden></div>
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
  const customPotreiroField = document.getElementById("pastureAreaCustomPotreiroField");
  const syncCustomPotreiroField = () => {
    customPotreiroField.hidden = potreiroSelect.value !== "__outro__";
    document.getElementById("pastureAreaCustomPotreiro").required = potreiroSelect.value === "__outro__";
  };
  potreiroSelect.addEventListener("change", syncCustomPotreiroField);
  farmSelect.addEventListener("change", () => {
    populatePastureAreaPotreiroSelect(state.data.farms[farmSelect.value]);
    syncCustomPotreiroField();
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
    const passadas = Math.max(1, Number(document.getElementById("pastureGradagemPassadas").value) || 1);
    document.getElementById("pastureGradagemCustoTotal").value = formatCurrency(custoPorHa * areaTrabalhada * passadas);
  }
  document.getElementById("pastureGradagemCustoPorHa").addEventListener("input", recalcGradagemTotal);
  document.getElementById("pastureGradagemAreaTrabalhada").addEventListener("input", recalcGradagemTotal);
  document.getElementById("pastureGradagemPassadas").addEventListener("input", recalcGradagemTotal);

  const dessecacaoMetodoSelect = document.getElementById("pastureDessecacaoMetodo");
  const dessecacaoCustomMetodoField = document.getElementById("pastureDessecacaoCustomMetodoField");
  dessecacaoMetodoSelect.addEventListener("change", () => {
    dessecacaoCustomMetodoField.hidden = dessecacaoMetodoSelect.value !== "outro";
  });

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

  const implantacaoMetodoSelect = document.getElementById("pastureImplantacaoMetodo");
  const implantacaoCustomMetodoField = document.getElementById("pastureImplantacaoCustomMetodoField");
  implantacaoMetodoSelect.addEventListener("change", () => {
    implantacaoCustomMetodoField.hidden = implantacaoMetodoSelect.value !== "outro";
  });

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

  function populateUtilizacaoCategories(selected = "") {
    const species = document.getElementById("pastureUtilizacaoEspecie").value;
    const categories = species === "ovinos" ? PASTURE_OVINE_CATEGORIES : PASTURE_BOVINE_CATEGORIES;
    const select = document.getElementById("pastureUtilizacaoCategoria");
    select.innerHTML = categories.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
    select.value = categories.includes(selected) ? selected : categories[0];
    document.getElementById("pastureUtilizacaoCategoriaOutraField").hidden = select.value !== "Outra";
  }
  document.getElementById("pastureUtilizacaoEspecie").addEventListener("change", () => populateUtilizacaoCategories());
  document.getElementById("pastureUtilizacaoCategoria").addEventListener("change", () => {
    document.getElementById("pastureUtilizacaoCategoriaOutraField").hidden = document.getElementById("pastureUtilizacaoCategoria").value !== "Outra";
  });
  window.populatePastureUtilizacaoCategories = populateUtilizacaoCategories;

  function recalcUtilizacaoDerived() {
    const entrada = document.getElementById("pastureUtilizacaoEntrada").value;
    const saida = document.getElementById("pastureUtilizacaoSaida").value;
    const quantidade = Number(document.getElementById("pastureUtilizacaoQuantidade").value) || 0;
    const dias = entrada && saida ? Math.max(0, Math.round((new Date(saida) - new Date(entrada)) / 86400000)) : null;
    document.getElementById("pastureUtilizacaoDias").value = dias === null ? "Em andamento" : `${formatInteger(dias)} dia(s)`;
    const currentArea = state.data.farms[pastureFichaContext.farmId]?.pastureAreas?.find((a) => a.id === pastureFichaContext.areaId);
    const sizeHa = currentArea ? getAreaImplantedHa(currentArea) : 0;
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
  const farmDisplayField = document.getElementById("pastureAreaFarmDisplayField");
  const farmDisplay = document.getElementById("pastureAreaFarmDisplay");
  const farmSelect = document.getElementById("pastureAreaFarm");
  if (isTotalView) {
    farmField.hidden = false;
    farmDisplayField.hidden = true;
    farmDisplay.value = "";
    farmSelect.innerHTML = getAllFarms().map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)}</option>`).join("");
    farmSelect.value = (farm || getAllFarms()[0]).id;
    farmSelect.disabled = isEdit;
  } else {
    farmField.hidden = true;
    farmDisplayField.hidden = false;
    farmDisplay.value = getFarm()?.name || "";
    farmSelect.innerHTML = "";
    farmSelect.disabled = false;
  }

  const resolvedFarm = isTotalView ? state.data.farms[farmSelect.value] : getFarm();
  populatePastureAreaPotreiroSelect(resolvedFarm);
  const potreiroSelect = document.getElementById("pastureAreaPotreiro");
  const potreiro = area ? (resolvedFarm?.potreiros || []).find((p) => p.id === area.potreiroId) : null;
  const isCustomPotreiro = !!area && !potreiro;
  potreiroSelect.value = isCustomPotreiro ? "__outro__" : (potreiro?.id || (potreiroSelect.options[0]?.value || "__outro__"));
  document.getElementById("pastureAreaCustomPotreiro").value = isCustomPotreiro ? (area.customPotreiroName || area.name || "") : "";
  document.getElementById("pastureAreaCustomPotreiroField").hidden = potreiroSelect.value !== "__outro__";
  document.getElementById("pastureAreaCustomPotreiro").required = potreiroSelect.value === "__outro__";

  const cultureSelect = document.getElementById("pastureAreaCulture");
  const customCultureField = document.getElementById("pastureAreaCustomCultureField");

  document.getElementById("pastureAreaSizeHa").value = area?.sizeHa ?? "";
  document.getElementById("pastureAreaStatus").value = area?.status || "planejada";
  cultureSelect.value = area?.culture || PASTURE_CULTURES[0].id;
  document.getElementById("pastureAreaCustomCulture").value = area?.customCulture || "";
  customCultureField.hidden = cultureSelect.value !== "outra";
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
  const isCustomPotreiro = potreiroId === "__outro__";
  const customPotreiroName = document.getElementById("pastureAreaCustomPotreiro").value.trim();
  const potreiro = isCustomPotreiro ? null : (farm.potreiros || []).find((p) => p.id === potreiroId);
  if (!isCustomPotreiro && !potreiro) {
    alert("Selecione um potreiro ou escolha Outro.");
    return;
  }
  if (isCustomPotreiro && !customPotreiroName) {
    alert("Informe o nome do potreiro.");
    return;
  }
  const sizeHa = Number(document.getElementById("pastureAreaSizeHa").value) || 0;
  if (!document.getElementById("pastureAreaStartDate").value) {
    alert("Informe a data de início da pastagem.");
    return;
  }

  const culture = document.getElementById("pastureAreaCulture").value;
  const payload = {
    potreiroId: isCustomPotreiro ? `custom-${slugify(customPotreiroName) || Date.now()}` : potreiroId,
    customPotreiroName: isCustomPotreiro ? customPotreiroName : "",
    name: isCustomPotreiro ? customPotreiroName : potreiro.name,
    potreiroTotalHa: 0,
    sizeHa,
    status: document.getElementById("pastureAreaStatus").value,
    culture,
    customCulture: culture === "outra" ? document.getElementById("pastureAreaCustomCulture").value.trim() : "",
    startDate: document.getElementById("pastureAreaStartDate").value || "",
    notes: document.getElementById("pastureAreaNotes").value.trim(),
    updatedAt: new Date().toISOString()
  };

  if (!Array.isArray(farm.pastureAreas)) farm.pastureAreas = [];

  let savedArea;
  if (pastureAreaDialogContext.areaId) {
    savedArea = farm.pastureAreas.find((a) => a.id === pastureAreaDialogContext.areaId);
    if (savedArea) {
      Object.assign(savedArea, payload);
      delete savedArea[PASTURE_LEGACY_PERIOD_KEY];
    }
    logAuditEvent("Editar área de pastagem", "pastagens", `${payload.name} (${farm.name})`);
  } else {
    savedArea = {
      id: createPastureId("area"),
      code: createPastureCode(),
      createdAt: new Date().toISOString(),
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
  area.updatedAt = new Date().toISOString();

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
    case "dessecacao": renderPastureFichaDessecacao(farm, area); break;
    case "implantacao": renderPastureFichaImplantacao(farm, area); break;
    case "resumo": renderPastureFichaResumo(farm, area); break;
    case "utilizacao": renderPastureFichaUtilizacao(farm, area); break;
  }
}

function renderPastureFichaIdentificacao(farm, area) {
  const panel = document.querySelector('[data-ficha-panel="identificacao"]');
  panel.innerHTML = `
    <div class="pasture-ficha-id-grid">
      <div><span class="field-note">Código da pastagem</span><strong>${escapeHtml(getPastureDisplayCode(area))}</strong></div>
      <div><span class="field-note">Fazenda</span><strong>${escapeHtml(farm.name)}</strong></div>
      <div><span class="field-note">Potreiro</span><strong>${escapeHtml(area.name)}</strong></div>
      <div><span class="field-note">Área total da cultura</span><strong>${formatHa(area.sizeHa)}</strong></div>
      <div><span class="field-note">Cultura</span><strong>${escapeHtml(getPastureCultureLabel(area))}</strong></div>
      <div><span class="field-note">Data de início</span><strong>${formatDate(area.startDate)}</strong></div>
      <div><span class="field-note">Status</span><strong><span class="pasture-status ${escapeHtml(area.status)}">${escapeHtml(getPastureStatusLabel(area.status))}</span></strong></div>
      <div><span class="field-note">Criado em</span><strong>${area.createdAt ? new Date(area.createdAt).toLocaleString("pt-BR") : "—"}</strong></div>
      <div><span class="field-note">Última atualização</span><strong>${area.updatedAt ? new Date(area.updatedAt).toLocaleString("pt-BR") : "—"}</strong></div>
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
        <h3>Preparo do solo</h3>
        <button type="button" class="ghost-btn" data-ficha-action="new-gradagem">+ Nova operação</button>
      </div>
      ${gradagemRows ? `<div class="table-wrap"><table class="pasture-areas-table"><thead><tr><th>Data</th><th>Tipo</th><th>Passadas</th><th>Custo/ha</th><th>Área</th><th>Total</th><th></th></tr></thead><tbody>${gradagemRows}</tbody></table></div>` : `<p class="field-note">Nenhuma operação registrada.</p>`}
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

function renderPastureFichaDessecacao(farm, area) {
  const panel = document.querySelector('[data-ficha-panel="dessecacao"]');
  const rows = (area.desiccationApplications || []).map((app) => `
    <tr>
      <td data-label="Data">${formatDate(app.data)}</td>
      <td data-label="Produto">${escapeHtml(app.produto || "—")}</td>
      <td data-label="Método">${escapeHtml(getDessecacaoMethodLabel(app))}</td>
      <td data-label="Vazão">${formatWeight(app.vazaoLHa || 0)} L/ha</td>
      <td data-label="Quantidade total">${formatWeight(app.quantidadeTotal || 0)} L</td>
      <td data-label="Produto">${formatCurrency(app.custoProduto || 0)}</td>
      <td data-label="Aplicação">${formatCurrency(app.custoAplicacaoTotal || 0)}</td>
      <td data-label="Total">${formatCurrency(app.custoTotal)}</td>
      <td data-label="Ações">
        <div class="pasture-row-actions">
          <button type="button" data-ficha-action="edit-dessecacao" data-entry-id="${escapeHtml(app.id)}">Editar</button>
          <button type="button" class="danger" data-ficha-action="delete-dessecacao" data-entry-id="${escapeHtml(app.id)}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");

  panel.innerHTML = `
    <section class="pasture-ficha-subsection">
      <div class="pasture-ficha-subsection-header">
        <h3>Dessecação</h3>
        <button type="button" class="ghost-btn" data-ficha-action="new-dessecacao">+ Nova aplicação</button>
      </div>
      ${rows ? `<div class="table-wrap"><table class="pasture-areas-table"><thead><tr><th>Data</th><th>Produto</th><th>Método</th><th>Vazão</th><th>Quantidade</th><th>Produto</th><th>Aplicação</th><th>Total</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="field-note">Nenhuma aplicação registrada.</p>`}
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
  const baseHa = getAreaImplantedHa(area);

  panel.innerHTML = `
    <div class="pasture-summary-grid">
      <article class="pasture-summary-card"><p class="panel-kicker">Custo do preparo</p><strong>${formatCurrency(preparo)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Custo da dessecação</p><strong>${formatCurrency(dessecacao)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Custo da implantação</p><strong>${formatCurrency(implantacao)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Outros insumos</p><strong>${formatCurrency(outros)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Custo geral da pastagem</p><strong>${formatCurrency(total)}</strong></article>
      <article class="pasture-summary-card"><p class="panel-kicker">Custo final por hectare</p><strong>${formatCurrency(costHa)}/ha</strong><span class="pasture-summary-detail">${formatHa(baseHa)} usados no cálculo</span></article>
    </div>
  `;
}

function renderPastureFichaUtilizacao(farm, area) {
  const panel = document.querySelector('[data-ficha-panel="utilizacao"]');
  const rows = (area.grazingPeriods || []).map((g) => `
    <tr>
      <td data-label="Entrada">${formatDate(g.dataEntrada)}</td>
      <td data-label="Espécie">${escapeHtml(g.especieLabel || "—")}</td>
      <td data-label="Categoria">${escapeHtml(g.categoriaAnimal || "—")}</td>
      <td data-label="Qtd.">${formatInteger(g.quantidade || 0)}</td>
      <td data-label="Peso médio">${g.pesoMedio ? `${formatWeight(g.pesoMedio)} kg` : "—"}</td>
      <td data-label="Peso vivo total">${g.pesoVivoTotal ? `${formatWeight(g.pesoVivoTotal)} kg` : "—"}</td>
      <td data-label="Saída">${g.dataSaida ? formatDate(g.dataSaida) : "Em utilização"}</td>
      <td data-label="Dias">${g.diasUtilizacao != null ? formatInteger(g.diasUtilizacao) : "—"}</td>
      <td data-label="Lotação/ha">${g.lotacaoPorHa ? formatWeight(g.lotacaoPorHa) : "—"}</td>
      <td data-label="Situação">${g.dataSaida ? "Utilização encerrada" : "Em utilização"}</td>
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
      ${rows ? `<div class="table-wrap"><table class="pasture-areas-table"><thead><tr><th>Entrada</th><th>Espécie</th><th>Categoria</th><th>Qtd.</th><th>Peso médio</th><th>Peso vivo total</th><th>Saída</th><th>Dias</th><th>Lotação/ha</th><th>Situação</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="field-note">Nenhum período de utilização registrado.</p>`}
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
  document.getElementById("pastureGradagemDialogTitle").textContent = isEdit ? "Editar preparo da área" : "Preparo da área";
  document.getElementById("pastureGradagemAreaLabel").textContent = `${area.name} · ${farm.name}`;

  const tipoSelect = document.getElementById("pastureGradagemTipo");
  const customField = document.getElementById("pastureGradagemCustomTipoField");
  tipoSelect.value = entry?.tipo === "gradagem" ? "grade" : (entry?.tipo || PASTURE_PREPARO_TYPES[0].id);
  document.getElementById("pastureGradagemCustomTipo").value = entry?.customTipo || "";
  customField.hidden = tipoSelect.value !== "outro";
  document.getElementById("pastureGradagemData").value = entry?.data || "";
  document.getElementById("pastureGradagemPassadas").value = entry?.passadas ?? 1;
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
  const passadas = Math.max(1, Number(document.getElementById("pastureGradagemPassadas").value) || 1);
  const payload = {
    tipo,
    customTipo: tipo === "outro" ? document.getElementById("pastureGradagemCustomTipo").value.trim() : "",
    data: document.getElementById("pastureGradagemData").value || "",
    passadas,
    custoPorHa,
    areaTrabalhada,
    custoTotal: custoPorHa * areaTrabalhada * passadas
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
  area.updatedAt = new Date().toISOString();

  saveData();
  document.getElementById("pastureGradagemDialog").close();
  render();
  refreshOpenPastureFicha();
}

function deletePastureGradagem(farm, area, entryId) {
  area.preparoOperations = (area.preparoOperations || []).filter((op) => op.id !== entryId);
  area.updatedAt = new Date().toISOString();
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
  document.getElementById("pastureDessecacaoCustomMetodo").value = entry?.customMetodo || "";
  document.getElementById("pastureDessecacaoCustomMetodoField").hidden = document.getElementById("pastureDessecacaoMetodo").value !== "outro";
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
    customMetodo: document.getElementById("pastureDessecacaoMetodo").value === "outro"
      ? document.getElementById("pastureDessecacaoCustomMetodo").value.trim()
      : "",
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
  area.updatedAt = new Date().toISOString();

  saveData();
  document.getElementById("pastureDessecacaoDialog").close();
  render();
  refreshOpenPastureFicha();
}

function deletePastureDessecacao(farm, area, entryId) {
  area.desiccationApplications = (area.desiccationApplications || []).filter((a) => a.id !== entryId);
  area.updatedAt = new Date().toISOString();
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
  document.getElementById("pastureImplantacaoCustomMetodo").value = entry?.customMetodo || "";
  document.getElementById("pastureImplantacaoCustomMetodoField").hidden = document.getElementById("pastureImplantacaoMetodo").value !== "outro";
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
    customMetodo: document.getElementById("pastureImplantacaoMetodo").value === "outro"
      ? document.getElementById("pastureImplantacaoCustomMetodo").value.trim()
      : "",
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
  area.updatedAt = new Date().toISOString();

  saveData();
  document.getElementById("pastureImplantacaoDialog").close();
  render();
  refreshOpenPastureFicha();
}

function deletePastureImplantacao(farm, area, entryId) {
  area.implantationRecords = (area.implantationRecords || []).filter((r) => r.id !== entryId);
  area.updatedAt = new Date().toISOString();
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
  document.getElementById("pastureUtilizacaoEspecie").value = entry?.especie || "bovinos";
  if (typeof window.populatePastureUtilizacaoCategories === "function") {
    window.populatePastureUtilizacaoCategories(entry?.categoriaAnimal || "");
  }
  const categoriaOutraField = document.getElementById("pastureUtilizacaoCategoriaOutraField");
  const categoriaSelect = document.getElementById("pastureUtilizacaoCategoria");
  const knownCategories = [...PASTURE_BOVINE_CATEGORIES, ...PASTURE_OVINE_CATEGORIES];
  if (entry?.categoriaAnimal && !knownCategories.includes(entry.categoriaAnimal)) {
    categoriaSelect.value = "Outra";
    categoriaOutraField.hidden = false;
    document.getElementById("pastureUtilizacaoCategoriaOutra").value = entry.categoriaAnimal;
  } else {
    document.getElementById("pastureUtilizacaoCategoriaOutra").value = "";
    categoriaOutraField.hidden = categoriaSelect.value !== "Outra";
  }
  document.getElementById("pastureUtilizacaoQuantidade").value = entry?.quantidade ?? "";
  document.getElementById("pastureUtilizacaoPesoMedio").value = entry?.pesoMedio ?? entry?.pesoMedioEntrada ?? "";
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
  if (dataEntrada && dataSaida && dataSaida < dataEntrada) {
    alert("A data de saída não pode ser anterior à data de entrada.");
    return;
  }
  const quantidade = Number(document.getElementById("pastureUtilizacaoQuantidade").value) || 0;
  const diasUtilizacao = dataEntrada && dataSaida
    ? Math.max(0, Math.round((new Date(dataSaida) - new Date(dataEntrada)) / 86400000))
    : null;
  const sizeHa = getAreaImplantedHa(area);
  const lotacaoPorHa = sizeHa > 0 ? quantidade / sizeHa : 0;
  const especie = document.getElementById("pastureUtilizacaoEspecie").value;
  const especieLabel = PASTURE_SPECIES.find((s) => s.id === especie)?.name || especie;
  const categoriaSelectValue = document.getElementById("pastureUtilizacaoCategoria").value;
  const categoriaAnimal = categoriaSelectValue === "Outra"
    ? document.getElementById("pastureUtilizacaoCategoriaOutra").value.trim()
    : categoriaSelectValue;
  const pesoMedio = Number(document.getElementById("pastureUtilizacaoPesoMedio").value) || 0;

  const payload = {
    dataEntrada,
    dataSaida,
    especie,
    especieLabel,
    categoriaAnimal,
    quantidade,
    pesoMedio,
    pesoVivoTotal: quantidade * pesoMedio,
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
  area.updatedAt = new Date().toISOString();

  saveData();
  document.getElementById("pastureUtilizacaoDialog").close();
  render();
  refreshOpenPastureFicha();
}

function deletePastureUtilizacao(farm, area, entryId) {
  area.grazingPeriods = (area.grazingPeriods || []).filter((g) => g.id !== entryId);
  area.updatedAt = new Date().toISOString();
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
  copy.code = createPastureCode();
  copy.name = `${area.name} (cópia)`;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = new Date().toISOString();
  delete copy[PASTURE_LEGACY_PERIOD_KEY];
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
  area.updatedAt = new Date().toISOString();
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
async function exportPastureIndividualPdf(farm, area) {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("Biblioteca de PDF não disponível. Verifique sua conexão e recarregue a página.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const preparo = getAreaPreparoCost(area);
  const dessecacao = getAreaDessecacaoCost(area);
  const implantacao = getAreaImplantacaoCost(area);
  const outros = getAreaOutrosCost(area);
  const total = getAreaTotalCost(area);
  const costHa = getAreaCostPerHa(area);
  const history = [
    { date: area.startDate, type: "Identificação", detail: `Início da pastagem ${getPastureDisplayCode(area)}` },
    ...(area.preparoOperations || []).map((op) => ({ date: op.data, type: "Preparo", detail: `${getPreparoTypeLabel(op)} · ${formatCurrency(op.custoTotal)}` })),
    ...(area.desiccationApplications || []).map((app) => ({ date: app.data, type: "Dessecação", detail: `${app.produto || getDessecacaoMethodLabel(app)} · ${formatCurrency(app.custoTotal)}` })),
    ...(area.implantationRecords || []).map((rec) => ({ date: rec.data, type: "Implantação", detail: `${rec.tipoSemente || getImplantacaoMethodLabel(rec)} · ${formatCurrency(rec.custoTotal)}` })),
    ...(area.grazingPeriods || []).map((g) => ({ date: g.dataEntrada, type: "Utilização", detail: `${g.especieLabel || ""} ${g.categoriaAnimal || ""} · ${formatInteger(g.quantidade || 0)} animais` })),
    ...(area.grazingPeriods || []).filter((g) => g.dataSaida).map((g) => ({ date: g.dataSaida, type: "Utilização", detail: `Saída · ${g.categoriaAnimal || "animais"}` }))
  ].filter((entry) => entry.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));

  try {
    const imageData = await loadLogoForPdf("#ffffff");
    doc.addImage(imageData, "JPEG", 14, 16.25, 20, 7.5);
  } catch (error) {
    console.warn("Não foi possível carregar o logo para o PDF.", error);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Relatório Individual de Pastagem", 40, 18);
  doc.setFontSize(11);
  doc.text(`${getPastureDisplayCode(area)} · ${farm.name} · ${area.name}`, 40, 26);
  doc.setFont("helvetica", "normal");
  doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 38);

  doc.autoTable({
    startY: 44,
    theme: "grid",
    head: [["Campo", "Valor"]],
    body: [
      ["Código", getPastureDisplayCode(area)],
      ["Fazenda", farm.name],
      ["Potreiro", area.name],
      ["Cultura", getPastureCultureLabel(area)],
      ["Área total da cultura", formatHa(area.sizeHa)],
      ["Área usada no cálculo", formatHa(getAreaImplantedHa(area))],
      ["Data de início", formatDate(area.startDate)],
      ["Status", getPastureStatusLabel(area.status)],
      ["Situação da utilização", getPastureUtilizationSituation(area)]
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 91, 67] }
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    theme: "striped",
    head: [["Data", "Etapa", "Histórico cronológico"]],
    body: history.length ? history.map((entry) => [formatDate(entry.date), entry.type, entry.detail]) : [["—", "—", "Sem operações registradas"]],
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [138, 109, 31] }
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    theme: "grid",
    head: [["Resumo de custos", "Valor"]],
    body: [
      ["Preparo", formatCurrency(preparo)],
      ["Dessecação", formatCurrency(dessecacao)],
      ["Implantação", formatCurrency(implantacao)],
      ["Outros insumos", formatCurrency(outros)],
      ["Custo total", formatCurrency(total)],
      ["Custo por hectare", `${formatCurrency(costHa)}/ha`]
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [43, 132, 184] }
  });

  doc.save(`pastagem-${slugify(getPastureDisplayCode(area))}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

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
    doc.addImage(imageData, "JPEG", 14, 16.9, 22, 8.2);
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
    head: [["Código", "Fazenda", "Potreiro", "Cultura", "Data início", "Status", "Lançamentos", "Hectares", "Custo total", "Custo/ha", "Utilização"]],
    body: rows.map(({ farm: rowFarm, area }) => [
      getPastureDisplayCode(area),
      rowFarm.name,
      area.name,
      getPastureCultureLabel(area),
      formatDate(area.startDate),
      getPastureStatusLabel(area.status),
      formatInteger(getAreaCostEntries(area).length),
      formatHa(getAreaImplantedHa(area)),
      formatCurrency(getAreaTotalCost(area)),
      formatCurrency(getAreaCostPerHa(area)),
      getPastureUtilizationSituation(area)
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
    html += `<td rowspan="4" style="width:90px;"><img src="${logoDataUrl}" width="80" height="30" alt="Wolf Agricultura e Pecuária"></td>`;
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

  html += `<table border="1"><thead><tr><th>Código</th><th>Fazenda</th><th>Potreiro</th><th>Cultura</th><th>Data início</th><th>Status</th><th>Lançamentos</th><th>Hectares</th><th>Custo total</th><th>Custo/ha</th><th>Utilização</th></tr></thead><tbody>`;
  rows.forEach(({ farm: rowFarm, area }) => {
    html += `<tr>
      <td>${escapeHtml(getPastureDisplayCode(area))}</td>
      <td>${escapeHtml(rowFarm.name)}</td>
      <td>${escapeHtml(area.name)}</td>
      <td>${escapeHtml(getPastureCultureLabel(area))}</td>
      <td>${escapeHtml(formatDate(area.startDate))}</td>
      <td>${escapeHtml(getPastureStatusLabel(area.status))}</td>
      <td>${formatInteger(getAreaCostEntries(area).length)}</td>
      <td>${getAreaImplantedHa(area).toFixed(2)}</td>
      <td>${getAreaTotalCost(area).toFixed(2)}</td>
      <td>${getAreaCostPerHa(area).toFixed(2)}</td>
      <td>${escapeHtml(getPastureUtilizationSituation(area))}</td>
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
  const totalHa = rows.reduce((s, { area }) => s + getAreaImplantedHa(area), 0);
  const avgCostHa = totalHa > 0 ? totalCost / totalHa : 0;
  const activeUseCount = rows.filter(({ area }) => area.status === "utilizacao" || getPastureUtilizationSituation(area) === "Em utilização").length;

  grid.insertAdjacentHTML("beforeend", `
    <div class="home-module-card" data-nav-home="pastagens" tabindex="0" role="button">
      <div class="hmc-top">
        <div class="hmc-icon" style="background:#f7ecd0;color:#8a6d1f">${PASTURE_HOME_ICON}</div>
        ${avgCostHa > 0 ? `<span class="hmc-badge" style="color:#8a6d1f;background:#f7ecd0">Custo médio: ${formatCurrency(avgCostHa)}/ha</span>` : ""}
      </div>
      <div class="hmc-body">
        <h3 class="hmc-title">Pastagens / Custo por Hectare</h3>
        <p class="hmc-desc">Áreas de pastagem, operações, utilização animal e custo por hectare</p>
        <div class="hmc-metric">
          <strong class="hmc-value" style="color:#8a6d1f">${formatCurrency(totalCost)}</strong>
          <span class="hmc-unit">${formatHa(totalHa)} implantados · ${formatInteger(activeUseCount)} em utilização</span>
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
  const totalHa = rows.reduce((s, { area }) => s + getAreaImplantedHa(area), 0);
  const avgCostHa = totalHa > 0 ? totalCost / totalHa : 0;
  const areasEmUtilizacao = rows.filter(({ area }) => area.status === "utilizacao" || getPastureUtilizationSituation(area) === "Em utilização").length;

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
        <strong>${formatCurrency(avgCostHa)}/ha</strong>
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
  view.addEventListener("input", handlePastagensViewInput);
}

injectPastagensView();
normalizePastureAreaRecords();

/* Garante que tudo (ovinos, pastagens, fazendas renomeadas) apareça
   corretamente caso a sessão já esteja autenticada ao recarregar a
   página — boot() roda antes deste script terminar de aplicar os
   monkeypatches acima. */
if (isAuthenticated()) {
  render();
}
