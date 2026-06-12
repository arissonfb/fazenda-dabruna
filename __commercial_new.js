
const COMPRAS_PAGE_SIZE = 50;
const VENDAS_PAGE_SIZE  = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────
function com2FmtVal(v, currency) {
  if (!v && v !== 0) return "—";
  if (currency === "USD") return "US$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function com2FmtNum(v) { return v > 0 ? Number(v).toLocaleString("pt-BR") : "0"; }
function com2FmtKg(v)  { return v > 0 ? Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " kg" : "—"; }

// ── COMPRAS ───────────────────────────────────────────────────────────────────
function renderComprasView() {
  renderComprasFarmSwitch();
  renderComprasKpiCards();
  renderComprasCharts();
  renderComprasFilterSelects();
  renderComprasTable();
}

function renderComprasFarmSwitch() {
  if (!elements.comprasFarmSwitch) return;
  elements.comprasFarmSwitch.innerHTML = "";
  const items = [{ id: TOTAL_FARM_ID, name: "Todas as fazendas" }, ...getAllFarms()];
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `farm-btn ${item.id === state.data.selectedFarmId ? "active" : ""}`;
    btn.textContent = item.name;
    btn.addEventListener("click", () => {
      state.data.selectedFarmId = item.id;
      runtime.comprasPage = 0;
      saveData();
      renderComprasView();
    });
    elements.comprasFarmSwitch.appendChild(btn);
  });
}

function getComprasMovements() {
  const farms = getAllFarms();
  const sel   = state.data.selectedFarmId;
  const list  = sel === TOTAL_FARM_ID ? farms : farms.filter((f) => f.id === sel);
  const out   = [];
  list.forEach((f) => {
    (f.movements || []).forEach((m) => {
      if (m.type === "compra") out.push({ ...m, _farmId: f.id, _farmName: f.name, _currency: m.currency || getFarmCurrency(f.id) });
    });
  });
  return out;
}

function renderComprasKpiCards() {
  const sec = elements.comprasKpiSection;
  if (!sec) return;
  const year = state.filters.year, month = state.filters.month;
  const all = getComprasMovements().filter((m) => {
    const d = m.date || "";
    if (year !== "all" && !d.startsWith(year)) return false;
    if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
    return true;
  });
  const totalOps  = all.length;
  const totalCabs = all.reduce((s, m) => s + Number(m.quantity || 0), 0);
  const brlMovs   = all.filter((m) => (m._currency || "BRL") === "BRL");
  const usdMovs   = all.filter((m) => m._currency === "USD");
  const totalBRL  = brlMovs.reduce((s, m) => s + Number(m.value || 0), 0);
  const totalUSD  = usdMovs.reduce((s, m) => s + Number(m.value || 0), 0);
  const cabsBRL   = brlMovs.reduce((s, m) => s + Number(m.quantity || 0), 0);
  const cabsUSD   = usdMovs.reduce((s, m) => s + Number(m.quantity || 0), 0);
  const avgBRL    = cabsBRL > 0 ? totalBRL / cabsBRL : null;
  const avgUSD    = cabsUSD > 0 ? totalUSD / cabsUSD : null;
  const byFarm = {};
  all.forEach((m) => { if (!byFarm[m._farmName]) byFarm[m._farmName] = 0; byFarm[m._farmName] += Number(m.quantity || 0); });
  const bestFarm = Object.entries(byFarm).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  sec.innerHTML = `<div class="com2-kpi-grid">
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#d4edda">🐄</div>
      <div class="com2-kpi-value" style="color:#1b6e3e">${com2FmtNum(totalCabs)}</div>
      <div class="com2-kpi-label">Cabecas Adquiridas</div>
      <div class="com2-kpi-desc">animais comprados no periodo</div>
      <span class="com2-kpi-badge com2-badge-c">Entrada</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#d4edda">📋</div>
      <div class="com2-kpi-value" style="color:#1b6e3e">${com2FmtNum(totalOps)}</div>
      <div class="com2-kpi-label">Operacoes</div>
      <div class="com2-kpi-desc">transacoes registradas</div>
      <span class="com2-kpi-badge com2-badge-neu">Registros</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#fef9c3">💰</div>
      <div class="com2-kpi-value" style="color:#7a5c00;font-size:1.3rem">${totalBRL > 0 ? com2FmtVal(totalBRL, "BRL") : "—"}</div>
      <div class="com2-kpi-label">Investimento BRL</div>
      <div class="com2-kpi-desc">${cabsBRL > 0 ? com2FmtNum(cabsBRL) + " cabecas" : "sem operacoes BRL"}</div>
      <span class="com2-kpi-badge com2-badge-fin">Real</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#dbeafe">💵</div>
      <div class="com2-kpi-value" style="color:#1e40af;font-size:1.3rem">${totalUSD > 0 ? com2FmtVal(totalUSD, "USD") : "—"}</div>
      <div class="com2-kpi-label">Investimento USD</div>
      <div class="com2-kpi-desc">${cabsUSD > 0 ? com2FmtNum(cabsUSD) + " cabecas" : "sem operacoes USD"}</div>
      <span class="com2-kpi-badge com2-badge-fin">Dolar</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#d4edda">📊</div>
      <div class="com2-kpi-value" style="color:#1b6e3e;font-size:1.35rem">${avgBRL != null ? com2FmtVal(avgBRL, "BRL") : (avgUSD != null ? com2FmtVal(avgUSD, "USD") : "—")}</div>
      <div class="com2-kpi-label">Medio por Cabeca</div>
      <div class="com2-kpi-desc">custo medio por animal</div>
      <span class="com2-kpi-badge com2-badge-c">Ticket</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#d4edda">🏆</div>
      <div class="com2-kpi-value" style="font-size:1rem;color:#1b6e3e;margin-top:4px">${escapeHtml(bestFarm)}</div>
      <div class="com2-kpi-label">Maior Volume</div>
      <div class="com2-kpi-desc">fazenda com mais aquisicoes</div>
      <span class="com2-kpi-badge com2-badge-c">Destaque</span>
    </div>
  </div>`;
}

