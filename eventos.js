/* ════════════════════════════════════════════════════════════════════
   Fazendas Da Bruna — Eventos do Rebanho
   Cards "Abate/Consumo" e "Mortes", registros recentes vinculados ao
   estoque e destaques no PDF geral. Carregado depois de pastagens.js.
   ════════════════════════════════════════════════════════════════════ */

const MOVEMENT_DEATH_CAUSES = [
  { value: "doenca", label: "Doença / enfermidade" },
  { value: "predador", label: "Ataque de predador" },
  { value: "acidente", label: "Acidente (afogamento, queda, etc.)" },
  { value: "intoxicacao", label: "Intoxicação / planta tóxica" },
  { value: "parto", label: "Complicação no parto" },
  { value: "clima", label: "Condição climática extrema" },
  { value: "idade", label: "Idade avançada / causa natural" },
  { value: "desconhecida", label: "Causa desconhecida" },
  { value: "outra", label: "Outra (especificar)" },
];

const MOVEMENT_DEATH_PHOTO_MAX = 4;

// Track selected species for evento dialogs
runtime.eventoSelectedSpecies = runtime.eventoSelectedSpecies || {};

const EVENTO_CONSUMO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>`;
const EVENTO_MORTE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4-4.5-7-8-7-11a7 7 0 0 1 14 0c0 3-3 6.5-7 11z"/><path d="M9 9h6"/><path d="M12 6v6"/></svg>`;

runtime.eventoMortePhotoDrafts = runtime.eventoMortePhotoDrafts || [];

/* ── Helpers ──────────────────────────────────────────────────────── */

function getMovementCauseLabel(movement) {
  if (movement.type !== "morte") return "";
  if (movement.cause === "outra") return movement.customCause || "Outra";
  const found = MOVEMENT_DEATH_CAUSES.find((c) => c.value === movement.cause);
  return found ? found.label : (movement.cause || "Causa não informada");
}

function getEventoPotreiroLabel(farmId, potreiroId) {
  const farm = state.data.farms[farmId];
  if (!farm || !potreiroId || potreiroId === UNALLOCATED_POTREIRO_KEY) return "Sem campo";
  const entry = getPotreroEntries(farm).find((p) => p.id === potreiroId);
  return entry ? entry.name : potreiroId;
}

/* ── Seção do dashboard ──────────────────────────────────────────── */

(function injectEventosSection() {
  const globalPanel = document.querySelector(".global-panel");
  if (globalPanel && !document.getElementById("eventosSection")) {
    globalPanel.insertAdjacentHTML("beforeend", `<section class="eventos-section" id="eventosSection"></section>`);
  }
})();

