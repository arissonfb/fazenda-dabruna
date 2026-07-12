/* ════════════════════════════════════════════════════════════════════
   Wolf Agricultura e Pecuária — Serviços de Alambrado
   Cadastro, controle e relatório de serviços executados em cercas,
   porteiras, mangueiras e demais estruturas de alambrado.
   Carregado depois de eventos.js. Reaproveita helpers globais de app.js
   (getAllFarms, getPotreroEntries, saveData, logAuditEvent, formatCurrency,
   uploadToCloudinary helpers, Chart.js, jsPDF, etc.)
   ════════════════════════════════════════════════════════════════════ */

const ALAMBRADO_SERVICE_TYPES = [
  { id: "cerca-nova-7-fios", label: "Cerca Nova - 7 fios", medida: "metro", valorUnitario: 7.00 },
  { id: "cerca-nova-6-fios", label: "Cerca Nova - 6 fios", medida: "metro", valorUnitario: 6.00 },
  { id: "retoque", label: "Retoque", medida: "metro", valorUnitario: 2.80 },
  { id: "cabeceira-estronca", label: "Cabeceira/Estronca", medida: "unidade", valorUnitario: 250.00 },
  { id: "porteira", label: "Porteira", medida: "unidade", valorUnitario: 150.00 },
  { id: "porteira-poste-alto", label: "Porteira com poste alto", medida: "unidade", valorUnitario: 300.00 },
  { id: "cruza", label: "Cruza", medida: "metro", valorUnitario: 110.00 },
  { id: "sapata-pe-de-galinha", label: "Sapata/Pé de galinha", medida: "unidade", valorUnitario: 90.00 },
  { id: "redea", label: "Rédea", medida: "unidade", valorUnitario: 120.00 },
  { id: "rebaixe-cerca", label: "Rebaixe de cerca", medida: "unidade", valorUnitario: 100.00 },
  { id: "cruza-dura", label: "Cruza dura", medida: "metro", valorUnitario: 50.00 },
  { id: "canto-3-moiroes", label: "Canto de 3 moirões", medida: "unidade", valorUnitario: 400.00 },
  { id: "mangueira-varejao", label: "Mangueira de varejão", medida: "metro", valorUnitario: 170.00 },
  { id: "cabeceira-mangueira", label: "Cabeceira de mangueira", medida: "unidade", valorUnitario: 300.00 },
  { id: "cerca-eletrica", label: "Cerca elétrica", medida: "metro", valorUnitario: 3.00 },
  { id: "retoque-cerca-eletrica", label: "Retoque de cerca elétrica", medida: "metro", valorUnitario: 2.00 },
  { id: "desmanche-cerca", label: "Desmanche de cerca", medida: "metro", valorUnitario: 2.50 },
  { id: "peala-egua", label: "Peala égua", medida: "unidade", valorUnitario: 220.00 },
  { id: "outros", label: "Outros", medida: "metro", valorUnitario: 0 }
];

const ALAMBRADO_MEDIA_ACCEPT = "image/*,video/*,.heic,.heif";
const ALAMBRADO_MEDIA_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "bmp", "tif", "tiff"];
const ALAMBRADO_MEDIA_VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "avi", "mkv", "3gp", "m4v", "wmv"];

function alambradoDetectMediaKind(file) {
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const ext = name.slice(name.lastIndexOf(".") + 1);
  if (type.startsWith("image/") || ALAMBRADO_MEDIA_IMAGE_EXTENSIONS.includes(ext)) return "imagem";
  if (type.startsWith("video/") || ALAMBRADO_MEDIA_VIDEO_EXTENSIONS.includes(ext)) return "video";
  return null;
}

function applyCloudinaryAutoFormat(url, isVideo) {
  const transform = isVideo ? "f_auto,q_auto" : "f_auto,q_auto,w_1280,c_limit";
  return url.includes("/upload/") ? url.replace("/upload/", `/upload/${transform}/`) : url;
}
const ALAMBRADO_LIST_PAGE_SIZE = 10;
const ALAMBRADO_CHART_COLORS = COLORS.concat(COLORS.map((c) => lightenColor(c, 0.35)));

const ALAMBRADO_HOME_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V7"/><path d="M12 21V7"/><path d="M20 21V7"/><path d="M2 9h20"/><path d="M2 14h20"/><path d="M4 7l4-4 4 4 4-4 4 4"/></svg>`;

runtime.albMediaDrafts = runtime.albMediaDrafts || [];
runtime.albExistingMedia = runtime.albExistingMedia || [];
runtime.albRemovedMediaIds = runtime.albRemovedMediaIds || [];
runtime.albActiveTab = runtime.albActiveTab || "novo";
runtime.albListFilters = runtime.albListFilters || { farmId: "all", potreiroId: "all", tipo: "all", dataIni: "", dataFim: "", midia: "all", busca: "" };
runtime.albReportFilters = runtime.albReportFilters || { farmId: "all", potreiroId: "all", tipo: "all", dataIni: "", dataFim: "", mes: "all", ano: "all", midia: "all" };
runtime.albListPage = runtime.albListPage || 0;
runtime.albSaving = false;

/* ── Helpers de dados ─────────────────────────────────────────────── */

function ensureAlambradoFarmShape(farm) {
  if (!farm) return farm;
  if (!Array.isArray(farm.alambradoRecords)) farm.alambradoRecords = [];
  if (!Number.isFinite(farm.alambradoCodeSequence)) farm.alambradoCodeSequence = 0;
  return farm;
}

function getAlambradoRecords(farm) {
  ensureAlambradoFarmShape(farm);
  return farm.alambradoRecords;
}

function getAlambradoServiceType(id) {
  return ALAMBRADO_SERVICE_TYPES.find((t) => t.id === id) || null;
}

function generateAlambradoCode(farm) {
  ensureAlambradoFarmShape(farm);
  farm.alambradoCodeSequence += 1;
  return `ALAMB-${getFarmCodePrefix(farm.id)}-${String(farm.alambradoCodeSequence).padStart(4, "0")}`;
}

function computeAlambradoValorTotal(quantidade, valorUnitario) {
  return (Number(quantidade) || 0) * (Number(valorUnitario) || 0);
}

function flattenAlambradoRecords(farms) {
  return farms.flatMap((farm) => getAlambradoRecords(farm).map((record) => ({
    ...record,
    _farmId: farm.id,
    _farmName: farm.name
  })));
}

function getAlambradoFlatRecords() {
  return flattenAlambradoRecords(getAllFarms());
}

function getAlambradoAvailableYears() {
  const years = new Set(getAlambradoFlatRecords().map((r) => String(r.data || "").slice(0, 4)).filter(Boolean));
  return [...years].sort((a, b) => b.localeCompare(a));
}

function getAlambradoFilterFarms(filters) {
  if (!filters.farmId || filters.farmId === "all") return getAllFarms();
  const farm = state.data.farms[filters.farmId];
  return farm ? [farm] : getAllFarms();
}

function getAlambradoPeriodLabel(filters) {
  if (filters.dataIni && filters.dataFim) return `${formatDate(filters.dataIni)} até ${formatDate(filters.dataFim)}`;
  if (filters.dataIni) return `A partir de ${formatDate(filters.dataIni)}`;
  if (filters.dataFim) return `Até ${formatDate(filters.dataFim)}`;
  if (filters.ano && filters.ano !== "all") {
    if (filters.mes && filters.mes !== "all") return `${MONTH_NAMES[Number(filters.mes) - 1]}/${filters.ano}`;
    return `Ano ${filters.ano}`;
  }
  return "Histórico completo";
}

function alambradoRecordMatchesFilters(record, filters) {
  if (filters.farmId && filters.farmId !== "all" && record._farmId !== filters.farmId) return false;
  if (filters.potreiroId && filters.potreiroId !== "all" && (record.potreiroId || "") !== filters.potreiroId) return false;
  if (filters.tipo && filters.tipo !== "all" && record.tipoServicoId !== filters.tipo) return false;
  if (filters.dataIni && String(record.data || "") < filters.dataIni) return false;
  if (filters.dataFim && String(record.data || "") > filters.dataFim) return false;
  if (filters.mes && filters.mes !== "all") {
    const m = String(record.data || "").slice(5, 7);
    if (m !== String(filters.mes).padStart(2, "0")) return false;
  }
  if (filters.ano && filters.ano !== "all") {
    const y = String(record.data || "").slice(0, 4);
    if (y !== String(filters.ano)) return false;
  }
  if (filters.midia === "com" && !((record.anexos || []).length > 0)) return false;
  if (filters.midia === "sem" && (record.anexos || []).length > 0) return false;
  if (filters.busca) {
    const needle = normalizeText(filters.busca);
    const haystack = normalizeText(`${record.codigo} ${record.observacoes || ""} ${record.tipoServicoLabel || ""}`);
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function getFilteredAlambradoRecords(filters) {
  return getAlambradoFlatRecords()
    .filter((r) => alambradoRecordMatchesFilters(r, filters))
    .sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));
}

function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Upload de mídia (Cloudinary) ─────────────────────────────────── */

