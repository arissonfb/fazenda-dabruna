/* ════════════════════════════════════════════════════════════════════
   Fazendas Da Bruna — extras da demonstração
   Carregado depois de app.js / __commercial_new.js.
   Reaproveita as globais já existentes: state, runtime, elements,
   saveData, render, formatInteger, formatCurrency, escapeHtml,
   getAllFarms, isAdmin, isAuthenticated, renderAuthState,
   initializeAppShell, startAuditSession, logAuditEvent.
   ════════════════════════════════════════════════════════════════════ */

/* ── Credenciais locais da demonstração ──────────────────────────── */
const BRUNA_CREDENTIALS = {
  admin: { password: "bruna2026", role: "admin", userId: "admin-bruna" },
  demo: { password: "fazenda2026", role: "usuario", userId: "user-bruna" }
};

/* ── Validade da demonstração (5 dias) ───────────────────────────── */
const DEMO_EXPIRES_AT = new Date("2026-06-16T23:59:59-03:00").getTime();
const DEMO_CONTACT_WHATSAPP = "https://wa.me/5551997111561";

function isDemoExpired() {
  return Date.now() > DEMO_EXPIRES_AT;
}

function getDemoDaysLeft() {
  return Math.max(0, Math.ceil((DEMO_EXPIRES_AT - Date.now()) / 86400000));
}

function showDemoExpiredScreen() {
  if (document.getElementById("demoExpiredShell")) return;
  if (elements.splashShell) elements.splashShell.hidden = true;
  if (elements.authShell) elements.authShell.hidden = true;
  if (elements.pageShell) elements.pageShell.hidden = true;
  document.body.insertAdjacentHTML("beforeend", `
    <div class="demo-expired-shell" id="demoExpiredShell">
      <div class="demo-expired-card">
        <img src="./assets/logo-da-bruna.svg" alt="Fazendas Da Bruna" />
        <h1>Período de demonstração encerrado</h1>
        <p>O acesso de demonstração ao Painel Pecuário Da Bruna expirou.</p>
        <p>Entre em contato para liberar o acesso completo ou agendar uma nova apresentação.</p>
        <a class="whatsapp-cta" href="${DEMO_CONTACT_WHATSAPP}" target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
      </div>
    </div>
  `);
}

function renderDemoTrialBanner() {
  if (isDemoExpired()) return;
  const daysLeft = getDemoDaysLeft();
  const expiresLabel = new Date(DEMO_EXPIRES_AT).toLocaleDateString("pt-BR");
  let banner = document.getElementById("demoTrialBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "demoTrialBanner";
    banner.className = "demo-trial-banner";
    const pageShell = document.querySelector(".page-shell");
    (pageShell || document.body).insertAdjacentElement("afterbegin", banner);
  }
  banner.classList.toggle("demo-trial-warn", daysLeft <= 1);
  const dayWord = daysLeft === 1 ? "dia" : "dias";
  banner.innerHTML = `Versão de demonstração — válida até <strong>${expiresLabel}</strong> (${daysLeft} ${dayWord} restantes)`;
}

/* ── Login local (sem backend) ───────────────────────────────────── */
document.addEventListener("submit", function (event) {
  if (event.target !== elements.loginForm) return;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (isDemoExpired()) {
    showDemoExpiredScreen();
    return;
  }

  const login = elements.loginUsername.value.trim().toLowerCase();
  const password = elements.loginPassword.value;
  const credential = BRUNA_CREDENTIALS[login];

  elements.loginFeedback.hidden = true;
  elements.loginFeedback.textContent = "";

  if (!credential || credential.password !== password) {
    elements.loginFeedback.hidden = false;
    elements.loginFeedback.textContent = "Login ou senha incorretos. Tente novamente.";
    return;
  }

  if (credential.role !== runtime.authLoginMode) {
    elements.loginFeedback.hidden = false;
    elements.loginFeedback.textContent = runtime.authLoginMode === "admin"
      ? "Este login não possui perfil de Administrador."
      : "Este login não possui perfil de Usuário padrão.";
    return;
  }

  const user = state.data.auth.users.find((u) => u.id === credential.userId);
  if (!user) {
    elements.loginFeedback.hidden = false;
    elements.loginFeedback.textContent = "Usuário não encontrado nesta demonstração.";
    return;
  }

  runtime.cloudToken = null;
  runtime.cloudConflict = false;
  runtime.cloudRevision = 0;
  state.data.auth.sessionUserId = user.id;
  elements.loginForm.reset();
  startAuditSession();
  logAuditEvent("Login", "auth", "Entrada no sistema (demonstração)");
  saveData({ skipCloud: true });
  renderAuthState();
  initializeAppShell();
  render();
  renderDemoTrialBanner();
}, true);

