/* ═══════════════════════════════════════════════════════════════
   Minuano IA — conecta o Minuano a um modelo de linguagem (Claude)
   que recebe um resumo dos dados do sistema e conversa de verdade.
   Sem configuracao (ou sem internet) o Minuano segue no motor local.

   Modos:
   - "proxy": chama um servidor proprio (ex.: Cloudflare Worker em
     minuano-proxy/) que guarda a chave da API. Recomendado.
   - "key":    chama a API do Claude direto do navegador (chave salva
     somente neste navegador). Bom para testes e demonstracoes.
   - "gemini": Google Gemini com chave gratuita do Google AI Studio.
   - "openai": qualquer API compativel com OpenAI (Groq, OpenRouter...).
   ═══════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  /* URL padrao do proxy publicado (preencher depois do deploy do worker) */
  const DEFAULT_PROXY_URL = "";
  const DEFAULT_MODEL = "claude-sonnet-5";
  const DEFAULT_MODELS = { key: "claude-sonnet-5", gemini: "gemini-flash-latest", openai: "llama-3.3-70b-versatile", proxy: "" };
  const DEFAULT_OPENAI_URL = "https://api.groq.com/openai/v1/chat/completions";
  const GEMINI_FALLBACKS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
  let lastGeminiModel = "";
  const STORE_KEY = "gdo_minuano_ai";
  const MAX_HISTORY = 12;
  const TIMEOUT_MS = 60000;

  const L = (pt, es) => (window.I18N?.lang === "pt" ? pt : es);

  /* pontos de integracao para outros sistemas (ver docs/MINUANO-IA.md) */
  const sources = new Map();       /* nome -> funcao que devolve dados (JSON) */
  const options = { proxyUrl: "", systemPrompt: null, recordsPrompt: null, proxyHeaders: null, storeKey: "" };

  function registerSource(name, fn) { if (name && typeof fn === "function") sources.set(name, fn); }
  function configure(next = {}) { Object.assign(options, next); }

  function config() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(options.storeKey || STORE_KEY) || "{}") || {}; } catch (e) { saved = {}; }
    const url = saved.url ?? (options.proxyUrl || DEFAULT_PROXY_URL);
    return {
      mode: saved.mode || (saved.key ? "key" : "proxy"),
      url,
      key: saved.key || "",
      model: saved.model || DEFAULT_MODELS[saved.mode] || DEFAULT_MODEL,
      openaiUrl: saved.openaiUrl || DEFAULT_OPENAI_URL,
      off: !!saved.off
    };
  }

  function saveConfig(next) {
    const cur = config();
    const merged = { ...cur, ...next };
    try { localStorage.setItem(options.storeKey || STORE_KEY, JSON.stringify(merged)); } catch (e) { /* navegador sem storage */ }
    return merged;
  }

  function enabled() {
    const c = config();
    if (c.off) return false;
    return c.mode === "proxy" ? !!c.url : !!c.key;
  }

  /* historico curto da conversa (texto puro) */
  const history = [];
  function remember(role, text) {
    const t = String(text || "").trim();
    if (!t) return;
    history.push({ role, content: t.slice(0, 4000) });
    while (history.length > MAX_HISTORY) history.shift();
  }

  function systemPrompt(lang) {
    if (typeof options.systemPrompt === "function") return [options.systemPrompt(lang, defaultSystemPrompt), options.recordsPrompt || ""].filter(Boolean).join("\n");
    return defaultSystemPrompt(lang);
  }

  /* prompt padrao do GDO Agro (outros sistemas podem reaproveitar ou substituir) */
  function defaultSystemPrompt(lang) {
    const today = new Date().toISOString().slice(0, 10);
    return [
      "Você é o Minuano, assessor agronômico e financeiro de um sistema de gestão agrícola (GDO Agro) usado por produtores e engenheiros agrônomos no Uruguai e no sul do Brasil. O foco principal é agricultura (arroz, soja, milho, trigo etc.): quanto se investiu, custo por hectare, em que se gastou, produção, rendimento, receita, resultado por hectare, ponto de equilíbrio, combustível e máquinas. A pecuária é um módulo complementar.",
      "Personalidade: gaúcho/rioplatense, cordial, direto e prático, sem enrolação. Fala como um colega agrônomo experiente.",
      `Idioma: responda SEMPRE no idioma em que o usuário escreveu. Se escrever em espanhol, responda em espanhol rioplatense (vos/usted conforme o usuário); se escrever em português, responda em português do Brasil. Você é fluente nos dois. Se não der para saber, use ${lang === "pt" ? "português" : "espanhol"}.`,
      "Dados: no início da conversa vem um JSON com os dados registrados no sistema (todas as safras/zafras, por talhão/chacra, custos por categoria em moeda/ha, combustível, máquinas, insumos e pecuária). Use SOMENTE esses dados para números do sistema; nunca invente valores. Se faltar um dado, diga o que falta registrar. Se datosDemo for true, deixe claro que são dados de demonstração quando for relevante.",
      "Clima: quando a pergunta vier com um bloco <previsao_do_tempo>, ele foi buscado agora na internet (Open-Meteo) para o local citado. Use-o para responder sobre chuva, temperatura e vento, cite o local e os dias, e relacione com as operações de campo quando fizer sentido. Sem esse bloco, você não tem dados de clima.",
      "Registros: quando o usuário pedir para registrar/lançar algo ou relatar um fato de campo (ex.: 'nasceram 4 terneiros no potreiro X', 'abatemos uma vaca', 'dosificamos 25 vacas de cria', 'apliquei glifosato na Norte', 'gastei 300 dólares de frete'), NUNCA diga que já registrou. Responda com 1 frase curta do que entendeu e, no final, um bloco por registro exatamente assim:\n```registro\n{json}\n```\nO sistema abre o formulário preenchido para o usuário revisar e salvar. Use os nomes EXATOS de 'catalogos' e da pecuária (estabelecimento, categoria, potreiro, chacra, atividade, máquina, insumo). Se faltar algo essencial (categoria, quantidade, ou estabelecimento quando houver mais de um e não der para deduzir), pergunte antes e não gere o bloco. Data padrão: hoje (AAAA-MM-DD). Esquemas (campos vazios podem ser omitidos):\n- Movimento de gado: {\"tipo\":\"movimiento\",\"movimiento\":\"nascimento|compra|venda|consumo|morte|transferencia|ajuste\",\"establecimiento\":\"\",\"categoria\":\"\",\"cantidad\":0,\"fecha\":\"\",\"potrero\":\"\",\"valor\":0,\"comprador\":\"\",\"destino\":\"\",\"direccion\":\"sumar|restar\",\"notas\":\"\"} (abate, carneada, faena = consumo; nasceram/nacieron = nascimento)\n- Sanidade: {\"tipo\":\"sanidad\",\"establecimiento\":\"\",\"categoria\":\"\",\"cantidad\":0,\"producto\":\"\",\"fecha\":\"\",\"potrero\":\"\",\"notas\":\"\"} (dosificação, vacina, vermífugo, banho)\n- Manejo agrícola: {\"tipo\":\"manejo\",\"chacra\":\"\",\"actividad\":\"\",\"fecha\":\"\",\"hectareas\":0,\"maquina\":\"\",\"litros\":0,\"insumos\":[{\"insumo\":\"\",\"cantidad\":0}],\"notas\":\"\"} (cantidad do insumo = TOTAL aplicado; se disserem dose por ha, multiplique pela área)\n- Custo: {\"tipo\":\"costo\",\"chacra\":\"\",\"categoria\":\"<chave de categoriasCosto>\",\"descripcion\":\"\",\"valor\":0,\"fecha\":\"\"}\n- Combustível: {\"tipo\":\"combustible\",\"chacra\":\"\",\"maquina\":\"\",\"litros\":0,\"hectareas\":0,\"horas\":0,\"fecha\":\"\"}\n- Observação: {\"tipo\":\"observacion\",\"chacra\":\"\",\"texto\":\"\",\"fecha\":\"\"}",
      "Exclusões: só quando o usuário pedir claramente para excluir/apagar/cancelar/desfazer um registro. Identifique UM registro pelo código entre colchetes nos dados (ex.: [A-0012] ou [id]). Se a descrição servir para mais de um, liste os candidatos com código, data e quantidade e pergunte qual; não gere bloco. Nunca exclua em massa (no máximo 1 bloco por resposta) e nunca diga que excluiu: o sistema mostra o registro real e pede confirmação ao usuário. Bloco:\n```registro\n{\"tipo\":\"excluir\",\"registro\":\"movimiento|sanidad|reproduccion|manejo|costo|combustible|cosecha|venta|compra|observacion\",\"codigo\":\"<código sem colchetes>\"}\n```\nAntes do bloco, diga em 1 frase qual registro será excluído e o efeito (ex.: movimentos de gado revertem o estoque).",
      "Pode usar conhecimento agronômico geral (manejo, doenças, épocas, boas práticas) deixando claro que é orientação geral e não dado do sistema.",
      "Análise: compare talhões e safras, aponte onde o dinheiro foi, explique diferenças de custo/ha, rendimento e resultado/ha, calcule o que for útil (ex.: quanto sobra por ha, equilíbrio) e termine, quando fizer sentido, com 1 recomendação prática.",
      "Formato: respostas curtas (até ~180 palavras, salvo quando pedirem detalhe). Use **negrito** para números-chave e listas com '-' quando ajudar. Sem tabelas longas, sem títulos com #. Moeda com símbolo (US$, $U, R$) e separador de milhar local.",
      `Data de hoje: ${today}.`
    ].join("\n");
  }

  function dataBlock() {
    const data = { agricultura: null, ganaderia: null, pantalla: null };
    try { data.agricultura = window.AgroCore?.aiContext?.() || null; } catch (e) { console.warn("aiContext", e); }
    try { data.ganaderia = window.GDO?.livestockContext?.() || null; } catch (e) { console.warn("livestockContext", e); }
    try { data.pantalla = window.GDOAgro?.context?.() || null; } catch (e) { /* opcional */ }
    sources.forEach((fn, name) => { try { data[name] = fn(); } catch (e) { console.warn("fonte", name, e); } });
    Object.keys(data).forEach((k) => { if (data[k] == null) delete data[k]; });
    return JSON.stringify(data);
  }

  async function callApi(system, messages) {
    const c = config();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      let res;
      if (c.mode === "gemini") {
        /* plano gratis: modelo ocupado (503/429) -> tenta de novo e depois outros modelos */
        const models = [...new Set([c.model, ...GEMINI_FALLBACKS].filter(Boolean))];
        let lastErr = null;
        for (const model of models) {
          for (let attempt = 0; attempt < 2; attempt += 1) {
            res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(c.key)}`, {
              method: "POST",
              signal: ctrl.signal,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
                generationConfig: { maxOutputTokens: 4096, temperature: 0.4 }
              })
            });
            const body = await res.json().catch(() => ({}));
            if (res.ok) {
              const text = (body.candidates?.[0]?.content?.parts || []).filter((part) => !part.thought).map((part) => part.text || "").join("").trim();
              if (text) { lastGeminiModel = model; return text; }
              lastErr = new Error("empty");
              break;
            }
            lastErr = new Error(body?.error?.message || `HTTP ${res.status}`);
            if (res.status === 400 || res.status === 401 || res.status === 403) throw lastErr; /* chave invalida: nao adianta trocar */
            if (res.status === 404) break; /* modelo inexistente: proximo */
            if (attempt === 0) await new Promise((r) => setTimeout(r, 1200));
          }
        }
        throw lastErr || new Error("Gemini");
      }
      if (c.mode === "openai") {
        res = await fetch(c.openaiUrl, {
          method: "POST",
          signal: ctrl.signal,
          headers: { "content-type": "application/json", authorization: `Bearer ${c.key}` },
          body: JSON.stringify({ model: c.model, max_tokens: 1200, temperature: 0.4, messages: [{ role: "system", content: system }, ...messages] })
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error?.message || `HTTP ${res.status}`);
        const text = String(body.choices?.[0]?.message?.content || "").trim();
        if (!text) throw new Error("empty");
        return text;
      }
      if (c.mode === "key") {
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            "content-type": "application/json",
            "x-api-key": c.key,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({ model: c.model, max_tokens: 1200, system, messages })
        });
      } else {
        res = await fetch(c.url, {
          method: "POST",
          signal: ctrl.signal,
          headers: { "content-type": "application/json", ...(typeof options.proxyHeaders === "function" ? options.proxyHeaders() : {}) },
          body: JSON.stringify({ system, messages })
        });
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message || body?.error || `HTTP ${res.status}`);
      const text = (body.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      if (!text) throw new Error("empty");
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  /* pergunta ao modelo; devolve texto (markdown simples) ou lanca erro */
  async function ask(question, extra = "") {
    const lang = window.I18N?.lang === "pt" ? "pt" : "es";
    const messages = [
      { role: "user", content: `<datos_del_sistema>\n${dataBlock()}\n</datos_del_sistema>\n\n${L("Esses são os dados atuais do sistema. Use-os nas respostas.", "Estos son los datos actuales del sistema. Usalos en las respuestas.")}` },
      { role: "assistant", content: L("Entendido, tenho os dados. Pode perguntar.", "Entendido, tengo los datos. Preguntá nomás.") },
      ...history,
      { role: "user", content: extra ? `${extra}\n\n${question}` : question }
    ];
    const text = await callApi(systemPrompt(lang), messages);
    remember("user", question);
    remember("assistant", text);
    return text;
  }

  /* separa os blocos ```registro {json}``` do texto da resposta */
  function extractRecords(text) {
    const records = [];
    const clean = String(text || "").replace(/```\s*registro\s*([\s\S]*?)```/gi, (_, body) => {
      try {
        const parsed = JSON.parse(body.trim());
        (Array.isArray(parsed) ? parsed : [parsed]).forEach((r) => { if (r && r.tipo) records.push(r); });
      } catch (e) { console.warn("registro invalido", body); }
      return "";
    }).trim();
    return { text: clean, records };
  }

  /* markdown minimo -> HTML seguro */
  function toHtml(md) {
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<i>$2</i>");
    const out = [];
    let list = null;
    String(md).replace(/\r/g, "").split("\n").forEach((raw) => {
      const line = raw.trim();
      const item = line.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
      if (item) {
        if (!list) { list = []; out.push(list); }
        list.push(`<li>${inline(item[1])}</li>`);
        return;
      }
      list = null;
      if (!line) return;
      out.push(`<p>${inline(line.replace(/^#+\s*/, ""))}</p>`);
    });
    return out.map((x) => (Array.isArray(x) ? `<ul>${x.join("")}</ul>` : x)).join("");
  }

  /* teste rapido da conexao */
  async function test() {
    lastGeminiModel = "";
    const text = await callApi("Responda apenas: OK", [{ role: "user", content: "ping" }]);
    return lastGeminiModel ? `${text} (${lastGeminiModel})` : text;
  }

  window.MinuanoAI = { registerSource, configure, defaultSystemPrompt, DEFAULT_MODELS, extractRecords, config, saveConfig, enabled, ask, toHtml, test, remember, reset: () => { history.length = 0; }, DEFAULT_MODEL };
})();