async function uploadAlambradoMedia(file) {
  const kind = alambradoDetectMediaKind(file);
  const isVideo = kind === "video";
  const fileName = file.name || `${isVideo ? "video" : "foto"}-${Date.now()}`;

  const formData = new FormData();
  formData.append("file", file, fileName);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "painel-pecuario/alambrado");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary: ${err}`);
  }

  const data = await response.json();
  return {
    id: createMovementId(),
    nome_arquivo: fileName,
    tipo_arquivo: isVideo ? "video" : "imagem",
    url: applyCloudinaryAutoFormat(data.secure_url, isVideo),
    tamanho: file.size || 0,
    createdAt: new Date().toISOString()
  };
}

/* ── Card no painel principal ─────────────────────────────────────── */

function computeAlambradoHomeMetrics() {
  const records = getAlambradoFlatRecords();
  const valorTotal = records.reduce((s, r) => s + Number(r.valorTotal || 0), 0);
  const totalMetros = records.filter((r) => r.medida === "metro").reduce((s, r) => s + Number(r.quantidade || 0), 0);
  const totalMidias = records.reduce((s, r) => s + (Array.isArray(r.anexos) ? r.anexos.length : 0), 0);
  return { totalServicos: records.length, valorTotal, totalMetros, totalMidias };
}

function renderAlambradoHomeCard() {
  const grid = document.querySelector("#homeView .home-module-grid");
  if (!grid) return;

  let card = document.getElementById("alambradoHomeCard");
  if (!card) {
    grid.insertAdjacentHTML("beforeend", `
      <div class="home-module-card" id="alambradoHomeCard" tabindex="0" role="button">
        <div class="hmc-top">
          <div class="hmc-icon" style="background:#f3e6d3;color:#8f6132">${ALAMBRADO_HOME_ICON}</div>
          <span class="hmc-badge" id="alambradoHomeBadge" style="color:#8f6132;background:#f3e6d3"></span>
        </div>
        <div class="hmc-body">
          <h3 class="hmc-title">Serviços de Alambrado</h3>
          <p class="hmc-desc">Cadastro, controle e relatório de serviços executados em cercas, porteiras, mangueiras e estruturas de alambrado.</p>
          <div class="hmc-metric">
            <strong class="hmc-value" style="color:#8f6132" id="alambradoHomeValue">0</strong>
            <span class="hmc-unit">serviços cadastrados</span>
          </div>
          <div class="alb-home-mini-stats" id="alambradoHomeMiniStats"></div>
        </div>
        <div class="hmc-actions">
          <button type="button" class="hmc-btn-primary alb-home-action-btn" style="background:#8f6132" id="alambradoHomeNewBtn">Novo serviço</button>
          <button type="button" class="hmc-btn-secondary alb-home-action-btn" id="alambradoHomeListBtn">Ver registros</button>
        </div>
      </div>
    `);
    card = document.getElementById("alambradoHomeCard");
    card.addEventListener("click", (event) => {
      if (event.target.closest(".alb-home-action-btn")) return;
      openAlambradoModal("novo");
    });
    document.getElementById("alambradoHomeNewBtn").addEventListener("click", (event) => {
      event.stopPropagation();
      openAlambradoModal("novo");
    });
    document.getElementById("alambradoHomeListBtn").addEventListener("click", (event) => {
      event.stopPropagation();
      openAlambradoModal("lista");
    });
  }

  const metrics = computeAlambradoHomeMetrics();
  document.getElementById("alambradoHomeValue").textContent = formatInteger(metrics.totalServicos);
  document.getElementById("alambradoHomeBadge").textContent = metrics.valorTotal > 0
    ? `Investido: ${formatCurrency(metrics.valorTotal)}`
    : "Nenhum serviço ainda";
  document.getElementById("alambradoHomeMiniStats").innerHTML = `
    <span>${formatInteger(metrics.totalMetros)} m executados</span>
    <span>${formatInteger(metrics.totalMidias)} fotos/vídeos anexados</span>
  `;
}

const brunaOriginalRenderHomeViewForAlambrado = renderHomeView;
renderHomeView = function () {
  brunaOriginalRenderHomeViewForAlambrado();
  renderAlambradoHomeCard();
};

/* ── Diálogos ──────────────────────────────────────────────────────── */

document.body.insertAdjacentHTML("beforeend", `
  <dialog id="alambradoDialog" class="modal">
    <div class="modal-card alb-modal-card">
      <div class="modal-header">
        <div>
          <p class="panel-kicker">Serviços de Alambrado</p>
          <h2>Cadastro, controle e relatório de serviços de alambrado</h2>
        </div>
        <button type="button" class="modal-close" id="closeAlambradoDialog" aria-label="Fechar">&#x2715;</button>
      </div>

      <div class="alb-tabs" role="tablist">
        <button type="button" class="alb-tab active" data-alb-tab="novo" role="tab"><span class="alb-tab-icon">01</span> Novo serviço</button>
        <button type="button" class="alb-tab" data-alb-tab="lista" role="tab"><span class="alb-tab-icon">02</span> Serviços cadastrados</button>
        <button type="button" class="alb-tab" data-alb-tab="relatorio" role="tab"><span class="alb-tab-icon">03</span> Relatório</button>
      </div>

      <div class="alb-panel" id="albPanelNovo">
        <form id="albForm">
          <input type="hidden" id="albEditingId">
          <input type="hidden" id="albEditingFarmId">
          <p class="alb-form-title" id="albFormTitle">Novo serviço de alambrado</p>
          <div class="form-grid">
            <label>
              Fazenda
              <select id="albFormFarm" required></select>
            </label>
            <label>
              Potreiro
              <select id="albFormPotreiro"></select>
            </label>
            <label>
              Tipo de serviço de alambrado
              <select id="albFormTipo" required></select>
            </label>
            <label class="form-span-2" id="albFormTipoOutroWrap" hidden>
              Especifique o serviço
              <input type="text" id="albFormTipoOutro" maxlength="80" placeholder="Nome do serviço executado">
            </label>
            <label>
              Medida
              <select id="albFormMedida" required>
                <option value="metro">Metro</option>
                <option value="unidade">Unidade</option>
              </select>
            </label>
            <label>
              Quantidade / metragem
              <input type="number" id="albFormQuantidade" min="0.01" step="0.01" required>
            </label>
            <label>
              Valor unitário aplicado (R$)
              <input type="number" id="albFormValorUnitario" min="0" step="0.01" required>
            </label>
            <label>
              Valor total
              <input type="text" id="albFormValorTotal" disabled>
            </label>
            <label>
              Data do serviço
              <input type="date" id="albFormData" required>
            </label>
            <label class="form-span-2">
              Observações
              <textarea id="albFormObservacoes" rows="3" maxlength="500" placeholder="Detalhes do serviço executado"></textarea>
            </label>
            <label class="form-span-2">
              Fotos e vídeos do serviço
              <input type="file" id="albFormMedia" accept="${ALAMBRADO_MEDIA_ACCEPT}" multiple>
              <span class="field-note">Formatos aceitos: JPG, JPEG, PNG, WEBP, HEIC, GIF, BMP (fotos) e MP4, MOV, WEBM, AVI, MKV (vídeos). Múltiplos arquivos — convertidos automaticamente para exibição no navegador.</span>
            </label>
          </div>

          <div class="movement-photo-panel form-span-2" id="albMediaPanel" hidden>
            <div class="movement-photo-header">
              <div>
                <p class="panel-kicker">Anexos deste serviço</p>
                <strong id="albMediaCounter">Nenhum arquivo anexado.</strong>
              </div>
            </div>
            <div class="movement-photo-grid" id="albMediaGrid"></div>
          </div>

          <div class="modal-actions">
            <button type="button" class="ghost-btn" id="albCancelEditBtn" hidden>Cancelar edição</button>
            <button type="submit" class="action-btn purchase" id="albSubmitBtn">Salvar serviço de alambrado</button>
          </div>
        </form>
      </div>

      <div class="alb-panel" id="albPanelLista" hidden>
        <div class="alb-filter-bar" id="albListFilterBar"></div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Fazenda</th><th>Potreiro</th><th>Tipo</th><th>Medida</th>
                <th>Qtd.</th><th>Valor unit.</th><th>Valor total</th><th>Data</th><th>Obs.</th><th>Mídia</th><th>Ações</th>
              </tr>
            </thead>
            <tbody id="albListTableBody"></tbody>
          </table>
        </div>
        <div class="alb-pagination" id="albListPagination"></div>
      </div>

      <div class="alb-panel" id="albPanelRelatorio" hidden>
        <div class="alb-filter-bar" id="albReportFilterBar"></div>
        <div class="alb-report-actions">
          <button type="button" class="action-btn pdf" id="albExportPdfBtn">Exportar PDF</button>
          <button type="button" class="action-btn secondary" id="albExportExcelBtn">Exportar Excel</button>
          <button type="button" class="ghost-btn" id="albPrintBtn">Imprimir</button>
          <button type="button" class="ghost-btn" id="albSaveChartsBtn">Salvar gráficos (imagens)</button>
        </div>
        <div class="summary-grid alb-kpi-grid" id="albReportKpis"></div>
        <div class="alb-charts-grid" id="albChartsGrid">
          <div class="alb-chart-card">
            <div class="alb-chart-card-head"><h3>Gastos mensais totais</h3><p>Evolução do investimento em alambrado mês a mês</p></div>
            <canvas id="albChartMonthlyTotal" data-alb-chart-title="Gastos mensais totais"></canvas>
          </div>
          <div class="alb-chart-card">
            <div class="alb-chart-card-head"><h3>Gastos anuais totais</h3><p>Comparativo do investimento por ano</p></div>
            <canvas id="albChartAnnualTotal" data-alb-chart-title="Gastos anuais totais"></canvas>
          </div>
          <div class="alb-chart-card alb-chart-card-wide">
            <div class="alb-chart-card-head"><h3>Gastos mensais por tipo de serviço</h3><p>Distribuição mensal por categoria de serviço executado</p></div>
            <canvas id="albChartMonthlyByType" data-alb-chart-title="Gastos mensais por tipo de serviço"></canvas>
          </div>
          <div class="alb-chart-card">
            <div class="alb-chart-card-head"><h3>Gastos anuais por tipo de serviço</h3><p>Total investido por tipo de serviço no período</p></div>
            <canvas id="albChartAnnualByType" data-alb-chart-title="Gastos anuais por tipo de serviço"></canvas>
          </div>
          <div class="alb-chart-card">
            <div class="alb-chart-card-head"><h3>Composição percentual dos gastos</h3><p>Participação de cada tipo de serviço no custo total</p></div>
            <canvas id="albChartPercentByType" data-alb-chart-title="Composição percentual dos gastos"></canvas>
          </div>
          <div class="alb-chart-card">
            <div class="alb-chart-card-head"><h3>Comparativo por fazenda</h3><p>Total investido em alambrado por fazenda</p></div>
            <canvas id="albChartByFarm" data-alb-chart-title="Comparativo por fazenda"></canvas>
          </div>
          <div class="alb-chart-card">
            <div class="alb-chart-card-head"><h3>Comparativo por potreiro</h3><p>Principais potreiros por investimento em alambrado</p></div>
            <canvas id="albChartByPotreiro" data-alb-chart-title="Comparativo por potreiro"></canvas>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Data</th><th>Fazenda</th><th>Potreiro</th><th>Tipo</th><th>Medida</th>
                <th>Qtd.</th><th>Valor unit.</th><th>Valor total</th><th>Observações</th><th>Anexos</th>
              </tr>
            </thead>
            <tbody id="albReportTableBody"></tbody>
            <tfoot id="albReportTableFoot"></tfoot>
          </table>
        </div>
      </div>
    </div>
  </dialog>

  <dialog id="alambradoViewDialog" class="modal">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <p class="panel-kicker" id="albViewKicker">Serviço de alambrado</p>
          <h2 id="albViewTitle">—</h2>
        </div>
        <button type="button" class="modal-close" id="closeAlambradoViewDialog" aria-label="Fechar">&#x2715;</button>
      </div>
      <div class="alb-view-grid" id="albViewDetails"></div>
      <div class="movement-photo-panel" id="albViewMediaPanel">
        <div class="movement-photo-header">
          <div>
            <p class="panel-kicker">Fotos e vídeos</p>
            <strong id="albViewMediaCounter">Nenhum arquivo anexado.</strong>
          </div>
        </div>
        <div class="movement-photo-grid" id="albViewMediaGrid"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="ghost-btn" id="closeAlambradoViewBtn">Fechar</button>
      </div>
    </div>
  </dialog>
