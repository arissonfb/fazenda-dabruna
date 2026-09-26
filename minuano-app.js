/* ═══════════════════════════════════════════════════════════════
   Minuano IA — integracao com este painel pecuario
   Botao flutuante + chat, voz, clima por cidade e registros por conversa
   (o formulario do sistema abre preenchido; o usuario revisa e salva).
   Usa minuano-ai.js (carregar antes) e a rota /api/minuano do servidor.
   Guia: docs/MINUANO-IA.md
   ═══════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const SYSTEM_NAME = "Wolf Pecuária";
  const STORE_KEY = "wolf_minuano_ai";

  if (!window.MinuanoAI) return;
  if (!window.I18N) window.I18N = { lang: localStorage.getItem(`${STORE_KEY}_lang`) === "es" ? "es" : "pt" };
  const L = (pt, es) => (window.I18N.lang === "es" ? es : pt);
  const AI = window.MinuanoAI;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,;:]/g, " ").replace(/\s+/g, " ").trim();
  const todayIso = () => new Date().toISOString().slice(0, 10);

  /* globais do app.js (script classico) */
  const G = {
    state: () => (typeof state !== "undefined" ? state : null),
    farms: () => { try { return Object.values(state.data.farms || {}); } catch (e) { return []; } },
    token: () => { try { return runtime.cloudToken || ""; } catch (e) { return ""; } },
    apiUrl: () => { try { return API_URL; } catch (e) { return ""; } }
  };

  /* ───── conexao: rota do servidor com o token do login ───── */
  AI.configure({
    storeKey: STORE_KEY,
    proxyUrl: G.apiUrl() ? `${G.apiUrl()}/api/minuano` : "",
    proxyHeaders: () => (G.token() ? { Authorization: `Bearer ${G.token()}` } : {}),
    systemPrompt: (lang) => [
      `Você é o Minuano, assessor do painel pecuário "${SYSTEM_NAME}", usado por produtores e capatazes no sul do Brasil e no Uruguai. Foco: rebanho por categoria e por potreiro, movimentações (compra, venda, nascimento, morte, consumo/abate, transferência), sanidade, reprodução, compras e vendas.`,
      "Personalidade: gaúcho/rioplatense, cordial, direto e prático. Fala como um colega de campo experiente.",
      `Idioma: responda SEMPRE no idioma do usuário (português do Brasil ou espanhol rioplatense). Se não der para saber, use ${lang === "es" ? "espanhol" : "português"}.`,
      "Dados: a primeira mensagem traz um JSON com os dados do sistema. Use SOMENTE esses dados para números; nunca invente. Se faltar dado, diga o que registrar.",
      "Clima: quando vier um bloco <previsao_do_tempo>, ele foi buscado agora (Open-Meteo) para o local citado; use-o citando local e dias. Sem esse bloco, você não tem clima — peça a cidade.",
      "Pode usar conhecimento geral de pecuária e sanidade, deixando claro que é orientação geral.",
      "Formato: respostas curtas (até ~180 palavras), **negrito** nos números-chave, listas com '-'. Sem tabelas e sem títulos com #.",
      `Hoje: ${todayIso()}.`
    ].join("\n"),
    recordsPrompt: [
      "Registros: quando o usuário pedir para registrar/lançar algo ou relatar um fato de campo (ex.: 'no potreiro X nasceram 4 terneiros', 'abatemos uma vaca', 'dosificamos 25 vacas de cria com ivermectina'), NUNCA diga que registrou. Responda com 1 frase curta do que entendeu e, no final, um bloco por registro exatamente assim:",
      "```registro\n{json}\n```",
      "O sistema abre o formulário preenchido para o usuário revisar e salvar. Use os nomes EXATOS de fazendas, categorias, potreiros e produtos que estão nos dados. Se faltar algo essencial (categoria, quantidade ou fazenda quando houver mais de uma e não der para deduzir), pergunte antes e não gere o bloco. Data padrão: hoje (AAAA-MM-DD).",
      "Esquemas (campos vazios podem ser omitidos):",
      "- Movimento: {\"tipo\":\"movimiento\",\"movimiento\":\"nascimento|compra|venda|consumo|morte|transferencia|ajuste\",\"establecimiento\":\"<fazenda>\",\"categoria\":\"\",\"cantidad\":0,\"fecha\":\"\",\"potrero\":\"\",\"valor\":0,\"comprador\":\"\",\"destino\":\"<fazenda destino>\",\"direccion\":\"sumar|restar\",\"notas\":\"\"} (abate, carneada, faena = consumo; nasceram/nacieron = nascimento)",
      "Exclusões: só quando o usuário pedir claramente para excluir/apagar/cancelar/desfazer um registro. Identifique UM registro pelo código entre colchetes nos dados (ex.: [A-0012]). Se a descrição servir para mais de um, liste os candidatos com código, data e quantidade e pergunte qual; não gere bloco. Nunca exclua em massa (no máximo 1 bloco de exclusão por resposta) e nunca diga que excluiu: o sistema mostra o registro real e pede confirmação. Antes do bloco, diga em 1 frase qual registro será excluído e o efeito (movimentações revertem o estoque). Bloco: {\"tipo\":\"excluir\",\"registro\":\"movimiento|sanidad|reproduccion\",\"codigo\":\"<código sem colchetes>\"}",
      "- Sanidade: {\"tipo\":\"sanidad\",\"establecimiento\":\"<fazenda>\",\"categoria\":\"\",\"cantidad\":0,\"producto\":\"\",\"fecha\":\"\",\"potrero\":\"\",\"notas\":\"\"} (dosificação, vacina, vermífugo, banho)"
    ].join("\n")
  });

  /* ───── dados enviados para a IA ───── */
  AI.registerSource("pecuaria", () => {
    const year = new Date().getFullYear();
    const st = G.state();
    return {
      sistema: SYSTEM_NAME,
      fazendaSelecionada: st?.data?.farms?.[st?.data?.selectedFarmId]?.name || "todas",
      fazendas: G.farms().map((farm) => {
        const cats = farm.categories || [];
        const movs = farm.movements || [];
        const byType = {};
        movs.filter((m) => String(m.date || "") >= `${year - 1}-01-01`).forEach((m) => {
          const t = m.type || "outro";
          byType[t] = byType[t] || { registros: 0, animais: 0, valor: 0 };
          byType[t].registros += 1;
          byType[t].animais += num(m.quantity);
          byType[t].valor += Math.round(num(m.value));
        });
        const potrName = (id) => (farm.potreiros || []).find((p) => p.id === id)?.name;
        return {
          fazenda: farm.name,
          totalAnimais: cats.reduce((s, c) => s + num(c.quantity), 0),
          categorias: cats.map((c) => `${c.name}${c.species ? ` (${c.species})` : ""}: ${num(c.quantity)}`),
          potreiros: (farm.potreiros || []).map((p) => {
            const qty = cats.reduce((s, c) => s + num(c.allocation?.[p.id]), 0);
            return `${p.name}: ${qty}`;
          }),
          movimentosDesde: `${year - 1}-01-01`,
          movimentosPorTipo: byType,
          ultimosMovimentos: movs.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 25)
            .map((m) => `[${m.code || m.id}] ${m.date} ${m.type} ${num(m.quantity)} ${m.categoryName || ""}${num(m.value) ? ` valor ${Math.round(num(m.value))}` : ""}`),
          produtosSanitarios: farm.sanitaryProducts || [],
          sanidade: (farm.sanitaryRecords || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 20)
            .map((r) => `[${r.code || r.id}] ${r.date} ${r.product} ${num(r.quantity)} ${r.categoryName || ""}${r.potreiro ? ` (${r.potreiro})` : ""}`),
          reproducao: (farm.reproductionRecords || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 15)
            .map((r) => `[${r.code || r.id}] ${r.date} ${r.type || ""} ${num(r.quantity)} ${r.categoryName || ""}${r.quantityPegou != null ? ` prenhes ${r.quantityPegou}` : ""}`),
          ultimoPotreiroUsado: potrName(movs[movs.length - 1]?.potreiroId) || undefined
        };
      })
    };
  });

  /* ───── interface: botao + painel ───── */
  const FACE = `<svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="mnaSkin" cx="50%" cy="42%" r="60%"><stop offset="0%" stop-color="#f0c39a"/><stop offset="100%" stop-color="#d49a6a"/></radialGradient><linearGradient id="mnaHat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a3322"/><stop offset="100%" stop-color="#2c1d12"/></linearGradient></defs><circle cx="60" cy="60" r="58" fill="#eef4ea"/><path d="M22 118 C26 96 40 88 60 88 C80 88 94 96 98 118 Z" fill="#3d5a3a"/><path d="M44 86 L60 106 L76 86 Z" fill="#b43b2d"/><ellipse cx="33" cy="66" rx="6" ry="9" fill="#d49a6a"/><ellipse cx="87" cy="66" rx="6" ry="9" fill="#d49a6a"/><ellipse cx="60" cy="64" rx="27" ry="30" fill="url(#mnaSkin)"/><ellipse cx="49" cy="61" rx="5.2" ry="5.8" fill="#fff"/><ellipse cx="71" cy="61" rx="5.2" ry="5.8" fill="#fff"/><circle cx="50" cy="62" r="3.1" fill="#2b1a10"/><circle cx="72" cy="62" r="3.1" fill="#2b1a10"/><path d="M42 52 Q49 47 56 51" stroke="#4a2f1d" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M64 51 Q71 47 78 52" stroke="#4a2f1d" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M43 80 Q50 74 60 78 Q70 74 77 80 Q72 86 64 82 Q60 81 56 82 Q48 86 43 80 Z" fill="#4a2f1d"/><path d="M53 86 Q60 91 67 86" stroke="#8a3b2a" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="38" rx="46" ry="8.5" fill="url(#mnaHat)"/><path d="M36 38 C36 22 44 14 60 14 C76 14 84 22 84 38 Z" fill="url(#mnaHat)"/><rect x="36.5" y="31" width="47" height="5" rx="2" fill="#c9a84c"/></svg>`;
  const MIC = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';

  const CSS = `
  .mna-fab{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border:none;border-radius:999px;background:#1f3d2b;color:#fff;font:800 14px/1 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer}
  .mna-fab .mna-face{width:34px;height:34px}
  .mna-face svg{width:100%;height:100%;display:block;border-radius:50%}
  .mna-panel{position:fixed;right:18px;bottom:74px;z-index:2147483001;width:min(400px,calc(100vw - 24px));height:min(600px,calc(100vh - 110px));display:flex;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.28);overflow:hidden;font:14px/1.45 system-ui,sans-serif;color:#1d2521}
  .mna-panel[hidden]{display:none}
  .mna-head{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f3f6f1;border-bottom:1px solid #e3e8e1}
  .mna-head .mna-face{width:38px;height:38px;flex:0 0 38px}
  .mna-head strong{display:block;font-size:15px}
  .mna-head small{display:block;color:#6b756f;font-size:11px}
  .mna-badge{display:inline-flex;align-items:center;gap:4px;margin-top:2px;padding:1px 7px;border-radius:999px;font-size:10.5px;font-weight:700;background:rgba(120,120,120,.12);color:#6b756f}
  .mna-badge::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
  .mna-badge.on{background:rgba(46,125,50,.12);color:#2e7d32}
  .mna-head-actions{margin-left:auto;display:flex;gap:6px}
  .mna-head-actions button{border:1px solid #d7ddd5;background:#fff;border-radius:8px;padding:4px 8px;font-weight:800;font-size:12px;cursor:pointer}
  .mna-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;background:#fbfcfa}
  .mna-row{display:flex;gap:8px;align-items:flex-end}
  .mna-row.user{justify-content:flex-end}
  .mna-row .mna-face{width:28px;height:28px;flex:0 0 28px}
  .mna-msg{max-width:84%;padding:9px 12px;border-radius:12px;background:#fff;border:1px solid #e3e8e1}
  .mna-row.user .mna-msg{background:#1f3d2b;color:#fff;border-color:#1f3d2b}
  .mna-msg p{margin:0}.mna-msg p+p{margin-top:6px}.mna-msg ul{margin:6px 0 0 18px;padding:0}
  .mna-typing{display:inline-flex;gap:4px}.mna-typing span{width:7px;height:7px;border-radius:50%;background:#9aa39d;animation:mnaDot 1s infinite ease-in-out}
  .mna-typing span:nth-child(2){animation-delay:.15s}.mna-typing span:nth-child(3){animation-delay:.3s}
  @keyframes mnaDot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
  .mna-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.mna-chips button{border:1px solid rgba(46,125,50,.35);background:rgba(46,125,50,.07);color:#2e7d32;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer;text-align:left}
  .mna-rec{margin-top:8px;padding:9px 11px;border:1px solid rgba(46,125,50,.35);border-radius:10px;background:rgba(46,125,50,.06)}
  .mna-rec b{font-size:11px;color:#2e7d32;text-transform:uppercase;letter-spacing:.03em}.mna-rec p{margin:4px 0 8px!important;font-size:13px}
  .mna-rec button{border:none;border-radius:8px;padding:7px 12px;background:#2e7d32;color:#fff;font-weight:800;font-size:13px;cursor:pointer}
  .mna-form{display:grid;grid-template-columns:auto 1fr auto;gap:8px;padding:10px;border-top:1px solid #e3e8e1;background:#fff}
  .mna-form input{min-width:0;height:40px;border:1px solid #cfd6cd;border-radius:10px;padding:0 11px;font-size:14px}
  .mna-form button{height:40px;border:none;border-radius:10px;padding:0 14px;background:#1f3d2b;color:#fff;font-weight:800;cursor:pointer}
  .mna-form .mna-mic{width:40px;padding:0;display:grid;place-items:center;border-radius:50%;background:#2e7d32}
  .mna-form .mna-mic.listening{background:#c62828;animation:mnaMic 1.1s infinite}
  @keyframes mnaMic{0%,100%{box-shadow:0 0 0 0 rgba(198,40,40,.45)}50%{box-shadow:0 0 0 8px rgba(198,40,40,0)}}
  @media (max-width:640px){
    .mna-fab{bottom:calc(84px + env(safe-area-inset-bottom));right:12px;padding:6px}.mna-fab .mna-label{display:none}
    .mna-panel{top:0;left:0;right:0;bottom:0;width:auto;height:100vh;height:100dvh;border-radius:0;padding-bottom:env(safe-area-inset-bottom)}
    .mna-form input{font-size:16px}
  }
  body.mna-open{overflow:hidden}
  body.mna-open .mobile-bottom-nav{visibility:hidden}
  .mna-del{border-color:rgba(198,40,40,.35);background:rgba(198,40,40,.05)}.mna-del b{color:#b71c1c}.mna-del button{background:#c62828}
  .mna-rec button:disabled{background:#9aa39d;cursor:default}
  .mna-cfg{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#fbfcfa}
  .mna-cfg[hidden],.mna-msgs[hidden],.mna-form[hidden],.mna-cfg [hidden]{display:none!important}
  .mna-cfg h4{margin:0;font-size:15px}
  .mna-cfg label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:#4b5550}
  .mna-cfg input,.mna-cfg select{height:38px;border:1px solid #cfd6cd;border-radius:9px;padding:0 10px;font-size:14px;font-weight:400;color:#1d2521;background:#fff}
  .mna-cfg .mna-check{flex-direction:row;align-items:center;font-weight:600}.mna-cfg .mna-check input{height:auto}
  .mna-cfg-btns{display:flex;flex-wrap:wrap;gap:8px}
  .mna-cfg-btns button{border:none;border-radius:9px;padding:9px 14px;background:#1f3d2b;color:#fff;font-weight:800;cursor:pointer}
  .mna-cfg-btns button.ghost{background:#fff;color:#1f3d2b;border:1px solid #cfd6cd}
  .mna-cfg-msg{margin:0;font-size:13px;font-weight:700}
  .mna-cfg-help{margin:0;font-size:12px;color:#6b756f}
  .mna-cfg-status{margin:0}
  body.mna-hidden .mna-fab{display:none}`;

  function mount() {
    if ($("mnaPanel")) return;
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <button type="button" class="mna-fab" id="mnaFab" aria-expanded="false"><span class="mna-face">${FACE}</span><span class="mna-label">Minuano IA</span></button>
      <section class="mna-panel" id="mnaPanel" hidden aria-label="Minuano IA">
        <div class="mna-head">
          <span class="mna-face">${FACE}</span>
          <div><strong>Minuano IA</strong><small id="mnaSub"></small><span class="mna-badge" id="mnaBadge"></span></div>
          <div class="mna-head-actions">
            <button type="button" id="mnaCfgBtn" title="Configurar IA" hidden>⚙</button>
            <button type="button" id="mnaLang" title="Idioma / Idioma"></button>
            <button type="button" id="mnaClose" aria-label="Fechar">✕</button>
          </div>
        </div>
        <div class="mna-msgs" id="mnaMsgs"></div>
        <div class="mna-cfg" id="mnaCfg" hidden></div>
        <form class="mna-form" id="mnaForm">
          <button type="button" class="mna-mic" id="mnaMic" aria-label="Falar">${MIC}</button>
          <input type="text" id="mnaInput" autocomplete="off">
          <button type="submit" id="mnaSend"></button>
        </form>
      </section>`;
    document.body.appendChild(wrap);
    $("mnaFab").addEventListener("click", () => toggle());
    $("mnaClose").addEventListener("click", () => toggle(false));
    $("mnaLang").addEventListener("click", () => {
      window.I18N.lang = window.I18N.lang === "es" ? "pt" : "es";
      try { localStorage.setItem(`${STORE_KEY}_lang`, window.I18N.lang); } catch (e) { /* sem storage */ }
      texts();
    });
    $("mnaForm").addEventListener("submit", onSubmit);
    $("mnaCfgBtn").addEventListener("click", () => showSettings($("mnaCfg").hidden));
    $("mnaCfg").addEventListener("change", (e) => { if (e.target.name === "mode") syncSettings(true); });
    $("mnaCfg").addEventListener("click", (e) => {
      if (e.target.id === "mnaCfgSave") saveSettings();
      if (e.target.id === "mnaCfgTest") testSettings();
      if (e.target.id === "mnaCfgBack") showSettings(false);
    });
    $("mnaMsgs").addEventListener("click", (e) => {
      const chip = e.target.closest("[data-mq]");
      if (chip) { $("mnaInput").value = chip.dataset.mq; $("mnaForm").requestSubmit(); return; }
      const rec = e.target.closest("[data-mrec]");
      if (rec) openRecord(drafts[Number(rec.dataset.mrec)]);
      const del = e.target.closest("[data-mdel]");
      if (del && !del.disabled) runDelete(del);
    });
    setupMic();
    texts();
    /* so aparece depois do login */
    const syncVisible = () => {
      const shell = $("pageShell");
      document.body.classList.toggle("mna-hidden", !!shell && shell.hidden);
    };
    syncVisible();
    if ($("pageShell")) new MutationObserver(syncVisible).observe($("pageShell"), { attributes: true, attributeFilter: ["hidden", "class", "style"] });
  }

  function texts() {
    $("mnaSub").textContent = L(`Assessor do ${SYSTEM_NAME}`, `Asesor de ${SYSTEM_NAME}`);
    $("mnaLang").textContent = window.I18N.lang === "es" ? "ES" : "PT";
    $("mnaInput").placeholder = L("Pergunte ou fale um registro…", "Pregunte o dicte un registro…");
    $("mnaSend").textContent = L("Enviar", "Enviar");
    badge();
  }

  let failed = false;
  function badge() {
    const el = $("mnaBadge");
    const on = AI.enabled() && !failed;
    el.className = `mna-badge ${on ? "on" : ""}`;
    el.textContent = AI.config().off ? L("IA desligada", "IA apagada") : on ? L("IA conectada", "IA conectada") : L("IA indisponível", "IA no disponible");
    const admin = typeof isAdmin === "function" ? isAdmin() : false;
    $("mnaCfgBtn").hidden = !admin;
  }

  let started = false;
  function toggle(force = null) {
    const panel = $("mnaPanel");
    const open = force === null ? panel.hidden : force;
    panel.hidden = !open;
    $("mnaFab").setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("mna-open", open && window.matchMedia("(max-width:640px)").matches);
    if (open) badge();
    if (open && !started) {
      started = true;
      add("bot", `<p><strong>${L("Olá! Eu sou o Minuano.", "¡Hola! Soy Minuano.")}</strong></p><p>${L("Leio o rebanho, os potreiros, as movimentações e a sanidade. Pergunte do seu jeito, em português ou espanhol — ou toque no microfone e fale um registro.", "Leo el rodeo, los potreros, los movimientos y la sanidad. Pregunte a su manera, en español o portugués, o toque el micrófono y dicte un registro.")}</p>`,
        [L("Quantos animais tenho por categoria?", "¿Cuántos animales tengo por categoría?"), L("Resumo das vendas deste ano", "Resumen de las ventas de este año"), L("Vai chover em Artigas esta semana?", "¿Va a llover en Artigas esta semana?")]);
    }
    if (open) setTimeout(() => $("mnaInput").focus(), 30);
  }

  function add(role, html, chips = []) {
    const row = document.createElement("div");
    row.className = `mna-row ${role}`;
    row.innerHTML = `${role === "bot" ? `<span class="mna-face">${FACE}</span>` : ""}<div class="mna-msg">${html}${chips.length ? `<div class="mna-chips">${chips.map((c) => `<button type="button" data-mq="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : ""}</div>`;
    $("mnaMsgs").appendChild(row);
    $("mnaMsgs").scrollTop = $("mnaMsgs").scrollHeight;
    return row;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const q = $("mnaInput").value.trim();
    if (!q) return;
    $("mnaInput").value = "";
    const cmd = q.match(/^\/chave\s+(\S+)/i);
    if (cmd || /^\/servidor$/i.test(q)) {
      AI.saveConfig(cmd ? { mode: "gemini", key: cmd[1], model: "" } : { mode: "proxy", key: "" });
      AI.reset();
      failed = false;
      add("bot", `<p>${cmd ? L("Chave de teste salva só neste navegador. Agora estou usando o Gemini direto.", "Clave de prueba guardada solo en este navegador. Ahora uso Gemini directo.") : L("Voltei a usar o servidor do sistema.", "Volví a usar el servidor del sistema.")}</p>`);
      badge();
      return;
    }
    add("user", `<p>${esc(q)}</p>`);
    const typing = add("bot", `<span class="mna-typing"><span></span><span></span><span></span></span>`);
    let html;
    try {
      failed = false;
      html = await answer(q);
    } catch (err) {
      console.warn("Minuano IA", err);
      failed = true;
      const msg = String(err?.message || "");
      html = `<p>${/401|token|sess/i.test(msg) ? L("Sua sessão expirou. Entre de novo no sistema para usar o Minuano.", "Su sesión expiró. Ingrese de nuevo al sistema para usar Minuano.")
        : /429|muitas|demand|quota/i.test(msg) ? L("Muitas perguntas agora. Espere um minuto e tente de novo.", "Muchas preguntas ahora. Espere un minuto y pruebe de nuevo.")
        : L("Não consegui falar com a IA agora. Confira a internet e tente de novo em instantes.", "No pude hablar con la IA ahora. Revise internet y pruebe de nuevo en un momento.")}</p>`;
    }
    typing.remove();
    add("bot", html);
    badge();
  }

  async function answer(q) {
    if (!G.token() && AI.config().mode === "proxy") throw new Error("401 sem token (modo offline)");
    let extra = "";
    if (WEATHER.test(norm(q))) {
      const place = await resolvePlace(q).catch(() => null);
      const fc = place ? await forecast(place).catch(() => null) : null;
      if (fc) extra = weatherBlock(place, fc);
    }
    const text = await AI.ask(q, extra);
    const { text: clean, records } = AI.extractRecords(text);
    return AI.toHtml(clean) + records.map(card).join("");
  }

  /* ───── configuracao da IA (somente administrador) ───── */
  const MODES = [
    ["proxy", () => L("Servidor do sistema (recomendado)", "Servidor del sistema (recomendado)")],
    ["gemini", () => L("Google Gemini — chave neste navegador (grátis)", "Google Gemini — clave en este navegador (gratis)")],
    ["key", () => L("Claude — chave neste navegador (pago)", "Claude — clave en este navegador (pago)")],
    ["openai", () => L("Compatível OpenAI (Groq, OpenRouter, GPT)", "Compatible OpenAI (Groq, OpenRouter, GPT)")]
  ];
  function showSettings(open) {
    if (open && !(typeof isAdmin === "function" && isAdmin())) return;
    $("mnaCfg").hidden = !open;
    $("mnaMsgs").hidden = open;
    $("mnaForm").hidden = open;
    if (open) renderSettings();
  }
  function renderSettings() {
    const c = AI.config();
    $("mnaCfg").innerHTML = `
      <h4>${L("Configuração da IA", "Configuración de la IA")}</h4>
      <p class="mna-cfg-status"><span class="mna-badge ${AI.enabled() && !c.off ? "on" : ""}">${c.off ? L("IA desligada", "IA apagada") : AI.enabled() ? L("Configurada", "Configurada") : L("Sem configuração", "Sin configuración")}</span></p>
      <label>${L("Conexão", "Conexión")}<select name="mode">${MODES.map(([v, l]) => `<option value="${v}" ${c.mode === v ? "selected" : ""}>${esc(l())}</option>`).join("")}</select></label>
      <label data-show="openai">${L("Endereço da API", "Dirección de la API")}<input name="openaiUrl" type="url" value="${esc(c.openaiUrl)}"></label>
      <label data-show="gemini key openai">${L("Chave da API", "Clave de API")}<input name="key" type="password" autocomplete="off" value="${esc(c.mode === "proxy" ? "" : c.key)}"></label>
      <label data-show="gemini key openai">${L("Modelo", "Modelo")}<input name="model" type="text" list="mnaModels" value="${esc(c.mode === "proxy" ? "" : c.model)}"><datalist id="mnaModels">${["gemini-flash-latest", "gemini-2.5-flash", "gemini-pro-latest", "claude-sonnet-5", "claude-haiku-4-5-20251001", "llama-3.3-70b-versatile"].map((m) => `<option value="${m}">`).join("")}</datalist></label>
      <label class="mna-check"><input type="checkbox" name="off" ${c.off ? "checked" : ""}> ${L("Desligar a IA", "Apagar la IA")}</label>
      <div class="mna-cfg-btns"><button type="button" id="mnaCfgSave">${L("Salvar", "Guardar")}</button><button type="button" id="mnaCfgTest" class="ghost">${L("Testar conexão", "Probar conexión")}</button><button type="button" id="mnaCfgBack" class="ghost">${L("Voltar ao chat", "Volver al chat")}</button></div>
      <p class="mna-cfg-msg" id="mnaCfgMsg"></p>
      <p class="mna-cfg-help" data-show="proxy">${L("O servidor do sistema guarda a chave (variável GEMINI_API_KEY no Render). Ninguém precisa colar chave no navegador.", "El servidor del sistema guarda la clave (variable GEMINI_API_KEY en Render). Nadie necesita pegar clave en el navegador.")}</p>
      <p class="mna-cfg-help" data-show="gemini">${L("Chave grátis: aistudio.google.com → Get API key → Create API key (começa com AIza). Fica salva só neste navegador.", "Clave gratis: aistudio.google.com → Get API key → Create API key (empieza con AIza). Queda guardada solo en este navegador.")}</p>
      <p class="mna-cfg-help" data-show="key openai">${L("A chave fica salva só neste navegador. Use apenas em computador de confiança.", "La clave queda guardada solo en este navegador. Úsela solo en una computadora de confianza.")}</p>`;
    syncSettings(false);
  }
  function syncSettings(changed) {
    const box = $("mnaCfg");
    const mode = box.querySelector("[name=mode]").value;
    box.querySelectorAll("[data-show]").forEach((el) => { el.hidden = !el.dataset.show.split(" ").includes(mode); });
    if (changed) {
      const def = AI.DEFAULT_MODELS?.[mode];
      box.querySelector("[name=model]").value = def || "";
      if (mode !== AI.config().mode) box.querySelector("[name=key]").value = "";
    }
  }
  function saveSettings() {
    const box = $("mnaCfg");
    const v = (n) => box.querySelector(`[name=${n}]`);
    const mode = v("mode").value;
    const key = v("key").value.trim();
    if (mode !== "proxy" && !key) { $("mnaCfgMsg").textContent = L("Cole a chave da API.", "Pegue la clave de API."); return; }
    AI.saveConfig({ mode, key: mode === "proxy" ? "" : key, model: mode === "proxy" ? "" : v("model").value.trim(), openaiUrl: v("openaiUrl").value.trim(), off: v("off").checked });
    AI.reset();
    failed = false;
    badge();
    renderSettings();
    $("mnaCfgMsg").textContent = L("Salvo.", "Guardado.");
  }
  async function testSettings() {
    saveSettings();
    const msg = $("mnaCfgMsg");
    if (AI.config().mode === "proxy" && !G.token()) { msg.textContent = L("Entre no sistema (login online) para testar o servidor.", "Ingrese al sistema (login en línea) para probar el servidor."); return; }
    msg.textContent = L("Testando…", "Probando…");
    try {
      const r = await AI.test();
      const model = (String(r).match(/\(([^()]+)\)\s*$/) || [])[1];
      msg.textContent = `✔ ${L("Conexão OK", "Conexión OK")}${model ? ` (${model})` : ""}`;
      failed = false;
    } catch (err) {
      const t = String(err?.message || err);
      msg.textContent = `✖ ${/404/.test(t) ? L("O servidor ainda não tem a rota do Minuano (publicar o servidor).", "El servidor todavía no tiene la ruta de Minuano (publicar el servidor).") : t}`;
      failed = true;
    }
    badge();
  }

  /* ───── voz ───── */
  let rec = null;
  function setupMic() {
    const btn = $("mnaMic");
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    btn.addEventListener("click", () => {
      if (!Rec) return alert(L("Este navegador não reconhece voz. Use o Google Chrome (computador ou Android) ou o Safari atualizado.", "Este navegador no reconoce voz. Use Google Chrome (computadora o Android) o Safari actualizado."));
      if (rec) { rec.stop(); return; }
      const input = $("mnaInput");
      const r = new Rec();
      r.lang = window.I18N.lang === "es" ? "es-UY" : "pt-BR";
      r.interimResults = true;
      r.continuous = false;
      let finalText = "";
      const before = input.placeholder;
      r.onstart = () => { btn.classList.add("listening"); input.value = ""; input.placeholder = L("Ouvindo... fale agora", "Escuchando... hable ahora"); };
      r.onresult = (ev) => {
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
          if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript; else interim += ev.results[i][0].transcript;
        }
        input.value = (finalText + interim).trim();
      };
      r.onerror = (ev) => {
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed") alert(L("Permita o uso do microfone para este site (cadeado ao lado do endereço).", "Permita el uso del micrófono para este sitio (candado al lado de la dirección)."));
        else if (ev.error === "network") alert(L("O reconhecimento de voz precisa de internet.", "El reconocimiento de voz necesita internet."));
      };
      r.onend = () => {
        btn.classList.remove("listening");
        input.placeholder = before;
        rec = null;
        const text = (finalText || input.value).trim();
        if (text) { input.value = text; $("mnaForm").requestSubmit(); }
      };
      rec = r;
      try { r.start(); } catch (e) { rec = null; }
    });
  }

  /* ───── clima (Open-Meteo, sem chave) ───── */
  const WEATHER = /\b(chuva|chuvas|chove|chover|choveu|chovendo|garoa|tempo|clima|previsao|temporal|tempestade|vento|geada|granizo|calor|frio|temperatura|lluvia|lluvias|llueve|llover|lloviendo|tiempo|pronostico|tormenta|viento|helada)\b/;
  const placeCache = new Map();
  async function geocode(name) {
    const k = norm(name);
    if (placeCache.has(k)) return placeCache.get(k);
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=8&language=${window.I18N.lang === "es" ? "es" : "pt"}&format=json`);
    const data = r.ok ? await r.json() : {};
    const prefer = ["BR", "UY", "AR", "PY"];
    const best = (data.results || []).slice().sort((a, b) => ((prefer.indexOf(a.country_code) + 10) % 10) - ((prefer.indexOf(b.country_code) + 10) % 10) || num(b.population) - num(a.population))[0];
    const place = best ? { name: [best.name, best.admin1, best.country].filter(Boolean).join(", "), lat: best.latitude, lon: best.longitude } : null;
    placeCache.set(k, place);
    return place;
  }
  async function resolvePlace(question) {
    const stop = new Set(["hoje", "amanha", "hoy", "manana", "agora", "ahora", "semana", "essa", "esta", "este", "esse", "proxima", "proximos", "dias", "fim", "de", "do", "da", "la", "el", "o", "a", "tempo", "clima", "vai", "va", "chover", "llover"]);
    const hits = String(question).replace(/[¿?¡!.,;:]/g, " ").match(/\b(?:em|en|no|na|para|pra|por|sobre|de)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\- ]{1,40})/g) || [];
    for (const hit of hits) {
      const words = hit.split(/\s+/).slice(1).filter(Boolean);
      while (words.length && stop.has(norm(words[words.length - 1]))) words.pop();
      if (!words.length || stop.has(norm(words[0]))) continue;
      for (let n = Math.min(words.length, 4); n >= 1; n -= 1) {
        const place = await geocode(words.slice(0, n).join(" "));
        if (place) return place;
      }
    }
    return null;
  }
  async function forecast(p) {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&daily=weather_code,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,temperature_2m_min,temperature_2m_max&current=temperature_2m,precipitation,weather_code,wind_speed_10m&forecast_days=7&timezone=America%2FSao_Paulo`);
    if (!r.ok) throw new Error("clima");
    return r.json();
  }
  function wLabel(code) {
    const v = num(code);
    if ([95, 96, 99].includes(v)) return "temporal";
    if ([80, 81, 82, 61, 63, 65].includes(v)) return "chuva";
    if ([51, 53, 55, 56, 57].includes(v)) return "garoa";
    if ([45, 48].includes(v)) return "neblina";
    if ([1, 2, 3].includes(v)) return "parcialmente nublado";
    return v === 0 ? "céu limpo" : "variável";
  }
  function weatherBlock(p, data) {
    const d = data.daily || {};
    const c = data.current || {};
    const days = (d.time || []).map((t, i) => `${t}: ${wLabel(d.weather_code?.[i])}; chuva ${num(d.precipitation_sum?.[i]).toFixed(1)} mm (prob. ${num(d.precipitation_probability_max?.[i]).toFixed(0)}%); min ${num(d.temperature_2m_min?.[i]).toFixed(0)}°C / max ${num(d.temperature_2m_max?.[i]).toFixed(0)}°C; rajada ${num(d.wind_gusts_10m_max?.[i]).toFixed(0)} km/h`);
    return `<previsao_do_tempo local="${p.name}" fonte="Open-Meteo">\nAgora: ${num(c.temperature_2m).toFixed(0)}°C, ${wLabel(c.weather_code)}, vento ${num(c.wind_speed_10m).toFixed(0)} km/h\n${days.join("\n")}\n</previsao_do_tempo>`;
  }

  /* ───── registros preparados ───── */
  const drafts = [];
  const MOV_LABEL = { nascimento: "Nascimento", compra: "Compra", venda: "Venda", consumo: "Consumo / abate", morte: "Morte", transferencia: "Transferência", ajuste: "Ajuste" };
  function card(r) {
    if (r.tipo === "excluir") return deleteCard(r);
    const i = drafts.push(r) - 1;
    const title = r.tipo === "sanidad" ? L("Sanidade", "Sanidad") : L("Movimentação", "Movimiento");
    const parts = [MOV_LABEL[r.movimiento], r.cantidad ? `${r.cantidad} ${r.categoria || ""}`.trim() : r.categoria, r.producto, r.establecimiento, r.potrero, r.destino ? `→ ${r.destino}` : "", num(r.valor) ? `valor ${r.valor}` : "", r.fecha || L("hoje", "hoy")].filter(Boolean);
    return `<div class="mna-rec"><b>📝 ${esc(title)}</b><p>${esc(parts.join(" · "))}</p><button type="button" data-mrec="${i}">${L("Revisar e salvar", "Revisar y guardar")}</button></div>`;
  }
  /* ───── exclusao: registro real + funcao de exclusao do sistema (que pede confirmacao) ───── */
  const deletes = [];
  const DEL_KEYS = { movimiento: "movements", sanidad: "sanitaryRecords", reproduccion: "reproductionRecords" };
  function deleteTarget(r) {
    const key = DEL_KEYS[r.registro];
    const code = String(r.codigo || "").replace(/^\[|\]$/g, "").trim();
    if (!key || !code) return null;
    for (const farm of G.farms()) {
      const rec = (farm[key] || []).find((x) => x.code === code || x.id === code || x.sourceId === code);
      if (!rec) continue;
      const what = r.registro === "sanidad" ? rec.product : (rec.type || "");
      const label = `${rec.code || ""} · ${rec.date || ""} · ${what} · ${num(rec.quantity)} ${rec.categoryName || ""} · ${farm.name}`;
      const exists = () => (state.data.farms[farm.id]?.[key] || []).some((x) => x.id === rec.id);
      return {
        label,
        exists,
        run: () => {
          if (r.registro === "movimiento") deleteMovement(farm.id, rec.id);
          else if (r.registro === "sanidad") deleteSanitaryRecord(rec.id || rec.sourceId);
          else if (typeof deleteRepRecordFixed === "function") deleteRepRecordFixed(rec.id, farm.id);
          else deleteRepRecord(rec.id, farm.id);
          return !exists();
        }
      };
    }
    return null;
  }
  function deleteCard(r) {
    const t = deleteTarget(r);
    if (!t) return `<div class="mna-rec mna-del"><b>🗑 ${L("Excluir", "Eliminar")}</b><p>${L("Não encontrei o registro", "No encontré el registro")} <b>${esc(r.codigo || "-")}</b>.</p></div>`;
    const i = deletes.push(t) - 1;
    return `<div class="mna-rec mna-del"><b>🗑 ${L("Excluir registro", "Eliminar registro")}</b><p>${esc(t.label)}</p><button type="button" data-mdel="${i}">${L("Excluir…", "Eliminar…")}</button></div>`;
  }
  function runDelete(btn) {
    const t = deletes[Number(btn.dataset.mdel)];
    if (!t) return;
    if (!t.exists()) { btn.disabled = true; btn.textContent = L("Já excluído", "Ya eliminado"); return; }
    if (t.run()) {
      btn.disabled = true;
      btn.textContent = L("Excluído ✓", "Eliminado ✓");
      AI.remember("assistant", `${L("Registro excluído pelo usuário", "Registro eliminado por el usuario")}: ${t.label}`);
    }
  }

  function match(list, name, get) {
    const n = norm(name);
    if (!n) return null;
    const k = (x) => norm(get(x));
    const sing = (s) => s.replace(/s\b/g, "");
    return list.find((x) => k(x) === n) || list.find((x) => sing(k(x)) === sing(n)) || list.find((x) => k(x).includes(n)) || list.find((x) => n.includes(k(x)) && k(x).length > 2) || null;
  }
  function setSelect(el, value) {
    if (!el || value == null) return;
    if (![...el.options].some((o) => o.value === value)) return;
    el.value = value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function openRecord(r) {
    if (!r) return;
    const farms = G.farms();
    if (!farms.length) return alert(L("Nenhuma fazenda cadastrada.", "Ningún establecimiento registrado."));
    const st = G.state();
    const selected = st?.data?.farms?.[st.data.selectedFarmId];
    const farm = match(farms, r.establecimiento, (f) => f.name) || selected || (farms.length === 1 ? farms[0] : null);
    if (!farm) return alert(L("Diga de qual fazenda é o registro.", "Diga de qué establecimiento es el registro."));
    const cat = match(farm.categories || [], r.categoria, (c) => c.name);
    const potr = match(farm.potreiros || [], r.potrero, (p) => p.name);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(r.fecha || "") ? r.fecha : todayIso();
    toggle(false);
    try {
      if (r.tipo === "sanidad") return openSanitary(farm, cat, potr, date, r);
      if (r.tipo === "movimiento") return openMovement(farm, cat, potr, date, r);
      alert(L("Tipo de registro não reconhecido.", "Tipo de registro no reconocido."));
    } catch (err) {
      console.error("Minuano registro", err);
      alert(L("Não consegui abrir o formulário. Use o botão normal do sistema.", "No pude abrir el formulario. Use el botón normal del sistema."));
    }
  }

  function openMovement(farm, cat, potr, date, r) {
    const type = MOV_LABEL[r.movimiento] ? r.movimiento : null;
    if (!type) return alert(L("Tipo de movimentação não reconhecido.", "Tipo de movimiento no reconocido."));
    openMovementDialog(type);
    syncMovementFarmOptions(farm.id);
    if (cat && cat.species && typeof runtime !== "undefined") {
      runtime.movementSpecies = cat.species;
      if (typeof renderMovementSpeciesSwitch === "function") renderMovementSpeciesSwitch();
    }
    syncMovementCategoryOptionsForFarm(farm);
    if (cat) setSelect(elements.movementCategory, cat.id);
    if (typeof syncMovementPotreirosOptions === "function") syncMovementPotreirosOptions();
    if (potr) setSelect(elements.movementPotreiro, potr.id);
    elements.movementDate.value = date;
    if (num(r.cantidad)) { elements.movementQuantity.value = String(Math.round(num(r.cantidad))); elements.movementQuantity.dispatchEvent(new Event("input", { bubbles: true })); }
    if (num(r.valor) && elements.movementValue) elements.movementValue.value = String(num(r.valor));
    if (r.comprador && elements.movSaleBuyer) elements.movSaleBuyer.value = r.comprador;
    if (r.notas && elements.movementNotes) elements.movementNotes.value = r.notas;
    if (type === "ajuste" && elements.adjustDirection) elements.adjustDirection.value = r.direccion === "restar" ? "subtract" : "add";
    if (type === "transferencia" && r.destino) {
      const dest = match(G.farms().filter((f) => f.id !== farm.id), r.destino, (f) => f.name);
      const destSel = elements.movementDestFarm || $("movementDestFarm") || $("movDestFarm");
      if (dest && destSel) setSelect(destSel, dest.id);
    }
    if (typeof updateMovementCategoryTotal === "function") updateMovementCategoryTotal();
  }

  function openSanitary(farm, cat, potr, date, r) {
    const st = G.state();
    if (st.data.selectedFarmId !== farm.id) {
      st.data.selectedFarmId = farm.id;
      if (typeof saveData === "function") saveData();
      if (typeof render === "function") render();
    }
    openSanitaryDialog();
    setSelect(elements.sanitaryFarm, farm.id);
    if (cat && cat.species && typeof runtime !== "undefined") runtime.sanitarySpecies = cat.species;
    if (typeof syncSanitaryFormOptions === "function") syncSanitaryFormOptions();
    if (cat) {
      if (typeof ensureSanitaryCategoryOption === "function") ensureSanitaryCategoryOption(cat.id, cat.name);
      setSelect(elements.sanitaryCategory, cat.id);
    }
    if (r.producto) {
      const known = match((farm.sanitaryProducts || []).map((p) => ({ p })), r.producto, (x) => x.p)?.p || r.producto;
      if (typeof ensureSelectOption === "function") ensureSelectOption(elements.sanitaryProduct, known, known);
      setSelect(elements.sanitaryProduct, known);
    }
    if (potr && elements.sanitaryPotrero) {
      if (typeof ensureSelectOption === "function") ensureSelectOption(elements.sanitaryPotrero, potr.name, potr.name);
      setSelect(elements.sanitaryPotrero, potr.name);
    }
    elements.sanitaryDate.value = date;
    if (num(r.cantidad)) elements.sanitaryQuantity.value = String(Math.round(num(r.cantidad)));
    if (r.notas) elements.sanitaryNotes.value = r.notas;
    if (typeof updateSanitaryProductMode === "function") updateSanitaryProductMode();
    if (typeof updateSanitaryPotreroMode === "function") updateSanitaryPotreroMode();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
