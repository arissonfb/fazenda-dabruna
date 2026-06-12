/* ════════════════════════════════════════════════════════════════════
   Fazendas Da Bruna — Pastagens / Custo por Hectare
   Carregado depois de app.js / __commercial_new.js / bruna-extras.js.
   Reaproveita as globais já existentes: state, runtime, elements,
   saveData, render, formatInteger, formatCurrency, formatWeight,
   formatDate, formatMonthYear, escapeHtml, cloneDeep, slugify,
   getAllFarms, getFarm, isAdmin, isAuthenticated, isDemoExpired,
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
  { id: "implantacao", name: "Em implantação" },
  { id: "manejo", name: "Em manejo" },
  { id: "finalizada", name: "Finalizada" }
];

const PASTURE_CHART_PALETTE = [
  "#8a6d1f", "#375b43", "#0e4f6b", "#7c1d4f", "#7a4f00",
  "#1e3a5f", "#134e27", "#c98c4f", "#5b3a1e", "#6b4226", "#9c6b30", "#3f6212"
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

function getAreaTotalCost(area) {
  return (area.procedures || []).reduce((sum, p) => sum + (Number(p.totalValue) || 0), 0);
}

function getAreaCostPerHa(area) {
  const ha = Number(area.sizeHa) || 0;
  return ha > 0 ? getAreaTotalCost(area) / ha : 0;
}

function formatHa(value) {
  return `${formatWeight(value)} ha`;
}

function createPastureId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
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

    (area.procedures || []).forEach((p) => {
      const value = Number(p.totalValue) || 0;
      const typeLabel = getPastureProcedureTypeLabel(p);
      procedureCost.set(typeLabel, (procedureCost.get(typeLabel) || 0) + value);
      if (!lastEntry || String(p.date || "") > String(lastEntry.date || "")) {
        lastEntry = { ...p, areaName: area.name, farmName: farm.name };
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
    (area.procedures || []).forEach((p) => {
      const label = getPastureProcedureTypeLabel(p);
      map.set(label, (map.get(label) || 0) + (Number(p.totalValue) || 0));
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
    (area.procedures || []).forEach((p) => {
      const period = String(p.date || "").slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(period)) return;
      map.set(period, (map.get(period) || 0) + (Number(p.totalValue) || 0));
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
        ? `${escapeHtml(getPastureProcedureTypeLabel(metrics.lastEntry))} · ${escapeHtml(metrics.lastEntry.areaName)}`
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
              <th>Procedimentos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ farm, area }) => {
              const totalCost = getAreaTotalCost(area);
              const costHa = getAreaCostPerHa(area);
              const procedures = area.procedures || [];
              const status = area.status || "planejada";
              const subtitle = `${escapeHtml(getPastureCultureLabel(area))} · Safra ${escapeHtml(area.season || "—")}`;
              const colSpan = isTotalView ? 10 : 9;

              const procedureRows = procedures.map((p) => `
                <tr>
                  <td>${formatDate(p.date)}</td>
                  <td>${escapeHtml(getPastureProcedureTypeLabel(p))}</td>
                  <td>${escapeHtml(p.description || "—")}</td>
                  <td>${escapeHtml(p.responsible || "—")}</td>
                  <td>${formatWeight(p.areaHa || 0)}</td>
                  <td>${formatWeight(p.quantity || 0)}</td>
                  <td>${escapeHtml(getPastureUnitLabel(p.unit))}</td>
                  <td>${formatCurrency(p.unitValue)}</td>
                  <td>${formatCurrency(p.totalValue)}</td>
                  <td>
                    <div class="pasture-row-actions">
                      <button type="button" data-pasture-action="edit-procedure" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}" data-procedure-id="${escapeHtml(p.id)}">Editar</button>
                      <button type="button" data-pasture-action="duplicate-procedure" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}" data-procedure-id="${escapeHtml(p.id)}">Duplicar</button>
                      <button type="button" class="danger" data-pasture-action="delete-procedure" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}" data-procedure-id="${escapeHtml(p.id)}">Excluir</button>
                    </div>
                  </td>
                </tr>
              `).join("");

              return `
                <tr class="pasture-area-row">
                  ${isTotalView ? `<td>${escapeHtml(farm.name)}</td>` : ""}
                  <td>
                    <strong>${escapeHtml(area.name)}</strong>
                    <div class="pasture-area-meta">${subtitle}</div>
                  </td>
                  <td>${escapeHtml(getPastureCultureLabel(area))} · ${escapeHtml(area.season || "—")}</td>
                  <td>${formatDate(area.startDate)}</td>
                  <td><span class="pasture-status ${escapeHtml(status)}">${escapeHtml(getPastureStatusLabel(status))}</span></td>
                  <td>${formatHa(area.sizeHa)}</td>
                  <td>${formatCurrency(totalCost)}</td>
                  <td>${formatCurrency(costHa)}</td>
                  <td>${formatInteger(procedures.length)}</td>
                  <td>
                    <div class="pasture-row-actions">
                      <button type="button" data-pasture-action="new-procedure" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">+ Procedimento</button>
                      <button type="button" data-pasture-action="edit-area" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Editar</button>
                      <button type="button" data-pasture-action="duplicate-area" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Duplicar</button>
                      <button type="button" class="danger" data-pasture-action="delete-area" data-farm-id="${escapeHtml(farm.id)}" data-area-id="${escapeHtml(area.id)}">Excluir</button>
                    </div>
                  </td>
                </tr>
                <tr class="pasture-area-details-row">
                  <td colspan="${colSpan}">
                    <details class="pasture-procedures">
                      <summary>Procedimentos (${formatInteger(procedures.length)})</summary>
                      ${procedures.length ? `
                        <div class="table-wrap">
                          <table>
                            <thead>
                              <tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Responsável</th><th>Área (ha)</th><th>Qtd.</th><th>Unid.</th><th>Vlr. unit.</th><th>Total</th><th></th></tr>
                            </thead>
                            <tbody>${procedureRows}</tbody>
                          </table>
                        </div>
                      ` : `<p class="field-note" style="padding:12px 0 0">Nenhum procedimento registrado.</p>`}
                    </details>
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
  const procedureId = target.dataset.procedureId;
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
    case "edit-area":
      if (area) openPastureAreaDialog(area, farm);
      break;
    case "duplicate-area":
      if (area && confirm(`Duplicar a área "${area.name}"?`)) duplicatePastureArea(farm, area);
      break;
    case "delete-area":
      if (area && confirm(`Excluir a área "${area.name}" e todos os seus procedimentos?`)) deletePastureArea(farm, area);
      break;
    case "new-procedure":
      if (area) openPastureProcedureDialog(farm, area, null);
      break;
    case "edit-procedure": {
      const procedure = (area?.procedures || []).find((p) => p.id === procedureId);
      if (procedure) openPastureProcedureDialog(farm, area, procedure);
      break;
    }
    case "duplicate-procedure":
      if (area && confirm("Duplicar este procedimento?")) duplicatePastureProcedure(farm, area, procedureId);
      break;
    case "delete-procedure":
      if (area && confirm("Excluir este procedimento?")) deletePastureProcedure(farm, area, procedureId);
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
          <label class="span-2">Nome da área / potreiro
            <input type="text" id="pastureAreaName" maxlength="60" required list="pastureAreaPotreiroOptions" />
            <datalist id="pastureAreaPotreiroOptions"></datalist>
          </label>
          <label>Hectares
            <input type="number" id="pastureAreaSizeHa" min="0" step="0.1" required />
          </label>
          <label>Status
            <select id="pastureAreaStatus">
              ${PASTURE_STATUSES.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
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
          <label>Data de início
            <input type="date" id="pastureAreaStartDate" />
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
  const potreiroOptions = document.getElementById("pastureAreaPotreiroOptions");
  farmSelect.addEventListener("change", () => {
    const f = state.data.farms[farmSelect.value];
    potreiroOptions.innerHTML = (f?.potreiros || []).map((p) => `<option value="${escapeHtml(p.name)}"></option>`).join("");
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

  document.getElementById("pastureAreaForm").addEventListener("submit", handlePastureAreaSubmit);
  document.getElementById("pastureProcedureForm").addEventListener("submit", handlePastureProcedureSubmit);
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
  const potreiroOptions = document.getElementById("pastureAreaPotreiroOptions");
  potreiroOptions.innerHTML = (resolvedFarm?.potreiros || []).map((p) => `<option value="${escapeHtml(p.name)}"></option>`).join("");

  const cultureSelect = document.getElementById("pastureAreaCulture");
  const customCultureField = document.getElementById("pastureAreaCustomCultureField");

  document.getElementById("pastureAreaName").value = area?.name || "";
  document.getElementById("pastureAreaSizeHa").value = area?.sizeHa ?? "";
  document.getElementById("pastureAreaStatus").value = area?.status || "planejada";
  cultureSelect.value = area?.culture || PASTURE_CULTURES[0].id;
  document.getElementById("pastureAreaCustomCulture").value = area?.customCulture || "";
  customCultureField.hidden = cultureSelect.value !== "outra";
  document.getElementById("pastureAreaSeason").value = area?.season || "";
  document.getElementById("pastureAreaStartDate").value = area?.startDate || "";

  document.getElementById("pastureAreaDialog").showModal();
}

function handlePastureAreaSubmit(event) {
  event.preventDefault();
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farmId = isTotalView ? document.getElementById("pastureAreaFarm").value : getFarm().id;
  const farm = state.data.farms[farmId];
  if (!farm) return;

  const culture = document.getElementById("pastureAreaCulture").value;
  const payload = {
    name: document.getElementById("pastureAreaName").value.trim(),
    sizeHa: Number(document.getElementById("pastureAreaSizeHa").value) || 0,
    status: document.getElementById("pastureAreaStatus").value,
    culture,
    customCulture: culture === "outra" ? document.getElementById("pastureAreaCustomCulture").value.trim() : "",
    season: document.getElementById("pastureAreaSeason").value.trim(),
    startDate: document.getElementById("pastureAreaStartDate").value || ""
  };

  if (!Array.isArray(farm.pastureAreas)) farm.pastureAreas = [];

  if (pastureAreaDialogContext.areaId) {
    const area = farm.pastureAreas.find((a) => a.id === pastureAreaDialogContext.areaId);
    if (area) Object.assign(area, payload);
    logAuditEvent("Editar área de pastagem", "pastagens", `${payload.name} (${farm.name})`);
  } else {
    farm.pastureAreas.push({ id: createPastureId("area"), potreiroId: null, procedures: [], ...payload });
    logAuditEvent("Nova área de pastagem", "pastagens", `${payload.name} (${farm.name})`);
  }

  saveData();
  document.getElementById("pastureAreaDialog").close();
  render();
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
  doc.text("Fazendas Da Bruna", 42, 18);
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
    (area.procedures || []).forEach((p) => {
      procBody.push([
        rowFarm.name,
        area.name,
        formatDate(p.date),
        getPastureProcedureTypeLabel(p),
        p.responsible || "—",
        formatWeight(p.quantity || 0),
        getPastureUnitLabel(p.unit),
        formatCurrency(p.unitValue),
        formatCurrency(p.totalValue)
      ]);
    });
  });

  doc.autoTable({
    startY: y,
    theme: "striped",
    head: [["Fazenda", "Área", "Data", "Procedimento", "Responsável", "Qtd.", "Unid.", "Vlr. unit.", "Total"]],
    body: procBody.length ? procBody : [["—", "—", "—", "—", "—", "—", "—", "—", "—"]],
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
    html += `<td rowspan="4" style="width:90px;"><img src="${logoDataUrl}" width="80" height="80" alt="Fazendas Da Bruna"></td>`;
  }
  html += `<td style="font-size:18pt;font-weight:bold;color:#375b43;">Fazendas Da Bruna</td></tr>`;
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
      <td>${formatInteger((area.procedures || []).length)}</td>
      <td>${Number(area.sizeHa) || 0}</td>
      <td>${getAreaTotalCost(area).toFixed(2)}</td>
      <td>${getAreaCostPerHa(area).toFixed(2)}</td>
    </tr>`;
  });
  html += `</tbody></table><br/>`;

  html += `<table border="1"><thead><tr><th>Fazenda</th><th>Área</th><th>Data</th><th>Procedimento</th><th>Descrição</th><th>Responsável</th><th>Área aplicada (ha)</th><th>Quantidade</th><th>Unidade</th><th>Valor unitário</th><th>Valor total</th><th>Observações</th></tr></thead><tbody>`;
  rows.forEach(({ farm: rowFarm, area }) => {
    (area.procedures || []).forEach((p) => {
      html += `<tr>
        <td>${escapeHtml(rowFarm.name)}</td>
        <td>${escapeHtml(area.name)}</td>
        <td>${escapeHtml(formatDate(p.date))}</td>
        <td>${escapeHtml(getPastureProcedureTypeLabel(p))}</td>
        <td>${escapeHtml(p.description || "—")}</td>
        <td>${escapeHtml(p.responsible || "—")}</td>
        <td>${Number(p.areaHa) || 0}</td>
        <td>${Number(p.quantity) || 0}</td>
        <td>${escapeHtml(getPastureUnitLabel(p.unit))}</td>
        <td>${(Number(p.unitValue) || 0).toFixed(2)}</td>
        <td>${(Number(p.totalValue) || 0).toFixed(2)}</td>
        <td>${escapeHtml(p.notes || "")}</td>
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
        <p class="panel-kicker">Áreas cadastradas</p>
        <strong>${formatInteger(rows.length)}</strong>
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
if (!isDemoExpired() && isAuthenticated()) {
  render();
}