`);

/* ── Abertura do modal e navegação de abas ────────────────────────── */

function openAlambradoModal(tab) {
  const dialog = document.getElementById("alambradoDialog");
  if (!dialog) return;
  if ((tab || "novo") === "novo" && !document.getElementById("albEditingId").value) {
    resetAlambradoForm();
  }
  setAlambradoTab(tab || "novo");
  if (typeof dialog.showModal === "function") dialog.showModal();
}

function setAlambradoTab(tab) {
  runtime.albActiveTab = tab;
  document.querySelectorAll(".alb-tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.albTab === tab));
  document.getElementById("albPanelNovo").hidden = tab !== "novo";
  document.getElementById("albPanelLista").hidden = tab !== "lista";
  document.getElementById("albPanelRelatorio").hidden = tab !== "relatorio";
  if (tab === "lista") {
    renderAlambradoListFilterBar();
    renderAlambradoList();
  }
  if (tab === "relatorio") {
    renderAlambradoReportFilterBar();
    renderAlambradoReport();
  }
}

document.querySelectorAll(".alb-tab").forEach((btn) => btn.addEventListener("click", () => setAlambradoTab(btn.dataset.albTab)));
document.getElementById("closeAlambradoDialog").addEventListener("click", () => document.getElementById("alambradoDialog").close());
document.getElementById("closeAlambradoViewDialog").addEventListener("click", () => document.getElementById("alambradoViewDialog").close());
document.getElementById("closeAlambradoViewBtn").addEventListener("click", () => document.getElementById("alambradoViewDialog").close());

/* ── Formulário: Novo / Editar ────────────────────────────────────── */

function populateAlambradoFarmSelect(select, defaultId) {
  select.innerHTML = getAllFarms().map((f) => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join("");
  if (defaultId && state.data.farms[defaultId]) select.value = defaultId;
}

function populateAlambradoPotreiroSelect(select, farm) {
  const entries = farm ? getPotreroEntries(farm) : [];
  select.innerHTML = `<option value="">Sem potreiro específico</option>` +
    entries.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
}

function populateAlambradoTipoSelect(select) {
  select.innerHTML = `<option value="">Selecione o tipo de serviço</option>` +
    ALAMBRADO_SERVICE_TYPES.map((t) => `<option value="${t.id}">${escapeHtml(t.label)}</option>`).join("");
}

function refreshAlambradoTipoDerivedFields() {
  const tipoSelect = document.getElementById("albFormTipo");
  const tipo = getAlambradoServiceType(tipoSelect.value);
  const isOutros = tipoSelect.value === "outros";

  document.getElementById("albFormTipoOutroWrap").hidden = !isOutros;
  if (!isOutros) document.getElementById("albFormTipoOutro").value = "";

  if (tipo) {
    document.getElementById("albFormMedida").value = tipo.medida;
    document.getElementById("albFormValorUnitario").value = tipo.valorUnitario.toFixed(2);
  }
  refreshAlambradoValorTotal();
}

function refreshAlambradoValorTotal() {
  const qty = Number(document.getElementById("albFormQuantidade").value) || 0;
  const vu = Number(document.getElementById("albFormValorUnitario").value) || 0;
  document.getElementById("albFormValorTotal").value = formatCurrency(qty * vu);
}

function resetAlambradoForm() {
  document.getElementById("albForm").reset();
  document.getElementById("albFormTitle").textContent = "Novo serviço de alambrado";
  document.getElementById("albEditingId").value = "";
  document.getElementById("albEditingFarmId").value = "";
  document.getElementById("albFormFarm").disabled = false;

  const defaultFarmId = state.data.selectedFarmId !== TOTAL_FARM_ID ? state.data.selectedFarmId : (getAllFarms()[0] || {}).id;
  populateAlambradoFarmSelect(document.getElementById("albFormFarm"), defaultFarmId);
  populateAlambradoPotreiroSelect(document.getElementById("albFormPotreiro"), state.data.farms[document.getElementById("albFormFarm").value]);
  populateAlambradoTipoSelect(document.getElementById("albFormTipo"));
  document.getElementById("albFormData").value = new Date().toISOString().slice(0, 10);

  runtime.albMediaDrafts = [];
  runtime.albRemovedMediaIds = [];
  runtime.albExistingMedia = [];
  refreshAlambradoTipoDerivedFields();
  renderAlambradoMediaDrafts();

  document.getElementById("albCancelEditBtn").hidden = true;
  document.getElementById("albSubmitBtn").disabled = false;
  document.getElementById("albSubmitBtn").textContent = "Salvar serviço de alambrado";
}

function openAlambradoEditor(farm, record) {
  openAlambradoModal("novo");
  document.getElementById("albFormTitle").textContent = `Editando serviço ${record.codigo}`;
  document.getElementById("albEditingId").value = record.id;
  document.getElementById("albEditingFarmId").value = farm.id;

  populateAlambradoFarmSelect(document.getElementById("albFormFarm"), farm.id);
  document.getElementById("albFormFarm").disabled = true;
  populateAlambradoPotreiroSelect(document.getElementById("albFormPotreiro"), farm);
  document.getElementById("albFormPotreiro").value = record.potreiroId || "";
  populateAlambradoTipoSelect(document.getElementById("albFormTipo"));
  document.getElementById("albFormTipo").value = record.tipoServicoId;
  const isOutros = record.tipoServicoId === "outros";
  document.getElementById("albFormTipoOutroWrap").hidden = !isOutros;
  document.getElementById("albFormTipoOutro").value = isOutros ? record.tipoServicoLabel : "";
  document.getElementById("albFormMedida").value = record.medida;
  document.getElementById("albFormQuantidade").value = record.quantidade;
  document.getElementById("albFormValorUnitario").value = record.valorUnitario;
  document.getElementById("albFormData").value = record.data;
  document.getElementById("albFormObservacoes").value = record.observacoes || "";
  refreshAlambradoValorTotal();

  runtime.albMediaDrafts = [];
  runtime.albRemovedMediaIds = [];
  runtime.albExistingMedia = (record.anexos || []).map((a) => ({ ...a }));
  renderAlambradoMediaDrafts();

  document.getElementById("albCancelEditBtn").hidden = false;
  document.getElementById("albSubmitBtn").textContent = "Salvar alterações";
}

document.getElementById("albFormFarm").addEventListener("change", () => {
  const farm = state.data.farms[document.getElementById("albFormFarm").value];
  populateAlambradoPotreiroSelect(document.getElementById("albFormPotreiro"), farm);
});
document.getElementById("albFormTipo").addEventListener("change", refreshAlambradoTipoDerivedFields);
document.getElementById("albFormQuantidade").addEventListener("input", refreshAlambradoValorTotal);
document.getElementById("albFormValorUnitario").addEventListener("input", refreshAlambradoValorTotal);
document.getElementById("albCancelEditBtn").addEventListener("click", resetAlambradoForm);

/* ── Fotos e vídeos (rascunho antes do envio) ─────────────────────── */

function handleAlambradoMediaChange(event) {
  const files = [...(event.target.files || [])];
  files.forEach((file) => {
    const kind = alambradoDetectMediaKind(file);
    if (!kind) return;
    runtime.albMediaDrafts.push({
      id: createMovementId(),
      file,
      kind,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    });
  });
  event.target.value = "";
  renderAlambradoMediaDrafts();
}

function removeAlambradoMediaDraft(id) {
  runtime.albMediaDrafts = runtime.albMediaDrafts.filter((d) => d.id !== id);
  renderAlambradoMediaDrafts();
}

function removeAlambradoExistingMedia(id) {
  runtime.albRemovedMediaIds.push(id);
  runtime.albExistingMedia = runtime.albExistingMedia.filter((a) => a.id !== id);
  renderAlambradoMediaDrafts();
}

function renderAlambradoMediaDrafts() {
  const panel = document.getElementById("albMediaPanel");
  const grid = document.getElementById("albMediaGrid");
  const counter = document.getElementById("albMediaCounter");
  const existing = runtime.albExistingMedia || [];
  const drafts = runtime.albMediaDrafts || [];
  const total = existing.length + drafts.length;

  panel.hidden = total === 0;
  counter.textContent = total ? `${total} arquivo(s) anexado(s)` : "Nenhum arquivo anexado.";

  grid.innerHTML = [
    ...existing.map((a) => `
      <div class="movement-photo-card">
        ${a.tipo_arquivo === "video"
          ? `<video src="${a.url}" controls preload="metadata"></video>`
          : `<img src="${a.url}" alt="${escapeHtml(a.nome_arquivo)}">`}
        <div class="movement-photo-meta"><strong>${escapeHtml(a.nome_arquivo)}</strong><span>${formatFileSize(a.tamanho)}</span></div>
        <button type="button" class="table-action-btn table-action-btn-danger movement-photo-remove" data-alb-remove-existing="${a.id}">Remover</button>
      </div>
    `),
    ...drafts.map((d) => `
      <div class="movement-photo-card">
        ${d.kind === "video"
          ? `<video src="${d.previewUrl}" controls preload="metadata"></video>`
          : `<img src="${d.previewUrl}" alt="${escapeHtml(d.name)}">`}
        <div class="movement-photo-meta"><strong>${escapeHtml(d.name)}</strong><span>${formatFileSize(d.size)} · aguardando envio</span></div>
        <button type="button" class="table-action-btn table-action-btn-danger movement-photo-remove" data-alb-remove-draft="${d.id}">Remover</button>
      </div>
    `)
  ].join("");

  grid.querySelectorAll("[data-alb-remove-draft]").forEach((btn) => btn.addEventListener("click", () => removeAlambradoMediaDraft(btn.dataset.albRemoveDraft)));
  grid.querySelectorAll("[data-alb-remove-existing]").forEach((btn) => btn.addEventListener("click", () => removeAlambradoExistingMedia(btn.dataset.albRemoveExisting)));
}

document.getElementById("albFormMedia").addEventListener("change", handleAlambradoMediaChange);

/* ── Salvar (novo/edição) ──────────────────────────────────────────── */

async function handleAlambradoFormSubmit(event) {
  event.preventDefault();
  if (runtime.albSaving) return;

  const farm = state.data.farms[document.getElementById("albFormFarm").value];
  if (!farm) { alert("Selecione uma fazenda válida."); return; }

  const tipo = getAlambradoServiceType(document.getElementById("albFormTipo").value);
  if (!tipo) { alert("Selecione o tipo de serviço de alambrado."); return; }

  let tipoLabel = tipo.label;
  if (tipo.id === "outros") {
    tipoLabel = document.getElementById("albFormTipoOutro").value.trim();
    if (!tipoLabel) { alert('Informe o nome do serviço para o tipo "Outros".'); return; }
  }

  const medida = document.getElementById("albFormMedida").value;
  if (medida !== "metro" && medida !== "unidade") { alert("Selecione a medida do serviço (metro ou unidade)."); return; }

  const quantidade = Number(document.getElementById("albFormQuantidade").value);
  if (!(quantidade > 0)) { alert("Informe uma quantidade/metragem maior que zero."); return; }

  const valorUnitario = Number(document.getElementById("albFormValorUnitario").value);
  if (!(valorUnitario >= 0)) { alert("Informe um valor unitário válido (maior ou igual a zero)."); return; }

  const dataServico = document.getElementById("albFormData").value;
  if (!dataServico) { alert("Informe a data do serviço."); return; }

  const potreiroId = document.getElementById("albFormPotreiro").value || "";
  const potreiroEntry = getPotreroEntries(farm).find((p) => p.id === potreiroId);
  const observacoes = document.getElementById("albFormObservacoes").value.trim();
  const editingId = document.getElementById("albEditingId").value;

  runtime.albSaving = true;
  const submitBtn = document.getElementById("albSubmitBtn");
  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = "Salvando...";

  try {
    const newAttachments = [];
    for (const draft of runtime.albMediaDrafts) {
      newAttachments.push(await uploadAlambradoMedia(draft.file));
    }

    const valorTotal = computeAlambradoValorTotal(quantidade, valorUnitario);

    if (editingId) {
      const record = getAlambradoRecords(farm).find((r) => r.id === editingId);
      if (record) {
        record.potreiroId = potreiroId;
        record.potreiroName = potreiroEntry ? potreiroEntry.name : "";
        record.tipoServicoId = tipo.id;
        record.tipoServicoLabel = tipoLabel;
        record.medida = medida;
        record.quantidade = quantidade;
        record.valorUnitario = valorUnitario;
        record.valorTotal = valorTotal;
        record.data = dataServico;
        record.observacoes = observacoes;
        record.anexos = [...(runtime.albExistingMedia || []), ...newAttachments];
        record.updatedAt = new Date().toISOString();
        logAuditEvent("Edição", "alambrado", `${record.codigo} - ${tipoLabel}`, { farmId: farm.id, farmName: farm.name, recordCode: record.codigo });
      }
    } else {
      const record = {
        id: createMovementId(),
        codigo: generateAlambradoCode(farm),
        farmId: farm.id,
        potreiroId,
        potreiroName: potreiroEntry ? potreiroEntry.name : "",
        tipoServicoId: tipo.id,
        tipoServicoLabel: tipoLabel,
        medida,
        quantidade,
        valorUnitario,
        valorTotal,
        data: dataServico,
        observacoes,
        anexos: newAttachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      getAlambradoRecords(farm).push(record);
      logAuditEvent("Cadastro", "alambrado", `${record.codigo} - ${tipoLabel}`, { farmId: farm.id, farmName: farm.name, recordCode: record.codigo });
    }

    saveData();
    resetAlambradoForm();
    renderAlambradoHomeCard();
    setAlambradoTab("lista");
  } catch (error) {
    console.error("Falha ao salvar serviço de alambrado.", error);
    alert("Não foi possível enviar os arquivos anexados. Verifique sua conexão e tente novamente.");
  } finally {
    runtime.albSaving = false;
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

document.getElementById("albForm").addEventListener("submit", handleAlambradoFormSubmit);

/* ── Excluir ───────────────────────────────────────────────────────── */

function handleAlambradoDelete(farm, recordId) {
  const record = getAlambradoRecords(farm).find((r) => r.id === recordId);
  if (!record) return;
  if (!confirm("Tem certeza que deseja excluir este serviço de alambrado? Esta ação não poderá ser desfeita.")) return;

  farm.alambradoRecords = farm.alambradoRecords.filter((r) => r.id !== recordId);
  logAuditEvent("Exclusão", "alambrado", `${record.codigo} - ${record.tipoServicoLabel}`, { farmId: farm.id, farmName: farm.name, recordCode: record.codigo });
  saveData();
  renderAlambradoHomeCard();
  renderAlambradoList();
  if (runtime.albActiveTab === "relatorio") renderAlambradoReport();
}

/* ── Visualização de um registro ──────────────────────────────────── */

function openAlambradoViewDialog(farm, record) {
  document.getElementById("albViewKicker").textContent = farm.name;
  document.getElementById("albViewTitle").textContent = record.codigo;

  const fields = [
    ["Fazenda", farm.name],
    ["Potreiro", record.potreiroName || "Sem potreiro específico"],
    ["Tipo de serviço", record.tipoServicoLabel],
    ["Medida", record.medida === "metro" ? "Metro" : "Unidade"],
    ["Quantidade/metragem", formatInteger(record.quantidade)],
    ["Valor unitário", formatCurrency(record.valorUnitario)],
    ["Valor total", formatCurrency(record.valorTotal)],
    ["Data do serviço", formatDate(record.data)],
    ["Observações", record.observacoes || "—"]
  ];
  document.getElementById("albViewDetails").innerHTML = fields
    .map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`)
    .join("");

  const anexos = record.anexos || [];
  document.getElementById("albViewMediaCounter").textContent = anexos.length
    ? `${anexos.length} arquivo(s) anexado(s)`
    : "Nenhum arquivo anexado.";

  const mediaGrid = document.getElementById("albViewMediaGrid");
  mediaGrid.innerHTML = anexos.map((a) => `
    <div class="movement-photo-card">
      ${a.tipo_arquivo === "video"
        ? `<video src="${a.url}" controls preload="metadata"></video>`
        : `<img src="${a.url}" alt="${escapeHtml(a.nome_arquivo)}">`}
      <div class="movement-photo-meta"><strong>${escapeHtml(a.nome_arquivo)}</strong><span>${formatFileSize(a.tamanho)}</span></div>
      <button type="button" class="table-action-btn" data-alb-open-media="${escapeHtml(a.url)}">Abrir em tamanho maior</button>
    </div>
  `).join("");
  mediaGrid.querySelectorAll("[data-alb-open-media]").forEach((btn) => btn.addEventListener("click", () => window.open(btn.dataset.albOpenMedia, "_blank")));

  document.getElementById("alambradoViewDialog").showModal();
}

