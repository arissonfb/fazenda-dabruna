const phone = "555599627756";
const email = "zootecbruna@gmail.com";

const competencies = [
  {
    title: "Tratamento do Gado",
    icon: "heart",
    description: "Acompanhamento das condições dos animais, identificação de alterações comportamentais, orientação de manejos, controle de tratamentos e registro das intervenções realizadas.",
    activities: ["acompanhamento individual e por lote", "controle de animais em tratamento", "registro de medicamentos", "identificação de sintomas", "acompanhamento da recuperação", "separação de animais quando necessária", "observação de comportamento e consumo"],
    indicators: ["animais em tratamento", "período de tratamento", "taxa de recuperação", "reincidências", "mortalidade", "custo por tratamento"]
  },
  {
    title: "Vacinação e Sanidade",
    icon: "shield",
    description: "Planejamento e controle dos protocolos sanitários, garantindo que vacinações, vermifugações e demais procedimentos sejam realizados dentro dos períodos definidos.",
    activities: ["calendário sanitário", "controle de doses", "identificação de lotes vacinados", "datas de aplicação", "reforços", "controle de estoque", "validade dos produtos", "registro do responsável", "histórico sanitário"],
    indicators: ["percentual do rebanho vacinado", "aplicações pendentes", "custo sanitário", "ocorrências por lote", "perdas evitadas"]
  },
  {
    title: "Gestão de Pastagens",
    icon: "leaf",
    description: "Planejamento da utilização das áreas de pastagem, acompanhando capacidade, disponibilidade, rotação, recuperação e adequação da alimentação ao número de animais.",
    activities: ["identificação das pastagens", "controle por fazenda e potreiro", "rotação de lotes", "períodos de descanso", "implantação de pastagens", "milho", "milheto", "azevém", "avaliação visual", "disponibilidade de alimento", "planejamento sazonal"],
    indicators: ["área utilizada", "lotação por hectare", "período de ocupação", "período de descanso", "custo por área", "disponibilidade estimada", "desempenho animal por pastagem"]
  },
  {
    title: "Alambrados e Estrutura Rural",
    icon: "fence",
    description: "Planejamento, acompanhamento e registro dos serviços de alambrado necessários para garantir segurança, divisão adequada das áreas e melhor organização do manejo.",
    activities: ["instalação de alambrados", "manutenção", "troca de postes", "troca de arames", "porteiras", "cercas elétricas", "divisão de potreiros", "registros fotográficos", "medição dos serviços", "controle de custos"],
    indicators: ["metros executados", "custo por metro", "gasto mensal", "gasto anual", "serviços por fazenda", "serviços por potreiro", "manutenção preventiva", "manutenção corretiva"]
  },
  {
    title: "Reprodução",
    icon: "cycle",
    description: "Organização e acompanhamento dos processos reprodutivos, permitindo maior previsibilidade, controle e eficiência na formação do rebanho.",
    activities: ["identificação de matrizes", "identificação de reprodutores", "controle de cio", "inseminação", "monta natural", "diagnóstico de gestação", "previsão de parto", "acompanhamento das matrizes", "registro de ocorrências", "histórico reprodutivo"],
    indicators: ["taxa de prenhez", "taxa de concepção", "intervalo entre partos", "número de matrizes", "matrizes vazias", "previsão de nascimentos", "eficiência por reprodutor"]
  },
  {
    title: "Controle de Natalidade",
    icon: "calf",
    description: "Registro e acompanhamento dos nascimentos, com identificação dos animais, vínculo materno, peso, sexo, ocorrências e evolução inicial.",
    activities: ["registro do nascimento", "identificação da mãe", "identificação do pai quando disponível", "data e horário", "sexo", "peso ao nascer", "raça", "fazenda", "potreiro", "ocorrências no parto", "acompanhamento inicial", "mortalidade neonatal"],
    indicators: ["nascimentos mensais", "nascimentos anuais", "distribuição por sexo", "peso médio ao nascer", "taxa de sobrevivência", "matrizes com maior desempenho", "período de maior concentração de partos"]
  },
  {
    title: "Compra e Venda",
    icon: "trade",
    description: "Organização das movimentações comerciais do rebanho, permitindo acompanhar origem, destino, valores, custos, receitas e histórico dos animais negociados.",
    activities: ["cadastro da compra", "cadastro da venda", "identificação dos animais", "quantidade", "peso", "valor por cabeça", "valor por quilograma", "fornecedor", "comprador", "fazenda de origem", "fazenda de destino", "documentos", "histórico da negociação"],
    indicators: ["total comprado", "total vendido", "preço médio", "receita", "custo de aquisição", "resultado estimado", "volume mensal", "volume anual"]
  },
  {
    title: "Engorda e Desempenho",
    icon: "chart",
    description: "Acompanhamento do desenvolvimento dos animais, possibilitando avaliar ganho de peso, período de permanência, alimentação e momento adequado para comercialização.",
    activities: ["pesagens", "controle de entrada", "controle de saída", "peso inicial", "peso atual", "peso final", "ganho médio diário", "dias de permanência", "lote", "pastagem", "suplementação", "previsão de venda"],
    indicators: ["ganho médio diário", "ganho total", "custo por quilograma produzido", "peso médio por lote", "tempo médio de engorda", "desempenho por fazenda", "desempenho por potreiro", "animais próximos ao peso de venda"]
  }
];