function renderEventosSection() {
  const section = document.getElementById("eventosSection");
  if (!section) return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ? getAllFarms() : [getFarm()];
  const year = state.filters.year;
  const month = state.filters.month;
  const scopeLabel = isTotalView ? "em todas as fazendas" : `em ${escapeHtml(farms[0]?.name || "fazenda")}`;

  let consumoTotal = 0;
  let morteTotal = 0;
  let herdTotal = 0;
  farms.forEach((farm) => {
    const summary = summarizePeriod(farm, year, month);
    consumoTotal += Number(summary.byType?.consumo || 0);
    morteTotal += Number(summary.byType?.morte || 0);
    herdTotal += getFarmTotal(farm);
  });
  const mortalityRate = herdTotal > 0 ? (morteTotal / herdTotal) * 100 : 0;

  const records = farms
    .flatMap((farm) =>
      (farm.movements || [])
        .filter((m) => (m.type === "consumo" || m.type === "morte") && movementMatchesPeriod(m, year, month))
        .map((m) => ({ ...m, farmId: farm.id, farmName: farm.name }))
    )
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const headerCols = [
    "Data",
    ...(isTotalView ? ["Fazenda"] : []),
    "Tipo",
    "Categoria",
    "Campo",
    "Qtd",
    "Causa / Observação",
    "Fotos",
    ...(isAdmin() ? [""] : []),
  ];

  const bodyRows = records.length
    ? records.map((m) => {
        const typeBadge = m.type === "morte"
          ? `<span class="eventos-type-badge eventos-type-badge-morte">Morte</span>`
          : `<span class="eventos-type-badge eventos-type-badge-consumo">Consumo</span>`;
        const causeOrNotes = m.type === "morte"
          ? ([getMovementCauseLabel(m), m.notes].filter(Boolean).join(" — ") || "-")
          : (m.notes || "-");
        const cells = [
          formatDate(m.date),
          ...(isTotalView ? [escapeHtml(m.farmName)] : []),
          typeBadge,
          escapeHtml(m.categoryName),
          escapeHtml(getEventoPotreiroLabel(m.farmId, m.potreiro)),
          formatInteger(m.quantity),
          escapeHtml(causeOrNotes),
          formatMovementPhotoCount(m),
        ];
        const actionCell = isAdmin()
          ? `<td><button type="button" class="row-action-btn danger" data-evento-delete-farm="${escapeHtml(m.farmId)}" data-evento-delete-id="${escapeHtml(m.id)}">Excluir</button></td>`
          : "";
        return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}${actionCell}</tr>`;
      }).join("")
    : `<tr><td colspan="${headerCols.length}" class="eventos-empty-hint">Nenhum registro de morte ou abate/consumo no período selecionado.</td></tr>`;

  section.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="panel-kicker">Eventos do Rebanho</p>
        <h2>Abate / Consumo e Mortes</h2>
      </div>
    </div>
    <div class="eventos-summary-grid">
      <article class="eventos-card eventos-card-consumo">
        <div class="eventos-card-top" data-evento-action="view-consumo">
          <div class="eventos-card-icon">${EVENTO_CONSUMO_ICON}</div>
          <div class="eventos-card-copy">
            <p class="panel-kicker">Abate / Consumo no período</p>
            <strong>${formatInteger(consumoTotal)}</strong>
            <p>cabeças registradas ${scopeLabel}, com baixa automática no estoque</p>
          </div>
        </div>
        <button type="button" class="ghost-btn eventos-card-add" data-evento-action="new-consumo">+ Registrar abate/consumo</button>
      </article>
      <article class="eventos-card eventos-card-morte">
        <div class="eventos-card-top" data-evento-action="view-morte">
          <div class="eventos-card-icon">${EVENTO_MORTE_ICON}</div>
          <div class="eventos-card-copy">
            <p class="panel-kicker">Mortes no período</p>
            <strong>${formatInteger(morteTotal)}</strong>
            <p>${mortalityRate.toFixed(2)}% de mortalidade ${scopeLabel}</p>
          </div>
        </div>
        <button type="button" class="ghost-btn eventos-card-add" data-evento-action="new-morte">+ Registrar morte</button>
      </article>
    </div>
    <div class="eventos-records-wrap table-wrap">
      <div class="panel-header">
        <div>
          <h3>Registros recentes</h3>
        </div>
      </div>
      <table>
        <thead><tr>${headerCols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;

  section.querySelectorAll("[data-evento-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.dataset.eventoAction;
      if (action === "view-consumo") openMovTypeRecordsDlg("consumo");
      else if (action === "view-morte") openMovTypeRecordsDlg("morte");
      else if (action === "new-consumo") openEventoConsumoDialog();
      else if (action === "new-morte") openEventoMorteDialog();
    });
  });

  section.querySelectorAll("[data-evento-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteMovement(btn.dataset.eventoDeleteFarm, btn.dataset.eventoDeleteId);
    });
  });
}

const brunaOriginalRenderOverviewPanelForEventos = renderOverviewPanel;
renderOverviewPanel = function () {
  brunaOriginalRenderOverviewPanelForEventos();
  renderEventosSection();
};

/* ── Diálogos ─────────────────────────────────────────────────────── */

document.body.insertAdjacentHTML("beforeend", `
  <dialog id="eventoConsumoDialog" class="modal">
    <form method="dialog" id="eventoConsumoForm" class="modal-card">
      <div class="modal-header">
        <div>
          <p class="panel-kicker">Estoque vinculado</p>
          <h2>Registrar Abate / Consumo</h2>
        </div>
        <button type="button" class="ghost-btn" id="closeEventoConsumoDialog">Fechar</button>
      </div>
      <div class="form-grid">
        <label>
          Fazenda
          <select id="eventoConsumoFarm" required></select>
        </label>
        <label>
          Espécie
          <select id="eventoConsumoSpecies" required>
            <option value="bovino">Gado / Bovinos</option>
            <option value="ovino">Ovinos</option>
          </select>
        </label>
        <label>
          Categoria
          <select id="eventoConsumoCategory" required></select>
        </label>
        <label>
          Campo / Potreiro
          <select id="eventoConsumoPotreiro"></select>
        </label>
        <label>
          Data
          <input type="date" id="eventoConsumoDate" required>
        </label>
        <label>
          Quantidade
          <input type="number" id="eventoConsumoQuantity" min="1" step="1" required>
        </label>
        <label class="form-span-2">
          Observação
          <input type="text" id="eventoConsumoNotes" maxlength="120" placeholder="Ex.: abate para consumo interno">
        </label>
        <p class="category-total-hint form-span-2" id="eventoConsumoStockHint"></p>
      </div>
      <div class="modal-actions">
        <button type="submit" class="action-btn neutral">Registrar consumo</button>
      </div>
    </form>
  </dialog>

  <dialog id="eventoMorteDialog" class="modal">
    <form method="dialog" id="eventoMorteForm" class="modal-card">
      <div class="modal-header">
        <div>
          <p class="panel-kicker">Estoque vinculado</p>
          <h2>Registrar Morte</h2>
        </div>
        <button type="button" class="ghost-btn" id="closeEventoMorteDialog">Fechar</button>
      </div>
      <div class="form-grid">
        <label>
          Fazenda
          <select id="eventoMorteFarm" required></select>
        </label>
        <label>
          Espécie
          <select id="eventoMorteSpecies" required>
            <option value="bovino">Gado / Bovinos</option>
            <option value="ovino">Ovinos</option>
          </select>
        </label>
        <label>
          Categoria
          <select id="eventoMorteCategory" required></select>
        </label>
        <label>
          Campo / Potreiro
          <select id="eventoMortePotreiro"></select>
        </label>
        <label>
          Data
          <input type="date" id="eventoMorteDate" required>
        </label>
        <label>
          Quantidade
          <input type="number" id="eventoMorteQuantity" min="1" step="1" required>
        </label>
        <label>
          Causa provável
          <select id="eventoMorteCause" required></select>
        </label>
        <label class="form-span-2" id="eventoMorteCustomCauseWrap" hidden>
          Especifique a causa
          <input type="text" id="eventoMorteCustomCause" maxlength="80" placeholder="Descreva a causa observada">
        </label>
        <label class="form-span-2">
          Observação
          <input type="text" id="eventoMorteNotes" maxlength="120" placeholder="Ex.: encontrado próximo à aguada">
        </label>
        <p class="category-total-hint form-span-2" id="eventoMorteStockHint"></p>
        <label class="form-span-2" id="eventoMortePhotoWrap">
          Fotos do animal (até ${MOVEMENT_DEATH_PHOTO_MAX})
          <input type="file" id="eventoMortePhotos" accept="image/*" multiple>
          <span class="field-note">Até ${MOVEMENT_DEATH_PHOTO_MAX} fotos, anexadas ao registro e impressas no PDF do relatório.</span>
        </label>
        <div class="movement-photo-panel form-span-2" id="eventoMortePhotoPanel" hidden>
          <div class="movement-photo-header">
            <div>
              <p class="panel-kicker">Fotos anexadas</p>
              <strong id="eventoMortePhotoCounter">Nenhuma foto anexada.</strong>
            </div>
          </div>
          <div class="movement-photo-grid" id="eventoMortePhotoPreview"></div>
        </div>
      </div>
      <div class="modal-actions">
        <button type="submit" class="action-btn death">Registrar morte</button>
      </div>
    </form>
  </dialog>
`);

/* ── Preenchimento dos selects ───────────────────────────────────── */

function populateEventoFarmSelect(select, defaultFarmId) {
  select.innerHTML = getAllFarms().map((farm) => `<option value="${farm.id}">${escapeHtml(farm.name)}</option>`).join("");
  select.value = defaultFarmId;
}

function getEventoCategoriesForSpecies(farm, species) {
  if (species === "ovino" && Array.isArray(farm?.ovinos)) {
    return farm.ovinos.map(entry => ({
      id: entry.categoryId,
      name: entry.categoryName,
      quantity: entry.quantity
    }));
  }
  return farm.categories;
}

function populateEventoCategorySelect(select, farm, species = "bovino") {
  const categories = getEventoCategoriesForSpecies(farm, species);
  select.innerHTML = categories
    .map((cat) => `<option value="${cat.id}">${escapeHtml(cat.name)} (${formatInteger(cat.quantity)} em estoque)</option>`)
    .join("");
}

function populateEventoPotreiroSelect(select, farm) {
  const options = [`<option value="${UNALLOCATED_POTREIRO_KEY}">Sem campo / não alocado</option>`]
    .concat(getPotreroEntries(farm).map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`));
  select.innerHTML = options.join("");
}