function renderComprasCharts() {
  renderComprasBarChart();
  renderComprasEvolutionChart();
}

function renderComprasBarChart() {
  const canvas = document.getElementById("comprasBarChart");
  if (!canvas) return;
  if (state.charts.comprasBar) { state.charts.comprasBar.destroy(); state.charts.comprasBar = null; }
  const year = state.filters.year, month = state.filters.month;
  const farmData = getAllFarms().map((f) => {
    const recs = (f.movements || []).filter((m) => {
      if (m.type !== "compra") return false;
      const d = m.date || "";
      if (year !== "all" && !d.startsWith(year)) return false;
      if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
      return true;
    });
    return { name: f.name, cabs: recs.reduce((s, m) => s + Number(m.quantity || 0), 0), val: recs.reduce((s, m) => s + Number(m.value || 0), 0), currency: getFarmCurrency(f.id) };
  }).filter((d) => d.cabs > 0).sort((a, b) => b.cabs - a.cabs);

  if (!farmData.length) {
    canvas.style.display = "none";
    if (!canvas.parentElement.querySelector(".com2-empty")) {
      const el = document.createElement("div"); el.className = "com2-empty";
      el.innerHTML = `<div style="font-size:2rem;opacity:.3;margin-bottom:10px">📦</div><div class="com2-empty-t">Nenhuma compra no periodo</div>`;
      canvas.parentElement.appendChild(el);
    }
    return;
  }
  canvas.style.display = ""; canvas.parentElement.querySelector(".com2-empty")?.remove();
  const total = farmData.reduce((s, d) => s + d.cabs, 0);
  const h = Math.min(400, Math.max(220, farmData.length * 56 + 60));
  canvas.style.setProperty("height", h + "px", "important"); canvas.style.setProperty("max-height", h + "px", "important");
  canvas.removeAttribute("height"); canvas.removeAttribute("width");

  const labelPlugin = { id: "com2Lc", afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets[0].data.forEach((val, idx) => {
      const meta = chart.getDatasetMeta(0); if (meta.hidden) return;
      const bar = meta.data[idx]; const bw = Math.abs(bar.x - bar.base); const pct = total > 0 ? Math.round((val / total) * 100) : 0;
      ctx.save(); ctx.textBaseline = "middle";
      if (bw >= 50) { ctx.textAlign = "right"; ctx.font = "bold 10px Manrope,sans-serif"; ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fillText(com2FmtNum(val) + " · " + pct + "%", bar.x - 7, bar.y); }
      else if (bw >= 14) { ctx.textAlign = "left"; ctx.font = "bold 9px Manrope,sans-serif"; ctx.fillStyle = "#333"; ctx.fillText(com2FmtNum(val), bar.x + 5, bar.y); }
      ctx.restore();
    });
  }};

  state.charts.comprasBar = new Chart(canvas, {
    type: "bar", plugins: [labelPlugin],
    data: { labels: farmData.map((d) => d.name), datasets: [{ label: "Cabecas adquiridas", data: farmData.map((d) => d.cabs), backgroundColor: "#1b6e3e", hoverBackgroundColor: "#22863a", borderRadius: 6, borderSkipped: false, barThickness: 20 }] },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false, resizeDelay: 100,
      layout: { padding: { right: 8, top: 4, bottom: 4 } },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#111", titleColor: "#fff", bodyColor: "rgba(255,255,255,.85)", padding: 12, cornerRadius: 8, callbacks: { label: (ctx) => { const d = farmData[ctx.dataIndex]; const pct = total > 0 ? ((d.cabs / total) * 100).toFixed(1) : "0"; return [" " + com2FmtNum(d.cabs) + " cabecas (" + pct + "%)", " Investimento: " + com2FmtVal(d.val, d.currency)]; } } }
      },
      scales: { x: { beginAtZero: true, ticks: { precision: 0, color: "#aaa", font: { size: 10 } }, grid: { color: "rgba(0,0,0,.05)" }, border: { display: false } }, y: { grid: { display: false }, border: { display: false }, ticks: { color: "#222", font: { size: 12, weight: "600" }, padding: 8 } } }
    }
  });
}

