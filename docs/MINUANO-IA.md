# Minuano IA: guia de integração

Este guia explica como o Minuano IA funciona no GDO Agro e como colocá-lo em outro sistema web parecido (painel agrícola ou pecuário). É escrito para quem vai mexer no código.

## Cada sistema é independente

Cada sistema recebe **a sua própria cópia** do Minuano IA. Nada é compartilhado entre eles:
- **Dados:** cada um lê só os dados do próprio sistema (as fontes registradas nele).
- **Configuração:** cada um guarda a sua (`localStorage` é separado por domínio; dá para mudar o nome com `configure({ storeKey })`).
- **Chave e servidor:** cada um tem a sua chave de IA e o seu servidor/rota, com os seus domínios liberados.
- **Código:** atualizar o Minuano num sistema não muda os outros; cada cópia evolui no seu repositório.

## O que ele faz

- Conversa em português e espanhol, no idioma em que o usuário escrever.
- Lê os dados do sistema (um resumo em JSON montado na hora) e responde com números reais: custos, resultado, rebanho, sanidade, combustível.
- Busca a previsão do tempo de qualquer cidade citada na pergunta (Open-Meteo, grátis e sem chave).
- Aceita voz (microfone do navegador).
- Prepara registros a partir da conversa ("nasceram 4 terneiros", "dosificamos 25 vacas"). O sistema abre o formulário preenchido e o **usuário confere e salva**. A IA nunca grava sozinha.
- Sem IA configurada, ou se a IA falhar, o sistema segue funcionando no modo local dele.

## Peças

| Arquivo | Papel | Reaproveitável? |
|---|---|---|
| `minuano-ai.js` | Cliente da IA: configuração, instruções (prompt), envio de dados, histórico, leitura dos blocos de registro, markdown para HTML | Sim, copiar como está |
| `minuano-proxy/` | Servidor (Cloudflare Worker) que guarda a chave do Claude fora do navegador | Sim |
| `app.js` (partes do chat) | Janela do chat, microfone, clima por cidade, abrir formulários preenchidos | Copiar as funções citadas abaixo e adaptar |
| `agro.js` → `aiContext()` | Monta o resumo dos dados agrícolas | Escrever o equivalente de cada sistema |

## Fluxo de uma pergunta

```
usuário digita ou fala ─► chat (app.js)
   ├─ é sobre clima? ─► geocodifica a cidade + previsão Open-Meteo ─► bloco <previsao_do_tempo>
   └─ MinuanoAI.ask(pergunta, blocoClima)
         ├─ instruções (persona + regras + formato dos registros)
         ├─ mensagem 1: <datos_del_sistema>{JSON de todas as fontes}</datos_del_sistema>
         ├─ histórico curto (até 12 mensagens)
         └─ pergunta
      ─► provedor (Gemini | Claude | compatível OpenAI | servidor próprio)
      ─► resposta em texto
   ├─ extractRecords(): separa os blocos ```registro {json}```
   ├─ toHtml(): texto em HTML seguro (negrito, itálico, listas)
   └─ cartões "Revisar e salvar" ─► abre o formulário do sistema já preenchido
```

## Provedores

Cada usuário configura na tela (em Configurações). Os dados ficam no `localStorage`, na chave `gdo_minuano_ai`.

| Modo (`mode`) | Chave | Custo | Observação |
|---|---|---|---|
| `gemini` | Google AI Studio (`AIza...`) | Grátis, com limite por minuto e por dia | Se o modelo estiver ocupado (503/429), tenta de novo e passa para `gemini-2.5-flash`, `gemini-flash-lite-latest`… No plano grátis o Google pode usar as conversas. |
| `key` | Anthropic (`sk-ant-...`) | Pago pelo uso | A chamada sai direto do navegador. Use só em testes ou demonstração. |
| `openai` | Qualquer API compatível com OpenAI (Groq, OpenRouter, OpenAI) | Depende | Configure o endereço (`openaiUrl`) e o modelo |
| `proxy` | Nenhuma no navegador | Pago (Claude) | **Recomendado para clientes.** A chave fica no servidor (`minuano-proxy/`). |

As assinaturas Claude Pro/Max e ChatGPT Plus **não** dão acesso à API. A API é contratada à parte (console.anthropic.com / platform.openai.com).

## Integrar em outro sistema, passo a passo

### 1. Copiar o cliente

Copie `minuano-ai.js` para o projeto e carregue-o **depois** dos scripts do sistema:

```html
<script src="./app.js"></script>
<script src="./minuano-ai.js?v=1"></script>
```

O idioma é lido de `window.I18N?.lang` (`"pt"` ou `"es"`). Se o sistema não tiver `I18N`, o padrão é espanhol. Para mudar isso, defina `window.I18N = { lang: "pt" }` antes de carregar o arquivo.

### 2. Registrar as fontes de dados

A IA só sabe o que for enviado a ela. Registre uma ou mais funções que devolvem **JSON pequeno e já calculado**. Não mande as tabelas brutas.