/* ── Aba "Serviços cadastrados" (filtros + lista) ─────────────────── */

function buildAlambradoFilterBarHtml(filters, options) {
  const farms = getAllFarms();
  const farmForPotreiro = filters.farmId && filters.farmId !== "all" ? state.data.farms[filters.farmId] : null;
  const potreiroOptions = farmForPotreiro ? getPotreroEntries(farmForPotreiro) : [];

  return `
    <label>Fazenda
      <select data-alb-filter="farmId">
        <option value="all">Todas as fazendas</option>
        ${farms.map((f) => `<option value="${f.id}" ${filters.farmId === f.id ? "selected" : ""}>${escapeHtml(f.name)}</option>`).join("")}
      </select>
    </label>
    <label>Potreiro
      <select data-alb-filter="potreiroId" ${farmForPotreiro ? "" : "disabled"}>
        <option value="all">Todos os potreiros</option>
        ${potreiroOptions.map((p) => `<option value="${p.id}" ${filters.potreiroId === p.id ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}
      </select>
    </label>
    <label>Tipo de serviço
      <select data-alb-filter="tipo">
        <option value="all">Todos os tipos</option>
        ${ALAMBRADO_SERVICE_TYPES.map((t) => `<option value="${t.id}" ${filters.tipo === t.id ? "selected" : ""}>${escapeHtml(t.label)}</option>`).join("")}
      </select>
    </label>
    <label>De
      <input type="date" data-alb-filter="dataIni" value="${filters.dataIni || ""}">
    </label>
    <label>Até
      <input type="date" data-alb-filter="dataFim" value="${filters.dataFim || ""}">
    </label>
    ${options.showMonthYear ? `
    <label>Mês
      <select data-alb-filter="mes">
        <option value="all">Todos</option>
        ${MONTH_NAMES.map((m, i) => `<option value="${i + 1}" ${String(filters.mes) === String(i + 1) ? "selected" : ""}>${m}</option>`).join("")}
      </select>
    </label>
    <label>Ano
      <select data-alb-filter="ano">
        <option value="all">Todos</option>
        ${getAlambradoAvailableYears().map((y) => `<option value="${y}" ${String(filters.ano) === String(y) ? "selected" : ""}>${y}</option>`).join("")}
      </select>
    </label>` : ""}
    <label>Mídia
      <select data-alb-filter="midia">
        <option value="all">Com ou sem mídia</option>
        <option value="com" ${filters.midia === "com" ? "selected" : ""}>Somente com fotos/vídeos</option>
        <option value="sem" ${filters.midia === "sem" ? "selected" : ""}>Somente sem fotos/vídeos</option>
      </select>
    </label>
    ${options.showSearch ? `
    <label class="alb-filter-search">Buscar
      <input type="text" data-alb-filter="busca" value="${escapeHtml(filters.busca || "")}" placeholder="Código, tipo ou observação">
    </label>` : ""}
    <button type="button" class="ghost-btn" data-alb-filter-clear="1">Limpar filtros</button>
  `;
}

function wireAlambradoFilterBar(container, filters, onChange, onClear) {
  container.querySelectorAll("[data-alb-filter]").forEach((input) => {
    const key = input.dataset.albFilter;
    const eventName = (input.tagName === "INPUT" && input.type === "text") ? "input" : "change";
    input.addEventListener(eventName, () => {
      filters[key] = input.value;
      if (key === "farmId") filters.potreiroId = "all";
      onChange();
    });
  });
  const clearBtn = container.querySelector("[data-alb-filter-clear]");
  if (clearBtn) clearBtn.addEventListener("click", onClear);
}

function renderAlambradoListFilterBar() {
  const el = document.getElementById("albListFilterBar");
  if (!el) return;
  el.innerHTML = buildAlambradoFilterBarHtml(runtime.albListFilters, { showMonthYear: false, showSearch: true });
  wireAlambradoFilterBar(el, runtime.albListFilters, () => { runtime.albListPage = 0; renderAlambradoList(); }, () => {
    runtime.albListFilters = { farmId: "all", potreiroId: "all", tipo: "all", dataIni: "", dataFim: "", midia: "all", busca: "" };
    runtime.albListPage = 0;
    renderAlambradoListFilterBar();
    renderAlambradoList();
  });
}

function renderAlambradoList() {
  const tbody = document.getElementById("albListTableBody");
  if (!tbody) return;

  const all = getFilteredAlambradoRecords(runtime.albListFilters);
  const totalPages = Math.max(1, Math.ceil(all.length / ALAMBRADO_LIST_PAGE_SIZE));
  runtime.albListPage = Math.min(runtime.albListPage, totalPages - 1);
  const start = runtime.albListPage * ALAMBRADO_LIST_PAGE_SIZE;
  const pageRecords = all.slice(start, start + ALAMBRADO_LIST_PAGE_SIZE);

  tbody.innerHTML = pageRecords.length ? pageRecords.map((r) => `
    <tr>
      <td data-label="Código"><strong>${escapeHtml(r.codigo)}</strong></td>
      <td data-label="Fazenda">${escapeHtml(r._farmName)}</td>
      <td data-label="Potreiro">${escapeHtml(r.potreiroName || "Sem potreiro")}</td>
      <td data-label="Tipo">${escapeHtml(r.tipoServicoLabel)}</td>
      <td data-label="Medida">${r.medida === "metro" ? "Metro" : "Unidade"}</td>
      <td data-label="Qtd.">${formatInteger(r.quantidade)}</td>
      <td data-label="Valor unit.">${formatCurrency(r.valorUnitario)}</td>
      <td data-label="Valor total">${formatCurrency(r.valorTotal)}</td>
      <td data-label="Data">${formatDate(r.data)}</td>
      <td data-label="Obs.">${escapeHtml(trimLabel(r.observacoes || "—", 40))}</td>
      <td data-label="Mídia">${(r.anexos || []).length ? `<span class="photo-flag">${r.anexos.length} arquivo(s)</span>` : "—"}</td>
      <td data-label="Ações">
        <button type="button" class="table-action-btn" data-alb-view="${r._farmId}|${r.id}">Ver</button>
        <button type="button" class="table-action-btn" data-alb-edit="${r._farmId}|${r.id}">Editar</button>
        <button type="button" class="table-action-btn table-action-btn-danger" data-alb-delete="${r._farmId}|${r.id}">Excluir</button>
      </td>
    </tr>
  `).join("") : `<tr><td colspan="12" class="table-empty-cell">Nenhum serviço de alambrado encontrado com os filtros atuais.</td></tr>`;

  renderAlambradoListPagination(all.length, totalPages);
}

function renderAlambradoListPagination(totalRecords, totalPages) {
  const el = document.getElementById("albListPagination");
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <button type="button" class="ghost-btn" id="albListPrevPage" ${runtime.albListPage === 0 ? "disabled" : ""}>Anterior</button>
    <span>Página ${runtime.albListPage + 1} de ${totalPages} · ${formatInteger(totalRecords)} registro(s)</span>
    <button type="button" class="ghost-btn" id="albListNextPage" ${runtime.albListPage >= totalPages - 1 ? "disabled" : ""}>Próxima</button>
  `;
  const prevBtn = document.getElementById("albListPrevPage");
  const nextBtn = document.getElementById("albListNextPage");
  if (prevBtn) prevBtn.addEventListener("click", () => { runtime.albListPage--; renderAlambradoList(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { runtime.albListPage++; renderAlambradoList(); });
}

document.getElementById("albPanelLista").addEventListener("click", (event) => {
  const viewBtn = event.target.closest("[data-alb-view]");
  const editBtn = event.target.closest("[data-alb-edit]");
  const delBtn = event.target.closest("[data-alb-delete]");

  if (viewBtn) {
    const [farmId, id] = viewBtn.dataset.albView.split("|");
    const farm = state.data.farms[farmId];
    const record = farm && getAlambradoRecords(farm).find((r) => r.id === id);
    if (record) openAlambradoViewDialog(farm, record);
  } else if (editBtn) {
    const [farmId, id] = editBtn.dataset.albEdit.split("|");
    const farm = state.data.farms[farmId];
    const record = farm && getAlambradoRecords(farm).find((r) => r.id === id);
    if (record) openAlambradoEditor(farm, record);
  } else if (delBtn) {
    const [farmId, id] = delBtn.dataset.albDelete.split("|");
    const farm = state.data.farms[farmId];
    if (farm) handleAlambradoDelete(farm, id);
  }
});

/* ── Aba "Relatório" ───────────────────────────────────────────────── */

function renderAlambradoReportFilterBar() {
  const el = document.getElementById("albReportFilterBar");
  if (!el) return;
  el.innerHTML = buildAlambradoFilterBarHtml(runtime.albReportFilters, { showMonthYear: true, showSearch: false });
  wireAlambradoFilterBar(el, runtime.albReportFilters, () => renderAlambradoReport(), () => {
    runtime.albReportFilters = { farmId: "all", potreiroId: "all", tipo: "all", dataIni: "", dataFim: "", mes: "all", ano: "all", midia: "all" };
    renderAlambradoReportFilterBar();
    renderAlambradoReport();
  });
}

function renderAlambradoReport() {
  const records = getFilteredAlambradoRecords(runtime.albReportFilters);
  renderAlambradoReportSummaryCards(records);
  try {
    renderAlambradoCharts(records);
  } catch (error) {
    console.warn("[alambrado] erro ao renderizar gráficos:", error);
  }
  renderAlambradoReportTable(records);
}

function renderAlambradoReportSummaryCards(records) {
  const el = document.getElementById("albReportKpis");
  if (!el) return;

  const valorTotal = records.reduce((s, r) => s + Number(r.valorTotal || 0), 0);
  const totalMetros = records.filter((r) => r.medida === "metro").reduce((s, r) => s + Number(r.quantidade || 0), 0);
  const totalUnidades = records.filter((r) => r.medida === "unidade").reduce((s, r) => s + Number(r.quantidade || 0), 0);

  const monthMap = new Map();
  records.forEach((r) => {
    const period = String(r.data || "").slice(0, 7);
    if (!period) return;
    monthMap.set(period, (monthMap.get(period) || 0) + Number(r.valorTotal || 0));
  });
  const mediaMensal = monthMap.size ? valorTotal / monthMap.size : 0;

  const tipoMap = new Map();
  records.forEach((r) => tipoMap.set(r.tipoServicoLabel, (tipoMap.get(r.tipoServicoLabel) || 0) + Number(r.valorTotal || 0)));
  let tipoTop = null;
  tipoMap.forEach((value, label) => { if (!tipoTop || value > tipoTop.value) tipoTop = { label, value }; });

  const farmMap = new Map();
  records.forEach((r) => farmMap.set(r._farmName, (farmMap.get(r._farmName) || 0) + Number(r.valorTotal || 0)));
  let farmTop = null;
  farmMap.forEach((value, label) => { if (!farmTop || value > farmTop.value) farmTop = { label, value }; });

  const kpis = [
    { label: "Valor total gasto", value: formatCurrency(valorTotal) },
    { label: "Serviços executados", value: formatInteger(records.length) },
    { label: "Metros executados", value: `${formatInteger(totalMetros)} m` },
    { label: "Unidades executadas", value: formatInteger(totalUnidades) },
    { label: "Média de gasto por mês", value: formatCurrency(mediaMensal) },
    { label: "Serviço de maior custo", value: tipoTop ? tipoTop.label : "—", note: tipoTop ? formatCurrency(tipoTop.value) : "" },
    { label: "Fazenda com maior gasto", value: farmTop ? farmTop.label : "—", note: farmTop ? formatCurrency(farmTop.value) : "" }
  ];

  el.innerHTML = kpis.map((k) => `
    <div class="summary-card">
      <p>${escapeHtml(k.label)}</p>
      <strong>${escapeHtml(k.value)}</strong>
      ${k.note ? `<p>${escapeHtml(k.note)}</p>` : ""}
    </div>
  `).join("");
}

function renderAlambradoCharts(records) {
  const chartIds = ["albChartMonthlyTotal", "albChartAnnualTotal", "albChartMonthlyByType", "albChartAnnualByType", "albChartPercentByType", "albChartByFarm", "albChartByPotreiro"];
  if (typeof window.Chart !== "function") {
    chartIds.forEach((id) => drawChartFallback(id, "Gráfico indisponível no momento."));
    return;
  }
  renderAlbChartMonthlyTotal(records);
  renderAlbChartAnnualTotal(records);
  renderAlbChartMonthlyByType(records);
  renderAlbChartAnnualByType(records);
  renderAlbChartPercentByType(records);
  renderAlbChartByFarm(records);
  renderAlbChartByPotreiro(records);
}

function renderAlbChartMonthlyTotal(records) {
  const canvas = document.getElementById("albChartMonthlyTotal");
  if (!canvas) return;
  if (state.charts.albMonthlyTotal) state.charts.albMonthlyTotal.destroy();

  const map = new Map();
  records.forEach((r) => {
    const period = String(r.data || "").slice(0, 7);
    if (!period) return;
    map.set(period, (map.get(period) || 0) + Number(r.valorTotal || 0));
  });
  const periods = [...map.keys()].sort();
  if (!periods.length) { drawChartFallback("albChartMonthlyTotal", "Sem dados no período selecionado."); return; }

  const context = canvas.getContext("2d");
  state.charts.albMonthlyTotal = new Chart(context, {
    type: "line",
    data: {
      labels: periods.map(formatMonthYear),
      datasets: [{
        label: "Gasto mensal",
        data: periods.map((p) => map.get(p)),
        borderColor: "#8f6132",
        backgroundColor: createLinearColor(canvas, "rgba(143, 97, 50, 0.5)", "rgba(143, 97, 50, 0.02)"),
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#8f6132",
        borderWidth: 3
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) } }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "rgba(76,55,34,0.08)" }, ticks: { callback: (v) => formatCurrency(v) } }
      }
    }
  });
}