/* Verificação no carregamento da página */
if (isDemoExpired()) {
  showDemoExpiredScreen();
} else if (isAuthenticated()) {
  renderDemoTrialBanner();
}

/* ── Renomear fazenda ─────────────────────────────────────────────── */
const BRUNA_PENCIL_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`;

document.body.insertAdjacentHTML("beforeend", `
  <dialog id="farmRenameDialog" class="modal">
    <form class="modal-card" id="farmRenameForm">
      <div class="modal-header">
        <div>
          <p class="panel-kicker">Fazenda</p>
          <h2>Renomear fazenda</h2>
        </div>
        <button type="button" class="ghost-btn" id="closeFarmRenameDialog">Fechar</button>
      </div>
      <div class="form-grid">
        <label class="span-2">
          Nome da fazenda
          <input type="text" id="farmRenameInput" maxlength="60" required />
        </label>
        <div class="form-actions">
          <button type="button" class="ghost-btn" id="cancelFarmRename">Cancelar</button>
          <button type="submit" class="action-btn purchase">Salvar</button>
        </div>
      </div>
    </form>
  </dialog>
`);

let brunaFarmRenameTargetId = null;

function openFarmRenameDialog(farm) {
  brunaFarmRenameTargetId = farm.id;
  document.getElementById("farmRenameInput").value = farm.name;
  document.getElementById("farmRenameDialog").showModal();
}

document.getElementById("farmRenameForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("farmRenameInput");
  const newName = input.value.trim();
  if (newName && brunaFarmRenameTargetId && state.data.farms[brunaFarmRenameTargetId]) {
    state.data.farms[brunaFarmRenameTargetId].name = newName;
    saveData();
    render();
  }
  document.getElementById("farmRenameDialog").close();
});
document.getElementById("cancelFarmRename").addEventListener("click", () => document.getElementById("farmRenameDialog").close());
document.getElementById("closeFarmRenameDialog").addEventListener("click", () => document.getElementById("farmRenameDialog").close());

const brunaOriginalRenderFarmSwitch = renderFarmSwitch;
renderFarmSwitch = function () {
  brunaOriginalRenderFarmSwitch();
  const farms = getAllFarms();
  const buttons = Array.from(elements.farmSwitch.children);
  farms.forEach((farm, index) => {
    const button = buttons[index + 1];
    if (!button) return;
    const row = document.createElement("div");
    row.className = "farm-switch-row";
    button.replaceWith(row);
    row.appendChild(button);
    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "farm-rename-btn";
    renameBtn.title = `Renomear ${farm.name}`;
    renameBtn.innerHTML = BRUNA_PENCIL_ICON;
    renameBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openFarmRenameDialog(farm);
    });
    row.appendChild(renameBtn);
  });
};

/* ── Rebanho Ovino ────────────────────────────────────────────────── */
const OVINO_CATEGORIES = [
  { id: "cordeiro", name: "Cordeiro" },
  { id: "borrego", name: "Borrego" },
  { id: "ovelha", name: "Ovelha" },
  { id: "carneiro", name: "Carneiro" }
];

const OVINO_BREED_TYPES = ["Corriedale", "Ideal", "Merino", "Texel", "Outra"];

function getOvinoEntries(farm) {
  return Array.isArray(farm?.ovinos) ? farm.ovinos : [];
}

function getAllOvinoEntries() {
  return getAllFarms().flatMap((farm) =>
    getOvinoEntries(farm).map((entry) => ({ ...entry, farmId: farm.id, farmName: farm.name }))
  );
}

(function injectOvinoSection() {
  const globalPanel = document.querySelector(".global-panel");
  if (globalPanel && !document.getElementById("ovinoSection")) {
    globalPanel.insertAdjacentHTML("beforeend", `<section class="ovino-section" id="ovinoSection"></section>`);
  }
})();

document.body.insertAdjacentHTML("beforeend", `
  <dialog id="ovinoEditDialog" class="modal">
    <div class="modal-card modal-card-wide">
      <div class="modal-header">
        <div>
          <p class="panel-kicker" id="ovinoEditFarmLabel">Fazenda</p>
          <h2>Editar Rebanho Ovino</h2>
        </div>
        <button type="button" class="ghost-btn" id="closeOvinoEditDialog">Fechar</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Categoria</th><th>Raça</th><th>Raça (outra)</th><th>Quantidade</th><th></th></tr>
          </thead>
          <tbody id="ovinoEditRows"></tbody>
        </table>
      </div>
      <div class="form-actions spread">
        <button type="button" class="ghost-btn" id="addOvinoRowBtn">+ Adicionar grupo</button>
        <div class="form-actions">
          <button type="button" class="ghost-btn" id="cancelOvinoEdit">Cancelar</button>
          <button type="button" class="action-btn purchase" id="saveOvinoEditBtn">Salvar</button>
        </div>
      </div>
    </div>
  </dialog>