```js
MinuanoAI.registerSource("pecuaria", () => state.fazendas.map((f) => ({
  fazenda: f.nome,
  totalAnimais: f.categorias.reduce((s, c) => s + c.qtd, 0),
  categorias: f.categorias.map((c) => `${c.nome}: ${c.qtd}`),
  potreiros: f.potreiros.map((p) => p.nome),
  movimentosUltimos12Meses: resumoPorTipo(f.movimentos),   // {nascimento:{registros,animais,valor}, ...}
  ultimosMovimentos: f.movimentos.slice(-8).map((m) => `${m.data} ${m.tipo} ${m.qtd} ${m.categoria}`),
  sanidade: f.sanidade.slice(-6).map((r) => `${r.data} ${r.produto} ${r.qtd} ${r.categoria}`)
})));

MinuanoAI.registerSource("catalogos", () => ({
  fazendas: state.fazendas.map((f) => f.nome),
  produtosSanitarios: state.produtos
}));
```

Boas práticas:
- **Totais e resumos** valem mais que listas longas. O GDO manda cerca de 20 mil caracteres (uns 6 mil tokens) por pergunta.
- **Inclua os nomes exatos** que a IA deve usar nos registros: categorias, potreiros, fazendas, produtos.
- **Diga se são dados de demonstração** (ex.: `datosDemo: true`).
- **Nunca mande** senhas, tokens, CPF ou dados que o usuário não possa ver.

### 3. Ajustar as instruções (persona e regras)

O prompt padrão é o do GDO Agro (agrícola primeiro, pecuária complementar). Para outro sistema:

```js
MinuanoAI.configure({
  proxyUrl: "https://minuano-ia.SEU-USUARIO.workers.dev",   // opcional: servidor padrão
  storeKey: "fazendadaluz_minuano_ai",                        // opcional: nome da configuração salva
  proxyHeaders: () => ({ Authorization: `Bearer ${token}` }), // opcional: cabeçalhos para o servidor próprio
  systemPrompt: (lang, padrao) => [
    "Você é o Minuano, assessor de um sistema de gestão PECUÁRIA (Fazenda Da Luz).",
    "Foco: rebanho por categoria, movimentações, sanidade, reprodução, compras e vendas.",
    `Idioma: responda no idioma do usuário (português ou espanhol). Padrão: ${lang === "pt" ? "português" : "espanhol"}.`,
    "Use SOMENTE os dados enviados para números do sistema; se faltar dado, diga o que registrar.",
    "Respostas curtas (até ~180 palavras), **negrito** nos números-chave, listas com '-'.",
    `Hoje: ${new Date().toISOString().slice(0, 10)}.`
  ].join("\n"),
  recordsPrompt: "…regras e esquemas de registro deste sistema (ver seção 5)…"
});
```

O segundo parâmetro (`padrao`) é a função do prompt padrão, caso queira só acrescentar texto a ele: `(lang, padrao) => padrao(lang) + "\n…"`.

### 4. Ligar o chat

O mínimo para perguntar e mostrar a resposta:

```js
async function perguntar(pergunta) {
  if (!MinuanoAI.enabled()) return respostaLocal(pergunta);        // modo local do sistema
  try {
    const texto = await MinuanoAI.ask(pergunta /*, blocoClima */);
    const { text, records } = MinuanoAI.extractRecords(texto);
    mostrar(MinuanoAI.toHtml(text) + records.map(cartaoRegistro).join(""));
  } catch (err) {
    mostrar(respostaLocal(pergunta));                               // falhou: cai no local
  }
}
```

Para reaproveitar do `app.js` do GDO:
- **Microfone:** `setupMinuanoMic()` (Web Speech API, `pt-BR` ou `es-UY` conforme o idioma). Funciona no Chrome e Edge (computador e Android). No iPhone depende do Safari. Precisa de HTTPS.
- **Clima:** `MINUANO_WEATHER_WORDS`, `resolveWeatherPlace()`, `geocodePlace()`, `weatherAiBlock()`, e a busca da previsão em `fetchAdvisorForecast()`. Tudo via Open-Meteo, sem chave.
- **Selo "IA conectada / Modo local":** `updateMinuanoAiBadge()`.
- **Tela de configuração:** `minuanoAiPanel()`, `syncAiForm()` e `testMinuanoAi()` em `agro-ui.js`.

### 5. Registros por conversa ou voz

A IA devolve um bloco por registro:

````
Entendi: nasceram 4 terneiros no Campo Sede.
```registro
{"tipo":"movimiento","movimiento":"nascimento","establecimiento":"Estancia Santa Clara","categoria":"Ternero 0 a 6 meses","cantidad":4,"potrero":"Campo Sede","fecha":"2026-09-26"}
```
````

Esquemas usados no GDO (adapte os tipos e campos ao seu sistema e **descreva-os no `recordsPrompt`**):