function updateEventoStockHint(hintEl, farm, categoryId, species = "bovino") {
  const categories = getEventoCategoriesForSpecies(farm, species);
  const category = categories.find((c) => c.id === categoryId);
  hintEl.textContent = category ? `Estoque atual da categoria: ${formatInteger(category.quantity)} cabeças.` : "";
}

/* ── Abrir diálogos ───────────────────────────────────────────────── */

function openEventoConsumoDialog() {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const defaultFarm = isTotalView ? getAllFarms()[0] : getFarm();
  if (!defaultFarm) return;

  const farmSelect = document.getElementById("eventoConsumoFarm");
  const speciesSelect = document.getElementById("eventoConsumoSpecies");
  const categorySelect = document.getElementById("eventoConsumoCategory");
  const potreiroSelect = document.getElementById("eventoConsumoPotreiro");
  const hint = document.getElementById("eventoConsumoStockHint");

  populateEventoFarmSelect(farmSelect, defaultFarm.id);
  runtime.eventoSelectedSpecies.consumo = "bovino";

  const refresh = () => {
    const farm = state.data.farms[farmSelect.value];
    const species = speciesSelect.value;
    runtime.eventoSelectedSpecies.consumo = species;
    populateEventoCategorySelect(categorySelect, farm, species);
    populateEventoPotreiroSelect(potreiroSelect, farm);
    updateEventoStockHint(hint, farm, categorySelect.value, species);
  };
  farmSelect.onchange = refresh;
  speciesSelect.onchange = refresh;
  categorySelect.onchange = () => updateEventoStockHint(hint, state.data.farms[farmSelect.value], categorySelect.value, speciesSelect.value);
  refresh();

  document.getElementById("eventoConsumoDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("eventoConsumoQuantity").value = "";
  document.getElementById("eventoConsumoNotes").value = "";

  document.getElementById("eventoConsumoDialog").showModal();
}

function openEventoMorteDialog() {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const defaultFarm = isTotalView ? getAllFarms()[0] : getFarm();
  if (!defaultFarm) return;

  const farmSelect = document.getElementById("eventoMorteFarm");
  const speciesSelect = document.getElementById("eventoMorteSpecies");
  const categorySelect = document.getElementById("eventoMorteCategory");
  const potreiroSelect = document.getElementById("eventoMortePotreiro");
  const hint = document.getElementById("eventoMorteStockHint");
  const causeSelect = document.getElementById("eventoMorteCause");
  const customCauseWrap = document.getElementById("eventoMorteCustomCauseWrap");

  populateEventoFarmSelect(farmSelect, defaultFarm.id);
  runtime.eventoSelectedSpecies.morte = "bovino";

  const refresh = () => {
    const farm = state.data.farms[farmSelect.value];
    const species = speciesSelect.value;
    runtime.eventoSelectedSpecies.morte = species;
    populateEventoCategorySelect(categorySelect, farm, species);
    populateEventoPotreiroSelect(potreiroSelect, farm);
    updateEventoStockHint(hint, farm, categorySelect.value, species);
  };
  farmSelect.onchange = refresh;
  speciesSelect.onchange = refresh;
  categorySelect.onchange = () => updateEventoStockHint(hint, state.data.farms[farmSelect.value], categorySelect.value, speciesSelect.value);

  causeSelect.innerHTML = MOVEMENT_DEATH_CAUSES.map((c) => `<option value="${c.value}">${escapeHtml(c.label)}</option>`).join("");
  causeSelect.value = MOVEMENT_DEATH_CAUSES[0].value;
  causeSelect.onchange = () => {
    customCauseWrap.hidden = causeSelect.value !== "outra";
  };
  customCauseWrap.hidden = true;
  document.getElementById("eventoMorteCustomCause").value = "";

  const refresh = () => {
    const farm = state.data.farms[farmSelect.value];
    populateEventoCategorySelect(categorySelect, farm);
    populateEventoPotreiroSelect(potreiroSelect, farm);
    updateEventoStockHint(hint, farm, categorySelect.value);
  };
  farmSelect.onchange = refresh;
  categorySelect.onchange = () => updateEventoStockHint(hint, state.data.farms[farmSelect.value], categorySelect.value);
  refresh();

  document.getElementById("eventoMorteDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("eventoMorteQuantity").value = "";
  document.getElementById("eventoMorteNotes").value = "";

  runtime.eventoMortePhotoDrafts = [];
  document.getElementById("eventoMortePhotos").value = "";
  renderEventoMortePhotoDrafts();

  document.getElementById("eventoMorteDialog").showModal();
}

/* ── Fotos do registro de morte ──────────────────────────────────── */

function renderEventoMortePhotoDrafts() {
  const drafts = runtime.eventoMortePhotoDrafts;
  const panel = document.getElementById("eventoMortePhotoPanel");
  const counter = document.getElementById("eventoMortePhotoCounter");
  const preview = document.getElementById("eventoMortePhotoPreview");
  const count = drafts.length;

  panel.hidden = !count;
  counter.textContent = count
    ? `${formatInteger(count)} ${count === 1 ? "foto anexada" : "fotos anexadas"}`
    : "Nenhuma foto anexada.";

  if (!count) {
    preview.innerHTML = "";
    return;
  }

  preview.innerHTML = drafts.map((photo, index) => `
    <article class="movement-photo-card">
      <img src="${photo.dataUrl}" alt="${escapeHtml(photo.name || `Foto ${index + 1}`)}">
      <div class="movement-photo-meta">
        <strong>${escapeHtml(photo.name || `Foto ${index + 1}`)}</strong>
        <span>${formatInteger(index + 1)} de ${formatInteger(count)}</span>
      </div>
      <button type="button" class="ghost-btn movement-photo-remove" data-remove-evento-morte-photo="${escapeHtml(photo.id)}">Remover</button>
    </article>
  `).join("");
}

async function handleEventoMortePhotosChange(event) {
  const files = [...(event.target.files || [])];
  if (!files.length) return;

  const availableSlots = Math.max(0, MOVEMENT_DEATH_PHOTO_MAX - runtime.eventoMortePhotoDrafts.length);
  if (availableSlots === 0) {
    alert(`Cada registro de morte aceita até ${MOVEMENT_DEATH_PHOTO_MAX} fotos.`);
    event.target.value = "";
    return;
  }

  const nextFiles = files.slice(0, availableSlots);
  if (files.length > availableSlots) {
    alert(`Foram consideradas apenas ${availableSlots} foto(s) para manter o limite de ${MOVEMENT_DEATH_PHOTO_MAX} por registro.`);
  }

  for (const file of nextFiles) {
    if (!String(file.type || "").startsWith("image/")) continue;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      runtime.eventoMortePhotoDrafts.push({
        id: createMovementId(),
        name: file.name || `foto-${Date.now()}.jpg`,
        caption: "",
        mimeType: file.type || "image/jpeg",
        dataUrl,
      });
    } catch (error) {
      console.warn("Não foi possível carregar a foto.", error);
      alert(`Falha ao carregar a foto "${file.name}".`);
    }
  }

  event.target.value = "";
  renderEventoMortePhotoDrafts();
}

function handleEventoMortePhotoPreviewClick(event) {
  const trigger = event.target.closest("[data-remove-evento-morte-photo]");
  if (!trigger) return;
  runtime.eventoMortePhotoDrafts = runtime.eventoMortePhotoDrafts.filter((photo) => photo.id !== trigger.dataset.removeEventoMortePhoto);
  renderEventoMortePhotoDrafts();
}

/* ── Submissão dos formulários ───────────────────────────────────── */

function handleEventoConsumoSubmit(event) {
  event.preventDefault();

  const farm = state.data.farms[document.getElementById("eventoConsumoFarm").value];
  const species = document.getElementById("eventoConsumoSpecies").value || "bovino";
  const categoryId = document.getElementById("eventoConsumoCategory").value;
  const potreiroId = document.getElementById("eventoConsumoPotreiro").value;
  const date = document.getElementById("eventoConsumoDate").value;
  const qty = Math.round(Number(document.getElementById("eventoConsumoQuantity").value) || 0);
  const notes = document.getElementById("eventoConsumoNotes").value.trim();

  if (!farm) return;
  
  let category;
  if (species === "ovino") {
    const ovinoEntry = farm.ovinos?.find((o) => o.categoryId === categoryId);
    if (!ovinoEntry) return;
    category = { id: ovinoEntry.categoryId, name: ovinoEntry.categoryName, quantity: ovinoEntry.quantity, allocation: {} };
  } else {
    category = farm.categories.find((c) => c.id === categoryId);
  }
  
  if (!category) return;
  if (!date) {
    alert("Informe a data do registro.");
    return;
  }
  if (qty < 1) {
    alert("Informe uma quantidade válida.");
    return;
  }

  if (species === "bovino") {
    ensureCategoryAllocation(category);
    if (qty > category.quantity) {
      alert(`Quantidade maior que o estoque disponível (${formatInteger(category.quantity)} cabeças).`);
      return;
    }
    category.quantity -= qty;
    category.allocation[potreiroId] = Math.max(0, Number(category.allocation[potreiroId] || 0) - qty);
    updatePotreroQuantitiesFromAllocation(farm);
  } else {
    // Ovinos
    if (qty > category.quantity) {
      alert(`Quantidade maior que o estoque disponível (${formatInteger(category.quantity)} cabeças).`);
      return;
    }
    const ovinoEntry = farm.ovinos.find((o) => o.categoryId === categoryId);
    if (ovinoEntry) {
      ovinoEntry.quantity -= qty;
    }
  }

  farm.movements.push({
    id: createMovementId(),
    code: generateMovementCode(farm),
    type: "consumo",
    especie: species,
    date,
    categoryId: category.id,
    categoryName: category.name,
    quantity: qty,
    delta: -qty,
    value: 0,
    saleDetails: null,
    notes,
    potreiro: potreiroId,
    sourceId: "",
    photos: [],
  });

  saveData();
  populateYearFilter();
  document.getElementById("eventoConsumoDialog").close();
  render();
}

function handleEventoMorteSubmit(event) {
  event.preventDefault();

  const farm = state.data.farms[document.getElementById("eventoMorteFarm").value];
  const species = document.getElementById("eventoMorteSpecies").value || "bovino";
  const categoryId = document.getElementById("eventoMorteCategory").value;
  const potreiroId = document.getElementById("eventoMortePotreiro").value;
  const date = document.getElementById("eventoMorteDate").value;
  const qty = Math.round(Number(document.getElementById("eventoMorteQuantity").value) || 0);
  const cause = document.getElementById("eventoMorteCause").value;
  const customCause = document.getElementById("eventoMorteCustomCause").value.trim();
  const notes = document.getElementById("eventoMorteNotes").value.trim();

  if (!farm) return;
  
  let category;
  if (species === "ovino") {
    const ovinoEntry = farm.ovinos?.find((o) => o.categoryId === categoryId);
    if (!ovinoEntry) return;
    category = { id: ovinoEntry.categoryId, name: ovinoEntry.categoryName, quantity: ovinoEntry.quantity, allocation: {} };
  } else {
    category = farm.categories.find((c) => c.id === categoryId);
  }
  
  if (!category) return;
  if (!date) {
    alert("Informe a data do registro.");
    return;
  }
  if (qty < 1) {
    alert("Informe uma quantidade válida.");
    return;
  }
  if (cause === "outra" && !customCause) {
    alert("Especifique a causa provável da morte.");
    return;
  }

  if (species === "bovino") {
    ensureCategoryAllocation(category);
    if (qty > category.quantity) {
      alert(`Quantidade maior que o estoque disponível (${formatInteger(category.quantity)} cabeças).`);
      return;
    }
    category.quantity -= qty;
    category.allocation[potreiroId] = Math.max(0, Number(category.allocation[potreiroId] || 0) - qty);
    updatePotreroQuantitiesFromAllocation(farm);
  } else {
    // Ovinos
    if (qty > category.quantity) {
      alert(`Quantidade maior que o estoque disponível (${formatInteger(category.quantity)} cabeças).`);
      return;
    }
    const ovinoEntry = farm.ovinos.find((o) => o.categoryId === categoryId);
    if (ovinoEntry) {
      ovinoEntry.quantity -= qty;
    }
  }

  farm.movements.push({
    id: createMovementId(),
    code: generateMovementCode(farm),
    type: "morte",
    especie: species,
    date,
    categoryId: category.id,
    categoryName: category.name,
    quantity: qty,
    delta: -qty,
    value: 0,
    saleDetails: null,
    notes,
    potreiro: potreiroId,
    sourceId: "",
    cause,
    customCause: cause === "outra" ? customCause : "",
    photos: runtime.eventoMortePhotoDrafts.map((photo) => ({ ...photo })),
  });

  saveData();
  populateYearFilter();
  runtime.eventoMortePhotoDrafts = [];
  document.getElementById("eventoMortePhotos").value = "";
  document.getElementById("eventoMorteDialog").close();
  render();
}

document.getElementById("closeEventoConsumoDialog").addEventListener("click", () => document.getElementById("eventoConsumoDialog").close());
document.getElementById("eventoConsumoForm").addEventListener("submit", handleEventoConsumoSubmit);

document.getElementById("closeEventoMorteDialog").addEventListener("click", () => document.getElementById("eventoMorteDialog").close());
document.getElementById("eventoMorteForm").addEventListener("submit", handleEventoMorteSubmit);
document.getElementById("eventoMortePhotos").addEventListener("change", handleEventoMortePhotosChange);
document.getElementById("eventoMortePhotoPreview").addEventListener("click", handleEventoMortePhotoPreviewClick);

/* ── PDF: fatos importantes do período ───────────────────────────── */

function appendEventosHighlightsPdfSection(doc, farm, year, month) {
  const records = (farm.movements || [])
    .filter((m) => (m.type === "morte" || m.type === "consumo") && movementMatchesPeriod(m, year, month))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  appendPdfSectionTitle(doc, "Fatos Importantes do Período — Mortes e Abate/Consumo");

  const body = records.length
    ? records.map((m) => [
        formatDate(m.date),
        capitalize(m.type),
        m.categoryName || "-",
        formatInteger(m.quantity),
        getEventoPotreiroLabel(farm.id, m.potreiro),
        m.type === "morte" ? ([getMovementCauseLabel(m), m.notes].filter(Boolean).join(" — ") || "-") : (m.notes || "-"),
        formatMovementPhotoCount(m),
      ])
    : [[{ content: "Sem registros de morte ou abate/consumo no período.", colSpan: 7, styles: { halign: "center", textColor: [120, 120, 120] } }]];

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Data", "Tipo", "Categoria", "Qtd", "Campo", "Causa / Observação", "Fotos"]],
    body,
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    styles: { fontSize: 8 },
  });

  const insights = getOperationalInsights(farm, year, month);
  const healthInsight = insights.find((i) => i.tag === "Saude do manejo");
  if (healthInsight) {
    appendInsightsPdfTable(doc, [{ tag: "Saúde do rebanho", text: `${healthInsight.title} — ${healthInsight.text}` }]);
  }
}

const brunaOriginalAppendFarmPdfSectionForEventos = appendFarmPdfSection;
appendFarmPdfSection = async function (doc, farm, periodLabel, year, month) {
  await brunaOriginalAppendFarmPdfSectionForEventos(doc, farm, periodLabel, year, month);
  appendEventosHighlightsPdfSection(doc, farm, year, month);
};