function renderAlbChartAnnualTotal(records) {
  const canvas = document.getElementById("albChartAnnualTotal");
  if (!canvas) return;
  if (state.charts.albAnnualTotal) state.charts.albAnnualTotal.destroy();

  const map = new Map();
  records.forEach((r) => {
    const year = String(r.data || "").slice(0, 4);
    if (!year) return;
    map.set(year, (map.get(year) || 0) + Number(r.valorTotal || 0));
  });
  const years = [...map.keys()].sort();
  if (!years.length) { drawChartFallback("albChartAnnualTotal", "Sem dados no período selecionado."); return; }

  const context = canvas.getContext("2d");
  state.charts.albAnnualTotal = new Chart(context, {
    type: "bar",
    data: {
      labels: years,
      datasets: [{
        label: "Gasto anual",
        data: years.map((y) => map.get(y)),
        backgroundColor: createLinearColor(canvas, "rgba(55,91,67,0.95)", "rgba(103,149,111,0.55)"),
        borderRadius: 10,
        maxBarThickness: 46
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) } } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "rgba(76,55,34,0.08)" }, ticks: { callback: (v) => formatCurrency(v) } }
      }
    }
  });
}

function renderAlbChartMonthlyByType(records) {
  const canvas = document.getElementById("albChartMonthlyByType");
  if (!canvas) return;
  if (state.charts.albMonthlyByType) state.charts.albMonthlyByType.destroy();

  const periods = [...new Set(records.map((r) => String(r.data || "").slice(0, 7)).filter(Boolean))].sort();
  if (!periods.length) { drawChartFallback("albChartMonthlyByType", "Sem dados no período selecionado."); return; }

  const types = [...new Set(records.map((r) => r.tipoServicoLabel))];
  const datasets = types.map((type, i) => ({
    label: type,
    data: periods.map((p) => records
      .filter((r) => String(r.data || "").slice(0, 7) === p && r.tipoServicoLabel === type)
      .reduce((s, r) => s + Number(r.valorTotal || 0), 0)),
    backgroundColor: ALAMBRADO_CHART_COLORS[i % ALAMBRADO_CHART_COLORS.length],
    stack: "tipo",
    borderRadius: 4,
    maxBarThickness: 34
  }));

  const context = canvas.getContext("2d");
  state.charts.albMonthlyByType = new Chart(context, {
    type: "bar",
    data: { labels: periods.map(formatMonthYear), datasets },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 10, padding: 12, font: { size: 10 } } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, grid: { color: "rgba(76,55,34,0.08)" }, ticks: { callback: (v) => formatCurrency(v) } }
      }
    }
  });
}