`);

let brunaOvinoEditFarmId = null;

function addOvinoEditRow(entry = null) {
  const tbody = document.getElementById("ovinoEditRows");
  const tr = document.createElement("tr");
  tr.className = "ovino-edit-row";
  const categoryOptions = OVINO_CATEGORIES.map((cat) =>
    `<option value="${cat.id}" ${entry?.categoryId === cat.id ? "selected" : ""}>${escapeHtml(cat.name)}</option>`
  ).join("");
  const breedOptions = OVINO_BREED_TYPES.map((breed) =>
    `<option value="${breed}" ${entry?.breedType === breed ? "selected" : ""}>${escapeHtml(breed)}</option>`
  ).join("");
  tr.innerHTML = `
    <td><select class="ovino-row-category">${categoryOptions}</select></td>
    <td><select class="ovino-row-breed">${breedOptions}</select></td>
    <td><input type="text" class="ovino-row-breed-other" maxlength="40" placeholder="Ex: Dorper" value="${escapeHtml(entry?.breedOther || "")}" ${entry?.breedType === "Outra" ? "" : "hidden"} /></td>
    <td><input type="number" class="ovino-row-quantity" min="0" step="1" value="${Number(entry?.quantity || 0)}" /></td>
    <td><button type="button" class="row-action-btn danger ovino-remove-row">Remover</button></td>
  `;
  const breedSelect = tr.querySelector(".ovino-row-breed");
  const breedOtherInput = tr.querySelector(".ovino-row-breed-other");
  breedSelect.addEventListener("change", () => {
    breedOtherInput.hidden = breedSelect.value !== "Outra";
  });
  tr.querySelector(".ovino-remove-row").addEventListener("click", () => tr.remove());
  tbody.appendChild(tr);
}

function openOvinoEditDialog(farm) {
  if (!farm) return;
  brunaOvinoEditFarmId = farm.id;
  document.getElementById("ovinoEditFarmLabel").textContent = farm.name;
  const tbody = document.getElementById("ovinoEditRows");
  tbody.innerHTML = "";
  const entries = getOvinoEntries(farm);
  if (entries.length === 0) {
    addOvinoEditRow();
  } else {
    entries.forEach((entry) => addOvinoEditRow(entry));
  }
  document.getElementById("ovinoEditDialog").showModal();
}

document.getElementById("addOvinoRowBtn").addEventListener("click", () => addOvinoEditRow());
document.getElementById("cancelOvinoEdit").addEventListener("click", () => document.getElementById("ovinoEditDialog").close());
document.getElementById("closeOvinoEditDialog").addEventListener("click", () => document.getElementById("ovinoEditDialog").close());

document.getElementById("saveOvinoEditBtn").addEventListener("click", () => {
  const farm = state.data.farms[brunaOvinoEditFarmId];
  if (!farm) return;
  const rows = Array.from(document.querySelectorAll("#ovinoEditRows tr"));
  const entries = rows.map((row, index) => {
    const categoryId = row.querySelector(".ovino-row-category").value;
    const category = OVINO_CATEGORIES.find((c) => c.id === categoryId);
    const breedType = row.querySelector(".ovino-row-breed").value;
    const breedOther = row.querySelector(".ovino-row-breed-other").value.trim();
    const quantity = Math.max(0, Math.round(Number(row.querySelector(".ovino-row-quantity").value) || 0));
    return {
      id: `ovino-${farm.id}-${categoryId}-${breedType.toLowerCase()}-${index}`,
      categoryId,
      categoryName: category ? category.name : categoryId,
      breedType,
      breedOther: breedType === "Outra" ? breedOther : "",
      quantity
    };
  }).filter((entry) => entry.quantity > 0);

  farm.ovinos = entries;
  saveData();
  render();
  document.getElementById("ovinoEditDialog").close();
});

function renderOvinoSection() {
  const section = document.getElementById("ovinoSection");
  if (!section) return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farm = state.data.farms[state.data.selectedFarmId];
  const entries = isTotalView ? getAllOvinoEntries() : getOvinoEntries(farm);
  const farmLabel = isTotalView ? "do grupo" : `de ${farm?.name || "fazenda"}`;

  const totalsByCategory = {};
  OVINO_CATEGORIES.forEach((cat) => { totalsByCategory[cat.id] = 0; });
  let grandTotal = 0;
  entries.forEach((entry) => {
    const qty = Number(entry.quantity || 0);
    totalsByCategory[entry.categoryId] = (totalsByCategory[entry.categoryId] || 0) + qty;
    grandTotal += qty;
  });

  const cardsHtml = [
    `<article class="ovino-card">
      <p class="panel-kicker">Total de ovinos</p>
      <strong>${formatInteger(grandTotal)}</strong>
      <p>rebanho ovino ${farmLabel}</p>
    </article>`,
    ...OVINO_CATEGORIES.map((cat) => `
      <article class="ovino-card">
        <p class="panel-kicker">${escapeHtml(cat.name)}</p>
        <strong>${formatInteger(totalsByCategory[cat.id] || 0)}</strong>
        <p>cabeças</p>
      </article>
    `)
  ].join("");

  const matrix = {};
  OVINO_CATEGORIES.forEach((cat) => {
    matrix[cat.id] = {};
    OVINO_BREED_TYPES.forEach((breed) => { matrix[cat.id][breed] = 0; });
  });
  entries.forEach((entry) => {
    const breed = OVINO_BREED_TYPES.includes(entry.breedType) ? entry.breedType : "Outra";
    if (!matrix[entry.categoryId]) return;
    matrix[entry.categoryId][breed] = (matrix[entry.categoryId][breed] || 0) + Number(entry.quantity || 0);
  });

  const tableRows = OVINO_CATEGORIES.map((cat) => {
    const rowTotal = OVINO_BREED_TYPES.reduce((sum, breed) => sum + matrix[cat.id][breed], 0);
    return `
      <tr>
        <td>${escapeHtml(cat.name)}</td>
        ${OVINO_BREED_TYPES.map((breed) => `<td>${formatInteger(matrix[cat.id][breed])}</td>`).join("")}
        <td><strong>${formatInteger(rowTotal)}</strong></td>
      </tr>
    `;
  }).join("");

  const totalsRow = `
    <tr>
      <td><strong>Total</strong></td>
      ${OVINO_BREED_TYPES.map((breed) => {
        const colTotal = OVINO_CATEGORIES.reduce((sum, cat) => sum + matrix[cat.id][breed], 0);
        return `<td><strong>${formatInteger(colTotal)}</strong></td>`;
      }).join("")}
      <td><strong>${formatInteger(grandTotal)}</strong></td>
    </tr>
  `;

  section.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="panel-kicker">Rebanho complementar</p>
        <h2>Rebanho Ovino</h2>
      </div>
      ${isAdmin() && !isTotalView ? `<button type="button" class="ghost-btn" id="editOvinoBtn">Editar rebanho ovino</button>` : ""}
    </div>
    <div class="ovino-summary-grid">${cardsHtml}</div>
    <div class="table-wrap ovino-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            ${OVINO_BREED_TYPES.map((breed) => `<th>${escapeHtml(breed)}</th>`).join("")}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${tableRows}${totalsRow}</tbody>
      </table>
    </div>
  `;

  const editBtn = document.getElementById("editOvinoBtn");
  if (editBtn) editBtn.addEventListener("click", () => openOvinoEditDialog(farm));
}

const brunaOriginalRenderOverviewPanel = renderOverviewPanel;
renderOverviewPanel = function () {
  brunaOriginalRenderOverviewPanel();
  renderOvinoSection();
};