const icons = {
  heart: '<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 20 6v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6l8-3Z"/><path d="m9 12 2 2 4-5"/></svg>',
  leaf: '<svg viewBox="0 0 24 24"><path d="M4 20c8-1 14-7 16-16C11 5 5 11 4 20Z"/><path d="M4 20c4-5 8-8 13-10"/></svg>',
  fence: '<svg viewBox="0 0 24 24"><path d="M5 4v16M19 4v16M3 9h18M3 15h18"/></svg>',
  cycle: '<svg viewBox="0 0 24 24"><path d="M17 2v5h-5"/><path d="M7 22v-5h5"/><path d="M19 9a7 7 0 0 0-12-4"/><path d="M5 15a7 7 0 0 0 12 4"/></svg>',
  calf: '<svg viewBox="0 0 24 24"><path d="M6 10c0-3 2-5 6-5s6 2 6 5v4c0 3-2 5-6 5s-6-2-6-5v-4Z"/><path d="M6 11 3 8M18 11l3-3M9 13h.1M15 13h.1M10 16h4"/></svg>',
  trade: '<svg viewBox="0 0 24 24"><path d="M7 7h14l-4-4"/><path d="M17 17H3l4 4"/><path d="M8 12h8"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-7"/></svg>'
};

function list(items) {
  return "<ul>" + items.map((item) => `<li>${item}</li>`).join("") + "</ul>";
}

function renderCompetencies() {
  const target = document.getElementById("competencyList");
  target.innerHTML = competencies.map((item) => `
    <article class="competency reveal">
      <div class="competency-top">
        <span class="icon" aria-hidden="true">${icons[item.icon]}</span>
        <h3>${item.title}</h3>
      </div>
      <p>${item.description}</p>
      <div class="detail-grid">
        <div><h4>Atividades</h4>${list(item.activities)}</div>
        <div><h4>Indicadores</h4>${list(item.indicators)}</div>
      </div>
    </article>
  `).join("");
}

function initHeader() {
  const header = document.getElementById("siteHeader");
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("navMenu");
  const syncHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.tagName !== "A") return;
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  });
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
}

function initForm() {
  const form = document.getElementById("contactForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const message = [
      "Olá, Bruna. Vim pelo seu portfólio profissional.",
      "",
      `Nome: ${data.get("nome") || ""}`,
      `Telefone: ${data.get("telefone") || ""}`,
      `Assunto: ${data.get("assunto") || ""}`,
      `Mensagem: ${data.get("mensagem") || ""}`
    ].join("\n");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  });
}

function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const img = lightbox.querySelector("img");
  const close = document.getElementById("closeLightbox");
  document.querySelectorAll(".gallery button").forEach((button) => {
    button.addEventListener("click", () => {
      img.src = button.dataset.src;
      img.alt = button.querySelector("img").alt;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      close.focus();
    });
  });
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    img.src = "";
  }
  close.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
renderCompetencies();
initHeader();
initReveal();
initForm();
initLightbox();