function renderAlbChartAnnualByType(records) {
  const canvas = document.getElementById("albChartAnnualByType");
  if (!canvas) return;
  if (state.charts.albAnnualByType) state.charts.albAnnualByType.destroy();

  const tipoMap = new Map();
  records.forEach((r) => tipoMap.set(r.tipoServicoLabel, (tipoMap.get(r.tipoServicoLabel) || 0) + Number(r.valorTotal || 0)));
  const entries = [...tipoMap.entries()].sort((a, b) => b[1] - a[1]);
  if (!entries.length) { drawChartFallback("albChartAnnualByType", "Sem dados no período selecionado."); return; }

  const context = canvas.getContext("2d");
  state.charts.albAnnualByType = new Chart(context, {
    type: "bar",
    data: {
      labels: entries.map(([label]) => label),
      datasets: [{
        label: "Total investido",
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map((_, i) => ALAMBRADO_CHART_COLORS[i % ALAMBRADO_CHART_COLORS.length]),
        borderRadius: 8,
        maxBarThickness: 26
      }]
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.parsed.x) } } },
      scales: {
        x: { beginAtZero: true, grid: { color: "rgba(76,55,34,0.08)" }, ticks: { callback: (v) => formatCurrency(v) } },
        y: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

function renderAlbChartPercentByType(records) {
  const canvas = document.getElementById("albChartPercentByType");
  if (!canvas) return;
  if (state.charts.albPercentByType) state.charts.albPercentByType.destroy();

  const tipoMap = new Map();
  records.forEach((r) => tipoMap.set(r.tipoServicoLabel, (tipoMap.get(r.tipoServicoLabel) || 0) + Number(r.valorTotal || 0)));
  const entries = [...tipoMap.entries()].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!entries.length || total <= 0) { drawChartFallback("albChartPercentByType", "Sem dados no período selecionado."); return; }

  const context = canvas.getContext("2d");
  state.charts.albPercentByType = new Chart(context, {
    type: "doughnut",
    data: {
      labels: entries.map(([label]) => label),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map((_, i) => ALAMBRADO_CHART_COLORS[i % ALAMBRADO_CHART_COLORS.length]),
        borderWidth: 2,
        borderColor: "#fffaf3"
      }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 10, font: { size: 9.5 } } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)} (${((ctx.parsed / total) * 100).toFixed(1)}%)` } }
      }
    }
  });
}

function renderAlbChartByFarm(records) {
  const canvas = document.getElementById("albChartByFarm");
  if (!canvas) return;
  if (state.charts.albByFarm) state.charts.albByFarm.destroy();

  const map = new Map();
  records.forEach((r) => map.set(r._farmName, (map.get(r._farmName) || 0) + Number(r.valorTotal || 0)));
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  if (!entries.length) { drawChartFallback("albChartByFarm", "Sem dados no período selecionado."); return; }

  const context = canvas.getContext("2d");
  state.charts.albByFarm = new Chart(context, {
    type: "bar",
    data: {
      labels: entries.map(([label]) => label),
      datasets: [{
        label: "Total investido",
        data: entries.map(([, v]) => v),
        backgroundColor: createLinearColor(canvas, "rgba(140,75,56,0.95)", "rgba(195,120,100,0.55)"),
        borderRadius: 10,
        maxBarThickness: 46
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) } } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "rgba(76,55,34,0.08)" }, ticks: { callback: (v) => formatCurrency(v) } }
      }
    }
  });
}

function renderAlbChartByPotreiro(records) {
  const canvas = document.getElementById("albChartByPotreiro");
  if (!canvas) return;
  if (state.charts.albByPotreiro) state.charts.albByPotreiro.destroy();

  const map = new Map();
  records.forEach((r) => {
    if (!r.potreiroName) return;
    const label = `${r.potreiroName} (${r._farmName})`;
    map.set(label, (map.get(label) || 0) + Number(r.valorTotal || 0));
  });
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  if (!entries.length) { drawChartFallback("albChartByPotreiro", "Nenhum serviço vinculado a potreiro no período."); return; }

  const context = canvas.getContext("2d");
  state.charts.albByPotreiro = new Chart(context, {
    type: "bar",
    data: {
      labels: entries.map(([label]) => label),
      datasets: [{
        label: "Total investido",
        data: entries.map(([, v]) => v),
        backgroundColor: createLinearColor(canvas, "rgba(81,122,96,0.95)", "rgba(123,155,109,0.55)"),
        borderRadius: 8,
        maxBarThickness: 26
      }]
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.parsed.x) } } },
      scales: {
        x: { beginAtZero: true, grid: { color: "rgba(76,55,34,0.08)" }, ticks: { callback: (v) => formatCurrency(v) } },
        y: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

function renderAlambradoReportTable(records) {
  const tbody = document.getElementById("albReportTableBody");
  const tfoot = document.getElementById("albReportTableFoot");
  if (!tbody) return;

  tbody.innerHTML = records.length ? records.map((r) => {
    const anexos = r.anexos || [];
    const mainRow = `
      <tr>
        <td data-label="Código">${escapeHtml(r.codigo)}</td>
        <td data-label="Data">${formatDate(r.data)}</td>
        <td data-label="Fazenda">${escapeHtml(r._farmName)}</td>
        <td data-label="Potreiro">${escapeHtml(r.potreiroName || "—")}</td>
        <td data-label="Tipo">${escapeHtml(r.tipoServicoLabel)}</td>
        <td data-label="Medida">${r.medida === "metro" ? "Metro" : "Unidade"}</td>
        <td data-label="Qtd.">${formatInteger(r.quantidade)}</td>
        <td data-label="Valor unit.">${formatCurrency(r.valorUnitario)}</td>
        <td data-label="Valor total">${formatCurrency(r.valorTotal)}</td>
        <td data-label="Observações">${escapeHtml(trimLabel(r.observacoes || "—", 50))}</td>
        <td data-label="Anexos">${formatInteger(anexos.length)}</td>
      </tr>
    `;
    const mediaRow = anexos.length ? `
      <tr class="alb-report-media-row">
        <td colspan="11">
          <div class="alb-report-media-label">Fotos e vídeos do serviço ${escapeHtml(r.codigo)}</div>
          <div class="movement-photo-grid alb-report-media-grid">
            ${anexos.map((a) => `
              <div class="movement-photo-card">
                ${a.tipo_arquivo === "video"
                  ? `<video src="${a.url}" controls preload="metadata"></video>`
                  : `<img src="${a.url}" alt="${escapeHtml(a.nome_arquivo)}">`}
                <div class="movement-photo-meta"><strong>${escapeHtml(a.nome_arquivo)}</strong></div>
              </div>
            `).join("")}
          </div>
        </td>
      </tr>
    ` : "";
    return mainRow + mediaRow;
  }).join("") : `<tr><td colspan="11" class="table-empty-cell">Nenhum serviço encontrado para os filtros selecionados.</td></tr>`;

  const totalGeral = records.reduce((s, r) => s + Number(r.valorTotal || 0), 0);
  const totalMetros = records.filter((r) => r.medida === "metro").reduce((s, r) => s + Number(r.quantidade || 0), 0);
  const totalUnidades = records.filter((r) => r.medida === "unidade").reduce((s, r) => s + Number(r.quantidade || 0), 0);

  tfoot.innerHTML = `
    <tr>
      <td colspan="6"><strong>Totais do período filtrado</strong></td>
      <td data-label="Qtd.">${formatInteger(totalMetros)} m / ${formatInteger(totalUnidades)} un.</td>
      <td></td>
      <td data-label="Valor total"><strong>${formatCurrency(totalGeral)}</strong></td>
      <td colspan="2"></td>
    </tr>
  `;
}

/* ── Exportações do relatório ──────────────────────────────────────── */

async function exportAlambradoPdf() {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("A biblioteca de PDF não foi carregada. Verifique sua conexão e tente novamente.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const records = getFilteredAlambradoRecords(runtime.albReportFilters);
  const farms = getAlambradoFilterFarms(runtime.albReportFilters);
  const periodLabel = getAlambradoPeriodLabel(runtime.albReportFilters);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  await appendPdfCoverPage(doc, farms, periodLabel, "Serviços de Alambrado");
  doc.addPage();

  try {
    const logoData = await loadLogoForPdf("#ffffff");
    doc.addImage(logoData, "JPEG", margin, 8, 18, 18);
  } catch (e) { /* ignore */ }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(45, 35, 25);
  doc.text("Relatório de Serviços de Alambrado", margin + 22, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(87, 69, 52);
  doc.text(`Período: ${periodLabel}   |   Responsável Técnica: ${TECHNICAL_MANAGER_NAME}   |   Gerado em ${new Date().toLocaleString("pt-BR")}`, margin + 22, 22);
  doc.setDrawColor(140, 80, 45);
  doc.setLineWidth(0.6);
  doc.line(margin, 27, pageW - margin, 27);

  const valorTotal = records.reduce((s, r) => s + Number(r.valorTotal || 0), 0);
  const totalMetros = records.filter((r) => r.medida === "metro").reduce((s, r) => s + Number(r.quantidade || 0), 0);
  const totalUnidades = records.filter((r) => r.medida === "unidade").reduce((s, r) => s + Number(r.quantidade || 0), 0);
  const kpis = [
    { label: "Serviços", value: formatInteger(records.length) },
    { label: "Metros", value: formatInteger(totalMetros) },
    { label: "Unidades", value: formatInteger(totalUnidades) },
    { label: "Valor total", value: formatCurrency(valorTotal) }
  ];
  const kpiW = (pageW - margin * 2 - 6 * kpis.length) / kpis.length;
  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + 6);
    const y = 32;
    doc.setFillColor(37, 88, 58);
    doc.roundedRect(x, y, kpiW, 18, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 210, 185);
    doc.text(kpi.label, x + kpiW / 2, y + 6, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(248, 244, 236);
    doc.text(kpi.value, x + kpiW / 2, y + 14, { align: "center" });
  });

  doc.autoTable({
    startY: 56,
    head: [["Código", "Data", "Fazenda", "Potreiro", "Tipo", "Medida", "Qtd.", "Valor unit.", "Valor total", "Obs.", "Anexos"]],
    body: records.length
      ? records.map((r) => [
        r.codigo, formatDate(r.data), r._farmName, r.potreiroName || "—", r.tipoServicoLabel,
        r.medida === "metro" ? "Metro" : "Unidade", formatInteger(r.quantidade), formatCurrency(r.valorUnitario),
        formatCurrency(r.valorTotal), (r.observacoes || "").slice(0, 40), formatInteger((r.anexos || []).length)
      ])
      : [["—", "—", "—", "—", "—", "—", "—", "—", "—", "Sem registros no período", ""]],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    foot: [["", "", "", "", "", "", "", "Total geral", formatCurrency(valorTotal), "", ""]],
    footStyles: { fillColor: [245, 234, 218], textColor: [45, 35, 25], fontStyle: "bold" }
  });

  const recordsWithMedia = records.filter((r) => (r.anexos || []).length > 0);
  if (recordsWithMedia.length) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(45, 35, 25);
    doc.text("Anexos por Serviço", margin, 14);
    doc.setDrawColor(140, 80, 45);
    doc.setLineWidth(0.5);
    doc.line(margin, 18, pageW - margin, 18);

    const thumbSize = 30;
    const thumbGap = 4;
    const thumbsPerRow = Math.max(1, Math.floor((pageW - margin * 2) / (thumbSize + thumbGap)));
    let y = 26;

    for (const record of recordsWithMedia) {
      const imagens = (record.anexos || []).filter((a) => a.tipo_arquivo !== "video");
      const videos = (record.anexos || []).filter((a) => a.tipo_arquivo === "video");
      const rowsNeeded = imagens.length ? Math.ceil(imagens.length / thumbsPerRow) : 0;
      const blockHeight = 6 + rowsNeeded * (thumbSize + thumbGap) + (videos.length ? 5 : 0) + 6;

      if (y + blockHeight > pageH - margin) {
        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(45, 35, 25);
        doc.text("Anexos por Serviço (continuação)", margin, 14);
        doc.setDrawColor(140, 80, 45);
        doc.setLineWidth(0.5);
        doc.line(margin, 18, pageW - margin, 18);
        y = 26;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(45, 35, 25);
      doc.text(`${record.codigo} — ${record.tipoServicoLabel} (${formatDate(record.data)}, ${record._farmName})`, margin, y);
      y += 4;

      let x = margin;
      let col = 0;
      for (const photo of imagens) {
        try {
          const dataUrl = await fetchPhotoForPdf(photo);
          if (dataUrl) doc.addImage(dataUrl, "JPEG", x, y, thumbSize, thumbSize);
        } catch (error) {
          console.warn("Não foi possível incluir anexo no PDF.", error);
        }
        doc.setDrawColor(219, 209, 191);
        doc.rect(x, y, thumbSize, thumbSize);
        col++;
        if (col >= thumbsPerRow) { col = 0; x = margin; y += thumbSize + thumbGap; }
        else { x += thumbSize + thumbGap; }
      }
      if (col !== 0) y += thumbSize + thumbGap;

      if (videos.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(112, 94, 76);
        doc.text(`${videos.length} vídeo(s) anexado(s) — disponível na consulta do serviço no sistema.`, margin, y);
        y += 5;
      }
      y += 6;
    }
  }

  const chartIds = ["albChartMonthlyTotal", "albChartAnnualTotal", "albChartMonthlyByType", "albChartAnnualByType", "albChartPercentByType", "albChartByFarm", "albChartByPotreiro"];
  const chartCanvases = chartIds.map((id) => document.getElementById(id)).filter((c) => c && c.width && c.height);

  const cols = 2;
  const rowsPerPage = 2;
  const gap = 8;
  const rowH = 70;
  const rowPitch = 86;
  const colW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  let col = 0;
  let row = 0;

  chartCanvases.forEach((canvas) => {
    if (col === 0 && row === 0) {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(45, 35, 25);
      doc.text("Gráficos do Relatório", margin, 14);
      doc.setDrawColor(140, 80, 45);
      doc.setLineWidth(0.5);
      doc.line(margin, 18, pageW - margin, 18);
    }

    const x = margin + col * (colW + gap);
    const y = 26 + row * rowPitch;
    try {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(87, 69, 52);
      doc.text(canvas.dataset.albChartTitle || "Gráfico", x, y);
      const imgData = canvas.toDataURL("image/png", 1.0);
      const ratio = Math.min(colW / canvas.width, rowH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      doc.addImage(imgData, "PNG", x + (colW - w) / 2, y + 3, w, h);
    } catch (error) {
      console.warn("Não foi possível incluir o gráfico no PDF.", canvas.id, error);
    }

    col++;
    if (col >= cols) { col = 0; row++; }
    if (row >= rowsPerPage) { row = 0; col = 0; }
  });

  doc.save(`relatorio-alambrado-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function exportAlambradoExcel() {
  if (typeof window.XLSX === "undefined") {
    alert("A biblioteca de exportação Excel não foi carregada. Verifique sua conexão e tente novamente.");
    return;
  }
  const records = getFilteredAlambradoRecords(runtime.albReportFilters);
  const rows = records.map((r) => ({
    "Código": r.codigo,
    "Data": formatDate(r.data),
    "Fazenda": r._farmName,
    "Potreiro": r.potreiroName || "",
    "Tipo de serviço": r.tipoServicoLabel,
    "Medida": r.medida === "metro" ? "Metro" : "Unidade",
    "Quantidade/Metragem": r.quantidade,
    "Valor unitário": r.valorUnitario,
    "Valor total": r.valorTotal,
    "Observações": r.observacoes || "",
    "Qtd. anexos": (r.anexos || []).length
  }));
  const worksheet = window.XLSX.utils.json_to_sheet(rows);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, "Servicos de Alambrado");
  window.XLSX.writeFile(workbook, `relatorio-alambrado-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function printAlambradoReport() {
  const records = getFilteredAlambradoRecords(runtime.albReportFilters);
  const kpisHtml = document.getElementById("albReportKpis")?.innerHTML || "";
  const chartIds = ["albChartMonthlyTotal", "albChartAnnualTotal", "albChartMonthlyByType", "albChartAnnualByType", "albChartPercentByType", "albChartByFarm", "albChartByPotreiro"];
  const chartsHtml = chartIds.map((id) => {
    const canvas = document.getElementById(id);
    if (!canvas || !canvas.width || !canvas.height) return "";
    const title = canvas.dataset.albChartTitle || "";
    return `<div class="p-chart"><h3>${escapeHtml(title)}</h3><img src="${canvas.toDataURL("image/png", 1.0)}"></div>`;
  }).join("");
  const rowsHtml = records.map((r) => `
    <tr>
      <td>${escapeHtml(r.codigo)}</td><td>${formatDate(r.data)}</td><td>${escapeHtml(r._farmName)}</td>
      <td>${escapeHtml(r.potreiroName || "—")}</td><td>${escapeHtml(r.tipoServicoLabel)}</td>
      <td>${formatInteger(r.quantidade)}</td><td>${formatCurrency(r.valorUnitario)}</td><td>${formatCurrency(r.valorTotal)}</td>
    </tr>
  `).join("");
  const valorTotal = records.reduce((s, r) => s + Number(r.valorTotal || 0), 0);

  const mediaBlocksHtml = records.filter((r) => (r.anexos || []).length > 0).map((r) => `
    <div class="p-media-block">
      <h4>${escapeHtml(r.codigo)} — ${escapeHtml(r.tipoServicoLabel)} (${formatDate(r.data)}, ${escapeHtml(r._farmName)})</h4>
      <div class="p-media-grid">
        ${(r.anexos || []).map((a) => a.tipo_arquivo === "video"
          ? `<video src="${a.url}" controls preload="metadata"></video>`
          : `<img src="${a.url}" alt="${escapeHtml(a.nome_arquivo)}">`
        ).join("")}
      </div>
    </div>
  `).join("");

  const win = window.open("", "_blank");
  if (!win) { alert("Habilite pop-ups para imprimir o relatório."); return; }
  win.document.write(`
    <!doctype html><html><head><meta charset="utf-8"><title>Relatório de Serviços de Alambrado</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#2d2319;padding:24px;}
      h1{font-size:20px;margin-bottom:4px;}
      .p-kpis{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0;}
      .p-kpis .summary-card{border:1px solid #ddd;border-radius:10px;padding:10px 14px;min-width:150px;}
      .p-kpis .summary-card p{margin:0 0 4px;color:#7a6754;font-size:11px;}
      .p-kpis .summary-card strong{font-size:16px;}
      .p-charts{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:20px 0;}
      .p-chart img{width:100%;}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px;}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;}
      th{background:#f2ede4;}
      tfoot td{font-weight:bold;background:#f7f1e6;}
      .p-media-block{margin-top:18px;page-break-inside:avoid;}
      .p-media-block h4{margin:0 0 8px;font-size:12px;color:#375b43;}
      .p-media-grid{display:flex;flex-wrap:wrap;gap:8px;}
      .p-media-grid img,.p-media-grid video{width:120px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #ccc;background:#000;}
      @media print { .p-charts { grid-template-columns:repeat(2,1fr); } }
    </style></head><body>
    <h1>Relatório de Serviços de Alambrado</h1>
    <p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    <div class="p-kpis">${kpisHtml}</div>
    <div class="p-charts">${chartsHtml}</div>
    <table>
      <thead><tr><th>Código</th><th>Data</th><th>Fazenda</th><th>Potreiro</th><th>Tipo</th><th>Qtd.</th><th>Valor unit.</th><th>Valor total</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot><tr><td colspan="7">Total geral</td><td>${formatCurrency(valorTotal)}</td></tr></tfoot>
    </table>
    ${mediaBlocksHtml ? `<h2>Anexos por Serviço</h2>${mediaBlocksHtml}` : ""}
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

function saveAlambradoChartsAsImages() {
  const chartIds = ["albChartMonthlyTotal", "albChartAnnualTotal", "albChartMonthlyByType", "albChartAnnualByType", "albChartPercentByType", "albChartByFarm", "albChartByPotreiro"];
  chartIds.forEach((id) => {
    const canvas = document.getElementById(id);
    if (!canvas || !canvas.width || !canvas.height) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png", 1.0);
    link.download = `grafico-alambrado-${id}.png`;
    link.click();
  });
}

document.getElementById("albExportPdfBtn").addEventListener("click", () => {
  exportAlambradoPdf().catch((error) => {
    console.error("Falha ao gerar PDF do relatório de alambrado.", error);
    alert("Não foi possível gerar o PDF do relatório.");
  });
});
document.getElementById("albExportExcelBtn").addEventListener("click", exportAlambradoExcel);
document.getElementById("albPrintBtn").addEventListener("click", printAlambradoReport);
document.getElementById("albSaveChartsBtn").addEventListener("click", saveAlambradoChartsAsImages);

/* ── Dados de demonstração ─────────────────────────────────────────── */

/* ── Inicialização ─────────────────────────────────────────────────── */

if (isAuthenticated()) {
  render();
}