| `tipo` | Campos |
|---|---|
| `movimiento` | `movimiento` (nascimento, compra, venda, consumo, morte, transferencia, ajuste), `establecimiento`, `categoria`, `cantidad`, `fecha`, `potrero`, `valor`, `comprador`, `destino`, `direccion` (sumar/restar), `notas` |
| `sanidad` | `establecimiento`, `categoria`, `cantidad`, `producto`, `fecha`, `potrero`, `notas` |
| `manejo` | `chacra`, `actividad`, `fecha`, `hectareas`, `maquina`, `litros`, `insumos[{insumo,cantidad}]`, `notas` |
| `costo` | `chacra`, `categoria`, `descripcion`, `valor`, `fecha` |
| `combustible` | `chacra`, `maquina`, `litros`, `hectareas`, `horas`, `fecha` |
| `observacion` | `chacra`, `texto`, `fecha` |

Regras que funcionam bem no prompt:
- **Nunca dizer "registrei".** A IA resume o que entendeu e manda o bloco.
- **Perguntar antes** quando faltar algo essencial (categoria, quantidade, fazenda).
- **Usar os nomes exatos** dos catálogos enviados.
- **Mapear sinônimos:** abate/carneada/faena = consumo; dosificação/vacina = sanidade.

No sistema, cada registro vira um cartão com o botão **Revisar e salvar**. Ele chama a mesma função que o botão "Novo registro" usa e preenche os campos. Veja `openMinuanoRecord()` (pecuária) no `app.js` e `prefillFromMinuano()` (agrícola) no `agro-ui.js`. Dicas:
- **Casar nomes de forma tolerante:** exato, depois "contém", depois singular/plural (`matchByName()`).
- **Validação e estoque ficam com o sistema:** o salvar normal é quem valida e atualiza o estoque. A IA só preenche o formulário.
- **Se um campo não bater,** deixe-o vazio no formulário para o usuário escolher.

### 6. Servidor próprio (produção)

**Sistema com backend Node/Express** (ex.: Render): crie uma rota no próprio servidor em vez do Worker. Ela deve exigir o login do sistema:

```js
app.post("/api/minuano", autenticar, express.json({ limit: "400kb" }), async (req, res) => {
  const { system, messages } = req.body || {};
  if (typeof system !== "string" || !Array.isArray(messages) || messages.length > 40) return res.status(400).json({ error: "payload" });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.MINUANO_MODEL || "claude-sonnet-5", max_tokens: 1200, system, messages })
  });
  res.status(r.status).json(await r.json());
});
```

No navegador, use o modo `proxy` com o endereço dessa rota. Para mandar o token de login do sistema:

```js
MinuanoAI.configure({ proxyUrl: `${API_URL}/api/minuano`, proxyHeaders: () => ({ Authorization: `Bearer ${tokenAtual()}` }) });
```

**Sistema só com front-end estático** (GitHub Pages): use `minuano-proxy/` (Cloudflare Worker, plano grátis). O passo a passo está no [README](../minuano-proxy/README.md). Em `ALLOWED_ORIGINS`, liste os domínios do sistema.

## Segurança e privacidade

- **Chave no navegador** (modos `key`, `gemini`, `openai`): serve para quem é dono da chave. Não configure no computador de cliente.
- **Clientes e vários usuários:** use o modo `proxy`, com a chave no servidor, login obrigatório e limite de requisições.
- **Dados enviados ao provedor:** vão os dados do resumo e as perguntas. No Gemini grátis, o Google pode usá-los para melhorar os produtos dele. Para dados reais de clientes, prefira um plano pago (Claude ou Gemini pago).
- **Nada é gravado sem o usuário salvar o formulário.** A auditoria do sistema continua registrando o salvamento normal.

## Custos e limites

- **Uma pergunta = uma chamada**, com uns 6 mil tokens de entrada. A resposta tem até 1.200 tokens.
- **Gemini grátis:** limite por minuto (cerca de 10) e por dia, que varia por modelo. Confira em aistudio.google.com.
- **Claude Sonnet 5:** alguns centavos de dólar por pergunta. **Haiku 4.5:** bem menos. Defina um limite de gasto no console.

## Testar sem gastar

Nos testes do GDO, as respostas da IA são simuladas interceptando as chamadas no navegador de teste (Puppeteer). Verifique:
1. **Conversa:** a pergunta em espanhol gera resposta e o selo mostra "IA conectada".
2. **Clima:** "chove em Artigas?" manda o bloco `<previsao_do_tempo local="Artigas…">`.
3. **Registro:** o bloco `registro` vira cartão, o botão abre o formulário certo preenchido e, ao salvar, o estoque muda.
4. **Queda:** um erro 503 cai no próximo modelo; com todos falhando, responde o modo local.

## Checklist de integração

- [ ] `minuano-ai.js` carregado depois dos scripts do sistema
- [ ] `registerSource(...)` com resumo e catálogos (nomes exatos)
- [ ] `configure({ systemPrompt, recordsPrompt })` com a persona e os registros do sistema
- [ ] Chat chamando `ask` → `extractRecords` → `toHtml`, com queda para o modo local
- [ ] Cartões "Revisar e salvar" abrindo os formulários do sistema preenchidos
- [ ] Microfone e clima (opcional)
- [ ] Tela de configuração da IA (admin)
- [ ] Produção: rota no backend ou Worker, com a chave fora do navegador