function renderComprasEvolutionChart() {
  const canvas = document.getElementById("comprasEvolutionChart");
  if (!canvas) return;
  if (state.charts.comprasEvolution) { state.charts.comprasEvolution.destroy(); state.charts.comprasEvolution = null; }
  const year = state.filters.year;
  const sel  = state.data.selectedFarmId;
  const list = sel === TOTAL_FARM_ID ? getAllFarms() : getAllFarms().filter((f) => f.id === sel);
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const cabs = Array(12).fill(0), vals = Array(12).fill(0);
  list.forEach((f) => { (f.movements || []).forEach((m) => { if (m.type !== "compra") return; const d = m.date || ""; if (year !== "all" && !d.startsWith(year)) return; const mo = parseInt(d.slice(5,7),10) - 1; if (mo >= 0 && mo < 12) { cabs[mo] += Number(m.quantity || 0); vals[mo] += Number(m.value || 0); } }); });
  const hasData = cabs.some((v) => v > 0);
  if (!hasData) { canvas.style.display = "none"; if (!canvas.parentElement.querySelector(".com2-empty")) { const el = document.createElement("div"); el.className = "com2-empty"; el.innerHTML = `<div style="font-size:2rem;opacity:.3;margin-bottom:10px">📈</div><div class="com2-empty-t">Sem historico no ano</div>`; canvas.parentElement.appendChild(el); } return; }
  canvas.style.display = ""; canvas.parentElement.querySelector(".com2-empty")?.remove();
  canvas.style.setProperty("height", "230px", "important"); canvas.style.setProperty("max-height", "230px", "important"); canvas.removeAttribute("height"); canvas.removeAttribute("width");
  state.charts.comprasEvolution = new Chart(canvas, {
    type: "bar",
    data: { labels: months, datasets: [
      { type: "bar", label: "Cabecas", data: cabs, backgroundColor: "rgba(27,110,62,.70)", hoverBackgroundColor: "rgba(27,110,62,.90)", borderRadius: 5, yAxisID: "yLeft" },
      { type: "line", label: "Investimento", data: vals, borderColor: "#c9a84c", backgroundColor: "rgba(201,168,76,.12)", tension: 0.35, fill: true, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5, yAxisID: "yRight" }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, resizeDelay: 100, interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom", labels: { padding: 16, usePointStyle: true, pointStyle: "circle", font: { size: 11 }, color: "#444" } }, tooltip: { backgroundColor: "#111", titleColor: "#fff", bodyColor: "rgba(255,255,255,.85)", padding: 12, cornerRadius: 8, callbacks: { label: (ctx) => ctx.datasetIndex === 0 ? " Cabecas: " + com2FmtNum(ctx.parsed.y) : " Investimento: " + com2FmtVal(ctx.parsed.y, "BRL") } } },
      scales: {
        yLeft: { position: "left", beginAtZero: true, ticks: { precision: 0, color: "#1b6e3e", font: { size: 10 } }, grid: { color: "rgba(0,0,0,.05)" }, border: { display: false } },
        yRight: { position: "right", beginAtZero: true, grid: { display: false }, border: { display: false }, ticks: { color: "#c9a84c", font: { size: 10 }, callback: (v) => "R$" + (v >= 1000000 ? (v/1000000).toFixed(1)+"M" : v >= 1000 ? (v/1000).toFixed(0)+"k" : v) } },
        x: { grid: { display: false }, border: { display: false }, ticks: { color: "#aaa", font: { size: 10 } } }
      }
    }
  });
}

function renderComprasFilterSelects() {
  const farmSel = document.getElementById("comprasFilterFarm");
  const catSel  = document.getElementById("comprasFilterCategory");
  if (!farmSel || !catSel) return;
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  if (farmSel.closest(".com2-filter-row")) farmSel.style.display = isTotalView ? "" : "none";
  if (isTotalView) {
    const cur = farmSel.value;
    farmSel.innerHTML = `<option value="">Todas as fazendas</option>` + getAllFarms().map((f) => `<option value="${escapeHtml(f.id)}" ${cur === f.id ? "selected" : ""}>${escapeHtml(f.name)}</option>`).join("");
  }
  const cats = [...new Set(getComprasMovements().map((m) => m.categoryName || m.categoryId).filter(Boolean))].sort();
  const curCat = catSel.value;
  catSel.innerHTML = `<option value="">Todas as categorias</option>` + cats.map((c) => `<option value="${escapeHtml(c)}" ${curCat === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("");
}

function renderComprasTable() {
  const tbody = elements.comprasTableBody;
  if (!tbody) return;
  const search   = (elements.comprasHistorySearch?.value || "").toLowerCase().trim();
  const farmF    = document.getElementById("comprasFilterFarm")?.value || "";
  const catF     = document.getElementById("comprasFilterCategory")?.value || "";
  const dateFrom = document.getElementById("comprasFilterDateFrom")?.value || "";
  const dateTo   = document.getElementById("comprasFilterDateTo")?.value || "";
  const year = state.filters.year, month = state.filters.month;

  let recs = getComprasMovements().filter((m) => {
    const d = m.date || "";
    if (year !== "all" && !d.startsWith(year)) return false;
    if (month !== "all" && d.slice(5,7) !== String(month).padStart(2,"0")) return false;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo   && d > dateTo)   return false;
    if (farmF && m._farmId !== farmF) return false;
    if (catF  && (m.categoryName || m.categoryId) !== catF) return false;
    if (search) {
      if (![m.code, m.categoryName, m._farmName, m.notes, m.purchaseDetails?.sourceProperty].map((v) => String(v||"").toLowerCase()).some((f) => f.includes(search))) return false;
    }
    return true;
  }).sort((a, b) => String(b.date||"").localeCompare(String(a.date||"")));

  const countEl = document.getElementById("comprasTableCountLabel");
  if (countEl) countEl.textContent = recs.length + " registro" + (recs.length !== 1 ? "s" : "");

  const totalPages = Math.max(1, Math.ceil(recs.length / COMPRAS_PAGE_SIZE));
  const page = Math.min(Math.max(0, runtime.comprasPage || 0), totalPages - 1);
  runtime.comprasPage = page;
  const pageRecs = recs.slice(page * COMPRAS_PAGE_SIZE, (page + 1) * COMPRAS_PAGE_SIZE);

  tbody.innerHTML = pageRecs.map((m) => {
    const qty = Number(m.quantity || 0), val = Number(m.value || 0);
    const avgWt = m.purchaseDetails?.avgWeight ? Number(m.purchaseDetails.avgWeight).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " kg/cab" : "—";
    const origin = escapeHtml(m.purchaseDetails?.sourceProperty || m.purchaseDetails?.supplier || (m.notes || "").slice(0, 30) || "—");
    return `<tr class="rc">
      <td><span class="com2-code">${escapeHtml(m.code||"—")}</span></td>
      <td>${escapeHtml(m._farmName||m._farmId)}</td>
      <td>${formatDate(m.date)}</td>
      <td><strong>${escapeHtml(m.categoryName||m.categoryId||"—")}</strong></td>
      <td class="com2-td-r"><strong class="com2-c-fin">${com2FmtNum(qty)}</strong></td>
      <td>${origin}</td>
      <td class="com2-td-r">${avgWt}</td>
      <td class="com2-td-r">${val > 0 ? "<span class='com2-c-fin'>" + com2FmtVal(val, m._currency) + "</span>" : "—"}</td>
      <td title="${escapeHtml(m.notes||"")}" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml((m.notes||"").slice(0,25) + (m.notes?.length>25?"…":""))}</td>
      <td><div class="com2-acts">
        <button type="button" class="com2-ab com2-ab-edit" data-mov-edit-id="${escapeHtml(m.id)}" data-farm-id="${escapeHtml(m._farmId)}">Editar</button>
        <button type="button" class="com2-ab com2-ab-del"  data-mov-del-id="${escapeHtml(m.id)}" data-farm-id="${escapeHtml(m._farmId)}">Excluir</button>
      </div></td>
    </tr>`;
  }).join("");

  if (!pageRecs.length) tbody.innerHTML = `<tr><td colspan="10"><div class="com2-empty"><div class="com2-empty-t">${search||farmF||catF ? "Nenhum registro encontrado" : "Nenhuma compra cadastrada"}</div></div></td></tr>`;

  renderComprasPagination(recs.length, page);
  tbody.querySelectorAll("[data-mov-edit-id]").forEach((btn) => btn.addEventListener("click", () => openComprasDialog(btn.dataset.movEditId, btn.dataset.farmId)));
  tbody.querySelectorAll("[data-mov-del-id]").forEach((btn) => btn.addEventListener("click", () => deleteMovementRecord(btn.dataset.movDelId, btn.dataset.farmId)));
}

function renderComprasPagination(total, page) {
  const el = elements.comprasHistoryPagination; if (!el) return;
  const totalPages = Math.ceil(total / COMPRAS_PAGE_SIZE);
  if (totalPages <= 1) { el.innerHTML = total > 0 ? `<span class="pagination-info">${total} registros</span>` : ""; return; }
  el.innerHTML = `<span class="pagination-info">${total} registros</span>
    <button type="button" class="ghost-btn" id="comprasPagePrev" ${page===0?"disabled":""}>&larr; Anterior</button>
    <span class="pagination-info">Pagina ${page+1} de ${totalPages}</span>
    <button type="button" class="ghost-btn" id="comprasPageNext" ${page>=totalPages-1?"disabled":""}>Proxima &rarr;</button>`;
  document.getElementById("comprasPagePrev")?.addEventListener("click", () => { runtime.comprasPage = Math.max(0,(runtime.comprasPage||0)-1); renderComprasTable(); });
  document.getElementById("comprasPageNext")?.addEventListener("click", () => { runtime.comprasPage = Math.min(totalPages-1,(runtime.comprasPage||0)+1); renderComprasTable(); });
}

// ── VENDAS ────────────────────────────────────────────────────────────────────
function renderVendasView() {
  renderVendasFarmSwitch();
  renderVendasKpiCards();
  renderVendasCharts();
  renderVendasFilterSelects();
  renderVendasTable();
}

function renderVendasFarmSwitch() {
  if (!elements.vendasFarmSwitch) return;
  elements.vendasFarmSwitch.innerHTML = "";
  const items = [{ id: TOTAL_FARM_ID, name: "Todas as fazendas" }, ...getAllFarms()];
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `farm-btn ${item.id === state.data.selectedFarmId ? "active" : ""}`;
    btn.textContent = item.name;
    btn.addEventListener("click", () => {
      state.data.selectedFarmId = item.id;
      runtime.vendasPage = 0;
      saveData();
      renderVendasView();
    });
    elements.vendasFarmSwitch.appendChild(btn);
  });
}

function getVendasMovements() {
  const farms = getAllFarms();
  const sel   = state.data.selectedFarmId;
  const list  = sel === TOTAL_FARM_ID ? farms : farms.filter((f) => f.id === sel);
  const out   = [];
  list.forEach((f) => { (f.movements || []).forEach((m) => { if (m.type === "venda") out.push({ ...m, _farmId: f.id, _farmName: f.name, _currency: m.currency || getFarmCurrency(f.id) }); }); });
  return out;
}

function renderVendasKpiCards() {
  const sec = elements.vendasKpiSection; if (!sec) return;
  const year = state.filters.year, month = state.filters.month;
  const all = getVendasMovements().filter((m) => {
    const d = m.date || "";
    if (year !== "all" && !d.startsWith(year)) return false;
    if (month !== "all" && d.slice(5,7) !== String(month).padStart(2,"0")) return false;
    return true;
  });
  const totalOps  = all.length;
  const totalCabs = all.reduce((s, m) => s + Number(m.quantity || 0), 0);
  const brlMovs   = all.filter((m) => (m._currency || "BRL") === "BRL");
  const usdMovs   = all.filter((m) => m._currency === "USD");
  const totalBRL  = brlMovs.reduce((s, m) => s + Number(m.value || 0), 0);
  const totalUSD  = usdMovs.reduce((s, m) => s + Number(m.value || 0), 0);
  const cabsBRL   = brlMovs.reduce((s, m) => s + Number(m.quantity || 0), 0);
  const cabsUSD   = usdMovs.reduce((s, m) => s + Number(m.quantity || 0), 0);
  const avgBRL    = cabsBRL > 0 ? totalBRL / cabsBRL : null;
  const avgUSD    = cabsUSD > 0 ? totalUSD / cabsUSD : null;
  const totalKg   = all.reduce((s, m) => s + Number(m.saleDetails?.weightKg || 0), 0);
  const byFarm = {};
  all.forEach((m) => { if (!byFarm[m._farmName]) byFarm[m._farmName] = 0; byFarm[m._farmName] += Number(m.quantity || 0); });
  const bestFarm = Object.entries(byFarm).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  sec.innerHTML = `<div class="com2-kpi-grid">
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#fdecea">🐄</div>
      <div class="com2-kpi-value" style="color:#8b1a1a">${com2FmtNum(totalCabs)}</div>
      <div class="com2-kpi-label">Cabecas Vendidas</div>
      <div class="com2-kpi-desc">animais comercializados</div>
      <span class="com2-kpi-badge com2-badge-v">Saida</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#fdecea">📋</div>
      <div class="com2-kpi-value" style="color:#8b1a1a">${com2FmtNum(totalOps)}</div>
      <div class="com2-kpi-label">Operacoes</div>
      <div class="com2-kpi-desc">transacoes registradas</div>
      <span class="com2-kpi-badge com2-badge-neu">Registros</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#fef9c3">💰</div>
      <div class="com2-kpi-value" style="color:#7a5c00;font-size:1.3rem">${totalBRL > 0 ? com2FmtVal(totalBRL, "BRL") : "—"}</div>
      <div class="com2-kpi-label">Receita BRL</div>
      <div class="com2-kpi-desc">${cabsBRL > 0 ? com2FmtNum(cabsBRL) + " cabecas" : "sem vendas BRL"}</div>
      <span class="com2-kpi-badge com2-badge-fin">Real</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#dbeafe">💵</div>
      <div class="com2-kpi-value" style="color:#1e40af;font-size:1.3rem">${totalUSD > 0 ? com2FmtVal(totalUSD, "USD") : "—"}</div>
      <div class="com2-kpi-label">Receita USD</div>
      <div class="com2-kpi-desc">${cabsUSD > 0 ? com2FmtNum(cabsUSD) + " cabecas" : "sem vendas USD"}</div>
      <span class="com2-kpi-badge com2-badge-fin">Dolar</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#fdecea">📊</div>
      <div class="com2-kpi-value" style="color:#8b1a1a;font-size:1.35rem">${avgBRL != null ? com2FmtVal(avgBRL, "BRL") : (avgUSD != null ? com2FmtVal(avgUSD, "USD") : "—")}</div>
      <div class="com2-kpi-label">Medio por Cabeca</div>
      <div class="com2-kpi-desc">preco medio por animal</div>
      <span class="com2-kpi-badge com2-badge-v">Ticket</span>
    </div>
    <div class="com2-kpi-card">
      <div class="com2-kpi-icon" style="background:#fdecea">⚖️</div>
      <div class="com2-kpi-value" style="color:#8b1a1a;font-size:1.3rem">${totalKg > 0 ? com2FmtKg(totalKg) : "—"}</div>
      <div class="com2-kpi-label">Kg Negociados</div>
      <div class="com2-kpi-desc">peso total negociado</div>
      <span class="com2-kpi-badge com2-badge-v">Peso</span>
    </div>
  </div>`;
}

function renderVendasCharts() {
  renderVendasBarChart();
  renderVendasEvolutionChart();
}

function renderVendasBarChart() {
  const canvas = document.getElementById("vendasBarChart"); if (!canvas) return;
  if (state.charts.vendasBar) { state.charts.vendasBar.destroy(); state.charts.vendasBar = null; }
  const year = state.filters.year, month = state.filters.month;
  const farmData = getAllFarms().map((f) => {
    const recs = (f.movements || []).filter((m) => {
      if (m.type !== "venda") return false;
      const d = m.date || "";
      if (year !== "all" && !d.startsWith(year)) return false;
      if (month !== "all" && d.slice(5,7) !== String(month).padStart(2,"0")) return false;
      return true;
    });
    return { name: f.name, cabs: recs.reduce((s, m) => s + Number(m.quantity || 0), 0), val: recs.reduce((s, m) => s + Number(m.value || 0), 0), currency: getFarmCurrency(f.id) };
  }).filter((d) => d.cabs > 0).sort((a, b) => b.cabs - a.cabs);

  if (!farmData.length) {
    canvas.style.display = "none";
    if (!canvas.parentElement.querySelector(".com2-empty")) { const el = document.createElement("div"); el.className = "com2-empty"; el.innerHTML = `<div style="font-size:2rem;opacity:.3;margin-bottom:10px">📤</div><div class="com2-empty-t">Nenhuma venda no periodo</div>`; canvas.parentElement.appendChild(el); }
    return;
  }
  canvas.style.display = ""; canvas.parentElement.querySelector(".com2-empty")?.remove();
  const total = farmData.reduce((s, d) => s + d.cabs, 0);
  const h = Math.min(400, Math.max(220, farmData.length * 56 + 60));
  canvas.style.setProperty("height", h + "px", "important"); canvas.style.setProperty("max-height", h + "px", "important"); canvas.removeAttribute("height"); canvas.removeAttribute("width");

  const labelPlugin = { id: "com2Lv", afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets[0].data.forEach((val, idx) => {
      const meta = chart.getDatasetMeta(0); if (meta.hidden) return;
      const bar = meta.data[idx]; const bw = Math.abs(bar.x - bar.base); const pct = total > 0 ? Math.round((val / total) * 100) : 0;
      ctx.save(); ctx.textBaseline = "middle";
      if (bw >= 50) { ctx.textAlign = "right"; ctx.font = "bold 10px Manrope,sans-serif"; ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fillText(com2FmtNum(val) + " · " + pct + "%", bar.x - 7, bar.y); }
      else if (bw >= 14) { ctx.textAlign = "left"; ctx.font = "bold 9px Manrope,sans-serif"; ctx.fillStyle = "#333"; ctx.fillText(com2FmtNum(val), bar.x + 5, bar.y); }
      ctx.restore();
    });
  }};

  state.charts.vendasBar = new Chart(canvas, {
    type: "bar", plugins: [labelPlugin],
    data: { labels: farmData.map((d) => d.name), datasets: [{ label: "Cabecas vendidas", data: farmData.map((d) => d.cabs), backgroundColor: "#8b1a1a", hoverBackgroundColor: "#a82222", borderRadius: 6, borderSkipped: false, barThickness: 20 }] },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false, resizeDelay: 100,
      layout: { padding: { right: 8, top: 4, bottom: 4 } },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: "#111", titleColor: "#fff", bodyColor: "rgba(255,255,255,.85)", padding: 12, cornerRadius: 8, callbacks: { label: (ctx) => { const d = farmData[ctx.dataIndex]; const pct = total > 0 ? ((d.cabs / total) * 100).toFixed(1) : "0"; return [" " + com2FmtNum(d.cabs) + " cabecas (" + pct + "%)", " Receita: " + com2FmtVal(d.val, d.currency)]; } } } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0, color: "#aaa", font: { size: 10 } }, grid: { color: "rgba(0,0,0,.05)" }, border: { display: false } }, y: { grid: { display: false }, border: { display: false }, ticks: { color: "#222", font: { size: 12, weight: "600" }, padding: 8 } } }
    }
  });
}

function renderVendasEvolutionChart() {
  const canvas = document.getElementById("vendasEvolutionChart"); if (!canvas) return;
  if (state.charts.vendasEvolution) { state.charts.vendasEvolution.destroy(); state.charts.vendasEvolution = null; }
  const year = state.filters.year;
  const sel  = state.data.selectedFarmId;
  const list = sel === TOTAL_FARM_ID ? getAllFarms() : getAllFarms().filter((f) => f.id === sel);
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const cabs = Array(12).fill(0), vals = Array(12).fill(0);
  list.forEach((f) => { (f.movements || []).forEach((m) => { if (m.type !== "venda") return; const d = m.date || ""; if (year !== "all" && !d.startsWith(year)) return; const mo = parseInt(d.slice(5,7),10) - 1; if (mo >= 0 && mo < 12) { cabs[mo] += Number(m.quantity||0); vals[mo] += Number(m.value||0); } }); });
  const hasData = cabs.some((v) => v > 0);
  if (!hasData) { canvas.style.display = "none"; if (!canvas.parentElement.querySelector(".com2-empty")) { const el = document.createElement("div"); el.className = "com2-empty"; el.innerHTML = `<div style="font-size:2rem;opacity:.3;margin-bottom:10px">📈</div><div class="com2-empty-t">Sem historico no ano</div>`; canvas.parentElement.appendChild(el); } return; }
  canvas.style.display = ""; canvas.parentElement.querySelector(".com2-empty")?.remove();
  canvas.style.setProperty("height", "230px", "important"); canvas.style.setProperty("max-height", "230px", "important"); canvas.removeAttribute("height"); canvas.removeAttribute("width");
  state.charts.vendasEvolution = new Chart(canvas, {
    type: "bar",
    data: { labels: months, datasets: [
      { type: "bar", label: "Cabecas", data: cabs, backgroundColor: "rgba(139,26,26,.70)", hoverBackgroundColor: "rgba(139,26,26,.90)", borderRadius: 5, yAxisID: "yLeft" },
      { type: "line", label: "Receita", data: vals, borderColor: "#c9a84c", backgroundColor: "rgba(201,168,76,.12)", tension: 0.35, fill: true, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5, yAxisID: "yRight" }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, resizeDelay: 100, interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom", labels: { padding: 16, usePointStyle: true, pointStyle: "circle", font: { size: 11 }, color: "#444" } }, tooltip: { backgroundColor: "#111", titleColor: "#fff", bodyColor: "rgba(255,255,255,.85)", padding: 12, cornerRadius: 8, callbacks: { label: (ctx) => ctx.datasetIndex === 0 ? " Cabecas: " + com2FmtNum(ctx.parsed.y) : " Receita: " + com2FmtVal(ctx.parsed.y, "BRL") } } },
      scales: {
        yLeft: { position: "left", beginAtZero: true, ticks: { precision: 0, color: "#8b1a1a", font: { size: 10 } }, grid: { color: "rgba(0,0,0,.05)" }, border: { display: false } },
        yRight: { position: "right", beginAtZero: true, grid: { display: false }, border: { display: false }, ticks: { color: "#c9a84c", font: { size: 10 }, callback: (v) => "R$" + (v >= 1000000 ? (v/1000000).toFixed(1)+"M" : v >= 1000 ? (v/1000).toFixed(0)+"k" : v) } },
        x: { grid: { display: false }, border: { display: false }, ticks: { color: "#aaa", font: { size: 10 } } }
      }
    }
  });
}

function renderVendasFilterSelects() {
  const farmSel = document.getElementById("vendasFilterFarm");
  const catSel  = document.getElementById("vendasFilterCategory");
  if (!farmSel || !catSel) return;
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  farmSel.style.display = isTotalView ? "" : "none";
  if (isTotalView) {
    const cur = farmSel.value;
    farmSel.innerHTML = `<option value="">Todas as fazendas</option>` + getAllFarms().map((f) => `<option value="${escapeHtml(f.id)}" ${cur === f.id ? "selected" : ""}>${escapeHtml(f.name)}</option>`).join("");
  }
  const cats = [...new Set(getVendasMovements().map((m) => m.categoryName || m.categoryId).filter(Boolean))].sort();
  const curCat = catSel.value;
  catSel.innerHTML = `<option value="">Todas as categorias</option>` + cats.map((c) => `<option value="${escapeHtml(c)}" ${curCat === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("");
}

function renderVendasTable() {
  const tbody = elements.vendasTableBody; if (!tbody) return;
  const search   = (elements.vendasHistorySearch?.value || "").toLowerCase().trim();
  const farmF    = document.getElementById("vendasFilterFarm")?.value || "";
  const catF     = document.getElementById("vendasFilterCategory")?.value || "";
  const dateFrom = document.getElementById("vendasFilterDateFrom")?.value || "";
  const dateTo   = document.getElementById("vendasFilterDateTo")?.value || "";
  const year = state.filters.year, month = state.filters.month;

  let recs = getVendasMovements().filter((m) => {
    const d = m.date || "";
    if (year !== "all" && !d.startsWith(year)) return false;
    if (month !== "all" && d.slice(5,7) !== String(month).padStart(2,"0")) return false;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo   && d > dateTo)   return false;
    if (farmF && m._farmId !== farmF) return false;
    if (catF  && (m.categoryName || m.categoryId) !== catF) return false;
    if (search) { if (![m.code, m.categoryName, m._farmName, m.notes, m.saleDetails?.buyer].map((v) => String(v||"").toLowerCase()).some((f) => f.includes(search))) return false; }
    return true;
  }).sort((a, b) => String(b.date||"").localeCompare(String(a.date||"")));

  const countEl = document.getElementById("vendasTableCountLabel");
  if (countEl) countEl.textContent = recs.length + " registro" + (recs.length !== 1 ? "s" : "");

  const totalPages = Math.max(1, Math.ceil(recs.length / VENDAS_PAGE_SIZE));
  const page = Math.min(Math.max(0, runtime.vendasPage || 0), totalPages - 1);
  runtime.vendasPage = page;
  const pageRecs = recs.slice(page * VENDAS_PAGE_SIZE, (page + 1) * VENDAS_PAGE_SIZE);

  tbody.innerHTML = pageRecs.map((m) => {
    const qty = Number(m.quantity || 0), val = Number(m.value || 0);
    const kg  = m.saleDetails?.weightKg ? Number(m.saleDetails.weightKg).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " kg" : "—";
    const pKg = m.saleDetails?.pricePerKg ? (m._currency === "USD" ? "US$" : "R$") + " " + Number(m.saleDetails.pricePerKg).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "—";
    const buyer = escapeHtml(m.saleDetails?.buyer || (m.notes||"").slice(0,30) || "—");
    const rate  = m.saleDetails?.exchangeRate || null;
    const brlEquiv = rate && val > 0 ? `<br><span style="font-size:.78rem;color:var(--muted)">≈ R$ ${(val * rate).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})} (×${rate})</span>` : "";
    return `<tr class="rv">
      <td><span class="com2-code">${escapeHtml(m.code||"—")}</span></td>
      <td>${escapeHtml(m._farmName||m._farmId)}</td>
      <td>${formatDate(m.date)}</td>
      <td><strong>${escapeHtml(m.categoryName||m.categoryId||"—")}</strong></td>
      <td class="com2-td-r"><strong class="com2-v-fin">${com2FmtNum(qty)}</strong></td>
      <td>${buyer}</td>
      <td class="com2-td-r">${kg}</td>
      <td class="com2-td-r com2-gold">${pKg}</td>
      <td class="com2-td-r">${val > 0 ? "<span class='com2-v-fin'>" + com2FmtVal(val, m._currency) + "</span>" + brlEquiv : "—"}</td>
      <td title="${escapeHtml(m.notes||"")}" style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml((m.notes||"").slice(0,22) + (m.notes?.length>22?"…":""))}</td>
      <td><div class="com2-acts">
        <button type="button" class="com2-ab com2-ab-edit" data-mov-edit-id="${escapeHtml(m.id)}" data-farm-id="${escapeHtml(m._farmId)}">Editar</button>
        <button type="button" class="com2-ab com2-ab-del"  data-mov-del-id="${escapeHtml(m.id)}" data-farm-id="${escapeHtml(m._farmId)}">Excluir</button>
      </div></td>
    </tr>`;
  }).join("");

  if (!pageRecs.length) tbody.innerHTML = `<tr><td colspan="11"><div class="com2-empty"><div class="com2-empty-t">${search||farmF||catF ? "Nenhum registro encontrado" : "Nenhuma venda cadastrada"}</div></div></td></tr>`;

  renderVendasPagination(recs.length, page);
  tbody.querySelectorAll("[data-mov-edit-id]").forEach((btn) => btn.addEventListener("click", () => openVendasDialog(btn.dataset.movEditId, btn.dataset.farmId)));
  tbody.querySelectorAll("[data-mov-del-id]").forEach((btn) => btn.addEventListener("click", () => deleteMovementRecord(btn.dataset.movDelId, btn.dataset.farmId)));
}

function renderVendasPagination(total, page) {
  const el = elements.vendasHistoryPagination; if (!el) return;
  const totalPages = Math.ceil(total / VENDAS_PAGE_SIZE);
  if (totalPages <= 1) { el.innerHTML = total > 0 ? `<span class="pagination-info">${total} registros</span>` : ""; return; }
  el.innerHTML = `<span class="pagination-info">${total} registros</span>
    <button type="button" class="ghost-btn" id="vendasPagePrev" ${page===0?"disabled":""}>&larr; Anterior</button>
    <span class="pagination-info">Pagina ${page+1} de ${totalPages}</span>
    <button type="button" class="ghost-btn" id="vendasPageNext" ${page>=totalPages-1?"disabled":""}>Proxima &rarr;</button>`;
  document.getElementById("vendasPagePrev")?.addEventListener("click", () => { runtime.vendasPage = Math.max(0,(runtime.vendasPage||0)-1); renderVendasTable(); });
  document.getElementById("vendasPageNext")?.addEventListener("click", () => { runtime.vendasPage = Math.min(totalPages-1,(runtime.vendasPage||0)+1); renderVendasTable(); });
}

// ── Bridges para app.js ───────────────────────────────────────────────────────
function openComprasDialog(movementId, farmId) {
  openEditMovementDialog(farmId, movementId);
}

function openVendasDialog(movementId, farmId) {
  openEditMovementDialog(farmId, movementId);
}

function deleteMovementRecord(movementId, farmId) {
  deleteMovement(farmId, movementId);
}

