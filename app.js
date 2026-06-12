const STORAGE_KEY = "painelPecuarioBruna.v1";
const API_URL = "https://painel-pecuario-api.onrender.com";
const MOBILE_APP_CONFIG = {
  androidDownloadUrl: "",
  iosDownloadUrl: "",
  androidFallbackUrl: "",
  iosFallbackUrl: "",
  webUrl: ""
};

const FARM_CODE_PREFIXES = {
  "fazenda-01": "F1",
  "fazenda-02": "F2",
  "fazenda-03": "F3",
};

function getFarmCodePrefix(farmId) {
  if (FARM_CODE_PREFIXES[farmId]) return FARM_CODE_PREFIXES[farmId];
  return (farmId || "X").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "X";
}

function generateMovementCode(farm) {
  farm.movementCodeSequence = (farm.movementCodeSequence || 0) + 1;
  const prefix = getFarmCodePrefix(farm.id);
  return prefix + String(farm.movementCodeSequence).padStart(5, "0");
}

function generateSanitaryCode(farm) {
  farm.sanitaryCodeSequence = (farm.sanitaryCodeSequence || 0) + 1;
  const prefix = getFarmCodePrefix(farm.id);
  return `SAN-${prefix}-${String(farm.sanitaryCodeSequence).padStart(5, "0")}`;
}

function generateReproductionCode(farm) {
  farm.reproductionCodeSequence = (farm.reproductionCodeSequence || 0) + 1;
  const prefix = getFarmCodePrefix(farm.id);
  return `REP-${prefix}-${String(farm.reproductionCodeSequence).padStart(5, "0")}`;
}

function extractMovementCodeSequence(code, farmId) {
  if (typeof code !== "string" || !code.trim()) return 0;
  const prefix = getFarmCodePrefix(farmId);
  const normalized = code.trim().toUpperCase();
  const prefixMatch = normalized.startsWith(prefix)
    ?normalized.slice(prefix.length).match(/(\d+)$/)
    : null;
  if (prefixMatch) {
    return Number(prefixMatch[1] || 0);
  }
  const fallbackMatch = normalized.match(/(\d+)$/);
  return fallbackMatch ?Number(fallbackMatch[1] || 0) : 0;
}

function compareMovementOrder(a, b) {
  const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
  if (dateCompare !== 0) return dateCompare;

  const sourceCompare = String(a.sourceId || "").localeCompare(String(b.sourceId || ""));
  if (sourceCompare !== 0) return sourceCompare;

  return String(a.id || "").localeCompare(String(b.id || ""));
}

function ensureMovementCodesForFarm(farm) {
  const prefix = getFarmCodePrefix(farm.id);
  const ordered = [...farm.movements].sort(compareMovementOrder);

  ordered.forEach((movement, index) => {
    movement.code = prefix + String(index + 1).padStart(5, "0");
  });

  farm.movementCodeSequence = ordered.length;
}

function ensureSanitaryCodesForFarm(farm) {
  const prefix = getFarmCodePrefix(farm.id);
  const ordered = [...farm.sanitaryRecords].sort(compareMovementOrder);

  ordered.forEach((record, index) => {
    record.code = `SAN-${prefix}-${String(index + 1).padStart(5, "0")}`;
  });

  farm.sanitaryCodeSequence = ordered.length;
}

const MOVEMENT_TYPES = [
  { value: "compra", label: "Compra", direction: 1 },
  { value: "venda", label: "Venda", direction: -1 },
  { value: "consumo", label: "Consumo", direction: -1 },
  { value: "nascimento", label: "Nascimento", direction: 1 },
  { value: "morte", label: "Morte", direction: -1 },
  { value: "ajuste", label: "Ajuste manual", direction: 0 },
  { value: "transferencia", label: "Transferência", direction: 0 }
];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

const COLORS = [
  "#335c43",
  "#d39b5c",
  "#8a4b38",
  "#6f5f4d",
  "#7b9b6d",
  "#9d745f",
  "#517a60",
  "#bf7e42",
  "#5a4536"
];

const CATEGORY_VISUALS = {
  vaca: "./assets/cow.svg",
  terneiro: "./assets/calf.svg",
  touro: "./assets/bull.svg",
  rebanho: "./assets/herd.svg"
};

const STANDARD_FARM_CATEGORIES = [
  { id: "vacas-cria", name: "Vacas de cria" },
  { id: "terneiros-machos", name: "Terneiros 1 a 2 anos - machos" },
  { id: "terneiros-femeas", name: "Terneiros 1 a 2 anos - fêmeas" },
  { id: "bois-abate", name: "Bois de abate" },
  { id: "novilhas-entouradas", name: "Novilhas entouradas" },
  { id: "touros", name: "Touros" },
  { id: "vacas-invernar", name: "Vacas de invernar" },
  { id: "vacas-entouradas", name: "Vacas entouradas" }
];

const STANDARD_OVINO_CATEGORIES = [
  { id: "cordeiro", name: "Cordeiro" },
  { id: "borrego", name: "Borrego" },
  { id: "ovelha", name: "Ovelha" },
  { id: "carneiro", name: "Carneiro" },
  { id: "outros-ovinos", name: "Outros" }
];

const MONTHLY_REPORT_CATEGORIES = [
  { value: "estoque", label: "Controle de estoque animal" },
  { value: "sanitario", label: "Atividades sanitárias" },
  { value: "comercial", label: "Compra e venda" },
  { value: "operacional", label: "Operacional" },
  { value: "outros", label: "Outros" }
];

const DEFAULT_SANITARY_PRODUCTS = ["Vacina aftosa", "Vermífugo", "Ivermectina"];
const DEFAULT_POTREIROS = [];
const LEGACY_POTREIRO_PLACEHOLDERS = ["Potreiro 1", "Potreiro 2", "Potreiro Norte"];
const PREMIUM_SALE_FARMS = new Set(["arapey", "chiquita"]);
// Farms that operate in USD (Uruguay-based); all others use BRL
const FARM_CURRENCY_MAP = {};
const TOTAL_FARM_ID = "total";
const UNALLOCATED_POTREIRO_KEY = "__unallocated__";
const ARAPEY_PRIMARY_GEO_KEYS = new Set([
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "tapera",
  "pedreira",
  "costa",
  "molino",
  "chacra 10",
  "las pampas",
  "cerrillada",
  "piq rincon",
  "prad 7",
  "prad 8"
]);
const PDF_LOGO_PATH = "./assets/logo-da-bruna-transp.svg";
const PDF_COVER_IMAGE_PATH = "./assets/angus.jpg";
const ADMINISTRATOR_NAME = "Bruna Carvalho";
const TECHNICAL_MANAGER_NAME = "Bruna Castro";
const MOVEMENT_PHOTO_TYPES = new Set(["compra", "venda", "morte", "consumo", "nascimento", "transferencia", "ajuste"]);
const MAX_MOVEMENT_PHOTOS = 6;
const MOVEMENT_PHOTO_MAX_DIMENSION = 1280;
const MOVEMENT_PHOTO_QUALITY = 0.82;
const CLOUDINARY_CLOUD_NAME = "dsmpclqqa";
const CLOUDINARY_UPLOAD_PRESET = "m6pymz4w";
const BACKUP_DATE_KEY = "painelPecuarioBruna.lastBackup";
const BACKUP_WARN_DAYS = 7;
const DEFAULT_USERS = [
  { id: "admin-bruna", login: "admin", role: "admin" },
  { id: "user-bruna", login: "demo", role: "usuario" }
];

const IMPORTED_SANITARY_RECORDS = {
  arapey: [
    { sourceId: "xls-san-2026-03-31-arapey-campo-3-vacas-solteira", date: "2026-03-31", quantity: 162, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Campo 3", product: "Potenty", notes: "" },
    { sourceId: "xls-san-2026-03-31-arapey-campo-10-vaquillonas", date: "2026-03-31", quantity: 405, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "Campo 10", product: "Potenty", notes: "" },
    { sourceId: "xls-san-2026-03-31-arapey-campo-2-terneiros-0-1", date: "2026-03-31", quantity: 181, categoryId: "terneiros-0-1", categoryName: "Terneiros 0-1", potreiro: "Campo 2", product: "Dueto + Clostridiose+potenty", notes: "" },
    { sourceId: "xls-san-2026-03-31-arapey-campo-8-vacas-de-cria", date: "2026-03-31", quantity: 231, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 8", product: "Abamectina + Potenty", notes: "ESTAO NO CAMPO 5" },
    { sourceId: "xls-san-2026-03-31-arapey-cerrillada-terneiros-e-no", date: "2026-03-31", quantity: 551, categoryId: "terneiros-e-novillos", categoryName: "Terneiros E Novillos", potreiro: "Cerrillada", product: "Exolt", notes: "427 TERNEIROS - 117 NOVILLOS" },
    { sourceId: "xls-san-2026-03-26-arapey-campo-2-terneiros-0-1", date: "2026-03-26", quantity: 251, categoryId: "terneiros-0-1", categoryName: "Terneiros 0-1", potreiro: "Campo 2", product: "Dueto + Clostridiose+potenty", notes: "" },
    { sourceId: "xls-san-2026-03-25-arapey-campo-10-vaquillonas", date: "2026-03-25", quantity: 405, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "Campo 10", product: "Potenty + Flok", notes: "" },
    { sourceId: "xls-san-2026-03-25-arapey-campo-5-vacas-de-cria", date: "2026-03-25", quantity: 313, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 5", product: "Potenty", notes: "ESTAO CAMPOS 5 E 3 JUNTOS" },
    { sourceId: "xls-san-2026-03-15-arapey-campo-8-vacas-de-cria", date: "2026-03-15", quantity: 274, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 8", product: "Potenty + Iver 1%", notes: "203 TERNEIROS / HAVIA MUITAS VAQUILLONAS JUNTO" },
    { sourceId: "xls-san-2026-03-13-arapey-campo-3-comida-bois", date: "2026-03-13", quantity: 115, categoryId: "bois", categoryName: "Bois", potreiro: "Campo 3 / Comida", product: "Fluron Gold + Iver 1% + Closantel", notes: "TOTAL 548 / FALTOU 3" },
    { sourceId: "xls-san-2026-03-13-arapey-campo-7-terneiros", date: "2026-03-13", quantity: 433, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Campo 7", product: "Fluron Gold + Iver 1% + Closantel", notes: "" },
    { sourceId: "xls-san-2026-03-09-arapey-chacra-do-10-touros", date: "2026-03-09", quantity: 126, categoryId: "touros", categoryName: "Touros", potreiro: "Chacra Do 10", product: "Potenty + Iver 1%", notes: "" },
    { sourceId: "xls-san-2026-03-05-arapey-campo-2-vacas-solteira", date: "2026-03-05", quantity: 162, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Campo 2", product: "Potenty + Iver 1%", notes: "" },
    { sourceId: "xls-san-2026-03-05-arapey-campo-5-vacas-de-cria", date: "2026-03-05", quantity: 141, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 5", product: "Potenty + Iver 1%", notes: "141 VC 118 TER" },
    { sourceId: "xls-san-2026-02-24-arapey-campo-7-vacas-de-cria", date: "2026-02-24", quantity: 267, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 7", product: "Exolt", notes: "267 VC 231 TER // CERTAMENTE TEM VACA DO 5" },
    { sourceId: "xls-san-2026-02-24-arapey-campo-6-vacas-de-cria", date: "2026-02-24", quantity: 90, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 6", product: "Potenty + Injetavel", notes: "90 VC 69 TER" },
    { sourceId: "xls-san-2026-02-23-arapey-campo-3-vacas-de-cria", date: "2026-02-23", quantity: 193, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 3", product: "Potenty + Injetavel", notes: "193 VC 151 TER(NOS TERNEIROS MOXIDECTINA E INSEMAx)" },
    { sourceId: "xls-san-2026-02-11-arapey-campo-7-vacas-de-cria", date: "2026-02-11", quantity: 256, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 7", product: "Potenty + Flok", notes: "256 VC 226 TER 10 TOR" },
    { sourceId: "xls-san-2026-02-11-arapey-campo-5-vacas-de-cria", date: "2026-02-11", quantity: 150, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 5", product: "Potenty + Flok", notes: "150 VC 118 TER 9 TOR" },
    { sourceId: "xls-san-2026-02-11-arapey-cerrillada-novillos", date: "2026-02-11", quantity: 153, categoryId: "novillos", categoryName: "Novillos", potreiro: "Cerrillada", product: "Fortik 4 + Flok", notes: "NOVILLOS COLA CORTA" },
    { sourceId: "xls-san-2026-02-09-arapey-cerrillada-novillos", date: "2026-02-09", quantity: 529, categoryId: "novillos", categoryName: "Novillos", potreiro: "Cerrillada", product: "Fortik 4 + Flok", notes: "Novillos cola larga  e TERNEIROS" },
    { sourceId: "xls-san-2026-02-05-arapey-chacra-do-10-toros", date: "2026-02-05", quantity: 46, categoryId: "toros", categoryName: "Toros", potreiro: "Chacra Do 10", product: "Pontenty + Iver", notes: "" },
    { sourceId: "xls-san-2026-02-05-arapey-campo-1-terneiros-m", date: "2026-02-05", quantity: 28, categoryId: "terneiros-m", categoryName: "Terneiros M", potreiro: "Campo 1", product: "Moxedectina + Potenty", notes: "" },
    { sourceId: "xls-san-2026-02-05-arapey-campo-2-vacas-solteira", date: "2026-02-05", quantity: 164, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Campo 2", product: "Potenty + Flok", notes: "164 VC 6 TOUR" },
    { sourceId: "xls-san-2026-02-03-arapey-campo-8-vacas-de-cria", date: "2026-02-03", quantity: 230, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 8", product: "Potenty + Flok", notes: "230 VC 209 TER 21 TOR" },
    { sourceId: "xls-san-2026-02-03-arapey-campo-10-vacas-de-cria", date: "2026-02-03", quantity: 173, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 10", product: "Potenty + Flok", notes: "173 VC 141 TER 13 TOR" },
    { sourceId: "xls-san-2026-02-03-arapey-campo-6-vacas-de-cria", date: "2026-02-03", quantity: 90, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 6", product: "Moxedectina + Potenty", notes: "90 VC 70 TER 3 TOR" },
    { sourceId: "xls-san-2026-01-30-arapey-campo-3-vacas-solteira", date: "2026-01-30", quantity: 393, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Campo 3", product: "Potenty + Flok", notes: "393 VC 21 TOR" },
    { sourceId: "xls-san-2026-01-29-arapey-campo-9-terneiras-1-2", date: "2026-01-29", quantity: null, categoryId: "terneiras-1-2", categoryName: "Terneiras 1-2", potreiro: "Campo 9", product: "Potenty", notes: "VER QUANTIDADE" },
    { sourceId: "xls-san-2026-01-28-arapey-campo-7-vacas-de-cria", date: "2026-01-28", quantity: 257, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 7", product: "Potenty", notes: "SAIRAM 5 VACAS E 5 TERNEIROS - FICARAM 252 VC 214 TER 12 TOR" },
    { sourceId: "xls-san-2026-01-21-arapey-campo-5-vacas-de-cria", date: "2026-01-21", quantity: 153, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 5", product: "Potenty", notes: "SAIRAM 11 VACAS E 8 TERNEIROS - FICARAM 142 VC 117 TER 6 TOR" },
    { sourceId: "xls-san-2026-01-21-arapey-campo-4-novillos", date: "2026-01-21", quantity: 109, categoryId: "novillos", categoryName: "Novillos", potreiro: "Campo 4", product: "Nexlander", notes: "107+2 RENGOS" },
    { sourceId: "xls-san-2026-01-21-arapey-cerrillada-novillos", date: "2026-01-21", quantity: 144, categoryId: "novillos", categoryName: "Novillos", potreiro: "Cerrillada", product: "Fipronil", notes: "" },
    { sourceId: "xls-san-2026-01-21-arapey-cerrillada-terneiros", date: "2026-01-21", quantity: 381, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Cerrillada", product: "Fipronil", notes: "TOTAL CERRILLADA 682 COM A VACA" },
    { sourceId: "xls-san-2026-01-20-arapey-cerrillada-novillos", date: "2026-01-20", quantity: 156, categoryId: "novillos", categoryName: "Novillos", potreiro: "Cerrillada", product: "Fipronil + Nexlaner Em 50", notes: "" },
    { sourceId: "xls-san-2026-01-19-arapey-campo-8-vaca-de-cria", date: "2026-01-19", quantity: 225, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Campo 8", product: "Potenty + Iver 3,15", notes: "SAIRAM 35 VACAS TOTAL 155 VACAS 154 TERNEIROS" },
    { sourceId: "xls-san-2026-01-19-arapey-campo-2-vacas-solteira", date: "2026-01-19", quantity: 190, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Campo 2", product: "Potenty + Iver 3,15", notes: "" },
    { sourceId: "xls-san-2026-01-17-arapey-campo-3-vaquillona", date: "2026-01-17", quantity: 384, categoryId: "vaquillona", categoryName: "Vaquillona", potreiro: "Campo 3", product: "Potenty + Iver 3,15", notes: "" },
    { sourceId: "xls-san-2026-01-13-arapey-campo-10-vaca-de-cria", date: "2026-01-13", quantity: null, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Campo 10", product: "Potenty + Iver 3,15", notes: "" },
    { sourceId: "xls-san-2026-01-13-arapey-campo-5-vaca-de-cria", date: "2026-01-13", quantity: 146, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Campo 5", product: "Potenty + Iver 3,15", notes: "146 VC 123 TER 6 TOUR" },
    { sourceId: "xls-san-2026-01-08-arapey-campo-6-vaca-de-cria", date: "2026-01-08", quantity: 90, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Campo 6", product: "Potenty + Iver 3,15", notes: "90 VC 69 TER 3 TOR" },
    { sourceId: "xls-san-2026-01-08-arapey-campo-7-vaca-de-cria", date: "2026-01-08", quantity: 270, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Campo 7", product: "Potenty + Iver 3,15", notes: "270VC 245 TER 4 TOR" },
    { sourceId: "xls-san-2026-01-08-arapey-cerrillada-novillos", date: "2026-01-08", quantity: 314, categoryId: "novillos", categoryName: "Novillos", potreiro: "Cerrillada", product: "Fc30 + Closantel + Fluazuron", notes: "684 TOTAL -OK" },
    { sourceId: "xls-san-2026-01-07-arapey-cerrillada-terneiros", date: "2026-01-07", quantity: 370, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Cerrillada", product: "Fc30 + Closantel + Fluazuron", notes: "" },
    { sourceId: "xls-san-2025-12-26-arapey-tapera-campo-9-terneiras", date: "2025-12-26", quantity: 384, categoryId: "terneiras", categoryName: "Terneiras", potreiro: "Tapera-> Campo 9", product: "Potenty + Closantel + Iver 3,15", notes: "382 FORAM PRA O 9 , TERIA QUE SER 388" },
    { sourceId: "xls-san-2025-12-26-arapey-campo-1-las-pampa-vaca-ivernar", date: "2025-12-26", quantity: 66, categoryId: "vaca-ivernar", categoryName: "Vaca Ivernar", potreiro: "Campo 1 -> Las Pampa", product: "Nexlander", notes: "VAI FICAR MENOS PORQUE TEM UMAS DE CRIA" },
    { sourceId: "xls-san-2025-12-22-arapey-campo-7-vaca-primipara", date: "2025-12-22", quantity: 270, categoryId: "vaca-primipara", categoryName: "Vaca Primipara", potreiro: "Campo 7", product: "Potenty", notes: "240 TERNEIRO, 8 TOURO" },
    { sourceId: "xls-san-2025-12-22-arapey-campo-4-bois-gordo", date: "2025-12-22", quantity: 149, categoryId: "bois-gordo", categoryName: "Bois Gordo", potreiro: "Campo 4", product: "Nexlander", notes: "141 SÃO BOIS , RESTO TOURINHOS" },
    { sourceId: "xls-san-2025-12-19-arapey-campo-6-vacas-de-cria", date: "2025-12-19", quantity: 86, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 6", product: "Potenty", notes: "72 TERNEIRO , 5 TOUROS" },
    { sourceId: "xls-san-2025-12-19-arapey-campo-5-vacas-de-cria", date: "2025-12-19", quantity: 147, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 5", product: "Potenty", notes: "117 TERNEIRO 6 TOUROS" },
    { sourceId: "xls-san-2025-12-19-arapey-campo-3-vacas-solteira", date: "2025-12-19", quantity: 344, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Campo 3", product: "Potenty", notes: "FALTA VACA DOS 2 LOTES - CONFERIR - 9 TOURO" },
    { sourceId: "xls-san-2025-12-18-arapey-campo-2-vacas-solteira", date: "2025-12-18", quantity: 206, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Campo 2", product: "Potenty", notes: "6 TOUROS" },
    { sourceId: "xls-san-2025-12-15-arapey-campo-8-vacas-de-cria", date: "2025-12-15", quantity: 257, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 8", product: "Potenty", notes: "ESTA NA COSTA , NÃO TENHO CERTEZA A QUANTIDADA, TERNEIROS 247" },
    { sourceId: "xls-san-2025-12-14-arapey-campo-3-vacas-solteira", date: "2025-12-14", quantity: 216, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Campo 3", product: "Fc 30 + Amitraz + Aba 1%", notes: "VAQUILLONAS JUNTO" },
    { sourceId: "xls-san-2025-12-01-arapey-campo-2-vacas-solteira", date: "2025-12-01", quantity: 350, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Campo 2", product: "Fc 30 + Amitraz + Aba 1%", notes: "VAQUILLONAS JUNTO" },
    { sourceId: "xls-san-2025-11-29-arapey-chacra-do-10-touros", date: "2025-11-29", quantity: 75, categoryId: "touros", categoryName: "Touros", potreiro: "Chacra Do 10", product: "Nexlander", notes: "" },
    { sourceId: "xls-san-2025-11-27-arapey-las-pampas-terneiras", date: "2025-11-27", quantity: 74, categoryId: "terneiras", categoryName: "Terneiras", potreiro: "Las Pampas", product: "Fluron Gold", notes: "" },
    { sourceId: "xls-san-2025-11-27-arapey-molino-bois-pr-gordo", date: "2025-11-27", quantity: 66, categoryId: "bois-pr-gordo", categoryName: "Bois Pré Gordo", potreiro: "Molino", product: "Insemax", notes: "" },
    { sourceId: "xls-san-2025-11-27-arapey-tapera-terneiras", date: "2025-11-27", quantity: null, categoryId: "terneiras", categoryName: "Terneiras", potreiro: "Tapera", product: "Carbeson", notes: "FALTOU CONTA" },
    { sourceId: "xls-san-2025-10-26-arapey-campo-7-vaca-primipara", date: "2025-10-26", quantity: null, categoryId: "vaca-primipara", categoryName: "Vaca Primipara", potreiro: "Campo 7", product: "Carbeson", notes: "FALTOU CONTA" },
    { sourceId: "xls-san-2025-11-20-arapey-campo-8-vacas-cria", date: "2025-11-20", quantity: 253, categoryId: "vacas-cria", categoryName: "Vacas Cria", potreiro: "Campo 8", product: "Fc 30 + Amitraz + Aba 1%", notes: "238 TERNEIROS + 9 TOUROS" },
    { sourceId: "xls-san-2025-11-17-arapey-campo-7-vacas-cria", date: "2025-11-17", quantity: 111, categoryId: "vacas-cria", categoryName: "Vacas Cria", potreiro: "Campo 7", product: "Fc 30 + Amitraz + Aba 1%", notes: "92 TERNEIROS" },
    { sourceId: "xls-san-2025-11-17-arapey-cerrillada-terneiros", date: "2025-11-17", quantity: 392, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Cerrillada", product: "Nexlander", notes: "685 TOTAL + 1 VACA CRIA" },
    { sourceId: "xls-san-2025-11-17-arapey-cerrillada-novillos", date: "2025-11-17", quantity: 294, categoryId: "novillos", categoryName: "Novillos", potreiro: "Cerrillada", product: "Nexlander", notes: "" },
    { sourceId: "xls-san-2025-11-17-arapey-campo-6-vaca-de-cria", date: "2025-11-17", quantity: 109, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Campo 6", product: "Fc 30 + Amitraz + Aba 1%", notes: "48 terneiros 3 touros" },
    { sourceId: "xls-san-2025-11-13-arapey-campo-5-vaca-plantel", date: "2025-11-13", quantity: 138, categoryId: "vaca-plantel", categoryName: "Vaca Plantel", potreiro: "Campo 5", product: "Fc 30 + Amitraz + Aba 1%", notes: "146 terneiro 5 touro" },
    { sourceId: "xls-san-2025-11-11-arapey-chacra-10-touros", date: "2025-11-11", quantity: 75, categoryId: "touros", categoryName: "Touros", potreiro: "Chacra 10", product: "Fluron Gold + Iver 4%", notes: "" },
    { sourceId: "xls-san-2025-11-11-arapey-campo-2-terneiras", date: "2025-11-11", quantity: 372, categoryId: "terneiras", categoryName: "Terneiras", potreiro: "Campo 2", product: "Fc 30 + Abamectina 1% + Levamisol", notes: "FORAM PARA TAPERA / FALTOU 2" },
    { sourceId: "xls-san-2025-11-10-arapey-costa-vacas-solteira", date: "2025-11-10", quantity: 211, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Costa", product: "Fc 30", notes: "TOQUE / SAIRAM 12 PRENHA" },
    { sourceId: "xls-san-2025-11-04-arapey-pedreira-vaquillons", date: "2025-11-04", quantity: 361, categoryId: "vaquillons", categoryName: "Vaquillons", potreiro: "Pedreira", product: "Fc 30", notes: "TOQUE / TODAS VAZIAS" },
    { sourceId: "xls-san-2025-11-04-arapey-cerrillada-novillos", date: "2025-11-04", quantity: 283, categoryId: "novillos", categoryName: "Novillos", potreiro: "Cerrillada", product: "Fc 30 + Levamisol + Flok 1%", notes: "TOTAL 681 - FALTAM 2" },
    { sourceId: "xls-san-2025-11-04-arapey-cerrillada-terneiros", date: "2025-11-04", quantity: 398, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Cerrillada", product: "Fc 30 + Levamisol + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-10-31-arapey-pedreira-rincon-vaquillonas", date: "2025-10-31", quantity: 396, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "Pedreira (rincon)", product: "Furius + Flok 1%", notes: "FALTARIA 1" },
    { sourceId: "xls-san-2025-10-30-arapey-costa-rincon-vacas-solteira", date: "2025-10-30", quantity: 186, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Costa (rincon)", product: "Furius + Flok 1%", notes: "2 A MAIS DO LOTE" },
    { sourceId: "xls-san-2025-10-30-arapey-tapera-rincon-vacas-invernad", date: "2025-10-30", quantity: 60, categoryId: "vacas-invernada", categoryName: "Vacas Invernada", potreiro: "Tapera (rincon)", product: "Maximo", notes: "3 ESTA COM CRIA AO PÉ 2 SÃO ARRENA" },
    { sourceId: "xls-san-2025-10-30-arapey-molino-rincon-bois-pr-gordo", date: "2025-10-30", quantity: 66, categoryId: "bois-pr-gordo", categoryName: "Bois Pré Gordo", potreiro: "Molino (rincon)", product: "Maximo + Moxidectina", notes: "3 ESTAO NO 4" },
    { sourceId: "xls-san-2025-10-20-arapey-las-pampas-terneiros-0-1", date: "2025-10-20", quantity: 74, categoryId: "terneiros-0-1", categoryName: "Terneiros 0-1", potreiro: "Las Pampas", product: "Furius + Flok 1%", notes: "MORREU 1" },
    { sourceId: "xls-san-2025-10-15-arapey-cerrillada-terneiros-0-1", date: "2025-10-15", quantity: 396, categoryId: "terneiros-0-1", categoryName: "Terneiros 0-1", potreiro: "Cerrillada", product: "Furius + Iver + Nitroxinil", notes: "" },
    { sourceId: "xls-san-2025-10-15-arapey-campo-2-terneiras-0-1", date: "2025-10-15", quantity: 373, categoryId: "terneiras-0-1", categoryName: "Terneiras 0-1", potreiro: "Campo 2", product: "Furius + Iver + Nitroxinil", notes: "FALTOU 1" },
    { sourceId: "xls-san-2025-10-14-arapey-chacra-10-touros", date: "2025-10-14", quantity: 115, categoryId: "touros", categoryName: "Touros", potreiro: "Chacra 10", product: "Furius + Iver + Nitroxinil", notes: "FALTOU 1 QUE ESTA NO 4" },
    { sourceId: "xls-san-2025-10-13-arapey-campo-10-vacas-cria", date: "2025-10-13", quantity: 139, categoryId: "vacas-cria", categoryName: "Vacas Cria", potreiro: "Campo 10", product: "Supratick + Flok 1%", notes: "135 TERNEIROS - TREO" },
    { sourceId: "xls-san-2025-10-07-arapey-campo-3-vacas-cria", date: "2025-10-07", quantity: 154, categoryId: "vacas-cria", categoryName: "Vacas Cria", potreiro: "Campo 3", product: "Supratick + Flok 1%", notes: "145 TERNEIROS - TREO" },
    { sourceId: "xls-san-2025-10-07-arapey-campo-1-vacas-cria", date: "2025-10-07", quantity: 59, categoryId: "vacas-cria", categoryName: "Vacas Cria", potreiro: "Campo 1", product: "Supratick + Flok 1%", notes: "57 VACA 1 VAQ 1 TERNEIRA" },
    { sourceId: "xls-san-2025-10-02-arapey-campo-8-vacas-cria", date: "2025-10-02", quantity: 250, categoryId: "vacas-cria", categoryName: "Vacas Cria", potreiro: "Campo 8", product: "Supratick + Flok 1%", notes: "210 TERNEIROS - TREO" },
    { sourceId: "xls-san-2025-10-01-arapey-las-pampas-terneiros-0-1", date: "2025-10-01", quantity: 75, categoryId: "terneiros-0-1", categoryName: "Terneiros 0-1", potreiro: "Las Pampas", product: "Supratick + Iver + Nitroxinil", notes: "FALTOU 2" },
    { sourceId: "xls-san-2025-09-30-arapey-campo-5-vacas-prenha", date: "2025-09-30", quantity: 146, categoryId: "vacas-prenha", categoryName: "Vacas Prenha", potreiro: "Campo 5", product: "Supratick + Flok 1%", notes: "76 TERNEIROS - TREO" },
    { sourceId: "xls-san-2025-09-30-arapey-pedreira-p-rincon-vacas-solteira", date: "2025-09-30", quantity: 192, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Pedreira - P. Rincon", product: "Reprodutiva", notes: "" },
    { sourceId: "xls-san-2025-09-27-arapey-campo-6-vacas-pre-adas", date: "2025-09-27", quantity: 109, categoryId: "vacas-pre-adas", categoryName: "Vacas Preñadas", potreiro: "Campo 6", product: "Supratick + Flok", notes: "" },
    { sourceId: "xls-san-2025-09-27-arapey-moinho-posto-rinco-noviilos", date: "2025-09-27", quantity: 69, categoryId: "noviilos", categoryName: "Noviilos", potreiro: "Moinho (posto Rincon)", product: "Maximo + Albendazole", notes: "" },
    { sourceId: "xls-san-2025-09-24-arapey-cerrillada-288-novillos", date: "2025-09-24", quantity: 288, categoryId: "288-novillos", categoryName: "288 Novillos", potreiro: "Cerrillada", product: "Maximo + Albendazole", notes: "1 VACA COM CRIA" },
    { sourceId: "xls-san-2025-09-24-arapey-campo-4-1-touro-15-tor", date: "2025-09-24", quantity: null, categoryId: "1-touro-15-torinhos", categoryName: "1 Touro 15 Torinhos", potreiro: "Campo 4", product: "Maximo + Iver + Nitroxi", notes: "" },
    { sourceId: "xls-san-2025-09-23-arapey-campo-4-novillos", date: "2025-09-23", quantity: 134, categoryId: "novillos", categoryName: "Novillos", potreiro: "Campo 4", product: "Maximo + Iver + Nitroxi", notes: "" },
    { sourceId: "xls-san-2025-09-17-arapey-pradeira-7-novillos-gordo", date: "2025-09-17", quantity: 93, categoryId: "novillos-gordo", categoryName: "Novillos Gordo", potreiro: "Pradeira 7", product: "Maximo", notes: "TOTAL 95 COM 2 MANUFA" },
    { sourceId: "xls-san-2025-09-10-arapey-campo-9-vaquillonas-2-", date: "2025-09-10", quantity: 399, categoryId: "vaquillonas-2-anos", categoryName: "Vaquillonas 2 Anos", potreiro: "Campo 9", product: "Insemax+iver+nitrox+ Reprodutiva", notes: "sairam 2 descarte ficaram 397" },
    { sourceId: "xls-san-2025-09-11-arapey-chacra-do-8-geral", date: "2025-09-11", quantity: 30, categoryId: "geral", categoryName: "Geral", potreiro: "Chacra Do 8", product: "Vacas De Invernar", notes: "" },
    { sourceId: "xls-san-2025-09-10-arapey-chacra-do-8-geral", date: "2025-09-10", quantity: 77, categoryId: "geral", categoryName: "Geral", potreiro: "Chacra Do 8", product: "Terneiros", notes: "SE AGREGOU 12 , FICOU 77 TOTAL" },
    { sourceId: "xls-san-2025-09-09-arapey-campo-2-cerrillada-terneiros", date: "2025-09-09", quantity: 396, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Campo 2 --> Cerrillada", product: "Sem Produto", notes: "" },
    { sourceId: "xls-san-2025-09-09-arapey-cerrillada-terneiros", date: "2025-09-09", quantity: 396, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Cerrillada", product: "Evol + Insemax", notes: "MACHO" },
    { sourceId: "xls-san-2025-08-28-arapey-campo-2-terneiras", date: "2025-08-28", quantity: 376, categoryId: "terneiras", categoryName: "Terneiras", potreiro: "Campo 2", product: "Evol + Insemax", notes: "HEMBRA" },
    { sourceId: "xls-san-2025-08-28-arapey-tapera-vaca-invernar", date: "2025-08-28", quantity: 62, categoryId: "vaca-invernar", categoryName: "Vaca Invernar", potreiro: "Tapera", product: "Insemax + Contratack", notes: "1 PARIDA" },
    { sourceId: "xls-san-2025-08-27-arapey-costa-vacas-vazias", date: "2025-08-27", quantity: 192, categoryId: "vacas-vazias", categoryName: "Vacas Vazias", potreiro: "Costa", product: "Insemax + Contratack", notes: "" },
    { sourceId: "xls-san-2025-08-27-arapey-campo-10-vaca-prenha", date: "2025-08-27", quantity: 164, categoryId: "vaca-prenha", categoryName: "Vaca Prenha", potreiro: "Campo 10", product: "Insemax + Contratack", notes: "ENTROU VACAS CERRILLADA TOTAL 122 DIA 28/8" },
    { sourceId: "xls-san-2025-08-27-arapey-campo-3-vaca-prenha", date: "2025-08-27", quantity: 151, categoryId: "vaca-prenha", categoryName: "Vaca Prenha", potreiro: "Campo 3", product: "Insemax + Contratack", notes: "" },
    { sourceId: "xls-san-2025-08-27-arapey-cerrillada-las-pam-bois", date: "2025-08-27", quantity: 114, categoryId: "bois", categoryName: "Bois", potreiro: "Cerrillada --> Las Pampa", product: "-", notes: "" },
    { sourceId: "xls-san-2025-08-26-arapey-campo-8-vaca-prenha", date: "2025-08-26", quantity: 278, categoryId: "vaca-prenha", categoryName: "Vaca Prenha", potreiro: "Campo 8", product: "Insemax + Contratack", notes: "" },
    { sourceId: "xls-san-2025-08-26-arapey-campo-7-vaca-prenha", date: "2025-08-26", quantity: 143, categoryId: "vaca-prenha", categoryName: "Vaca Prenha", potreiro: "Campo 7", product: "Insemax + Contratack", notes: "" },
    { sourceId: "xls-san-2025-08-26-arapey-campo-6-vaca-prenha", date: "2025-08-26", quantity: 109, categoryId: "vaca-prenha", categoryName: "Vaca Prenha", potreiro: "Campo 6", product: "Insemax + Contratack", notes: "" },
    { sourceId: "xls-san-2025-08-09-arapey-campo-5-vaca-prenha", date: "2025-08-09", quantity: 149, categoryId: "vaca-prenha", categoryName: "Vaca Prenha", potreiro: "Campo 5", product: "Insemax + Contratack", notes: "" },
    { sourceId: "xls-san-2025-08-09-arapey-campo-2-terneros", date: "2025-08-09", quantity: 24, categoryId: "terneros", categoryName: "Terneros", potreiro: "Campo 2", product: "Evol", notes: "TERNEIROS PEQUENOS QUE FICARAM NA CHACRA 8" },
    { sourceId: "xls-san-2025-07-30-arapey-campo-2-terneros", date: "2025-07-30", quantity: 123, categoryId: "terneros", categoryName: "Terneros", potreiro: "Campo 2", product: "Evol", notes: "TERNEIROS GRANDE QUE SAIRAM DA CHACRA 8" },
    { sourceId: "xls-san-2025-07-30-arapey-cerrillada-vacas-pre-adas", date: "2025-07-30", quantity: 123, categoryId: "vacas-pre-adas", categoryName: "Vacas Preñadas", potreiro: "Cerrillada", product: "Insemax + Iver 3,15", notes: "120 VACAS 1 VAQ 2 TERNEIRA" },
    { sourceId: "xls-san-2025-07-30-arapey-cerrillada-novillos-1-2", date: "2025-07-30", quantity: 109, categoryId: "novillos-1-2", categoryName: "Novillos 1-2", potreiro: "Cerrillada", product: "Furius + Iver 3,15", notes: "109 VAI PARA MOLINO - POSTO RINCON" },
    { sourceId: "xls-san-2025-07-30-arapey-cerrillada-novillos-1-2-1", date: "2025-07-30", quantity: 293, categoryId: "novillos-1-2", categoryName: "Novillos 1-2", potreiro: "Cerrillada", product: "Insemax + Iver 3,15", notes: "109 Grande - 293 Pequeno monte - 1 rengo" },
    { sourceId: "xls-san-2025-07-30-arapey-pradeira-7-vacas-invernad", date: "2025-07-30", quantity: 94, categoryId: "vacas-invernada", categoryName: "Vacas Invernada", potreiro: "Pradeira 7", product: "Amitraz", notes: "91 VACA INVERNA 2 Nov rengo 1 Vaq" },
    { sourceId: "xls-san-2025-07-30-arapey-molino-novillos", date: "2025-07-30", quantity: 89, categoryId: "novillos", categoryName: "Novillos", potreiro: "Molino", product: "Insemax + Levamisol", notes: "Novillos menor" },
  ],
  chiquita: [
    { sourceId: "xls-san-2026-04-02-chiquita-4-e-5-do-bido-terneiras-1-2", date: "2026-04-02", quantity: null, categoryId: "terneiras-1-2", categoryName: "Terneiras 1-2", potreiro: "4 E 5 Do Bido", product: "Carbazol + Potenty", notes: "" },
    { sourceId: "xls-san-2026-03-26-chiquita-5-do-posto-vacas-de-cria", date: "2026-03-26", quantity: 126, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "5 Do Posto", product: "Fc 30 + Iver 1%", notes: "" },
    { sourceId: "xls-san-2026-03-27-chiquita-campo-5-vacas-de-cria", date: "2026-03-27", quantity: 170, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 5", product: "Fc 30 + Iver 1%", notes: "" },
    { sourceId: "xls-san-2026-03-27-chiquita-campo-4-vacas-de-cria", date: "2026-03-27", quantity: 86, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo 4", product: "Fc 30 + Iver 1%", notes: "84 TERNEIRO" },
    { sourceId: "xls-san-2026-03-25-chiquita-2-do-bido-terneiros-0-1", date: "2026-03-25", quantity: 241, categoryId: "terneiros-0-1", categoryName: "Terneiros 0-1", potreiro: "2 Do Bido", product: "Fc 30 + Iver 1%", notes: "" },
    { sourceId: "xls-san-2026-03-24-chiquita-3-do-caminho-touros", date: "2026-03-24", quantity: 70, categoryId: "touros", categoryName: "Touros", potreiro: "3 Do Caminho", product: "Biopersol", notes: "" },
    { sourceId: "xls-san-2026-03-21-chiquita--cut", date: "2026-03-21", quantity: 134, categoryId: "cut", categoryName: "Cut", potreiro: "-", product: "Biopersol", notes: "VACAS FRACA SE FEZ BIOPERSOL" },
    { sourceId: "xls-san-2026-03-18-chiquita-6-do-posto-vacas-de-cria", date: "2026-03-18", quantity: 126, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "6 Do Posto", product: "Fc 30 + Iver 1%", notes: "120 TERNEIROS" },
    { sourceId: "xls-san-2026-03-11-chiquita-4-do-posto-vacas-de-cria", date: "2026-03-11", quantity: 86, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "4 Do Posto", product: "Fc 30 + Iver 1%", notes: "84 TERNEIRO" },
    { sourceId: "xls-san-2026-03-11-chiquita-5-do-posto-vacas-de-cria", date: "2026-03-11", quantity: 170, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "5 Do Posto", product: "Fc 30 + Iver 1%", notes: "163 TERNEIRO" },
    { sourceId: "xls-san-2026-03-03-chiquita-campo-9-roffus-vaquillonas-1-", date: "2026-03-03", quantity: 70, categoryId: "vaquillonas-1-2-ano", categoryName: "Vaquillonas 1-2 Ano", potreiro: "Campo 9 Roffus", product: "Potenty + Iver 1% + Closantel", notes: "DE VENDA" },
    { sourceId: "xls-san-2026-03-03-chiquita-4-5-do-bido-vaquillonas-1-", date: "2026-03-03", quantity: 567, categoryId: "vaquillonas-1-2-ano", categoryName: "Vaquillonas 1-2 Ano", potreiro: "4/5 Do Bido", product: "Potenty + Iver 1% + Closantel", notes: "" },
    { sourceId: "xls-san-2026-03-03-chiquita-pradeira-do-6-novillos-1-2-a", date: "2026-03-03", quantity: 100, categoryId: "novillos-1-2-anos", categoryName: "Novillos 1-2 Anos", potreiro: "Pradeira Do 6", product: "Exolt + Levamisol", notes: "DE VENDA" },
    { sourceId: "xls-san-2026-03-03-chiquita-pradeira-do-6-novillos-1-2-a-1", date: "2026-03-03", quantity: 506, categoryId: "novillos-1-2-anos", categoryName: "Novillos 1-2 Anos", potreiro: "Pradeira Do 6", product: "Fc 30 + Levamisol", notes: "FALTARAM 9 , MAS  SE ACHOU" },
    { sourceId: "xls-san-2026-02-26-chiquita-3-do-caminho-touros", date: "2026-02-26", quantity: 149, categoryId: "touros", categoryName: "Touros", potreiro: "3 Do Caminho", product: "Potenty + Iver 2%", notes: "" },
    { sourceId: "xls-san-2026-02-25-chiquita-4-do-bom-retiro-vaca-de-cria", date: "2026-02-25", quantity: 72, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "4 Do Bom Retiro", product: "Potenty + Iver 2%", notes: "72 VC 36 TER" },
    { sourceId: "xls-san-2026-02-25-chiquita-telmo-vaca-de-cria", date: "2026-02-25", quantity: 59, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Telmo", product: "Potenty + Iver 2%", notes: "59 VC 52 TER" },
    { sourceId: "xls-san-2026-02-24-chiquita-alamo-vaca-de-cria", date: "2026-02-24", quantity: 146, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Alamo", product: "Potenty + Iver 2%", notes: "146 VC 141 TER" },
    { sourceId: "xls-san-2026-02-25-chiquita-bido-de-cima-terneiros", date: "2026-02-25", quantity: 119, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Bido De Cima", product: "Clostrid/ Ivomec F /", notes: "JÁ ESTAVAM COM EXOLT" },
    { sourceId: "xls-san-2026-02-21-chiquita-quiroga-vacas-de-cria", date: "2026-02-21", quantity: 199, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Quiroga", product: "Potenty + Iver 2%", notes: "199 VC 195 TER" },
    { sourceId: "xls-san-2026-02-20-chiquita-roffus-frente-terneiros", date: "2026-02-20", quantity: 78, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Roffus - Frente", product: "Exolt/clostrid/ Onix/antibiot", notes: "TERNEIROS COMPRADOS CAPADOS" },
    { sourceId: "xls-san-2026-02-20-chiquita-charrua-vacas-de-cria", date: "2026-02-20", quantity: 67, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Charrua", product: "Potenty + Iver 2%", notes: "67 VC 64 TER 3 TOR" },
    { sourceId: "xls-san-2026-02-18-chiquita-8-do-bido-vacas-de-cria", date: "2026-02-18", quantity: 144, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "8 Do Bido", product: "Potenty + Iver 2%", notes: "144 VC 143 TER" },
    { sourceId: "xls-san-2026-02-18-chiquita-roffus-pelado-novillos-n4", date: "2026-02-18", quantity: null, categoryId: "novillos-n4", categoryName: "Novillos N4", potreiro: "Roffus Pelado", product: "Carbazol", notes: "315+ 17 FALTARAM" },
    { sourceId: "xls-san-2026-02-17-chiquita-pradeira-do-6-novillos-n4", date: "2026-02-17", quantity: null, categoryId: "novillos-n4", categoryName: "Novillos N4", potreiro: "Pradeira Do 6", product: "Carbazol", notes: "281 + 1 FICOU +1 MORREU" },
    { sourceId: "xls-san-2026-02-15-chiquita-1-do-bido-vacas-de-cria", date: "2026-02-15", quantity: 96, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "1 Do Bido", product: "Potenty + Iver 2%", notes: "96 VC 93 TER" },
    { sourceId: "xls-san-2026-02-15-chiquita-2-do-bido-vacas-solteira", date: "2026-02-15", quantity: 96, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "2 Do Bido", product: "Potenty + Iver 2%", notes: "" },
    { sourceId: "xls-san-2026-02-14-chiquita-campo-novo-vacas-cut", date: "2026-02-14", quantity: 132, categoryId: "vacas-cut", categoryName: "Vacas Cut", potreiro: "Campo Novo", product: "Potenty + Iver 2%", notes: "132 VC 130 TER" },
    { sourceId: "xls-san-2026-02-10-chiquita-6-7-do-bido-terneiras-h-1-", date: "2026-02-10", quantity: 621, categoryId: "terneiras-h-1-2", categoryName: "Terneiras (h) 1-2", potreiro: "6/7 Do Bido", product: "Pontenty + Carbazol", notes: "FALTAM 4 ( OU MAIS VER BEM)" },
    { sourceId: "xls-san-2026-02-07-chiquita-telmo-vaca-de-1-cria", date: "2026-02-07", quantity: 51, categoryId: "vaca-de-1-cria", categoryName: "Vaca De 1 Cria", potreiro: "Telmo", product: "Potenty + Iver 2%", notes: "51 VC 48 TER 2 TOR" },
    { sourceId: "xls-san-2026-02-06-chiquita-3-da-estancia-vaquillonas", date: "2026-02-06", quantity: 284, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "3 Da Estancia", product: "Potenty + Iver 2%", notes: "FALTAM 11" },
    { sourceId: "xls-san-2026-02-05-chiquita-4-5-do-bido-terneiras-h-0-", date: "2026-02-05", quantity: 631, categoryId: "terneiras-h-0-1", categoryName: "Terneiras (h) 0-1", potreiro: "4/5 Do Bido", product: "Potenty + Closantel", notes: "FALTOU 12 E 1 MORREU" },
    { sourceId: "xls-san-2026-01-27-chiquita-3-do-caminho-toros", date: "2026-01-27", quantity: 93, categoryId: "toros", categoryName: "Toros", potreiro: "3 Do Caminho", product: "Potenty", notes: "71 DE 2 ANOS E 22 ADULTOS" },
    { sourceId: "xls-san-2026-01-24-chiquita-telmo-vaca-de-1-cria", date: "2026-01-24", quantity: 51, categoryId: "vaca-de-1-cria", categoryName: "Vaca De 1 Cria", potreiro: "Telmo", product: "Potenty", notes: "51 VC 49 TER 2 TOR" },
    { sourceId: "xls-san-2026-01-22-chiquita-charrua-vaca-de-cria-c", date: "2026-01-22", quantity: 67, categoryId: "vaca-de-cria-cola", categoryName: "Vaca De Cria / Cola", potreiro: "Charrua", product: "Potenty", notes: "67 VC 64 TER 3 TOR" },
    { sourceId: "xls-san-2026-01-22-chiquita-quiroga-vaca-de-cria", date: "2026-01-22", quantity: 200, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Quiroga", product: "Potenty", notes: "200 VC 197 TER 7 TOR" },
    { sourceId: "xls-san-2026-01-21-chiquita-alamo-vaca-de-1-cria", date: "2026-01-21", quantity: 149, categoryId: "vaca-de-1-cria", categoryName: "Vaca De 1 Cria", potreiro: "Alamo", product: "Potenty", notes: "149 VC 145 TER 5 TOR" },
    { sourceId: "xls-san-2026-01-20-chiquita-8-do-bido-vaca-de-cria", date: "2026-01-20", quantity: 145, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "8 Do Bido", product: "Potenty", notes: "145 VC 142 TER 4 TOR" },
    { sourceId: "xls-san-2026-01-19-chiquita-2-do-bido-vaca-solteira", date: "2026-01-19", quantity: 93, categoryId: "vaca-solteira", categoryName: "Vaca Solteira?", potreiro: "2 Do Bido", product: "Potenty", notes: "93 VACA 3 TORO" },
    { sourceId: "xls-san-2026-01-14-chiquita-pradeira-4-grande-terneiros-dest", date: "2026-01-14", quantity: 109, categoryId: "terneiros-destetado", categoryName: "Terneiros Destetado", potreiro: "Pradeira 4 Grande", product: "Potenty", notes: "MAIS 9 QUE ESTAO NA CHACRINHA/TOTAL 118" },
    { sourceId: "xls-san-2026-01-14-chiquita-4-do-posto-vaca-de-cria", date: "2026-01-14", quantity: 88, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "4 Do Posto", product: "Fc 30", notes: "88VC 85 TER 3 TOR" },
    { sourceId: "xls-san-2026-01-14-chiquita-5-do-posto-vaca-de-cria", date: "2026-01-14", quantity: 167, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "5 Do Posto", product: "Fc 30", notes: "167 VC 160 TER 5 TOR" },
    { sourceId: "xls-san-2026-01-13-chiquita-6-do-posto-vaca-de-1-cria", date: "2026-01-13", quantity: 127, categoryId: "vaca-de-1-cria", categoryName: "Vaca De 1 Cria", potreiro: "6 Do Posto", product: "Fc 30", notes: "127VC 124 TER 4 TOR" },
    { sourceId: "xls-san-2026-01-12-chiquita-4-5-do-bido-terneiras-h-0-", date: "2026-01-12", quantity: 646, categoryId: "terneiras-h-0-1", categoryName: "Terneiras (h) 0-1", potreiro: "4/5 Do Bido", product: "Potenty", notes: "" },
    { sourceId: "xls-san-2026-01-12-chiquita-6-7-do-bido-terneiros", date: "2026-01-12", quantity: 614, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "6/7 Do Bido", product: "Potenty", notes: "" },
    { sourceId: "xls-san-2025-12-30-chiquita-3-da-estancia-vaquillonas", date: "2025-12-30", quantity: 297, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "3 Da Estancia", product: "Potenty", notes: "297 VAQ 5 TOR" },
    { sourceId: "xls-san-2025-12-29-chiquita-nuevo-vaca-de-cria", date: "2025-12-29", quantity: 163, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Nuevo", product: "Potenty", notes: "163 VAC 162 TER" },
    { sourceId: "xls-san-2025-12-29-chiquita-telmo-vaca-de-cria", date: "2025-12-29", quantity: 35, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Telmo", product: "Potenty", notes: "35 VAC 34 TER 1 TOR" },
    { sourceId: "xls-san-2025-12-19-chiquita-alamo-vaca-de-cria", date: "2025-12-19", quantity: 160, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Alamo", product: "Potenty", notes: "160 VAC 155 TER 6 TOR" },
    { sourceId: "xls-san-2025-12-19-chiquita-quiroga-vaca-de-cria", date: "2025-12-19", quantity: 200, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Quiroga", product: "Potenty", notes: "200 VAC 197 TER 6 TOR" },
    { sourceId: "xls-san-2025-12-18-chiquita-2-do-bido-vaca-de-cria", date: "2025-12-18", quantity: 95, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "2 Do Bido", product: "Potenty", notes: "95 VAC 92 TER 3 TOR" },
    { sourceId: "xls-san-2025-12-17-chiquita-campo-9-novillos", date: "2025-12-17", quantity: 70, categoryId: "novillos", categoryName: "Novillos", potreiro: "Campo 9", product: "Insemax + Iver 1% + Nitroxinil", notes: "FALTOU 2" },
    { sourceId: "xls-san-2025-12-17-chiquita-bido-de-cima-novillos", date: "2025-12-17", quantity: 34, categoryId: "novillos", categoryName: "Novillos", potreiro: "Bido De Cima", product: "Insemax + Iver 1% + Nitroxinil", notes: "OK" },
    { sourceId: "xls-san-2025-12-17-chiquita-pelado-novillos", date: "2025-12-17", quantity: 222, categoryId: "novillos", categoryName: "Novillos", potreiro: "Pelado", product: "Insemax + Iver 1% + Nitroxinil", notes: "FALTOU 1 / SE ACHOU" },
    { sourceId: "xls-san-2025-12-17-chiquita-8-do-bido-vacas-de-cria", date: "2025-12-17", quantity: 145, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "8 Do Bido", product: "Potenty", notes: "145 VAC 141 TER 4 TOR + 4 TERNERO" },
    { sourceId: "xls-san-2025-12-12-chiquita-3-do-bido-vaca-de-cria", date: "2025-12-12", quantity: 94, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "3 Do Bido", product: "Potenty", notes: "94 VACA 91 TERN 3 TORO" },
    { sourceId: "xls-san-2025-12-11-chiquita-6-7-do-bido-terneiros", date: "2025-12-11", quantity: 627, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "6/7 Do Bido", product: "Potenty + Ricobendazole", notes: "" },
    { sourceId: "xls-san-2025-12-10-chiquita-cerrito-vaquillonas", date: "2025-12-10", quantity: 19, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "Cerrito", product: "Potenty + Iver 1% + Closantel", notes: "19 VAQ 2 TORO" },
    { sourceId: "xls-san-2025-12-10-chiquita-campo-4-e-5-bido-terneiras-h-0-", date: "2025-12-10", quantity: 648, categoryId: "terneiras-h-0-1", categoryName: "Terneiras (h) 0-1", potreiro: "Campo 4 E 5 Bido", product: "Potenty + Ricobendazole", notes: "" },
    { sourceId: "xls-san-2025-12-10-chiquita-3-da-estancia-vaquillonas", date: "2025-12-10", quantity: 298, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "3 Da Estancia", product: "Potenty + Iver 1% + Closantel", notes: "298 VAQ 6 TOR" },
    { sourceId: "xls-san-2025-11-28-chiquita-campo-2-bois-gordo", date: "2025-11-28", quantity: 147, categoryId: "bois-gordo", categoryName: "Bois Gordo", potreiro: "Campo 2", product: "Insemax", notes: "MOXIDEC NOS ABAIXO DE 450 KG" },
    { sourceId: "xls-san-2025-11-22-chiquita-costa-touros-adultos", date: "2025-11-22", quantity: 83, categoryId: "touros-adultos", categoryName: "Touros Adultos", potreiro: "Costa", product: "Insemax + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2025-11-13-chiquita-charrua-tourinhos-1-2", date: "2025-11-13", quantity: 49, categoryId: "tourinhos-1-2", categoryName: "Tourinhos 1-2", potreiro: "Charrua", product: "Insemax + Biopersol", notes: "" },
    { sourceId: "xls-san-2025-11-12-chiquita-pradeira-4-grande-primiparas", date: "2025-11-12", quantity: 34, categoryId: "primiparas", categoryName: "Primiparas", potreiro: "Pradeira 4 Grande", product: "Insemax + Abamectina 1%", notes: "33 TERNEIROS" },
    { sourceId: "xls-san-2025-11-12-chiquita-6-posto-primiparas", date: "2025-11-12", quantity: 129, categoryId: "primiparas", categoryName: "Primiparas", potreiro: "6 Posto", product: "Insemax + Abamectina 1%", notes: "123 TERNEIROS" },
    { sourceId: "xls-san-2025-11-11-chiquita-quiroga-vacas-paridas", date: "2025-11-11", quantity: 202, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "Quiroga", product: "Insemax + Abamectina 1%", notes: "198 TERNEIROS 6 TOUROS" },
    { sourceId: "xls-san-2025-11-10-chiquita-alamo-vacas-paridas", date: "2025-11-10", quantity: 147, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "Alamo", product: "Insemax + Abamectina 1%", notes: "148 TERNEIROS 5 TOUROS" },
    { sourceId: "xls-san-2025-11-08-chiquita-5-posto-vacas-paridas", date: "2025-11-08", quantity: 164, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "5 Posto", product: "Insemax + Abamectina 1%", notes: "162 TERNEIROS" },
    { sourceId: "xls-san-2025-11-04-chiquita-campo-novo-vacas-paridas", date: "2025-11-04", quantity: 89, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "Campo Novo", product: "Insemax + Abamectina 1%", notes: "87 TERNEIROS 3 TOUROS" },
    { sourceId: "xls-san-2025-11-03-chiquita-4-do-bom-retiro-parindo", date: "2025-11-03", quantity: 91, categoryId: "parindo", categoryName: "Parindo", potreiro: "4 Do Bom Retiro", product: "Insemax + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2025-11-03-chiquita-3-do-caminho-vacas-numero-0", date: "2025-11-03", quantity: 121, categoryId: "vacas-numero-0", categoryName: "Vacas Numero 0", potreiro: "3 Do Caminho", product: "Insemax + Abamectina 1%", notes: "120 TERNEIROS" },
    { sourceId: "xls-san-2025-11-03-chiquita-4-posto-vacas-paridas", date: "2025-11-03", quantity: 75, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "4 Posto", product: "Insemax + Abamectina 1%", notes: "73 TERNEIROS" },
    { sourceId: "xls-san-2025-10-31-chiquita-campo-5-vacas-paridas", date: "2025-10-31", quantity: 145, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "Campo 5", product: "Insemax + Abamectina 1%", notes: "144 TERNEIROS" },
    { sourceId: "xls-san-2025-10-30-chiquita-2-do-bido-vaca-e-vaq-pre", date: "2025-10-30", quantity: 66, categoryId: "vaca-e-vaq-prenha", categoryName: "Vaca E Vaq Prenha", potreiro: "2 Do Bido", product: "Insemax + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2025-10-30-chiquita-piquete-bido-vacas-solteira", date: "2025-10-30", quantity: 134, categoryId: "vacas-solteiras", categoryName: "Vacas Solteiras", potreiro: "Piquete Bido", product: "Insemax + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2025-10-30-chiquita-1-do-bido-vaquillonas-2-", date: "2025-10-30", quantity: 183, categoryId: "vaquillonas-2-anos", categoryName: "Vaquillonas 2 Anos", potreiro: "1 Do Bido", product: "Insemax + Abamectina 1%", notes: "3 NO CERRITO / 186 TOTAL" },
    { sourceId: "xls-san-2025-10-28-chiquita-6-7-bido-terneiros-m-0-", date: "2025-10-28", quantity: 618, categoryId: "terneiros-m-0-1", categoryName: "Terneiros (m) 0-1", potreiro: "6/7 Bido", product: "Insemax + Biopersol", notes: "TEM 5 NO CERRITO / TOTAL SÃO 630" },
    { sourceId: "xls-san-2025-10-27-chiquita-4-5-bido-terneiras-h-0-", date: "2025-10-27", quantity: 648, categoryId: "terneiras-h-0-1", categoryName: "Terneiras (h) 0-1", potreiro: "4/5 Bido", product: "Insemax + Biopersol", notes: "TEM MAIS 5 PRADEIRA / TOTAL 653" },
    { sourceId: "xls-san-2025-09-30-chiquita-7-do-roffus-vaquillonas-1-", date: "2025-09-30", quantity: 88, categoryId: "vaquillonas-1-cria", categoryName: "Vaquillonas 1 Cria", potreiro: "7 Do Roffus", product: "Contratack", notes: "" },
    { sourceId: "xls-san-2025-09-29-chiquita-costa-touros", date: "2025-09-29", quantity: 102, categoryId: "touros", categoryName: "Touros", potreiro: "Costa", product: "Contratack", notes: "" },
    { sourceId: "xls-san-2025-09-29-chiquita-cerrito-touros-2-anos", date: "2025-09-29", quantity: 24, categoryId: "touros-2-anos", categoryName: "Touros 2 Anos", potreiro: "Cerrito", product: "Contratack", notes: "FALTOU 1" },
    { sourceId: "xls-san-2025-09-29-chiquita-pradeira-6-touros-velhos", date: "2025-09-29", quantity: 19, categoryId: "touros-velhos", categoryName: "Touros Velhos", potreiro: "Pradeira 6", product: "Contratack", notes: "" },
    { sourceId: "xls-san-2025-09-17-chiquita-lamadrid-vaca-prenha", date: "2025-09-17", quantity: 125, categoryId: "vaca-prenha", categoryName: "Vaca Prenha", potreiro: "Lamadrid", product: "Contratack", notes: "118 TERNEIROS" },
    { sourceId: "xls-san-2025-09-16-chiquita-pelado-novillos", date: "2025-09-16", quantity: 220, categoryId: "novillos", categoryName: "Novillos", potreiro: "Pelado", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-09-16-chiquita-campo-bido-de-cima-bois-fernando", date: "2025-09-16", quantity: 55, categoryId: "bois-fernando", categoryName: "Bois Fernando", potreiro: "Campo Bido De Cima", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-09-12-chiquita-campo-2-novillos", date: "2025-09-12", quantity: null, categoryId: "novillos", categoryName: "Novillos", potreiro: "Campo 2", product: "Maximo + Ricobendazole", notes: "104 NOVILLO 3 TOURO" },
    { sourceId: "xls-san-2025-09-12-chiquita-pradeira-6-novillos-grand", date: "2025-09-12", quantity: 150, categoryId: "novillos-grande", categoryName: "Novillos Grande", potreiro: "Pradeira 6", product: "Maximo + Ricobendazole", notes: "" },
    { sourceId: "xls-san-2025-09-12-chiquita-pradeira-6-novillos-ferna", date: "2025-09-12", quantity: 31, categoryId: "novillos-fernando", categoryName: "Novillos Fernando", potreiro: "Pradeira 6", product: "Maximo + Ricobendazole", notes: "" },
    { sourceId: "xls-san-2025-09-12-chiquita-piquete-bido-vacas-parindo", date: "2025-09-12", quantity: 13, categoryId: "vacas-parindo", categoryName: "Vacas Parindo", potreiro: "Piquete Bido", product: "Contratack", notes: "" },
    { sourceId: "xls-san-2025-09-11-chiquita-4-5-bido-terneiras-h-0-", date: "2025-09-11", quantity: 664, categoryId: "terneiras-h-0-1", categoryName: "Terneiras (h) 0-1", potreiro: "4/5 Bido", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-09-11-chiquita-pradeira-4-vaquillonas-1-", date: "2025-09-11", quantity: 56, categoryId: "vaquillonas-1-cria", categoryName: "Vaquillonas 1 Cria", potreiro: "Pradeira 4", product: "Contratack", notes: "38 TERNEIROS" },
    { sourceId: "xls-san-2025-09-10-chiquita-costa-touro-adulto", date: "2025-09-10", quantity: 102, categoryId: "touro-adulto", categoryName: "Touro Adulto", potreiro: "Costa", product: "Contratack", notes: "" },
    { sourceId: "xls-san-2025-09-09-chiquita-pradeira-3-chica-tourinhos-1-2", date: "2025-09-09", quantity: 49, categoryId: "tourinhos-1-2", categoryName: "Tourinhos 1-2", potreiro: "Pradeira 3 Chica", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-09-09-chiquita-charrua-toros-descarte", date: "2025-09-09", quantity: 20, categoryId: "toros-descarte", categoryName: "Toros Descarte", potreiro: "Charrua", product: "Contratack", notes: "" },
    { sourceId: "xls-san-2025-09-08-chiquita-3-do-bido-vacas-paridas", date: "2025-09-08", quantity: 141, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "3 Do Bido", product: "Contratack", notes: "141 TERNEIROS" },
    { sourceId: "xls-san-2025-09-07-chiquita-8-do-bido-vaquillonas-1-", date: "2025-09-07", quantity: 244, categoryId: "vaquillonas-1-2", categoryName: "Vaquillonas 1-2", potreiro: "8 Do Bido", product: "Insemax+nitromic", notes: "226 VAQUILLONA 18 VACAS VAZIAS" },
    { sourceId: "xls-san-2025-09-07-chiquita-8-do-bido-vaquillonas-1--1", date: "2025-09-07", quantity: 244, categoryId: "vaquillonas-1-2", categoryName: "Vaquillonas 1-2", potreiro: "8 Do Bido", product: "Reprodutiva", notes: "226 VAQUILLONA 18 VACAS VAZIAS" },
    { sourceId: "xls-san-2025-09-07-chiquita-2-do-bido-vacas-parindo", date: "2025-09-07", quantity: 27, categoryId: "vacas-parindo", categoryName: "Vacas Parindo", potreiro: "2 Do Bido", product: "Contratack", notes: "" },
    { sourceId: "xls-san-2025-09-06-chiquita-6-7-bido-terneiros-m-0-", date: "2025-09-06", quantity: 630, categoryId: "terneiros-m-0-1", categoryName: "Terneiros (m) 0-1", potreiro: "6/7 Bido", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-09-06-chiquita-pradeira-3-terneiros-m-0-", date: "2025-09-06", quantity: 49, categoryId: "terneiros-m-0-1", categoryName: "Terneiros (m) 0-1", potreiro: "Pradeira 3", product: "Insemax + Evol", notes: "TOURINHOS" },
    { sourceId: "xls-san-2025-09-06-chiquita-novo-vacas-paridas", date: "2025-09-06", quantity: 74, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "Novo", product: "Contratack", notes: "73 TERNEIROS" },
    { sourceId: "xls-san-2025-09-05-chiquita-3-da-estancia-vacas-parindo", date: "2025-09-05", quantity: 197, categoryId: "vacas-parindo", categoryName: "Vacas Parindo", potreiro: "3 Da Estancia", product: "Contratack", notes: "" },
    { sourceId: "xls-san-2025-09-04-chiquita-4-do-bom-retiro-vacas-parindo", date: "2025-09-04", quantity: 82, categoryId: "vacas-parindo", categoryName: "Vacas Parindo", potreiro: "4 Do Bom Retiro", product: "Contratack", notes: "" },
    { sourceId: "xls-san-2025-09-03-chiquita-quiroga-vacas-paridas", date: "2025-09-03", quantity: 92, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "Quiroga", product: "Contratack", notes: "92 TERNEIRO" },
    { sourceId: "xls-san-2025-09-02-chiquita-alamo-vacas-paridas", date: "2025-09-02", quantity: 147, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "Alamo", product: "Contratack", notes: "148 TERNEIROS" },
    { sourceId: "xls-san-2025-09-01-chiquita-campo-5-vaquillonas-1-", date: "2025-09-01", quantity: 55, categoryId: "vaquillonas-1-cria", categoryName: "Vaquillonas 1 Cria", potreiro: "Campo 5", product: "Contratack", notes: "55 TERNEIROS" },
    { sourceId: "xls-san-2025-09-01-chiquita-telmo-vacas-paridas", date: "2025-09-01", quantity: 142, categoryId: "vacas-paridas", categoryName: "Vacas Paridas", potreiro: "Telmo", product: "Contratack", notes: "116 TERNEIROS" },
    { sourceId: "xls-san-2025-09-02-chiquita-1-do-bido-vacas-solteira", date: "2025-09-02", quantity: 93, categoryId: "vacas-solteiras-novas", categoryName: "Vacas Solteiras Novas", potreiro: "1 Do Bido", product: "Contratack", notes: "" },
  ],
  "passa-da-guarda": [
    { sourceId: "xls-san-2026-03-27-passa-da-guarda-campo-invernadinha-vacas-de-cria", date: "2026-03-27", quantity: 109, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Campo Invernadinha", product: "Fc30 + Flok", notes: "FALTOU 2" },
    { sourceId: "xls-san-2026-03-27-passa-da-guarda-campo-cerro-terneiros-0-1", date: "2026-03-27", quantity: 93, categoryId: "terneiros-0-1", categoryName: "Terneiros 0 - 1", potreiro: "Campo Cerro", product: "Clostridiose + Dueto + Fc30", notes: "" },
    { sourceId: "xls-san-2026-03-27-passa-da-guarda-campo-cerro-terneiros-0-1-1", date: "2026-03-27", quantity: 250, categoryId: "terneiros-0-1", categoryName: "Terneiros 0 - 1", potreiro: "Campo Cerro", product: "Clostridiose + Dueto + Fc30", notes: "" },
    { sourceId: "xls-san-2026-03-27-passa-da-guarda-boqueir-o-vacas-de-inver", date: "2026-03-27", quantity: 82, categoryId: "vacas-de-invernar", categoryName: "Vacas De Invernar", potreiro: "Boqueirão", product: "Fc30 + Flok", notes: "FALTOU 3" },
    { sourceId: "xls-san-2026-02-26-passa-da-guarda-cemiterio-vacas-de-cria", date: "2026-02-26", quantity: 104, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Cemiterio", product: "Fc 30 + Abamectina", notes: "90 TERNEIROS" },
    { sourceId: "xls-san-2026-02-26-passa-da-guarda-cambara-vacas-de-cria", date: "2026-02-26", quantity: 66, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Cambara", product: "Fc 30 + Abamectina", notes: "66 TERNEIRO" },
    { sourceId: "xls-san-2026-02-25-passa-da-guarda-boqueir-o-cut", date: "2026-02-25", quantity: 67, categoryId: "cut", categoryName: "Cut", potreiro: "Boqueirão", product: "Fc 30 + Abamectina", notes: "65 TERNEIROS" },
    { sourceId: "xls-san-2026-02-12-passa-da-guarda-frente-terneiros", date: "2026-02-12", quantity: 528, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Frente", product: "Fc 30 + Flok", notes: "FALTOU SÃO 540" },
    { sourceId: "xls-san-2026-02-11-passa-da-guarda-invernadinha-vacas-de-cria", date: "2026-02-11", quantity: 110, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Invernadinha", product: "Fc 30 + Flok", notes: "110 VC 103 TER" },
    { sourceId: "xls-san-2026-02-11-passa-da-guarda-cemiterio-vacas-de-cria", date: "2026-02-11", quantity: 119, categoryId: "vacas-de-cria", categoryName: "Vacas De Cria", potreiro: "Cemiterio", product: "Fc 30 + Abamectina", notes: "119 VC 112 TER" },
    { sourceId: "xls-san-2026-02-10-passa-da-guarda-cambar-vaquillonas", date: "2026-02-10", quantity: 69, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "Cambará", product: "Fc 30 + Abamectina", notes: "69 VC 65 TER" },
    { sourceId: "xls-san-2026-02-10-passa-da-guarda-antena-vaquillonas", date: "2026-02-10", quantity: 259, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "Antena", product: "Fc 30 + Abamectina", notes: "259 VC 9 TOR" },
    { sourceId: "xls-san-2026-02-07-passa-da-guarda-mimosa-vacas-cut", date: "2026-02-07", quantity: null, categoryId: "vacas-cut", categoryName: "Vacas Cut", potreiro: "Mimosa", product: "Fc 30", notes: "" },
    { sourceId: "xls-san-2026-02-05-passa-da-guarda-invernadinha-vaca-de-cria", date: "2026-02-05", quantity: 110, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Invernadinha", product: "Fc 30", notes: "110 VC 102 TER" },
    { sourceId: "xls-san-2026-02-05-passa-da-guarda-umbu-vaca-de-cria", date: "2026-02-05", quantity: 160, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Umbu", product: "Fc 30", notes: "160 VC 148 TER" },
    { sourceId: "xls-san-2026-01-15-passa-da-guarda-umbu-vaca-de-cria", date: "2026-01-15", quantity: 189, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Umbu", product: "Fc 30 + Abamectina", notes: "189 VC 181 TER 7 TOR" },
    { sourceId: "xls-san-2026-01-14-passa-da-guarda-boqueir-o-vaca-de-cria", date: "2026-01-14", quantity: 95, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Boqueirão", product: "Fc 30 + Abamectina", notes: "FICARAM NA MIMOSA" },
    { sourceId: "xls-san-2026-01-13-passa-da-guarda-invernadinha-vaca-de-cria", date: "2026-01-13", quantity: 110, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Invernadinha", product: "Fc 30 + Abamectina", notes: "110 VC 103 TER 1 TOUR / FALTO 2" },
    { sourceId: "xls-san-2026-01-09-passa-da-guarda-cemiterio-vaca-de-cria", date: "2026-01-09", quantity: 89, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Cemiterio", product: "Fc 30 + Abamectina", notes: "89 VC 83 TER" },
    { sourceId: "xls-san-2026-01-05-passa-da-guarda-cambara-vaca-de-cria", date: "2026-01-05", quantity: 65, categoryId: "vaca-de-cria", categoryName: "Vaca De Cria", potreiro: "Cambara", product: "Fc 30 + Abamectina", notes: "65 VC 60 TER 4 TOU" },
    { sourceId: "xls-san-2026-01-05-passa-da-guarda-delmar-bois-engorde", date: "2026-01-05", quantity: 101, categoryId: "bois-engorde", categoryName: "Bois Engorde", potreiro: "Delmar", product: "Banho Fc 30", notes: "" },
    { sourceId: "xls-san-2026-01-05-passa-da-guarda-cerro-terneiras", date: "2026-01-05", quantity: 255, categoryId: "terneiras", categoryName: "Terneiras", potreiro: "Cerro", product: "Fc 30 + Albendazole", notes: "TEM 2 MACHO / 253 H" },
    { sourceId: "xls-san-2026-01-05-passa-da-guarda-frente-terneiros", date: "2026-01-05", quantity: 280, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Frente", product: "Fc 30 + Albendazole", notes: "TEM 1 BOI" },
    { sourceId: "xls-san-2025-11-25-passa-da-guarda-todos-vacas-e-ternei", date: "2025-11-25", quantity: null, categoryId: "vacas-e-terneiros", categoryName: "Vacas E Terneiros", potreiro: "Todos", product: "Fc 30", notes: "" },
    { sourceId: "xls-san-2025-12-04-passa-da-guarda-espinilho-bois-pequeno", date: "2025-12-04", quantity: 37, categoryId: "bois-pequeno", categoryName: "Bois Pequeno", potreiro: "Espinilho", product: "Falta Fazer", notes: "" },
    { sourceId: "xls-san-2025-12-04-passa-da-guarda-cerro-vaca-parindo", date: "2025-12-04", quantity: 100, categoryId: "vaca-parindo", categoryName: "Vaca Parindo", potreiro: "Cerro", product: "Falta Fazer", notes: "" },
    { sourceId: "xls-san-2025-11-11-passa-da-guarda-delmar-terneiros", date: "2025-11-11", quantity: 136, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Delmar", product: "Fc 30 + Dueto", notes: "" },
    { sourceId: "xls-san-2025-11-11-passa-da-guarda-frente-terneiros", date: "2025-11-11", quantity: 404, categoryId: "terneiros", categoryName: "Terneiros", potreiro: "Frente", product: "Fc 30 + Dueto", notes: "" },
    { sourceId: "xls-san-2025-11-11-passa-da-guarda-boqueir-o-vacas-velhas-n", date: "2025-11-11", quantity: 75, categoryId: "vacas-velhas-n-0", categoryName: "Vacas Velhas Nº0", potreiro: "Boqueirão", product: "Fc 30", notes: "" },
    { sourceId: "xls-san-2025-11-11-passa-da-guarda-invernadinha-primiparas", date: "2025-11-11", quantity: 110, categoryId: "primiparas", categoryName: "Primiparas", potreiro: "Invernadinha", product: "Fc 30", notes: "4 TOURO" },
    { sourceId: "xls-san-2025-11-11-passa-da-guarda-cemiterio-vaca-parida", date: "2025-11-11", quantity: 90, categoryId: "vaca-parida", categoryName: "Vaca Parida", potreiro: "Cemiterio", product: "Fc 30", notes: "3 TOURO" },
    { sourceId: "xls-san-2025-11-11-passa-da-guarda-antena-vaca-parida", date: "2025-11-11", quantity: 224, categoryId: "vaca-parida", categoryName: "Vaca Parida", potreiro: "Antena", product: "Fc 30", notes: "5 TOURO" },
    { sourceId: "xls-san-2025-11-11-passa-da-guarda-umbu-vaca-parida", date: "2025-11-11", quantity: 193, categoryId: "vaca-parida", categoryName: "Vaca Parida", potreiro: "Umbu", product: "Fc 30", notes: "7 TOURO" },
    { sourceId: "xls-san-2025-10-06-passa-da-guarda-delmar-terneiros-0-1", date: "2025-10-06", quantity: 136, categoryId: "terneiros-0-1", categoryName: "Terneiros 0-1", potreiro: "Delmar", product: "Levamisol", notes: "" },
    { sourceId: "xls-san-2025-10-02-passa-da-guarda-frente-terneiros-0-1", date: "2025-10-02", quantity: 407, categoryId: "terneiros-0-1", categoryName: "Terneiros 0-1", potreiro: "Frente", product: "Levamisol", notes: "" },
    { sourceId: "xls-san-2025-09-05-passa-da-guarda-boqueir-o-vacas-vazias-i", date: "2025-09-05", quantity: 82, categoryId: "vacas-vazias-invernar", categoryName: "Vacas Vazias / Invernar", potreiro: "Boqueirão", product: "Insemax + Flok 1%", notes: "34 INVERNAR 48 ENTORE" },
    { sourceId: "xls-san-2025-09-05-passa-da-guarda-antena-vaquillonas-1-", date: "2025-09-05", quantity: 168, categoryId: "vaquillonas-1-2-e-2-3", categoryName: "Vaquillonas 1-2 E 2-3", potreiro: "Antena", product: "Insemax + Nitromic + Reprodutiva", notes: "VAI ENTRAR PARA ENTORE" },
    { sourceId: "xls-san-2025-09-05-passa-da-guarda-espinilho-vaquillonas-1-", date: "2025-09-05", quantity: 20, categoryId: "vaquillonas-1-2", categoryName: "Vaquillonas 1-2", potreiro: "Espinilho", product: "Insemax + Nitromic", notes: "NÃO CHEGA PARA ENTORE" },
    { sourceId: "xls-san-2025-08-20-passa-da-guarda-colorado-pg-bois-seu-luiz", date: "2025-08-20", quantity: 70, categoryId: "bois-seu-luiz", categoryName: "Bois Seu Luiz", potreiro: "Colorado --> Pg", product: "Sem Produto", notes: "" },
    { sourceId: "xls-san-2025-08-12-passa-da-guarda-cemiterio-vacas-prenha", date: "2025-08-12", quantity: 107, categoryId: "vacas-prenha", categoryName: "Vacas Prenha", potreiro: "Cemiterio", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-12-passa-da-guarda-molino-vaquillona-pre", date: "2025-08-12", quantity: 72, categoryId: "vaquillona-prenha", categoryName: "Vaquillona Prenha", potreiro: "Molino", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-12-passa-da-guarda-cambar-vaquillona-pre", date: "2025-08-12", quantity: 47, categoryId: "vaquillona-prenha", categoryName: "Vaquillona Prenha", potreiro: "Cambará", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-11-passa-da-guarda-frente-terneiros-0-1-", date: "2025-08-11", quantity: 402, categoryId: "terneiros-0-1-ano", categoryName: "Terneiros 0-1 Ano", potreiro: "Frente", product: "Insemax + Dueto", notes: "" },
    { sourceId: "xls-san-2025-08-11-passa-da-guarda-delmar-terneiros-0-1-", date: "2025-08-11", quantity: 131, categoryId: "terneiros-0-1-ano", categoryName: "Terneiros 0-1 Ano", potreiro: "Delmar", product: "Insemax + Dueto", notes: "PEQUENOS" },
    { sourceId: "xls-san-2025-08-09-passa-da-guarda-invernadinha-vacas-prenha", date: "2025-08-09", quantity: 109, categoryId: "vacas-prenha", categoryName: "Vacas Prenha", potreiro: "Invernadinha", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-09-passa-da-guarda-bico-touros", date: "2025-08-09", quantity: 28, categoryId: "touros", categoryName: "Touros", potreiro: "Bico", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-09-passa-da-guarda-bico-boi-sobreano", date: "2025-08-09", quantity: 3, categoryId: "boi-sobreano", categoryName: "Boi Sobreano", potreiro: "Bico", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-09-passa-da-guarda-cerro-vacas-prenha", date: "2025-08-09", quantity: 74, categoryId: "vacas-prenha", categoryName: "Vacas Prenha", potreiro: "Cerro", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-08-passa-da-guarda-umbu-vacas-prenha", date: "2025-08-08", quantity: 163, categoryId: "vacas-prenha", categoryName: "Vacas Prenha", potreiro: "Umbu", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-08-passa-da-guarda-cambara-prad-umbu-vaquillonas", date: "2025-08-08", quantity: 15, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "Cambara--> Prad. Umbu", product: "-", notes: "" },
    { sourceId: "xls-san-2025-08-08-passa-da-guarda-cambara-espinilho-vaquillonas", date: "2025-08-08", quantity: 15, categoryId: "vaquillonas", categoryName: "Vaquillonas", potreiro: "Cambara--> Espinilho", product: "-", notes: "" },
  ],
  colorado: [
    { sourceId: "xls-san-2025-08-28-colorado-estrada-bois", date: "2025-08-28", quantity: 80, categoryId: "bois", categoryName: "Bois", potreiro: "Estrada", product: "Insemax + Evol", notes: "LA 66 LF14" },
    { sourceId: "xls-san-2025-08-28-colorado-estrada-touro", date: "2025-08-28", quantity: 7, categoryId: "touro", categoryName: "Touro", potreiro: "Estrada", product: "Insemax + Evol", notes: "LA 43 LF 17" },
    { sourceId: "xls-san-2025-08-28-colorado-cemit-rio-bois", date: "2025-08-28", quantity: 60, categoryId: "bois", categoryName: "Bois", potreiro: "Cemitério", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-08-28-colorado-meio-bois", date: "2025-08-28", quantity: 101, categoryId: "bois", categoryName: "Bois", potreiro: "Meio", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-08-28-colorado-novo-bois", date: "2025-08-28", quantity: 127, categoryId: "bois", categoryName: "Bois", potreiro: "Novo", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-08-29-colorado-campo-touros-vacas", date: "2025-08-29", quantity: 45, categoryId: "vacas", categoryName: "Vacas", potreiro: "Campo Touros", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-29-colorado-eucaliptos-vacas", date: "2025-08-29", quantity: 58, categoryId: "vacas", categoryName: "Vacas", potreiro: "Eucaliptos", product: "Insemax + Flok 1%", notes: "" },
    { sourceId: "xls-san-2025-08-27-colorado-colorado-pg-bois", date: "2025-08-27", quantity: 70, categoryId: "bois", categoryName: "Bois", potreiro: "Colorado --> Pg", product: "Sem Produto", notes: "TRANSLADO" },
    { sourceId: "xls-san-2025-11-15-colorado-estrada-bois", date: "2025-11-15", quantity: 78, categoryId: "bois", categoryName: "Bois", potreiro: "Estrada", product: "Fc 30 + Agebendazole", notes: "" },
    { sourceId: "xls-san-2025-11-15-colorado-cemit-rio-vacas", date: "2025-11-15", quantity: 92, categoryId: "vacas", categoryName: "Vacas", potreiro: "Cemitério", product: "Fc 30", notes: "VACAS ENTORADAS" },
    { sourceId: "xls-san-2025-11-15-colorado-meio-bois", date: "2025-11-15", quantity: 117, categoryId: "bois", categoryName: "Bois", potreiro: "Meio", product: "Fc 30 + Agebendazole", notes: "" },
    { sourceId: "xls-san-2025-11-15-colorado-novo-bois", date: "2025-11-15", quantity: 115, categoryId: "bois", categoryName: "Bois", potreiro: "Novo", product: "Fc 30 + Agebendazole", notes: "" },
    { sourceId: "xls-san-2025-11-15-colorado-campo-touros-vacas", date: "2025-11-15", quantity: 16, categoryId: "vacas", categoryName: "Vacas", potreiro: "Campo Touros", product: "Fc 30", notes: "VACAS VELHAS" },
    { sourceId: "xls-san-2025-11-15-colorado-eucaliptos-bois", date: "2025-11-15", quantity: 65, categoryId: "bois", categoryName: "Bois", potreiro: "Eucaliptos", product: "Fc 30 + Agebendazole", notes: "" },
    { sourceId: "xls-san-2025-12-05-colorado-estrada-boi", date: "2025-12-05", quantity: 78, categoryId: "boi", categoryName: "Boi", potreiro: "Estrada", product: "Fc 30 + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2025-12-05-colorado-meio-boi", date: "2025-12-05", quantity: 117, categoryId: "boi", categoryName: "Boi", potreiro: "Meio", product: "Fc 30 + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2025-12-11-colorado-eucalipto-boi", date: "2025-12-11", quantity: 65, categoryId: "boi", categoryName: "Boi", potreiro: "Eucalipto", product: "Fc 30 + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2025-12-11-colorado-novo-boi", date: "2025-12-11", quantity: 115, categoryId: "boi", categoryName: "Boi", potreiro: "Novo", product: "Fc 30 + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2025-12-13-colorado-cemiterio-vaca", date: "2025-12-13", quantity: 93, categoryId: "vaca", categoryName: "Vaca", potreiro: "Cemiterio", product: "Fc 30 + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2025-12-13-colorado-piquete-toro-vaca", date: "2025-12-13", quantity: 15, categoryId: "vaca", categoryName: "Vaca", potreiro: "Piquete Toro", product: "Fc 30 + Abamectina 1%", notes: "" },
    { sourceId: "xls-san-2026-01-22-colorado-estrada-geral", date: "2026-01-22", quantity: 63, categoryId: "geral", categoryName: "Geral", potreiro: "Estrada", product: "Fipronil", notes: "" },
    { sourceId: "xls-san-2026-01-22-colorado-meio-geral", date: "2026-01-22", quantity: null, categoryId: "geral", categoryName: "Geral", potreiro: "Meio", product: "Fipronil", notes: "145 BOI 15 VC VELHA 1 ARRENO" },
    { sourceId: "xls-san-2026-01-22-colorado-eucalipto-geral", date: "2026-01-22", quantity: null, categoryId: "geral", categoryName: "Geral", potreiro: "Eucalipto", product: "Fipronil", notes: "78 VAQ 2 VACA" },
    { sourceId: "xls-san-2026-01-22-colorado-novo-geral", date: "2026-01-22", quantity: 69, categoryId: "geral", categoryName: "Geral", potreiro: "Novo", product: "Fipronil", notes: "" },
    { sourceId: "xls-san-2026-01-22-colorado-cemiterio-geral", date: "2026-01-22", quantity: null, categoryId: "geral", categoryName: "Geral", potreiro: "Cemiterio", product: "Fipronil", notes: "89 VC 7 TORO / + 3 VACA" },
    { sourceId: "xls-san-2026-01-22-colorado-piquete-toro-geral", date: "2026-01-22", quantity: null, categoryId: "geral", categoryName: "Geral", potreiro: "Piquete Toro", product: "Fipronil", notes: "" },
    { sourceId: "xls-san-2026-02-06-colorado-estrada-geral", date: "2026-02-06", quantity: 63, categoryId: "geral", categoryName: "Geral", potreiro: "Estrada", product: "Fc 30 + Flok", notes: "" },
    { sourceId: "xls-san-2026-02-06-colorado-meio-geral", date: "2026-02-06", quantity: 161, categoryId: "geral", categoryName: "Geral", potreiro: "Meio", product: "Fc 30 + Flok", notes: "" },
    { sourceId: "xls-san-2026-03-05-colorado-cemiterio-geral", date: "2026-03-05", quantity: 89, categoryId: "geral", categoryName: "Geral", potreiro: "Cemiterio", product: "Fc 30 + Altis", notes: "ALTIS NOS TERNEIROS" },
    { sourceId: "xls-san-2026-03-06-colorado-campo-novo-geral", date: "2026-03-06", quantity: 103, categoryId: "geral", categoryName: "Geral", potreiro: "Campo Novo", product: "Fc 30 + Altis", notes: "" },
    { sourceId: "xls-san-2026-03-06-colorado-meio-geral", date: "2026-03-06", quantity: 109, categoryId: "geral", categoryName: "Geral", potreiro: "Meio", product: "Fc 30 + Altis", notes: "MAIS 16 VACAS" },
    { sourceId: "xls-san-2026-03-06-colorado-estrada-geral", date: "2026-03-06", quantity: 65, categoryId: "geral", categoryName: "Geral", potreiro: "Estrada", product: "Fc 30 + Altis", notes: "65 + 4 TOUROS - FALTOU 1 BOI" },
    { sourceId: "xls-san-2026-03-06-colorado-eucalipto-geral", date: "2026-03-06", quantity: 78, categoryId: "geral", categoryName: "Geral", potreiro: "Eucalipto", product: "Fc 30 + Altis", notes: "MAIS 2 VACAS E  3 TOURO" },
  ],
  sarandi: [
    { sourceId: "xls-san-2026-03-20-sarandi-campo-4-bois-tico-tern", date: "2026-03-20", quantity: 85, categoryId: "bois-tico-terneiros", categoryName: "Bois Tico / Terneiros", potreiro: "Campo 4", product: "Colosso Pour On + Agebendazole", notes: "" },
    { sourceId: "xls-san-2026-03-20-sarandi-campo-3-bois-medio", date: "2026-03-20", quantity: 145, categoryId: "bois-medio", categoryName: "Bois Medio", potreiro: "Campo 3", product: "Colosso Pour On + Agebendazole", notes: "" },
    { sourceId: "xls-san-2026-03-20-sarandi-campo-2-bois-grande", date: "2026-03-20", quantity: 82, categoryId: "bois-grande", categoryName: "Bois Grande", potreiro: "Campo 2", product: "Colosso Pour On + Agebendazole", notes: "" },
    { sourceId: "xls-san-2026-02-09-sarandi-campo-1-terneiros-comp", date: "2026-02-09", quantity: null, categoryId: "terneiros-comprados", categoryName: "Terneiros Comprados", potreiro: "Campo 1", product: "Levamisol + Insemax", notes: "" },
    { sourceId: "xls-san-2026-02-09-sarandi-campo-2-bois-420-kg", date: "2026-02-09", quantity: 60, categoryId: "bois-420-kg", categoryName: "Bois + 420 Kg", potreiro: "Campo 2", product: "Levamisol + Insemax", notes: "" },
    { sourceId: "xls-san-2026-02-09-sarandi-campo-4-bois-420-kg", date: "2026-02-09", quantity: 55, categoryId: "bois-420-kg", categoryName: "Bois -420 Kg", potreiro: "Campo 4", product: "Clausuron + Insemax", notes: "" },
    { sourceId: "xls-san-2026-02-09-sarandi-campo-3-bois-menores", date: "2026-02-09", quantity: 96, categoryId: "bois-menores", categoryName: "Bois Menores", potreiro: "Campo 3", product: "Clausuron + Insemax", notes: "" },
    { sourceId: "xls-san-2025-12-20-sarandi-campo-2-geral", date: "2025-12-20", quantity: 99, categoryId: "geral", categoryName: "Geral", potreiro: "Campo 2", product: "Insemax + Iver 3,15%", notes: "" },
    { sourceId: "xls-san-2025-12-20-sarandi-campo-3-geral", date: "2025-12-20", quantity: 165, categoryId: "geral", categoryName: "Geral", potreiro: "Campo 3", product: "Insemax + Iver 3,15%", notes: "" },
    { sourceId: "xls-san-2025-11-28-sarandi-campo-1-e-2-geral", date: "2025-11-28", quantity: 96, categoryId: "geral", categoryName: "Geral", potreiro: "Campo 1 E 2", product: "Insemax + Bioperosol", notes: "" },
    { sourceId: "xls-san-2025-11-28-sarandi-campo-4-e-3-geral", date: "2025-11-28", quantity: 168, categoryId: "geral", categoryName: "Geral", potreiro: "Campo 4 E 3", product: "Insemax + Bioperosol", notes: "" },
    { sourceId: "xls-san-2025-10-21-sarandi-pradeira-bois-gordo", date: "2025-10-21", quantity: 60, categoryId: "bois-gordo", categoryName: "Bois Gordo", potreiro: "Pradeira", product: "Nitroxinil + Maximo", notes: "" },
    { sourceId: "xls-san-2025-10-21-sarandi-campo-3-boi-comprado", date: "2025-10-21", quantity: 10, categoryId: "boi-comprado", categoryName: "Boi Comprado", potreiro: "Campo 3", product: "Evol", notes: "" },
    { sourceId: "xls-san-2025-10-21-sarandi-campo-3-boi-comprado-1", date: "2025-10-21", quantity: 21, categoryId: "boi-comprado", categoryName: "Boi Comprado", potreiro: "Campo 3", product: "Nitroxinil", notes: "" },
    { sourceId: "xls-san-2025-09-24-sarandi-pradeira-geral", date: "2025-09-24", quantity: 70, categoryId: "geral", categoryName: "Geral", potreiro: "Pradeira", product: "Moxidectina + Insemax", notes: "" },
    { sourceId: "xls-san-2025-09-24-sarandi-campo-2-geral", date: "2025-09-24", quantity: 50, categoryId: "geral", categoryName: "Geral", potreiro: "Campo 2", product: "Moxidectina", notes: "" },
    { sourceId: "xls-san-2025-09-24-sarandi-campo-4-geral", date: "2025-09-24", quantity: 98, categoryId: "geral", categoryName: "Geral", potreiro: "Campo 4", product: "Moxidectina", notes: "" },
    { sourceId: "xls-san-2025-09-24-sarandi-campo-3-35-terneiro-52", date: "2025-09-24", quantity: null, categoryId: "35-terneiro-52-boi", categoryName: "35 Terneiro + 52 Boi", potreiro: "Campo 3", product: "Moxidectina", notes: "" },
    { sourceId: "xls-san-2025-08-16-sarandi-campo-4-geral", date: "2025-08-16", quantity: 105, categoryId: "geral", categoryName: "Geral", potreiro: "Campo 4", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-08-16-sarandi-campo-3-boi-grande", date: "2025-08-16", quantity: 150, categoryId: "boi-grande", categoryName: "Boi Grande", potreiro: "Campo 3", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-08-16-sarandi-campo-3-boi-pequeno", date: "2025-08-16", quantity: 40, categoryId: "boi-pequeno", categoryName: "Boi Pequeno", potreiro: "Campo 3", product: "Insemax + Evol", notes: "" },
    { sourceId: "xls-san-2025-08-16-sarandi-campo-2-boi-gordo", date: "2025-08-16", quantity: 14, categoryId: "boi-gordo", categoryName: "Boi Gordo", potreiro: "Campo 2", product: "Insemax + Evol", notes: "" },
  ],
};

const IMPORTED_FARM_BASELINE_VERSION = 1;
const IMPORTED_FARM_BASELINES = {
  chiquita: {
    declaredTotal: 3667,
    note: "Inventário bovino importado do relatório de novembro/2025. Os saldos ovinos, valores comerciais e notas operacionais foram levados para os dados mensais.",
    categories: [
      { id: "vaca-prenha", name: "Vaca prenha", quantity: 1481 },
      { id: "vaca-invernar", name: "Vaca invernar", quantity: 1 },
      { id: "terneiros-0-a-1-machos", name: "Terneiros 0 a 1 - machos", quantity: 630 },
      { id: "terneiras-0-a-1-femeas", name: "Terneiras 0 a 1 - femeas", quantity: 653 },
      { id: "novilho-1-a-2", name: "Novilho 1 a 2", quantity: 225 },
      { id: "novilhos-2-a-3", name: "Novilhos 2 a 3", quantity: 44 },
      { id: "vaquilona-1-a-2", name: "Vaquilona 1 a 2", quantity: 167 },
      { id: "vacas-solteiras", name: "Vacas solteiras", quantity: 162 },
      { id: "bois-do-fernando", name: "Bois do Fernando", quantity: 72 },
      { id: "terneiros-do-fernando", name: "Terneiros do Fernando", quantity: 34 },
      { id: "touros", name: "Touros", quantity: 116 },
      { id: "touros-2-ano", name: "Touros 2 ano", quantity: 24 },
      { id: "touro-1-ano", name: "Touro 1 ano", quantity: 49 },
      { id: "touro-refugo", name: "Touro refugo", quantity: 9 }
    ]
  },
  "passa-da-guarda": {
    declaredTotal: 1532,
    note: "Inventário bovino importado do relatório de novembro/2025. Os saldos ovinos, valores comerciais e notas operacionais foram levados para os dados mensais.",
    categories: [
      { id: "vaca-prenha", name: "Vaca prenha", quantity: 571 },
      { id: "vaca-invernar", name: "Vaca invernar", quantity: 44 },
      { id: "terneiros-0-a-1-machos", name: "Terneiros 0 a 1 - machos", quantity: 542 },
      { id: "vacas-solteiras", name: "Vacas solteiras", quantity: 104 },
      { id: "vaquilona-1-a-2", name: "Vaquilona 1 a 2", quantity: 159 },
      { id: "bois", name: "Bois", quantity: 72 },
      { id: "touros", name: "Touros", quantity: 27 },
      { id: "refugos-rengos", name: "Refugos / Rengos", quantity: 13 }
    ]
  },
  colorado: {
    declaredTotal: 490,
    note: "Inventário bovino importado do relatório de novembro/2025. Os saldos ovinos e valores comerciais foram levados para os dados mensais quando identificados no PDF.",
    categories: [
      { id: "bois", name: "Bois", quantity: 375 },
      { id: "vacas-solteiras", name: "Vacas solteiras", quantity: 108 },
      { id: "vaquillonas", name: "Vaquillonas", quantity: 0 },
      { id: "terneiros", name: "Terneiros", quantity: 0 },
      { id: "touros", name: "Touros", quantity: 7 }
    ]
  },
  sarandi: {
    declaredTotal: 269,
    note: "Inventário bovino importado do relatório de novembro/2025. Os saldos ovinos e as movimentações comerciais do PDF foram levados para os dados mensais.",
    categories: [
      { id: "bois", name: "Bois", quantity: 269 }
    ]
  }
};

const IMPORTED_MONTHLY_RECORDS = {
  arapey: [
    { sourceId: "pdf-2025-10-arapey-estoque-bovino", period: "2025-10", category: "estoque", title: "Saldo bovino do relatório", quantity: 3015, value: 0, notes: "Outubro/2025: saldo bovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-10-arapey-estoque-ovino", period: "2025-10", category: "estoque", title: "Saldo ovino do relatório", quantity: 3730, value: 0, notes: "Outubro/2025: saldo ovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-10-arapey-operacional-esquila", period: "2025-10", category: "operacional", title: "Esquila de borregos", quantity: 357, value: 0, notes: "Apontamento operacional do relatório: ESQUILA BORREGOS - 357." },
    { sourceId: "pdf-2025-11-arapey-estoque-bovino", period: "2025-11", category: "estoque", title: "Saldo bovino do relatório", quantity: 2974, value: 0, notes: "Novembro/2025: soma das categorias bovinas listadas no PDF. O inventário da fazenda segue com total declarado de 3015 cabeças." },
    { sourceId: "pdf-2025-11-arapey-estoque-ovino", period: "2025-11", category: "estoque", title: "Saldo ovino do relatório", quantity: 3730, value: 0, notes: "Novembro/2025: saldo ovino consolidado do relatório mensal." }
  ],
  chiquita: [
    { sourceId: "pdf-2025-10-chiquita-estoque-bovino", period: "2025-10", category: "estoque", title: "Saldo bovino do relatório", quantity: 3778, value: 0, notes: "Outubro/2025: saldo bovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-10-chiquita-estoque-ovino", period: "2025-10", category: "estoque", title: "Saldo ovino do relatório", quantity: 2889, value: 0, notes: "Outubro/2025: saldo ovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-10-chiquita-comercial-compras", period: "2025-10", category: "comercial", title: "Compras registradas no relatório", quantity: 54, value: 48450, notes: "23/10: 28 terneiros (19031) e 26 novilhos (29419)." },
    { sourceId: "pdf-2025-11-chiquita-estoque-bovino", period: "2025-11", category: "estoque", title: "Saldo bovino do relatório", quantity: 3667, value: 0, notes: "Novembro/2025: saldo bovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-11-chiquita-estoque-ovino", period: "2025-11", category: "estoque", title: "Saldo ovino do relatório", quantity: 2498, value: 0, notes: "Novembro/2025: saldo ovino consolidado do relatório mensal." }
  ],
  "passa-da-guarda": [
    { sourceId: "pdf-2025-10-passa-da-guarda-estoque-bovino", period: "2025-10", category: "estoque", title: "Saldo bovino do relatório", quantity: 1592, value: 0, notes: "Outubro/2025: saldo bovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-10-passa-da-guarda-estoque-ovino", period: "2025-10", category: "estoque", title: "Saldo ovino do relatório", quantity: 672, value: 0, notes: "Outubro/2025: saldo ovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-10-passa-da-guarda-comercial-vendas", period: "2025-10", category: "comercial", title: "Vendas registradas no relatório", quantity: 49, value: 238275.5, notes: "06/10: 22 vacas (97092) e 12 bois (61646). 21/10: 15 bois (79537,50)." },
    { sourceId: "pdf-2025-10-passa-da-guarda-operacional-esquila", period: "2025-10", category: "operacional", title: "Esquila de ovinos", quantity: 670, value: 0, notes: "Relatório operacional: 658 ovelhas e borregas + 12 carneiros; 15 pelegos apontados à parte." },
    { sourceId: "pdf-2025-11-passa-da-guarda-estoque-bovino", period: "2025-11", category: "estoque", title: "Saldo bovino do relatório", quantity: 1532, value: 0, notes: "Novembro/2025: saldo bovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-11-passa-da-guarda-estoque-ovino", period: "2025-11", category: "estoque", title: "Saldo ovino do relatório", quantity: 673, value: 0, notes: "Novembro/2025: saldo ovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-11-passa-da-guarda-comercial-vendas", period: "2025-11", category: "comercial", title: "Vendas registradas no relatório", quantity: 45, value: 196665, notes: "04/11: 10 bois (47670) e 35 vacas (148995)." }
  ],
  colorado: [
    { sourceId: "pdf-2025-10-colorado-estoque-bovino", period: "2025-10", category: "estoque", title: "Saldo bovino do relatório", quantity: 478, value: 0, notes: "Outubro/2025: saldo bovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-10-colorado-comercial-compras", period: "2025-10", category: "comercial", title: "Compras registradas no relatório", quantity: 20, value: 69747, notes: "17/10: compra de 20 bois de 1 ano." },
    { sourceId: "pdf-2025-11-colorado-estoque-bovino", period: "2025-11", category: "estoque", title: "Saldo bovino do relatório", quantity: 490, value: 0, notes: "Novembro/2025: saldo bovino consolidado do relatório mensal." }
  ],
  sarandi: [
    { sourceId: "pdf-2025-08-sarandi-comercial-vendas", period: "2025-08", category: "comercial", title: "Vendas registradas no relatório", quantity: 50, value: 255904, notes: "25/08: venda de 50 bois." },
    { sourceId: "pdf-2025-10-sarandi-estoque-bovino", period: "2025-10", category: "estoque", title: "Saldo bovino do relatório", quantity: 370, value: 0, notes: "Outubro/2025: saldo bovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-10-sarandi-estoque-ovino", period: "2025-10", category: "estoque", title: "Saldo ovino do relatório", quantity: 156, value: 0, notes: "Outubro/2025: saldo ovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-10-sarandi-comercial-compras", period: "2025-10", category: "comercial", title: "Compras registradas no relatório", quantity: 74, value: 242155.3, notes: "09/10: 23 bois (71112,50). 21/10: 20 bois (73371,90), 21 bois (73371,90) e 10 terneiros (24299)." },
    { sourceId: "pdf-2025-10-sarandi-comercial-vendas", period: "2025-10", category: "comercial", title: "Vendas registradas no relatório", quantity: 16, value: 91077, notes: "21/10: venda de 16 bois." },
    { sourceId: "pdf-2025-11-sarandi-estoque-bovino", period: "2025-11", category: "estoque", title: "Saldo bovino do relatório", quantity: 269, value: 0, notes: "Novembro/2025: saldo bovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-11-sarandi-estoque-ovino", period: "2025-11", category: "estoque", title: "Saldo ovino do relatório", quantity: 156, value: 0, notes: "Novembro/2025: saldo ovino consolidado do relatório mensal." },
    { sourceId: "pdf-2025-12-sarandi-estoque-bovino", period: "2025-12", category: "estoque", title: "Saldo bovino do relatório", quantity: 348, value: 0, notes: "Dezembro/2025: bois (348). Compra 80 cabeças no mês." },
    { sourceId: "pdf-2025-12-sarandi-comercial-compras", period: "2025-12", category: "comercial", title: "Compras registradas no relatório", quantity: 80, value: 0, notes: "Dez/2025: compra de 80 bois." },
    { sourceId: "pdf-2026-01-sarandi-estoque-bovino", period: "2026-01", category: "estoque", title: "Saldo bovino do relatório", quantity: 229, value: 0, notes: "Janeiro/2026: bois (229). Venda 119 cabeças." },
    { sourceId: "pdf-2026-01-sarandi-comercial-vendas", period: "2026-01", category: "comercial", title: "Vendas registradas no relatório", quantity: 119, value: 0, notes: "Jan/2026: venda de 119 bois." },
    { sourceId: "pdf-2026-02-sarandi-estoque-bovino", period: "2026-02", category: "estoque", title: "Saldo bovino do relatório", quantity: 298, value: 0, notes: "Fevereiro/2026: bois (298). Venda 61, compra 130." },
    { sourceId: "pdf-2026-02-sarandi-comercial-vendas", period: "2026-02", category: "comercial", title: "Vendas registradas no relatório", quantity: 61, value: 0, notes: "Fev/2026: venda de 61 bois." },
    { sourceId: "pdf-2026-02-sarandi-comercial-compras", period: "2026-02", category: "comercial", title: "Compras registradas no relatório", quantity: 130, value: 0, notes: "Fev/2026: compra de 130 bois." },
    { sourceId: "pdf-2026-03-sarandi-estoque-bovino", period: "2026-03", category: "estoque", title: "Saldo bovino do relatório", quantity: 310, value: 0, notes: "Março/2026: bois (310). Compra 12 cabeças." },
    { sourceId: "pdf-2026-03-sarandi-comercial-compras", period: "2026-03", category: "comercial", title: "Compras registradas no relatório", quantity: 12, value: 0, notes: "Mar/2026: compra de 12 bois." }
  ]
};

// Registros mensais estendidos dez/25 a mar/26 (todos inseridos no array de cada fazenda acima por spread)
const EXTENDED_MONTHLY_RECORDS = {
  arapey: [
    { sourceId: "pdf-2025-12-arapey-estoque-bovino", period: "2025-12", category: "estoque", title: "Saldo bovino do relatório", quantity: 3968, value: 0, notes: "Dezembro/2025: saldo bovino consolidado. Compra 857 terneiros 0-1 e 25 touros novos." },
    { sourceId: "pdf-2025-12-arapey-comercial-compras", period: "2025-12", category: "comercial", title: "Compras registradas", quantity: 882, value: 0, notes: "Dez/2025: 857 terneiros 0-1 + 25 touros." },
    { sourceId: "pdf-2026-01-arapey-estoque-bovino", period: "2026-01", category: "estoque", title: "Saldo bovino do relatório", quantity: 3960, value: 0, notes: "Janeiro/2026: saldo 3960. Venda 100 bois." },
    { sourceId: "pdf-2026-01-arapey-comercial-vendas", period: "2026-01", category: "comercial", title: "Vendas registradas", quantity: 100, value: 0, notes: "Jan/2026: venda de 100 bois." },
    { sourceId: "pdf-2026-02-arapey-estoque-bovino", period: "2026-02", category: "estoque", title: "Saldo bovino do relatório", quantity: 3852, value: 0, notes: "Fevereiro/2026: saldo 3852. Venda 58 bois. Mortes: 2 vacas prenhas, 2 terneiros machos, 1 touro." },
    { sourceId: "pdf-2026-02-arapey-comercial-vendas", period: "2026-02", category: "comercial", title: "Vendas registradas", quantity: 58, value: 0, notes: "Fev/2026: venda de 58 bois." },
    { sourceId: "pdf-2026-03-arapey-estoque-bovino", period: "2026-03", category: "estoque", title: "Saldo bovino do relatório", quantity: 3789, value: 0, notes: "Março/2026: saldo 3789. Sem vendas. Sem compras." }
  ],
  chiquita: [
    { sourceId: "pdf-2025-12-chiquita-estoque-bovino", period: "2025-12", category: "estoque", title: "Saldo bovino do relatório", quantity: 3562, value: 0, notes: "Dezembro/2025: saldo 3562. Vendas: 130 novilhos, 26 bois Fernando. Compra: 52 terneiros Fernando." },
    { sourceId: "pdf-2025-12-chiquita-comercial-vendas", period: "2025-12", category: "comercial", title: "Vendas registradas", quantity: 156, value: 0, notes: "Dez/2025: 130 novilhos + 26 bois Fernando." },
    { sourceId: "pdf-2025-12-chiquita-comercial-compras", period: "2025-12", category: "comercial", title: "Compras registradas", quantity: 52, value: 0, notes: "Dez/2025: 52 terneiros Fernando." },
    { sourceId: "pdf-2026-01-chiquita-estoque-bovino", period: "2026-01", category: "estoque", title: "Saldo bovino do relatório", quantity: 3403, value: 0, notes: "Janeiro/2026: saldo 3403. Vendas: 126 novilhos 1-2, 30 bois Fernando, 86 terneiros Fernando." },
    { sourceId: "pdf-2026-01-chiquita-comercial-vendas", period: "2026-01", category: "comercial", title: "Vendas registradas", quantity: 242, value: 0, notes: "Jan/2026: 126 novilhos + 30 bois Fernando + 86 terneiros Fernando." },
    { sourceId: "pdf-2026-02-chiquita-estoque-bovino", period: "2026-02", category: "estoque", title: "Saldo bovino do relatório", quantity: 3743, value: 0, notes: "Fevereiro/2026: saldo 3743. Mortes: 5 terneiros machos, 5 terneiras, 3 novilhos. Compras: 78 bois Fernando, 119 terneiros Fernando." },
    { sourceId: "pdf-2026-02-chiquita-comercial-compras", period: "2026-02", category: "comercial", title: "Compras registradas", quantity: 197, value: 0, notes: "Fev/2026: 78 bois Fernando + 119 terneiros Fernando." },
    { sourceId: "pdf-2026-03-chiquita-estoque-bovino", period: "2026-03", category: "estoque", title: "Saldo bovino do relatório", quantity: 3743, value: 0, notes: "Março/2026: saldo 3743. Sem movimentações." }
  ],
  "passa-da-guarda": [
    { sourceId: "pdf-2025-12-passa-da-guarda-estoque-bovino", period: "2025-12", category: "estoque", title: "Saldo bovino do relatório", quantity: 1524, value: 0, notes: "Dezembro/2025: saldo 1524. Vendas: 38 vacas invernar, 15 bois. Compra 45 bois." },
    { sourceId: "pdf-2025-12-passa-da-guarda-comercial-vendas", period: "2025-12", category: "comercial", title: "Vendas registradas", quantity: 53, value: 0, notes: "Dez/2025: 38 vacas invernar + 15 bois." },
    { sourceId: "pdf-2025-12-passa-da-guarda-comercial-compras", period: "2025-12", category: "comercial", title: "Compras registradas", quantity: 45, value: 0, notes: "Dez/2025: 45 bois." },
    { sourceId: "pdf-2026-01-passa-da-guarda-estoque-bovino", period: "2026-01", category: "estoque", title: "Saldo bovino do relatório", quantity: 1499, value: 0, notes: "Janeiro/2026: saldo 1499. Vendas: 10 vacas prenhas, 5 vacas invernar, 10 bois." },
    { sourceId: "pdf-2026-01-passa-da-guarda-comercial-vendas", period: "2026-01", category: "comercial", title: "Vendas registradas", quantity: 25, value: 0, notes: "Jan/2026: 10 vacas prenhas + 5 vacas invernar + 10 bois." },
    { sourceId: "pdf-2026-02-passa-da-guarda-estoque-bovino", period: "2026-02", category: "estoque", title: "Saldo bovino do relatório", quantity: 1499, value: 0, notes: "Fevereiro/2026: saldo 1499. Sem movimentações." },
    { sourceId: "pdf-2026-03-passa-da-guarda-estoque-bovino", period: "2026-03", category: "estoque", title: "Saldo bovino do relatório", quantity: 1498, value: 0, notes: "Março/2026: saldo 1498. Morte: 1 vaquillona 1-2." }
  ],
  colorado: [
    { sourceId: "pdf-2025-12-colorado-estoque-bovino", period: "2025-12", category: "estoque", title: "Saldo bovino do relatório", quantity: 467, value: 0, notes: "Dezembro/2025: saldo 467. Vendas: 125 bois. Compras: 25 bois, 78 vaquillonas. Morte: 1 vaca solteira." },
    { sourceId: "pdf-2025-12-colorado-comercial-vendas", period: "2025-12", category: "comercial", title: "Vendas registradas", quantity: 125, value: 0, notes: "Dez/2025: 125 bois." },
    { sourceId: "pdf-2025-12-colorado-comercial-compras", period: "2025-12", category: "comercial", title: "Compras registradas", quantity: 103, value: 0, notes: "Dez/2025: 25 bois + 78 vaquillonas." },
    { sourceId: "pdf-2026-01-colorado-estoque-bovino", period: "2026-01", category: "estoque", title: "Saldo bovino do relatório", quantity: 467, value: 0, notes: "Janeiro/2026: saldo 467. Sem movimentações." },
    { sourceId: "pdf-2026-02-colorado-estoque-bovino", period: "2026-02", category: "estoque", title: "Saldo bovino do relatório", quantity: 467, value: 0, notes: "Fevereiro/2026: saldo 467. Sem movimentações. Vacas solteiras aumentaram (185)." },
    { sourceId: "pdf-2026-03-colorado-estoque-bovino", period: "2026-03", category: "estoque", title: "Saldo bovino do relatório", quantity: 467, value: 0, notes: "Março/2026: saldo 467. Sem movimentações." }
  ]
};

// Versão 3: movimentos de fazendas USD (Arapey/Chiquita) revertidos para valores em dólar
const COMMERCIAL_MOVEMENTS_VERSION = 3;

function extractUsdPriceFromNotes(notes) {
  const m = String(notes || "").match(/US\$\s*(\d+(?:[,\.]\d+)?)\s*\/\s*kg/i);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

const IMPORTED_COMMERCIAL_MOVEMENTS = {
  arapey: [
    // Vendas — USD convertido para R$ (set/out-25 ×5,55 | nov/25 ×5,75 | dez/25 ×6,00 | jan/26 ×6,10 | fev/26 ×5,90 | mar-abr/26 ×5,85)
    { sourceId: "pdf-mov-2025-09-24-arapey-venda-novillo-marfrig", type: "venda", date: "2025-09-24", categoryId: "pdf-novillo", categoryName: "Novillo", quantity: 11, delta: -11, value: 82113, saleDetails: { mode: "carcaca", pricePerKg: 30.36, weightKg: 2740.4 }, notes: "MARFRIG | Carcaça 2740kg | US$5,47/kg (×5,55) = R$30,36/kg | R$7465/animal" },
    { sourceId: "pdf-mov-2025-09-24-arapey-venda-vacas-marfrig", type: "venda", date: "2025-09-24", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 58, delta: -58, value: 383221, saleDetails: { mode: "carcaca", pricePerKg: 28.42, weightKg: 13486.1 }, notes: "MARFRIG | Carcaça 13486kg | US$5,12/kg (×5,55) = R$28,42/kg | R$6607/animal" },
    { sourceId: "pdf-mov-2025-09-24-arapey-venda-touro-marfrig", type: "venda", date: "2025-09-24", categoryId: "pdf-touros", categoryName: "Touros", quantity: 2, delta: -2, value: 12837, saleDetails: { mode: "carcaca", pricePerKg: 19.43, weightKg: 661 }, notes: "MARFRIG | Carcaça 661kg | US$3,50/kg (×5,55) = R$19,43/kg | R$6419/animal" },
    { sourceId: "pdf-mov-2025-11-04-arapey-venda-novillo-marfrig", type: "venda", date: "2025-11-04", categoryId: "pdf-novillo", categoryName: "Novillo", quantity: 88, delta: -88, value: 663924, saleDetails: { mode: "carcaca", pricePerKg: 30.42, weightKg: 21826 }, notes: "MARFRIG | Carcaça 21826kg | US$5,29/kg (×5,75) = R$30,42/kg | R$7544/animal" },
    { sourceId: "pdf-mov-2025-11-04-arapey-venda-vacas-marfrig", type: "venda", date: "2025-11-04", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 23, delta: -23, value: 159465, saleDetails: { mode: "carcaca", pricePerKg: 28.35, weightKg: 5624 }, notes: "MARFRIG | Carcaça 5624kg | US$4,93/kg (×5,75) = R$28,35/kg | R$6933/animal" },
    { sourceId: "pdf-mov-2025-11-04-arapey-venda-borregos-titinho", type: "venda", date: "2025-11-04", categoryId: "pdf-borregos", categoryName: "Borregos", quantity: 320, delta: -320, value: 173403, saleDetails: { mode: "carcaca", pricePerKg: 32.95, weightKg: 5263 }, notes: "TITINHO | Carcaça 5263kg (16,4kg/cab) | US$5,73/kg (×5,75) = R$32,95/kg | R$542/animal" },
    { sourceId: "pdf-mov-2025-11-20-arapey-venda-vacas-marfrig", type: "venda", date: "2025-11-20", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 38, delta: -38, value: 206373, saleDetails: { mode: "carcaca", pricePerKg: 27.60, weightKg: 7475 }, notes: "MARFRIG | Carcaça 7475kg | US$4,80/kg (×5,75) = R$27,60/kg | R$5431/animal" },
    { sourceId: "pdf-mov-2025-12-15-arapey-venda-cordeiros-titinho", type: "venda", date: "2025-12-15", categoryId: "pdf-cordeiros", categoryName: "Cordeiros", quantity: 369, delta: -369, value: 157748, saleDetails: { mode: "carcaca", pricePerKg: 34.20, weightKg: 4615.3 }, notes: "TITINHO | Carcaça 4615kg (12,5kg/cab) | US$5,70/kg (×6,00) = R$34,20/kg | R$427/animal" },
    { sourceId: "pdf-mov-2026-01-17-arapey-venda-novillo-feedlot", type: "venda", date: "2026-01-17", categoryId: "pdf-novillo", categoryName: "Novillo", quantity: 100, delta: -100, value: 799033, saleDetails: { mode: "vivo", pricePerKg: 17.39, weightKg: 45961 }, notes: "FEEDLOT | Peso médio 459,61kg | US$2,85/kg (×6,10) = R$17,39/kg | R$7990/animal" },
    { sourceId: "pdf-mov-2026-02-23-arapey-venda-novillo-feedlot", type: "venda", date: "2026-02-23", categoryId: "pdf-novillo", categoryName: "Novillo", quantity: 58, delta: -58, value: 523890, saleDetails: { mode: "vivo", pricePerKg: 19.77, weightKg: 26506 }, notes: "FEEDLOT | Peso médio 457kg | US$3,35/kg (×5,90) = R$19,77/kg | R$9032/animal" },
    { sourceId: "pdf-mov-2026-03-13-arapey-venda-novillo-agrooriental", type: "venda", date: "2026-03-13", categoryId: "pdf-novillo", categoryName: "Novillo", quantity: 70, delta: -70, value: 540000, saleDetails: { mode: "carcaca", pricePerKg: 19.19, weightKg: 28140 }, notes: "AGROORIENTAL | Carcaça 28140kg (402kg/cab) | US$3,28/kg (×5,85) = R$19,19/kg | R$7714/animal" },
    { sourceId: "pdf-mov-2026-03-14-arapey-venda-vacas-agrooriental", type: "venda", date: "2026-03-14", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 51, delta: -51, value: 335865, saleDetails: { mode: "carcaca", pricePerKg: 13.92, weightKg: 24123 }, notes: "AGROORIENTAL | Carcaça 24123kg (473kg/cab) | US$2,38/kg (×5,85) = R$13,92/kg | R$6585/animal" },
    // Compras
    { sourceId: "pdf-mov-2025-11-13-arapey-compra-touros", type: "compra", date: "2025-11-13", categoryId: "pdf-touros", categoryName: "Touros", quantity: 4, delta: 4, value: 0, saleDetails: null, notes: "Compra de 4 touros (valor não informado no PDF)" }
  ],
  chiquita: [
    // Vendas — USD convertido para R$ (mesmas taxas acima)
    { sourceId: "pdf-mov-2025-09-01-chiquita-venda-boi-marfrig", type: "venda", date: "2025-09-01", categoryId: "pdf-bois", categoryName: "Bois", quantity: 80, delta: -80, value: 575734, saleDetails: { mode: "carcaca", pricePerKg: 29.14, weightKg: 16948.3 }, notes: "MARFRIG | Carcaça 16948kg | US$5,25/kg (×5,55) = R$29,14/kg | R$7197/animal" },
    { sourceId: "pdf-mov-2025-09-01-chiquita-venda-vaca-marfrig", type: "venda", date: "2025-09-01", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 30, delta: -30, value: 183422, saleDetails: { mode: "carcaca", pricePerKg: 27.42, weightKg: 5571.5 }, notes: "MARFRIG | Carcaça 5571kg | US$4,94/kg (×5,55) = R$27,42/kg | R$6114/animal" },
    { sourceId: "pdf-mov-2025-09-01-chiquita-venda-touro-marfrig", type: "venda", date: "2025-09-01", categoryId: "pdf-touros", categoryName: "Touros", quantity: 1, delta: -1, value: 7152, saleDetails: { mode: "carcaca", pricePerKg: 18.87, weightKg: 379 }, notes: "MARFRIG | Carcaça 379kg | US$3,40/kg (×5,55) = R$18,87/kg | R$7152/animal" },
    { sourceId: "pdf-mov-2025-10-13-chiquita-venda-boi-marfrig", type: "venda", date: "2025-10-13", categoryId: "pdf-bois", categoryName: "Bois", quantity: 67, delta: -67, value: 526464, saleDetails: { mode: "carcaca", pricePerKg: 31.63, weightKg: 31691 }, notes: "MARFRIG | Carcaça 31691kg | US$5,50/kg (×5,75) = R$31,63/kg | R$7857/animal" },
    { sourceId: "pdf-mov-2025-10-13-chiquita-venda-vaca-marfrig", type: "venda", date: "2025-10-13", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 57, delta: -57, value: 382208, saleDetails: { mode: "carcaca", pricePerKg: 29.67, weightKg: 25935 }, notes: "MARFRIG | Carcaça 25935kg | US$5,16/kg (×5,75) = R$29,67/kg | R$6705/animal" },
    { sourceId: "pdf-mov-2025-11-21-chiquita-venda-vacas-marfrig", type: "venda", date: "2025-11-21", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 39, delta: -39, value: 229589, saleDetails: { mode: "carcaca", pricePerKg: 27.03, weightKg: 8456 }, notes: "MARFRIG | Carcaça 8456kg | US$4,70/kg (×5,75) = R$27,03/kg | R$5887/animal" },
    { sourceId: "pdf-mov-2025-11-21-chiquita-venda-boi-marfrig", type: "venda", date: "2025-11-21", categoryId: "pdf-bois", categoryName: "Bois", quantity: 70, delta: -70, value: 483132, saleDetails: { mode: "carcaca", pricePerKg: 29.90, weightKg: 16158.5 }, notes: "MARFRIG | Carcaça 16158kg | US$5,20/kg (×5,75) = R$29,90/kg | R$6902/animal" },
    { sourceId: "pdf-mov-2025-12-02-chiquita-venda-cordeiro-artigas", type: "venda", date: "2025-12-02", categoryId: "pdf-cordeiros", categoryName: "Cordeiros", quantity: 203, delta: -203, value: 93601, saleDetails: { mode: "carcaca", pricePerKg: 34.68, weightKg: 2699 }, notes: "ARTIGAS | Carcaça 2699kg (13,3kg/cab) | US$5,78/kg (×6,00) = R$34,68/kg | R$461/animal" },
    { sourceId: "pdf-mov-2025-12-04-chiquita-venda-borrego-durazno", type: "venda", date: "2025-12-04", categoryId: "pdf-borregos", categoryName: "Borregos", quantity: 150, delta: -150, value: 101120, saleDetails: { mode: "carcaca", pricePerKg: 34.50, weightKg: 6135 }, notes: "DURAZNO | Carcaça 6135kg (19,5kg/cab) | US$5,75/kg (×6,00) = R$34,50/kg | R$674/animal" },
    { sourceId: "pdf-mov-2026-01-27-chiquita-venda-novillos-agrooriental", type: "venda", date: "2026-01-27", categoryId: "pdf-novillos", categoryName: "Novillos", quantity: 156, delta: -156, value: 1267336, saleDetails: { mode: "vivo", pricePerKg: 18.06, weightKg: 70188 }, notes: "AGROORIENTAL | Peso médio 449,93kg | US$2,96/kg (×6,10) = R$18,06/kg | R$8124/animal" },
    { sourceId: "pdf-mov-2026-03-30-chiquita-venda-novillos", type: "venda", date: "2026-03-30", categoryId: "pdf-novillos", categoryName: "Novillos", quantity: 46, delta: -46, value: 424681, saleDetails: { mode: "vivo", pricePerKg: 19.60, weightKg: 21666 }, notes: "Peso médio 471kg | US$3,35/kg (×5,85) = R$19,60/kg | R$9232/animal" },
    // Compras (valores já em R$)
    { sourceId: "pdf-mov-2025-10-23-chiquita-compra-terneiros", type: "compra", date: "2025-10-23", categoryId: "pdf-terneiros", categoryName: "Terneiros", quantity: 28, delta: 28, value: 19031, saleDetails: null, notes: "Ganadeira | P.médio 185kg | R$3,65/kg | R$680/animal" },
    { sourceId: "pdf-mov-2025-10-23-chiquita-compra-novilhos", type: "compra", date: "2025-10-23", categoryId: "pdf-novilhos", categoryName: "Novilhos", quantity: 26, delta: 26, value: 29419, saleDetails: null, notes: "Ganadeira | P.médio 365kg | R$3,10/kg | R$1132/animal" },
    { sourceId: "pdf-mov-2025-10-13-chiquita-compra-touros", type: "compra", date: "2025-10-13", categoryId: "pdf-touros", categoryName: "Touros", quantity: 6, delta: 6, value: 0, saleDetails: null, notes: "Compra de 6 touros (valor não informado)" },
    { sourceId: "pdf-mov-2026-01-02-chiquita-compra-novillos", type: "compra", date: "2026-01-02", categoryId: "pdf-novillos", categoryName: "Novillos", quantity: 52, delta: 52, value: 53704, saleDetails: null, notes: "Ganadeira | P.médio 243kg | R$679,80/animal" },
    { sourceId: "pdf-mov-2026-02-18-chiquita-compra-terneiros", type: "compra", date: "2026-02-18", categoryId: "pdf-terneiros", categoryName: "Terneiros", quantity: 79, delta: 79, value: 0, saleDetails: null, notes: "Ganadeira | P.médio 165kg | 13035kg total | R$4,12/kg" },
    { sourceId: "pdf-mov-2026-02-25-chiquita-compra-terneiros", type: "compra", date: "2026-02-25", categoryId: "pdf-terneiros", categoryName: "Terneiros", quantity: 119, delta: 119, value: 92280, saleDetails: null, notes: "Ganadeira | P.médio 203kg | 24157kg total | R$3,82/kg | R$775,46/animal" }
  ],
  "passa-da-guarda": [
    // Vendas já existentes
    { sourceId: "pdf-mov-2025-10-06-passa-da-guarda-venda-vacas", type: "venda", date: "2025-10-06", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 22, delta: -22, value: 97092, saleDetails: { mode: "vivo", pricePerKg: 9, weightKg: 10788 }, notes: "KROT | P.médio 490,4kg | R$9,00/kg | R$4413/animal" },
    { sourceId: "pdf-mov-2025-10-06-passa-da-guarda-venda-bois", type: "venda", date: "2025-10-06", categoryId: "pdf-bois", categoryName: "Bois", quantity: 12, delta: -12, value: 61646, saleDetails: { mode: "vivo", pricePerKg: 10.5, weightKg: 5871 }, notes: "KROT | P.médio 489,3kg | R$10,50/kg | R$5137/animal" },
    { sourceId: "pdf-mov-2025-08-11-passa-da-guarda-venda-bois", type: "venda", date: "2025-08-11", categoryId: "pdf-bois", categoryName: "Bois", quantity: 23, delta: -23, value: 121569, saleDetails: { mode: "vivo", pricePerKg: 10.5, weightKg: 11578 }, notes: "P.médio 503,4kg | R$10,50/kg | R$5286/animal" },
    { sourceId: "pdf-mov-2025-08-11-passa-da-guarda-venda-vacas", type: "venda", date: "2025-08-11", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 23, delta: -23, value: 97974, saleDetails: { mode: "vivo", pricePerKg: 9, weightKg: 10886 }, notes: "P.médio 473,3kg | R$9,00/kg | R$4260/animal" },
    { sourceId: "pdf-mov-2025-10-21-passa-da-guarda-venda-bois", type: "venda", date: "2025-10-21", categoryId: "pdf-bois", categoryName: "Bois", quantity: 15, delta: -15, value: 79537.5, saleDetails: { mode: "vivo", pricePerKg: 10.5, weightKg: 7575 }, notes: "FRIGOVALE | P.médio 505kg | R$10,50/kg | R$5303/animal" },
    { sourceId: "pdf-mov-2025-11-04-passa-da-guarda-venda-bois", type: "venda", date: "2025-11-04", categoryId: "pdf-bois", categoryName: "Bois", quantity: 10, delta: -10, value: 47670, saleDetails: { mode: "vivo", pricePerKg: 10.5, weightKg: 4540 }, notes: "P.médio 454kg | R$10,50/kg | R$4767/animal" },
    { sourceId: "pdf-mov-2025-11-04-passa-da-guarda-venda-vacas", type: "venda", date: "2025-11-04", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 35, delta: -35, value: 148995, saleDetails: { mode: "vivo", pricePerKg: 9, weightKg: 16555 }, notes: "P.médio 473kg | R$9,00/kg | R$4257/animal" },
    { sourceId: "pdf-mov-2025-12-17-passa-da-guarda-venda-cordeiros", type: "venda", date: "2025-12-17", categoryId: "pdf-cordeiros", categoryName: "Cordeiros", quantity: 50, delta: -50, value: 20450, saleDetails: { mode: "vivo", pricePerKg: 12.5, weightKg: 1636 }, notes: "Cordeiros | P.médio 32,72kg | R$12,50/kg | R$409/animal" },
    { sourceId: "pdf-mov-2026-01-22-passa-da-guarda-venda-vacas", type: "venda", date: "2026-01-22", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 15, delta: -15, value: 74551.4, saleDetails: { mode: "vivo", pricePerKg: 10.3, weightKg: 7238 }, notes: "P.médio 471kg | R$10,30/kg | R$4970/animal" },
    { sourceId: "pdf-mov-2026-01-22-passa-da-guarda-venda-bois", type: "venda", date: "2026-01-22", categoryId: "pdf-bois", categoryName: "Bois", quantity: 10, delta: -10, value: 49714.5, saleDetails: { mode: "vivo", pricePerKg: 11.5, weightKg: 4323 }, notes: "P.médio 432kg | R$11,50/kg | R$4971/animal" },
    { sourceId: "pdf-mov-2026-03-04-passa-da-guarda-venda-bois", type: "venda", date: "2026-03-04", categoryId: "pdf-bois", categoryName: "Bois", quantity: 25, delta: -25, value: 140388, saleDetails: { mode: "vivo", pricePerKg: 12, weightKg: 11699 }, notes: "P.médio 467kg | R$12,00/kg | R$5616/animal" },
    { sourceId: "pdf-mov-2026-03-07-passa-da-guarda-venda-vacas", type: "venda", date: "2026-03-07", categoryId: "pdf-vacas", categoryName: "Vacas", quantity: 32, delta: -32, value: 162613, saleDetails: { mode: "vivo", pricePerKg: 10.5, weightKg: 15487 }, notes: "P.médio 484kg | R$10,50/kg | R$5082/animal" },
    { sourceId: "pdf-mov-2026-03-17-passa-da-guarda-venda-vaquillonas-navio", type: "venda", date: "2026-03-17", categoryId: "pdf-vaquillonas", categoryName: "Vaquillonas", quantity: 41, delta: -41, value: 202419, saleDetails: { mode: "vivo", pricePerKg: 13.5, weightKg: 14994 }, notes: "NAVIO | P.médio 365,7kg | R$13,50/kg | R$4937/animal" },
    { sourceId: "pdf-mov-2026-04-04-passa-da-guarda-venda-bois-navio", type: "venda", date: "2026-04-04", categoryId: "pdf-bois", categoryName: "Bois", quantity: 25, delta: -25, value: 133137.5, saleDetails: { mode: "vivo", pricePerKg: 12.5, weightKg: 10651 }, notes: "NAVIO | P.médio 426kg | R$12,50/kg | R$5326/animal" }
  ],
  colorado: [
    { sourceId: "pdf-mov-2025-10-17-colorado-compra-boi-1-ano", type: "compra", date: "2025-10-17", categoryId: "pdf-boi-1-ano", categoryName: "Boi 1 ano", quantity: 20, delta: 20, value: 69747, saleDetails: null, notes: "Importado do PDF mensal: compra de 20 bois de 1 ano." }
  ],
  sarandi: [
    { sourceId: "pdf-mov-2025-08-25-sarandi-venda-bois", type: "venda", date: "2025-08-25", categoryId: "pdf-bois", categoryName: "Bois", quantity: 50, delta: -50, value: 255904, saleDetails: { mode: "vivo", pricePerKg: 11, weightKg: 23264 }, notes: "TCHARLIE | P.médio 465kg | R$11,00/kg | R$5118/animal" },
    { sourceId: "pdf-mov-2025-10-09-sarandi-compra-bois", type: "compra", date: "2025-10-09", categoryId: "pdf-bois", categoryName: "Bois", quantity: 23, delta: 23, value: 71112.5, saleDetails: null, notes: "LUCAS | P.médio 247,35kg | R$12,50/kg | R$3092/animal" },
    { sourceId: "pdf-mov-2025-10-21-sarandi-compra-bois-lote-20", type: "compra", date: "2025-10-21", categoryId: "pdf-bois", categoryName: "Bois", quantity: 20, delta: 20, value: 73371.9, saleDetails: null, notes: "PUJOL | P.médio 311kg | R$11,25/kg | R$3493,90/animal" },
    { sourceId: "pdf-mov-2025-10-21-sarandi-compra-bois-lote-21", type: "compra", date: "2025-10-21", categoryId: "pdf-bois", categoryName: "Bois", quantity: 21, delta: 21, value: 73371.9, saleDetails: null, notes: "PUJOL | R$3493,90/animal" },
    { sourceId: "pdf-mov-2025-10-21-sarandi-compra-terneiros", type: "compra", date: "2025-10-21", categoryId: "pdf-terneiros", categoryName: "Terneiros", quantity: 10, delta: 10, value: 24299, saleDetails: null, notes: "NELZA QUADROS | P.médio 221kg | R$11,00/kg | R$2429,90/animal" },
    { sourceId: "pdf-mov-2025-10-21-sarandi-venda-bois", type: "venda", date: "2025-10-21", categoryId: "pdf-bois", categoryName: "Bois", quantity: 16, delta: -16, value: 91077, saleDetails: { mode: "vivo", pricePerKg: 10.5, weightKg: 8674 }, notes: "FRIGOVALE | P.médio 542kg | R$10,50/kg | R$5692/animal" },
    { sourceId: "pdf-mov-2025-11-24-sarandi-venda-bois-tcharlie", type: "venda", date: "2025-11-24", categoryId: "pdf-bois", categoryName: "Bois", quantity: 100, delta: -100, value: 509008.2, saleDetails: { mode: "vivo", pricePerKg: 10.9, weightKg: 46698 }, notes: "TCHARLIE | P.médio 467kg | R$10,90/kg | R$5090/animal" },
    { sourceId: "pdf-mov-2026-01-14-sarandi-venda-bois-renan", type: "venda", date: "2026-01-14", categoryId: "pdf-bois", categoryName: "Bois", quantity: 44, delta: -44, value: 244752, saleDetails: { mode: "vivo", pricePerKg: 12, weightKg: 20396 }, notes: "RENAN SALD | P.médio 463,5kg | R$12,00/kg | R$5563/animal" },
    { sourceId: "pdf-mov-2026-01-19-sarandi-venda-bois-tcharlie", type: "venda", date: "2026-01-19", categoryId: "pdf-bois", categoryName: "Bois", quantity: 75, delta: -75, value: 400716, saleDetails: { mode: "vivo", pricePerKg: 12, weightKg: 33393 }, notes: "TCHARLIE | P.médio 445kg | R$12,00/kg | R$5342,88/animal" },
    { sourceId: "pdf-mov-2026-03-01-sarandi-venda-bois-frigovale", type: "venda", date: "2026-03-01", categoryId: "pdf-bois", categoryName: "Bois", quantity: 16, delta: -16, value: 91816, saleDetails: { mode: "vivo", pricePerKg: 11.5, weightKg: 7984 }, notes: "FRIGOVALE | P.médio 499kg | R$11,50/kg | R$5738,50/animal" },
    { sourceId: "pdf-mov-2026-02-21-sarandi-venda-bois-confinamento", type: "venda", date: "2026-02-21", categoryId: "pdf-bois", categoryName: "Bois", quantity: 45, delta: -45, value: 253260, saleDetails: { mode: "vivo", pricePerKg: 12, weightKg: 21105 }, notes: "CONFINAMENTO | P.médio 469kg | R$12,00/kg | R$5628/animal" }
  ]
};

const seedData = {
  selectedFarmId: TOTAL_FARM_ID,
  auth: {
    sessionUserId: "",
    users: DEFAULT_USERS.map((user) => ({ ...user }))
  },
  farms: {
    "fazenda-01": {
      id: "fazenda-01",
      name: "Fazenda 01",
      declaredTotal: 14200,
      note: "Estrutura pronta para receber o inventario inicial e futuras mudancas de manejo.",
      importedBaselineVersion: 0,
      sanitaryProducts: [
        "Vacina aftosa",
        "Vermífugo",
        "Ivermectina"
      ],
      potreiros: [
        {
          id: "f1-potreiro-1",
          name: "Potreiro 1",
          quantity: 0
        },
        {
          id: "f1-potreiro-2",
          name: "Potreiro 2",
          quantity: 0
        },
        {
          id: "f1-potreiro-3",
          name: "Potreiro 3",
          quantity: 0
        },
        {
          id: "f1-potreiro-4",
          name: "Potreiro 4",
          quantity: 0
        },
        {
          id: "f1-potreiro-5",
          name: "Potreiro 5",
          quantity: 0
        },
        {
          id: "f1-potreiro-6",
          name: "Potreiro 6",
          quantity: 0
        }
      ],
      categories: [
        {
          id: "vacas-cria",
          name: "Vacas de cria",
          quantity: 1850,
          allocation: {
            "f1-potreiro-1": 313,
            "f1-potreiro-2": 250,
            "f1-potreiro-3": 375,
            "f1-potreiro-4": 107,
            "f1-potreiro-5": 447,
            "f1-potreiro-6": 197,
            __unallocated__: 161
          }
        },
        {
          id: "terneiros-machos",
          name: "Terneiros 1 a 2 anos - machos",
          quantity: 1700,
          allocation: {
            "f1-potreiro-1": 287,
            "f1-potreiro-2": 230,
            "f1-potreiro-3": 345,
            "f1-potreiro-4": 98,
            "f1-potreiro-5": 411,
            "f1-potreiro-6": 181,
            __unallocated__: 148
          }
        },
        {
          id: "terneiros-femeas",
          name: "Terneiros 1 a 2 anos - fêmeas",
          quantity: 1680,
          allocation: {
            "f1-potreiro-1": 284,
            "f1-potreiro-2": 227,
            "f1-potreiro-3": 341,
            "f1-potreiro-4": 97,
            "f1-potreiro-5": 406,
            "f1-potreiro-6": 179,
            __unallocated__: 146
          }
        },
        {
          id: "bois-abate",
          name: "Bois de abate",
          quantity: 2200,
          allocation: {
            "f1-potreiro-1": 372,
            "f1-potreiro-2": 298,
            "f1-potreiro-3": 446,
            "f1-potreiro-4": 128,
            "f1-potreiro-5": 531,
            "f1-potreiro-6": 234,
            __unallocated__: 191
          }
        },
        {
          id: "novilhas-entouradas",
          name: "Novilhas entouradas",
          quantity: 1900,
          allocation: {
            "f1-potreiro-1": 321,
            "f1-potreiro-2": 257,
            "f1-potreiro-3": 386,
            "f1-potreiro-4": 110,
            "f1-potreiro-5": 459,
            "f1-potreiro-6": 202,
            __unallocated__: 165
          }
        },
        {
          id: "touros",
          name: "Touros",
          quantity: 1750,
          allocation: {
            "f1-potreiro-1": 296,
            "f1-potreiro-2": 237,
            "f1-potreiro-3": 355,
            "f1-potreiro-4": 101,
            "f1-potreiro-5": 423,
            "f1-potreiro-6": 186,
            __unallocated__: 152
          }
        },
        {
          id: "vacas-invernar",
          name: "Vacas de invernar",
          quantity: 1500,
          allocation: {
            "f1-potreiro-1": 254,
            "f1-potreiro-2": 203,
            "f1-potreiro-3": 304,
            "f1-potreiro-4": 87,
            "f1-potreiro-5": 362,
            "f1-potreiro-6": 159,
            __unallocated__: 131
          }
        },
        {
          id: "vacas-entouradas",
          name: "Vacas entouradas",
          quantity: 1620,
          allocation: {
            "f1-potreiro-1": 274,
            "f1-potreiro-2": 219,
            "f1-potreiro-3": 329,
            "f1-potreiro-4": 94,
            "f1-potreiro-5": 391,
            "f1-potreiro-6": 172,
            __unallocated__: 141
          }
        }
      ],
      movements: [
        {
          id: "seed-mov-f1-01",
          code: "F100001",
          type: "consumo",
          date: "2026-02-10",
          categoryId: "bois-abate",
          categoryName: "Bois de abate",
          quantity: 10,
          delta: -10,
          value: 0,
          saleDetails: null,
          notes: "Abate para consumo interno na sede da fazenda",
          potreiro: "f1-potreiro-1",
          sourceId: "",
          photos: []
        },
        {
          id: "seed-mov-f1-02",
          code: "F100002",
          type: "morte",
          date: "2026-03-22",
          categoryId: "terneiros-femeas",
          categoryName: "Terneiros 1 a 2 anos - fêmeas",
          quantity: 3,
          delta: -3,
          value: 0,
          saleDetails: null,
          notes: "Pneumonia detectada tardiamente, tratamento iniciado sem sucesso",
          potreiro: "f1-potreiro-4",
          sourceId: "",
          cause: "doenca",
          customCause: "",
          photos: []
        },
        {
          id: "seed-mov-f1-03",
          code: "F100003",
          type: "consumo",
          date: "2026-04-18",
          categoryId: "vacas-invernar",
          categoryName: "Vacas de invernar",
          quantity: 6,
          delta: -6,
          value: 0,
          saleDetails: null,
          notes: "Consumo em evento de confraternização com a equipe",
          potreiro: "f1-potreiro-2",
          sourceId: "",
          photos: []
        }
      ],
      sanitaryRecords: [],
      monthlyRecords: [],
      reproductionRecords: [],
      reproductionCodeSequence: 0,
      ovinos: [
        {
          id: "ovino-0001",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 220
        },
        {
          id: "ovino-0002",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Ideal",
          breedOther: "",
          quantity: 180
        },
        {
          id: "ovino-0003",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Merino",
          breedOther: "",
          quantity: 150
        },
        {
          id: "ovino-0004",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Texel",
          breedOther: "",
          quantity: 100
        },
        {
          id: "ovino-0005",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Outra",
          breedOther: "Dorper",
          quantity: 50
        },
        {
          id: "ovino-0006",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 110
        },
        {
          id: "ovino-0007",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Ideal",
          breedOther: "",
          quantity: 90
        },
        {
          id: "ovino-0008",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Merino",
          breedOther: "",
          quantity: 60
        },
        {
          id: "ovino-0009",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Texel",
          breedOther: "",
          quantity: 40
        },
        {
          id: "ovino-0010",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 90
        },
        {
          id: "ovino-0011",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Ideal",
          breedOther: "",
          quantity: 70
        },
        {
          id: "ovino-0012",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Merino",
          breedOther: "",
          quantity: 40
        },
        {
          id: "ovino-0013",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 40
        },
        {
          id: "ovino-0014",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Ideal",
          breedOther: "",
          quantity: 30
        },
        {
          id: "ovino-0015",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Merino",
          breedOther: "",
          quantity: 20
        },
        {
          id: "ovino-0016",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Texel",
          breedOther: "",
          quantity: 10
        }
      ],
      pastureAreas: [
        {
          id: "pasture-0017",
          name: "Potreiro 4",
          potreiroId: "f1-potreiro-4",
          sizeHa: 12,
          culture: "azevem",
          customCulture: "",
          season: "2025/2026",
          startDate: "2026-04-15",
          status: "manejo",
          procedures: [
            {
              id: "proc-0018",
              date: "2026-04-15",
              type: "preparo-solo",
              customType: "",
              description: "Preparo de solo para implantação do azevém",
              responsible: "Equipe própria",
              areaHa: 12,
              quantity: 12,
              unit: "hectare",
              unitValue: 300,
              totalValue: 3600,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0019",
              date: "2026-04-22",
              type: "semeadura",
              customType: "",
              description: "Semeadura de azevém",
              responsible: "Carlos Silva",
              areaHa: 12,
              quantity: 12,
              unit: "hectare",
              unitValue: 250,
              totalValue: 3000,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0020",
              date: "2026-05-10",
              type: "aplicacao-adubo-calcario",
              customType: "",
              description: "Adubação de cobertura",
              responsible: "Equipe própria",
              areaHa: 12,
              quantity: 6,
              unit: "saco",
              unitValue: 400,
              totalValue: 2400,
              notes: "",
              attachment: null
            }
          ]
        },
        {
          id: "pasture-0021",
          name: "Potreiro 1",
          potreiroId: "f1-potreiro-1",
          sizeHa: 35,
          culture: "braquiaria",
          customCulture: "",
          season: "2025/2026",
          startDate: "2026-05-01",
          status: "implantacao",
          procedures: [
            {
              id: "proc-0022",
              date: "2026-05-01",
              type: "nivelamento",
              customType: "",
              description: "Nivelamento da área para plantio",
              responsible: "Terraplanagem Bravo",
              areaHa: 35,
              quantity: 35,
              unit: "hectare",
              unitValue: 180,
              totalValue: 6300,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0023",
              date: "2026-05-10",
              type: "plantio-aviao",
              customType: "",
              description: "Plantio aéreo de braquiária",
              responsible: "Aviação Sul",
              areaHa: 35,
              quantity: 35,
              unit: "hectare",
              unitValue: 220,
              totalValue: 7700,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0024",
              date: "2026-05-12",
              type: "combustivel",
              customType: "",
              description: "Combustível para maquinário",
              responsible: "Equipe própria",
              areaHa: 35,
              quantity: 150,
              unit: "litro",
              unitValue: 6.2,
              totalValue: 930,
              notes: "",
              attachment: null
            }
          ]
        },
        {
          id: "pasture-0025",
          name: "Potreiro 3",
          potreiroId: "f1-potreiro-3",
          sizeHa: 42,
          culture: "milheto",
          customCulture: "",
          season: "2024/2025",
          startDate: "2026-01-10",
          status: "finalizada",
          procedures: [
            {
              id: "proc-0026",
              date: "2026-01-10",
              type: "preparo-solo",
              customType: "",
              description: "Preparo de solo para milheto",
              responsible: "Equipe própria",
              areaHa: 42,
              quantity: 42,
              unit: "hectare",
              unitValue: 280,
              totalValue: 11760,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0027",
              date: "2026-01-18",
              type: "semeadura",
              customType: "",
              description: "Semeadura de milheto",
              responsible: "Carlos Silva",
              areaHa: 42,
              quantity: 42,
              unit: "hectare",
              unitValue: 200,
              totalValue: 8400,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0028",
              date: "2026-02-05",
              type: "pulverizacao",
              customType: "",
              description: "Pulverização contra plantas daninhas",
              responsible: "AgroDrone",
              areaHa: 42,
              quantity: 42,
              unit: "hectare",
              unitValue: 90,
              totalValue: 3780,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0029",
              date: "2026-02-20",
              type: "mao-obra",
              customType: "",
              description: "Mão de obra para manutenção",
              responsible: "Equipe própria",
              areaHa: 42,
              quantity: 8,
              unit: "diaria",
              unitValue: 180,
              totalValue: 1440,
              notes: "",
              attachment: null
            }
          ]
        },
        {
          id: "pasture-0030",
          name: "Potreiro 5",
          potreiroId: "f1-potreiro-5",
          sizeHa: 50,
          culture: "campo-nativo-melhorado",
          customCulture: "",
          season: "2025/2026",
          startDate: "2026-07-01",
          status: "planejada",
          procedures: []
        }
      ]
    },
    "fazenda-02": {
      id: "fazenda-02",
      name: "Fazenda 02",
      declaredTotal: 13040,
      note: "Estrutura pronta para receber o inventario inicial e futuras mudancas de manejo.",
      importedBaselineVersion: 0,
      sanitaryProducts: [
        "Vacina aftosa",
        "Vermífugo",
        "Ivermectina"
      ],
      potreiros: [
        {
          id: "f2-potreiro-1",
          name: "Potreiro 1",
          quantity: 0
        },
        {
          id: "f2-potreiro-2",
          name: "Potreiro 2",
          quantity: 0
        },
        {
          id: "f2-potreiro-3",
          name: "Potreiro 3",
          quantity: 0
        },
        {
          id: "f2-potreiro-4",
          name: "Potreiro 4",
          quantity: 0
        },
        {
          id: "f2-potreiro-5",
          name: "Potreiro 5",
          quantity: 0
        }
      ],
      categories: [
        {
          id: "vacas-cria",
          name: "Vacas de cria",
          quantity: 1620,
          allocation: {
            "f2-potreiro-1": 286,
            "f2-potreiro-2": 429,
            "f2-potreiro-3": 172,
            "f2-potreiro-4": 362,
            "f2-potreiro-5": 238,
            __unallocated__: 133
          }
        },
        {
          id: "terneiros-machos",
          name: "Terneiros 1 a 2 anos - machos",
          quantity: 1750,
          allocation: {
            "f2-potreiro-1": 309,
            "f2-potreiro-2": 463,
            "f2-potreiro-3": 185,
            "f2-potreiro-4": 391,
            "f2-potreiro-5": 258,
            __unallocated__: 144
          }
        },
        {
          id: "terneiros-femeas",
          name: "Terneiros 1 a 2 anos - fêmeas",
          quantity: 1640,
          allocation: {
            "f2-potreiro-1": 289,
            "f2-potreiro-2": 434,
            "f2-potreiro-3": 174,
            "f2-potreiro-4": 367,
            "f2-potreiro-5": 241,
            __unallocated__: 135
          }
        },
        {
          id: "bois-abate",
          name: "Bois de abate",
          quantity: 1500,
          allocation: {
            "f2-potreiro-1": 265,
            "f2-potreiro-2": 397,
            "f2-potreiro-3": 159,
            "f2-potreiro-4": 335,
            "f2-potreiro-5": 221,
            __unallocated__: 123
          }
        },
        {
          id: "novilhas-entouradas",
          name: "Novilhas entouradas",
          quantity: 1450,
          allocation: {
            "f2-potreiro-1": 256,
            "f2-potreiro-2": 384,
            "f2-potreiro-3": 154,
            "f2-potreiro-4": 324,
            "f2-potreiro-5": 213,
            __unallocated__: 119
          }
        },
        {
          id: "touros",
          name: "Touros",
          quantity: 1600,
          allocation: {
            "f2-potreiro-1": 282,
            "f2-potreiro-2": 424,
            "f2-potreiro-3": 169,
            "f2-potreiro-4": 358,
            "f2-potreiro-5": 235,
            __unallocated__: 132
          }
        },
        {
          id: "vacas-invernar",
          name: "Vacas de invernar",
          quantity: 1800,
          allocation: {
            "f2-potreiro-1": 318,
            "f2-potreiro-2": 476,
            "f2-potreiro-3": 191,
            "f2-potreiro-4": 402,
            "f2-potreiro-5": 265,
            __unallocated__: 148
          }
        },
        {
          id: "vacas-entouradas",
          name: "Vacas entouradas",
          quantity: 1680,
          allocation: {
            "f2-potreiro-1": 296,
            "f2-potreiro-2": 445,
            "f2-potreiro-3": 178,
            "f2-potreiro-4": 376,
            "f2-potreiro-5": 247,
            __unallocated__: 138
          }
        }
      ],
      movements: [
        {
          id: "seed-mov-f2-01",
          code: "F200001",
          type: "morte",
          date: "2026-01-30",
          categoryId: "novilhas-entouradas",
          categoryName: "Novilhas entouradas",
          quantity: 4,
          delta: -4,
          value: 0,
          saleDetails: null,
          notes: "Indícios de ataque de predador próximo à mata ciliar",
          potreiro: "f2-potreiro-3",
          sourceId: "",
          cause: "predador",
          customCause: "",
          photos: []
        },
        {
          id: "seed-mov-f2-02",
          code: "F200002",
          type: "consumo",
          date: "2026-02-25",
          categoryId: "bois-abate",
          categoryName: "Bois de abate",
          quantity: 12,
          delta: -12,
          value: 0,
          saleDetails: null,
          notes: "Abate programado para consumo interno",
          potreiro: "f2-potreiro-1",
          sourceId: "",
          photos: []
        },
        {
          id: "seed-mov-f2-03",
          code: "F200003",
          type: "consumo",
          date: "2026-05-08",
          categoryId: "vacas-entouradas",
          categoryName: "Vacas entouradas",
          quantity: 5,
          delta: -5,
          value: 0,
          saleDetails: null,
          notes: "Consumo em evento com colaboradores",
          potreiro: "f2-potreiro-4",
          sourceId: "",
          photos: []
        }
      ],
      sanitaryRecords: [],
      monthlyRecords: [],
      reproductionRecords: [],
      reproductionCodeSequence: 0,
      ovinos: [
        {
          id: "ovino-0031",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 150
        },
        {
          id: "ovino-0032",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Ideal",
          breedOther: "",
          quantity: 120
        },
        {
          id: "ovino-0033",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Merino",
          breedOther: "",
          quantity: 100
        },
        {
          id: "ovino-0034",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Texel",
          breedOther: "",
          quantity: 80
        },
        {
          id: "ovino-0035",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 80
        },
        {
          id: "ovino-0036",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Ideal",
          breedOther: "",
          quantity: 70
        },
        {
          id: "ovino-0037",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Merino",
          breedOther: "",
          quantity: 50
        },
        {
          id: "ovino-0038",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 80
        },
        {
          id: "ovino-0039",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Ideal",
          breedOther: "",
          quantity: 60
        },
        {
          id: "ovino-0040",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Texel",
          breedOther: "",
          quantity: 40
        },
        {
          id: "ovino-0041",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Merino",
          breedOther: "",
          quantity: 20
        },
        {
          id: "ovino-0042",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 35
        },
        {
          id: "ovino-0043",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Ideal",
          breedOther: "",
          quantity: 25
        },
        {
          id: "ovino-0044",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Merino",
          breedOther: "",
          quantity: 20
        },
        {
          id: "ovino-0045",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Texel",
          breedOther: "",
          quantity: 20
        }
      ],
      pastureAreas: [
        {
          id: "pasture-0046",
          name: "Potreiro 2",
          potreiroId: "f2-potreiro-2",
          sizeHa: 45,
          culture: "sorgo",
          customCulture: "",
          season: "2025/2026",
          startDate: "2026-03-01",
          status: "manejo",
          procedures: [
            {
              id: "proc-0047",
              date: "2026-03-01",
              type: "preparo-solo",
              customType: "",
              description: "Preparo de solo para sorgo forrageiro",
              responsible: "Equipe própria",
              areaHa: 45,
              quantity: 45,
              unit: "hectare",
              unitValue: 270,
              totalValue: 12150,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0048",
              date: "2026-03-08",
              type: "semeadura",
              customType: "",
              description: "Semeadura de sorgo",
              responsible: "Carlos Silva",
              areaHa: 45,
              quantity: 45,
              unit: "hectare",
              unitValue: 210,
              totalValue: 9450,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0049",
              date: "2026-03-25",
              type: "irrigacao",
              customType: "",
              description: "Irrigação de apoio",
              responsible: "Equipe própria",
              areaHa: 45,
              quantity: 20,
              unit: "hora-maquina",
              unitValue: 350,
              totalValue: 7000,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0050",
              date: "2026-04-10",
              type: "aplicacao-ureia",
              customType: "",
              description: "Aplicação de ureia em cobertura",
              responsible: "Equipe própria",
              areaHa: 45,
              quantity: 9,
              unit: "saco",
              unitValue: 380,
              totalValue: 3420,
              notes: "",
              attachment: null
            }
          ]
        },
        {
          id: "pasture-0051",
          name: "Potreiro 4",
          potreiroId: "f2-potreiro-4",
          sizeHa: 38,
          culture: "aveia",
          customCulture: "",
          season: "2024/2025",
          startDate: "2026-01-05",
          status: "finalizada",
          procedures: [
            {
              id: "proc-0052",
              date: "2026-01-05",
              type: "nivelamento",
              customType: "",
              description: "Nivelamento com grade niveladora",
              responsible: "Terraplanagem Bravo",
              areaHa: 38,
              quantity: 38,
              unit: "hectare",
              unitValue: 175,
              totalValue: 6650,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0053",
              date: "2026-01-13",
              type: "semeadura",
              customType: "",
              description: "Semeadura de aveia",
              responsible: "Carlos Silva",
              areaHa: 38,
              quantity: 38,
              unit: "hectare",
              unitValue: 195,
              totalValue: 7410,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0054",
              date: "2026-01-25",
              type: "pulverizacao",
              customType: "",
              description: "Pulverização preventiva",
              responsible: "AgroDrone",
              areaHa: 38,
              quantity: 38,
              unit: "hectare",
              unitValue: 85,
              totalValue: 3230,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0055",
              date: "2026-02-10",
              type: "terceirizacao",
              customType: "",
              description: "Colheita terceirizada",
              responsible: "Agro Serviços RS",
              areaHa: 38,
              quantity: 1,
              unit: "unidade",
              unitValue: 4200,
              totalValue: 4200,
              notes: "",
              attachment: null
            }
          ]
        },
        {
          id: "pasture-0056",
          name: "Potreiro 1",
          potreiroId: "f2-potreiro-1",
          sizeHa: 30,
          culture: "tifton",
          customCulture: "",
          season: "2025/2026",
          startDate: "2026-04-12",
          status: "implantacao",
          procedures: [
            {
              id: "proc-0057",
              date: "2026-04-12",
              type: "implementacao-maquinario",
              customType: "",
              description: "Implantação mecanizada de tifton",
              responsible: "Equipe própria",
              areaHa: 30,
              quantity: 30,
              unit: "hectare",
              unitValue: 320,
              totalValue: 9600,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0058",
              date: "2026-04-20",
              type: "plantio-aviao",
              customType: "",
              description: "Plantio aéreo complementar",
              responsible: "Aviação Sul",
              areaHa: 30,
              quantity: 30,
              unit: "hectare",
              unitValue: 230,
              totalValue: 6900,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0059",
              date: "2026-05-15",
              type: "replantio",
              customType: "",
              description: "Replantio de falhas",
              responsible: "Equipe própria",
              areaHa: 5,
              quantity: 5,
              unit: "hectare",
              unitValue: 230,
              totalValue: 1150,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0060",
              date: "2026-05-20",
              type: "mao-obra",
              customType: "",
              description: "Mão de obra geral",
              responsible: "Equipe própria",
              areaHa: 30,
              quantity: 6,
              unit: "diaria",
              unitValue: 175,
              totalValue: 1050,
              notes: "",
              attachment: null
            }
          ]
        },
        {
          id: "pasture-0061",
          name: "Potreiro 5",
          potreiroId: "f2-potreiro-5",
          sizeHa: 25,
          culture: "milho",
          customCulture: "",
          season: "2025/2026",
          startDate: "2026-07-15",
          status: "planejada",
          procedures: []
        }
      ]
    },
    "fazenda-03": {
      id: "fazenda-03",
      name: "Fazenda 03",
      declaredTotal: 12760,
      note: "Estrutura pronta para receber o inventario inicial e futuras mudancas de manejo.",
      importedBaselineVersion: 0,
      sanitaryProducts: [
        "Vacina aftosa",
        "Vermífugo",
        "Ivermectina"
      ],
      potreiros: [
        {
          id: "f3-potreiro-1",
          name: "Potreiro 1",
          quantity: 0
        },
        {
          id: "f3-potreiro-2",
          name: "Potreiro 2",
          quantity: 0
        },
        {
          id: "f3-potreiro-3",
          name: "Potreiro 3",
          quantity: 0
        },
        {
          id: "f3-potreiro-4",
          name: "Potreiro 4",
          quantity: 0
        },
        {
          id: "f3-potreiro-5",
          name: "Potreiro 5",
          quantity: 0
        }
      ],
      categories: [
        {
          id: "vacas-cria",
          name: "Vacas de cria",
          quantity: 1530,
          allocation: {
            "f3-potreiro-1": 364,
            "f3-potreiro-2": 301,
            "f3-potreiro-3": 137,
            "f3-potreiro-4": 437,
            "f3-potreiro-5": 182,
            __unallocated__: 109
          }
        },
        {
          id: "terneiros-machos",
          name: "Terneiros 1 a 2 anos - machos",
          quantity: 1550,
          allocation: {
            "f3-potreiro-1": 369,
            "f3-potreiro-2": 304,
            "f3-potreiro-3": 138,
            "f3-potreiro-4": 443,
            "f3-potreiro-5": 185,
            __unallocated__: 111
          }
        },
        {
          id: "terneiros-femeas",
          name: "Terneiros 1 a 2 anos - fêmeas",
          quantity: 1680,
          allocation: {
            "f3-potreiro-1": 400,
            "f3-potreiro-2": 330,
            "f3-potreiro-3": 150,
            "f3-potreiro-4": 480,
            "f3-potreiro-5": 200,
            __unallocated__: 120
          }
        },
        {
          id: "bois-abate",
          name: "Bois de abate",
          quantity: 1300,
          allocation: {
            "f3-potreiro-1": 310,
            "f3-potreiro-2": 255,
            "f3-potreiro-3": 116,
            "f3-potreiro-4": 371,
            "f3-potreiro-5": 155,
            __unallocated__: 93
          }
        },
        {
          id: "novilhas-entouradas",
          name: "Novilhas entouradas",
          quantity: 1650,
          allocation: {
            "f3-potreiro-1": 393,
            "f3-potreiro-2": 324,
            "f3-potreiro-3": 147,
            "f3-potreiro-4": 472,
            "f3-potreiro-5": 196,
            __unallocated__: 118
          }
        },
        {
          id: "touros",
          name: "Touros",
          quantity: 1650,
          allocation: {
            "f3-potreiro-1": 393,
            "f3-potreiro-2": 324,
            "f3-potreiro-3": 147,
            "f3-potreiro-4": 472,
            "f3-potreiro-5": 196,
            __unallocated__: 118
          }
        },
        {
          id: "vacas-invernar",
          name: "Vacas de invernar",
          quantity: 1700,
          allocation: {
            "f3-potreiro-1": 405,
            "f3-potreiro-2": 334,
            "f3-potreiro-3": 152,
            "f3-potreiro-4": 486,
            "f3-potreiro-5": 202,
            __unallocated__: 121
          }
        },
        {
          id: "vacas-entouradas",
          name: "Vacas entouradas",
          quantity: 1700,
          allocation: {
            "f3-potreiro-1": 405,
            "f3-potreiro-2": 334,
            "f3-potreiro-3": 152,
            "f3-potreiro-4": 486,
            "f3-potreiro-5": 202,
            __unallocated__: 121
          }
        }
      ],
      movements: [
        {
          id: "seed-mov-f3-01",
          code: "F300001",
          type: "consumo",
          date: "2026-01-20",
          categoryId: "bois-abate",
          categoryName: "Bois de abate",
          quantity: 9,
          delta: -9,
          value: 0,
          saleDetails: null,
          notes: "Abate para consumo interno da equipe",
          potreiro: "f3-potreiro-2",
          sourceId: "",
          photos: []
        },
        {
          id: "seed-mov-f3-02",
          code: "F300002",
          type: "morte",
          date: "2026-04-05",
          categoryId: "vacas-cria",
          categoryName: "Vacas de cria",
          quantity: 2,
          delta: -2,
          value: 0,
          saleDetails: null,
          notes: "Animal encontrado após forte tempestade com queda de granizo",
          potreiro: "f3-potreiro-5",
          sourceId: "",
          cause: "clima",
          customCause: "",
          photos: []
        },
        {
          id: "seed-mov-f3-03",
          code: "F300003",
          type: "consumo",
          date: "2026-05-15",
          categoryId: "touros",
          categoryName: "Touros",
          quantity: 4,
          delta: -4,
          value: 0,
          saleDetails: null,
          notes: "Consumo em evento institucional",
          potreiro: "f3-potreiro-4",
          sourceId: "",
          photos: []
        }
      ],
      sanitaryRecords: [],
      monthlyRecords: [],
      reproductionRecords: [],
      reproductionCodeSequence: 0,
      ovinos: [
        {
          id: "ovino-0062",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 100
        },
        {
          id: "ovino-0063",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Ideal",
          breedOther: "",
          quantity: 90
        },
        {
          id: "ovino-0064",
          categoryId: "ovelha",
          categoryName: "Ovelha",
          breedType: "Merino",
          breedOther: "",
          quantity: 60
        },
        {
          id: "ovino-0065",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 70
        },
        {
          id: "ovino-0066",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Ideal",
          breedOther: "",
          quantity: 60
        },
        {
          id: "ovino-0067",
          categoryId: "cordeiro",
          categoryName: "Cordeiro",
          breedType: "Outra",
          breedOther: "Romney Marsh",
          quantity: 70
        },
        {
          id: "ovino-0068",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 70
        },
        {
          id: "ovino-0069",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Ideal",
          breedOther: "",
          quantity: 50
        },
        {
          id: "ovino-0070",
          categoryId: "borrego",
          categoryName: "Borrego",
          breedType: "Outra",
          breedOther: "Suffolk",
          quantity: 80
        },
        {
          id: "ovino-0071",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Corriedale",
          breedOther: "",
          quantity: 30
        },
        {
          id: "ovino-0072",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Ideal",
          breedOther: "",
          quantity: 30
        },
        {
          id: "ovino-0073",
          categoryId: "carneiro",
          categoryName: "Carneiro",
          breedType: "Outra",
          breedOther: "Dorper",
          quantity: 40
        }
      ],
      pastureAreas: [
        {
          id: "pasture-0074",
          name: "Potreiro 1",
          potreiroId: "f3-potreiro-1",
          sizeHa: 40,
          culture: "braquiaria",
          customCulture: "",
          season: "2025/2026",
          startDate: "2026-03-20",
          status: "manejo",
          procedures: [
            {
              id: "proc-0075",
              date: "2026-03-20",
              type: "preparo-solo",
              customType: "",
              description: "Preparo de solo para braquiária",
              responsible: "Equipe própria",
              areaHa: 40,
              quantity: 40,
              unit: "hectare",
              unitValue: 260,
              totalValue: 10400,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0076",
              date: "2026-03-28",
              type: "semeadura",
              customType: "",
              description: "Semeadura de braquiária",
              responsible: "Carlos Silva",
              areaHa: 40,
              quantity: 40,
              unit: "hectare",
              unitValue: 190,
              totalValue: 7600,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0077",
              date: "2026-04-15",
              type: "aplicacao-adubo-calcario",
              customType: "",
              description: "Calagem e adubação",
              responsible: "Equipe própria",
              areaHa: 40,
              quantity: 10,
              unit: "saco",
              unitValue: 410,
              totalValue: 4100,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0078",
              date: "2026-04-18",
              type: "combustivel",
              customType: "",
              description: "Combustível para tratores",
              responsible: "Equipe própria",
              areaHa: 40,
              quantity: 200,
              unit: "litro",
              unitValue: 6.1,
              totalValue: 1220,
              notes: "",
              attachment: null
            }
          ]
        },
        {
          id: "pasture-0079",
          name: "Potreiro 4",
          potreiroId: "f3-potreiro-4",
          sizeHa: 48,
          culture: "campo-nativo-melhorado",
          customCulture: "",
          season: "2024/2025",
          startDate: "2026-01-08",
          status: "finalizada",
          procedures: [
            {
              id: "proc-0080",
              date: "2026-01-08",
              type: "nivelamento",
              customType: "",
              description: "Nivelamento de área degradada",
              responsible: "Terraplanagem Bravo",
              areaHa: 48,
              quantity: 48,
              unit: "hectare",
              unitValue: 165,
              totalValue: 7920,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0081",
              date: "2026-01-20",
              type: "mao-obra",
              customType: "",
              description: "Mão de obra para limpeza e manejo",
              responsible: "Equipe própria",
              areaHa: 48,
              quantity: 12,
              unit: "diaria",
              unitValue: 170,
              totalValue: 2040,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0082",
              date: "2026-02-02",
              type: "outros",
              customType: "",
              description: "Custos operacionais diversos",
              responsible: "Equipe própria",
              areaHa: 48,
              quantity: 1,
              unit: "unidade",
              unitValue: 1500,
              totalValue: 1500,
              notes: "",
              attachment: null
            }
          ]
        },
        {
          id: "pasture-0083",
          name: "Potreiro 2",
          potreiroId: "f3-potreiro-2",
          sizeHa: 33,
          culture: "milho",
          customCulture: "",
          season: "2025/2026",
          startDate: "2026-05-05",
          status: "implantacao",
          procedures: [
            {
              id: "proc-0084",
              date: "2026-05-05",
              type: "preparo-solo",
              customType: "",
              description: "Preparo de solo para milho",
              responsible: "Equipe própria",
              areaHa: 33,
              quantity: 33,
              unit: "hectare",
              unitValue: 290,
              totalValue: 9570,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0085",
              date: "2026-05-12",
              type: "plantio-aviao",
              customType: "",
              description: "Plantio aéreo de milho",
              responsible: "Aviação Sul",
              areaHa: 33,
              quantity: 33,
              unit: "hectare",
              unitValue: 240,
              totalValue: 7920,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0086",
              date: "2026-05-25",
              type: "pulverizacao",
              customType: "",
              description: "Pulverização de herbicida",
              responsible: "AgroDrone",
              areaHa: 33,
              quantity: 33,
              unit: "hectare",
              unitValue: 95,
              totalValue: 3135,
              notes: "",
              attachment: null
            },
            {
              id: "proc-0087",
              date: "2026-06-05",
              type: "aplicacao-ureia",
              customType: "",
              description: "Adubação nitrogenada",
              responsible: "Equipe própria",
              areaHa: 33,
              quantity: 7,
              unit: "saco",
              unitValue: 390,
              totalValue: 2730,
              notes: "",
              attachment: null
            }
          ]
        },
        {
          id: "pasture-0088",
          name: "Potreiro 5",
          potreiroId: "f3-potreiro-5",
          sizeHa: 20,
          culture: "tifton",
          customCulture: "",
          season: "2025/2026",
          startDate: "2026-08-01",
          status: "planejada",
          procedures: []
        }
      ]
    }
  }
};

const runtime = {
  storageEnabled: true,
  appInitialized: false,
  splashDismissed: false,
  authLoginMode: "usuario",
  pendingMovementDialogType: "",
  returnToMovTypeRecords: null,
  movementPhotoDrafts: [],
  editStockContextFarmId: TOTAL_FARM_ID,
  pdfContextFarmId: TOTAL_FARM_ID,
  arapeyKmlData: null,
  arapeyKmlPromise: null,
  georefDraft: null,
  cloudToken: null,
  cloudSyncing: false,
  cloudEnabled: true,
  cloudRevision: 0,
  cloudConflict: false,
  cloudPushTimer: null,
  apiNoticeMessage: "",
  apiNoticeLevel: "info",
  editingMovement: null,  // { farmId, movementId } when editing an existing movement
  potrManej: { farmId: null, potreirosId: null, type: "transferencia", photoDrafts: [] },
  movementsSearch: "",
  movementsPage: 0,
  movementsFarmFilter: "all",
  movementsCategoryFilter: "all",
  movementsOperationFilter: "all",
  movementsYearFilter: "all",
  sanitarySearch: "",
  sanitaryPage: 0,
  sanitaryFarmFilter: "all",
  sanitaryDateFilter: "",
  sanitaryPotreroFilter: "all",
  sanitaryCategoryFilter: "all",
  sanitaryProductFilter: "all",
  repPage: 0,
  repSearch: "",
  comprasPage: 0,
  vendasPage: 0,
  auditSearch: "",
  auditPage: 0,
  auditSessionId: "",
  auditSessionIp: "",
  auditSessionIpReady: false
};

const today = new Date();
const state = {
  data: loadData(),
  filters: {
    year: String(today.getFullYear()),
    month: "all",
    especie: "todas"
  },
  activeView: "home",
  charts: {
    inventory: null,
    movement: null,
    ranking: null,
    monthlyEvolution: null,
    monthlyCategory: null,
    repBar: null,
    repDonut: null,
    repHistory: null,
    comprasBar: null,
    comprasEvolution: null,
    vendasBar: null,
    vendasEvolution: null
  },
  userEditingId: null,
  userEditingMode: null,
  monthlyEditingId: null
};

const elements = {
  splashShell: document.getElementById("splashShell"),
  authShell: document.getElementById("authShell"),
  pageShell: document.getElementById("pageShell"),
  loginForm: document.getElementById("loginForm"),
  loginRoleTabs: Array.from(document.querySelectorAll("[data-auth-role]")),
  loginRoleHint: document.getElementById("loginRoleHint"),
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  loginFeedback: document.getElementById("loginFeedback"),
  emergencyRestoreBtn: document.getElementById("emergencyRestoreBtn"),
  emergencyRestoreInput: document.getElementById("emergencyRestoreInput"),
  farmSwitch: document.getElementById("farmSwitch"),
  mobileAppButton: document.getElementById("mobileAppButton"),
  mobileAppQuickButton: document.getElementById("mobileAppQuickButton"),
  mobileFarmQuickButton: document.getElementById("mobileFarmQuickButton"),
  sanitaryShortcut: document.getElementById("sanitaryShortcut"),
  reproducaoShortcut: document.getElementById("reproducaoShortcut"),
  quickVendasBtn: document.getElementById("quickVendasBtn"),
  auditTrailButton: document.getElementById("auditTrailButton"),
  dashboardFarmLabel: document.getElementById("dashboardFarmLabel"),
  homeView: document.getElementById("homeView"),
  dashboardView: document.getElementById("dashboardView"),
  sanitaryView: document.getElementById("sanitaryView"),
  heroMetrics: document.getElementById("heroMetrics"),
  visualHerdGrid: document.getElementById("visualHerdGrid"),
  globalSummaryGrid: document.getElementById("globalSummaryGrid"),
  globalFarmBreakdown: document.getElementById("globalFarmBreakdown"),
  globalCategoryBreakdown: document.getElementById("globalCategoryBreakdown"),
  globalPanelKicker: document.getElementById("globalPanelKicker"),
  globalPanelTitle: document.getElementById("globalPanelTitle"),
  globalPanelChip: document.getElementById("globalPanelChip"),
  monthlySummaryGrid: document.getElementById("monthlySummaryGrid"),
  monthlyProtocolList: document.getElementById("monthlyProtocolList"),
  monthlyProtocolCount: document.getElementById("monthlyProtocolCount"),
  monthlyProtocolSection: document.getElementById("monthlyProtocolSection"),
  monthlySummarySection: document.getElementById("monthlySummarySection"),
  summaryGrid: document.getElementById("summaryGrid"),
  periodSummary: document.getElementById("periodSummary"),
  salesSummarySection: document.getElementById("salesSummary")?.closest("section") || null,
  salesSummary: document.getElementById("salesSummary"),
  salesTimelinePanel: document.getElementById("salesTableBody")?.closest("article") || null,
  salesTableBody: document.getElementById("salesTableBody"),
  monthlyCategoryPanel: document.getElementById("monthlyCategoryChart")?.closest("article") || null,
  movementsTableBody: document.getElementById("movementsTableBody"),
  movementsTableHead: document.getElementById("movementsTableHead"),
  discrepancyNote: document.getElementById("discrepancyNote"),
  insightList: document.getElementById("insightList"),
  heroFarmName: document.getElementById("heroFarmName"),
  heroFarmNote: document.getElementById("heroFarmNote"),
  yearFilter: document.getElementById("yearFilter"),
  monthFilter: document.getElementById("monthFilter"),
  especieFilter: document.getElementById("especieFilter"),
  movementDialog: document.getElementById("movementDialog"),
  movementDialogTitle: document.getElementById("movementDialogTitle"),
  movementForm: document.getElementById("movementForm"),
  movementFarm: document.getElementById("movementFarm"),
  movementFarmWrap: document.getElementById("movementFarmWrap"),
  movementType: document.getElementById("movementType"),
  movementDate: document.getElementById("movementDate"),
  movementSpecies: document.getElementById("movementSpecies"),
  movementCategory: document.getElementById("movementCategory"),
  movementQuantity: document.getElementById("movementQuantity"),
  movementPotreiroWrap: document.getElementById("movementPotreiroWrap"),
  movementPotreiroLabel: document.getElementById("movementPotreiroLabel"),
  movementPotreiro: document.getElementById("movementPotreiro"),
  movementPotreirowDestWrap: document.getElementById("movementPotreirowDestWrap"),
  movementPotreiroDest: document.getElementById("movementPotreiroDest"),
  movementOvinoDestFarmWrap: document.getElementById("movementOvinoDestFarmWrap"),
  movementOvinoDestFarm: document.getElementById("movementOvinoDestFarm"),
  adjustDirectionWrap: document.getElementById("adjustDirectionWrap"),
  adjustDirection: document.getElementById("adjustDirection"),
  movementSaleModeWrap: document.getElementById("movementSaleModeWrap"),
  movementSaleMode: document.getElementById("movementSaleMode"),
  movementLiveFields: document.getElementById("movementLiveFields"),
  movementLivePrice: document.getElementById("movementLivePrice"),
  movementLiveKg: document.getElementById("movementLiveKg"),
  movementCarcassFields: document.getElementById("movementCarcassFields"),
  movementCarcassPrice: document.getElementById("movementCarcassPrice"),
  movementCarcassKg: document.getElementById("movementCarcassKg"),
  movementSaleHint: document.getElementById("movementSaleHint"),
  movSaleExtraWrap: document.getElementById("movSaleExtraWrap"),
  movSaleBuyer: document.getElementById("movSaleBuyer"),
  movSaleYieldPct: document.getElementById("movSaleYieldPct"),
  movPurchaseSection: document.getElementById("movPurchaseSection"),
  movPurchaseSource: document.getElementById("movPurchaseSource"),
  movPurchaseAvgWeight: document.getElementById("movPurchaseAvgWeight"),
  movPurchaseTotalWeight: document.getElementById("movPurchaseTotalWeight"),
  movPurchasePricePerKg: document.getElementById("movPurchasePricePerKg"),
  movPurchaseValuePerHead: document.getElementById("movPurchaseValuePerHead"),
  movUsdRateWrap: document.getElementById("movUsdRateWrap"),
  movUsdRate: document.getElementById("movUsdRate"),
  movUsdBrlEquiv: document.getElementById("movUsdBrlEquiv"),
  movCommercialDashboard: document.getElementById("movCommercialDashboard"),
  movementValueWrap: document.getElementById("movementValueWrap"),
  movementValueLabel: document.getElementById("movementValueLabel"),
  movementValue: document.getElementById("movementValue"),
  movementNotes: document.getElementById("movementNotes"),
  movementPhotoWrap: document.getElementById("movementPhotoWrap"),
  movementPhotos: document.getElementById("movementPhotos"),
  movementPhotoPanel: document.getElementById("movementPhotoPanel"),
  movementPhotoCounter: document.getElementById("movementPhotoCounter"),
  movementPhotoPreview: document.getElementById("movementPhotoPreview"),
  categoryDialog: document.getElementById("categoryDialog"),
  categoryForm: document.getElementById("categoryForm"),
  categoryFarm: document.getElementById("categoryFarm"),
  categorySpecies: document.getElementById("categorySpecies"),
  categoryName: document.getElementById("categoryName"),
  categoryInitialQuantity: document.getElementById("categoryInitialQuantity"),
  categoryPotreiro: document.getElementById("categoryPotreiro"),
  categoryPotreiroWrap: document.getElementById("categoryPotreiroWrap"),
  sanitaryForm: document.getElementById("sanitaryForm"),
  sanitaryDialog: document.getElementById("sanitaryDialog"),
  sanitaryDialogTitle: document.getElementById("sanitaryDialogTitle"),
  openSanitaryDialogButton: document.getElementById("openSanitaryDialogButton"),
  closeSanitaryDialog: document.getElementById("closeSanitaryDialog"),
  sanitaryEditingId: document.getElementById("sanitaryEditingId"),
  sanitaryFarm: document.getElementById("sanitaryFarm"),
  sanitaryDate: document.getElementById("sanitaryDate"),
  sanitarySpecies: document.getElementById("sanitarySpecies"),
  sanitaryQuantity: document.getElementById("sanitaryQuantity"),
  sanitaryCategory: document.getElementById("sanitaryCategory"),
  sanitaryProduct: document.getElementById("sanitaryProduct"),
  newProductWrap: document.getElementById("newProductWrap"),
  newProductName: document.getElementById("newProductName"),
  sanitaryNotes: document.getElementById("sanitaryNotes"),
  sanitaryPotrero: document.getElementById("sanitaryPotrero"),
  newPotreroWrap: document.getElementById("newPotreroWrap"),
  newPotreroName: document.getElementById("newPotreroName"),
  sanitarySubmitButton: document.getElementById("sanitarySubmitButton"),
  sanitarySummary: document.getElementById("sanitarySummary"),
  sanitaryTableBody: document.getElementById("sanitaryTableBody"),
  sanitaryFarmSwitch: document.getElementById("sanitaryFarmSwitch"),
  sanitaryViewNote: document.getElementById("sanitaryViewNote"),
  sanitaryFilterFarm: document.getElementById("sanitaryFilterFarm"),
  sanitaryFilterDate: document.getElementById("sanitaryFilterDate"),
  sanitaryFilterPotrero: document.getElementById("sanitaryFilterPotrero"),
  sanitaryFilterCategory: document.getElementById("sanitaryFilterCategory"),
  sanitaryFilterProduct: document.getElementById("sanitaryFilterProduct"),
  clearSanitaryFiltersButton: document.getElementById("clearSanitaryFiltersButton"),
  potreirosShortcut: document.getElementById("potreirosShortcut"),
  potreirosView: document.getElementById("potreirosView"),
  potreirosAccordion: document.getElementById("potreirosAccordion"),
  reproducaoView: document.getElementById("reproducaoView"),
  repFarmSwitch: document.getElementById("repFarmSwitch"),
  repSummarySection: document.getElementById("repSummarySection"),
  repTableBody: document.getElementById("repTableBody"),
  repHistoryPagination: document.getElementById("repHistoryPagination"),
  repHistorySearch: document.getElementById("repHistorySearch"),
  reproducaoDlg: document.getElementById("reproducaoDlg"),
  repVerifDlg: document.getElementById("repVerifDlg"),
  mobileNavReproducao: document.getElementById("mobileNavReproducao"),
  comprasView: document.getElementById("comprasView"),
  comprasShortcut: document.getElementById("comprasShortcut"),
  comprasFarmSwitch: document.getElementById("comprasFarmSwitch"),
  comprasKpiSection: document.getElementById("comprasKpiSection"),
  comprasNovaBtn: document.getElementById("comprasNovaBtn"),
  exportComprasPdfBtn: document.getElementById("exportComprasPdfBtn"),
  comprasHistorySearch: document.getElementById("comprasHistorySearch"),
  comprasTableHead: document.getElementById("comprasTableHead"),
  comprasTableBody: document.getElementById("comprasTableBody"),
  comprasHistoryPagination: document.getElementById("comprasHistoryPagination"),
  comprasFilterFarm: document.getElementById("comprasFilterFarm"),
  comprasFilterDateFrom: document.getElementById("comprasFilterDateFrom"),
  comprasFilterDateTo: document.getElementById("comprasFilterDateTo"),
  comprasFilterCategory: document.getElementById("comprasFilterCategory"),
  clearComprasFiltersBtn: document.getElementById("clearComprasFiltersBtn"),
  vendasView: document.getElementById("vendasView"),
  vendasShortcut: document.getElementById("vendasShortcut"),
  vendasFarmSwitch: document.getElementById("vendasFarmSwitch"),
  vendasKpiSection: document.getElementById("vendasKpiSection"),
  vendasNovaBtn: document.getElementById("vendasNovaBtn"),
  exportVendasPdfBtn: document.getElementById("exportVendasPdfBtn"),
  vendasHistorySearch: document.getElementById("vendasHistorySearch"),
  vendasTableBody: document.getElementById("vendasTableBody"),
  vendasHistoryPagination: document.getElementById("vendasHistoryPagination"),
  vendasFilterFarm: document.getElementById("vendasFilterFarm"),
  vendasFilterDateFrom: document.getElementById("vendasFilterDateFrom"),
  vendasFilterDateTo: document.getElementById("vendasFilterDateTo"),
  vendasFilterCategory: document.getElementById("vendasFilterCategory"),
  clearVendasFiltersBtn: document.getElementById("clearVendasFiltersBtn"),
  movTypeRecordsDlg: document.getElementById("movTypeRecordsDlg"),
  maximizeMovTypeRecordsDlg: document.getElementById("maximizeMovTypeRecordsDlg"),
  closeMovTypeRecordsDlg: document.getElementById("closeMovTypeRecordsDlg"),
  movTypeRecordsKicker: document.getElementById("movTypeRecordsKicker"),
  movTypeRecordsTitle: document.getElementById("movTypeRecordsTitle"),
  movTypeRecordsSearch: document.getElementById("movTypeRecordsSearch"),
  movTypeRecordsNewBtn: document.getElementById("movTypeRecordsNewBtn"),
  movTypeRecordsHead: document.getElementById("movTypeRecordsHead"),
  movTypeRecordsBody: document.getElementById("movTypeRecordsBody"),
  movTypeRecordsFooter: document.getElementById("movTypeRecordsFooter"),
  potrManejoDlg: document.getElementById("potrManejoDlg"),
  closePotrManejDlg: document.getElementById("closePotrManejDlg"),
  potrManejFarmKicker: document.getElementById("potrManejFarmKicker"),
  potrManejDlgTitle: document.getElementById("potrManejDlgTitle"),
  potrManejFarmTotal: document.getElementById("potrManejFarmTotal"),
  potrManejPotrTotal: document.getElementById("potrManejPotrTotal"),
  potrManejUnallocated: document.getElementById("potrManejUnallocated"),
  potrActionTabs: document.getElementById("potrActionTabs"),
  potrManejForm: document.getElementById("potrManejForm"),
  potrManejDate: document.getElementById("potrManejDate"),
  potrManejCategory: document.getElementById("potrManejCategory"),
  potrManejQty: document.getElementById("potrManejQty"),
  potrManejDestPotrWrap: document.getElementById("potrManejDestPotrWrap"),
  potrManejDestPotrLabel: document.getElementById("potrManejDestPotrLabel"),
  potrManejDestPotr: document.getElementById("potrManejDestPotr"),
  potrManejDestFarmWrap: document.getElementById("potrManejDestFarmWrap"),
  potrManejDestFarm: document.getElementById("potrManejDestFarm"),
  potrManejDestFarmPotrWrap: document.getElementById("potrManejDestFarmPotrWrap"),
  potrManejDestFarmPotr: document.getElementById("potrManejDestFarmPotr"),
  potrManejValueWrap: document.getElementById("potrManejValueWrap"),
  potrManejValue: document.getElementById("potrManejValue"),
  potrManejNotes: document.getElementById("potrManejNotes"),
  potrManejPhotoWrap: document.getElementById("potrManejPhotoWrap"),
  potrManejPhotos: document.getElementById("potrManejPhotos"),
  potrManejPhotoPanel: document.getElementById("potrManejPhotoPanel"),
  potrManejPhotoCounter: document.getElementById("potrManejPhotoCounter"),
  potrManejPhotoPreview: document.getElementById("potrManejPhotoPreview"),
  potrManejSubmit: document.getElementById("potrManejSubmit"),
  editStockDialog: document.getElementById("editStockDialog"),
  editStockButton: document.getElementById("editStockButton"),
  closeEditStockDialog: document.getElementById("closeEditStockDialog"),
  georefButton: document.getElementById("georefButton"),
  georefDialog: document.getElementById("georefDialog"),
  georefSaveButton: document.getElementById("georefSaveButton"),
  closeGeorefDialog: document.getElementById("closeGeorefDialog"),
  georefStatus: document.getElementById("georefStatus"),
  georefMap: document.getElementById("georefMap"),
  georefLegend: document.getElementById("georefLegend"),
  exportPdfButton: document.getElementById("exportPdfButton"),
  registerGoldBtn: document.getElementById("registerGoldBtn"),
  registerMenu: document.getElementById("registerMenu"),
  currentUserLabel: document.getElementById("currentUserLabel"),
  manageUsersButton: document.getElementById("manageUsersButton"),
  backupButton: document.getElementById("backupButton"),
  restoreButton: document.getElementById("restoreButton"),
  restoreFileInput: document.getElementById("restoreFileInput"),
  backupWarningDialog: document.getElementById("backupWarningDialog"),
  backupWarningTitle: document.getElementById("backupWarningTitle"),
  backupWarningMessage: document.getElementById("backupWarningMessage"),
  backupWarningDoNow: document.getElementById("backupWarningDoNow"),
  backupWarningDismiss: document.getElementById("backupWarningDismiss"),
  logoutButton: document.getElementById("logoutButton"),
  syncStatusWrap: document.getElementById("syncStatusWrap"),
  syncStatusChip: document.getElementById("syncStatusChip"),
  syncRetryButton: document.getElementById("syncRetryButton"),
  apiNotice: document.getElementById("apiNotice"),
  closeMovementDialog: document.getElementById("closeMovementDialog"),
  closeCategoryDialog: document.getElementById("closeCategoryDialog"),
  manageUsersDialog: document.getElementById("manageUsersDialog"),
  userEditorPanel: document.getElementById("userEditorPanel"),
  userEditorTitle: document.getElementById("userEditorTitle"),
  userEditorKicker: document.getElementById("userEditorKicker"),
  editUserPasswordLabel: document.getElementById("editUserPasswordLabel"),
  editUserRoleWrap: document.getElementById("editUserRoleWrap"),
  editUserLogin: document.getElementById("editUserLogin"),
  editUserPassword: document.getElementById("editUserPassword"),
  editUserRole: document.getElementById("editUserRole"),
  saveUserEditsButton: document.getElementById("saveUserEditsButton"),
  cancelUserEditButton: document.getElementById("cancelUserEditButton"),
  manageUsersForm: document.getElementById("manageUsersForm"),
  closeManageUsersDialog: document.getElementById("closeManageUsersDialog"),
  mobileAppDialog: document.getElementById("mobileAppDialog"),
  closeMobileAppDialog: document.getElementById("closeMobileAppDialog"),
  mobileAppStatusChip: document.getElementById("mobileAppStatusChip"),
  mobileAppIntro: document.getElementById("mobileAppIntro"),
  mobileAppHint: document.getElementById("mobileAppHint"),
  mobileAndroidLink: document.getElementById("mobileAndroidLink"),
  mobileIosLink: document.getElementById("mobileIosLink"),
  mobileSystemLink: document.getElementById("mobileSystemLink"),
  auditTrailDialog: document.getElementById("auditTrailDialog"),
  closeAuditTrailDialog: document.getElementById("closeAuditTrailDialog"),
  auditTrailSearch: document.getElementById("auditTrailSearch"),
  auditTrailBody: document.getElementById("auditTrailBody"),
  auditTrailFooter: document.getElementById("auditTrailFooter"),
  newUserLogin: document.getElementById("newUserLogin"),
  newUserPassword: document.getElementById("newUserPassword"),
  newUserRole: document.getElementById("newUserRole"),
  userList: document.getElementById("userList"),
  pdfOptionsDialog: document.getElementById("pdfOptionsDialog"),
  pdfOptionsForm: document.getElementById("pdfOptionsForm"),
  closePdfOptionsDialog: document.getElementById("closePdfOptionsDialog"),
  pdfFarmList: document.getElementById("pdfFarmList"),
  pdfYearFilter: document.getElementById("pdfYearFilter"),
  pdfMonthFilter: document.getElementById("pdfMonthFilter"),
  monthlyDataDialog: document.getElementById("monthlyDataDialog"),
  monthlyDataForm: document.getElementById("monthlyDataForm"),
  closeMonthlyDataDialog: document.getElementById("closeMonthlyDataDialog"),
  monthlyDataDialogTitle: document.getElementById("monthlyDataDialogTitle"),
  monthlyDataEditingId: document.getElementById("monthlyDataEditingId"),
  monthlyDataFarm: document.getElementById("monthlyDataFarm"),
  monthlyDataPeriod: document.getElementById("monthlyDataPeriod"),
  monthlyDataCategory: document.getElementById("monthlyDataCategory"),
  monthlyDataTitle: document.getElementById("monthlyDataTitle"),
  monthlyDataQuantity: document.getElementById("monthlyDataQuantity"),
  monthlyDataValue: document.getElementById("monthlyDataValue"),
  monthlyDataNotes: document.getElementById("monthlyDataNotes"),
  monthlyDataSubmitButton: document.getElementById("monthlyDataSubmitButton"),
  mobileBottomNav: document.getElementById("mobileBottomNav"),
  mobileUtilityBar: document.getElementById("mobileUtilityBar"),
  mobileNavDashboard: document.getElementById("mobileNavDashboard"),
  mobileNavSanitary: document.getElementById("mobileNavSanitary"),
  mobileNavPotreiros: document.getElementById("mobileNavPotreiros"),
  mobileNavFarms: document.getElementById("mobileNavFarms"),
  mobileFarmDrawer: document.getElementById("mobileFarmDrawer"),
  mobileFarmSwitchList: document.getElementById("mobileFarmSwitchList"),
  closeMobileFarmDrawer: document.getElementById("closeMobileFarmDrawer"),
  mobileDrawerAppButton: document.getElementById("mobileDrawerAppButton")
};

function hasDirectMobileDownload() {
  return Boolean(String(MOBILE_APP_CONFIG.androidDownloadUrl || "").trim() || String(MOBILE_APP_CONFIG.iosDownloadUrl || "").trim());
}

function configureMobileAppLinks() {
  const androidDirectUrl = String(MOBILE_APP_CONFIG.androidDownloadUrl || "").trim();
  const iosDirectUrl = String(MOBILE_APP_CONFIG.iosDownloadUrl || "").trim();
  const androidUrl = androidDirectUrl || MOBILE_APP_CONFIG.androidFallbackUrl || MOBILE_APP_CONFIG.webUrl;
  const iosUrl = iosDirectUrl || MOBILE_APP_CONFIG.iosFallbackUrl || MOBILE_APP_CONFIG.webUrl;
  const usingDirectDownload = Boolean(androidDirectUrl || iosDirectUrl);

  if (elements.mobileAndroidLink) {
    elements.mobileAndroidLink.href = androidUrl;
    elements.mobileAndroidLink.textContent = androidDirectUrl
      ?"Baixar APK Android"
      : "APK Android em breve";
  }

  if (elements.mobileIosLink) {
    elements.mobileIosLink.href = iosUrl;
    elements.mobileIosLink.textContent = iosDirectUrl
      ?"Baixar app no iPhone"
      : "iPhone em breve";
  }

  if (elements.mobileSystemLink) {
    elements.mobileSystemLink.href = MOBILE_APP_CONFIG.webUrl;
  }

  if (elements.mobileAppStatusChip) {
    elements.mobileAppStatusChip.textContent = usingDirectDownload ?"Download disponível" : "APK em preparação";
  }

  if (elements.mobileAppIntro) {
    elements.mobileAppIntro.textContent = usingDirectDownload
      ?"Baixe o app no celular e entre com o mesmo usuário do sistema web. Os dados continuam sincronizados entre app e site."
      : "O app usará o mesmo banco do sistema web. Assim que o APK Android estiver publicado, o download será direto pelo sistema.";
  }

  if (elements.mobileAppHint) {
    elements.mobileAppHint.innerHTML = usingDirectDownload
      ?"<strong>Dica:</strong> depois de publicar um novo APK, basta trocar a URL em <code>MOBILE_APP_CONFIG.androidDownloadUrl</code>."
      : "<strong>Dica:</strong> quando o APK Android estiver pronto, basta preencher <code>MOBILE_APP_CONFIG.androidDownloadUrl</code> no <code>app.js</code> para o botão baixar direto.";
  }
}

function openMobileAppDialog() {
  configureMobileAppLinks();
  elements.mobileAppDialog?.showModal();
}

function openMobileFarmDrawer() {
  renderMobileFarmDrawer();
  if (elements.mobileFarmDrawer) {
    elements.mobileFarmDrawer.hidden = false;
  }
}

function collapseDashboardSection(section) {
  if (!section) {
  }

  const remainingPanels = [...section.children].filter((child) => child.matches("article"));
  if (!remainingPanels.length) {
    section.remove();
    return;
  }

  if (remainingPanels.length === 1) {
    section.classList.add("single-panel-grid");
  }
}

function removeDashboardPanel(panel, options = {}) {
  if (!panel) {
    return;
  }

  const section = panel.closest("section");
  panel.remove();

  if (options.removeSection) {
    section?.remove();
    return;
  }

  collapseDashboardSection(section);
}

removeDashboardPanel(elements.salesSummarySection, { removeSection: true });
removeDashboardPanel(elements.salesTimelinePanel);
removeDashboardPanel(elements.monthlyCategoryPanel);

if (elements.salesSummary) {
  elements.salesSummary.innerHTML = "";
}

boot();

function fixSanitaryDates2026Dec() {
  let changed = 0;
  Object.values(state.data.farms || {}).forEach((farm) => {
    (farm.sanitaryRecords || []).forEach((record) => {
      if (typeof record.date === "string" && record.date.startsWith("2026-12")) {
        record.date = record.date.replace("2026-12", "2025-12");
        changed++;
      }
    });
  });
  if (changed > 0) {
    console.log(`[migração] ${changed} registro(s) sanitário(s) corrigido(s): dez/2026 → dez/2025`);
  }
  return changed;
}

function boot() {
  try {
    if (fixSanitaryDates2026Dec() > 0) saveData({ skipCloud: false });
    bindEvents();
    setAuthLoginMode(runtime.authLoginMode);
    renderAuthState();
    startSplashExperience();
    if (isAuthenticated()) {
      initializeAppShell();
      render();
      cloudPull();
    }
  } catch (error) {
    console.error("Falha na inicialização do painel:", error);
    showStartupError(error);
  }
  startAutoSync();
}

function startAutoSync() {
  // Render está sempre ativo (plano pago) — 60s é suficiente para detectar mudanças de outras sessões
  setInterval(async () => {
    if (!isAuthenticated() || !runtime.cloudToken || runtime.cloudSyncing) return;
    try {
      const res = await apiRequest("/api/data/revision", {}, 8000);
      const serverRevision = Number(res?.revision || 0);
      if (serverRevision > runtime.cloudRevision) {
        cloudPull();
      }
    } catch {
      // silent — next tick will retry
    }
  }, 60000);
}

function initializeAppShell() {
  if (!runtime.appInitialized) {
    populateMonthFilter();
    runtime.appInitialized = true;
  }

  syncFilterYearForFarm(getFarm(), true);
  populateYearFilter();
  populatePdfPeriodFilters();
}

function loadData() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const freshData = ensureDataShape(cloneSeedData());
      freshData.selectedFarmId = TOTAL_FARM_ID;
      freshData.auth.sessionUserId = "";
      return freshData;
    }

    const rawData = JSON.parse(stored);
    const parsedData = ensureDataShape(rawData);
    parsedData.selectedFarmId = TOTAL_FARM_ID;
    parsedData.auth.sessionUserId = "";
    const normalizedSnapshot = JSON.stringify(parsedData);
    if (normalizedSnapshot !== stored) {
      window.localStorage.setItem(STORAGE_KEY, normalizedSnapshot);
    }
    return parsedData;
  } catch (error) {
    runtime.storageEnabled = false;
    console.warn("Armazenamento local indisponível. O painel vai funcionar sem persistência.", error);
    const fallbackData = ensureDataShape(cloneSeedData());
    fallbackData.selectedFarmId = TOTAL_FARM_ID;
    fallbackData.auth.sessionUserId = "";
    return fallbackData;
  }
}

function saveData(options = {}) {
  if (runtime.storageEnabled) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    } catch (error) {
      runtime.storageEnabled = false;
      console.warn("Não foi possível salvar localmente. A sessão segue sem persistência.", error);
    }
  }
  if (!options.skipCloud) {
    scheduleCloudPush();
  }
}

function setApiNotice(message = "", level = "info", action = null) {
  runtime.apiNoticeMessage = message || "";
  runtime.apiNoticeLevel = level;
  if (!elements.apiNotice) return;
  if (!runtime.apiNoticeMessage) {
    elements.apiNotice.hidden = true;
    elements.apiNotice.textContent = "";
    elements.apiNotice.className = "api-notice";
    return;
  }
  elements.apiNotice.hidden = false;
  elements.apiNotice.className = `api-notice notice-${level}`;
  if (action) {
    elements.apiNotice.textContent = "";
    const span = document.createElement("span");
    span.textContent = runtime.apiNoticeMessage + " ";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "notice-action-btn";
    btn.textContent = action.label;
    btn.addEventListener("click", action.fn);
    elements.apiNotice.appendChild(span);
    elements.apiNotice.appendChild(btn);
  } else {
    elements.apiNotice.textContent = runtime.apiNoticeMessage;
  }
}

function scheduleCloudPush() {
  if (!runtime.cloudEnabled || !runtime.cloudToken) return;
  if (runtime.cloudPushTimer) {
    window.clearTimeout(runtime.cloudPushTimer);
  }
  runtime.cloudPushTimer = window.setTimeout(() => {
    runtime.cloudPushTimer = null;
    void cloudPush();
  }, 900);
}

function createAuditSessionId() {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAuditEntries() {
  return Array.isArray(state.data.auth.auditLog) ?state.data.auth.auditLog : [];
}

async function ensureAuditSessionIp() {
  if (runtime.auditSessionIpReady) {
    return runtime.auditSessionIp || "IP indisponível";
  }

  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) throw new Error("ip unavailable");
    const payload = await response.json();
    runtime.auditSessionIp = payload.ip || "IP indisponível";
  } catch {
    runtime.auditSessionIp = "IP indisponível";
  }

  runtime.auditSessionIpReady = true;
  const sessionId = runtime.auditSessionId;
  if (sessionId) {
    getAuditEntries().forEach((entry) => {
      if (entry.sessionId === sessionId && (!entry.ip || entry.ip === "IP pendente")) {
        entry.ip = runtime.auditSessionIp;
      }
    });
    saveData();
  }
  return runtime.auditSessionIp;
}

function startAuditSession() {
  runtime.auditSessionId = createAuditSessionId();
  runtime.auditSessionIp = "";
  runtime.auditSessionIpReady = false;
  ensureAuditSessionIp();
}

function logAuditEvent(action, entity, details, options = {}) {
  const actor = getCurrentUser();
  const entry = {
    id: createMovementId(),
    timestamp: new Date().toISOString(),
    sessionId: runtime.auditSessionId || "",
    userId: actor?.id || "",
    userLogin: actor?.login || "Sistema",
    userRole: actor?.role || "system",
    ip: runtime.auditSessionIpReady ?(runtime.auditSessionIp || "IP indisponível") : "IP pendente",
    action,
    entity,
    farmId: options.farmId || "",
    farmName: options.farmName || "",
    recordCode: options.recordCode || "",
    details: details || ""
  };

  if (!Array.isArray(state.data.auth.auditLog)) {
    state.data.auth.auditLog = [];
  }
  state.data.auth.auditLog.unshift(entry);
  if (state.data.auth.auditLog.length > 2000) {
    state.data.auth.auditLog = state.data.auth.auditLog.slice(0, 2000);
  }
}

const AUDIT_PAGE_SIZE = 50;

function renderAuditTrailDialog() {
  const query = runtime.auditSearch.trim().toLowerCase();
  const entries = getAuditEntries().filter((entry) => !query || [
    entry.userLogin,
    entry.action,
    entry.entity,
    entry.farmName,
    entry.recordCode,
    entry.details,
    entry.ip
  ].some((value) => String(value || "").toLowerCase().includes(query)));

  const totalPages = Math.max(1, Math.ceil(entries.length / AUDIT_PAGE_SIZE));
  if (runtime.auditPage >= totalPages) runtime.auditPage = totalPages - 1;
  const page = runtime.auditPage;
  const slice = entries.slice(page * AUDIT_PAGE_SIZE, (page + 1) * AUDIT_PAGE_SIZE);

  elements.auditTrailSearch.value = runtime.auditSearch;
  elements.auditTrailBody.innerHTML = slice.length
    ?slice.map((entry) => `
        <tr>
          <td>${new Date(entry.timestamp).toLocaleString("pt-BR")}</td>
          <td>${escapeHtml(entry.userLogin)}<br><span class="field-note">${escapeHtml(getRoleLabel(entry.userRole === "admin" ?"admin" : "usuario"))}</span></td>
          <td>${escapeHtml(entry.ip || "IP indisponível")}</td>
          <td><span class="badge badge-neutral">${escapeHtml(entry.action)}</span></td>
          <td>${escapeHtml(entry.farmName || "—")}</td>
          <td>${escapeHtml(entry.recordCode || "—")}</td>
          <td>${escapeHtml(entry.details || `${entry.entity}`)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="7" class="table-empty-cell">${query ?"Nenhuma ação encontrada para a busca." : "Nenhuma ação auditada até o momento."}</td></tr>`;

  elements.auditTrailFooter.innerHTML = `
    <span class="movements-count">${entries.length} evento${entries.length !== 1 ?"s" : ""}</span>
    ${totalPages > 1 ?`
      <button class="mov-page-btn" data-audit-page="${page - 1}" ${page === 0 ?"disabled" : ""}>&#8249; Anterior</button>
      <span class="mov-page-info">Página ${page + 1} de ${totalPages}</span>
      <button class="mov-page-btn" data-audit-page="${page + 1}" ${page >= totalPages - 1 ?"disabled" : ""}>Próxima &#8250;</button>
    ` : ""}
  `;

  elements.auditTrailFooter.querySelectorAll("[data-audit-page]").forEach((button) => {
    button.addEventListener("click", () => {
      runtime.auditPage = Number(button.dataset.auditPage);
      renderAuditTrailDialog();
    });
  });
}

function openAuditTrailDialog() {
  if (!isAdmin()) return;
  runtime.auditPage = 0;
  renderAuditTrailDialog();
  elements.auditTrailDialog.showModal();
}

async function exportAuditTrailPdf() {
  if (!isAdmin()) return;
  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("Biblioteca de PDF não disponível. Verifique sua conexão e recarregue a página.");
    return;
  }
  const { jsPDF } = window.jspdf;

  const entries = getAuditEntries();
  const now = new Date();
  const generatedAt = now.toLocaleString("pt-BR");
  const dateLabel = now.toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" });
  const fileName = `trilha-auditoria-${now.toISOString().slice(0, 10)}.pdf`;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Capa ──────────────────────────────────────────────────────────────
  await appendPdfCoverPage(doc, getAllFarms(), dateLabel, "Trilha de Auditoria");
  doc.addPage();

  // ── Cabeçalho da página de conteúdo ───────────────────────────────────
  try {
    const logoData = await loadLogoForPdf("#ffffff");
    doc.addImage(logoData, "JPEG", margin, 7, 17, 17);
  } catch (e) { /* sem logo */ }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(45, 35, 25);
  doc.text("Trilha de Auditoria", margin + 21, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(87, 69, 52);
  doc.text(
    `Administrador: ${ADMINISTRATOR_NAME}   |   Responsável Técnico: ${TECHNICAL_MANAGER_NAME}   |   Gerado em: ${generatedAt}`,
    margin + 21, 21
  );
  doc.setDrawColor(140, 80, 45);
  doc.setLineWidth(0.6);
  doc.line(margin, 26, pageW - margin, 26);

  // ── Resumo executivo ───────────────────────────────────────────────────
  const uniqueUsers = [...new Set(entries.map((e) => e.userLogin))].length;
  const uniqueFarms = [...new Set(entries.map((e) => e.farmName).filter(Boolean))].length;
  const timestamps = entries.map((e) => new Date(e.timestamp).getTime()).filter(Boolean);
  const firstEvent = timestamps.length ?new Date(Math.min(...timestamps)).toLocaleString("pt-BR") : "—";
  const lastEvent  = timestamps.length ?new Date(Math.max(...timestamps)).toLocaleString("pt-BR") : "—";

  const actionCounts = {};
  entries.forEach((e) => { actionCounts[e.action] = (actionCounts[e.action] || 0) + 1; });
  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([action, count]) => `${action} (${formatInteger(count)})`)
    .join(", ") || "—";

  doc.autoTable({
    startY: 31,
    head: [["Resumo da Trilha de Auditoria", ""]],
    body: [
      ["Total de eventos registrados", formatInteger(entries.length)],
      ["Usuários com atividade", formatInteger(uniqueUsers)],
      ["Fazendas referenciadas", formatInteger(uniqueFarms)],
      ["Primeiro evento", firstEvent],
      ["Último evento", lastEvent],
      ["Ações mais frequentes", topActions],
      ["Administrador responsável", ADMINISTRATOR_NAME],
      ["Responsável Técnico", TECHNICAL_MANAGER_NAME],
    ],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184], fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 68 } },
    margin: { left: margin, right: margin },
  });

  // ── Tabela principal de eventos ────────────────────────────────────────
  const tableStartY = doc.lastAutoTable.finalY + 10;

  const tableHead = [["Data / Hora", "Usuário", "Perfil", "IP", "Ação", "Fazenda", "Referência", "Detalhes"]];
  const tableBody = entries.length
    ?entries.map((entry) => [
        new Date(entry.timestamp).toLocaleString("pt-BR"),
        entry.userLogin || "—",
        getRoleLabel(entry.userRole === "admin" ?"admin" : "usuario"),
        entry.ip || "IP indisponível",
        entry.action || "—",
        entry.farmName || "—",
        entry.recordCode || "—",
        entry.details || entry.entity || "—",
      ])
    : [["—", "—", "—", "—", "—", "—", "—", "Nenhum evento auditado até o momento."]];

  doc.autoTable({
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: [45, 35, 25] },
    alternateRowStyles: { fillColor: [248, 244, 236] },
    columnStyles: {
      0: { cellWidth: 33 },
      1: { cellWidth: 22 },
      2: { cellWidth: 20 },
      3: { cellWidth: 26 },
      4: { cellWidth: 24 },
      5: { cellWidth: 22 },
      6: { cellWidth: 26 },
      7: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(87, 69, 52);
        doc.text("Trilha de Auditoria  |  Fazendas Da Bruna", margin, 7);
        doc.setDrawColor(140, 80, 45);
        doc.setLineWidth(0.35);
        doc.line(margin, 9, pageW - margin, 9);
      }
    },
  });

  // ── Rodapés ────────────────────────────────────────────────────────────
  addPdfFooters(doc, { coverPage: true });

  doc.save(fileName);
}

// ─── Cloud Sync ───────────────────────────────────────────────────────────────

async function cloudGetToken() {
  return runtime.cloudToken || null;
}

async function legacyCloudPushUnused() {
  if (!runtime.cloudEnabled || runtime.cloudSyncing) return;
  runtime.cloudSyncing = true;
  try {
    const token = await cloudGetToken();
    if (!token) return;
    const pushPayload = JSON.parse(JSON.stringify(state.data));
    pushPayload.auth = { ...pushPayload.auth, sessionUserId: "" };
    const res = await fetch(`${API_URL}/api/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ payload: pushPayload })
    });
    if (res.status === 401) runtime.cloudToken = null;
  } catch {
    // sync silenciosa — não bloqueia a UI
  } finally {
    runtime.cloudSyncing = false;
  }
}

async function legacyCloudPullUnused() {
  if (!runtime.cloudEnabled) return;
  try {
    const token = await cloudGetToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/api/data`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return;
    const { payload } = await res.json();
    if (!payload) return;
    const currentSessionUserId = state.data.auth.sessionUserId;
    const currentFarmId = state.data.selectedFarmId;
    const merged = ensureDataShape(payload, { preserveSnapshot: true });
    merged.selectedFarmId = currentFarmId || TOTAL_FARM_ID;
    merged.auth.sessionUserId = currentSessionUserId;
    const localJson = JSON.stringify(state.data.farms);
    const cloudJson = JSON.stringify(merged.farms);
    if (localJson !== cloudJson) {
      state.data = merged;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      if (isAuthenticated()) {
        render();
      }
    }
  } catch {
    // sync silenciosa
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function normalizeApiRole(role) {
  return role === "admin" ?"admin" : "usuario";
}

function normalizeApiUser(user) {
  if (!user) return null;
  return {
    id: String(user.id),
    login: String(user.username || user.login || ""),
    role: normalizeApiRole(user.role)
  };
}

async function apiRequest(path, options = {}, timeoutMs = 18000) {
  const headers = { ...(options.headers || {}) };
  if (runtime.cloudToken) {
    headers.Authorization = `Bearer ${runtime.cloudToken}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      const e = new Error("O servidor demorou para responder. Ele pode estar acordando — aguarde 30 segundos e tente novamente.");
      e.isTimeout = true;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const error = new Error(payload?.error || "Falha na requisição.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function upsertAuthUser(user) {
  const normalized = normalizeApiUser(user);
  if (!normalized) return null;
  const nextUsers = Array.isArray(state.data.auth.users) ?[...state.data.auth.users] : [];
  const index = nextUsers.findIndex((item) => String(item.id) === String(normalized.id));
  if (index >= 0) nextUsers[index] = normalized;
  else nextUsers.push(normalized);
  state.data.auth.users = nextUsers;
  return normalized;
}

function replaceAuthUsers(users) {
  state.data.auth.users = (Array.isArray(users) ?users : [])
    .map((user) => normalizeApiUser(user))
    .filter(Boolean);
}

async function refreshUsersFromApi() {
  if (!runtime.cloudToken) return;
  if (isAdmin()) {
    const users = await apiRequest("/api/users");
    replaceAuthUsers(users);
  } else {
    const me = await apiRequest("/api/auth/me");
    replaceAuthUsers([me]);
  }
}

async function intermediateCloudPushUnused() {
  if (!runtime.cloudEnabled || runtime.cloudSyncing || !runtime.cloudToken) return;
  if (runtime.cloudPushTimer) {
    window.clearTimeout(runtime.cloudPushTimer);
    runtime.cloudPushTimer = null;
  }
  runtime.cloudSyncing = true;
  renderSyncStatus();
  try {
    const pushPayload = JSON.parse(JSON.stringify(state.data));
    pushPayload.auth = {
      ...pushPayload.auth,
      sessionUserId: "",
      users: (pushPayload.auth.users || []).map((user) => ({
        id: user.id,
        login: user.login,
        role: user.role
      }))
    };
    const response = await apiRequest("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: pushPayload, baseRevision: runtime.cloudRevision })
    });
    runtime.cloudRevision = Number(response?.revision || runtime.cloudRevision || 0);
    runtime.cloudConflict = false;
    setApiNotice("");
  } catch (error) {
    if (error.status === 401) {
      runtime.cloudToken = null;
    } else if (error.status === 409) {
      runtime.cloudConflict = true;
      alert("Outra sessão salvou dados antes desta. Suas alterações ficaram locais neste navegador. Recarregue os dados antes de continuar.");
    }
  } finally {
    runtime.cloudSyncing = false;
    renderSyncStatus();
  }
}

async function intermediateCloudPullUnused() {
  if (!runtime.cloudEnabled || !runtime.cloudToken) return;
  try {
    runtime.cloudSyncing = true;
    renderSyncStatus();
    const response = await apiRequest("/api/data");
    runtime.cloudRevision = Number(response?.revision || 0);
    runtime.cloudConflict = false;
    if (!response?.payload) return;
    const currentSessionUserId = state.data.auth.sessionUserId;
    const currentFarmId = state.data.selectedFarmId;
    const currentUsers = Array.isArray(state.data.auth.users) ?[...state.data.auth.users] : [];
    const merged = ensureDataShape(response.payload, { preserveSnapshot: true });
    merged.selectedFarmId = currentFarmId || TOTAL_FARM_ID;
    merged.auth.sessionUserId = currentSessionUserId;
    merged.auth.users = currentUsers;
    const localJson = JSON.stringify(state.data.farms);
    const cloudJson = JSON.stringify(merged.farms);
    if (localJson !== cloudJson) {
      state.data = merged;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      if (isAuthenticated()) {
        render();
      }
    }
  } catch (error) {
    if (error.status === 401) {
      runtime.cloudToken = null;
    }
  } finally {
    runtime.cloudSyncing = false;
    renderSyncStatus();
  }
}

async function cloudPush() {
  if (!runtime.cloudEnabled || runtime.cloudSyncing || !runtime.cloudToken) return;
  if (runtime.cloudPushTimer) {
    window.clearTimeout(runtime.cloudPushTimer);
    runtime.cloudPushTimer = null;
  }
  runtime.cloudSyncing = true;
  renderSyncStatus();
  try {
    const pushPayload = JSON.parse(JSON.stringify(state.data));
    pushPayload.auth = {
      ...pushPayload.auth,
      sessionUserId: "",
      users: (pushPayload.auth.users || []).map((user) => ({
        id: user.id,
        login: user.login,
        role: user.role
      }))
    };
    const response = await apiRequest("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: pushPayload, baseRevision: runtime.cloudRevision })
    });
    runtime.cloudRevision = Number(response?.revision || runtime.cloudRevision || 0);
    runtime.cloudConflict = false;
    setApiNotice("");
  } catch (error) {
    if (error.status === 401) {
      runtime.cloudToken = null;
      setApiNotice("Sua sessao na nuvem expirou. Entre novamente para voltar a sincronizar.", "warn");
    } else if (error.status === 409) {
      // Conflito de revisão: usa endpoint de merge atômico para não perder nenhum dado.
      // O merge adiciona apenas registros novos (por ID) sem sobrescrever os existentes.
      try {
        const mergePush = JSON.parse(JSON.stringify(state.data));
        mergePush.auth = {
          ...mergePush.auth,
          sessionUserId: "",
          users: (mergePush.auth.users || []).map((u) => ({ id: u.id, login: u.login, role: u.role }))
        };
        const mergeResp = await apiRequest("/api/data/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: mergePush })
        });
        runtime.cloudRevision = Number(mergeResp?.revision || runtime.cloudRevision || 0);
        runtime.cloudConflict = false;
        setApiNotice("Dados sincronizados com mesclagem automatica.", "info");
        // Pull fresh state to get merged result
        await cloudPull();
      } catch (mergeError) {
        runtime.cloudConflict = true;
        setApiNotice("Conflito detectado. Recarregue os dados antes de continuar.", "warn");
      }
    } else {
      setApiNotice("Nao foi possivel sincronizar agora. O trabalho continua salvo localmente neste navegador.", "error");
    }
  } finally {
    runtime.cloudSyncing = false;
    renderSyncStatus();
  }
}

async function cloudPull() {
  if (!runtime.cloudEnabled || !runtime.cloudToken) return;
  try {
    runtime.cloudSyncing = true;
    renderSyncStatus();
    const response = await apiRequest("/api/data");
    runtime.cloudRevision = Number(response?.revision || 0);
    runtime.cloudConflict = false;
    setApiNotice("");
    if (!response?.payload) return;
    const currentSessionUserId = state.data.auth.sessionUserId;
    const currentFarmId = state.data.selectedFarmId;
    const currentUsers = Array.isArray(state.data.auth.users) ?[...state.data.auth.users] : [];
    const merged = ensureDataShape(response.payload, { preserveSnapshot: true });
    merged.selectedFarmId = currentFarmId || TOTAL_FARM_ID;
    merged.auth.sessionUserId = currentSessionUserId;
    merged.auth.users = currentUsers;
    const localJson = JSON.stringify(state.data.farms);
    const cloudJson = JSON.stringify(merged.farms);
    if (localJson !== cloudJson) {
      state.data = merged;
      fixSanitaryDates2026Dec();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      // Garante que registros importados (IMPORTED_SANITARY_RECORDS etc.)
      // sejam persistidos no Render após serem adicionados localmente
      scheduleCloudPush();
      if (isAuthenticated()) {
        render();
      }
    }
  } catch (error) {
    if (error.status === 401) {
      runtime.cloudToken = null;
      setApiNotice("Sua sessao na nuvem expirou. Entre novamente para recarregar os dados.", "warn");
    } else {
      setApiNotice("Não foi possível recarregar os dados da nuvem agora. Tentaremos novamente quando voce mandar salvar.", "error");
    }
  } finally {
    runtime.cloudSyncing = false;
    renderSyncStatus();
  }
}

async function legacyHandleSyncRetryUnused() {
  if (!runtime.cloudToken) return;
  try {
    await cloudPull();
    render();
  } catch (error) {
    console.warn("Não foi possível recarregar os dados da nuvem.", error);
  }
}

async function handleSyncRetry() {
  if (!runtime.cloudToken) return;
  try {
    await cloudPull();
    render();
  } catch (error) {
    console.warn("Não foi possível recarregar os dados da nuvem.", error);
    setApiNotice("A recarga manual da nuvem falhou. Verifique a conexao e tente novamente.", "error");
  }
}

function getCurrentUser() {
  return state.data.auth.users.find((user) => user.id === state.data.auth.sessionUserId) || null;
}

function isAuthenticated() {
  return Boolean(getCurrentUser());
}

function isAdmin() {
  const user = getCurrentUser();
  return user?.role === "admin";
}

function getRoleLabel(role) {
  return role === "admin" ?"Administrador" : "Usuário";
}

function renderSyncStatus() {
  if (!elements.syncStatusChip) return;

  let label = "Local";
  let className = "chip sync-chip sync-idle";
  const canRetry = Boolean(runtime.cloudToken) && runtime.cloudConflict;

  if (!isAuthenticated() || !runtime.cloudToken) {
    label = "Sem nuvem";
  } else if (runtime.cloudConflict) {
    label = "Conflito";
    className = "chip sync-chip sync-warn";
  } else if (runtime.cloudSyncing) {
    label = "Sincronizando";
    className = "chip sync-chip sync-busy";
  } else if (runtime.cloudRevision > 0) {
    label = "Sincronizado";
    className = "chip sync-chip sync-ok";
  }

  elements.syncStatusChip.textContent = label;
  elements.syncStatusChip.className = className;
  elements.syncStatusChip.title = label;
  if (elements.syncRetryButton) {
    elements.syncRetryButton.hidden = !canRetry;
  }
  if (isAuthenticated() && !runtime.cloudToken && runtime.apiNoticeMessage.startsWith("Modo local")) {
    setApiNotice(runtime.apiNoticeMessage, runtime.apiNoticeLevel, {
      label: "Sair para reconectar",
      fn: () => { saveData({ skipCloud: true }); window.location.reload(); }
    });
  } else {
    setApiNotice(runtime.apiNoticeMessage, runtime.apiNoticeLevel);
  }
}

function renderAuthState() {
  const currentUser = getCurrentUser();
  const showSplash = !runtime.splashDismissed && !currentUser;
  elements.splashShell.hidden = !showSplash;
  elements.authShell.hidden = showSplash || Boolean(currentUser);
  elements.pageShell.hidden = showSplash || !currentUser;
  if (elements.mobileBottomNav) elements.mobileBottomNav.hidden = showSplash || !currentUser;
  if (elements.mobileUtilityBar) elements.mobileUtilityBar.hidden = showSplash || !currentUser;
  document.body.classList.toggle("login-mode", !currentUser && !showSplash);
  document.body.classList.toggle("splash-mode", showSplash);
  if (currentUser) {
    elements.currentUserLabel.textContent = currentUser.login;
    // show role badge
    let roleBadge = document.getElementById("currentUserRoleBadge");
    if (!roleBadge) {
      roleBadge = document.createElement("span");
      roleBadge.id = "currentUserRoleBadge";
      elements.currentUserLabel.parentElement.appendChild(roleBadge);
    }
    roleBadge.className = `role-badge role-${currentUser.role || "usuario"}`;
    roleBadge.textContent = getRoleLabel(currentUser.role);
  } else {
    elements.currentUserLabel.textContent = "Usuário";
    const roleBadge = document.getElementById("currentUserRoleBadge");
    if (roleBadge) roleBadge.remove();
  }
  if (elements.manageUsersButton) {
    elements.manageUsersButton.hidden = !isAdmin();
  }
  if (elements.auditTrailButton) {
    elements.auditTrailButton.hidden = !isAdmin();
  }
  renderSyncStatus();
}

function startSplashExperience() {
  if (!elements.splashShell || isAuthenticated()) {
    runtime.splashDismissed = true;
    renderAuthState();
    return;
  }

  runtime.splashDismissed = false;
  renderAuthState();
}

function dismissSplash() {
  if (runtime.splashDismissed) {
    return;
  }

  runtime.splashDismissed = true;
  renderAuthState();
}

function setAuthLoginMode(mode) {
  runtime.authLoginMode = mode === "admin" ?"admin" : "usuario";
  elements.loginRoleTabs.forEach((button) => {
    const isActive = button.dataset.authRole === runtime.authLoginMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ?"true" : "false");
  });

  if (elements.loginRoleHint) {
    elements.loginRoleHint.textContent = runtime.authLoginMode === "admin"
      ?"Acesso administrativo para auditoria, cadastro de usuários, redefinição de senhas e configurações sensíveis."
      : "Acesso padrão para operação do sistema e consulta dos registros autorizados.";
  }
}

function legacyHandleLoginSubmitUnused(event) {
  event.preventDefault();
  const login = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;
  const user = null;

  if (!user) {
    elements.loginFeedback.hidden = false;
    elements.loginFeedback.textContent = "Login ou senha incorretos. Tente novamente.";
    return;
  }

  if ((user.role || "usuario") !== runtime.authLoginMode) {
    elements.loginFeedback.hidden = false;
    elements.loginFeedback.textContent = runtime.authLoginMode === "admin"
      ?"Este login não possui perfil de Administrador."
      : "Este login não possui perfil de Usuário padrão.";
    return;
  }

  elements.loginFeedback.hidden = true;
  elements.loginFeedback.textContent = "";
  elements.loginForm.reset();
  state.data.auth.sessionUserId = user.id;
  startAuditSession();
  logAuditEvent("Login", "auth", "Entrada no sistema");
  saveData();
  renderAuthState();
  initializeAppShell();
  render();
  checkBackupWarning();
  cloudPull();
}

function legacyHandleLogoutUnused() {
  logAuditEvent("Logout", "auth", "Saída do sistema");
  state.data.auth.sessionUserId = "";
  saveData();
  if (elements.manageUsersDialog.open) {
    elements.manageUsersDialog.close();
  }
  elements.loginFeedback.hidden = true;
  elements.loginFeedback.textContent = "";
  renderAuthState();
  startSplashExperience();
}

function legacyOpenManageUsersDialogUnused() {
  if (!isAdmin()) return;
  renderUserList();
  elements.newUserLogin.value = "";
  elements.newUserPassword.value = "";
  if (elements.newUserRole) elements.newUserRole.value = "usuario";
  elements.manageUsersDialog.showModal();
}

function legacyRenderUserListUnused() {
  const currentUser = getCurrentUser();
  const adminCount = state.data.auth.users.filter((u) => u.role === "admin").length;

  elements.userList.innerHTML = state.data.auth.users.map((user) => {
    const isSelf = user.id === currentUser?.id;
    const isLastAdmin = user.role === "admin" && adminCount === 1;
    const canDelete = !isSelf && !isLastAdmin;
    return `
      <article class="user-row">
        <div class="user-row-info">
          <div class="user-row-identity">
            <strong>${escapeHtml(user.login)}</strong>
            ${isSelf ?`<span class="user-self-tag">você</span>` : ""}
          </div>
          <span class="role-badge role-${user.role || "usuario"}">${getRoleLabel(user.role)}</span>
        </div>
        <div class="user-row-actions">
          <button type="button" class="user-action-btn" data-edit-user-id="${user.id}" title="Editar login e perfil">Editar</button>
          <button type="button" class="user-action-btn" data-reset-user-id="${user.id}" title="Redefinir senha">Resetar senha</button>
          ${canDelete
            ?`<button type="button" class="user-action-btn user-action-danger" data-delete-user-id="${user.id}" title="Excluir usuário">Excluir</button>`
            : `<button type="button" class="user-action-btn user-action-disabled" disabled title="${isSelf ?"Não é possível excluir sua própria conta" : "O sistema precisa de ao menos um administrador"}">${isSelf ?"—" : "Excluir"}</button>`
          }
        </div>
      </article>
    `;
  }).join("");
  closeUserEditor();
}

function legacyHandleUserListInteractionUnused(event) {
  const editTrigger = event.target.closest("[data-edit-user-id]");
  if (editTrigger) {
    openUserEditor(editTrigger.dataset.editUserId, "edit");
    return;
  }

  const resetTrigger = event.target.closest("[data-reset-user-id]");
  if (resetTrigger) {
    openUserEditor(resetTrigger.dataset.resetUserId, "reset");
    return;
  }

  const deleteTrigger = event.target.closest("[data-delete-user-id]");
  if (deleteTrigger) {
    const userId = deleteTrigger.dataset.deleteUserId;
    const user = state.data.auth.users.find((u) => u.id === userId);
    if (!user) return;
    if (!confirm(`Excluir o usuário "${user.login}"?Esta ação não pode ser desfeita.`)) return;
    const adminCount = state.data.auth.users.filter((u) => u.role === "admin").length;
    if (user.role === "admin" && adminCount <= 1) {
      alert("Não é possível excluir o último administrador do sistema.");
      return;
    }
    if (user.id === state.data.auth.sessionUserId) {
      alert("Você não pode excluir sua própria conta enquanto está conectado.");
      return;
    }
    logAuditEvent("Exclusão", "usuário", `Usuário removido: ${user.login}`);
    state.data.auth.users = state.data.auth.users.filter((u) => u.id !== userId);
    saveData();
    renderUserList();
    return;
  }
}

function openUserEditor(userId, mode = "edit") {
  const user = state.data.auth.users.find((item) => item.id === userId);
  if (!user) return;

  state.userEditingId = userId;
  state.userEditingMode = mode;

  const isReset = mode === "reset";
  elements.userEditorPanel.hidden = false;
  if (elements.userEditorKicker) elements.userEditorKicker.textContent = isReset ?"Redefinir senha" : "Editar usuário";
  elements.userEditorTitle.textContent = user.login;

  elements.editUserLogin.value = user.login;
  elements.editUserLogin.readOnly = isReset;

  elements.editUserPassword.value = "";
  elements.editUserPassword.placeholder = isReset ?"Nova senha obrigatória" : "Deixe vazio para manter a senha atual";
  elements.editUserPassword.required = isReset;
  if (elements.editUserPasswordLabel) {
    elements.editUserPasswordLabel.textContent = isReset ?"Nova senha" : "Senha (deixe vazio para manter)";
  }

  if (elements.editUserRole) elements.editUserRole.value = user.role || "usuario";
  if (elements.editUserRoleWrap) elements.editUserRoleWrap.hidden = isReset;

  // Scroll editor into view
  elements.userEditorPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeUserEditor() {
  state.userEditingId = null;
  state.userEditingMode = null;
  elements.userEditorPanel.hidden = true;
  elements.editUserLogin.value = "";
  elements.editUserLogin.readOnly = false;
  elements.editUserPassword.value = "";
  elements.editUserPassword.required = false;
  if (elements.editUserRoleWrap) elements.editUserRoleWrap.hidden = false;
}

function legacyHandleUserEditSaveUnused() {
  if (!state.userEditingId) return;

  const user = state.data.auth.users.find((item) => item.id === state.userEditingId);
  if (!user) return;

  const isReset = state.userEditingMode === "reset";
  const nextLogin = isReset ?user.login : elements.editUserLogin.value.trim();
  const nextPassword = elements.editUserPassword.value;

  if (!nextLogin) {
    alert("O login não pode ficar vazio.");
    return;
  }

  if (state.data.auth.users.some((item) => item.id !== user.id && normalizeText(item.login) === normalizeText(nextLogin))) {
    alert("Já existe outro usuário com esse login.");
    return;
  }

  if (isReset && !nextPassword) {
    alert("Digite a nova senha para redefinir.");
    return;
  }

  // Protect: can't downgrade the last admin
  if (!isReset) {
    const newRole = elements.editUserRole ?elements.editUserRole.value : user.role;
    const adminCount = state.data.auth.users.filter((u) => u.role === "admin").length;
    if (user.role === "admin" && newRole !== "admin" && adminCount <= 1) {
      alert("Não é possível rebaixar o último administrador do sistema.");
      return;
    }
    user.login = nextLogin;
    user.role = newRole;
  }

  if (nextPassword) {
    // senha gerenciada pela API
  }

  logAuditEvent(
    isReset ?"Reset de senha" : "Edição",
    "usuário",
    isReset ?`Senha redefinida para ${user.login}` : `Usuário atualizado: ${user.login}`
  );
  saveData();
  renderUserList();
  renderAuthState();
  closeUserEditor();

  if (isReset) {
    alert(`Senha de "${user.login}" redefinida com sucesso.`);
  }
}

function legacyHandleManageUsersSubmitUnused(event) {
  event.preventDefault();
  const login = elements.newUserLogin.value.trim();
  const password = elements.newUserPassword.value;

  if (!login || !password) return;

  if (password.length < 4) {
    alert("A senha precisa ter pelo menos 4 caracteres.");
    return;
  }

  if (state.data.auth.users.some((user) => normalizeText(user.login) === normalizeText(login))) {
    alert("Já existe um usuário com esse login.");
    return;
  }

  const role = elements.newUserRole?.value || "usuario";
  state.data.auth.users.push({
    id: slugify(`${login}-${Date.now()}`),
    login,
    password: "",
    role
  });

  logAuditEvent("Adição", "usuário", `Novo usuário criado: ${login} (${getRoleLabel(role)})`);
  saveData();
  elements.newUserLogin.value = "";
  elements.newUserPassword.value = "";
  renderUserList();
}

function openChangeMyPasswordDialog() {
  const dlg = document.getElementById("changeMyPasswordDlg");
  if (!dlg) return;
  document.getElementById("changeMyPasswordCurrent").value = "";
  document.getElementById("changeMyPasswordNew").value = "";
  document.getElementById("changeMyPasswordConfirm").value = "";
  document.getElementById("changeMyPasswordFeedback").hidden = true;
  dlg.showModal();
}

function legacyHandleChangeMyPasswordSubmitUnused(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return;
  const current = document.getElementById("changeMyPasswordCurrent").value;
  const next = document.getElementById("changeMyPasswordNew").value;
  const confirm = document.getElementById("changeMyPasswordConfirm").value;
  const feedback = document.getElementById("changeMyPasswordFeedback");

  if (false) {
    feedback.hidden = false;
    feedback.textContent = "Senha atual incorreta.";
    return;
  }
  if (next.length < 4) {
    feedback.hidden = false;
    feedback.textContent = "A nova senha deve ter pelo menos 4 caracteres.";
    return;
  }
  if (next !== confirm) {
    feedback.hidden = false;
    feedback.textContent = "A confirmação não confere com a nova senha.";
    return;
  }
  // senha gerenciada pela API
  saveData();
  document.getElementById("changeMyPasswordDlg").close();
  alert("Senha alterada com sucesso!");
}

async function legacyHandleLoginSubmitApiUnused(event) {
  event.preventDefault();
  const login = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;

  try {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: login, password })
    });
    const user = upsertAuthUser(data.user);
    if (!user) {
      throw new Error("Falha ao carregar usuário autenticado.");
    }
    if ((user.role || "usuario") !== runtime.authLoginMode) {
      elements.loginFeedback.hidden = false;
      elements.loginFeedback.textContent = runtime.authLoginMode === "admin"
        ?"Este login não possui perfil de Administrador."
        : "Este login não possui perfil de Usuário padrão.";
      return;
    }

    runtime.cloudToken = data.token || null;
    runtime.cloudConflict = false;
    runtime.cloudRevision = 0;
    setApiNotice("");
    state.data.auth.sessionUserId = user.id;
    elements.loginFeedback.hidden = true;
    elements.loginFeedback.textContent = "";
    elements.loginForm.reset();
    startAuditSession();
    logAuditEvent("Login", "auth", "Entrada no sistema");
    saveData({ skipCloud: true });
    renderAuthState();
    initializeAppShell();
    try {
      await refreshUsersFromApi();
      await cloudPull();
    } catch (syncError) {
      console.warn("Login concluído, mas a sincronização inicial falhou.", syncError);
    }
    render();
    checkBackupWarning();
  } catch (error) {
    elements.loginFeedback.hidden = false;
    elements.loginFeedback.textContent = error.message || "Não foi possível autenticar.";
  }
}

function legacyHandleLogoutApiUnused() {
  logAuditEvent("Logout", "auth", "Saida do sistema");
  state.data.auth.sessionUserId = "";
  runtime.cloudToken = null;
  runtime.cloudRevision = 0;
  saveData({ skipCloud: true });
  if (elements.manageUsersDialog.open) {
    elements.manageUsersDialog.close();
  }
  elements.loginFeedback.hidden = true;
  elements.loginFeedback.textContent = "";
  renderAuthState();
  startSplashExperience();
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function localCredKey(username) {
  return `plc_${btoa(unescape(encodeURIComponent(username.toLowerCase())))}`;
}

async function saveLocalCredential(username, password, userId) {
  try {
    const hash = await sha256Hex(`${password}:${userId}:paineldaluz`);
    localStorage.setItem(localCredKey(username), JSON.stringify({ hash, userId }));
  } catch { /* ignore */ }
}

async function checkLocalCredential(username, password) {
  try {
    const raw = localStorage.getItem(localCredKey(username));
    if (!raw) return null;
    const { hash, userId } = JSON.parse(raw);
    const candidate = await sha256Hex(`${password}:${userId}:paineldaluz`);
    if (candidate !== hash) return null;
    return state.data.auth.users.find((u) => String(u.id) === String(userId)) || null;
  } catch { return null; }
}

function completaLoginLocal(user) {
  if ((user.role || "usuario") !== runtime.authLoginMode) {
    elements.loginFeedback.hidden = false;
    elements.loginFeedback.textContent = runtime.authLoginMode === "admin"
      ? "Este login não possui perfil de Administrador."
      : "Este login não possui perfil de Usuário padrão.";
    return;
  }
  runtime.cloudToken = null;
  runtime.cloudConflict = false;
  runtime.cloudRevision = 0;
  setApiNotice("Modo local ativo — sincronização com o servidor indisponível. Seus dados locais estão íntegros.", "warn", { label: "Sair para reconectar", fn: () => { saveData({ skipCloud: true }); window.location.reload(); } });
  state.data.auth.sessionUserId = user.id;
  elements.loginFeedback.hidden = true;
  elements.loginFeedback.textContent = "";
  elements.loginForm.reset();
  startAuditSession();
  logAuditEvent("Login local", "auth", "Entrada no sistema (modo offline)");
  saveData({ skipCloud: true });
  renderAuthState();
  initializeAppShell();
  render();
  checkBackupWarning();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const login = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;

  try {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: login, password })
    });
    const user = upsertAuthUser(data.user);
    if (!user) {
      throw new Error("Falha ao carregar usuario autenticado.");
    }
    if ((user.role || "usuario") !== runtime.authLoginMode) {
      elements.loginFeedback.hidden = false;
      elements.loginFeedback.textContent = runtime.authLoginMode === "admin"
        ?"Este login nao possui perfil de Administrador."
        : "Este login nao possui perfil de Usuario padrao.";
      return;
    }

    runtime.cloudToken = data.token || null;
    runtime.cloudConflict = false;
    runtime.cloudRevision = 0;
    setApiNotice("");
    state.data.auth.sessionUserId = user.id;
    elements.loginFeedback.hidden = true;
    elements.loginFeedback.textContent = "";
    elements.loginForm.reset();
    startAuditSession();
    logAuditEvent("Login", "auth", "Entrada no sistema");
    await saveLocalCredential(login, password, user.id);
    saveData({ skipCloud: true });
    renderAuthState();
    initializeAppShell();
    try {
      await refreshUsersFromApi();
      await cloudPull();
    } catch (syncError) {
      console.warn("Login concluido, mas a sincronizacao inicial falhou.", syncError);
      setApiNotice("Login concluido, mas a sincronizacao inicial falhou. Seus dados locais continuam disponiveis.", "warn");
    }
    render();
    checkBackupWarning();
  } catch (error) {
    if (error.isTimeout) {
      elements.loginFeedback.hidden = false;
      elements.loginFeedback.textContent = "O servidor está acordando após inatividade. Aguarde 30 segundos e tente novamente.";
      return;
    }
    const isServerError = !error.status
      ? true
      : error.status >= 500;
    if (isServerError) {
      // Servidor indisponível ou iniciando — mostrar opção de tentar novamente
      const localUser = await checkLocalCredential(login, password);
      const cachedUser = localUser || state.data.auth.users.find(
        (u) => (u.login || "").toLowerCase() === login.toLowerCase()
      );
      if (cachedUser) {
        const ok = confirm(
          `O servidor está iniciando. Aguarde 30 segundos e tente novamente.\n\n` +
          `» Clique em OK para tentar sincronizar agora.\n\n` +
          `» Clique em CANCELAR para entrar sem sincronização (modo offline).`
        );
        if (!ok) {
          completaLoginLocal(cachedUser);
          return;
        }
        elements.loginFeedback.hidden = false;
        elements.loginFeedback.textContent = "Aguarde cerca de 30 segundos e clique em Entrar novamente.";
        return;
      }
      elements.loginFeedback.hidden = false;
      elements.loginFeedback.textContent = "Servidor temporariamente indisponível. Aguarde 30 segundos e tente novamente.";
      return;
    }
    elements.loginFeedback.hidden = false;
    elements.loginFeedback.textContent = error.message || "Não foi possível autenticar.";
  }
}

function handleLogout() {
  logAuditEvent("Logout", "auth", "Saida do sistema");
  state.data.auth.sessionUserId = "";
  if (runtime.cloudPushTimer) {
    window.clearTimeout(runtime.cloudPushTimer);
    runtime.cloudPushTimer = null;
  }
  runtime.cloudToken = null;
  runtime.cloudRevision = 0;
  runtime.cloudConflict = false;
  setApiNotice("");
  saveData({ skipCloud: true });
  if (elements.manageUsersDialog.open) {
    elements.manageUsersDialog.close();
  }
  elements.loginFeedback.hidden = true;
  elements.loginFeedback.textContent = "";
  renderAuthState();
  startSplashExperience();
}

async function openManageUsersDialog() {
  if (!isAdmin()) return;
  try {
    await refreshUsersFromApi();
  } catch (error) {
    alert(error.message || "Não foi possível carregar os usuários.");
    return;
  }
  renderUserList();
  elements.newUserLogin.value = "";
  elements.newUserPassword.value = "";
  if (elements.newUserRole) elements.newUserRole.value = "usuario";
  elements.manageUsersDialog.showModal();
}

function renderUserList() {
  const currentUser = getCurrentUser();
  const adminCount = state.data.auth.users.filter((u) => u.role === "admin").length;

  elements.userList.innerHTML = state.data.auth.users.map((user) => {
    const isSelf = String(user.id) === String(currentUser?.id);
    const isLastAdmin = user.role === "admin" && adminCount === 1;
    const canDelete = !isSelf && !isLastAdmin;
    return `
      <article class="user-row">
        <div class="user-row-info">
          <div class="user-row-identity">
            <strong>${escapeHtml(user.login)}</strong>
            ${isSelf ?`<span class="user-self-tag">você</span>` : ""}
          </div>
          <span class="role-badge role-${user.role || "usuario"}">${getRoleLabel(user.role)}</span>
        </div>
        <div class="user-row-actions">
          <button type="button" class="user-action-btn" data-edit-user-id="${user.id}" title="Editar login e perfil">Editar</button>
          <button type="button" class="user-action-btn" data-reset-user-id="${user.id}" title="Redefinir senha">Resetar senha</button>
          ${canDelete
            ?`<button type="button" class="user-action-btn user-action-danger" data-delete-user-id="${user.id}" title="Excluir usuário">Excluir</button>`
            : `<button type="button" class="user-action-btn user-action-disabled" disabled title="${isSelf ?"Não  ? possível excluir sua própria conta" : "O sistema precisa de ao menos um administrador"}">${isSelf ?"â€”" : "Excluir"}</button>`
          }
        </div>
      </article>
    `;
  }).join("");
  closeUserEditor();
}

async function handleUserListInteraction(event) {
  const editTrigger = event.target.closest("[data-edit-user-id]");
  if (editTrigger) {
    openUserEditor(editTrigger.dataset.editUserId, "edit");
    return;
  }

  const resetTrigger = event.target.closest("[data-reset-user-id]");
  if (resetTrigger) {
    openUserEditor(resetTrigger.dataset.resetUserId, "reset");
    return;
  }

  const deleteTrigger = event.target.closest("[data-delete-user-id]");
  if (!deleteTrigger) return;

  const userId = deleteTrigger.dataset.deleteUserId;
  const user = state.data.auth.users.find((u) => String(u.id) === String(userId));
  if (!user) return;
  if (!confirm(`Excluir o usuário "${user.login}"?Esta ação não pode ser desfeita.`)) return;

  try {
    await apiRequest(`/api/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
    logAuditEvent("Exclusão", "usuário", `Usuário removido: ${user.login}`);
    state.data.auth.users = state.data.auth.users.filter((u) => String(u.id) !== String(userId));
    saveData();
    renderUserList();
  } catch (error) {
    alert(error.message || "Não foi possível excluir o usuário.");
  }
}

async function handleUserEditSave() {
  if (!state.userEditingId) return;

  const user = state.data.auth.users.find((item) => String(item.id) === String(state.userEditingId));
  if (!user) return;

  const isReset = state.userEditingMode === "reset";
  const nextLogin = isReset ?user.login : elements.editUserLogin.value.trim();
  const nextPassword = elements.editUserPassword.value;
  const nextRole = isReset ?user.role : (elements.editUserRole ?elements.editUserRole.value : user.role);

  if (!nextLogin) {
    alert("O login não pode ficar vazio.");
    return;
  }
  if (isReset && !nextPassword) {
    alert("Digite a nova senha para redefinir.");
    return;
  }

  try {
    await apiRequest(`/api/users/${encodeURIComponent(user.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: nextLogin,
        password: nextPassword || undefined,
        role: nextRole
      })
    });
    user.login = nextLogin;
    user.role = normalizeApiRole(nextRole);
    logAuditEvent(
      isReset ?"Reset de senha" : "Edição",
      "usuário",
      isReset ?`Senha redefinida para ${user.login}` : `Usuário atualizado: ${user.login}`
    );
    saveData();
    renderUserList();
    renderAuthState();
    closeUserEditor();
    if (isReset) {
      alert(`Senha de "${user.login}" redefinida com sucesso.`);
    }
  } catch (error) {
    alert(error.message || "Não foi possível atualizar o usuário.");
  }
}

async function handleManageUsersSubmit(event) {
  event.preventDefault();
  const login = elements.newUserLogin.value.trim();
  const password = elements.newUserPassword.value;
  const role = elements.newUserRole?.value || "usuario";

  if (!login || !password) return;
  if (password.length < 4) {
    alert("A senha precisa ter pelo menos 4 caracteres.");
    return;
  }

  try {
    const created = await apiRequest("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: login, password, role })
    });
    upsertAuthUser(created);
    logAuditEvent("Adição", "usuário", `Novo usuário criado: ${login} (${getRoleLabel(role)})`);
    saveData();
    elements.newUserLogin.value = "";
    elements.newUserPassword.value = "";
    renderUserList();
  } catch (error) {
    alert(error.message || "Não foi possível criar o usuário.");
  }
}

async function handleChangeMyPasswordSubmit(event) {
  event.preventDefault();
  const current = document.getElementById("changeMyPasswordCurrent").value;
  const next = document.getElementById("changeMyPasswordNew").value;
  const confirm = document.getElementById("changeMyPasswordConfirm").value;
  const feedback = document.getElementById("changeMyPasswordFeedback");

  if (next.length < 4) {
    feedback.hidden = false;
    feedback.textContent = "A nova senha deve ter pelo menos 4 caracteres.";
    return;
  }
  if (next !== confirm) {
    feedback.hidden = false;
    feedback.textContent = "A confirmação não confere com a nova senha.";
    return;
  }

  try {
    await apiRequest("/api/auth/change-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next })
    });
    feedback.hidden = true;
    document.getElementById("changeMyPasswordDlg").close();
    alert("Senha alterada com sucesso!");
  } catch (error) {
    feedback.hidden = false;
    feedback.textContent = error.message || "Não foi possível alterar a senha.";
  }
}

function getFarm() {
  if (state.data.selectedFarmId === TOTAL_FARM_ID) {
    return getAggregateFarm();
  }

  return state.data.farms[state.data.selectedFarmId];
}

function getAggregateFarm() {
  const farms = getAllFarms();
  const categoryMap = new Map();
  const ovinoMap = new Map();
  const sanitaryProducts = new Set();
  const potreroMap = new Map();
  let declaredTotal = 0;
  const movements = [];
  const sanitaryRecords = [];
  const monthlyRecords = [];

  farms.forEach((farm) => {
    declaredTotal += Number(farm.declaredTotal || 0);
    farm.categories.forEach((category) => {
      const existing = categoryMap.get(category.id);
      if (existing) {
        existing.quantity += Number(category.quantity || 0);
      } else {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          quantity: Number(category.quantity || 0)
        });
      }
    });
    getOvinoEntries(farm).forEach((entry) => {
      const existing = ovinoMap.get(entry.categoryId);
      if (existing) {
        existing.quantity += Number(entry.quantity || 0);
      } else {
        ovinoMap.set(entry.categoryId, {
          id: entry.categoryId,
          categoryId: entry.categoryId,
          categoryName: entry.categoryName,
          quantity: Number(entry.quantity || 0)
        });
      }
    });
    farm.movements.forEach((movement) => {
      movements.push({ ...movement, farmId: farm.id, farmName: farm.name });
    });
    farm.sanitaryRecords.forEach((record) => {
      sanitaryRecords.push({ ...record, farmId: farm.id, farmName: farm.name });
    });
    farm.monthlyRecords.forEach((record) => {
      monthlyRecords.push({ ...record, farmId: farm.id, farmName: farm.name });
    });
    farm.sanitaryProducts.forEach((product) => sanitaryProducts.add(product));
    getPotreroEntries(farm).forEach((potrero) => {
      const normalizedName = `${farm.id}::${normalizeText(potrero.name)}`;
      const existing = potreroMap.get(normalizedName);
      if (existing) {
        existing.quantity += Number(potrero.quantity || 0);
      } else {
        potreroMap.set(normalizedName, {
          id: potrero.id || createPotreroId(potrero.name),
          name: potrero.name,
          quantity: Number(potrero.quantity || 0),
          farmId: farm.id,
          farmName: farm.name
        });
      }
    });
  });

  return {
    id: TOTAL_FARM_ID,
    name: "Total",
    declaredTotal,
    note: "Visão consolidada de todas as fazendas.",
    sanitaryProducts: [...sanitaryProducts],
    potreiros: [...potreroMap.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)),
    categories: [...categoryMap.values()],
    ovinos: [...ovinoMap.values()],
    movements,
    sanitaryRecords,
    monthlyRecords
  };
}

function getAllFarms() {
  return Object.values(state.data.farms);
}

function createPotreroId(name = "potreiro") {
  const base = slugify(name) || "potreiro";
  return `pot-${base}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizePotreroQuantity(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity < 0) {
    return 0;
  }

  return Math.round(quantity);
}

function getPotreroEntries(farm) {
  return Array.isArray(farm?.potreiros) ?farm.potreiros : [];
}

function normalizePotreroEntries(entries, fallbackNames = []) {
  const normalizedEntries = Array.isArray(entries) && entries.length
    ?entries
    : fallbackNames.map((name) => ({ name, quantity: 0 }));
  const registry = new Map();

  normalizedEntries.forEach((entry) => {
    const name = typeof entry === "string" ?entry.trim() : String(entry?.name || "").trim();
    if (!name) {
      return;
    }

    const key = normalizeText(name);
    const quantity = typeof entry === "string" ?0 : normalizePotreroQuantity(entry.quantity);
    const existing = registry.get(key);
    if (existing) {
      existing.quantity += quantity;
      return;
    }

    registry.set(key, {
      id: typeof entry === "string" ?createPotreroId(name) : entry.id || createPotreroId(name),
      name,
      quantity
    });
  });

  return [...registry.values()];
}

function clonePotreroEntries(entries = []) {
  return normalizePotreroEntries(entries).map((entry) => ({
    id: entry.id || createPotreroId(entry.name),
    name: String(entry.name || "").trim(),
    quantity: normalizePotreroQuantity(entry.quantity)
  }));
}

function clearGeorefDraft() {
  runtime.georefDraft = null;
}

function ensureGeorefDraft(farm, forceReset = false) {
  if (farm?.id !== "arapey") {
    clearGeorefDraft();
    return [];
  }

  if (forceReset || !runtime.georefDraft || runtime.georefDraft.farmId !== farm.id) {
    const potreiros = clonePotreroEntries(getPotreroEntries(farm));
    runtime.georefDraft = {
      farmId: farm.id,
      potreiros,
      selectedId: potreiros[0]?.id || ""
    };
  }

  if (!runtime.georefDraft.selectedId && runtime.georefDraft.potreiros.length) {
    runtime.georefDraft.selectedId = runtime.georefDraft.potreiros[0].id;
  }

  return runtime.georefDraft.potreiros;
}

function getGeorefDraftPotreiros(farm) {
  return ensureGeorefDraft(farm);
}

function pruneLegacyPotreiros(farm) {
  const referencedPotreiros = new Set(farm.sanitaryRecords.map((record) => normalizeText(record.potreiro || "")));
  farm.potreiros = getPotreroEntries(farm).filter((potrero) => {
    const isLegacyPlaceholder = LEGACY_POTREIRO_PLACEHOLDERS.includes(potrero.name);
    if (!isLegacyPlaceholder) {
      return true;
    }

    return normalizePotreroQuantity(potrero.quantity) > 0 || referencedPotreiros.has(normalizeText(potrero.name));
  });
}

function getRegisteredPotreroAnimals(farm) {
  return getPotreroEntries(farm).reduce((sum, potrero) => sum + normalizePotreroQuantity(potrero.quantity), 0);
}

function getPotreroBalance(farm) {
  return getFarmTotal(farm) - getRegisteredPotreroAnimals(farm);
}

function getMonthlyRecords(farm) {
  return Array.isArray(farm?.monthlyRecords) ?farm.monthlyRecords : [];
}

function getMonthlyCategoryLabel(value) {
  return MONTHLY_REPORT_CATEGORIES.find((category) => category.value === value)?.label || "Outros";
}

function getFilteredMonthlyRecords(farm, year = state.filters.year, month = state.filters.month) {
  return getMonthlyRecords(farm).filter((record) => {
    const period = String(record.period || "");
    const recordYear = period.slice(0, 4);
    const recordMonth = period.slice(5, 7);
    const matchesYear = recordYear === String(year);
    const matchesMonth = month === "all" || recordMonth === month;
    return matchesYear && matchesMonth;
  });
}

function getMonthlySummary(farm, year = state.filters.year, month = state.filters.month) {
  const records = getFilteredMonthlyRecords(farm, year, month);
  const byCategory = new Map();

  records.forEach((record) => {
    const key = record.category || "outros";
    const existing = byCategory.get(key) || { category: key, label: getMonthlyCategoryLabel(key), count: 0, quantity: 0, value: 0 };
    existing.count += 1;
    existing.quantity += Number(record.quantity || 0);
    existing.value += Number(record.value || 0);
    byCategory.set(key, existing);
  });

  return {
    records,
    count: records.length,
    totalQuantity: records.reduce((sum, record) => sum + Number(record.quantity || 0), 0),
    totalValue: records.reduce((sum, record) => sum + Number(record.value || 0), 0),
    activeCategories: byCategory.size,
    byCategory: [...byCategory.values()].sort((a, b) => b.value - a.value || b.quantity - a.quantity || b.count - a.count)
  };
}

function getMonthlyEvolution(farm, year = state.filters.year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    const summary = getMonthlySummary(farm, year, month);
    return {
      label: MONTH_NAMES[index].slice(0, 3),
      quantity: summary.totalQuantity,
      value: summary.totalValue,
      count: summary.count
    };
  });
}

function hasPositiveData(values = []) {
  return values.some((value) => Number(value || 0) > 0);
}

function hasMeaningfulMonthlyData(summary) {
  return Boolean(summary?.count || summary?.totalQuantity || summary?.totalValue);
}

function getFarmTotal(farm) {
  const bovinoTotal = farm.categories.reduce((sum, category) => sum + Number(category.quantity || 0), 0);
  const ovinoTotal = Array.isArray(farm?.ovinos) 
    ? farm.ovinos.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0)
    : 0;
  return bovinoTotal + ovinoTotal;
}

function getFarmBovinoTotal(farm) {
  return farm.categories.reduce((sum, category) => sum + Number(category.quantity || 0), 0);
}

function getFarmOvinoTotal(farm) {
  return Array.isArray(farm?.ovinos)
    ? farm.ovinos.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0)
    : 0;
}

function getFarmOvinoCategories(farm) {
  const categoryMap = new Map();
  STANDARD_OVINO_CATEGORIES.forEach((category) => categoryMap.set(category.id, { id: category.id, name: category.name }));
  (Array.isArray(farm?.ovinos) ? farm.ovinos : []).forEach((entry) => {
    if (!categoryMap.has(entry.categoryId)) {
      categoryMap.set(entry.categoryId, { id: entry.categoryId, name: entry.categoryName });
    }
  });
  return [...categoryMap.values()];
}

function findOrCreateOvinoEntry(farm, categoryId, categoryName) {
  if (!Array.isArray(farm.ovinos)) farm.ovinos = [];
  let entry = farm.ovinos.find((item) => item.categoryId === categoryId);
  if (!entry) {
    entry = { id: `ovino-${farm.id}-${categoryId}-${Date.now()}`, categoryId, categoryName, breedType: "", breedOther: "", quantity: 0 };
    farm.ovinos.push(entry);
  }
  return entry;
}

function validateStockExit(quantity, available, label = "estoque disponível") {
  if (quantity > available) {
    return `Quantidade maior que o ${label} (${formatInteger(available)} cabeças).`;
  }
  return null;
}

function getDominantCategory(farm) {
  return [...farm.categories].sort((a, b) => b.quantity - a.quantity)[0];
}

function getDiscrepancy(farm) {
  return Number(farm.declaredTotal || 0) - getFarmTotal(farm);
}

function getPreferredYearForFarm(farm) {
  const years = [...getAvailableYearsForFarm(farm)];

  return years.length ?Math.max(...years) : today.getFullYear();
}

function getAvailableYearsForFarm(farm) {
  return new Set([
    ...farm.movements.map((movement) => new Date(movement.date).getFullYear()),
    ...farm.sanitaryRecords.map((record) => new Date(record.date).getFullYear()),
    ...farm.monthlyRecords.map((record) => Number(String(record.period || "").slice(0, 4)))
  ].filter((year) => Number.isFinite(year)));
}

function syncFilterYearForFarm(farm, force = false) {
  if (!farm) {
    return;
  }

  const years = getAvailableYearsForFarm(farm);
  if (force || (state.filters.year !== "all" && !years.has(Number(state.filters.year)))) {
    state.filters.year = String(getPreferredYearForFarm(farm));
  }
}

function isPremiumSaleFarm(farm) {
  return !!farm && PREMIUM_SALE_FARMS.has(farm.id);
}

function getFarmCurrency(farmId) {
  return FARM_CURRENCY_MAP[farmId] || "BRL";
}

function getFarmCurrencySymbol(farmId) {
  return getFarmCurrency(farmId) === "USD" ?"US$" : "R$";
}

function formatFarmCurrencyValue(value, farmId) {
  const num = Number(value || 0);
  if (getFarmCurrency(farmId) === "USD") {
    return `US$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}`;
  }
  return formatCurrency(num);
}

function createStandardFarm(id, name) {
  return {
    id,
    name,
    declaredTotal: 0,
    note: "Estrutura pronta para receber o inventario inicial e futuras mudancas de manejo.",
    importedBaselineVersion: 0,
    sanitaryProducts: [...DEFAULT_SANITARY_PRODUCTS],
    potreiros: normalizePotreroEntries([], DEFAULT_POTREIROS),
    categories: STANDARD_FARM_CATEGORIES.map((category) => ({
      ...category,
      quantity: 0
    })),
    movements: [],
    sanitaryRecords: [],
    monthlyRecords: [],
    reproductionRecords: [],
    reproductionCodeSequence: 0
  };
}

function bindEvents() {
  configureMobileAppLinks();
  elements.loginForm.addEventListener("submit", handleLoginSubmit);
  elements.loginRoleTabs.forEach((button) => {
    button.addEventListener("click", () => setAuthLoginMode(button.dataset.authRole));
  });
  document.getElementById("toggleLoginPw")?.addEventListener("click", function () {
    const input = document.getElementById("loginPassword");
    const wrap = input.closest(".pw-wrap");
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    wrap.classList.toggle("is-visible", !showing);
    this.setAttribute("aria-label", showing ? "Mostrar senha" : "Ocultar senha");
  });
  elements.emergencyRestoreBtn?.addEventListener("click", () => elements.emergencyRestoreInput?.click());
  elements.emergencyRestoreInput?.addEventListener("change", handleEmergencyRestore);
  elements.mobileAppButton?.addEventListener("click", openMobileAppDialog);
  elements.mobileAppQuickButton?.addEventListener("click", openMobileAppDialog);
  elements.mobileDrawerAppButton?.addEventListener("click", openMobileAppDialog);
  elements.mobileFarmQuickButton?.addEventListener("click", openMobileFarmDrawer);
  elements.closeMobileAppDialog?.addEventListener("click", () => elements.mobileAppDialog.close());
  elements.manageUsersButton.addEventListener("click", openManageUsersDialog);
  elements.backupButton.addEventListener("click", exportBackup);
  elements.restoreButton.addEventListener("click", () => elements.restoreFileInput.click());
  elements.restoreFileInput.addEventListener("change", handleRestoreFile);
  elements.backupWarningDoNow.addEventListener("click", () => { elements.backupWarningDialog.close(); exportBackup(); });
  elements.backupWarningDismiss.addEventListener("click", () => elements.backupWarningDialog.close());
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.syncRetryButton?.addEventListener("click", handleSyncRetry);
  elements.splashShell.addEventListener("click", dismissSplash);
  elements.manageUsersForm.addEventListener("submit", handleManageUsersSubmit);
  elements.auditTrailButton?.addEventListener("click", openAuditTrailDialog);
  elements.closeAuditTrailDialog?.addEventListener("click", () => elements.auditTrailDialog.close());
  document.getElementById("exportAuditPdfBtn")?.addEventListener("click", exportAuditTrailPdf);
  elements.auditTrailSearch?.addEventListener("input", (event) => {
    runtime.auditSearch = event.target.value;
    runtime.auditPage = 0;
    renderAuditTrailDialog();
  });
  elements.userList.addEventListener("click", handleUserListInteraction);
  elements.saveUserEditsButton.addEventListener("click", handleUserEditSave);
  elements.cancelUserEditButton.addEventListener("click", closeUserEditor);
  elements.closeManageUsersDialog.addEventListener("click", () => elements.manageUsersDialog.close());
  document.getElementById("myAccountBtn")?.addEventListener("click", openChangeMyPasswordDialog);
  document.getElementById("changeMyPasswordForm")?.addEventListener("submit", handleChangeMyPasswordSubmit);
  document.getElementById("closeChangeMyPasswordDlg")?.addEventListener("click", () => {
    document.getElementById("changeMyPasswordDlg").close();
  });
  elements.sanitaryShortcut.addEventListener("click", () => {
    resetSanitaryTableFilters();
    runtime.sanitaryPage = 0;
    runtime.sanitarySearch = "";
    state.activeView = "sanitary";
    render();
  });

  elements.comprasShortcut?.addEventListener("click", () => {
    state.activeView = "compras";
    runtime.comprasPage = 0;
    render();
  });

  elements.quickVendasBtn?.addEventListener("click", () => {
    state.activeView = "vendas";
    render();
  });

  document.getElementById("exportSanitaryPdfBtn")?.addEventListener("click", exportSanitaryPdfReport);
  document.getElementById("exportSanitaryPdfMainBtn")?.addEventListener("click", exportSanitaryPdfReport);
  document.getElementById("exportRepPdfMainBtn")?.addEventListener("click", exportReproducaoPdf);

  elements.potreirosShortcut.addEventListener("click", () => {
    state.activeView = "potreiros";
    render();
  });

  elements.reproducaoShortcut.addEventListener("click", () => {
    state.activeView = "reproducao";
    render();
  });

  // Compras view
  elements.comprasNovaBtn?.addEventListener("click", () => openMovementDialog("compra"));
  elements.exportComprasPdfBtn?.addEventListener("click", exportComprasPdfReport);

  // Vendas view
  elements.vendasShortcut?.addEventListener("click", () => {
    state.activeView = "vendas";
    runtime.vendasPage = 0;
    render();
  });
  elements.vendasNovaBtn?.addEventListener("click", () => openMovementDialog("venda"));
  elements.exportVendasPdfBtn?.addEventListener("click", exportVendasPdfReport);
  elements.vendasHistorySearch?.addEventListener("input", () => { runtime.vendasPage = 0; renderVendasTable(); });
  elements.vendasFilterFarm?.addEventListener("change", () => { runtime.vendasPage = 0; renderVendasKpiCards(); renderVendasCharts(); renderVendasTable(); });
  elements.vendasFilterDateFrom?.addEventListener("change", () => { runtime.vendasPage = 0; renderVendasKpiCards(); renderVendasCharts(); renderVendasTable(); });
  elements.vendasFilterDateTo?.addEventListener("change", () => { runtime.vendasPage = 0; renderVendasKpiCards(); renderVendasCharts(); renderVendasTable(); });
  elements.vendasFilterCategory?.addEventListener("change", () => { runtime.vendasPage = 0; renderVendasKpiCards(); renderVendasCharts(); renderVendasTable(); });
  elements.clearVendasFiltersBtn?.addEventListener("click", () => {
    if (elements.vendasHistorySearch) elements.vendasHistorySearch.value = "";
    if (elements.vendasFilterFarm) elements.vendasFilterFarm.value = "";
    if (elements.vendasFilterDateFrom) elements.vendasFilterDateFrom.value = "";
    if (elements.vendasFilterDateTo) elements.vendasFilterDateTo.value = "";
    if (elements.vendasFilterCategory) elements.vendasFilterCategory.value = "";
    runtime.vendasPage = 0;
    renderVendasKpiCards();
    renderVendasCharts();
    renderVendasTable();
  });
  elements.comprasHistorySearch?.addEventListener("input", () => { runtime.comprasPage = 0; renderComprasTable(); });
  elements.comprasFilterFarm?.addEventListener("change", () => { runtime.comprasPage = 0; renderComprasKpiCards(); renderComprasCharts(); renderComprasTable(); });
  elements.comprasFilterDateFrom?.addEventListener("change", () => { runtime.comprasPage = 0; renderComprasKpiCards(); renderComprasCharts(); renderComprasTable(); });
  elements.comprasFilterDateTo?.addEventListener("change", () => { runtime.comprasPage = 0; renderComprasKpiCards(); renderComprasCharts(); renderComprasTable(); });
  elements.comprasFilterCategory?.addEventListener("change", () => { runtime.comprasPage = 0; renderComprasKpiCards(); renderComprasCharts(); renderComprasTable(); });
  elements.clearComprasFiltersBtn?.addEventListener("click", () => {
    if (elements.comprasHistorySearch) elements.comprasHistorySearch.value = "";
    if (elements.comprasFilterFarm) elements.comprasFilterFarm.value = "";
    if (elements.comprasFilterDateFrom) elements.comprasFilterDateFrom.value = "";
    if (elements.comprasFilterDateTo) elements.comprasFilterDateTo.value = "";
    if (elements.comprasFilterCategory) elements.comprasFilterCategory.value = "";
    runtime.comprasPage = 0;
    renderComprasKpiCards();
    renderComprasCharts();
    renderComprasTable();
  });

  // Reproduction dialogs
  document.getElementById("closeRepDlg")?.addEventListener("click", () => elements.reproducaoDlg.close());
  document.getElementById("closeRepVerifDlg")?.addEventListener("click", () => elements.repVerifDlg.close());
  document.getElementById("repRegisterBtn")?.addEventListener("click", () => openRepDialog());
  document.getElementById("exportRepPdfBtn")?.addEventListener("click", exportReproducaoPdf);
  document.getElementById("repFormSubmit")?.addEventListener("click", handleRepFormSubmitFixed);
  document.getElementById("repVerifSubmit")?.addEventListener("click", handleRepVerifSubmit);
  document.getElementById("repType")?.addEventListener("change", syncRepTypeFields);
  document.getElementById("repFarm")?.addEventListener("change", syncRepFarmFields);
  document.getElementById("repCategory")?.addEventListener("change", syncRepStockHint);
  document.getElementById("repVerifPegou")?.addEventListener("input", updateRepVerifFalhou);
  elements.repHistorySearch?.addEventListener("input", () => {
    runtime.repPage = 0;
    renderRepHistoryTable();
  });

  // Mobile bottom nav
  if (elements.mobileNavDashboard) {
    elements.mobileNavDashboard.addEventListener("click", () => {
      state.activeView = "home";
      render();
    });
    elements.mobileNavSanitary.addEventListener("click", () => {
      resetSanitaryTableFilters();
      runtime.sanitaryPage = 0;
      runtime.sanitarySearch = "";
      state.activeView = "sanitary";
      render();
    });
    elements.mobileNavPotreiros.addEventListener("click", () => {
      state.activeView = "potreiros";
      render();
    });
    elements.mobileNavReproducao?.addEventListener("click", () => {
      state.activeView = "reproducao";
      render();
    });
    elements.mobileNavFarms.addEventListener("click", openMobileFarmDrawer);
    elements.closeMobileFarmDrawer.addEventListener("click", () => {
      elements.mobileFarmDrawer.hidden = true;
    });
    elements.mobileFarmDrawer.addEventListener("click", (event) => {
      if (event.target === elements.mobileFarmDrawer) {
        elements.mobileFarmDrawer.hidden = true;
      }
    });
  }

  elements.potreirosAccordion.addEventListener("click", (event) => {
    // Check if it's a manejo button — handle separately, don't bubble to accordion
    const manBtn = event.target.closest("[data-potr-manej-farm]");
    if (manBtn) {
      openPotrManejDialog(manBtn.dataset.potrManejFarm, manBtn.dataset.potrManejId);
      return;
    }
    const header = event.target.closest("[data-toggle-farm]");
    if (!header) return;
    const farmId = header.dataset.toggleFarm;
    const body = document.getElementById(`potreiros-body-${farmId}`);
    if (!body) return;
    body.hidden = !body.hidden;
    header.classList.toggle("open", !body.hidden);
  });

  elements.yearFilter.addEventListener("change", (event) => {
    state.filters.year = event.target.value;
    render();
  });

  elements.monthFilter.addEventListener("change", (event) => {
    state.filters.month = event.target.value;
    render();
  });

  elements.especieFilter?.addEventListener("change", (event) => {
    state.filters.especie = event.target.value;
    render();
  });

  elements.movementFarm.addEventListener("change", () => {
    syncMovementCategoryOptionsForFarm(getMovementDialogFarm());
    syncMovementPotreirosOptions();
    updateSaleFieldVisibility();
    updateMovementCategoryTotal();
  });
  elements.movementCategory.addEventListener("change", () => {
    syncMovementPotreirosOptions();
    updateMovementCategoryTotal();
  });

  elements.movementSpecies?.addEventListener("change", () => {
    syncMovementCategoryOptionsForFarm(getMovementDialogFarm());
    updateMovementFormForType(elements.movementType.value);
  });

  elements.movementType.addEventListener("change", () => {
    updateMovementFormForType(elements.movementType.value);
  });
  elements.movementPhotos.addEventListener("change", handleMovementPhotosChange);
  elements.movementPhotoPreview.addEventListener("click", handleMovementPhotoPreviewClick);

  elements.movementSaleMode.addEventListener("change", updateSaleFieldVisibility);
  [
    elements.movementLivePrice,
    elements.movementLiveKg,
    elements.movementCarcassPrice,
    elements.movementCarcassKg
  ].forEach((input) => {
    input.addEventListener("input", updateSaleComputedValue);
  });

  // Purchase auto-calc listeners
  [elements.movPurchaseAvgWeight, elements.movPurchasePricePerKg].forEach((input) => {
    input?.addEventListener("input", updatePurchaseComputedValues);
  });
  elements.movPurchaseTotalWeight?.addEventListener("input", () => {
    elements.movPurchaseTotalWeight.dataset.manualEdit = "1";
    updatePurchaseComputedValues();
  });
  elements.movementQuantity?.addEventListener("input", () => {
    updatePurchaseComputedValues();
    updateSaleComputedValue();
  });
  elements.movementValue?.addEventListener("input", () => {
    if (elements.movementType.value === "compra") {
      updatePurchaseComputedValues();
    }
    refreshMovementValueHint();
    updateUsdBrlEquiv();
  });
  elements.movUsdRate?.addEventListener("input", () => {
    if (elements.movUsdRate) elements.movUsdRate.dataset.userTyped = "1";
    updateUsdBrlEquiv();
  });
  elements.movementFarm?.addEventListener("change", syncUsdRateVisibility);
  elements.movementType?.addEventListener("change", syncUsdRateVisibility);

  elements.sanitaryProduct.addEventListener("change", () => {
    updateSanitaryProductMode();
  });

  elements.sanitaryFarm?.addEventListener("change", () => {
    if (!elements.sanitaryFarm.value || !state.data.farms[elements.sanitaryFarm.value]) {
      return;
    }
    state.data.selectedFarmId = elements.sanitaryFarm.value;
    saveData();
    syncSanitaryFormOptions();
    renderSanitaryFarmSwitch();
    renderSanitaryComposerState(getFarm());
  });

  elements.sanitaryPotrero?.addEventListener("change", () => {
    updateSanitaryPotreroMode();
  });

  elements.sanitarySpecies?.addEventListener("change", () => {
    syncSanitaryFormOptions();
  });

  elements.sanitaryTableBody.addEventListener("click", (event) => {
    const editTrigger = event.target.closest("[data-edit-sanitary-id]");
    if (editTrigger) {
      openSanitaryEditor(editTrigger.dataset.editSanitaryId);
      return;
    }
    const deleteTrigger = event.target.closest("[data-delete-sanitary-id]");
    if (deleteTrigger) {
      deleteSanitaryRecord(deleteTrigger.dataset.deleteSanitaryId);
    }
  });
  elements.openSanitaryDialogButton?.addEventListener("click", () => openSanitaryDialog());
  elements.closeSanitaryDialog?.addEventListener("click", () => closeSanitaryDialog());
  elements.sanitaryDialog?.addEventListener("close", () => resetSanitaryForm());

  // Gold register button — toggle menu
  elements.registerGoldBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !elements.registerMenu.hidden;
    elements.registerMenu.hidden = isOpen;
    elements.registerGoldBtn.setAttribute("aria-expanded", String(!isOpen));
  });

  // Register menu items
  document.getElementById("registerMenu").querySelectorAll("[data-mov]").forEach((btn) => {
    btn.addEventListener("click", () => {
      elements.registerMenu.hidden = true;
      elements.registerGoldBtn.setAttribute("aria-expanded", "false");
      handleRegisterAction(btn.dataset.mov);
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!document.getElementById("registerLauncher").contains(e.target)) {
      elements.registerMenu.hidden = true;
      elements.registerGoldBtn.setAttribute("aria-expanded", "false");
    }
  });

  // Visual herd grid — click card to open records dialog for that type
  elements.visualHerdGrid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-mov]");
    if (!card) return;
    openMovTypeRecordsDlg(card.dataset.mov);
  });
  elements.visualHerdGrid.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest("[data-mov]");
      if (!card) return;
      e.preventDefault();
      openMovTypeRecordsDlg(card.dataset.mov);
    }
  });

  elements.editStockButton.addEventListener("click", openEditStockDialog);
  elements.georefButton.addEventListener("click", openGeorefDialog);
  elements.closeEditStockDialog.addEventListener("click", () => elements.editStockDialog.close());
  document.getElementById("cancelStockEditBtn").addEventListener("click", () => elements.editStockDialog.close());
  document.getElementById("saveStockEditBtn").addEventListener("click", handleSaveStockEdit);
  document.getElementById("stockCategoryAccordion").addEventListener("click", handleStockCategoryAccordionClick);
  document.getElementById("stockPotreirosAccordion").addEventListener("click", handleStockPotreirosAccordionClick);
  document.querySelectorAll(".stock-tab").forEach((btn) => {
    btn.addEventListener("click", () => setStockEditorTab(btn.dataset.stockTab));
  });
  if (elements.monthlyProtocolList) {
    elements.monthlyProtocolList.addEventListener("click", handleMonthlyTableInteraction);
  }
  elements.closeMovementDialog.addEventListener("click", () => {
    runtime.editingMovement = null;
    elements.movementType.classList.remove("select-locked");
    if (elements.movementCategory) elements.movementCategory.classList.remove("select-locked");
    const catHintWrap = document.getElementById("movCategoryTotalWrap");
    if (catHintWrap) catHintWrap.hidden = true;
    elements.movementDialog.close();
  });
  elements.closeMovTypeRecordsDlg.addEventListener("click", () => elements.movTypeRecordsDlg.close());
  elements.maximizeMovTypeRecordsDlg?.addEventListener("click", toggleMovTypeRecordsMaximize);
  elements.movementDialog.addEventListener("close", () => {
    if (!runtime.returnToMovTypeRecords) return;
    const context = runtime.returnToMovTypeRecords;
    runtime.returnToMovTypeRecords = null;
    window.requestAnimationFrame(() => openMovTypeRecordsDlg(context.movType, context));
  });
  elements.movTypeRecordsDlg.addEventListener("close", () => {
    setMovTypeRecordsMaximized(false);
    if (!runtime.pendingMovementDialogType) return;
    const nextType = runtime.pendingMovementDialogType;
    runtime.pendingMovementDialogType = "";
    window.requestAnimationFrame(() => openMovementDialog(nextType));
  });
  elements.closePotrManejDlg.addEventListener("click", () => elements.potrManejoDlg.close());
  elements.potrActionTabs?.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-manej]");
    if (!tab) return;
    const type = tab.dataset.manej;
    runtime.potrManej.type = type;
    elements.potrActionTabs.querySelectorAll(".potr-action-tab").forEach((t) => t.classList.toggle("active", t.dataset.manej === type));
    syncPotrManejForm();
  });
  elements.potrManejDestFarm.addEventListener("change", syncPotrManejDestFarmPotreiros);
  elements.potrManejForm.addEventListener("submit", handlePotrManejSubmit);
  elements.potrManejPhotos?.addEventListener("change", handlePotrManejPhotosChange);
  elements.closeCategoryDialog.addEventListener("click", () => elements.categoryDialog.close());
  elements.categoryFarm.addEventListener("change", syncCategoryPotreirosOptions);
  elements.categorySpecies?.addEventListener("change", updateCategoryPotreiroVisibility);
  elements.closeEditStockDialog.addEventListener("click", () => elements.editStockDialog.close());
  elements.georefSaveButton.addEventListener("click", handleGeorefSave);
  elements.georefLegend.addEventListener("click", handleGeorefLegendInteraction);
  elements.georefLegend.addEventListener("change", handleGeorefLegendChange);
  elements.closeGeorefDialog.addEventListener("click", () => elements.georefDialog.close());
  elements.georefDialog.addEventListener("close", clearGeorefDraft);
  elements.closeMonthlyDataDialog.addEventListener("click", () => elements.monthlyDataDialog.close());
  elements.exportPdfButton.addEventListener("click", openPdfOptionsDialog);
  elements.closePdfOptionsDialog.addEventListener("click", () => elements.pdfOptionsDialog.close());
  elements.pdfOptionsForm.addEventListener("submit", handlePdfOptionsSubmit);
  elements.pdfOptionsForm.querySelectorAll('input[name="pdfScope"]').forEach((input) => {
    input.addEventListener("change", updatePdfScopeMode);
  });

  elements.movementForm.addEventListener("submit", handleMovementSubmit);
  elements.categoryForm.addEventListener("submit", handleCategorySubmit);
  elements.sanitaryForm.addEventListener("submit", handleSanitarySubmit);
  // editStockForm replaced by button-driven stock editor
  elements.monthlyDataForm.addEventListener("submit", handleMonthlyDataSubmit);
}

function populateMonthFilter() {
  elements.monthFilter.innerHTML = '<option value="all">Ano inteiro</option>';
  MONTH_NAMES.forEach((name, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1).padStart(2, "0");
    option.textContent = name;
    elements.monthFilter.appendChild(option);
  });
}

function populateYearFilter() {
  const years = new Set([today.getFullYear()]);
  Object.values(state.data.farms).forEach((farm) => {
    farm.movements.forEach((movement) => {
      const y = new Date(movement.date).getFullYear();
      if (Number.isFinite(y)) years.add(y);
    });
    farm.sanitaryRecords.forEach((record) => {
      const y = new Date(record.date).getFullYear();
      if (Number.isFinite(y)) years.add(y);
    });
    farm.monthlyRecords.forEach((record) => {
      const year = Number(String(record.period || "").slice(0, 4));
      if (Number.isFinite(year)) {
        years.add(year);
      }
    });
  });

  elements.yearFilter.innerHTML = "";
  const todosOpt = document.createElement("option");
  todosOpt.value = "all";
  todosOpt.textContent = "Todos";
  if (state.filters.year === "all") todosOpt.selected = true;
  elements.yearFilter.appendChild(todosOpt);
  [...years].sort((a, b) => a - b).forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    if (String(year) === state.filters.year) {
      option.selected = true;
    }
    elements.yearFilter.appendChild(option);
  });
}

function populatePdfPeriodFilters() {
  elements.pdfYearFilter.innerHTML = elements.yearFilter.innerHTML;
  [...elements.pdfYearFilter.options].forEach((option) => {
    option.selected = option.value === String(state.filters.year);
  });

  elements.pdfMonthFilter.innerHTML = elements.monthFilter.innerHTML;
  [...elements.pdfMonthFilter.options].forEach((option) => {
    option.selected = option.value === state.filters.month;
  });
}

function render() {
  if (!isAuthenticated()) {
    return;
  }

  const farm = getFarm();

  // Funções de dashboard — isoladas para não bloquear a navegação de abas
  try {
    syncFilterYearForFarm(farm);
    populateYearFilter();
    populatePdfPeriodFilters();
    renderFarmSwitch();
    renderOverviewPanel();
    syncMovementTypeOptions();
    syncCategoryOptions();
    syncSanitaryFormOptions();
    syncMonthlyDataFarmOptions();
    syncMonthlyDataCategoryOptions();
    renderHero(farm);
    renderHeadlineMetrics(farm);
    renderOpsPanel(farm);
    renderPrimarySummaryCards(farm);
    renderDashboardSectionCards(farm);
    renderDashboardVisualHerdGrid(farm);
    renderPeriodSummary(farm);
    renderSalesAnalysis(farm);
    renderMovementsTable(farm);
    renderSanitarySummary(farm);
    try { renderSanitaryFarmBreakdown(); } catch(e) { console.warn("[sanBreakdown]", e); }
    renderSanitaryTable(farm);
    renderSanitaryFarmSwitch();
    renderSanitaryComposerState(farm);
    renderMonthlySummary(farm);
    renderMonthlyProtocol(farm);
    renderCharts(farm);
  } catch (err) {
    console.warn("[render] erro em função de dashboard:", err);
  }

  // Navegação de abas sempre executa — independente de erros acima
  renderActiveView();

  try {
    renderGeorefState(farm);
    renderActionButtonsState();
  } catch (err) {
    console.warn("[render] erro pós-view:", err);
  }
}

function renderOverviewPanel() {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ?getAllFarms() : [state.data.farms[state.data.selectedFarmId]].filter(Boolean);
  const selectedFarm = farms[0];
  const totals = farms.reduce((accumulator, farm) => {
    accumulator.stock += getFarmTotal(farm);
    accumulator.declared += Number(farm.declaredTotal || 0);
    accumulator.potreiros += getPotreroEntries(farm).length;
    accumulator.potreroAnimals += getRegisteredPotreroAnimals(farm);
    accumulator.sanitary += getFilteredSanitaryRecords(farm).length;
    return accumulator;
  }, { stock: 0, declared: 0, potreiros: 0, potreroAnimals: 0, sanitary: 0 });
  const movementTotals = farms.reduce((accumulator, farm) => {
    const monthly = summarizePeriod(farm, state.filters.year, state.filters.month);
    const sales = summarizeSalePeriod(farm, state.filters.year, state.filters.month);
    const purchases = summarizePurchasePeriod(farm, state.filters.year, state.filters.month);
    accumulator.entries += monthly.byType.compra + monthly.byType.nascimento + monthly.adjustPositive;
    accumulator.exits += monthly.byType.venda + monthly.byType.consumo + monthly.byType.morte + monthly.adjustNegative;
    accumulator.saldo += monthly.saldo;
    accumulator.salesValue += sales.totalValue;
    accumulator.purchaseValue += purchases.totalValue;
    accumulator.saleAnimals += sales.movements.reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
    accumulator.purchaseAnimals += purchases.totalAnimals;
    return accumulator;
  }, { entries: 0, exits: 0, saldo: 0, salesValue: 0, purchaseValue: 0, saleAnimals: 0, purchaseAnimals: 0 });
  const repRecords = farms.flatMap((farm) => getReproductionRecords(farm));
  const repStats = calcReproductionStats(repRecords);
  const pendingRep = repRecords.filter((record) => !record.verificationDate).length;

  elements.globalPanelKicker.textContent = isTotalView ?"Operação consolidada" : "Operação da fazenda";
  elements.globalPanelTitle.textContent = isTotalView ?"Manejo total das fazendas" : `Manejo de ${selectedFarm?.name || "fazenda"}`;
  elements.globalPanelChip.textContent = isTotalView ?"Grupo Da Bruna" : selectedFarm?.name || "Fazenda";

  const cards = [
    {
      title: "Manejo / estoque",
      value: formatInteger(totals.stock),
      detail: `${formatInteger(totals.potreiros)} campos | ${formatInteger(totals.potreroAnimals)} cabeças alocadas`
    },
    {
      title: "Receita de Vendas",
      value: formatCurrency(movementTotals.salesValue),
      detail: `${formatInteger(movementTotals.saleAnimals)} animais vendidos no período`
    },
    {
      title: "Sanitário",
      value: formatInteger(totals.sanitary),
      detail: "registros no período filtrado"
    },
    {
      title: "Reprodução",
      value: repStats.taxaSucesso != null ?`${repStats.taxaSucesso.toFixed(1)}%` : "-",
      detail: `${formatInteger(repStats.totalPegou)} prenhas | ${formatInteger(pendingRep)} pendentes`
    }
  ];

  elements.globalSummaryGrid.innerHTML = cards.map((card) => `
    <article class="summary-card ops-card">
      <p class="panel-kicker">${card.title}</p>
      <strong>${card.value}</strong>
      <p>${card.detail}</p>
    </article>
  `).join("");

  elements.globalFarmBreakdown.innerHTML = farms.map((farm) => {
    const movements = summarizePeriod(farm, state.filters.year, state.filters.month);
    const sales = summarizeSalePeriod(farm, state.filters.year, state.filters.month);
    const purchases = summarizePurchasePeriod(farm, state.filters.year, state.filters.month);
    const balance = sales.totalValue - purchases.totalValue;
    const total = getFarmTotal(farm);
    const bovinoTotal = getFarmBovinoTotal(farm);
    const ovinoTotal = getFarmOvinoTotal(farm);
    return `
      <article class="global-farm-card ops-farm-card">
        <div class="farm-card-header">
          <div>
            <p class="panel-kicker">${escapeHtml(farm.name)}</p>
            <strong class="farm-card-total">${formatInteger(total)}</strong>
            <span class="farm-card-species">🐄 ${formatInteger(bovinoTotal)} · 🐑 ${formatInteger(ovinoTotal)}</span>
          </div>
          <div class="farm-card-chips">
            <span class="chip chip-entry">+${formatInteger(movements.byType.compra + movements.byType.nascimento)} ent.</span>
            <span class="chip chip-exit">-${formatInteger(movements.byType.venda + movements.byType.morte + movements.byType.consumo)} saí.</span>
          </div>
        </div>
        <div class="ops-farm-metrics">
          <span>Venda<strong>${formatCurrency(sales.totalValue)}</strong></span>
          <span>Compra<strong>${formatCurrency(purchases.totalValue)}</strong></span>
          <span>Saldo<strong>${formatCurrency(balance)}</strong></span>
          <span>Campos<strong>${formatInteger(getPotreroTotals(farm).totalPotreiros || 0)}</strong></span>
        </div>
      </article>
    `;
  }).join("");

  renderConsolidatedCategories(farms, isTotalView);
  renderFinancialPanel(farms, isTotalView);
}

function renderConsolidatedCategories(farms, isTotalView) {
  if (!elements.globalCategoryBreakdown) return;
  elements.globalCategoryBreakdown.hidden = !isTotalView || state.filters.especie === "ovino";
  if (!isTotalView || state.filters.especie === "ovino") return;

  const categoryMap = new Map();
  farms.forEach((farm) => {
    farm.categories.forEach((cat) => {
      const key = cat.name.trim().toLowerCase();
      const existing = categoryMap.get(key);
      if (existing) {
        existing.quantity += Number(cat.quantity || 0);
        existing.farms.add(farm.name);
      } else {
        categoryMap.set(key, { name: cat.name, quantity: Number(cat.quantity || 0), farms: new Set([farm.name]) });
      }
    });
  });

  const sorted = [...categoryMap.values()].filter((c) => c.quantity > 0).sort((a, b) => b.quantity - a.quantity);
  const grandTotal = sorted.reduce((s, c) => s + c.quantity, 0);

  if (!sorted.length) {
    elements.globalCategoryBreakdown.innerHTML = `<p class="field-note" style="padding:12px 0">Nenhuma categoria com animais no estoque.</p>`;
    return;
  }

  elements.globalCategoryBreakdown.innerHTML = `
    <div class="cat-collapse-card">
      <div class="cat-collapse-header">
        <div class="cat-collapse-info">
          <p class="panel-kicker">Estoque por categoria</p>
          <h3>Consolidado do rebanho — todas as fazendas</h3>
        </div>
        <span class="chip">${formatInteger(grandTotal)} animais</span>
        <button class="cat-expand-btn" type="button" aria-expanded="false">Expandir</button>
      </div>
      <div class="cat-collapse-body" hidden>
        <div class="consolidated-categories-table">
          <div class="cat-table-head">
            <span>Categoria</span>
            <span>Fazendas</span>
            <span>Animais</span>
            <span>% do rebanho</span>
          </div>
          ${sorted.map((cat) => {
            const pct = grandTotal > 0 ?(cat.quantity / grandTotal * 100) : 0;
            return `
              <div class="cat-table-row">
                <span class="cat-name">${escapeHtml(cat.name)}</span>
                <span class="cat-farms">${[...cat.farms].map(escapeHtml).join(", ")}</span>
                <strong class="cat-qty">${formatInteger(cat.quantity)}</strong>
                <span class="cat-pct">
                  <span class="cat-pct-bar" style="width:${Math.min(pct, 100).toFixed(1)}%"></span>
                  <span class="cat-pct-label">${pct.toFixed(1)}%</span>
                </span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  const btn = elements.globalCategoryBreakdown.querySelector(".cat-expand-btn");
  const body = elements.globalCategoryBreakdown.querySelector(".cat-collapse-body");
  btn.addEventListener("click", () => {
    const isOpen = !body.hidden;
    body.hidden = isOpen;
    btn.textContent = isOpen ?"Expandir" : "Recolher";
    btn.setAttribute("aria-expanded", String(!isOpen));
  });
}

function renderFinancialPanel(farms, isTotalView) {
  const container = document.getElementById("financialPanel");
  if (!container) return;
  container.innerHTML = "";
  return;

  const year = state.filters.year;
  const month = state.filters.month;

  // Per-farm financial summary
  const farmData = farms.map((farm) => {
    const movements = farm.movements.filter((m) => {
      if (m.type !== "venda" && m.type !== "compra") return false;
      const d = new Date(m.date);
      const matchYear = String(d.getFullYear()) === String(year);
      const matchMonth = month === "all" || String(d.getMonth() + 1).padStart(2, "0") === month;
      return matchYear && matchMonth;
    });
    const vendas = movements.filter((m) => m.type === "venda");
    const compras = movements.filter((m) => m.type === "compra");
    const totalVendas = vendas.reduce((s, m) => s + Number(m.value || 0), 0);
    const totalCompras = compras.reduce((s, m) => s + Number(m.value || 0), 0);
    const qtdVendas = vendas.reduce((s, m) => s + Number(m.quantity || 0), 0);
    const qtdCompras = compras.reduce((s, m) => s + Number(m.quantity || 0), 0);
    return { name: farm.name, totalVendas, totalCompras, qtdVendas, qtdCompras, saldo: totalVendas - totalCompras };
  }).filter((f) => f.totalVendas > 0 || f.totalCompras > 0);

  if (!farmData.length) {
    container.innerHTML = "";
    return;
  }

  const grandVendas = farmData.reduce((s, f) => s + f.totalVendas, 0);
  const grandCompras = farmData.reduce((s, f) => s + f.totalCompras, 0);
  const grandSaldo = grandVendas - grandCompras;
  const periodLabel = month === "all" ?`Ano ${year}` : `${MONTH_NAMES[Number(month) - 1]}/${year}`;

  const farmRows = farmData.map((f) => {
    const saldoClass = f.saldo > 0 ?"fin-positive" : f.saldo < 0 ?"fin-negative" : "";
    return `
      <div class="fin-farm-row">
        <span class="fin-farm-name">${escapeHtml(f.name)}</span>
        <span class="fin-cell">${f.qtdVendas > 0 ?`${formatInteger(f.qtdVendas)} cab` : "—"}</span>
        <span class="fin-cell fin-vendas">${f.totalVendas > 0 ?formatCurrency(f.totalVendas) : "—"}</span>
        <span class="fin-cell">${f.qtdCompras > 0 ?`${formatInteger(f.qtdCompras)} cab` : "—"}</span>
        <span class="fin-cell fin-compras">${f.totalCompras > 0 ?formatCurrency(f.totalCompras) : "—"}</span>
        <strong class="fin-cell fin-saldo ${saldoClass}">${f.saldo !== 0 ?(f.saldo > 0 ?"+" : "") + formatCurrency(f.saldo) : "—"}</strong>
      </div>
    `;
  }).join("");

  const saldoClass = grandSaldo > 0 ?"fin-positive" : grandSaldo < 0 ?"fin-negative" : "";

  container.innerHTML = `
    <div class="fin-panel-header">
      <div>
        <p class="panel-kicker">Financeiro — ${periodLabel}</p>
        <h3>Compras e vendas${isTotalView ?" por fazenda" : ""}</h3>
      </div>
      <span class="chip ${grandSaldo > 0 ?"chip-success" : grandSaldo < 0 ?"chip-alert" : ""}">
        Saldo ${grandSaldo > 0 ?"+" : ""}${formatCurrency(grandSaldo)}
      </span>
    </div>
    <div class="fin-table">
      <div class="fin-table-head">
        <span>Fazenda</span>
        <span>Cab. vendidas</span>
        <span>Receita vendas</span>
        <span>Cab. compradas</span>
        <span>Custo compras</span>
        <span>Saldo</span>
      </div>
      ${farmRows}
      ${farmData.length > 1 ?`
        <div class="fin-farm-row fin-total-row">
          <span class="fin-farm-name">Total</span>
          <span class="fin-cell">${formatInteger(farmData.reduce((s,f)=>s+f.qtdVendas,0))} cab</span>
          <span class="fin-cell fin-vendas">${formatCurrency(grandVendas)}</span>
          <span class="fin-cell">${formatInteger(farmData.reduce((s,f)=>s+f.qtdCompras,0))} cab</span>
          <span class="fin-cell fin-compras">${formatCurrency(grandCompras)}</span>
          <strong class="fin-cell fin-saldo ${saldoClass}">${grandSaldo > 0 ?"+" : ""}${formatCurrency(grandSaldo)}</strong>
        </div>
      ` : ""}
    </div>
    <p class="fin-note">* Todos os valores em R$ (reais)</p>
  `;
}

function renderHeadlineMetrics(farm) {
  const totalAnimals = getFarmTotal(farm);
  const bovinoTotal = getFarmBovinoTotal(farm);
  const ovinoTotal = getFarmOvinoTotal(farm);
  const discrepancy = getDiscrepancy(farm);
  const registeredAnimals = getRegisteredPotreroAnimals(farm);
  const metrics = [
    {
      label: state.data.selectedFarmId === TOTAL_FARM_ID ?"Grupo" : "Rebanho",
      value: formatInteger(totalAnimals),
      text: `${state.data.selectedFarmId === TOTAL_FARM_ID ?"animais consolidados no grupo" : "animais no estoque atual"}<br>🐄 Bovinos: ${formatInteger(bovinoTotal)} · 🐑 Ovinos: ${formatInteger(ovinoTotal)}`
    },
    {
      label: "Declarado",
      value: formatInteger(Number(farm.declaredTotal || 0)),
      text: discrepancy === 0 ?"total conferido com o estoque" : `${formatInteger(discrepancy)} animais de diferenca`
    },
    {
      label: "Potreiros",
      value: formatInteger(registeredAnimals),
      text: registeredAnimals === totalAnimals ?"alocação completa nos campos" : `${formatInteger(Math.abs(totalAnimals - registeredAnimals))} ainda fora dos potreiros`
    }
  ];

  elements.heroMetrics.innerHTML = metrics.map((metric) => `
    <article class="hero-metric">
      <span>${metric.label}</span>
      <strong>${metric.value}</strong>
      <p>${metric.text}</p>
    </article>
  `).join("");
}

function renderOpsPanel(farm) {
  const el = document.getElementById("opsManejoList");
  if (!el) return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ? getAllFarms() : [farm].filter(Boolean);

  const counts = { compra: 0, venda: 0, transferencia: 0, morte: 0, consumo: 0, nascimento: 0 };
  farms.forEach((f) => {
    (f.movements || []).forEach((m) => {
      const yr = (m.date || "").slice(0, 4);
      const mo = (m.date || "").slice(5, 7);
      if (state.filters.year !== "all" && yr !== String(state.filters.year)) return;
      if (state.filters.month !== "all" && mo !== String(state.filters.month).padStart(2, "0")) return;
      if (state.filters.especie !== "todas" && (m.especie || "bovino") !== state.filters.especie) return;
      if (Object.prototype.hasOwnProperty.call(counts, m.type)) {
        counts[m.type] += Number(m.quantity || 0);
      }
    });
  });

  const movRows = [
    { key: "compra",        label: "Compra",          color: "#3d8c5a" },
    { key: "nascimento",    label: "Nascimento",       color: "#4caf50" },
    { key: "venda",         label: "Venda",            color: "#c9a84c" },
    { key: "transferencia", label: "Transferência",    color: "#5b8dd9" },
    { key: "consumo",       label: "Abate / Consumo",  color: "#d4845a" },
    { key: "morte",         label: "Morte",            color: "#c0392b" },
  ];

  const maxVal = Math.max(...movRows.map((r) => counts[r.key]), 1);

  const rowsHtml = movRows.map((r) => {
    const val = counts[r.key];
    const pct = (val / maxVal * 100).toFixed(1);
    const isEmpty = val === 0;
    return `<div class="ops-row">
      <span class="ops-dot" style="background:${r.color};${isEmpty ? "opacity:.35" : ""}"></span>
      <span class="ops-label" style="${isEmpty ? "color:var(--muted)" : ""}">${r.label}</span>
      <div class="ops-bar-wrap">
        <div class="ops-bar" style="width:${pct}%;background:${r.color};opacity:${isEmpty ? 0 : .75}"></div>
      </div>
      <span class="ops-value${isEmpty ? " ops-zero" : ""}">${isEmpty ? "—" : formatInteger(val) + " cab"}</span>
    </div>`;
  }).join("");

  const repRecords = farms.flatMap((f) => (f.reproductionRecords || []).filter((r) => {
    const yr = (r.date || "").slice(0, 4);
    const mo = (r.date || "").slice(5, 7);
    if (state.filters.year !== "all" && yr !== String(state.filters.year)) return false;
    if (state.filters.month !== "all" && mo !== String(state.filters.month).padStart(2, "0")) return false;
    return true;
  }));

  function calcRate(recs) {
    const total = recs.reduce((s, r) => s + Number(r.quantity || 0), 0);
    const verified = recs.filter((r) => r.verificationDate && r.quantityPegou != null);
    const pegou = verified.reduce((s, r) => s + Number(r.quantityPegou || 0), 0);
    const verTotal = verified.reduce((s, r) => s + Number(r.quantity || 0), 0);
    const taxa = verTotal > 0 ? (pegou / verTotal) * 100 : null;
    return { total, taxa };
  }

  function pctPill(taxa) {
    if (taxa === null) return `<span class="ops-pct-pill ops-pct-wait">Aguardando</span>`;
    const cls = taxa >= 70 ? "ops-pct-good" : taxa >= 50 ? "ops-pct-mid" : "ops-pct-low";
    return `<span class="ops-pct-pill ${cls}">${taxa.toFixed(1)}% acerto</span>`;
  }

  const insem = calcRate(repRecords.filter((r) => r.type === "inseminacao"));
  const entou = calcRate(repRecords.filter((r) => r.type === "entourada"));
  const hasRep = insem.total > 0 || entou.total > 0;

  const repHtml = hasRep ? `
    <hr class="ops-rep-divider">
    ${insem.total > 0 ? `<div class="ops-rep-row">
      <div>
        <p class="ops-rep-label">Inseminação</p>
        <p class="ops-rep-sub">${formatInteger(insem.total)} animais inseminados</p>
      </div>
      ${pctPill(insem.taxa)}
    </div>` : ""}
    ${entou.total > 0 ? `<div class="ops-rep-row">
      <div>
        <p class="ops-rep-label">Entourada</p>
        <p class="ops-rep-sub">${formatInteger(entou.total)} animais entourados</p>
      </div>
      ${pctPill(entou.taxa)}
    </div>` : ""}` : "";

  el.innerHTML = rowsHtml + repHtml;
}

function renderPrimarySummaryCards(farm) {
  if (elements.summaryGrid) { elements.summaryGrid.innerHTML = ""; }
  return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const annualData = summarizePeriod(farm, state.filters.year, "all");
  const filteredData = summarizePeriod(farm, state.filters.year, state.filters.month);
  const monthlySummary = getMonthlySummary(farm);
  const cards = [
    {
      title: isTotalView ?"Fazendas ativas" : "Movimentações no ano",
      value: isTotalView ?formatInteger(getAllFarms().length) : formatInteger(annualData.totalMovements),
      detail: isTotalView ?"fazendas somadas no consolidado" : `lançamentos registrados em ${state.filters.year}`
    },
    {
      title: "Entradas no período",
      value: formatInteger(filteredData.byType.compra + filteredData.byType.nascimento + filteredData.adjustPositive),
      detail: "compras, nascimentos e ajustes positivos"
    },
    {
      title: "Saídas no período",
      value: formatInteger(filteredData.byType.venda + filteredData.byType.consumo + filteredData.byType.morte + filteredData.adjustNegative),
      detail: "vendas, consumo, mortes e ajustes negativos"
    },
    {
      title: "Saldo líquido do período",
      value: filteredData.saldo,
      detail: filteredData.saldo > 0 ?"rebanho cresceu no período filtrado" : filteredData.saldo < 0 ?"rebanho reduziu no período filtrado" : "rebanho estável no período filtrado",
      trend: filteredData.saldo > 0 ?"up" : filteredData.saldo < 0 ?"down" : "flat"
    }
  ];

  elements.summaryGrid.innerHTML = cards.map((card) => {
    const trendBadge = card.trend
      ?`<span class="trend-badge trend-${card.trend}">${card.trend === "up" ?"▲" : card.trend === "down" ?"▼" : "—"} ${formatInteger(Math.abs(card.value))}</span>`
      : "";
    const displayValue = card.trend ?formatInteger(Math.abs(card.value)) : card.value;
    return `
      <article class="summary-card${card.trend ?` summary-card-${card.trend}` : ""}">
        <p class="panel-kicker">${card.title}</p>
        <strong>${displayValue}${trendBadge}</strong>
        <p>${card.detail}</p>
      </article>
    `;
  }).join("");
}

function renderHomeView() {
  const el = elements.homeView;
  if (!el) return;

  const farm = getFarm();
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ? getAllFarms() : [farm].filter(Boolean);
  const year = state.filters.year;
  const month = state.filters.month;
  const periodLabel = year === "all" ? "histórico" : (month === "all" ? `${year}` : `${MONTH_NAMES[Number(month) - 1]}/${year}`);

  const totalAnimals = farms.reduce((s, f) => s + getFarmTotal(f), 0);
  const totalDeclared = farms.reduce((s, f) => s + Number(f.declaredTotal || 0), 0);

  // Sanitary
  const sanitaryAll = farms.flatMap((f) => f.sanitaryRecords || []);
  const recentSanitary = [...sanitaryAll].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0];

  // Reprodução
  const repFiltered = getFilteredReproductionRecords();
  const repVerified = repFiltered.filter((r) => r.verificationDate && r.quantityPegou != null);
  const repPegou = repVerified.reduce((s, r) => s + Number(r.quantityPegou || 0), 0);
  const repVerTotal = repVerified.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const taxaPrenhez = repVerTotal > 0 ? (repPegou / repVerTotal * 100).toFixed(1) : null;
  const repPendentes = repFiltered.filter((r) => !r.verificationDate).length;

  function filterByPeriod(m) {
    const d = m.date || "";
    if (year !== "all" && !d.startsWith(year)) return false;
    if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
    return true;
  }

  const purchases = farms.flatMap((f) => (f.movements || []).filter((m) => m.type === "compra" && filterByPeriod(m)));
  const purchaseHead = purchases.reduce((s, m) => s + Number(m.quantity || 0), 0);
  const purchaseValue = purchases.reduce((s, m) => s + Number(m.value || 0), 0);

  const salesMov = farms.flatMap((f) => (f.movements || []).filter((m) => m.type === "venda" && filterByPeriod(m)));
  const saleHead = salesMov.reduce((s, m) => s + Number(m.quantity || 0), 0);
  const saleValue = salesMov.reduce((s, m) => s + Number(m.value || 0), 0);

  const allPotreiros = farms.flatMap((f) => getPotreroEntries(f));
  const totalPotreiros = allPotreiros.length;
  const allocatedAnimals = farms.reduce((s, f) => s + getRegisteredPotreroAnimals(f), 0);

  const farmContext = isTotalView
    ? `Todas as Fazendas · ${farms.length} unidades`
    : `${farm.name} · ${FARM_CURRENCY_MAP[farm.id] === "USD" ? "Uruguay" : "Brasil"}`;

  const cards = [
    {
      view: "sanitary",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>`,
      accent: "#1b6e3e", bg: "#d4edda",
      title: "Manejo Sanitário",
      desc: "Vacinações, vermifugações, carrapaticidas e tratamentos por potreiro e categoria",
      metric: formatInteger(sanitaryAll.length),
      metricLabel: "registros",
      badge: recentSanitary ? `Último: ${formatDate(recentSanitary.date)}` : null,
      actions: ["Novo registro", "Ver histórico"]
    },
    {
      view: "reproducao",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
      accent: "#7c1d4f", bg: "#fce4ec",
      title: "Reprodução",
      desc: "Inseminações, entouradas, diagnósticos de gestação e taxa de prenhez",
      metric: formatInteger(repFiltered.length),
      metricLabel: `eventos em ${periodLabel}`,
      badge: taxaPrenhez != null ? `Prenhez: ${taxaPrenhez}%` : (repPendentes > 0 ? `${repPendentes} aguardando diagnóstico` : null),
      actions: ["Novo evento", "Ver reprodução"]
    },
    {
      view: "compras",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
      accent: "#0e4f6b", bg: "#cffafe",
      title: "Compras",
      desc: "Aquisições de animais por fazenda, categoria, peso médio e valor investido",
      metric: formatInteger(purchaseHead),
      metricLabel: `cabeças em ${periodLabel}`,
      badge: purchaseValue > 0 ? `Investimento: ${formatCurrency(purchaseValue)}` : null,
      actions: ["Nova compra", "Ver aquisições"]
    },
    {
      view: "vendas",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      accent: "#7a4f00", bg: "#fef3c7",
      title: "Vendas",
      desc: "Comercializações por frigorífico, kg negociado, preço/kg e receita gerada",
      metric: formatInteger(saleHead),
      metricLabel: `cabeças em ${periodLabel}`,
      badge: saleValue > 0 ? `Receita: ${formatCurrency(saleValue)}` : null,
      actions: ["Nova venda", "Ver vendas"]
    },
    {
      view: "potreiros",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 21"/><path d="M9.04 13.4a14.47 14.47 0 0 0-4.8 8.87"/><path d="M22 9c-5.08 2.45-9.3 7.2-10 13"/><path d="M22 9a15.5 15.5 0 0 0-6.47 5.74"/></svg>`,
      accent: "#134e27", bg: "#dcfce7",
      title: "Potreiros",
      desc: "Distribuição, movimentação e lotação dos animais por campo e fazenda",
      metric: formatInteger(totalPotreiros),
      metricLabel: "potreiros cadastrados",
      badge: allocatedAnimals > 0 ? `${formatInteger(allocatedAnimals)} animais alocados` : null,
      actions: ["Distribuir animais", "Ver potreiros"]
    },
    {
      view: "dashboard",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
      accent: "#1e3a5f", bg: "#dbeafe",
      title: "Estoque",
      desc: "Estoque por categoria, entradas, saídas, ajustes e histórico de movimentações",
      metric: formatInteger(totalAnimals),
      metricLabel: "animais no rebanho",
      badge: totalDeclared > 0 ? `Declarado: ${formatInteger(totalDeclared)} cabeças` : null,
      actions: ["Registrar movimentação", "Ver estoque"]
    }
  ];

  el.innerHTML = `
    <div class="home-hero">
      <div class="home-hero-copy">
        <p class="eyebrow">Fazendas Da Bruna</p>
        <h2 class="home-hero-title">Painel Pecuário</h2>
        <p class="home-hero-farm">${escapeHtml(farmContext)}</p>
      </div>
      <div class="home-hero-badge">
        <span class="home-hero-total">${formatInteger(totalAnimals)}</span>
        <span class="home-hero-unit">animais</span>
      </div>
    </div>
    <div class="home-module-grid">
      ${cards.map((card) => `
        <div class="home-module-card" data-nav-home="${escapeHtml(card.view)}" tabindex="0" role="button">
          <div class="hmc-top">
            <div class="hmc-icon" style="background:${card.bg};color:${card.accent}">${card.icon}</div>
            ${card.badge ? `<span class="hmc-badge" style="color:${card.accent};background:${card.bg}">${escapeHtml(card.badge)}</span>` : ""}
          </div>
          <div class="hmc-body">
            <h3 class="hmc-title">${escapeHtml(card.title)}</h3>
            <p class="hmc-desc">${escapeHtml(card.desc)}</p>
            <div class="hmc-metric">
              <strong class="hmc-value" style="color:${card.accent}">${escapeHtml(card.metric)}</strong>
              <span class="hmc-unit">${escapeHtml(card.metricLabel)}</span>
            </div>
          </div>
          <div class="hmc-actions">
            <button type="button" class="hmc-btn-primary" style="background:${card.accent}" data-nav-home="${escapeHtml(card.view)}">${escapeHtml(card.actions[0])}</button>
            <button type="button" class="hmc-btn-secondary" data-nav-home="${escapeHtml(card.view)}">${escapeHtml(card.actions[1])}</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  el.querySelectorAll("[data-nav-home]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const view = trigger.dataset.navHome;
      state.activeView = view;
      if (view === "compras") runtime.comprasPage = 0;
      if (view === "vendas") runtime.vendasPage = 0;
      if (view === "sanitary") {
        resetSanitaryTableFilters();
        runtime.sanitaryPage = 0;
        runtime.sanitarySearch = "";
      }
      render();
    });
  });
}

function renderDashboardSectionCards(farm) {
  const el = document.getElementById("dashboardSectionCards");
  if (!el) return;
  el.innerHTML = "";
  return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ?getAllFarms() : [farm].filter(Boolean);

  // Reprodução stats
  let repTotal = 0;
  let repPendentes = 0;
  let repLastDate = null;
  farms.forEach((f) => {
    const recs = (f.reproductionRecords || []);
    repTotal += recs.length;
    repPendentes += recs.filter((r) => !r.verificationDate).length;
    recs.forEach((r) => {
      if (!repLastDate || r.date > repLastDate) repLastDate = r.date;
    });
  });

  // Movimentações stats
  let movTotal = 0;
  let movLastDate = null;
  farms.forEach((f) => {
    const summary = summarizePeriod(f, state.filters.year, state.filters.month);
    const allMov = f.movements || [];
    const filtered = allMov.filter((m) => {
      const yr = (m.date || "").slice(0, 4);
      const mo = (m.date || "").slice(5, 7);
      if (state.filters.year !== "all" && yr !== String(state.filters.year)) return false;
      if (state.filters.month !== "all" && mo !== String(state.filters.month).padStart(2, "0")) return false;
      return true;
    });
    movTotal += filtered.length;
    filtered.forEach((r) => {
      if (!movLastDate || r.date > movLastDate) movLastDate = r.date;
    });
  });

  el.innerHTML = `
    <div class="section-module-grid">
      <article class="section-module-card section-card-reproducao" role="button" tabindex="0" data-nav-view="reproducao">
        <div class="smc-icon">🐄</div>
        <div class="smc-body">
          <p class="smc-kicker">Reprodução</p>
          <strong class="smc-value">${formatInteger(repTotal)}</strong>
          <p class="smc-detail">eventos reprodutivos</p>
          ${repPendentes > 0
            ?`<span class="smc-last smc-alert">${formatInteger(repPendentes)} aguardando verificação</span>`
            : `<span class="smc-last">${repLastDate ?"Último: " + formatDate(repLastDate) : "Sem eventos"}</span>`}
        </div>
        <span class="smc-arrow">→</span>
      </article>

      <article class="section-module-card section-card-movimentacoes" role="button" tabindex="0" data-nav-view="dashboard">
        <div class="smc-icon">🔄</div>
        <div class="smc-body">
          <p class="smc-kicker">Movimentações</p>
          <strong class="smc-value">${formatInteger(movTotal)}</strong>
          <p class="smc-detail">lançamentos no período</p>
          ${movLastDate ?`<span class="smc-last">Último: ${formatDate(movLastDate)}</span>` : `<span class="smc-last">Sem movimentações no período</span>`}
        </div>
        <span class="smc-arrow">→</span>
      </article>
    </div>
  `;

  el.querySelectorAll("[data-nav-view]").forEach((card) => {
    const navigate = () => {
      const view = card.dataset.navView;
      state.activeView = view;
      render();
    };
    card.addEventListener("click", navigate);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") navigate(); });
  });
}

function renderDashboardVisualHerdGrid(farm) {
  if (!elements.visualHerdGrid) return;
  elements.visualHerdGrid.innerHTML = "";
  elements.visualHerdGrid.hidden = true;
  return;

  const monthly = summarizePeriod(farm, state.filters.year, state.filters.month);
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const periodLabel = state.filters.month === "all"
    ?`Ano ${state.filters.year}`
    : `${MONTH_NAMES[Number(state.filters.month) - 1]}/${state.filters.year}`;

  const stats = [
    { label: "Nascimento", value: monthly.byType.nascimento, img: "./assets/calf.svg",        detail: "nascidos no período",       movType: "nascimento" },
    { label: "Venda",    value: monthly.byType.venda,   img: "./assets/angus-login.svg", detail: "animais vendidos",        movType: "venda"   },
    { label: "Morte",    value: monthly.byType.morte,   img: "./assets/cow.svg",         detail: "mortes registradas",      movType: "morte"   },
    { label: "Abate",    value: monthly.byType.consumo, img: "./assets/bull.svg",        detail: "abates e consumo interno",movType: "consumo" },
    { label: "Compras",  value: monthly.byType.compra,  img: "./assets/herd.svg",        detail: "animais comprados",       movType: "compra"  },
  ];

  elements.visualHerdGrid.innerHTML = stats.map((stat) => `
    <button type="button" class="visual-card visual-card-action visual-card-button" data-mov="${stat.movType}" title="Registrar ${stat.label}" aria-label="Abrir registro de ${stat.label}${isTotalView ?" no total" : ` em ${escapeHtml(farm.name)}`}">
      <div class="visual-card-image">
        <img src="${stat.img}" alt="${escapeHtml(stat.label)}">
      </div>
      <div class="visual-card-copy">
        <div class="visual-card-topline">
          <div>
            <p class="panel-kicker">${periodLabel}</p>
            <strong>${escapeHtml(stat.label)}</strong>
          </div>
          <span class="visual-card-share visual-card-count">${formatInteger(stat.value)}</span>
        </div>
        <p>${stat.value === 0 ?"Nenhum registro no período." : `${formatInteger(stat.value)} ${stat.detail}.`}</p>
        <span class="visual-card-cta">Abrir registro</span>
      </div>
    </button>
  `).join("");
}

// ── Movement Type Records Dialog ─────────────────────────────────────────

const MOV_TYPE_RECORDS_PAGE = 50;

function setMovTypeRecordsMaximized(isMaximized) {
  elements.movTypeRecordsDlg?.classList.toggle("is-maximized", Boolean(isMaximized));
  if (!elements.maximizeMovTypeRecordsDlg) return;
  const label = isMaximized ?"Restaurar tamanho" : "Maximizar";
  elements.maximizeMovTypeRecordsDlg.setAttribute("aria-label", label);
  elements.maximizeMovTypeRecordsDlg.setAttribute("title", label);
  elements.maximizeMovTypeRecordsDlg.innerHTML = isMaximized ?"&#x2752;" : "&#x26F6;";
}

function toggleMovTypeRecordsMaximize() {
  if (!elements.movTypeRecordsDlg) return;
  const nextState = !elements.movTypeRecordsDlg.classList.contains("is-maximized");
  setMovTypeRecordsMaximized(nextState);
}

function openMovTypeRecordsDlg(movType, options = {}) {
  const typeMeta = MOVEMENT_TYPES.find((t) => t.value === movType);
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farm = isTotalView ?null : getFarm();
  const farmLabel = isTotalView ?"Todas as fazendas" : farm?.name || "";
  const searchValue = typeof options.search === "string" ?options.search : "";
  const page = Number.isInteger(options.page) ?options.page : 0;
  const maximized = Boolean(options.maximized);

  elements.movTypeRecordsKicker.textContent = farmLabel;
  elements.movTypeRecordsTitle.textContent = typeMeta ?typeMeta.label : capitalize(movType);
  elements.movTypeRecordsSearch.value = searchValue;
  elements.movTypeRecordsNewBtn.textContent = `+ Novo ${typeMeta ?typeMeta.label : capitalize(movType)}`;
  elements.movTypeRecordsNewBtn.setAttribute("aria-label", `Abrir formulário de novo ${typeMeta ?typeMeta.label.toLowerCase() : movType}`);
  elements.movTypeRecordsNewBtn.onclick = () => {
    runtime.returnToMovTypeRecords = null;
    elements.movTypeRecordsDlg.close();
    setTimeout(() => openMovementDialog(movType), 80);
  };
  elements.movTypeRecordsSearch.oninput = () => renderMovTypeRecordsBody(movType, 0);

  const isCommercial = movType === "compra" || movType === "venda";
  if (isCommercial) {
    renderCommercialDashboard(movType);
  } else if (elements.movCommercialDashboard) {
    elements.movCommercialDashboard.hidden = true;
    elements.movCommercialDashboard.innerHTML = "";
  }

  runtime._movTypeRecordsPage = page;
  setMovTypeRecordsMaximized(false);
  renderMovTypeRecordsBody(movType, page);
  elements.movTypeRecordsDlg.showModal();
  if (maximized) {
    setMovTypeRecordsMaximized(true);
  }
}

function renderMovTypeRecordsBody(movType, page) {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const query = (elements.movTypeRecordsSearch.value || "").trim().toLowerCase();
  const isCompra = movType === "compra";
  const isVenda = movType === "venda";
  const isCommercial = isCompra || isVenda;

  let all;
  if (isTotalView) {
    all = getAllFarms().flatMap((f) => f.movements.map((m) => ({ ...m, _farmId: f.id, _farmName: f.name })));
  } else {
    const farm = getFarm();
    all = (farm?.movements || []).map((m) => ({ ...m, _farmId: farm.id, _farmName: farm.name }));
  }

  let filtered = all
    .filter((m) => m.type === movType)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (query) {
    filtered = filtered.filter((m) => {
      const base = [m.code, m.categoryName, m.notes, m._farmName].join(" ").toLowerCase();
      const pDetail = isCompra ?(m.purchaseDetails?.sourceProperty || "") : "";
      const vDetail = isVenda ?(m.saleDetails?.buyer || "") : "";
      return base.includes(query) || pDetail.toLowerCase().includes(query) || vDetail.toLowerCase().includes(query);
    });
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / MOV_TYPE_RECORDS_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = filtered.slice(safePage * MOV_TYPE_RECORDS_PAGE, (safePage + 1) * MOV_TYPE_RECORDS_PAGE);

  // Build header columns
  if (isCompra) {
    elements.movTypeRecordsHead.innerHTML = `<tr>
      <th>Código</th>
      ${isTotalView ?"<th>Fazenda</th>" : ""}
      <th>Data</th>
      <th>Categoria</th>
      <th class="num-col">Cabeças</th>
      <th>Origem / Propriedade</th>
      <th class="num-col">Valor Total</th>
      <th></th>
    </tr>`;
  } else if (isVenda) {
    elements.movTypeRecordsHead.innerHTML = `<tr>
      <th>Código</th>
      ${isTotalView ?"<th>Fazenda</th>" : ""}
      <th>Data</th>
      <th>Categoria</th>
      <th class="num-col">Cabeças</th>
      <th>Frigorífico / Comprador</th>
      <th class="num-col">Kg negociados</th>
      <th class="num-col">Valor Total</th>
      <th></th>
    </tr>`;
  } else {
    elements.movTypeRecordsHead.innerHTML = `<tr>
      <th>Código</th>
      ${isTotalView ?"<th>Fazenda</th>" : ""}
      <th>Data</th>
      <th>Categoria</th>
      <th>Qtd.</th>
      <th>Obs.</th>
      <th></th>
    </tr>`;
  }

  // Build body rows
  const colCount = isCompra ?(isTotalView ?8 : 7) : isVenda ?(isTotalView ?9 : 8) : (isTotalView ?7 : 6);

  if (!slice.length) {
    elements.movTypeRecordsBody.innerHTML = `<tr><td colspan="${colCount}" class="table-empty-cell">${query ?"Nenhum registro encontrado." : "Nenhum lançamento deste tipo ainda."}</td></tr>`;
  } else {
    elements.movTypeRecordsBody.innerHTML = slice.map((m) => {
      const code = m.code
        ?`<span class="movement-code">${escapeHtml(m.code)}</span>`
        : `<span class="movement-code movement-code-legacy">—</span>`;
      const farmCell = isTotalView
        ?`<td><div class="mov-records-main-cell"><strong>${escapeHtml(m._farmName)}</strong><span>Origem do registro</span></div></td>`
        : "";
      const currency = m.currency || getFarmCurrency(m._farmId);
      const sym = currency === "USD" ?"US$" : "R$";
      const currencyBadge = `<span class="currency-badge ${currency === "USD" ?"usd" : "brl"}">${currency}</span>`;
      const fmtVal = (v) => v > 0 ?`${sym} ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}` : "—";
      const fmtKg = (v) => v > 0 ?`${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(v)} kg` : "—";
      const actionsCell = `<td class="movement-actions-cell">
        <button class="movement-action-btn edit-btn" title="Editar" data-farm-id="${escapeHtml(m._farmId)}" data-movement-id="${escapeHtml(m.id)}">Editar</button>
        <button class="movement-action-btn delete-btn" title="Excluir" data-farm-id="${escapeHtml(m._farmId)}" data-movement-id="${escapeHtml(m.id)}">Excluir</button>
      </td>`;

      if (isCompra) {
        const p = m.purchaseDetails || {};
        const origin = p.sourceProperty ?escapeHtml(p.sourceProperty) : `<span class="muted-cell">—</span>`;
        const noteSpan = m.notes ?`<span>${escapeHtml(m.notes)}</span>` : "";
        return `<tr class="mov-record-row mov-record-row-compra">
          <td>${code}</td>
          ${farmCell}
          <td>${formatDate(m.date)}</td>
          <td><div class="mov-records-main-cell"><strong>${escapeHtml(m.categoryName)}</strong>${noteSpan}</div></td>
          <td class="num-col"><strong>${formatInteger(m.quantity)}</strong></td>
          <td>${origin}</td>
          <td class="num-col fin-value">${fmtVal(m.value)}</td>
          ${actionsCell}
        </tr>`;
      }

      if (isVenda) {
        const d = m.saleDetails || {};
        const weightKg = d.weightKg || 0;
        const buyer = d.buyer || extractBuyerFromNotes(m.notes);
        const buyerCell = buyer ?escapeHtml(buyer) : `<span class="muted-cell">—</span>`;
        const noteSpan = m.notes ?`<span>${escapeHtml(m.notes)}</span>` : "";
        return `<tr class="mov-record-row mov-record-row-venda">
          <td>${code}</td>
          ${farmCell}
          <td>${formatDate(m.date)}</td>
          <td><div class="mov-records-main-cell"><strong>${escapeHtml(m.categoryName)}</strong>${noteSpan}</div>${getMovementPhotoFlagMarkup(m)}</td>
          <td class="num-col"><strong>${formatInteger(m.quantity)}</strong></td>
          <td>${buyerCell}</td>
          <td class="num-col">${fmtKg(weightKg)}</td>
          <td class="num-col fin-value">${fmtVal(m.value)}</td>
          ${actionsCell}
        </tr>`;
      }

      // Generic types
      const deltaSign = m.delta > 0 ?"+" : "";
      return `<tr>
        <td>${code}</td>
        ${farmCell}
        <td>${formatDate(m.date)}</td>
        <td>${escapeHtml(m.categoryName)}</td>
        <td>${deltaSign}${formatInteger(m.quantity)}</td>
        <td>${escapeHtml(getMovementNotes(m))}${getMovementPhotoFlagMarkup(m)}</td>
        ${actionsCell}
      </tr>`;
    }).join("");

    elements.movTypeRecordsBody.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        runtime.returnToMovTypeRecords = {
          movType,
          search: elements.movTypeRecordsSearch.value || "",
          page: safePage,
          maximized: elements.movTypeRecordsDlg.classList.contains("is-maximized")
        };
        elements.movTypeRecordsDlg.close();
        window.requestAnimationFrame(() => openEditMovementDialog(btn.dataset.farmId, btn.dataset.movementId));
      });
    });
    elements.movTypeRecordsBody.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Excluir este registro?")) return;
        deleteMovement(btn.dataset.farmId, btn.dataset.movementId);
        renderMovTypeRecordsBody(movType, safePage);
        renderCommercialDashboard(movType);
      });
    });
  }

  elements.movTypeRecordsFooter.innerHTML = `
    <span class="movements-count">${filtered.length} registro${filtered.length !== 1 ?"s" : ""}</span>
    ${totalPages > 1 ?`
      <button class="mov-page-btn" ${safePage === 0 ?"disabled" : ""} id="movRecPrev">&#8249; Anterior</button>
      <span class="mov-page-info">Página ${safePage + 1} de ${totalPages}</span>
      <button class="mov-page-btn" ${safePage >= totalPages - 1 ?"disabled" : ""} id="movRecNext">Próxima &#8250;</button>
    ` : ""}
  `;
  document.getElementById("movRecPrev")?.addEventListener("click", () => renderMovTypeRecordsBody(movType, safePage - 1));
  document.getElementById("movRecNext")?.addEventListener("click", () => renderMovTypeRecordsBody(movType, safePage + 1));
}

// Extrai o nome do frigorífico/comprador a partir das notas legadas (ex: "MARFRIG | ...")
function extractBuyerFromNotes(notes) {
  if (!notes) return "";
  const m = String(notes).match(/^([A-ZÁÉÍÓÚ][A-Za-záéíóúÁÉÍÓÚÃÕ\s]+?)(?:\s*\|)/);
  return m ?m[1].trim() : "";
}

// Extrai rendimento % das notas legadas onde não foi salvo explicitamente
function extractYieldFromNotes(notes) {
  if (!notes) return "—";
  const m = String(notes).match(/(\d+[,.]?\d*)\s*%/);
  return m ?`${m[1].replace(",", ".")}%` : "—";
}

function renderCommercialDashboard(movType) {
  const el = elements.movCommercialDashboard;
  if (!el) return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const allFarms = isTotalView ?getAllFarms() : [getFarm()].filter(Boolean);
  const isCompra = movType === "compra";

  const brlFarms = allFarms.filter((f) => getFarmCurrency(f.id) === "BRL");
  const usdFarms = allFarms.filter((f) => getFarmCurrency(f.id) === "USD");

  function aggregate(farms) {
    const movs = farms.flatMap((f) =>
      f.movements.filter((m) => m.type === movType).map((m) => ({ ...m, _farmId: f.id, _farmName: f.name }))
    );
    const count = movs.length;
    const heads = movs.reduce((s, m) => s + Number(m.quantity || 0), 0);
    const totalValue = movs.reduce((s, m) => s + Number(m.value || 0), 0);
    const avgPerHead = heads > 0 ?totalValue / heads : 0;
    const byFarm = farms.map((f) => {
      const fm = movs.filter((m) => m._farmId === f.id);
      return { name: f.name, heads: fm.reduce((s, m) => s + Number(m.quantity || 0), 0), value: fm.reduce((s, m) => s + Number(m.value || 0), 0) };
    }).filter((x) => x.heads > 0);
    return { count, heads, totalValue, avgPerHead, byFarm };
  }

  function buildRow(farms, currency) {
    if (!farms.length) return "";
    const d = aggregate(farms);
    if (d.count === 0) return "";
    const sym = currency === "USD" ?"US$" : "R$";
    const fmt = (v) => v > 0 ?`${sym} ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}` : "—";
    const farmNames = farms.map((f) => escapeHtml(f.name)).join(" · ");
    const farmTags = d.byFarm.length > 1 ?`<div class="comm-farm-tags">${d.byFarm.map((x) =>
      `<span class="comm-farm-tag"><strong>${escapeHtml(x.name)}</strong> ${formatInteger(x.heads)} cab. <span class="fin-value">${fmt(x.value)}</span></span>`
    ).join("")}</div>` : "";

    return `
      <div class="comm-summary-row">
        <div class="comm-row-meta">
          <span class="currency-badge ${currency === "USD" ?"usd" : "brl"}">${currency}</span>
          <span class="comm-row-farms">${farmNames}</span>
        </div>
        <div class="comm-row-stats">
          <span class="comm-stat"><strong>${d.count}</strong> <span>op.</span></span>
          <span class="comm-sep">·</span>
          <span class="comm-stat"><strong>${formatInteger(d.heads)}</strong> <span>cab.</span></span>
          <span class="comm-sep">·</span>
          <span class="comm-stat fin-value"><strong>${fmt(d.totalValue)}</strong></span>
          ${d.avgPerHead > 0 ?`<span class="comm-sep">·</span><span class="comm-stat comm-avg">${fmt(d.avgPerHead)}/cab.</span>` : ""}
        </div>
        ${farmTags}
      </div>
    `;
  }

  const brlHtml = buildRow(brlFarms, "BRL");
  const usdHtml = buildRow(usdFarms, "USD");

  if (!brlHtml && !usdHtml) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }

  el.innerHTML = `<div class="comm-summary">${brlHtml}${usdHtml}</div>`;
  el.hidden = false;
}

function handleRegisterAction(action) {
  if (action === "dado-mensal") {
    openMonthlyDataDialog();
    return;
  }

  if (action === "categoria") {
    openCategoryDialog();
    return;
  }

  if (action === "alocar") {
    openAlocarDialog();
    return;
  }

  openMovementDialog(action);
}

function renderFarmSwitch() {
  elements.farmSwitch.innerHTML = "";
  const totalButton = document.createElement("button");
  totalButton.className = `farm-btn ${TOTAL_FARM_ID === state.data.selectedFarmId ? "active" : ""}`;
  totalButton.textContent = "Todas as Fazendas";
  totalButton.addEventListener("click", () => {
    state.data.selectedFarmId = TOTAL_FARM_ID;
    if (state.activeView !== "compras" && state.activeView !== "vendas") {
      state.activeView = "home";
    }
    saveData();
    render();
  });
  elements.farmSwitch.appendChild(totalButton);

  Object.values(state.data.farms).forEach((farm) => {
    const button = document.createElement("button");
    button.className = `farm-btn ${farm.id === state.data.selectedFarmId ? "active" : ""}`;
    const currency = FARM_CURRENCY_MAP[farm.id];
    const countryTag = currency === "USD" ? "UY" : "BR";
    button.innerHTML = `${escapeHtml(farm.name)} <span class="farm-btn-country">${countryTag}</span>`;
    button.addEventListener("click", () => {
      state.data.selectedFarmId = farm.id;
      if (state.activeView !== "compras" && state.activeView !== "vendas") {
        state.activeView = "home";
        runtime.movementsPage = 0;
        runtime.movementsSearch = "";
        runtime.sanitaryPage = 0;
        runtime.sanitarySearch = "";
        resetSanitaryTableFilters();
      }
      saveData();
      render();
    });
    elements.farmSwitch.appendChild(button);
  });
}

function renderGlobalSummary() {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ?getAllFarms() : [state.data.farms[state.data.selectedFarmId]].filter(Boolean);
  const totals = farms.reduce((accumulator, farm) => {
    const monthly = summarizePeriod(farm, state.filters.year, state.filters.month);
    accumulator.animais += getFarmTotal(farm);
    accumulator.declaredTotal += Number(farm.declaredTotal || 0);
    accumulator.allocatedAnimals += getRegisteredPotreroAnimals(farm);
    accumulator.entradas += monthly.byType.compra + monthly.byType.nascimento + monthly.adjustPositive;
    accumulator.saidas += monthly.byType.venda + monthly.byType.consumo + monthly.byType.morte + monthly.adjustNegative;
    accumulator.sanitario += getFilteredSanitaryRecords(farm).length;
    accumulator.monthlyRecords += getFilteredMonthlyRecords(farm).length;
    return accumulator;
  }, { animais: 0, declaredTotal: 0, allocatedAnimals: 0, entradas: 0, saidas: 0, sanitario: 0, monthlyRecords: 0 });
  const selectedFarm = farms[0];
  const allocationBalance = totals.animais - totals.allocatedAnimals;

  elements.globalPanelKicker.textContent = isTotalView ?"Painel inicial" : "Fazenda selecionada";
  elements.globalPanelTitle.textContent = isTotalView ?"Consolidado das fazendas" : `Resumo de ${selectedFarm?.name || "fazenda"}`;
  elements.globalPanelChip.textContent = isTotalView ?"Grupo Da Bruna" : selectedFarm?.name || "Fazenda";

  const cards = [
    {
      title: isTotalView ?"Estoque consolidado" : "Estoque atual",
      value: formatInteger(totals.animais),
      detail: isTotalView ?"estoque consolidado do grupo" : `estoque atual de ${selectedFarm?.name || "fazenda"}`
    },
    {
      title: isTotalView ?"Entradas consolidadas" : "Entradas no período",
      value: formatInteger(totals.declaredTotal),
      detail: totals.declaredTotal === totals.animais
        ?"estoque alinhado ao total declarado"
        : `${formatInteger(totals.declaredTotal - totals.animais)} animais de diferenca`
    },
    {
      title: isTotalView ?"Saídas consolidadas" : "Saídas no período",
      value: formatInteger(totals.saidas),
      detail: isTotalView ?"vendas, mortes, consumo e ajustes negativos" : "vendas, mortes, consumo e ajustes negativos"
    },
    {
      title: "Registros sanitários",
      value: formatInteger(totals.sanitario),
      detail: isTotalView ?"manejos sanitários no período filtrado" : `manejos sanitários de ${selectedFarm?.name || "fazenda"}`
    }
  ];

  elements.globalSummaryGrid.innerHTML = cards.map((card) => `
    <article class="summary-card">
      <p class="panel-kicker">${card.title}</p>
      <strong>${card.value}</strong>
      <p>${card.detail}</p>
    </article>
  `).join("");

  elements.globalFarmBreakdown.innerHTML = farms.map((farm) => {
    const summary = summarizePeriod(farm, state.filters.year, state.filters.month);
    const sanitaryCount = getFilteredSanitaryRecords(farm).length;
    return `
      <article class="global-farm-card">
        <p class="panel-kicker">${escapeHtml(farm.name)}</p>
        <strong>${formatInteger(getFarmTotal(farm))}</strong>
        <p>Compra ${formatInteger(summary.byType.compra)} | Venda ${formatInteger(summary.byType.venda)}</p>
        <p>Nasc. ${formatInteger(summary.byType.nascimento)} | Mortes ${formatInteger(summary.byType.morte)}</p>
        <span>${formatInteger(sanitaryCount)} registro(s) sanitários no período</span>
      </article>
    `;
  }).join("");
}

function renderActiveView() {
  const view = state.activeView;
  document.body.dataset.activeView = view;
  if (elements.homeView) elements.homeView.hidden = view !== "home";
  elements.dashboardView.hidden = view !== "dashboard";
  elements.sanitaryView.hidden = view !== "sanitary";
  elements.potreirosView.hidden = view !== "potreiros";
  elements.reproducaoView.hidden = view !== "reproducao";
  if (elements.comprasView) elements.comprasView.hidden = view !== "compras";
  if (elements.vendasView) elements.vendasView.hidden = view !== "vendas";
  elements.sanitaryShortcut?.classList.toggle("active", view === "sanitary");
  elements.potreirosShortcut?.classList.toggle("active", view === "potreiros");
  elements.reproducaoShortcut?.classList.toggle("active", view === "reproducao");
  elements.comprasShortcut?.classList.toggle("active", view === "compras");
  elements.vendasShortcut?.classList.toggle("active", view === "vendas");
  if (view === "home") renderHomeView();
  if (view === "potreiros") renderPotreirosView();
  if (view === "reproducao") renderReproducaoView();
  if (view === "compras") { try { renderComprasView(); } catch (e) { console.error("[compras] erro ao renderizar:", e); } }
  if (view === "vendas")   { try { renderVendasView();  } catch (e) { console.error("[vendas] erro ao renderizar:", e); } }
  if (view !== "home") injectBackButton(view);
  syncMobileNav(view);
}

function injectBackButton(view) {
  const viewMap = {
    dashboard: elements.dashboardView,
    sanitary: elements.sanitaryView,
    potreiros: elements.potreirosView,
    reproducao: elements.reproducaoView,
    compras: elements.comprasView,
    vendas: elements.vendasView
  };
  const el = viewMap[view];
  if (!el) return;
  if (el.querySelector(".back-to-home-bar")) return;

  const farm = getFarm();
  const farmLabel = state.data.selectedFarmId === TOTAL_FARM_ID ? "Todas as Fazendas" : farm.name;
  const viewLabels = {
    dashboard: "Estoque", sanitary: "Manejo Sanitário", potreiros: "Potreiros",
    reproducao: "Reprodução", compras: "Compras", vendas: "Vendas"
  };

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
      <span>${escapeHtml(viewLabels[view] || view)}</span>
    </span>
  `;
  bar.querySelector(".btn-back-home").addEventListener("click", () => {
    state.activeView = "home";
    render();
  });
  el.insertBefore(bar, el.firstChild);
}

function syncMobileNav(view) {
  if (!elements.mobileBottomNav) return;
  [elements.mobileNavDashboard, elements.mobileNavSanitary, elements.mobileNavPotreiros, elements.mobileNavReproducao, elements.mobileNavFarms].forEach((btn) => {
    if (btn) btn.classList.remove("active");
  });
  if ((view === "home" || view === "dashboard") && elements.mobileNavDashboard) elements.mobileNavDashboard.classList.add("active");
  if (view === "sanitary" && elements.mobileNavSanitary) elements.mobileNavSanitary.classList.add("active");
  if (view === "potreiros" && elements.mobileNavPotreiros) elements.mobileNavPotreiros.classList.add("active");
  if (view === "reproducao" && elements.mobileNavReproducao) elements.mobileNavReproducao.classList.add("active");
  // compras não tem botão mobile dedicado — mantém padrão
}

function renderMobileFarmDrawer() {
  if (!elements.mobileFarmSwitchList) return;
  const farms = [{ id: TOTAL_FARM_ID, name: "Total (todas as fazendas)" }, ...getAllFarms()];
  elements.mobileFarmSwitchList.innerHTML = farms.map((farm) => `
    <button type="button" class="mobile-farm-option ${farm.id === state.data.selectedFarmId ?"active" : ""}" data-farm-id="${farm.id}">
      ${escapeHtml(farm.name)}
    </button>
  `).join("");
  elements.mobileFarmSwitchList.querySelectorAll("[data-farm-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.data.selectedFarmId = btn.dataset.farmId;
      state.activeView = "dashboard";
      elements.mobileFarmDrawer.hidden = true;
      saveData();
      render();
    });
  });
}

function renderActionButtonsState() {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  elements.editStockButton.disabled = false;
  elements.editStockButton.title = isTotalView
    ?"Na aba total, o editor abre em modo global para escolher a fazenda dentro do modal."
    : "";
}

function renderGeorefState(farm) {
  const isArapeyDashboard = farm.id === "arapey" && state.activeView === "dashboard";
  elements.georefButton.hidden = !isArapeyDashboard;
  elements.georefButton.disabled = !isArapeyDashboard;
  elements.georefButton.title = isArapeyDashboard ?"" : "Disponível apenas na fazenda Arapey.";

  if (!isArapeyDashboard && elements.georefDialog.open) {
    clearGeorefDraft();
    elements.georefDialog.close();
    return;
  }

  if (isArapeyDashboard && elements.georefDialog.open) {
    void renderGeorefDialog();
  }
}

function renderHero(farm) {
  const dominantCategory = getDominantCategory(farm);
  const dominantText = dominantCategory
    ?`${dominantCategory.name} lidera o rebanho com ${formatInteger(dominantCategory.quantity)} animais.`
    : "Estrutura pronta para acompanhar compras, vendas e manejo.";

  elements.heroFarmName.textContent = farm.name;
  elements.heroFarmNote.textContent = `${farm.note} ${dominantText}`;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  if (elements.dashboardFarmLabel) {
    elements.dashboardFarmLabel.textContent = isTotalView
      ?"Painel de Controle de Todas as Fazendas"
      : `Painel de Controle — Fazenda ${farm.name}`;
  }
}

function renderHeroMetrics(farm) {
  const totalAnimals = getFarmTotal(farm);
  const annual = summarizePeriod(farm, state.filters.year, "all");
  const discrepancy = getDiscrepancy(farm);

  const metrics = [
    {
      label: "Rebanho",
      value: formatInteger(totalAnimals),
      text: "animais no estoque atual"
    },
    {
      label: "Giro anual",
      value: formatInteger(annual.totalMovements),
      text: "lançamentos no ano filtrado"
    },
    {
      label: "Conferência",
      value: discrepancy === 0 ?"OK" : `${discrepancy > 0 ?"+" : ""}${formatInteger(discrepancy)}`,
      text: discrepancy === 0 ?"estoque alinhado ao total declarado" : "diferença entre estoque e total declarado"
    }
  ];

  elements.heroMetrics.innerHTML = metrics.map((metric) => `
    <article class="hero-metric">
      <span>${metric.label}</span>
      <strong>${metric.value}</strong>
      <p>${metric.text}</p>
    </article>
  `).join("");
}

function renderSummaryCards(farm) {
  const totalAnimals = getFarmTotal(farm);
  const monthlyData = summarizePeriod(farm, state.filters.year, state.filters.month);
  const annualData = summarizePeriod(farm, state.filters.year, "all");
  const purchasesAndBirths = monthlyData.byType.compra + monthlyData.byType.nascimento + monthlyData.adjustPositive;
  const salesAndLosses = monthlyData.byType.venda + monthlyData.byType.consumo + monthlyData.byType.morte + monthlyData.adjustNegative;

  const cards = [
    { title: "Rebanho atual", value: formatInteger(totalAnimals), detail: "Estoque total da fazenda selecionada" },
    { title: "Entradas no período", value: formatInteger(purchasesAndBirths), detail: "Compras, nascimentos e ajustes positivos" },
    { title: "Saídas no período", value: formatInteger(salesAndLosses), detail: "Vendas, consumo, mortes e ajustes negativos" },
    { title: "Movimentações no ano", value: formatInteger(annualData.totalMovements), detail: `Lançamentos registrados em ${state.filters.year}` }
  ];

  elements.summaryGrid.innerHTML = cards.map((card) => `
    <article class="summary-card">
      <p class="panel-kicker">${card.title}</p>
      <strong>${card.value}</strong>
      <p>${card.detail}</p>
    </article>
  `).join("");
}

function renderVisualHerdGrid(farm) {
  const total = Math.max(getFarmTotal(farm), 1);
  const categories = [...farm.categories]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  elements.visualHerdGrid.innerHTML = categories.map((category) => {
    const share = ((category.quantity / total) * 100).toFixed(1);
    return `
      <article class="visual-card">
        <div class="visual-card-image">
          <img src="${getCategoryImage(category.name)}" alt="${escapeHtml(category.name)}">
        </div>
        <div class="visual-card-copy">
          <div class="visual-card-topline">
            <div>
              <p class="panel-kicker">${escapeHtml(getCategoryFamily(category.name))}</p>
              <strong>${escapeHtml(category.name)}</strong>
            </div>
            <span class="visual-card-share">${share}%</span>
          </div>
          <p>${formatInteger(category.quantity)} animais neste grupo.</p>
        </div>
      </article>
    `;
  }).join("");
}

function renderPeriodSummary(farm) {
  const monthly = summarizePeriod(farm, state.filters.year, state.filters.month);
  const annual = summarizePeriod(farm, state.filters.year, "all");
  const valueText = annual.totalValue > 0 ?formatCurrency(annual.totalValue) : "Sem valor informado";

  const cards = [
    { title: state.filters.month === "all" ?"Saldo anual" : "Saldo do mês", value: `${monthly.netChange > 0 ?"+" : ""}${formatInteger(monthly.netChange)}`, detail: "Variação líquida entre entradas e saídas" },
    { title: "Compras", value: formatInteger(monthly.byType.compra), detail: "Animais comprados no recorte" },
    { title: "Nascimentos", value: formatInteger(monthly.byType.nascimento), detail: "Animais nascidos no recorte" },
    { title: "Valor movimentado", value: valueText, detail: "Soma dos valores registrados no ano" }
  ];

  elements.periodSummary.innerHTML = cards.map((card) => `
    <article class="analytics-card">
      <p class="panel-kicker">${card.title}</p>
      <strong>${card.value}</strong>
      <p>${card.detail}</p>
    </article>
  `).join("");

  elements.discrepancyNote.textContent = "";
}

function renderSalesAnalysis(farm) {
  const summary = summarizeSalePeriod(farm, state.filters.year, state.filters.month);
  const isPremiumFarm = isPremiumSaleFarm(farm);
  const farmCurrency = getFarmCurrency(farm.id);
  const sym = farmCurrency === "USD" ? "US$" : "R$";
  const fmtMoney = (v) => {
    if (!v) return farmCurrency === "USD" ? "US$ 0,00" : formatCurrency(0);
    if (farmCurrency === "USD") return "US$ " + new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    return formatCurrency(v);
  };

  const cards = isPremiumFarm
    ? [
      { title: "Vendas registradas", value: formatInteger(summary.count), detail: "lançamentos comerciais no período" },
      { title: "Faturamento", value: fmtMoney(summary.totalValue), detail: "valor calculado das vendas" },
      { title: "Kg vivo", value: formatWeight(summary.liveKg), detail: "peso vivo negociado" },
      { title: "Kg carcaça", value: formatWeight(summary.carcassKg), detail: "peso de carcaça negociado" }
    ]
    : [
      { title: "Vendas registradas", value: formatInteger(summary.count), detail: "lançamentos comerciais no período" },
      { title: "Faturamento", value: fmtMoney(summary.totalValue), detail: "valor calculado das vendas" },
      { title: "Kg vivo", value: formatWeight(summary.liveKg), detail: "peso vivo negociado" },
      { title: `Média ${sym}/kg vivo`, value: summary.liveKg > 0 ? fmtMoney(summary.totalValue / summary.liveKg) : fmtMoney(0), detail: "preço médio por kg vivo" }
    ];

  if (elements.salesSummary) {
    elements.salesSummary.innerHTML = cards.map((card) => `
      <article class="analytics-card">
        <p class="panel-kicker">${card.title}</p>
        <strong>${card.value}</strong>
        <p>${card.detail}</p>
      </article>
    `).join("");
  }

  if (!summary.movements.length) {
    elements.salesTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty-cell">Nenhuma venda encontrada para o período selecionado.</td>
      </tr>
    `;
    return;
  }

  elements.salesTableBody.innerHTML = summary.movements.slice(0, 10).map((movement) => `
    <tr>
      <td data-label="Data">${formatDate(movement.date)}</td>
      <td data-label="Categoria">${escapeHtml(movement.categoryName)}${getMovementPhotoFlagMarkup(movement)}</td>
      <td data-label="Base">${movement.saleDetails ? escapeHtml(getSaleModeLabel(movement.saleDetails.mode || "vivo")) : "Relatório mensal"}</td>
      <td data-label="Kg">${movement.saleDetails ? formatWeight(movement.saleDetails.weightKg || 0) : "-"}</td>
      <td data-label="${sym}/kg">${movement.saleDetails ? fmtMoney(movement.saleDetails.pricePerKg || 0) : "-"}</td>
      <td data-label="Total">${fmtMoney(movement.value || 0)}</td>
    </tr>
  `).join("");
}

const MOVEMENT_TYPE_STYLES = {
  compra: "badge-ok",
  nascimento: "badge-ok",
  venda: "badge-exit",
  morte: "badge-err",
  consumo: "badge-warn",
  ajuste: "badge-neutral",
  transferencia: "badge-neutral",
  sanitario: "badge-ok"
};

const MOVEMENTS_PAGE_SIZE = 50;

function renderMovementsTable(farm) {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const colCount = isTotalView ?8 : 7;

  // Build full sorted list
  let allMovements;
  if (isTotalView) {
    allMovements = getAllFarms().flatMap((f) => f.movements.map((m) => ({ ...m, _farmId: f.id, _farmName: f.name })));
  } else {
    allMovements = farm.movements.map((m) => ({ ...m, _farmId: farm.id, _farmName: farm.name }));
  }
  allMovements = allMovements.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply search filter
  const query = runtime.movementsSearch.trim().toLowerCase();
  const filtered = query
    ?allMovements.filter((m) =>
        (m.code || "").toLowerCase().includes(query) ||
        (m.type || "").toLowerCase().includes(query) ||
        (m.categoryName || "").toLowerCase().includes(query) ||
        (m.notes || "").toLowerCase().includes(query) ||
        (m._farmName || "").toLowerCase().includes(query)
      )
    : allMovements;

  const totalPages = Math.max(1, Math.ceil(filtered.length / MOVEMENTS_PAGE_SIZE));
  if (runtime.movementsPage >= totalPages) runtime.movementsPage = totalPages - 1;
  const page = runtime.movementsPage;
  const movements = filtered.slice(page * MOVEMENTS_PAGE_SIZE, (page + 1) * MOVEMENTS_PAGE_SIZE);

  // Render table header
  if (elements.movementsTableHead) {
    elements.movementsTableHead.innerHTML = `<tr>
      <th>Código</th>
      ${isTotalView ?"<th>Fazenda</th>" : ""}
      <th>Data</th><th>Tipo</th><th>Categoria</th><th>Qtd.</th><th>Obs.</th><th></th>
    </tr>`;
  }

  // Search bar + pagination controls container
  const container = elements.movementsTableBody.closest(".table-wrap") || elements.movementsTableBody.parentElement;
  let toolbar = container.parentElement.querySelector(".movements-toolbar");
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "movements-toolbar";
    container.parentElement.insertBefore(toolbar, container);
  }
  toolbar.innerHTML = `
    <div class="movements-search-wrap">
      <input
        type="search"
        class="movements-search-input"
        placeholder="Buscar por código, tipo, categoria…"
        value="${escapeHtml(runtime.movementsSearch)}"
        id="movementsSearchInput"
      >
    </div>
    <div class="movements-pagination">
      <span class="movements-count">${filtered.length} registro${filtered.length !== 1 ?"s" : ""}${query ?" encontrado" + (filtered.length !== 1 ?"s" : "") : ""}</span>
      ${totalPages > 1 ?`
        <button class="mov-page-btn" data-page="${page - 1}" ${page === 0 ?"disabled" : ""}>&#8249; Anterior</button>
        <span class="mov-page-info">Página ${page + 1} de ${totalPages}</span>
        <button class="mov-page-btn" data-page="${page + 1}" ${page >= totalPages - 1 ?"disabled" : ""}>Próxima &#8250;</button>
      ` : ""}
    </div>
  `;

  toolbar.querySelector("#movementsSearchInput").addEventListener("input", (e) => {
    runtime.movementsSearch = e.target.value;
    runtime.movementsPage = 0;
    renderMovementsTable(farm);
  });
  toolbar.querySelectorAll(".mov-page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      runtime.movementsPage = Number(btn.dataset.page);
      renderMovementsTable(farm);
    });
  });

  if (!movements.length) {
    elements.movementsTableBody.innerHTML = `
      <tr><td colspan="${colCount}" class="table-empty-cell">${query ?"Nenhum registro encontrado para a busca." : "Ainda não há lançamentos. Use os botões acima para iniciar o controle."}</td></tr>
    `;
    return;
  }

  elements.movementsTableBody.innerHTML = movements.map((movement) => {
    const badgeClass = MOVEMENT_TYPE_STYLES[movement.type] || "badge-neutral";
    const deltaSign = movement.delta > 0 ?"+" : "";
    const codeDisplay = movement.code
      ?`<span class="movement-code">${escapeHtml(movement.code)}</span>`
      : `<span class="movement-code movement-code-legacy">—</span>`;
    const farmCell = isTotalView
      ?`<td data-label="Fazenda"><span class="sanitary-origin manual">${escapeHtml(movement._farmName)}</span></td>`
      : "";
    return `
      <tr>
        <td data-label="Código">${codeDisplay}</td>
        ${farmCell}
        <td data-label="Data">${formatDate(movement.date)}</td>
        <td data-label="Tipo"><span class="badge ${badgeClass}">${capitalize(movement.type)}</span></td>
        <td data-label="Categoria">${escapeHtml(movement.categoryName)}</td>
        <td data-label="Qtd.">${deltaSign}${formatInteger(movement.quantity)}</td>
        <td data-label="Obs.">${escapeHtml(getMovementNotes(movement))}${getMovementPhotoFlagMarkup(movement)}</td>
        <td class="movement-actions-cell">
          <button class="movement-action-btn edit-btn" title="Editar" data-farm-id="${escapeHtml(movement._farmId)}" data-movement-id="${escapeHtml(movement.id)}">✏️</button>
          <button class="movement-action-btn delete-btn" title="Excluir" data-farm-id="${escapeHtml(movement._farmId)}" data-movement-id="${escapeHtml(movement.id)}">🗑️</button>
        </td>
      </tr>
    `;
  }).join("");

  elements.movementsTableBody.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => openEditMovementDialog(btn.dataset.farmId, btn.dataset.movementId));
  });
  elements.movementsTableBody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteMovement(btn.dataset.farmId, btn.dataset.movementId));
  });
}

function getHistoryOperationLabel(operation) {
  if (operation === "sanitario") return "Sanitário";
  const meta = MOVEMENT_TYPES.find((item) => item.value === operation);
  return meta ?meta.label : capitalize(operation || "registro");
}

function getHistoryRecordCode(record) {
  if (record.code) return record.code;
  if (record.kind === "sanitary") return `SAN-${getFarmCodePrefix(record.farmId)}-LEG`;
  return `LEG-${getFarmCodePrefix(record.farmId)}`;
}

function getUnifiedHistoryRecords(baseFarm, options = {}) {
  const forceSingleFarm = options.scope === "single";
  const farms = forceSingleFarm
    ?[baseFarm].filter(Boolean)
    : (state.data.selectedFarmId === TOTAL_FARM_ID ?getAllFarms() : [baseFarm].filter(Boolean));

  return farms.flatMap((farm) => {
    const movementRecords = farm.movements.map((movement) => ({
      kind: "movement",
      id: movement.id,
      farmId: farm.id,
      farmName: farm.name,
      date: movement.date,
      year: String(movement.date || "").slice(0, 4),
      code: movement.code || "",
      operation: movement.type || "movimento",
      categoryName: movement.categoryName || "—",
      especie: movement.especie || "bovino",
      quantity: Number(movement.quantity || 0),
      details: [
        movement.potreiro ?`Potreiro: ${movement.potreiro}` : "",
        movement.potreiroDest ?`Destino: ${movement.potreiroDest}` : "",
        movement.value ?`Valor: ${formatCurrency(movement.value)}` : "",
        getMovementNotes(movement)
      ].filter(Boolean).join(" · "),
      raw: movement
    }));

    const sanitaryRecords = farm.sanitaryRecords.map((record) => ({
      kind: "sanitary",
      id: record.id || record.sourceId,
      farmId: farm.id,
      farmName: farm.name,
      date: record.date,
      year: String(record.date || "").slice(0, 4),
      code: record.code || "",
      operation: "sanitario",
      categoryName: record.categoryName || "—",
      especie: record.especie || "bovino",
      quantity: Number(record.quantity || 0),
      details: [
        record.product ?`Produto: ${record.product}` : "",
        record.potreiro ?`Potreiro: ${record.potreiro}` : "",
        record.notes || ""
      ].filter(Boolean).join(" · "),
      raw: record
    }));

    return [...movementRecords, ...sanitaryRecords];
  }).sort((a, b) =>
    String(b.date || "").localeCompare(String(a.date || ""))
    || String(getHistoryRecordCode(a)).localeCompare(String(getHistoryRecordCode(b)))
    || String(a.id || "").localeCompare(String(b.id || ""))
  );
}

function renderMovementsTable(farm) {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const colCount = isTotalView ?9 : 8;
  const allRecords = getUnifiedHistoryRecords(farm);
  const years = [...new Set(allRecords.map((record) => record.year).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const categories = [...new Set(allRecords.map((record) => record.categoryName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const operations = [...new Set(allRecords.map((record) => record.operation).filter(Boolean))];
  const query = runtime.movementsSearch.trim().toLowerCase();

  const filtered = allRecords.filter((record) => {
    const matchesQuery = !query || [
      getHistoryRecordCode(record),
      getHistoryOperationLabel(record.operation),
      record.categoryName,
      record.details,
      record.farmName
    ].some((value) => String(value || "").toLowerCase().includes(query));

    const matchesYear = runtime.movementsYearFilter === "all" || record.year === runtime.movementsYearFilter;
    const matchesCategory = runtime.movementsCategoryFilter === "all" || record.categoryName === runtime.movementsCategoryFilter;
    const matchesOperation = runtime.movementsOperationFilter === "all" || record.operation === runtime.movementsOperationFilter;
    const matchesFarm = !isTotalView || runtime.movementsFarmFilter === "all" || record.farmId === runtime.movementsFarmFilter;
    const matchesSpecies = state.filters.especie === "todas" || record.especie === state.filters.especie;

    return matchesQuery && matchesYear && matchesCategory && matchesOperation && matchesFarm && matchesSpecies;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / MOVEMENTS_PAGE_SIZE));
  if (runtime.movementsPage >= totalPages) runtime.movementsPage = totalPages - 1;
  const page = runtime.movementsPage;
  const records = filtered.slice(page * MOVEMENTS_PAGE_SIZE, (page + 1) * MOVEMENTS_PAGE_SIZE);

  if (elements.movementsTableHead) {
    elements.movementsTableHead.innerHTML = `<tr>
      <th>Código</th>
      ${isTotalView ?"<th>Fazenda</th>" : ""}
      <th>Data</th><th>Espécie</th><th>Operação</th><th>Categoria</th><th>Qtd.</th><th>Registro</th><th></th>
    </tr>`;
  }

  const container = elements.movementsTableBody.closest(".table-wrap") || elements.movementsTableBody.parentElement;
  let toolbar = container.parentElement.querySelector(".movements-toolbar");
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "movements-toolbar";
    container.parentElement.insertBefore(toolbar, container);
  }
  toolbar.innerHTML = `
    <div class="movements-search-wrap">
      <input
        type="search"
        class="movements-search-input"
        placeholder="Buscar por código, fazenda, operação, categoria ou registro..."
        value="${escapeHtml(runtime.movementsSearch)}"
        id="movementsSearchInput"
      >
    </div>
    <div class="movements-filter-group">
      ${isTotalView
        ?`<select class="movements-filter-select" id="movementsFarmFilter">
            <option value="all">Todas as fazendas</option>
            ${getAllFarms().map((item) => `<option value="${escapeHtml(item.id)}" ${runtime.movementsFarmFilter === item.id ?"selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
          </select>`
        : `<select class="movements-filter-select" id="movementsFarmFilter" disabled><option value="${escapeHtml(farm.id)}">${escapeHtml(farm.name)}</option></select>`
      }
      <select class="movements-filter-select" id="movementsOperationFilter">
        <option value="all">Todas as operações</option>
        ${operations.map((operation) => `<option value="${escapeHtml(operation)}" ${runtime.movementsOperationFilter === operation ?"selected" : ""}>${escapeHtml(getHistoryOperationLabel(operation))}</option>`).join("")}
      </select>
      <select class="movements-filter-select" id="movementsCategoryFilter">
        <option value="all">Todas as categorias</option>
        ${categories.map((category) => `<option value="${escapeHtml(category)}" ${runtime.movementsCategoryFilter === category ?"selected" : ""}>${escapeHtml(category)}</option>`).join("")}
      </select>
      <select class="movements-filter-select" id="movementsYearFilter">
        <option value="all">Todos os anos</option>
        ${years.map((year) => `<option value="${escapeHtml(year)}" ${runtime.movementsYearFilter === year ?"selected" : ""}>${escapeHtml(year)}</option>`).join("")}
      </select>
    </div>
    <div class="movements-pagination">
      <span class="movements-count">${filtered.length} registro${filtered.length !== 1 ?"s" : ""}${query ?" encontrado" + (filtered.length !== 1 ?"s" : "") : ""}</span>
      ${totalPages > 1 ?`
        <button class="mov-page-btn" data-page="${page - 1}" ${page === 0 ?"disabled" : ""}>&#8249; Anterior</button>
        <span class="mov-page-info">Página ${page + 1} de ${totalPages}</span>
        <button class="mov-page-btn" data-page="${page + 1}" ${page >= totalPages - 1 ?"disabled" : ""}>Próxima &#8250;</button>
      ` : ""}
    </div>
  `;

  toolbar.querySelector("#movementsSearchInput").addEventListener("input", (e) => {
    runtime.movementsSearch = e.target.value;
    runtime.movementsPage = 0;
    renderMovementsTable(farm);
  });
  toolbar.querySelector("#movementsFarmFilter")?.addEventListener("change", (e) => {
    runtime.movementsFarmFilter = e.target.value;
    runtime.movementsPage = 0;
    renderMovementsTable(farm);
  });
  toolbar.querySelector("#movementsOperationFilter")?.addEventListener("change", (e) => {
    runtime.movementsOperationFilter = e.target.value;
    runtime.movementsPage = 0;
    renderMovementsTable(farm);
  });
  toolbar.querySelector("#movementsCategoryFilter")?.addEventListener("change", (e) => {
    runtime.movementsCategoryFilter = e.target.value;
    runtime.movementsPage = 0;
    renderMovementsTable(farm);
  });
  toolbar.querySelector("#movementsYearFilter")?.addEventListener("change", (e) => {
    runtime.movementsYearFilter = e.target.value;
    runtime.movementsPage = 0;
    renderMovementsTable(farm);
  });
  toolbar.querySelectorAll(".mov-page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      runtime.movementsPage = Number(btn.dataset.page);
      renderMovementsTable(farm);
    });
  });

  if (!records.length) {
    elements.movementsTableBody.innerHTML = `
      <tr><td colspan="${colCount}" class="table-empty-cell">${query ?"Nenhum registro encontrado para a busca." : "Ainda não há registros no histórico consolidado."}</td></tr>
    `;
    return;
  }

  elements.movementsTableBody.innerHTML = records.map((record) => {
    const badgeClass = MOVEMENT_TYPE_STYLES[record.operation] || "badge-neutral";
    const codeDisplay = `<span class="movement-code ${record.kind === "sanitary" ?"san-code" : ""}">${escapeHtml(getHistoryRecordCode(record))}</span>`;
    const farmCell = isTotalView
      ?`<td data-label="Fazenda"><span class="sanitary-origin manual">${escapeHtml(record.farmName)}</span></td>`
      : "";
    const actionButtons = record.kind === "movement"
      ?`
          <button class="movement-action-btn edit-btn" title="Editar" data-farm-id="${escapeHtml(record.farmId)}" data-movement-id="${escapeHtml(record.id)}">✏️</button>
          <button class="movement-action-btn delete-btn" title="Excluir" data-farm-id="${escapeHtml(record.farmId)}" data-movement-id="${escapeHtml(record.id)}">🗑️</button>
        `
      : `<button class="movement-action-btn edit-sanitary-btn" title="Editar sanitário" data-edit-sanitary-id="${escapeHtml(record.id)}">✏️</button>`;
    return `
      <tr>
        <td data-label="Código">${codeDisplay}</td>
        ${farmCell}
        <td data-label="Data">${formatDate(record.date)}</td>
        <td data-label="Espécie">${record.especie === "ovino" ?"🐑 Ovino" : "🐄 Bovino"}</td>
        <td data-label="Operação"><span class="badge ${badgeClass}">${escapeHtml(getHistoryOperationLabel(record.operation))}</span></td>
        <td data-label="Categoria">${escapeHtml(record.categoryName)}</td>
        <td data-label="Qtd.">${formatInteger(record.quantity)}</td>
        <td data-label="Registro">${escapeHtml(record.details || "—")}${record.kind === "movement" ?getMovementPhotoFlagMarkup(record.raw) : ""}</td>
        <td class="movement-actions-cell">${actionButtons}</td>
      </tr>
    `;
  }).join("");

  elements.movementsTableBody.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => openEditMovementDialog(btn.dataset.farmId, btn.dataset.movementId));
  });
  elements.movementsTableBody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteMovement(btn.dataset.farmId, btn.dataset.movementId));
  });
  elements.movementsTableBody.querySelectorAll(".edit-sanitary-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSanitaryEditor(btn.dataset.editSanitaryId));
  });
}

function revertMovementEffect(farm, movement) {
  let category = farm.categories.find((c) => c.id === movement.categoryId);
  if (!category && movement.categoryName) {
    // ID antigo pode estar obsoleto — tenta por nome como fallback
    category = farm.categories.find((c) => c.name.toLowerCase() === movement.categoryName.toLowerCase());
  }
  if (!category) return;

  if (movement.type === "transferencia") {
    // Reverse allocation only
    ensureCategoryAllocation(category);
    const originId = movement.potreiro || UNALLOCATED_POTREIRO_KEY;
    const destId = movement.potreiroDest || UNALLOCATED_POTREIRO_KEY;
    category.allocation[originId] = (Number(category.allocation[originId] || 0)) + movement.quantity;
    category.allocation[destId] = Math.max(0, (Number(category.allocation[destId] || 0)) - movement.quantity);
  } else if (movement.delta !== 0) {
    // Reverse stock delta
    category.quantity -= movement.delta;
    ensureCategoryAllocation(category);
    const potreirosId = movement.potreiro || UNALLOCATED_POTREIRO_KEY;
    if (movement.delta > 0) {
      category.allocation[potreirosId] = Math.max(0, (Number(category.allocation[potreirosId] || 0)) - movement.quantity);
    } else {
      category.allocation[potreirosId] = (Number(category.allocation[potreirosId] || 0)) + movement.quantity;
    }
  }
  updatePotreroQuantitiesFromAllocation(farm);
}

function deleteMovement(farmId, movementId) {
  const farm = state.data.farms[farmId];
  if (!farm) return;
  const movement = farm.movements.find((m) => m.id === movementId);
  if (!movement) return;

  const label = `${capitalize(movement.type)} de ${formatInteger(movement.quantity)} ${movement.categoryName} em ${formatDate(movement.date)}`;
  if (!confirm(`Excluir este lançamento?\n\n${label}\n\nO estoque da categoria será revertido.`)) return;

  revertMovementEffect(farm, movement);
  logAuditEvent("Exclusão", "movimentação", label, {
    farmId: farm.id,
    farmName: farm.name,
    recordCode: movement.code || ""
  });
  farm.movements = farm.movements.filter((m) => m.id !== movementId);
  saveData();
  render();
}

function openEditMovementDialog(farmId, movementId) {
  const farm = state.data.farms[farmId];
  if (!farm) return;
  const movement = farm.movements.find((m) => m.id === movementId);
  if (!movement) return;

  runtime.editingMovement = { farmId, movementId };

  syncMovementFarmOptions(farmId);
  if (elements.movementFarmWrap) {
    elements.movementFarmWrap.hidden = true;
  }
  // Popula opções sem definir os valores ainda — updateMovementFormForType pode sobrescrever
  syncMovementTypeOptions(movement.type);
  syncMovementCategoryOptionsForFarm(farm);
  syncMovementPotreirosOptions();

  elements.movementDate.value = movement.date;
  elements.movementQuantity.value = movement.quantity;
  elements.adjustDirection.value = movement.delta >= 0 ?"add" : "sub";
  elements.movementNotes.value = movement.notes || "";

  if (movement.type === "venda" && movement.saleDetails) {
    const d = movement.saleDetails;
    if (elements.movementSaleMode) elements.movementSaleMode.value = d.mode || "vivo";
    if (d.mode === "carcaca") {
      if (elements.movementCarcassPrice) elements.movementCarcassPrice.value = d.pricePerKg || "";
      if (elements.movementCarcassKg) elements.movementCarcassKg.value = d.weightKg || "";
    } else {
      if (elements.movementLivePrice) elements.movementLivePrice.value = d.pricePerKg || "";
      if (elements.movementLiveKg) elements.movementLiveKg.value = d.weightKg || "";
    }
    if (elements.movSaleBuyer) elements.movSaleBuyer.value = d.buyer || "";
    if (elements.movSaleYieldPct) elements.movSaleYieldPct.value = d.yieldPct || "";
  }

  if (movement.type === "compra" && movement.purchaseDetails) {
    const p = movement.purchaseDetails;
    if (elements.movPurchaseSource) elements.movPurchaseSource.value = p.sourceProperty || "";
    if (elements.movPurchaseAvgWeight) elements.movPurchaseAvgWeight.value = p.avgWeight || "";
    if (elements.movPurchaseTotalWeight) {
      const tw = Number(p.totalWeight || 0);
      elements.movPurchaseTotalWeight.value = tw > 0 ? tw.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " kg" : "";
      delete elements.movPurchaseTotalWeight.dataset.manualEdit;
    }
    if (elements.movPurchasePricePerKg) elements.movPurchasePricePerKg.value = p.pricePerKg || "";
    if (elements.movPurchaseValuePerHead) elements.movPurchaseValuePerHead.value = p.valuePerHead || "";
  }

  if (movement.potreiro && elements.movementPotreiro) {
    elements.movementPotreiro.value = movement.potreiro;
  }
  if (movement.potreiroDest && elements.movementPotreiroDest) {
    elements.movementPotreiroDest.value = movement.potreiroDest;
  }

  resetMovementPhotoDrafts();
  updateMovementFormForType(movement.type);

  // Tipo e categoria definidos por ÚLTIMO — após updateMovementFormForType para nada sobrescrever
  elements.movementType.value = movement.type;
  let categoryResolved = false;
  if (elements.movementCategory) {
    elements.movementCategory.value = movement.categoryId;
    categoryResolved = Array.from(elements.movementCategory.options).some(
      (o) => o.value === movement.categoryId && o.value !== ""
    );
    if (!categoryResolved && movement.categoryName) {
      // Fallback: match exato por nome
      const byName = farm.categories.find(
        (c) => c.name.toLowerCase() === movement.categoryName.toLowerCase()
      );
      if (byName) {
        elements.movementCategory.value = byName.id;
        categoryResolved = true;
      }
    }
    if (!categoryResolved) {
      // Categoria original não encontrada — deixa seleção vazia e avisa o usuário
      elements.movementCategory.value = "";
    }
  }

  // Restaura valor após updateMovementFormForType (limpa campos não-compra/venda)
  if (movement.type !== "venda") {
    elements.movementValue.value = movement.value || "";
  }

  // Tipo sempre travado; categoria só trava se foi resolvida
  elements.movementType.classList.add("select-locked");
  if (elements.movementCategory) {
    if (categoryResolved) {
      elements.movementCategory.classList.add("select-locked");
    } else {
      elements.movementCategory.classList.remove("select-locked");
    }
  }

  // Aviso quando a categoria original não existe mais nas categorias da fazenda
  const catHintWrap = document.getElementById("movCategoryTotalWrap");
  const catHint = document.getElementById("movCategoryTotalHint");
  if (!categoryResolved && catHintWrap && catHint && movement.categoryName) {
    catHint.innerHTML = `<span style="color:#b45309">⚠ Categoria original "<strong>${escapeHtml(movement.categoryName)}</strong>" não encontrada — selecione a equivalente acima.</span>`;
    catHintWrap.hidden = false;
  }

  // Bloqueia quantidade — edição não altera estoque
  elements.movementQuantity.classList.add("select-locked");
  elements.movementQuantity.readOnly = true;

  // Aviso de modo edição
  const editNotice = document.getElementById("movEditNotice");
  if (editNotice) editNotice.hidden = false;

  // Cotação USD (se disponível no registro)
  syncUsdRateVisibility();
  const storedRate = movement.saleDetails?.exchangeRate || movement.purchaseDetails?.exchangeRate || null;
  if (elements.movUsdRate && !elements.movUsdRateWrap?.hidden) {
    elements.movUsdRate.value = storedRate || "";
    updateUsdBrlEquiv();
  }

  elements.movementDialogTitle.textContent = `Editar ${capitalize(movement.type)}`;
  elements.movementDialog.showModal();
}

function getFilteredSaleMovements(farm, year, month, especie = state.filters.especie) {
  return farm.movements
    .filter((movement) => {
      if (movement.type !== "venda") {
        return false;
      }

      const movementDate = new Date(movement.date);
      const movementYear = String(movementDate.getFullYear());
      const movementMonth = String(movementDate.getMonth() + 1).padStart(2, "0");
      const matchesYear = movementYear === String(year);
      const matchesMonth = month === "all" || movementMonth === month;
      const matchesSpecies = especie === "todas" || (movement.especie || "bovino") === especie;
      return matchesYear && matchesMonth && matchesSpecies;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getSanitarySummary(farm, year = state.filters.year, month = state.filters.month) {
  const records = getFilteredSanitaryRecords(farm, year, month);
  return {
    totalApplications: records.length,
    treatedAnimals: records.reduce((sum, record) => sum + Number(record.quantity || 0), 0),
    uniqueProducts: new Set(records.map((record) => record.product)).size,
    uniquePotreiros: new Set(records.map((record) => record.potreiro)).size,
    latestRecord: [...records].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  };
}

function summarizeSalePeriod(farm, year, month) {
  const movements = getFilteredSaleMovements(farm, year, month);
  return movements.reduce((summary, movement) => {
    const detail = movement.saleDetails || {};
    summary.count += 1;
    summary.totalValue += Number(movement.value || 0);
    if ((detail.mode || "vivo") === "carcaca") {
      summary.carcassKg += Number(detail.weightKg || 0);
    } else {
      summary.liveKg += Number(detail.weightKg || 0);
    }
    summary.movements.push(movement);
    return summary;
  }, { count: 0, totalValue: 0, liveKg: 0, carcassKg: 0, movements: [] });
}

function getFilteredPurchaseMovements(farm, year, month, especie = state.filters.especie) {
  return farm.movements
    .filter((movement) => {
      if (movement.type !== "compra") return false;
      const movementDate = new Date(movement.date);
      const movementYear = String(movementDate.getFullYear());
      const movementMonth = String(movementDate.getMonth() + 1).padStart(2, "0");
      const matchesYear = movementYear === String(year);
      const matchesMonth = month === "all" || movementMonth === month;
      const matchesSpecies = especie === "todas" || (movement.especie || "bovino") === especie;
      return matchesYear && matchesMonth && matchesSpecies;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function summarizePurchasePeriod(farm, year, month) {
  const movements = getFilteredPurchaseMovements(farm, year, month);
  return movements.reduce((summary, movement) => {
    summary.count += 1;
    summary.totalAnimals += Number(movement.quantity || 0);
    summary.totalValue += Number(movement.value || 0);
    summary.movements.push(movement);
    return summary;
  }, { count: 0, totalAnimals: 0, totalValue: 0, movements: [] });
}

function getSaleModeLabel(mode) {
  return mode === "carcaca" ?"Kg carcaça" : "Kg vivo";
}

function getOperationalInsights(farm, year = state.filters.year, month = state.filters.month) {
  const total = getFarmTotal(farm);
  const biggestCategory = [...farm.categories].sort((a, b) => b.quantity - a.quantity)[0];
  const annual = summarizePeriod(farm, year, "all");
  const monthly = summarizePeriod(farm, year, month);
  const mortalityRate = total > 0 ?((annual.byType.morte / total) * 100).toFixed(2) : "0.00";

  return [
    {
      tag: "Maior lote",
      title: biggestCategory ?biggestCategory.name : "Sem dados",
      text: biggestCategory ?`${formatInteger(biggestCategory.quantity)} animais, representando ${(biggestCategory.quantity / Math.max(total, 1) * 100).toFixed(1)}% do rebanho atual.` : "Cadastre categorias para visualizar concentracao do rebanho."
    },
    {
      tag: "Saude do manejo",
      title: `${mortalityRate}% de mortalidade`,
      text: `Taxa calculada a partir das mortes registradas em ${year}.`
    },
    {
      tag: "Recorte ativo",
      title: monthly.totalMovements ?`${monthly.totalMovements} lançamentos no período` : "Sem lançamentos no período",
      text: month === "all" ?`Visão consolidada do ano de ${year}.` : `Leitura mensal de ${MONTH_NAMES[Number(month) - 1]} de ${year}.`
    }
  ];
}

function getMovementNotes(movement) {
  const notes = movement.notes || "";
  if (movement.type !== "venda" || !movement.saleDetails) {
    return notes || "-";
  }

  const detail = movement.saleDetails;
  const saleText = `${getSaleModeLabel(detail.mode)}: ${formatWeight(detail.weightKg)} x ${formatCurrency(detail.pricePerKg)}`;
  return notes ?`${saleText}. ${notes}` : saleText;
}

function renderSanitarySummary(farm) {
  const { totalApplications, treatedAnimals, uniqueProducts, uniquePotreiros, latestRecord } = getSanitarySummary(farm);
  const records = getFilteredSanitaryRecords(farm);

  // Most used product
  const productCount = {};
  records.forEach((r) => { productCount[r.product] = (productCount[r.product] || 0) + 1; });
  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];

  // Most treated category
  const catCount = {};
  records.forEach((r) => { catCount[r.categoryName] = (catCount[r.categoryName] || 0) + (r.quantity || 0); });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

  const cards = [
    { title: "Aplicações no período", value: formatInteger(totalApplications), detail: "registros sanitários no filtro ativo" },
    { title: "Animais tratados", value: formatInteger(treatedAnimals), detail: "cabeças somadas nos registros" },
    { title: "Produtos distintos", value: formatInteger(uniqueProducts), detail: "clique para ver os produtos aplicados", action: "products" },
    { title: "Produto mais usado", value: topProduct ?escapeHtml(topProduct[0]) : "—", detail: topProduct ?`${topProduct[1]} aplicação(ões)` : "sem registros no período" },
    { title: "Categoria mais tratada", value: topCat ?escapeHtml(topCat[0]) : "—", detail: topCat ?`${formatInteger(topCat[1])} cabeças no período` : "sem registros no período" },
    { title: "Último manejo", value: latestRecord ?formatDate(latestRecord.date) : "—", detail: latestRecord ?latestRecord.product : "nenhum registro disponível" }
  ];

  elements.sanitarySummary.innerHTML = cards.map((card) => `
    <article class="analytics-card ${card.action ?"analytics-card-clickable" : ""}" ${card.action ?`role="button" tabindex="0" data-sanitary-summary-action="${card.action}"` : ""}>
      <p class="panel-kicker">${card.title}</p>
      <strong>${card.value}</strong>
      <p>${card.detail}</p>
    </article>
  `).join("");
  elements.sanitarySummary.querySelectorAll("[data-sanitary-summary-action='products']").forEach((card) => {
    card.addEventListener("click", () => openSanitaryProductsDialog(farm));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openSanitaryProductsDialog(farm);
      }
    });
  });
}

function getSanitaryProductUsage(farm) {
  const rows = new Map();
  getFilteredSanitaryRecords(farm).forEach((record) => {
    const product = record.product || "Sem produto";
    const current = rows.get(product) || { product, applications: 0, animals: 0, latestDate: "" };
    current.applications += 1;
    current.animals += Number(record.quantity || 0);
    if (!current.latestDate || record.date > current.latestDate) current.latestDate = record.date;
    rows.set(product, current);
  });
  return [...rows.values()].sort((a, b) => b.applications - a.applications || a.product.localeCompare(b.product));
}

function openSanitaryProductsDialog(farm) {
  let dialog = document.getElementById("sanitaryProductsDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "sanitaryProductsDialog";
    dialog.className = "modal";
    document.body.appendChild(dialog);
  }
  const rows = getSanitaryProductUsage(farm);
  dialog.innerHTML = `
    <div class="modal-card sanitary-products-modal">
      <div class="modal-header">
        <div>
          <p class="panel-kicker">Produtos aplicados</p>
          <h2>${escapeHtml(farm.name || "Fazenda")}</h2>
        </div>
        <button type="button" class="ghost-btn" data-close-products-dialog>Fechar</button>
      </div>
      <div class="table-wrap">
        <table class="sanitary-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Aplicações</th>
              <th>Animais tratados</th>
              <th>Última aplicação</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length ?rows.map((row) => `
              <tr>
                <td><strong>${escapeHtml(row.product)}</strong></td>
                <td>${formatInteger(row.applications)}</td>
                <td>${formatInteger(row.animals)}</td>
                <td>${row.latestDate ?formatDate(row.latestDate) : "—"}</td>
              </tr>
            `).join("") : `<tr><td colspan="4" class="table-empty-cell">Nenhum produto aplicado no período.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
  dialog.querySelector("[data-close-products-dialog]")?.addEventListener("click", () => dialog.close());
  dialog.showModal();
}

function resetSanitaryTableFilters() {
  runtime.sanitaryFarmFilter = "all";
  runtime.sanitaryDateFilter = "";
  runtime.sanitaryPotreroFilter = "all";
  runtime.sanitaryCategoryFilter = "all";
  runtime.sanitaryProductFilter = "all";
}

function setSanitarySelectOptions(select, options, selectedValue, allLabel) {
  if (!select) {
    return;
  }

  const normalizedOptions = Array.from(new Set(options.filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const validValues = new Set(["all", ...normalizedOptions]);
  const nextValue = validValues.has(selectedValue) ?selectedValue : "all";

  select.innerHTML = [
    `<option value="all">${escapeHtml(allLabel)}</option>`,
    ...normalizedOptions.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
  ].join("");
  select.value = nextValue;
}

function syncSanitaryHistoryFilters(allRecords, farm, isTotalView) {
  const farmOptions = isTotalView
    ?allRecords.map((record) => record._farmName)
    : (farm?.name ?[farm.name] : []);
  const potreroOptions = allRecords.map((record) => record.potreiro || "Sem potreiro");
  const categoryOptions = allRecords.map((record) => record.categoryName || "");
  const productOptions = allRecords.map((record) => record.product || "");

  setSanitarySelectOptions(elements.sanitaryFilterFarm, farmOptions, runtime.sanitaryFarmFilter, "Todas as fazendas");
  setSanitarySelectOptions(elements.sanitaryFilterPotrero, potreroOptions, runtime.sanitaryPotreroFilter, "Todos os potreiros");
  setSanitarySelectOptions(elements.sanitaryFilterCategory, categoryOptions, runtime.sanitaryCategoryFilter, "Todas as categorias");
  setSanitarySelectOptions(elements.sanitaryFilterProduct, productOptions, runtime.sanitaryProductFilter, "Todos os produtos");

  if (elements.sanitaryFilterDate) {
    elements.sanitaryFilterDate.value = runtime.sanitaryDateFilter;
  }

  if (elements.sanitaryFilterFarm) {
    runtime.sanitaryFarmFilter = elements.sanitaryFilterFarm.value || "all";
    elements.sanitaryFilterFarm.disabled = !isTotalView;
    elements.sanitaryFilterFarm.onchange = (event) => {
      runtime.sanitaryFarmFilter = event.target.value || "all";
      runtime.sanitaryPage = 0;
      renderSanitaryTable(getFarm());
    };
  }

  if (elements.sanitaryFilterDate) {
    elements.sanitaryFilterDate.oninput = (event) => {
      runtime.sanitaryDateFilter = event.target.value || "";
      runtime.sanitaryPage = 0;
      renderSanitaryTable(getFarm());
    };
  }

  if (elements.sanitaryFilterPotrero) {
    runtime.sanitaryPotreroFilter = elements.sanitaryFilterPotrero.value || "all";
    elements.sanitaryFilterPotrero.onchange = (event) => {
      runtime.sanitaryPotreroFilter = event.target.value || "all";
      runtime.sanitaryPage = 0;
      renderSanitaryTable(getFarm());
    };
  }

  if (elements.sanitaryFilterCategory) {
    runtime.sanitaryCategoryFilter = elements.sanitaryFilterCategory.value || "all";
    elements.sanitaryFilterCategory.onchange = (event) => {
      runtime.sanitaryCategoryFilter = event.target.value || "all";
      runtime.sanitaryPage = 0;
      renderSanitaryTable(getFarm());
    };
  }

  if (elements.sanitaryFilterProduct) {
    runtime.sanitaryProductFilter = elements.sanitaryFilterProduct.value || "all";
    elements.sanitaryFilterProduct.onchange = (event) => {
      runtime.sanitaryProductFilter = event.target.value || "all";
      runtime.sanitaryPage = 0;
      renderSanitaryTable(getFarm());
    };
  }

  if (elements.clearSanitaryFiltersButton) {
    elements.clearSanitaryFiltersButton.onclick = () => {
      runtime.sanitarySearch = "";
      resetSanitaryTableFilters();
      runtime.sanitaryPage = 0;
      renderSanitaryTable(getFarm());
    };
  }
}

const SANITARY_PAGE_SIZE = 50;

function renderSanitaryTable(farm) {
  const isTotalView = farm.id === TOTAL_FARM_ID;

  // Build full sorted list with farmId attached — sem filtro de ano para exibir todos os registros
  let allRecords;
  if (isTotalView) {
    allRecords = getAllFarms().flatMap((f) =>
      (f.sanitaryRecords || []).map((r) => ({ ...r, _farmId: f.id, _farmName: f.name }))
    );
  } else {
    allRecords = (farm.sanitaryRecords || []).map((r) => ({ ...r, _farmId: farm.id, _farmName: farm.name }));
  }
  allRecords = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
  syncSanitaryHistoryFilters(allRecords, farm, isTotalView);

  const structurallyFiltered = allRecords.filter((record) => {
    const matchesFarm = runtime.sanitaryFarmFilter === "all" || (record._farmName || "") === runtime.sanitaryFarmFilter;
    const matchesDate = !runtime.sanitaryDateFilter || record.date === runtime.sanitaryDateFilter;
    const matchesPotrero = runtime.sanitaryPotreroFilter === "all" || (record.potreiro || "Sem potreiro") === runtime.sanitaryPotreroFilter;
    const matchesCategory = runtime.sanitaryCategoryFilter === "all" || (record.categoryName || "") === runtime.sanitaryCategoryFilter;
    const matchesProduct = runtime.sanitaryProductFilter === "all" || (record.product || "") === runtime.sanitaryProductFilter;
    return matchesFarm && matchesDate && matchesPotrero && matchesCategory && matchesProduct;
  });

  // Search filter
  const query = runtime.sanitarySearch.trim().toLowerCase();
  const filtered = query
    ?structurallyFiltered.filter((r) =>
        (r.code || "").toLowerCase().includes(query) ||
        (r.product || "").toLowerCase().includes(query) ||
        (r.categoryName || "").toLowerCase().includes(query) ||
        (r.potreiro || "").toLowerCase().includes(query) ||
        (r.notes || "").toLowerCase().includes(query) ||
        (r._farmName || "").toLowerCase().includes(query)
      )
    : structurallyFiltered;

  const totalPages = Math.max(1, Math.ceil(filtered.length / SANITARY_PAGE_SIZE));
  if (runtime.sanitaryPage >= totalPages) runtime.sanitaryPage = totalPages - 1;
  const page = runtime.sanitaryPage;
  const records = filtered.slice(page * SANITARY_PAGE_SIZE, (page + 1) * SANITARY_PAGE_SIZE);

  // Wire search input
  const searchInput = document.getElementById("sanitaryHistorySearch");
  if (searchInput) {
    searchInput.value = runtime.sanitarySearch;
    searchInput.oninput = (e) => {
      runtime.sanitarySearch = e.target.value;
      runtime.sanitaryPage = 0;
      renderSanitaryTable(farm);
    };
  }

  // Render pagination
  const paginationEl = document.getElementById("sanitaryHistoryPagination");
  if (paginationEl) {
    paginationEl.innerHTML = `
      <span class="movements-count">${filtered.length} registro${filtered.length !== 1 ?"s" : ""}</span>
      ${totalPages > 1 ?`
        <button class="mov-page-btn" ${page === 0 ?"disabled" : ""} id="sanPrev">&#8249; Anterior</button>
        <span class="mov-page-info">Pág. ${page + 1}/${totalPages}</span>
        <button class="mov-page-btn" ${page >= totalPages - 1 ?"disabled" : ""} id="sanNext">Próxima &#8250;</button>
      ` : ""}
    `;
    document.getElementById("sanPrev")?.addEventListener("click", () => { runtime.sanitaryPage--; renderSanitaryTable(farm); });
    document.getElementById("sanNext")?.addEventListener("click", () => { runtime.sanitaryPage++; renderSanitaryTable(farm); });
  }

  if (!records.length) {
    const hasStructuredFilters = runtime.sanitaryFarmFilter !== "all"
      || Boolean(runtime.sanitaryDateFilter)
      || runtime.sanitaryPotreroFilter !== "all"
      || runtime.sanitaryCategoryFilter !== "all"
      || runtime.sanitaryProductFilter !== "all";
    elements.sanitaryTableBody.innerHTML = `<tr><td colspan="9" class="table-empty-cell">${query || hasStructuredFilters ? "Nenhum registro encontrado com os filtros aplicados." : "Nenhum registro sanitário cadastrado."}</td></tr>`;
    return;
  }

  elements.sanitaryTableBody.innerHTML = records.map((record) => {
    const code = record.code
      ?`<span class="movement-code san-code">${escapeHtml(record.code)}</span>`
      : record.sourceId?.startsWith("xls-san-")
        ?`<span class="movement-code movement-code-legacy">${escapeHtml("IMP-" + getFarmCodePrefix(record._farmId))}</span>`
        : `<span class="movement-code movement-code-legacy">—</span>`;
    const editId = record.id || record.sourceId;
    return `
      <tr>
        <td>${code}</td>
        <td data-label="Data">${formatDate(record.date)}</td>
        <td data-label="Fazenda"><span class="sanitary-origin manual">${escapeHtml(record._farmName)}</span></td>
        <td data-label="Categoria"><span class="cat-total-icon">${(record.especie || "bovino") === "ovino" ?"🐑" : "🐄"}</span> <strong>${escapeHtml(record.categoryName)}</strong></td>
        <td data-label="Qtd.">${formatMaybeQuantity(record.quantity)} cab.</td>
        <td data-label="Produto">
          <div class="sanitary-product-cell">
            <span class="san-product-badge">${escapeHtml(record.product)}</span>
          </div>
        </td>
        <td data-label="Potreiros">${escapeHtml(record.potreiro || "Sem potreiro")}</td>
        <td data-label="Obs.">${escapeHtml(record.notes || "—")}</td>
        <td data-label="Ações">
          <button type="button" class="table-action-btn" data-edit-sanitary-id="${escapeHtml(editId)}">Editar</button>
          <button type="button" class="table-action-btn table-action-btn-danger" data-delete-sanitary-id="${escapeHtml(editId)}">Excluir</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderSanitaryFarmBreakdown() {
  const el = document.getElementById("sanitaryFarmBreakdown");
  if (!el) return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  if (!isTotalView) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }

  const farms = getAllFarms();
  el.hidden = false;

  el.innerHTML = `
    <div class="panel san-breakdown-panel">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Visão por fazenda</p>
          <h2>Manejo sanitário — resumo consolidado</h2>
        </div>
        <span class="chip">${farms.length} fazendas</span>
      </div>
      <div class="san-breakdown-grid">
        ${farms.map((farm) => renderSanitaryFarmCard(farm)).join("")}
      </div>
    </div>
  `;

  el.querySelectorAll("[data-san-filter-farm]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const farmName = btn.dataset.sanFilterFarm;
      runtime.sanitaryFarmFilter = farmName;
      runtime.sanitaryPage = 0;
      renderSanitaryTable(getFarm());
      document.querySelector(".san-history-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderSanitaryFarmCard(farm) {
  const records = farm.sanitaryRecords || [];
  const sorted = [...records].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const lastRecord = sorted[0];
  const totalAnimals = records.reduce((s, r) => s + Number(r.quantity || 0), 0);

  const productCount = {};
  records.forEach((r) => {
    const p = r.product || "Sem produto";
    productCount[p] = (productCount[p] || 0) + 1;
  });
  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];

  const currency = FARM_CURRENCY_MAP[farm.id];
  const country = currency === "USD" ? "UY" : "BR";

  const recentRecords = sorted.slice(0, 3);

  return `
    <div class="san-farm-card">
      <div class="san-farm-card-hd">
        <strong class="san-farm-card-name">${escapeHtml(farm.name)}</strong>
        <span class="farm-btn-country">${country}</span>
      </div>

      <div class="san-farm-kpis">
        <div class="san-farm-kpi">
          <span class="san-kpi-val">${formatInteger(records.length)}</span>
          <span class="san-kpi-lbl">registros</span>
        </div>
        <div class="san-farm-kpi">
          <span class="san-kpi-val">${formatInteger(totalAnimals)}</span>
          <span class="san-kpi-lbl">aplicações</span>
        </div>
        <div class="san-farm-kpi">
          <span class="san-kpi-val">${Object.keys(productCount).length}</span>
          <span class="san-kpi-lbl">produtos</span>
        </div>
      </div>

      ${topProduct ? `
        <div class="san-farm-top-prod">
          <span class="san-top-label">Produto mais aplicado</span>
          <span class="san-top-name">${escapeHtml(topProduct[0])}</span>
          <span class="san-top-count">${topProduct[1]}× aplicado${topProduct[1] !== 1 ? "s" : ""}</span>
        </div>
      ` : ""}

      ${lastRecord ? `
        <div class="san-farm-last">
          <span class="san-last-label">Última aplicação</span>
          <span class="san-last-date">${formatDate(lastRecord.date)}</span>
          <span class="san-last-prod">${escapeHtml(lastRecord.product || "—")}</span>
          ${lastRecord.potreiro && lastRecord.potreiro !== "Sem potreiro" ? `<span class="san-last-potr">${escapeHtml(lastRecord.potreiro)}</span>` : ""}
        </div>
      ` : `<div class="san-farm-last"><span class="san-last-label">Sem registros</span></div>`}

      ${recentRecords.length > 1 ? `
        <div class="san-farm-recent">
          ${recentRecords.slice(1).map((r) => `
            <div class="san-recent-row">
              <span class="san-recent-date">${formatDate(r.date)}</span>
              <span class="san-recent-prod">${escapeHtml(r.product || "—")}</span>
              <span class="san-recent-qty">${formatInteger(r.quantity)} cab.</span>
            </div>
          `).join("")}
        </div>
      ` : ""}

      <button type="button" class="san-farm-cta-btn" data-san-filter-farm="${escapeHtml(farm.name)}">
        Ver todos os registros
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  `;
}

function renderSanitaryFarmSwitch() {
  if (!elements.sanitaryFarmSwitch) {
    return;
  }

  elements.sanitaryFarmSwitch.innerHTML = "";
  [
    { id: TOTAL_FARM_ID, name: "Todas as Fazendas" },
    ...getAllFarms().map((item) => ({ id: item.id, name: item.name }))
  ].forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `farm-btn ${item.id === state.data.selectedFarmId ? "active" : ""}`;
    button.textContent = item.name;
    button.addEventListener("click", () => {
      state.data.selectedFarmId = item.id;
      state.activeView = "sanitary";
      runtime.sanitaryPage = 0;
      saveData();
      render();
    });
    elements.sanitaryFarmSwitch.appendChild(button);
  });
}

function renderSanitaryComposerState(farm) {
  if (!elements.sanitaryViewNote || !elements.openSanitaryDialogButton) {
    return;
  }

  if (state.data.selectedFarmId === TOTAL_FARM_ID) {
    elements.openSanitaryDialogButton.disabled = true;
    elements.sanitaryViewNote.textContent = "No consolidado total, os registros sanitários aparecem agrupados. Selecione uma fazenda para lançar ou editar um manejo.";
    return;
  }

  elements.openSanitaryDialogButton.disabled = false;
  elements.sanitaryViewNote.textContent = `Manejo sanitário ativo para ${farm.name}. Os dados abaixo consideram apenas a fazenda selecionada.`;
}

function renderMonthlySummary(farm) {
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  if (elements.monthlySummarySection) {
    elements.monthlySummarySection.hidden = isTotalView;
  }
  if (isTotalView) return;
  const summary = getMonthlySummary(farm);
  const cards = [
    {
      title: "Registros mensais",
      value: formatInteger(summary.count),
      detail: "entradas alinhadas ao relatório mensal filtrado"
    },
    {
      title: "Quantidade informada",
      value: formatInteger(summary.totalQuantity),
      detail: "somatório dos números mensais cadastrados"
    },
    {
      title: "Valor atribuído",
      value: formatCurrency(summary.totalValue),
      detail: "valores monetários associados ao período"
    },
    {
      title: "Categorias ativas",
      value: formatInteger(summary.activeCategories),
      detail: "blocos do relatório mensal em uso"
    }
  ];

  elements.monthlySummaryGrid.innerHTML = cards.map((card) => `
    <article class="analytics-card">
      <p class="panel-kicker">${card.title}</p>
      <strong>${card.value}</strong>
      <p>${card.detail}</p>
    </article>
  `).join("");

  if (!hasMeaningfulMonthlyData(summary)) {
    elements.monthlySummaryGrid.insertAdjacentHTML("beforeend", `
      <article class="analytics-card analytics-card-empty">
        <p class="panel-kicker">Sem dados no recorte</p>
        <strong>0</strong>
        <p>Nenhum dado mensal encontrado para o filtro atual. Ajuste ano, mes ou cadastre novos dados mensais.</p>
      </article>
    `);
  }
}

function renderMonthlyProtocol(farm) {
  if (!elements.monthlyProtocolList) return;
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  if (elements.monthlyProtocolSection) {
    elements.monthlyProtocolSection.hidden = isTotalView;
  }
  if (isTotalView) return;

  const records = [...getFilteredMonthlyRecords(farm)].sort((a, b) => {
    if (a.period !== b.period) return a.period < b.period ?1 : -1;
    return a.title.localeCompare(b.title);
  });

  if (elements.monthlyProtocolCount) {
    elements.monthlyProtocolCount.textContent = `${records.length} registro${records.length !== 1 ?"s" : ""}`;
  }

  if (!records.length) {
    elements.monthlyProtocolList.innerHTML = `
      <div class="protocol-empty">
        <p>Nenhum protocolo encontrado para o recorte selecionado.</p>
      </div>
    `;
    return;
  }

  const CATEGORY_ICONS = {
    estoque: "🐄",
    sanitario: "💉",
    comercial: "💰",
    operacional: "⚙️",
    outros: "📋"
  };

  elements.monthlyProtocolList.innerHTML = records.map((record) => {
    const icon = CATEGORY_ICONS[record.category] || "📋";
    const farmLabel = record.farmName || farm.name;
    return `
      <div class="protocol-row">
        <div class="protocol-icon">${icon}</div>
        <div class="protocol-body">
          <div class="protocol-meta">
            <span class="protocol-farm">${escapeHtml(farmLabel)}</span>
            <span class="protocol-period">${formatMonthYear(record.period)}</span>
            <span class="protocol-category">${escapeHtml(getMonthlyCategoryLabel(record.category))}</span>
          </div>
          <strong class="protocol-title">${escapeHtml(record.title)}</strong>
          ${record.notes ?`<p class="protocol-notes">${escapeHtml(record.notes)}</p>` : ""}
        </div>
        <div class="protocol-values">
          ${record.quantity ?`<span class="protocol-qty">${formatInteger(record.quantity)} cab.</span>` : ""}
          ${record.value ?`<span class="protocol-val">${formatCurrency(record.value)}</span>` : ""}
        </div>
        <button type="button" class="table-action-btn protocol-edit-btn" data-edit-monthly-id="${record.id}">Editar</button>
      </div>
    `;
  }).join("");
}

function handleMonthlyTableInteraction(event) {
  const trigger = event.target.closest("[data-edit-monthly-id]");
  if (!trigger) {
    return;
  }

  openMonthlyDataEditor(trigger.dataset.editMonthlyId);
}


function renderPotreirosView() {
  const farms = getAllFarms();
  elements.potreirosAccordion.innerHTML = farms.map((farm) => {
    const potreiros = getPotreroTotals(farm);
    const totalAnimals = getFarmTotal(farm);
    const allocated = potreiros.reduce((sum, p) => sum + p.quantity, 0);
    const balance = totalAnimals - allocated;

    const potreirosHtml = potreiros.length
      ?potreiros.map((p) => `
          <article class="potrero-card">
            <div class="potrero-card-bar" style="width:${Math.min(p.share, 100).toFixed(1)}%"></div>
            <p class="panel-kicker">${escapeHtml(p.name)}</p>
            <strong>${formatInteger(p.quantity)}</strong>
            <p>${p.share.toFixed(1)}% do rebanho</p>
            <button type="button" class="potr-manej-btn"
              data-potr-manej-farm="${escapeHtml(farm.id)}"
              data-potr-manej-id="${escapeHtml(p.id)}">
              Transferir animais
            </button>
          </article>
        `).join("")
      : `<p class="field-note" style="padding:12px 0">Nenhum potreiro cadastrado. Use "Editar estoque" para cadastrar.</p>`;

    const balanceHtml = potreiros.length ?`
      <article class="potrero-card potrero-card-highlight">
        <p class="panel-kicker">${balance === 0 ?"Conferência" : balance > 0 ?"Sem potreiro" : "Excedente"}</p>
        <strong>${balance === 0 ?"✓ OK" : (balance > 0 ?"+" : "") + formatInteger(balance)}</strong>
        <p>${balance === 0 ?"Distribuição conferida." : balance > 0 ?`${formatInteger(balance)} ainda não alocados.` : `${formatInteger(Math.abs(balance))} acima do estoque.`}</p>
        ${balance > 0 ?`<button type="button" class="potr-manej-btn" data-potr-manej-farm="${escapeHtml(farm.id)}" data-potr-manej-id="${UNALLOCATED_POTREIRO_KEY}">Alocar animais</button>` : ""}
      </article>
    ` : "";

    return `
      <div class="potreiros-farm-item">
        <button type="button" class="potreiros-farm-header" data-toggle-farm="${escapeHtml(farm.id)}">
          <div class="potreiros-farm-header-copy">
            <strong>${escapeHtml(farm.name)}</strong>
            <span>${formatInteger(totalAnimals)} animais &middot; ${potreiros.length} potreiro(s) &middot; ${formatInteger(allocated)} alocados</span>
          </div>
          <span class="potreiros-farm-chevron">&#8250;</span>
        </button>
        <div class="potreiros-farm-body" id="potreiros-body-${escapeHtml(farm.id)}" hidden>
          <div class="potrero-grid potrero-grid-compact">${potreirosHtml}${balanceHtml}</div>
        </div>
      </div>
    `;
  }).join("");

}

// ── Potreiro Management Dialog ─────────────────────────────────────────────

function openPotrManejDialog(farmId, potreirosId) {
  const farm = state.data.farms[farmId];
  if (!farm) return;
  const isUnallocated = potreirosId === UNALLOCATED_POTREIRO_KEY;
  const potrero = isUnallocated ? null : getPotreroEntries(farm).find((p) => p.id === potreirosId);
  const farmTotal = getFarmTotal(farm);
  const allocatedTotal = getRegisteredPotreroAnimals(farm);
  const farmBalance = Math.max(0, farmTotal - allocatedTotal);
  const potreroName = isUnallocated ? "Sem potreiro" : (potrero ?potrero.name : "Sem potreiro");
  const potreroQty = isUnallocated ? farmBalance : (potrero ?normalizePotreroQuantity(potrero.quantity) : 0);
  const unallocated = farmBalance;

  runtime.potrManej = { farmId, potreirosId, type: "transferencia", photoDrafts: [] };

  elements.potrManejFarmKicker.textContent = farm.name;
  elements.potrManejDlgTitle.textContent = isUnallocated ? `Alocar animais — Sem potreiro` : `Transferência — ${potreroName}`;
  elements.potrManejFarmTotal.textContent = formatInteger(farmTotal);
  elements.potrManejPotrTotal.textContent = formatInteger(potreroQty);
  elements.potrManejUnallocated.textContent = formatInteger(Math.max(0, unallocated));

  // Reset form
  elements.potrManejDate.value = new Date().toISOString().slice(0, 10);
  elements.potrManejQty.value = "";
  if (elements.potrManejValue) elements.potrManejValue.value = "";
  elements.potrManejNotes.value = "";
  if (elements.potrManejPhotos) elements.potrManejPhotos.value = "";
  if (elements.potrManejPhotoPreview) elements.potrManejPhotoPreview.innerHTML = "";
  if (elements.potrManejPhotoPanel) elements.potrManejPhotoPanel.hidden = true;
  if (elements.potrManejPhotoCounter) elements.potrManejPhotoCounter.textContent = "Nenhuma foto anexada.";

  if (elements.potrActionTabs) {
    elements.potrActionTabs.querySelectorAll(".potr-action-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.manej === "transferencia");
    });
  }

  // Populate categories — when source is unallocated, show available (unallocated) qty per category
  elements.potrManejCategory.innerHTML = farm.categories.map((c) => {
    let disponivel = c.quantity;
    if (isUnallocated) {
      const alloc = c.allocation || {};
      const alocado = Object.entries(alloc)
        .filter(([k]) => k !== UNALLOCATED_POTREIRO_KEY)
        .reduce((s, [, v]) => s + Number(v || 0), 0);
      disponivel = Math.max(0, c.quantity - alocado);
    }
    return `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${formatInteger(disponivel)} disp.)</option>`;
  }).join("");

  // Populate destination farms (all farms except current)
  const allFarms = getAllFarms();
  elements.potrManejDestFarm.innerHTML = [
    `<option value="${escapeHtml(farmId)}">Mesma fazenda (${escapeHtml(farm.name)})</option>`,
    ...allFarms.filter((f) => f.id !== farmId).map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)}</option>`)
  ].join("");
  syncPotrManejDestFarmPotreiros();

  syncPotrManejForm();
  elements.potrManejoDlg.showModal();
}

function syncPotrManejDestFarmPotreiros() {
  const destFarmId = elements.potrManejDestFarm.value;
  const destFarm = state.data.farms[destFarmId];
  const originFarmId = runtime.potrManej.farmId;
  const originPotreroId = runtime.potrManej.potreirosId || UNALLOCATED_POTREIRO_KEY;
  const isSameFarm = !destFarmId || destFarmId === originFarmId;

  if (!destFarm) {
    elements.potrManejDestPotr.innerHTML = `<option value="${UNALLOCATED_POTREIRO_KEY}">Sem potreiro</option>`;
    return;
  }

  const isSourceUnallocated = originPotreroId === UNALLOCATED_POTREIRO_KEY;
  const opts = getPotreroEntries(destFarm)
    .filter((p) => !isSameFarm || p.id !== originPotreroId)
    .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${formatInteger(p.quantity)})</option>`);

  if (isSameFarm && !isSourceUnallocated) {
    opts.unshift(`<option value="${UNALLOCATED_POTREIRO_KEY}">Sem potreiro</option>`);
  }

  elements.potrManejDestPotr.innerHTML = opts.join("") || `<option value="${UNALLOCATED_POTREIRO_KEY}">Sem potreiro</option>`;
}

function syncPotrManejForm() {
  {
    runtime.potrManej.type = "transferencia";
    const farmId = runtime.potrManej.farmId;
    const destFarmId = elements.potrManejDestFarm.value;
    const isSameFarm = !destFarmId || destFarmId === farmId;

    elements.potrManejDestFarmWrap.hidden = false;
    elements.potrManejDestPotrWrap.hidden = false;
    if (elements.potrManejDestFarmPotrWrap) elements.potrManejDestFarmPotrWrap.hidden = true;
    if (elements.potrManejValueWrap) elements.potrManejValueWrap.hidden = true;
    if (elements.potrManejPhotoWrap) elements.potrManejPhotoWrap.hidden = true;
    if (elements.potrManejPhotoPanel) elements.potrManejPhotoPanel.hidden = true;

    elements.potrManejDestPotrLabel.textContent = isSameFarm ?"Potreiro de destino" : "Potreiro de destino na fazenda selecionada";
    elements.potrManejSubmit.textContent = "Registrar transferência";
    elements.potrManejSubmit.className = "action-btn secondary";
    return;
  }
  const type = runtime.potrManej.type;
  const isAdd = type === "adicionar";
  const isTransfer = type === "transferencia";
  const isSale = type === "venda";
  const isDeath = type === "morte";
  const isConsume = type === "consumo";
  const isRetorno = type === "retorno";
  const farmId = runtime.potrManej.farmId;
  const potreirosId = runtime.potrManej.potreirosId;

  // Destination potreiro: shown for adicionar and intra-farm transfer (not retorno — dest is always unallocated)
  elements.potrManejDestPotrWrap.hidden = !isAdd && !isTransfer;
  if (isAdd) {
    elements.potrManejDestPotrLabel.textContent = "Potreiro de destino";
    // Pre-select current potrero
    elements.potrManejDestPotr.value = potreirosId || "";
  } else if (isTransfer) {
    elements.potrManejDestPotrLabel.textContent = "Potreiro de destino (mesma fazenda)";
    // Select a different potreiro than origin
    const opts = Array.from(elements.potrManejDestPotr.options);
    const other = opts.find((o) => o.value !== potreirosId);
    if (other) elements.potrManejDestPotr.value = other.value;
  }

  // Destination farm: only for transfer
  elements.potrManejDestFarmWrap.hidden = !isTransfer;
  // Dest farm potreiro: only for inter-farm transfer
  const destFarmId = elements.potrManejDestFarm.value;
  elements.potrManejDestFarmPotrWrap.hidden = !isTransfer || destFarmId === farmId;

  // Value: only for venda
  elements.potrManejValueWrap.hidden = !isSale;

  // Photo: only for morte
  elements.potrManejPhotoWrap.hidden = !isDeath;

  // Submit button label + color
  const labels = { adicionar: "Adicionar ao Rebanho", transferencia: "Registrar Transferência", venda: "Registrar Venda", morte: "Registrar Morte", consumo: "Registrar Abate", retorno: "Retornar ao Total" };
  const classes = { adicionar: "purchase", transferencia: "secondary", venda: "sale", morte: "death", consumo: "neutral", retorno: "secondary" };
  elements.potrManejSubmit.textContent = labels[type] || "Registrar";
  elements.potrManejSubmit.className = `action-btn ${classes[type] || "purchase"}`;
}

function handlePotrManejPhotosChange() {
  const files = Array.from(elements.potrManejPhotos.files || []);
  const promises = files.slice(0, 6).map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ name: file.name, dataUrl: e.target.result, size: file.size });
    reader.readAsDataURL(file);
  }));
  Promise.all(promises).then((photos) => {
    runtime.potrManej.photoDrafts = photos;
    const count = photos.length;
    elements.potrManejPhotoCounter.textContent = count ?`${formatInteger(count)} foto${count !== 1 ?"s" : ""} anexada${count !== 1 ?"s" : ""}.` : "Nenhuma foto anexada.";
    elements.potrManejPhotoPanel.hidden = !count;
    elements.potrManejPhotoPreview.innerHTML = photos.map((p) => `
      <div class="movement-photo-thumb"><img src="${p.dataUrl}" alt="${escapeHtml(p.name)}"></div>
    `).join("");
  });
}

function handlePotrManejSubmit(event) {
  event.preventDefault();
  {
    const sourceFarmId = runtime.potrManej.farmId;
    const sourcePotreroId = runtime.potrManej.potreirosId || UNALLOCATED_POTREIRO_KEY;
    const sourceFarm = state.data.farms[sourceFarmId];
    if (!sourceFarm) return;

    const date = elements.potrManejDate.value;
    const qty = Number(elements.potrManejQty.value);
    const categoryId = elements.potrManejCategory.value;
    const notes = elements.potrManejNotes.value.trim();
    const category = sourceFarm.categories.find((c) => c.id === categoryId);
    if (!date || !qty || qty < 1 || !category) return;

    ensureCategoryAllocation(category);
    const destFarmId = elements.potrManejDestFarm.value || sourceFarmId;
    const destPotreroId = elements.potrManejDestPotr.value || UNALLOCATED_POTREIRO_KEY;
    const isSameFarm = destFarmId === sourceFarmId;
    const originQty = Number(category.allocation[sourcePotreroId] || 0);

    if (originQty < qty) {
      alert(`Apenas ${formatInteger(originQty)} animais alocados neste potreiro para essa categoria.`);
      return;
    }

    if (isSameFarm && sourcePotreroId === destPotreroId) {
      alert("Selecione um potreiro de destino diferente para a transferência.");
      return;
    }

    if (isSameFarm) {
      category.allocation[sourcePotreroId] = Math.max(0, originQty - qty);
      category.allocation[destPotreroId] = (Number(category.allocation[destPotreroId] || 0)) + qty;
      updatePotreroQuantitiesFromAllocation(sourceFarm);
      sourceFarm.movements.push({ id: createMovementId(), code: generateMovementCode(sourceFarm), type: "transferencia", date, categoryId, categoryName: category.name, quantity: qty, delta: 0, value: 0, saleDetails: null, notes, potreiro: sourcePotreroId, potreiroDest: destPotreroId, sourceId: "", photos: [] });
    } else {
      const destFarm = state.data.farms[destFarmId];
      if (!destFarm) return;
      const transferNote = notes || `Transferência de ${sourceFarm.name} para ${destFarm.name}`;

      category.quantity -= qty;
      category.allocation[sourcePotreroId] = Math.max(0, originQty - qty);
      updatePotreroQuantitiesFromAllocation(sourceFarm);
      sourceFarm.movements.push({ id: createMovementId(), code: generateMovementCode(sourceFarm), type: "consumo", date, categoryId, categoryName: category.name, quantity: qty, delta: -qty, value: 0, saleDetails: null, notes: `${transferNote} -> ${destFarm.name}`, potreiro: sourcePotreroId, sourceId: "", photos: [] });

      let destCategory = destFarm.categories.find((c) => c.id === categoryId);
      if (!destCategory) {
        destCategory = { id: categoryId, name: category.name, quantity: 0 };
        destFarm.categories.push(destCategory);
      }
      ensureCategoryAllocation(destCategory);
      destCategory.quantity += qty;
      destCategory.allocation[destPotreroId] = (Number(destCategory.allocation[destPotreroId] || 0)) + qty;
      updatePotreroQuantitiesFromAllocation(destFarm);
      destFarm.movements.push({ id: createMovementId(), code: generateMovementCode(destFarm), type: "compra", date, categoryId, categoryName: category.name, quantity: qty, delta: qty, value: 0, saleDetails: null, notes: `${transferNote} <- ${sourceFarm.name}`, potreiro: destPotreroId, sourceId: "", photos: [] });
    }

    saveData();
    populateYearFilter();
    elements.potrManejoDlg.close();
    renderPotreirosView();
    render();
    return;
  }
  const { farmId, potreirosId, type } = runtime.potrManej;
  const farm = state.data.farms[farmId];
  if (!farm) return;

  const date = elements.potrManejDate.value;
  const qty = Number(elements.potrManejQty.value);
  const categoryId = elements.potrManejCategory.value;
  const notes = elements.potrManejNotes.value.trim();
  const category = farm.categories.find((c) => c.id === categoryId);

  if (!date || !qty || qty < 1 || !category) return;

  const originId = potreirosId || UNALLOCATED_POTREIRO_KEY;
  ensureCategoryAllocation(category);

  if (type === "adicionar") {
    // Add to farm stock at destination potreiro
    const destId = elements.potrManejDestPotr.value || UNALLOCATED_POTREIRO_KEY;
    category.quantity += qty;
    category.allocation[destId] = (Number(category.allocation[destId] || 0)) + qty;
    updatePotreroQuantitiesFromAllocation(farm);
    farm.movements.push({ id: createMovementId(), code: generateMovementCode(farm), type: "compra", date, categoryId, categoryName: category.name, quantity: qty, delta: qty, value: 0, saleDetails: null, notes: notes || `Adicionado ao potreiro ${getPotreroEntries(farm).find((p) => p.id === destId)?.name || "sem potreiro"}`, potreiro: destId, sourceId: "", photos: [] });

  } else if (type === "transferencia") {
    const destFarmId = elements.potrManejDestFarm.value;
    const isSameFarm = !destFarmId || destFarmId === farmId;

    if (isSameFarm) {
      // Intra-farm transfer — no stock change, just reallocation
      const destId = elements.potrManejDestPotr.value || UNALLOCATED_POTREIRO_KEY;
      if (originId === destId) { alert("Selecione potreiros diferentes para a transferência."); return; }
      const originQty = Number(category.allocation[originId] || 0);
      if (originQty < qty) {
        alert(`Apenas ${formatInteger(originQty)} animais alocados em "${getPotreroEntries(farm).find((p) => p.id === originId)?.name || "sem potreiro"}" para essa categoria.`);
        return;
      }
      category.allocation[originId] -= qty;
      category.allocation[destId] = (Number(category.allocation[destId] || 0)) + qty;
      updatePotreroQuantitiesFromAllocation(farm);
      farm.movements.push({ id: createMovementId(), code: generateMovementCode(farm), type: "transferencia", date, categoryId, categoryName: category.name, quantity: qty, delta: 0, value: 0, saleDetails: null, notes, potreiro: originId, potreiroDest: destId, sourceId: "", photos: [] });

    } else {
      // Inter-farm transfer — remove from source, add to dest
      const originQty = Number(category.allocation[originId] || 0);
      if (originQty < qty) {
        alert(`Apenas ${formatInteger(originQty)} animais alocados neste potreiro para essa categoria.`);
        return;
      }
      const destFarm = state.data.farms[destFarmId];
      if (!destFarm) return;
      const destPotrId = elements.potrManejDestFarmPotr.value || UNALLOCATED_POTREIRO_KEY;
      const transferNote = notes || `Transferência de ${farm.name} para ${destFarm.name}`;

      // Remove from source
      category.quantity -= qty;
      category.allocation[originId] = Math.max(0, category.allocation[originId] - qty);
      updatePotreroQuantitiesFromAllocation(farm);
      farm.movements.push({ id: createMovementId(), code: generateMovementCode(farm), type: "consumo", date, categoryId, categoryName: category.name, quantity: qty, delta: -qty, value: 0, saleDetails: null, notes: `${transferNote} → ${destFarm.name}`, potreiro: originId, sourceId: "", photos: [] });

      // Add to destination farm
      let destCategory = destFarm.categories.find((c) => c.id === categoryId);
      if (!destCategory) {
        destCategory = { id: categoryId, name: category.name, quantity: 0 };
        destFarm.categories.push(destCategory);
      }
      ensureCategoryAllocation(destCategory);
      destCategory.quantity += qty;
      destCategory.allocation[destPotrId] = (Number(destCategory.allocation[destPotrId] || 0)) + qty;
      updatePotreroQuantitiesFromAllocation(destFarm);
      destFarm.movements.push({ id: createMovementId(), code: generateMovementCode(destFarm), type: "compra", date, categoryId, categoryName: category.name, quantity: qty, delta: qty, value: 0, saleDetails: null, notes: `${transferNote} ← ${farm.name}`, potreiro: destPotrId, sourceId: "", photos: [] });
    }

  } else if (type === "venda") {
    const value = Number(elements.potrManejValue.value || 0);
    const originQty = Number(category.allocation[originId] || 0);
    if (originQty < qty) {
      alert(`Apenas ${formatInteger(originQty)} animais alocados neste potreiro para essa categoria.`);
      return;
    }
    category.quantity -= qty;
    category.allocation[originId] = Math.max(0, category.allocation[originId] - qty);
    updatePotreroQuantitiesFromAllocation(farm);
    farm.movements.push({ id: createMovementId(), code: generateMovementCode(farm), type: "venda", date, categoryId, categoryName: category.name, quantity: qty, delta: -qty, value, saleDetails: null, notes, potreiro: originId, sourceId: "", photos: [] });

  } else if (type === "morte" || type === "consumo") {
    const originQty = Number(category.allocation[originId] || 0);
    if (originQty < qty) {
      alert(`Apenas ${formatInteger(originQty)} animais alocados neste potreiro para essa categoria.`);
      return;
    }
    category.quantity -= qty;
    category.allocation[originId] = Math.max(0, category.allocation[originId] - qty);
    updatePotreroQuantitiesFromAllocation(farm);
    const photos = type === "morte" ?runtime.potrManej.photoDrafts.map((p) => ({ ...p })) : [];
    farm.movements.push({ id: createMovementId(), code: generateMovementCode(farm), type, date, categoryId, categoryName: category.name, quantity: qty, delta: -qty, value: 0, saleDetails: null, notes, potreiro: originId, sourceId: "", photos });

  } else if (type === "retorno") {
    // Move animals from current potreiro back to unallocated pool — no stock change
    if (originId === UNALLOCATED_POTREIRO_KEY) {
      alert("Este potreiro já é o pool geral. Selecione um potreiro específico.");
      return;
    }
    const originQty = Number(category.allocation[originId] || 0);
    if (originQty < qty) {
      alert(`Apenas ${formatInteger(originQty)} animais alocados neste potreiro para essa categoria.`);
      return;
    }
    category.allocation[originId] = originQty - qty;
    category.allocation[UNALLOCATED_POTREIRO_KEY] = (Number(category.allocation[UNALLOCATED_POTREIRO_KEY] || 0)) + qty;
    updatePotreroQuantitiesFromAllocation(farm);
    const potreroName = getPotreroEntries(farm).find((p) => p.id === originId)?.name || originId;
    farm.movements.push({ id: createMovementId(), code: generateMovementCode(farm), type: "transferencia", date, categoryId, categoryName: category.name, quantity: qty, delta: 0, value: 0, saleDetails: null, notes: notes || `Retorno ao total — saída de "${potreroName}"`, potreiro: originId, potreiroDest: UNALLOCATED_POTREIRO_KEY, sourceId: "", photos: [] });
  }

  saveData();
  populateYearFilter();
  elements.potrManejoDlg.close();
  renderPotreirosView();
  render();
}

async function openGeorefDialog() {
  const farm = getFarm();
  if (farm.id !== "arapey") {
    return;
  }

  ensureGeorefDraft(farm, true);
  elements.georefStatus.innerHTML = createGeorefLoadingSummary();
  elements.georefMap.innerHTML = '<div class="georef-map-empty">Carregando o mapa georreferenciado da Arapey...</div>';
  elements.georefLegend.innerHTML = `
    <section class="georef-legend-section">
      <h3>Preparando leitura dos campos</h3>
      <p>Estou cruzando o arquivo KML com os potreiros cadastrados para mostrar a lotação atual em cada localidade.</p>
    </section>
  `;

  elements.georefDialog.showModal();
  await renderGeorefDialog();
}

async function renderGeorefDialog() {
  const farm = getFarm();
  if (farm.id !== "arapey") {
    return;
  }

  try {
    const draftPotreiros = getGeorefDraftPotreiros(farm);
    const kmlData = await loadArapeyKmlData();
    if (!elements.georefDialog.open || getFarm().id !== "arapey") {
      return;
    }

    const model = buildArapeyGeorefModel(farm, kmlData, {
      potreiros: draftPotreiros,
      selectedId: runtime.georefDraft?.selectedId || ""
    });
    elements.georefStatus.innerHTML = renderGeorefSummaryCards(model);
    elements.georefMap.innerHTML = renderEditableGeorefMap(model);
    elements.georefLegend.innerHTML = renderEditableGeorefLegend(model);
  } catch (error) {
    console.error("Falha ao carregar georreferenciamento da Arapey:", error);
    elements.georefStatus.innerHTML = `
      <article class="georef-summary-card">
        <span>Georreferenciamento</span>
        <strong>Indisponível</strong>
        <p>Não consegui ler o arquivo <code>Arapey.kml</code> neste ambiente.</p>
      </article>
    `;
    elements.georefMap.innerHTML = `
      <div class="georef-map-error">
        Não foi possível carregar o mapa da Arapey agora.<br>
        Verifique se o arquivo <code>Arapey.kml</code> está disponível junto do sistema.
      </div>
    `;
    elements.georefLegend.innerHTML = `
      <section class="georef-legend-section">
        <h3>O que foi tentado</h3>
        <p>O sistema tentou ler o arquivo local da Arapey para desenhar os potreiros no painel, mas a leitura falhou neste contexto.</p>
      </section>
    `;
  }
}

function handleGeorefLegendInteraction(event) {
  const card = event.target.closest("[data-georef-card-id]");
  if (!card || event.target.closest("input") || !runtime.georefDraft) {
    return;
  }

  runtime.georefDraft.selectedId = card.dataset.georefCardId || "";
  void renderGeorefDialog();
}

function handleGeorefLegendChange(event) {
  const card = event.target.closest("[data-georef-card-id]");
  if (!card || !runtime.georefDraft) {
    return;
  }

  const entry = runtime.georefDraft.potreiros.find((item) => item.id === card.dataset.georefCardId);
  if (!entry) {
    return;
  }

  if (event.target.matches("[data-georef-name]")) {
    entry.name = event.target.value.trim();
  }

  if (event.target.matches("[data-georef-quantity]")) {
    entry.quantity = normalizePotreroQuantity(event.target.value);
  }

  runtime.georefDraft.selectedId = entry.id;
  void renderGeorefDialog();
}

function getGeorefEntriesFromLegend() {
  const cards = [...elements.georefLegend.querySelectorAll("[data-georef-card-id]")];
  if (!cards.length) {
    return clonePotreroEntries(runtime.georefDraft?.potreiros || []);
  }

  return cards.map((card) => ({
    id: card.dataset.georefCardId || createPotreroId("potreiro"),
    name: card.querySelector("[data-georef-name]")?.value.trim() || "",
    quantity: card.querySelector("[data-georef-quantity]")?.value
  }));
}

function handleGeorefSave() {
  const farm = getFarm();
  if (farm.id !== "arapey") {
    return;
  }

  const entries = getGeorefEntriesFromLegend();
  const nextPotreiros = [];
  const seenPotreiros = new Set();

  for (const entry of entries) {
    const name = String(entry.name || "").trim();
    const quantity = Number(entry.quantity);

    if (!name) {
      alert("Informe o nome de todos os potreiros no georreferenciamento.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      alert(`Informe uma quantidade valida para o potreiro ${name}.`);
      return;
    }

    const normalizedName = normalizeText(name);
    if (seenPotreiros.has(normalizedName)) {
      alert(`O potreiro ${name} foi informado mais de uma vez no georreferenciamento.`);
      return;
    }

    seenPotreiros.add(normalizedName);
    nextPotreiros.push({
      id: entry.id || createPotreroId(name),
      name,
      quantity: normalizePotreroQuantity(quantity)
    });
  }

  farm.potreiros = clonePotreroEntries(nextPotreiros);
  runtime.georefDraft = {
    farmId: farm.id,
    potreiros: clonePotreroEntries(nextPotreiros),
    selectedId: nextPotreiros.some((entry) => entry.id === runtime.georefDraft?.selectedId)
      ?runtime.georefDraft?.selectedId || ""
      : nextPotreiros[0]?.id || ""
  };
  saveData();
  render();
}

function createGeorefLoadingSummary() {
  return `
    <article class="georef-summary-card">
      <span>KML</span>
      <strong>...</strong>
      <p>Lendo as geometrias dos campos.</p>
    </article>
    <article class="georef-summary-card">
      <span>Vínculos</span>
      <strong>...</strong>
      <p>Conferindo potreiros cadastrados.</p>
    </article>
    <article class="georef-summary-card">
      <span>Lotação</span>
      <strong>...</strong>
      <p>Somando as cabeças por localidade.</p>
    </article>
    <article class="georef-summary-card">
      <span>Pendências</span>
      <strong>...</strong>
      <p>Separando o que ainda precisa de ajuste manual.</p>
    </article>
  `;
}

async function loadArapeyKmlData() {
  if (runtime.arapeyKmlData) {
    return runtime.arapeyKmlData;
  }

  if (runtime.arapeyKmlPromise) {
    return runtime.arapeyKmlPromise;
  }

  runtime.arapeyKmlPromise = fetch("./Arapey.kml", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.text();
    })
    .then((kmlText) => parseArapeyKml(kmlText))
    .then((parsed) => {
      runtime.arapeyKmlData = parsed;
      return parsed;
    })
    .finally(() => {
      runtime.arapeyKmlPromise = null;
    });

  return runtime.arapeyKmlPromise;
}

function parseArapeyKml(kmlText) {
  const xml = new DOMParser().parseFromString(kmlText, "application/xml");
  const parseError = xml.querySelector("parsererror");
  if (parseError) {
    throw new Error("KML invalido.");
  }

  const featureMap = new Map();
  const pointMap = new Map();

  [...xml.getElementsByTagNameNS("*", "Placemark")].forEach((placemark) => {
    const rawName = (placemark.getElementsByTagNameNS("*", "name")[0]?.textContent || "").trim();
    if (!rawName) {
      return;
    }

    const areaMatch = rawName.match(/^(.*?)\s*-\s*([\d.,]+)\s*ha$/i);
    const baseName = (areaMatch?.[1] || rawName).trim();
    const key = resolveArapeyGeoKey(baseName);
    if (!key) {
      return;
    }

    const pointNode = placemark.getElementsByTagNameNS("*", "Point")[0];
    if (pointNode) {
      const [point] = extractKmlCoordinates(pointNode);
      if (point) {
        pointMap.set(key, {
          point,
          areaHa: parseKmlNumber(areaMatch?.[2])
        });
      }
    }

    [...placemark.getElementsByTagNameNS("*", "Polygon")].forEach((polygonNode) => {
      const polygon = extractKmlCoordinates(polygonNode);
      if (polygon.length < 3) {
        return;
      }

      if (!featureMap.has(key)) {
        featureMap.set(key, {
          key,
          polygons: [],
          sourceNames: new Set()
        });
      }

      const feature = featureMap.get(key);
      feature.polygons.push(polygon);
      feature.sourceNames.add(rawName);
    });
  });

  const features = [...featureMap.values()].map((feature) => {
    const pointInfo = pointMap.get(feature.key);
    return {
      ...feature,
      sourceNames: [...feature.sourceNames],
      label: formatArapeyGeoLabel(feature.key),
      markerPoint: pointInfo?.point || getFeatureCenter(feature.polygons),
      areaHa: Number.isFinite(pointInfo?.areaHa) ?pointInfo.areaHa : null
    };
  });

  return { features };
}

function buildArapeyGeorefModel(farm, kmlData, options = {}) {
  const potreiros = clonePotreroEntries(options.potreiros || getPotreroEntries(farm));
  const selectedId = options.selectedId || "";
  const potreroGroups = new Map();

  potreiros.forEach((potrero) => {
    const key = resolveArapeyGeoKey(potrero.name);
    const quantity = normalizePotreroQuantity(potrero.quantity);
    const bucketKey = key || `unmatched::${slugify(potrero.name) || potrero.id || "potreiro"}`;
    const group = potreroGroups.get(bucketKey) || {
      key,
      names: [],
      quantity: 0,
      entryIds: []
    };

    group.names.push(potrero.name);
    group.quantity += quantity;
    group.entryIds.push(potrero.id);
    potreroGroups.set(bucketKey, group);
  });

  const groupedPotreiros = [...potreroGroups.values()];
  const groupsByKey = new Map(groupedPotreiros.filter((group) => group.key).map((group) => [group.key, group]));

  const visibleFeatures = kmlData.features
    .filter((feature) => feature.areaHa !== null || ARAPEY_PRIMARY_GEO_KEYS.has(feature.key) || groupsByKey.has(feature.key))
    .map((feature) => {
      const group = groupsByKey.get(feature.key) || null;
      return {
        ...feature,
        quantity: group?.quantity || 0,
        registeredNames: group?.names || [],
        isLinked: Boolean(group)
      };
    })
    .sort((a, b) => b.quantity - a.quantity || a.label.localeCompare(b.label));

  const unmatchedPotreiros = groupedPotreiros
    .filter((group) => !group.key || !visibleFeatures.some((feature) => feature.key === group.key))
    .sort((a, b) => b.quantity - a.quantity || a.names[0].localeCompare(b.names[0]));

  const editorEntries = potreiros
    .map((potrero) => {
      const key = resolveArapeyGeoKey(potrero.name);
      const matchedFeature = key ?visibleFeatures.find((feature) => feature.key === key) || null : null;
      return {
        id: potrero.id,
        name: potrero.name,
        quantity: normalizePotreroQuantity(potrero.quantity),
        key,
        mapLabel: matchedFeature?.label || "",
        areaHa: matchedFeature?.areaHa ?? null,
        isLinked: Boolean(matchedFeature),
        isSelected: potrero.id === selectedId
      };
    })
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));

  const totalRegistered = potreiros.length;
  const linkedPotreiros = visibleFeatures.reduce((sum, feature) => sum + feature.registeredNames.length, 0);
  const linkedAnimals = visibleFeatures.reduce((sum, feature) => sum + feature.quantity, 0);
  const unmatchedAnimals = unmatchedPotreiros.reduce((sum, item) => sum + item.quantity, 0);
  const selectedKey = editorEntries.find((entry) => entry.id === selectedId)?.key || "";

  return {
    farmName: farm.name,
    totalRegistered,
    visibleFeatures,
    unmatchedPotreiros,
    editorEntries,
    selectedId,
    selectedKey,
    stats: {
      mappedAreas: visibleFeatures.length,
      linkedPotreiros,
      linkedAnimals,
      unmatchedPotreiros: unmatchedPotreiros.length,
      unmatchedAnimals,
      emptyAreas: visibleFeatures.filter((feature) => !feature.isLinked).length
    }
  };
}

function renderGeorefSummaryCards(model) {
  return `
    <article class="georef-summary-card">
      <span>Campos no mapa</span>
      <strong>${formatInteger(model.stats.mappedAreas)}</strong>
      <p>Áreas da Arapey disponíveis para leitura georreferenciada.</p>
    </article>
    <article class="georef-summary-card">
      <span>Potreiros vinculados</span>
      <strong>${formatInteger(model.stats.linkedPotreiros)}/${formatInteger(model.totalRegistered)}</strong>
      <p>Potreiros cadastrados que o sistema conseguiu localizar automaticamente no KML.</p>
    </article>
    <article class="georef-summary-card">
      <span>Animais mapeados</span>
      <strong>${formatInteger(model.stats.linkedAnimals)}</strong>
      <p>Cabeças atualmente posicionadas nas localidades reconhecidas.</p>
    </article>
    <article class="georef-summary-card">
      <span>Pendencias</span>
      <strong>${formatInteger(model.stats.unmatchedPotreiros)}</strong>
      <p>${formatInteger(model.stats.unmatchedAnimals)} animais em potreiros ainda sem correspondência automática no mapa.</p>
    </article>
  `;
}

function renderEditableGeorefLegend(model) {
  const editorCards = model.editorEntries.length
    ?model.editorEntries.map((entry, index) => {
      const areaText = Number.isFinite(entry.areaHa)
        ?`<span class="georef-meta-pill">${formatWeight(entry.areaHa)} ha</span>`
        : "";

      return `
        <article class="georef-legend-item georef-editor-card ${entry.isLinked ?"is-linked" : "is-unmatched"} ${entry.isSelected ?"is-active" : ""}" data-georef-card-id="${escapeHtml(entry.id)}">
          <div class="georef-legend-head">
            <div class="georef-card-title">
              <span class="georef-card-index">Card ${index + 1}</span>
              <strong>${escapeHtml(entry.name)}</strong>
            </div>
            <span class="georef-badge">${formatInteger(entry.quantity)} cab.</span>
          </div>
          <div class="georef-legend-meta">
            <span class="georef-meta-pill">${entry.isLinked ?`Campo: ${escapeHtml(entry.mapLabel)}` : "Sem referencia no mapa"}</span>
            ${areaText}
          </div>
          <label class="georef-field">
            Nome do potreiro
            <input
              type="text"
              maxlength="80"
              value="${escapeHtml(entry.name)}"
              data-georef-name
              placeholder="Ex.: Campo 7"
            >
          </label>
          <label class="georef-field">
            Quantidade de animais
            <input
              type="number"
              min="0"
              step="1"
              value="${entry.quantity}"
              data-georef-quantity
              placeholder="0"
            >
          </label>
          <p class="georef-legend-note">${entry.isLinked ?"Clique no card para destacar este campo no mapa." : "Ajuste o nome para o KML reconhecer o campo correto."}</p>
        </article>
      `;
    }).join("")
    : "<p>Nenhum potreiro da Arapey esta disponivel para edicao neste momento.</p>";

  const emptyFeatures = model.visibleFeatures.filter((feature) => !feature.isLinked);
  const emptySection = emptyFeatures.length
    ?`
      <section class="georef-legend-section">
        <h3>Campos do KML sem cadastro</h3>
        <p>Essas areas existem no mapa, mas ainda nao possuem um potreiro vinculado no painel.</p>
        ${emptyFeatures.map((feature) => `
          <article class="georef-legend-item">
            <div class="georef-legend-head">
              <strong>${escapeHtml(feature.label)}</strong>
              <span class="georef-badge">Livre</span>
            </div>
            <div class="georef-legend-meta">
              ${Number.isFinite(feature.areaHa) ?`<span class="georef-meta-pill">${formatWeight(feature.areaHa)} ha</span>` : ""}
              <span class="georef-meta-pill">Sem cadastro</span>
            </div>
            <p class="georef-legend-note">Renomeie um card lateral com esta referencia e salve para vincular o campo.</p>
          </article>
        `).join("")}
      </section>
    `
    : `
      <section class="georef-legend-section">
        <h3>Mapa conferido</h3>
        <p>Todos os campos principais visiveis no KML ja possuem alguma referencia cadastrada.</p>
      </section>
    `;

  return `
    <section class="georef-legend-section">
      <h3>Cadastros editaveis</h3>
      <p>Clique em um card para destacar a referencia no mapa. Edite nome e quantidade aqui e use o botao Salvar no topo.</p>
      ${editorCards}
    </section>
    ${emptySection}
  `;
}

function renderEditableGeorefMap(model) {
  if (!model.visibleFeatures.length) {
    return '<div class="georef-map-empty">Nenhuma area do KML foi localizada para montar o mapa da Arapey.</div>';
  }

  const bounds = getGeorefBounds(model.visibleFeatures);
  if (!bounds) {
    return '<div class="georef-map-empty">Nao encontrei coordenadas suficientes para desenhar o mapa georreferenciado.</div>';
  }

  const padding = 42;
  const maxWidth = 1000;
  const maxHeight = 760;
  const lonSpan = Math.max(bounds.maxLon - bounds.minLon, 0.000001);
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.000001);
  const scale = Math.min((maxWidth - (padding * 2)) / lonSpan, (maxHeight - (padding * 2)) / latSpan);
  const width = Math.max(720, Math.round((lonSpan * scale) + (padding * 2)));
  const height = Math.max(420, Math.round((latSpan * scale) + (padding * 2)));
  const maxQuantity = Math.max(...model.visibleFeatures.map((feature) => feature.quantity), 0);

  const projectPoint = (point) => ({
    x: padding + ((point.lon - bounds.minLon) * scale),
    y: padding + ((bounds.maxLat - point.lat) * scale)
  });

  const featuresSvg = model.visibleFeatures.map((feature) => {
    const isActive = Boolean(model.selectedKey) && feature.key === model.selectedKey;
    const fill = getGeorefFeatureFill(feature.quantity, maxQuantity, feature.isLinked);
    const stroke = isActive ?"#bf7e42" : feature.isLinked ?"#335c43" : "#8f6132";
    const tooltip = feature.registeredNames.length
      ?`${feature.label}: ${formatInteger(feature.quantity)} cab. | ${feature.registeredNames.join(", ")}`
      : `${feature.label}: sem lotacao cadastrada`;
    const polygons = feature.polygons.map((polygon) => {
      const points = polygon.map(projectPoint).map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
      return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${isActive ?"4.6" : "2.4"}"></polygon>`;
    }).join("");

    const labelAnchor = projectPoint(feature.markerPoint || getFeatureCenter(feature.polygons));
    const quantityText = feature.quantity > 0 ?`${formatInteger(feature.quantity)} cab.` : "Sem gado";
    const labelWidth = Math.max(feature.label.length, quantityText.length) * 8 + 26;
    const labelX = clamp(labelAnchor.x, (labelWidth / 2) + 8, width - (labelWidth / 2) - 8);
    const labelY = clamp(labelAnchor.y, 34, height - 46);

    return `
      <g class="georef-feature ${feature.isLinked ?"is-linked" : "is-unlinked"} ${isActive ?"is-active" : ""}">
        <title>${escapeHtml(tooltip)}</title>
        ${polygons}
        <g class="georef-label">
          <rect x="${(labelX - (labelWidth / 2)).toFixed(1)}" y="${(labelY - 26).toFixed(1)}" width="${labelWidth.toFixed(1)}" height="44" rx="14"></rect>
          <text x="${labelX.toFixed(1)}" y="${(labelY - 6).toFixed(1)}">
            <tspan x="${labelX.toFixed(1)}" dy="0">${escapeHtml(feature.label)}</tspan>
            <tspan x="${labelX.toFixed(1)}" dy="16">${escapeHtml(quantityText)}</tspan>
          </text>
        </g>
      </g>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Mapa georreferenciado da fazenda Arapey">
      <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(255,255,255,0.18)"></rect>
      ${featuresSvg}
    </svg>
  `;
}

function renderGeorefLegend(model) {
  const mappedItems = model.visibleFeatures.length
    ?model.visibleFeatures.map((feature) => {
      const namesText = feature.registeredNames.length
        ?`Cadastro: ${escapeHtml(feature.registeredNames.join(", "))}.`
        : "Sem lotação cadastrada para esta localidade.";
      const areaText = Number.isFinite(feature.areaHa)
        ?`<span class="georef-meta-pill">${formatWeight(feature.areaHa)} ha</span>`
        : "";
      const quantityText = feature.quantity > 0 ?`${formatInteger(feature.quantity)} cab.` : "Sem gado";

      return `
        <article class="georef-legend-item ${feature.isLinked ?"is-linked" : ""}">
          <div class="georef-legend-head">
            <strong>${escapeHtml(feature.label)}</strong>
            <span class="georef-badge">${escapeHtml(quantityText)}</span>
          </div>
          <div class="georef-legend-meta">
            ${areaText}
            <span class="georef-meta-pill">${feature.isLinked ?"Vinculado" : "Sem vínculo"}</span>
          </div>
          <p class="georef-legend-note">${namesText}</p>
        </article>
      `;
    }).join("")
    : "<p>Nenhuma geometria da Arapey foi localizada no arquivo KML.</p>";

  const unmatchedSection = model.unmatchedPotreiros.length
    ?`
      <section class="georef-legend-section">
        <h3>Potreiros sem correspondência automática</h3>
        <p>Esses cadastros ainda precisam de ajuste de nome para o mapa reconhecer a localidade correta.</p>
        ${model.unmatchedPotreiros.map((item) => `
          <article class="georef-legend-item is-unmatched">
            <div class="georef-legend-head">
              <strong>${escapeHtml(item.names.join(", "))}</strong>
              <span class="georef-badge">${formatInteger(item.quantity)} cab.</span>
            </div>
            <p class="georef-legend-note">Revise a grafia do potreiro ou confira se essa localidade existe no arquivo georreferenciado.</p>
          </article>
        `).join("")}
      </section>
    `
    : `
      <section class="georef-legend-section">
        <h3>Correspondencia automatica</h3>
        <p>Todos os potreiros cadastrados da Arapey encontraram uma localidade no arquivo <code>Arapey.kml</code>.</p>
      </section>
    `;

  return `
    <section class="georef-legend-section">
      <h3>Localidades identificadas</h3>
      <p>O mapa usa as áreas do KML e a lotação atual cadastrada em <strong>${escapeHtml(model.farmName)}</strong>.</p>
      ${mappedItems}
    </section>
    ${unmatchedSection}
  `;
}

function renderGeorefMap(model) {
  if (!model.visibleFeatures.length) {
    return '<div class="georef-map-empty">Nenhuma area do KML foi localizada para montar o mapa da Arapey.</div>';
  }

  const bounds = getGeorefBounds(model.visibleFeatures);
  if (!bounds) {
    return '<div class="georef-map-empty">Não encontrei coordenadas suficientes para desenhar o mapa georreferenciado.</div>';
  }

  const padding = 42;
  const maxWidth = 1000;
  const maxHeight = 760;
  const lonSpan = Math.max(bounds.maxLon - bounds.minLon, 0.000001);
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.000001);
  const scale = Math.min((maxWidth - (padding * 2)) / lonSpan, (maxHeight - (padding * 2)) / latSpan);
  const width = Math.max(720, Math.round((lonSpan * scale) + (padding * 2)));
  const height = Math.max(420, Math.round((latSpan * scale) + (padding * 2)));
  const maxQuantity = Math.max(...model.visibleFeatures.map((feature) => feature.quantity), 0);

  const projectPoint = (point) => ({
    x: padding + ((point.lon - bounds.minLon) * scale),
    y: padding + ((bounds.maxLat - point.lat) * scale)
  });

  const featuresSvg = model.visibleFeatures.map((feature) => {
    const fill = getGeorefFeatureFill(feature.quantity, maxQuantity, feature.isLinked);
    const stroke = feature.isLinked ?"#335c43" : "#8f6132";
    const tooltip = feature.registeredNames.length
      ?`${feature.label}: ${formatInteger(feature.quantity)} cab. | ${feature.registeredNames.join(", ")}`
      : `${feature.label}: sem lotação cadastrada`;
    const polygons = feature.polygons.map((polygon) => {
      const points = polygon.map(projectPoint).map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
      return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="2.4"></polygon>`;
    }).join("");

    const labelAnchor = projectPoint(feature.markerPoint || getFeatureCenter(feature.polygons));
    const quantityText = feature.quantity > 0 ?`${formatInteger(feature.quantity)} cab.` : "Sem gado";
    const labelWidth = Math.max(feature.label.length, quantityText.length) * 8 + 26;
    const labelX = clamp(labelAnchor.x, (labelWidth / 2) + 8, width - (labelWidth / 2) - 8);
    const labelY = clamp(labelAnchor.y, 34, height - 46);

    return `
      <g class="georef-feature ${feature.isLinked ?"is-linked" : "is-unlinked"}">
        <title>${escapeHtml(tooltip)}</title>
        ${polygons}
        <g class="georef-label">
          <rect x="${(labelX - (labelWidth / 2)).toFixed(1)}" y="${(labelY - 26).toFixed(1)}" width="${labelWidth.toFixed(1)}" height="44" rx="14"></rect>
          <text x="${labelX.toFixed(1)}" y="${(labelY - 6).toFixed(1)}">
            <tspan x="${labelX.toFixed(1)}" dy="0">${escapeHtml(feature.label)}</tspan>
            <tspan x="${labelX.toFixed(1)}" dy="16">${escapeHtml(quantityText)}</tspan>
          </text>
        </g>
      </g>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Mapa georreferenciado da fazenda Arapey">
      <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(255,255,255,0.18)"></rect>
      ${featuresSvg}
    </svg>
  `;
}

function getGeorefBounds(features) {
  const points = features.flatMap((feature) => feature.polygons.flatMap((polygon) => polygon));
  if (!points.length) {
    return null;
  }

  return points.reduce((bounds, point) => ({
    minLon: Math.min(bounds.minLon, point.lon),
    maxLon: Math.max(bounds.maxLon, point.lon),
    minLat: Math.min(bounds.minLat, point.lat),
    maxLat: Math.max(bounds.maxLat, point.lat)
  }), {
    minLon: Number.POSITIVE_INFINITY,
    maxLon: Number.NEGATIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY
  });
}

function getGeorefFeatureFill(quantity, maxQuantity, isLinked) {
  if (!isLinked) {
    return "rgba(201, 140, 79, 0.16)";
  }

  if (quantity <= 0 || maxQuantity <= 0) {
    return "rgba(55, 91, 67, 0.2)";
  }

  const ratio = quantity / maxQuantity;
  return `rgba(55, 91, 67, ${(0.28 + (ratio * 0.54)).toFixed(2)})`;
}

function extractKmlCoordinates(containerNode) {
  const coordinatesNode = containerNode.getElementsByTagNameNS("*", "coordinates")[0];
  if (!coordinatesNode) {
    return [];
  }

  return coordinatesNode.textContent
    .trim()
    .split(/\s+/)
    .map((chunk) => {
      const [lon, lat] = chunk.split(",").map(Number);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return null;
      }

      return { lon, lat };
    })
    .filter(Boolean);
}

function parseKmlNumber(value) {
  if (!value) {
    return null;
  }

  const parsed = Number(String(value).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ?parsed : null;
}

function getFeatureCenter(polygons) {
  const points = polygons.flat();
  if (!points.length) {
    return { lon: 0, lat: 0 };
  }

  const totals = points.reduce((accumulator, point) => ({
    lon: accumulator.lon + point.lon,
    lat: accumulator.lat + point.lat
  }), { lon: 0, lat: 0 });

  return {
    lon: totals.lon / points.length,
    lat: totals.lat / points.length
  };
}

function resolveArapeyGeoKey(value) {
  const normalized = normalizeText(value)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s*-\s*[\d.,]+\s*ha$/i, "")
    .replace(/\bpotreiro\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized || ["aaa", "poligono sem titulo", "dadassadasdasd"].includes(normalized)) {
    return "";
  }

  if (/^(campo\s*)?\d{1,2}$/.test(normalized)) {
    return normalized.match(/\d{1,2}/)?.[0] || "";
  }

  if (normalized.includes("campo 10 e 1")) {
    return "campo 10 e 1";
  }

  if (normalized.includes("chacra") && normalized.includes("10")) {
    return "chacra 10";
  }

  if (normalized.includes("las pampa")) {
    return "las pampas";
  }

  if (normalized.includes("cerrillada")) {
    return "cerrillada";
  }

  if (normalized.includes("pedreira")) {
    return "pedreira";
  }

  if (normalized.includes("tapera")) {
    return "tapera";
  }

  if (normalized.includes("costa")) {
    return "costa";
  }

  if (normalized.includes("molino")) {
    return "molino";
  }

  if (normalized.includes("piq rincon")) {
    return "piq rincon";
  }

  if (normalized.includes("prad 7")) {
    return "prad 7";
  }

  if (normalized.includes("prad 8")) {
    return "prad 8";
  }

  if (normalized === "frente") {
    return "frente";
  }

  return normalized;
}

function formatArapeyGeoLabel(key) {
  const labels = {
    "2": "Campo 2",
    "3": "Campo 3",
    "4": "Campo 4",
    "5": "Campo 5",
    "6": "Campo 6",
    "7": "Campo 7",
    "8": "Campo 8",
    "9": "Campo 9",
    "10": "Campo 10",
    "11": "Campo 11",
    "tapera": "Tapera",
    "pedreira": "Pedreira",
    "costa": "Costa",
    "molino": "Molino",
    "chacra 10": "Chacra 10",
    "las pampas": "Las Pampas",
    "cerrillada": "Cerrillada",
    "piq rincon": "Piq Rincon",
    "prad 7": "Prad 7",
    "prad 8": "Prad 8",
    "frente": "Frente",
    "campo 10 e 1": "Campo 10 e 1"
  };

  if (labels[key]) {
    return labels[key];
  }

  return key.replace(/\b\w/g, (character) => character.toUpperCase());
}

function renderInsights(farm) {
  return;
}

function renderCharts(farm) {
  renderInventoryRankedList(farm);
  if (state.charts.movement) {
    state.charts.movement.destroy();
    state.charts.movement = null;
  }
  if (state.charts.monthlyEvolution) {
    state.charts.monthlyEvolution.destroy();
    state.charts.monthlyEvolution = null;
  }
  document.getElementById("movementChart")?.closest(".chart-panel")?.setAttribute("hidden", "");
  document.getElementById("monthlyEvolutionChart")?.closest(".chart-panel")?.setAttribute("hidden", "");
}

function renderInventoryRankedList(farm) {
  if (state.charts.inventory) {
    state.charts.inventory.destroy();
    state.charts.inventory = null;
  }

  const container = document.getElementById("inventoryChart");
  if (!container) return;

  const panel = container.closest(".chart-panel");
  if (state.filters.especie === "ovino") {
    if (panel) panel.hidden = true;
    return;
  }
  if (panel) panel.hidden = false;

  const categories = [...farm.categories]
    .filter((cat) => Number(cat.quantity || 0) > 0)
    .sort((a, b) => b.quantity - a.quantity);

  const total = categories.reduce((sum, cat) => sum + Number(cat.quantity || 0), 0) || 1;

  if (!categories.length) {
    container.innerHTML = `<p class="chart-fallback-msg">Sem estoque para distribuir por categoria.</p>`;
    return;
  }

  const TOP_N = 8;
  const topCats = categories.slice(0, TOP_N);
  const restCats = categories.slice(TOP_N);
  const restQty = restCats.reduce((s, c) => s + Number(c.quantity || 0), 0);

  const rows = topCats.map((cat, index) => {
    const pct = ((cat.quantity / total) * 100).toFixed(1);
    const color = COLORS[index % COLORS.length];
    return `
      <div class="inv-ranked-row">
        <div class="inv-ranked-bar" style="width:${pct}%"></div>
        <span class="inv-ranked-dot" style="background:${color}"></span>
        <span class="inv-ranked-name">${escapeHtml(cat.name)}</span>
        <strong class="inv-ranked-qty">${formatInteger(cat.quantity)}</strong>
        <span class="inv-ranked-pct">${pct}%</span>
      </div>
    `;
  });

  if (restCats.length > 0) {
    const restPct = ((restQty / total) * 100).toFixed(1);
    const hiddenRows = restCats.map((cat, index) => {
      const pct = ((cat.quantity / total) * 100).toFixed(1);
      const color = COLORS[(TOP_N + index) % COLORS.length];
      return `
        <div class="inv-ranked-row inv-ranked-expanded-row">
          <div class="inv-ranked-bar" style="width:${pct}%"></div>
          <span class="inv-ranked-dot" style="background:${color}"></span>
          <span class="inv-ranked-name">${escapeHtml(cat.name)}</span>
          <strong class="inv-ranked-qty">${formatInteger(cat.quantity)}</strong>
          <span class="inv-ranked-pct">${pct}%</span>
        </div>
      `;
    }).join("");
    rows.push(`
      <div class="inv-ranked-row inv-ranked-others inv-ranked-toggle" style="cursor:pointer" data-inv-toggle>
        <div class="inv-ranked-bar" style="width:${restPct}%"></div>
        <span class="inv-ranked-dot" style="background:var(--muted);opacity:0.5"></span>
        <span class="inv-ranked-name inv-toggle-label">▶ Outras (${restCats.length} categorias)</span>
        <strong class="inv-ranked-qty">${formatInteger(restQty)}</strong>
        <span class="inv-ranked-pct">${restPct}%</span>
      </div>
      <div class="inv-expanded-body" hidden>${hiddenRows}</div>
    `);
  }

  container.innerHTML = rows.join("");

  const toggleRow = container.querySelector("[data-inv-toggle]");
  const expandBody = container.querySelector(".inv-expanded-body");
  if (toggleRow && expandBody) {
    toggleRow.addEventListener("click", () => {
      const open = !expandBody.hidden;
      expandBody.hidden = open;
      toggleRow.querySelector(".inv-toggle-label").textContent =
        open ? `▶ Outras (${restCats.length} categorias)` : `▼ Outras (${restCats.length} categorias)`;
    });
  }
}

function renderMovementChart(farm) {
  if (typeof window.Chart !== "function") {
    drawChartFallback("movementChart", "Gráfico indisponível no momento.");
    return;
  }

  const context = document.getElementById("movementChart");
  const summaryByMonth = Array.from({ length: 12 }, (_, monthIndex) => {
    const month = String(monthIndex + 1).padStart(2, "0");
    const summary = summarizePeriod(farm, state.filters.year, month);
    return {
      label: MONTH_NAMES[monthIndex].slice(0, 3),
      entradas: summary.byType.compra + summary.byType.nascimento + summary.adjustPositive,
      saidas: summary.byType.venda + summary.byType.consumo + summary.byType.morte + summary.adjustNegative,
      saldo: summary.netChange
    };
  });

  if (!summaryByMonth.some((item) => item.entradas || item.saidas || item.saldo)) {
    if (state.charts.movement) {
      state.charts.movement.destroy();
      state.charts.movement = null;
    }
    drawChartFallback("movementChart", "Sem movimentacoes registradas no ano filtrado.");
    return;
  }

  if (state.charts.movement) {
    state.charts.movement.destroy();
  }

  state.charts.movement = new Chart(context, {
    data: {
      labels: summaryByMonth.map((item) => item.label),
      datasets: [
        {
          type: "bar",
          label: "Entradas",
          data: summaryByMonth.map((item) => item.entradas),
          backgroundColor: createLinearColor(context, "rgba(55, 91, 67, 0.98)", "rgba(103, 149, 111, 0.62)"),
          borderRadius: 10,
          maxBarThickness: 26
        },
        {
          type: "bar",
          label: "Saídas",
          data: summaryByMonth.map((item) => item.saidas),
          backgroundColor: createLinearColor(context, "rgba(140, 75, 56, 0.98)", "rgba(195, 120, 100, 0.62)"),
          borderRadius: 10,
          maxBarThickness: 26
        },
        {
          type: "line",
          label: "Saldo",
          data: summaryByMonth.map((item) => item.saldo),
          borderColor: "#d39b5c",
          backgroundColor: "#d39b5c",
          pointBackgroundColor: "#fff7ed",
          pointBorderColor: "#d39b5c",
          pointRadius: 4,
          pointHoverRadius: 5,
          borderWidth: 3,
          tension: 0.32
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            padding: 16
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(76, 55, 34, 0.08)"
          }
        }
      }
    }
  });
}

function renderRankingChart(farm) {
  if (typeof window.Chart !== "function") {
    drawChartFallback("rankingChart", "Gráfico indisponível no momento.");
    return;
  }

  const context = document.getElementById("rankingChart");
  const categories = [...farm.categories]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  if (!categories.some((category) => Number(category.quantity || 0) > 0)) {
    if (state.charts.ranking) {
      state.charts.ranking.destroy();
      state.charts.ranking = null;
    }
    drawChartFallback("rankingChart", "Sem lotes com animais para montar o ranking.");
    return;
  }

  if (state.charts.ranking) {
    state.charts.ranking.destroy();
  }

  state.charts.ranking = new Chart(context, {
    type: "bar",
    data: {
      labels: categories.map((category) => category.name),
      datasets: [{
        label: "Quantidade",
        data: categories.map((category) => category.quantity),
        backgroundColor: createLinearColor(context, "rgba(211, 155, 92, 0.96)", "rgba(237, 206, 166, 0.92)"),
        borderRadius: 12,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label(chartContext) {
              return `${formatInteger(chartContext.raw)} animais`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: "rgba(76, 55, 34, 0.08)"
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function renderMonthlyEvolutionChart(farm) {
  if (typeof window.Chart !== "function") {
    drawChartFallback("monthlyEvolutionChart", "Gráfico indisponível no momento.");
    return;
  }

  const context = document.getElementById("monthlyEvolutionChart");
  const evolution = getMonthlyEvolution(farm, state.filters.year);

  if (!evolution.some((item) => item.count || item.quantity || item.value)) {
    if (state.charts.monthlyEvolution) {
      state.charts.monthlyEvolution.destroy();
      state.charts.monthlyEvolution = null;
    }
    drawChartFallback("monthlyEvolutionChart", "Sem dados mensais no ano filtrado.");
    return;
  }

  if (state.charts.monthlyEvolution) {
    state.charts.monthlyEvolution.destroy();
  }

  state.charts.monthlyEvolution = new Chart(context, {
    type: "bar",
    data: {
      labels: evolution.map((item) => item.label),
      datasets: [
        {
          type: "bar",
          label: "Quantidade",
          data: evolution.map((item) => item.quantity),
          backgroundColor: "rgba(51, 92, 67, 0.72)",
          borderRadius: 10,
          yAxisID: "y"
        },
        {
          type: "line",
          label: "Valor (R$)",
          data: evolution.map((item) => item.value),
          borderColor: "#d39b5c",
          backgroundColor: "rgba(211, 155, 92, 0.2)",
          fill: true,
          tension: 0.34,
          pointRadius: 4,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(76, 55, 34, 0.08)" }
        },
        y1: {
          beginAtZero: true,
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: {
            callback(value) {
              return formatCurrency(value).replace(",00", "");
            }
          }
        }
      }
    }
  });
}

function renderMonthlyCategoryChart(farm) {
  if (typeof window.Chart !== "function") {
    drawChartFallback("monthlyCategoryChart", "Gráfico indisponível no momento.");
    return;
  }

  const context = document.getElementById("monthlyCategoryChart");
  const summary = getMonthlySummary(farm);
  const labels = summary.byCategory.map((item) => item.label);
  const values = summary.byCategory.map((item) => item.value > 0 ?item.value : item.quantity > 0 ?item.quantity : item.count);

  if (!hasMeaningfulMonthlyData(summary)) {
    if (state.charts.monthlyCategory) {
      state.charts.monthlyCategory.destroy();
      state.charts.monthlyCategory = null;
    }
    drawChartFallback("monthlyCategoryChart", "Sem dados mensais para distribuir por categoria.");
    return;
  }

  if (state.charts.monthlyCategory) {
    state.charts.monthlyCategory.destroy();
  }

  state.charts.monthlyCategory = new Chart(context, {
    type: "doughnut",
    data: {
      labels: labels.length ?labels : ["Sem dados"],
      datasets: [{
        data: values.length ?values : [1],
        backgroundColor: (labels.length ?labels : ["Sem dados"]).map((_, index) => COLORS[index % COLORS.length]),
        borderWidth: 0
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            padding: 16
          }
        }
      },
      cutout: "58%"
    },
    plugins: [centerTextPlugin(() => ({
      title: summary.count ?formatInteger(summary.count) : "0",
      subtitle: summary.count ?"dados mensais" : "Sem dados"
    }))]
  });
}

function renderMonthlyCategoryModernChart(farm) {
  if (typeof window.Chart !== "function") {
    drawChartFallback("monthlyCategoryChart", "Grafico indisponivel no momento.");
    return;
  }

  const context = document.getElementById("monthlyCategoryChart");
  if (!context) {
    return;
  }
  const summary = getMonthlySummary(farm);
  const categories = [...summary.byCategory]
    .map((item) => ({
      ...item,
      metric: item.value > 0 ?item.value : item.quantity > 0 ?item.quantity : item.count
    }))
    .filter((item) => item.metric > 0)
    .sort((a, b) => b.metric - a.metric)
    .slice(0, 8);

  if (!hasMeaningfulMonthlyData(summary) || !categories.length) {
    if (state.charts.monthlyCategory) {
      state.charts.monthlyCategory.destroy();
      state.charts.monthlyCategory = null;
    }
    drawChartFallback("monthlyCategoryChart", "Sem dados mensais para distribuir por categoria.");
    return;
  }

  const labels = categories.map((item) => item.label);
  const values = categories.map((item) => item.metric);
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const usesValue = categories.some((item) => item.value > 0);
  const usesQuantity = !usesValue && categories.some((item) => item.quantity > 0);
  const metricLabel = usesValue ?"Valor" : usesQuantity ?"Quantidade" : "Registros";

  if (state.charts.monthlyCategory) {
    state.charts.monthlyCategory.destroy();
  }

  context.setAttribute(
    "aria-label",
    `Grafico de barras da distribuicao dos dados mensais por categoria em ${metricLabel.toLowerCase()}`
  );

  state.charts.monthlyCategory = new Chart(context, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: metricLabel,
        data: values,
        backgroundColor: labels.map((_, index) => createLinearColor(
          context,
          lightenColor(COLORS[index % COLORS.length], 0.2),
          COLORS[index % COLORS.length]
        )),
        borderRadius: 14,
        borderSkipped: false,
        barThickness: 18,
        maxBarThickness: 22
      }]
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 12
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "rgba(38, 31, 24, 0.94)",
          padding: 12,
          displayColors: false,
          callbacks: {
            title(items) {
              return items[0]?.label || "";
            },
            label(chartContext) {
              const item = categories[chartContext.dataIndex];
              if (!item) {
                return `${metricLabel}: ${chartContext.raw}`;
              }

              if (usesValue) {
                return `Valor: ${formatCurrency(item.value)}`;
              }

              if (usesQuantity) {
                return `Quantidade: ${formatInteger(item.quantity)}`;
              }

              return `Registros: ${formatInteger(item.count)}`;
            },
            afterLabel(chartContext) {
              const item = categories[chartContext.dataIndex];
              if (!item) {
                return "";
              }

              return `Participacao: ${((item.metric / total) * 100).toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: "rgba(76, 55, 34, 0.08)"
          },
          ticks: {
            color: "#6a5a47",
            font: {
              weight: "700"
            },
            callback(value) {
              return usesValue
                ?formatCurrency(value).replace(",00", "")
                : formatInteger(value);
            }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: "#4c4032",
            font: {
              size: 12,
              weight: "700"
            },
            callback(value) {
              return trimLabel(labels[value] || "", 24);
            }
          }
        }
      }
    }
  });
}

function syncMovementFarmOptions(selectedFarmId = null) {
  const farms = getAllFarms();
  const shouldRequireExplicitSelection = !selectedFarmId && state.data.selectedFarmId === TOTAL_FARM_ID;
  const currentId = selectedFarmId ?? (state.data.selectedFarmId !== TOTAL_FARM_ID ? state.data.selectedFarmId : "");
  elements.movementFarm.innerHTML = [
    shouldRequireExplicitSelection ?'<option value="">Selecione uma fazenda</option>' : "",
    ...farms.map((farm) => `
    <option value="${escapeHtml(farm.id)}" ${farm.id === currentId ?"selected" : ""}>${escapeHtml(farm.name)}</option>
  `)
  ].join("");
  elements.movementFarm.value = currentId;
  if (elements.movementFarmWrap) {
    elements.movementFarmWrap.hidden = state.data.selectedFarmId !== TOTAL_FARM_ID && !selectedFarmId;
  }
}

function getMovementDialogFarm() {
  const farmId = elements.movementFarm?.value;
  return (farmId && state.data.farms[farmId]) ?state.data.farms[farmId] : null;
}

function openMovementDialog(initialType) {
  runtime.editingMovement = null;
  elements.movementType.classList.remove("select-locked");
  if (elements.movementCategory) elements.movementCategory.classList.remove("select-locked");
  elements.movementQuantity.classList.remove("select-locked");
  elements.movementQuantity.readOnly = false;
  const editNotice = document.getElementById("movEditNotice");
  if (editNotice) editNotice.hidden = true;
  if (elements.movUsdRate) elements.movUsdRate.value = "";
  if (elements.movUsdBrlEquiv) elements.movUsdBrlEquiv.value = "";
  if (elements.movUsdRateWrap) elements.movUsdRateWrap.hidden = true;
  const catHintWrap = document.getElementById("movCategoryTotalWrap");
  if (catHintWrap) catHintWrap.hidden = true;
  syncMovementFarmOptions();
  syncMovementTypeOptions(initialType);
  if (elements.movementSpecies) elements.movementSpecies.value = "bovino";
  syncMovementCategoryOptionsForFarm(getMovementDialogFarm());
  syncMovementPotreirosOptions();
  elements.movementDate.value = new Date().toISOString().slice(0, 10);
  elements.movementQuantity.value = "";
  elements.adjustDirection.value = "add";
  elements.movementSaleMode.value = "vivo";
  elements.movementLivePrice.value = "";
  elements.movementLiveKg.value = "";
  elements.movementCarcassPrice.value = "";
  elements.movementCarcassKg.value = "";
  elements.movementValue.value = "";
  elements.movementNotes.value = "";
  if (elements.movSaleBuyer) elements.movSaleBuyer.value = "";
  if (elements.movSaleYieldPct) elements.movSaleYieldPct.value = "";
  const saleTotalsBar = document.getElementById("movSaleTotalsBar");
  if (saleTotalsBar) {
    saleTotalsBar.hidden = true;
    ["fmtSaleTotal","fmtSalePerHead","fmtSalePriceKg","fmtSaleAvgWeight"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ""; });
  }
  if (elements.movPurchaseSource) elements.movPurchaseSource.value = "";
  if (elements.movPurchaseAvgWeight) elements.movPurchaseAvgWeight.value = "";
  if (elements.movPurchaseTotalWeight) { elements.movPurchaseTotalWeight.value = ""; delete elements.movPurchaseTotalWeight.dataset.manualEdit; }
  if (elements.movPurchasePricePerKg) elements.movPurchasePricePerKg.value = "";
  if (elements.movPurchaseValuePerHead) elements.movPurchaseValuePerHead.value = "";
  resetMovementPhotoDrafts();
  updateMovementFormForType(initialType);
  syncUsdRateVisibility();
  if (elements.movementDialog.open) elements.movementDialog.close();
  elements.movementDialog.showModal();
}

function resetMovementPhotoDrafts() {
  runtime.movementPhotoDrafts = [];
  if (elements.movementPhotos) {
    elements.movementPhotos.value = "";
  }
  renderMovementPhotoDrafts();
}

function movementTypeSupportsPhotos(type) {
  return MOVEMENT_PHOTO_TYPES.has(type);
}

function renderMovementPhotoDrafts() {
  const count = runtime.movementPhotoDrafts.length;
  const visible = movementTypeSupportsPhotos(elements.movementType.value);

  elements.movementPhotoWrap.hidden = !visible;
  elements.movementPhotoPanel.hidden = !visible || !count;
  elements.movementPhotoCounter.textContent = count
    ?`${formatInteger(count)} ${count === 1 ?"foto anexada" : "fotos anexadas"}`
    : "Nenhuma foto anexada.";

  if (!visible || !count) {
    elements.movementPhotoPreview.innerHTML = "";
    return;
  }

  elements.movementPhotoPreview.innerHTML = runtime.movementPhotoDrafts.map((photo, index) => `
    <article class="movement-photo-card">
      <img src="${photo.url || photo.dataUrl}" alt="${escapeHtml(photo.name || `Foto ${index + 1}`)}">
      <div class="movement-photo-meta">
        <strong>${escapeHtml(photo.name || `Foto ${index + 1}`)}</strong>
        <span>${formatInteger(index + 1)} de ${formatInteger(count)} | ${escapeHtml(photo.caption || "Pronto para o PDF")}</span>
      </div>
      <button type="button" class="ghost-btn movement-photo-remove" data-remove-movement-photo="${escapeHtml(photo.id)}">Remover</button>
    </article>
  `).join("");
}

async function handleMovementPhotosChange(event) {
  const files = [...(event.target.files || [])];
  if (!files.length) {
    return;
  }

  if (!movementTypeSupportsPhotos(elements.movementType.value)) {
    resetMovementPhotoDrafts();
    return;
  }

  const availableSlots = Math.max(0, MAX_MOVEMENT_PHOTOS - runtime.movementPhotoDrafts.length);
  if (availableSlots === 0) {
    alert(`Cada lançamento aceita até ${MAX_MOVEMENT_PHOTOS} fotos.`);
    event.target.value = "";
    return;
  }

  const nextFiles = files.slice(0, availableSlots);
  if (files.length > availableSlots) {
    alert(`Foram consideradas apenas ${availableSlots} fotos para manter o limite de ${MAX_MOVEMENT_PHOTOS} por lançamento.`);
  }

  elements.movementPhotoCounter.textContent = "Enviando fotos para o servidor...";
  elements.movementPhotoPanel.hidden = false;

  const processed = [];
  for (const file of nextFiles) {
    if (!String(file.type || "").startsWith("image/")) {
      continue;
    }

    try {
      processed.push(await createMovementPhotoAttachment(file));
    } catch (error) {
      console.warn("Não foi possível preparar a foto para o lançamento.", error);
      alert(`Falha ao enviar a foto "${file.name}". Verifique sua conexão e tente novamente.`);
    }
  }

  runtime.movementPhotoDrafts = [...runtime.movementPhotoDrafts, ...processed];
  event.target.value = "";
  renderMovementPhotoDrafts();
}

function handleMovementPhotoPreviewClick(event) {
  const trigger = event.target.closest("[data-remove-movement-photo]");
  if (!trigger) {
    return;
  }

  runtime.movementPhotoDrafts = runtime.movementPhotoDrafts.filter((photo) => photo.id !== trigger.dataset.removeMovementPhoto);
  renderMovementPhotoDrafts();
}

function openAlocarDialog() {
  const farms = getAllFarms();
  const farmId = state.data.selectedFarmId !== TOTAL_FARM_ID
    ? state.data.selectedFarmId
    : farms[0]?.id;
  if (!farmId) {
    alert("Nenhuma fazenda disponível.");
    return;
  }
  openPotrManejDialog(farmId, UNALLOCATED_POTREIRO_KEY);
}

function syncCategoryPotreirosOptions() {
  const farmId = elements.categoryFarm?.value;
  const farm = farmId ? state.data.farms[farmId] : null;
  const potreiros = getPotreroEntries(farm);
  elements.categoryPotreiro.innerHTML = [
    '<option value="">Sem potreiro</option>',
    ...potreiros.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`)
  ].join("");
}

function updateCategoryPotreiroVisibility() {
  const species = elements.categorySpecies?.value || "bovino";
  if (elements.categoryPotreiroWrap) {
    elements.categoryPotreiroWrap.hidden = species === "ovino";
  }
}

function openCategoryDialog() {
  const farms = getAllFarms();
  const defaultFarmId = state.data.selectedFarmId !== TOTAL_FARM_ID
    ? state.data.selectedFarmId
    : farms[0]?.id || "";
  elements.categoryFarm.innerHTML = farms.map((f) =>
    `<option value="${escapeHtml(f.id)}" ${f.id === defaultFarmId ? "selected" : ""}>${escapeHtml(f.name)}</option>`
  ).join("");
  if (elements.categorySpecies) elements.categorySpecies.value = "bovino";
  elements.categoryName.value = "";
  elements.categoryInitialQuantity.value = "0";
  syncCategoryPotreirosOptions();
  updateCategoryPotreiroVisibility();
  elements.categoryDialog.showModal();
}

function syncMonthlyDataFarmOptions(selectedFarmId = elements.monthlyDataFarm.value || (state.data.selectedFarmId === TOTAL_FARM_ID ?getAllFarms()[0]?.id : state.data.selectedFarmId)) {
  elements.monthlyDataFarm.innerHTML = getAllFarms().map((farm) => `
    <option value="${farm.id}" ${farm.id === selectedFarmId ?"selected" : ""}>${escapeHtml(farm.name)}</option>
  `).join("");
  if (selectedFarmId) {
    elements.monthlyDataFarm.value = selectedFarmId;
  }
}

function syncMonthlyDataCategoryOptions(selectedCategory = elements.monthlyDataCategory.value || MONTHLY_REPORT_CATEGORIES[0].value) {
  elements.monthlyDataCategory.innerHTML = MONTHLY_REPORT_CATEGORIES.map((category) => `
    <option value="${category.value}" ${category.value === selectedCategory ?"selected" : ""}>${escapeHtml(category.label)}</option>
  `).join("");
  elements.monthlyDataCategory.value = selectedCategory;
}

function resetMonthlyDataForm(defaultFarmId = state.data.selectedFarmId === TOTAL_FARM_ID ?getAllFarms()[0]?.id : state.data.selectedFarmId) {
  state.monthlyEditingId = null;
  elements.monthlyDataDialogTitle.textContent = "Registrar dado mensal";
  elements.monthlyDataSubmitButton.textContent = "Salvar dado mensal";
  elements.monthlyDataEditingId.value = "";
  syncMonthlyDataFarmOptions(defaultFarmId);
  syncMonthlyDataCategoryOptions();
  elements.monthlyDataPeriod.value = `${state.filters.year}-${state.filters.month === "all" ?String(today.getMonth() + 1).padStart(2, "0") : state.filters.month}`;
  elements.monthlyDataTitle.value = "";
  elements.monthlyDataQuantity.value = "";
  elements.monthlyDataValue.value = "";
  elements.monthlyDataNotes.value = "";
}

function openMonthlyDataDialog() {
  resetMonthlyDataForm();
  elements.monthlyDataDialog.showModal();
}

function openMonthlyDataEditor(recordId) {
  if (state.data.selectedFarmId === TOTAL_FARM_ID) {
    const aggregateFarm = getAggregateFarm();
    const aggregateRecord = getMonthlyRecords(aggregateFarm).find((record) => record.id === recordId);
    if (aggregateRecord?.farmId) {
      openMonthlyDataEditorForFarm(recordId, aggregateRecord.farmId);
    }
    return;
  }

  openMonthlyDataEditorForFarm(recordId, state.data.selectedFarmId);
}

function openMonthlyDataEditorForFarm(recordId, farmId) {
  const farm = state.data.farms[farmId];
  const record = getMonthlyRecords(farm).find((item) => item.id === recordId);
  if (!farm || !record) {
    return;
  }

  state.monthlyEditingId = record.id;
  elements.monthlyDataDialogTitle.textContent = "Editar dado mensal";
  elements.monthlyDataSubmitButton.textContent = "Atualizar dado mensal";
  elements.monthlyDataEditingId.value = record.id;
  syncMonthlyDataFarmOptions(farm.id);
  syncMonthlyDataCategoryOptions(record.category);
  elements.monthlyDataPeriod.value = record.period;
  elements.monthlyDataTitle.value = record.title;
  elements.monthlyDataQuantity.value = record.quantity ?String(record.quantity) : "";
  elements.monthlyDataValue.value = record.value ?String(record.value) : "";
  elements.monthlyDataNotes.value = record.notes || "";
  elements.monthlyDataDialog.showModal();
}

// ── Stock Editor ──────────────────────────────────────────────────────────

function openEditStockDialog() {
  renderStockCategoryAccordion();
  renderStockPotreirosAccordion();
  setStockEditorTab("categorias");
  updateStockEditorHint();
  elements.editStockDialog.showModal();
}

function setStockEditorTab(tab) {
  document.querySelectorAll(".stock-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.stockTab === tab);
  });
  document.getElementById("stockPanelCategorias").hidden = tab !== "categorias";
  document.getElementById("stockPanelPotreiros").hidden  = tab !== "potreiros";
}

function updateStockEditorHint() {
  const hint = document.getElementById("stockEditorHint");
  if (!hint) return;
  const farms = getAllFarms();
  const total = farms.reduce((s, f) => s + getFarmTotal(f), 0);
  hint.textContent = `${farms.length} fazenda(s) · ${formatInteger(total)} animais no sistema`;
}

function stockCategoryRowHtml(farmId, cat) {
  return `
    <tr data-cat-row="${escapeHtml(cat.id)}" data-farm-id="${escapeHtml(farmId)}">
      <td><input type="text" class="stock-input" value="${escapeHtml(cat.name)}"
          data-cat-name="${escapeHtml(cat.id)}" maxlength="80" placeholder="Nome da categoria" required></td>
      <td><input type="number" class="stock-input stock-qty" value="${Number(cat.quantity || 0)}"
          min="0" step="1" data-cat-qty="${escapeHtml(cat.id)}"></td>
      <td><button type="button" class="stock-remove-btn" title="Remover categoria"
          data-remove-cat="${escapeHtml(cat.id)}" data-farm-id="${escapeHtml(farmId)}">&#x2715;</button></td>
    </tr>`;
}

function stockPotreirosRowHtml(farmId, p) {
  return `
    <tr data-potr-row="${escapeHtml(p.id)}" data-farm-id="${escapeHtml(farmId)}">
      <td><input type="text" class="stock-input" value="${escapeHtml(p.name)}"
          data-potr-name="${escapeHtml(p.id)}" maxlength="80" placeholder="Nome do potreiro" required></td>
      <td><input type="number" class="stock-input stock-qty" value="${Number(p.quantity || 0)}"
          min="0" step="1" data-potr-qty="${escapeHtml(p.id)}"></td>
      <td><button type="button" class="stock-remove-btn" title="Remover potreiro"
          data-remove-potr="${escapeHtml(p.id)}" data-farm-id="${escapeHtml(farmId)}">&#x2715;</button></td>
    </tr>`;
}

function renderStockCategoryAccordion() {
  const farms = getAllFarms();
  const el = document.getElementById("stockCategoryAccordion");
  el.innerHTML = farms.map((farm, i) => {
    const total = getFarmTotal(farm);
    const declared = farm.declaredTotal || total;
    const diff = declared - total;
    const diffLabel = diff === 0
      ?'<span class="stock-ok">✓ Alinhado</span>'
      : `<span class="stock-diff ${diff > 0 ?"stock-diff-pos" : "stock-diff-neg"}">${diff > 0 ?"+" : ""}${formatInteger(diff)} declarado vs. calculado</span>`;
    return `
      <div class="stock-accordion-item" data-cat-farm="${escapeHtml(farm.id)}">
        <button type="button" class="stock-accordion-hdr" data-toggle-cat="${escapeHtml(farm.id)}">
          <span class="stock-farm-name">${escapeHtml(farm.name)}</span>
          <span class="stock-farm-meta">${farm.categories.length} categoria(s) · ${formatInteger(total)} animais ${diffLabel}</span>
          <span class="stock-chevron">${i === 0 ?"▲" : "▼"}</span>
        </button>
        <div class="stock-accordion-body" ${i > 0 ?"hidden" : ""} data-cat-body="${escapeHtml(farm.id)}">
          <div class="stock-declared-row">
            <label>Total declarado
              <input type="number" class="stock-input" min="0" step="1"
                value="${declared}" data-declared="${escapeHtml(farm.id)}">
            </label>
            <span class="stock-live-total" data-live="${escapeHtml(farm.id)}">Calculado: ${formatInteger(total)}</span>
          </div>
          <table class="stock-table">
            <thead><tr><th>Categoria</th><th>Quantidade</th><th></th></tr></thead>
            <tbody data-cat-tbody="${escapeHtml(farm.id)}">
              ${farm.categories.map((cat) => stockCategoryRowHtml(farm.id, cat)).join("")}
            </tbody>
          </table>
          <button type="button" class="stock-add-btn" data-add-cat="${escapeHtml(farm.id)}">+ Adicionar categoria</button>
        </div>
      </div>`;
  }).join("");

  // Live quantity total update
  el.addEventListener("input", (e) => {
    const qtyInput = e.target.closest("[data-cat-qty]");
    if (!qtyInput) return;
    const row = qtyInput.closest("[data-cat-row]");
    const farmId = row?.dataset.farmId;
    if (!farmId) return;
    const tbody = el.querySelector(`[data-cat-tbody="${farmId}"]`);
    let live = 0;
    tbody?.querySelectorAll("[data-cat-qty]").forEach((inp) => { live += Number(inp.value) || 0; });
    const liveEl = el.querySelector(`[data-live="${farmId}"]`);
    if (liveEl) liveEl.textContent = `Calculado: ${formatInteger(live)}`;
  });
}

function renderStockPotreirosAccordion() {
  const farms = getAllFarms();
  const el = document.getElementById("stockPotreirosAccordion");
  el.innerHTML = farms.map((farm, i) => {
    const potreiros = getPotreroEntries(farm);
    const allocated = potreiros.reduce((s, p) => s + (Number(p.quantity) || 0), 0);
    const farmTotal = getFarmTotal(farm);
    const pct = farmTotal > 0 ?Math.round((allocated / farmTotal) * 100) : 0;
    return `
      <div class="stock-accordion-item" data-potr-farm="${escapeHtml(farm.id)}">
        <button type="button" class="stock-accordion-hdr" data-toggle-potr="${escapeHtml(farm.id)}">
          <span class="stock-farm-name">${escapeHtml(farm.name)}</span>
          <span class="stock-farm-meta">${potreiros.length} potreiro(s) · ${formatInteger(allocated)}/${formatInteger(farmTotal)} alocados (${pct}%)</span>
          <span class="stock-chevron">${i === 0 ?"▲" : "▼"}</span>
        </button>
        <div class="stock-accordion-body" ${i > 0 ?"hidden" : ""} data-potr-body="${escapeHtml(farm.id)}">
          <table class="stock-table">
            <thead><tr><th>Potreiro</th><th>Animais</th><th></th></tr></thead>
            <tbody data-potr-tbody="${escapeHtml(farm.id)}">
              ${potreiros.map((p) => stockPotreirosRowHtml(farm.id, p)).join("")}
            </tbody>
          </table>
          <button type="button" class="stock-add-btn" data-add-potr="${escapeHtml(farm.id)}">+ Adicionar potreiro</button>
        </div>
      </div>`;
  }).join("");
}

function handleStockCategoryAccordionClick(e) {
  // Toggle accordion
  const toggleBtn = e.target.closest("[data-toggle-cat]");
  if (toggleBtn) {
    const farmId = toggleBtn.dataset.toggleCat;
    const body = document.querySelector(`[data-cat-body="${farmId}"]`);
    const chevron = toggleBtn.querySelector(".stock-chevron");
    if (body) {
      body.hidden = !body.hidden;
      if (chevron) chevron.textContent = body.hidden ?"▼" : "▲";
    }
    return;
  }
  // Remove category row
  const removeBtn = e.target.closest("[data-remove-cat]");
  if (removeBtn) {
    removeBtn.closest("[data-cat-row]")?.remove();
    return;
  }
  // Add category row
  const addBtn = e.target.closest("[data-add-cat]");
  if (addBtn) {
    const farmId = addBtn.dataset.addCat;
    const tbody = document.querySelector(`[data-cat-tbody="${farmId}"]`);
    if (tbody) {
      const newId = `new-cat-${Date.now()}`;
      const newRow = document.createElement("tr");
      newRow.dataset.catRow = newId;
      newRow.dataset.farmId = farmId;
      newRow.innerHTML = `
        <td><input type="text" class="stock-input" value="" data-cat-name="${newId}" maxlength="80" placeholder="Nome da categoria" required></td>
        <td><input type="number" class="stock-input stock-qty" value="0" min="0" step="1" data-cat-qty="${newId}"></td>
        <td><button type="button" class="stock-remove-btn" data-remove-cat="${newId}" data-farm-id="${farmId}">&#x2715;</button></td>`;
      tbody.appendChild(newRow);
      newRow.querySelector("[data-cat-name]")?.focus();
    }
  }
}

function handleStockPotreirosAccordionClick(e) {
  // Toggle accordion
  const toggleBtn = e.target.closest("[data-toggle-potr]");
  if (toggleBtn) {
    const farmId = toggleBtn.dataset.togglePotr;
    const body = document.querySelector(`[data-potr-body="${farmId}"]`);
    const chevron = toggleBtn.querySelector(".stock-chevron");
    if (body) {
      body.hidden = !body.hidden;
      if (chevron) chevron.textContent = body.hidden ?"▼" : "▲";
    }
    return;
  }
  // Remove potreiro row
  const removeBtn = e.target.closest("[data-remove-potr]");
  if (removeBtn) {
    removeBtn.closest("[data-potr-row]")?.remove();
    return;
  }
  // Add potreiro row
  const addBtn = e.target.closest("[data-add-potr]");
  if (addBtn) {
    const farmId = addBtn.dataset.addPotr;
    const tbody = document.querySelector(`[data-potr-tbody="${farmId}"]`);
    if (tbody) {
      const newId = createPotreroId(`potreiro-${Date.now()}`);
      const newRow = document.createElement("tr");
      newRow.dataset.potrRow = newId;
      newRow.dataset.farmId = farmId;
      newRow.innerHTML = `
        <td><input type="text" class="stock-input" value="" data-potr-name="${newId}" maxlength="80" placeholder="Ex.: Potreiro Norte" required></td>
        <td><input type="number" class="stock-input stock-qty" value="0" min="0" step="1" data-potr-qty="${newId}"></td>
        <td><button type="button" class="stock-remove-btn" data-remove-potr="${newId}" data-farm-id="${farmId}">&#x2715;</button></td>`;
      tbody.appendChild(newRow);
      newRow.querySelector("[data-potr-name]")?.focus();
    }
  }
}

function handleSaveStockEdit() {
  const farms = getAllFarms();
  const errors = [];

  // Validate & collect categories
  const catUpdates = {};
  for (const farm of farms) {
    const tbody = document.querySelector(`[data-cat-tbody="${farm.id}"]`);
    if (!tbody) continue;
    const rows = [...tbody.querySelectorAll("[data-cat-row]")];
    const seen = new Set();
    const cats = [];
    for (const row of rows) {
      const catId = row.dataset.catRow;
      const name = row.querySelector("[data-cat-name]")?.value.trim() || "";
      const qty = Number(row.querySelector("[data-cat-qty]")?.value);
      if (!name) { errors.push(`${farm.name}: nome de categoria em branco.`); break; }
      if (!Number.isFinite(qty) || qty < 0) { errors.push(`${farm.name}: quantidade inválida em "${name}".`); break; }
      const normalized = normalizeText(name);
      if (seen.has(normalized)) { errors.push(`${farm.name}: categoria "${name}" duplicada.`); break; }
      seen.add(normalized);
      cats.push({ id: catId, name, qty });
    }
    const declaredInput = document.querySelector(`[data-declared="${farm.id}"]`);
    const declared = Number(declaredInput?.value);
    catUpdates[farm.id] = { cats, declared: Number.isFinite(declared) && declared >= 0 ?declared : getFarmTotal(farm) };
  }

  // Validate & collect potreiros
  const potrUpdates = {};
  for (const farm of farms) {
    const tbody = document.querySelector(`[data-potr-tbody="${farm.id}"]`);
    if (!tbody) continue;
    const rows = [...tbody.querySelectorAll("[data-potr-row]")];
    const seen = new Set();
    const potrs = [];
    for (const row of rows) {
      const potrId = row.dataset.potrRow;
      const name = row.querySelector("[data-potr-name]")?.value.trim() || "";
      const qty = Number(row.querySelector("[data-potr-qty]")?.value);
      if (!name) { errors.push(`${farm.name}: nome de potreiro em branco.`); break; }
      if (!Number.isFinite(qty) || qty < 0) { errors.push(`${farm.name}: quantidade inválida em "${name}".`); break; }
      const normalized = normalizeText(name);
      if (seen.has(normalized)) { errors.push(`${farm.name}: potreiro "${name}" duplicado.`); break; }
      seen.add(normalized);
      potrs.push({ id: potrId.startsWith("new-") ?createPotreroId(name) : potrId, name, quantity: qty });
    }
    potrUpdates[farm.id] = potrs;
  }

  if (errors.length) {
    alert(errors[0]);
    return;
  }

  // Apply all changes
  for (const farm of farms) {
    const { cats, declared } = catUpdates[farm.id] || { cats: [], declared: 0 };
    const newCatIds = new Set();
    for (const { id, name, qty } of cats) {
      const existing = farm.categories.find((c) => c.id === id);
      if (existing) {
        if (existing.name !== name) {
          farm.movements.forEach((m) => { if (m.categoryId === id) m.categoryName = name; });
          farm.sanitaryRecords.forEach((r) => { if (r.categoryId === id) r.categoryName = name; });
          existing.name = name;
        }
        if (existing.quantity !== qty) {
          const diff = qty - existing.quantity;
          existing.quantity = qty;
          ensureCategoryAllocation(existing);
          existing.allocation[UNALLOCATED_POTREIRO_KEY] = Math.max(0, Number(existing.allocation[UNALLOCATED_POTREIRO_KEY] || 0) + diff);
        }
      } else {
        // Nova categoria — id definitivo baseado no nome
        const newId = slugify(`${name}-${Date.now()}`);
        farm.categories.push({ id: newId, name, quantity: qty });
        newCatIds.add(newId);
      }
    }
    // Remove categorias excluídas, preservando as recém-criadas
    const keptIds = new Set([...cats.map((c) => c.id), ...newCatIds]);
    farm.categories = farm.categories.filter((c) => keptIds.has(c.id));

    farm.declaredTotal = declared;
    farm.potreiros = potrUpdates[farm.id] || farm.potreiros;
  }

  logAuditEvent("Edição", "estoque", "Categorias, potreiros e totais declarados atualizados");
  saveData();
  elements.editStockDialog.close();
  render();
}

function getSanitaryDialogFarm() {
  const farmId = elements.sanitaryFarm?.value;
  if (farmId && state.data.farms[farmId]) {
    return state.data.farms[farmId];
  }
  return getFarm();
}

function resetSanitaryForm() {
  elements.sanitaryEditingId.value = "";
  elements.sanitaryQuantity.value = "";
  elements.sanitaryNotes.value = "";
  elements.newProductName.value = "";
  elements.newPotreroName.value = "";
  if (elements.sanitarySpecies) elements.sanitarySpecies.value = "bovino";
  if (elements.sanitaryDialogTitle) {
    elements.sanitaryDialogTitle.textContent = "Registro Sanitário";
  }
  elements.sanitarySubmitButton.textContent = "Salvar registro sanitário";
  syncSanitaryFormOptions();
  updateSanitaryProductMode();
  updateSanitaryPotreroMode();
}

function openSanitaryDialog() {
  if (state.data.selectedFarmId === TOTAL_FARM_ID) {
    alert("Selecione uma fazenda específica para registrar o manejo sanitário.");
    return;
  }
  resetSanitaryForm();
  elements.sanitaryDialog?.showModal();
}

function closeSanitaryDialog() {
  elements.sanitaryDialog?.close();
}

function deleteSanitaryRecord(recordId) {
  const aggregateRecord = getAggregateFarm().sanitaryRecords.find((item) => item.id === recordId || item.sourceId === recordId);
  const ownerFarmId = aggregateRecord?.farmId || aggregateRecord?._farmId;
  const farm = ownerFarmId
    ?state.data.farms[ownerFarmId]
    : getAllFarms().find((item) => item.sanitaryRecords.some((record) => record.id === recordId || record.sourceId === recordId));
  if (!farm) {
    return;
  }

  const record = farm.sanitaryRecords.find((item) => item.id === recordId || item.sourceId === recordId);
  if (!record) {
    return;
  }

  if (!confirm(`Excluir o registro sanitário ${record.code || ""}?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }

  farm.sanitaryRecords = farm.sanitaryRecords.filter((item) => item.id !== recordId && item.sourceId !== recordId);
  logAuditEvent("Exclusão", "sanitário", `${record.product} - ${record.categoryName}`, {
    farmId: farm.id,
    farmName: farm.name,
    recordCode: record.code || ""
  });
  saveData();
  populateYearFilter();
  render();
}

function openSanitaryEditor(recordId) {
  if (state.data.selectedFarmId === TOTAL_FARM_ID) {
    const aggregateFarm = getAggregateFarm();
    const aggregateRecord = aggregateFarm.sanitaryRecords.find((item) => item.id === recordId || item.sourceId === recordId);
    if (aggregateRecord?.farmId && state.data.farms[aggregateRecord.farmId]) {
      state.data.selectedFarmId = aggregateRecord.farmId;
      saveData();
      render();
      openSanitaryEditor(recordId);
    }
    return;
  }

  const farm = getFarm();
  const record = farm.sanitaryRecords.find((item) => item.id === recordId || item.sourceId === recordId);
  if (!record) {
    return;
  }

  state.activeView = "sanitary";
  renderActiveView();
  if (elements.sanitarySpecies) elements.sanitarySpecies.value = record.especie || "bovino";
  syncSanitaryFormOptions();
  ensureSanitaryCategoryOption(record.categoryId, record.categoryName);
  ensureSelectOption(elements.sanitaryProduct, record.product, record.product);
  ensureSelectOption(elements.sanitaryPotrero, record.potreiro || "Sem potreiro", record.potreiro || "Sem potreiro");

  elements.sanitaryEditingId.value = record.id || record.sourceId;
  elements.sanitaryFarm.value = farm.id;
  elements.sanitaryDate.value = record.date;
  elements.sanitaryQuantity.value = Number.isFinite(record.quantity) ?String(record.quantity) : "";
  elements.sanitaryCategory.value = record.categoryId;
  elements.sanitaryProduct.value = record.product;
  elements.sanitaryPotrero.value = record.potreiro || "Sem potreiro";
  elements.sanitaryNotes.value = record.notes || "";
  if (elements.sanitaryDialogTitle) {
    elements.sanitaryDialogTitle.textContent = "Editar Registro Sanitário";
  }
  elements.sanitarySubmitButton.textContent = "Atualizar registro sanitário";
  updateSanitaryProductMode();
  updateSanitaryPotreroMode();
  elements.sanitaryDialog?.showModal();
}

function syncMovementTypeOptions(selectedType = elements.movementType.value || "compra") {
  elements.movementType.innerHTML = MOVEMENT_TYPES.map((type) => `
    <option value="${type.value}" ${type.value === selectedType ?"selected" : ""}>${type.label}</option>
  `).join("");
}

function updateMovementFormForType(type) {
  const farm = getMovementDialogFarm() || getFarm();
  const typeMeta = MOVEMENT_TYPES.find((item) => item.value === type);
  elements.movementDialogTitle.textContent = typeMeta ?`Registrar ${typeMeta.label.toLowerCase()}` : "Registrar movimentação";
  elements.adjustDirectionWrap.hidden = type !== "ajuste";
  const isTransfer = type === "transferencia";
  const isExit = typeMeta?.direction === -1;
  const species = elements.movementSpecies?.value || "bovino";
  const isOvino = species === "ovino";
  if (elements.movementPotreiroWrap) {
    elements.movementPotreiroWrap.hidden = isOvino;
    if (elements.movementPotreiroLabel) {
      elements.movementPotreiroLabel.textContent = (isExit || isTransfer) ?"Potreiro de origem" : "Potreiro de destino";
    }
  }
  if (elements.movementPotreirowDestWrap) {
    elements.movementPotreirowDestWrap.hidden = isOvino || !isTransfer;
  }
  if (elements.movementOvinoDestFarmWrap) {
    elements.movementOvinoDestFarmWrap.hidden = !(isOvino && isTransfer);
    if (isOvino && isTransfer) {
      syncMovementOvinoDestFarmOptions(farm);
    }
  }
  // hide quantity/value for transfer (keep notes)
  if (elements.movementValueWrap) elements.movementValueWrap.hidden = isTransfer;
  syncMovementPotreirosOptions();
  const isSale = type === "venda";
  const isPremiumFarm = isPremiumSaleFarm(farm);

  const isCompra = type === "compra";
  elements.movementSaleModeWrap.hidden = !isSale || !isPremiumFarm;
  elements.movementSaleHint.hidden = !isSale;
  if (elements.movSaleExtraWrap) elements.movSaleExtraWrap.hidden = !isSale;
  if (elements.movPurchaseSection) elements.movPurchaseSection.hidden = !isCompra;

  elements.movementValueWrap.hidden = false;
  elements.movementValue.readOnly = isSale;
  if (isCompra) {
    elements.movementValue.readOnly = false;
    elements.movementValueLabel.textContent = "Valor total";
    elements.movementValue.placeholder = "Calculado automaticamente";
  } else if (isSale) {
    elements.movementValueLabel.textContent = "Total calculado";
    elements.movementValue.placeholder = "Calculado automaticamente";
  } else {
    elements.movementValueLabel.textContent = "Valor total (opcional)";
    elements.movementValue.placeholder = "0,00";
    elements.movementValue.value = "";
  }

  if (!movementTypeSupportsPhotos(type)) {
    resetMovementPhotoDrafts();
  } else {
    renderMovementPhotoDrafts();
  }
  updateSaleFieldVisibility();
}

function updateSaleFieldVisibility() {
  const farm = getMovementDialogFarm() || getFarm();
  const isSale = elements.movementType.value === "venda";
  const isPremiumFarm = isPremiumSaleFarm(farm);
  const saleMode = isPremiumFarm ?elements.movementSaleMode.value : "vivo";
  const showLive = isSale && saleMode === "vivo";
  const showCarcass = isSale && isPremiumFarm && saleMode === "carcaca";

  elements.movementLiveFields.hidden = !showLive;
  elements.movementCarcassFields.hidden = !showCarcass;
  elements.movementLivePrice.required = showLive;
  elements.movementLiveKg.required = showLive;
  elements.movementCarcassPrice.required = showCarcass;
  elements.movementCarcassKg.required = showCarcass;

  if (!showLive) {
    elements.movementLivePrice.value = "";
    elements.movementLiveKg.value = "";
  }
  if (!showCarcass) {
    elements.movementCarcassPrice.value = "";
    elements.movementCarcassKg.value = "";
  }

  updateSaleComputedValue();
}

function updateUsdBrlEquiv() {
  if (!elements.movUsdRateWrap || elements.movUsdRateWrap.hidden) return;
  const total = Number(elements.movementValue.value || 0);
  const rate  = Number(elements.movUsdRate?.value || 0);
  if (elements.movUsdBrlEquiv) {
    elements.movUsdBrlEquiv.value = total > 0 && rate > 0
      ? "R$ " + (total * rate).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "";
  }
}

function syncUsdRateVisibility() {
  const farm = getMovementDialogFarm();
  const isUsd = farm && getFarmCurrency(farm.id) === "USD";
  const type  = elements.movementType.value;
  const show  = isUsd && (type === "venda" || type === "compra");
  if (elements.movUsdRateWrap) elements.movUsdRateWrap.hidden = !show;
  if (show) fetchAndFillUsdRate();
}

// Cache de cotação (30 min)
const _usdRateCache = { rate: null, at: 0, label: "" };

async function fetchAndFillUsdRate() {
  const statusEl  = document.getElementById("usdRateLiveText");
  const dotEl     = document.getElementById("usdRateDot");
  const rateInput = elements.movUsdRate;
  if (!rateInput) return;

  // Se o usuário já digitou um valor, não sobrescreve
  if (rateInput.value && rateInput.dataset.userTyped === "1") return;

  // Cache válido por 30 minutos
  const age = (Date.now() - _usdRateCache.at) / 60000;
  if (_usdRateCache.rate && age < 30) {
    _applyUsdRate(_usdRateCache.rate, _usdRateCache.label, rateInput, statusEl, dotEl, false);
    return;
  }

  _setUsdStatus(statusEl, dotEl, "buscando cotação...", "loading");

  try {
    const res = await fetch(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL",
      { signal: AbortSignal.timeout(6000) }
    );
    const json = await res.json();
    const bid  = Number(json?.USDBRL?.bid || 0);
    const ts   = json?.USDBRL?.create_date || "";
    if (bid > 0) {
      const label = ts ? `Atualizado ${ts.slice(0, 16).replace("T", " ")}` : "Cotação do dia";
      _usdRateCache.rate = bid;
      _usdRateCache.at   = Date.now();
      _usdRateCache.label = label;
      _applyUsdRate(bid, label, rateInput, statusEl, dotEl, true);
    } else {
      _setUsdStatus(statusEl, dotEl, "cotação indisponível — informe manualmente", "error");
    }
  } catch {
    _setUsdStatus(statusEl, dotEl, "sem acesso à cotação — informe manualmente", "error");
  }
}

function _applyUsdRate(rate, label, input, statusEl, dotEl, isNew) {
  if (!input.value || isNew) {
    input.value = rate.toFixed(4);
    input.dataset.userTyped = "0";
    updateUsdBrlEquiv();
  }
  _setUsdStatus(statusEl, dotEl, `1 US$ = R$ ${rate.toFixed(4)} · ${label}`, "ok");
}

function _setUsdStatus(el, dot, text, state) {
  if (el) el.textContent = text;
  if (dot) dot.className = `usd-rate-dot usd-rate-dot-${state}`;
}

function updateSaleComputedValue() {
  if (elements.movementType.value !== "venda") {
    return;
  }

  const farm = getMovementDialogFarm();
  const saleMode = isPremiumSaleFarm(farm) ? elements.movementSaleMode.value : "vivo";
  const pricePerKg = Number(saleMode === "carcaca" ? elements.movementCarcassPrice.value : elements.movementLivePrice.value);
  const weightKg   = Number(saleMode === "carcaca" ? elements.movementCarcassKg.value    : elements.movementLiveKg.value);
  const qty        = Number(elements.movementQuantity?.value || 0);
  const total      = pricePerKg > 0 && weightKg > 0 ? +(pricePerKg * weightKg).toFixed(2) : 0;

  elements.movementValue.value = total > 0 ? total.toFixed(2) : "";
  updateUsdBrlEquiv();

  // ── Barra de análise da venda ──
  const bar = document.getElementById("movSaleTotalsBar");
  if (!bar) return;

  const currency  = farm ? getFarmCurrency(farm.id) : "BRL";
  const sym       = currency === "USD" ? "US$" : "R$";
  const hasData   = total > 0 || weightKg > 0;

  const fmtTotal     = document.getElementById("fmtSaleTotal");
  const fmtPerHead   = document.getElementById("fmtSalePerHead");
  const fmtPriceKg   = document.getElementById("fmtSalePriceKg");
  const fmtAvgWeight = document.getElementById("fmtSaleAvgWeight");

  if (fmtTotal)     fmtTotal.textContent     = total > 0 ? "Total: " + sym + " " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
  if (fmtPerHead)   fmtPerHead.textContent   = total > 0 && qty > 0 ? "Preço médio/animal: " + sym + " " + (total / qty).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
  if (fmtPriceKg)   fmtPriceKg.textContent   = pricePerKg > 0 ? sym + " " + pricePerKg.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "/kg" : "";
  if (fmtAvgWeight) fmtAvgWeight.textContent = weightKg > 0 && qty > 0 ? "Peso médio: " + (weightKg / qty).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg/cab." : (weightKg > 0 ? "Lote: " + weightKg.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " kg" : "");
  bar.hidden = !hasData;
}

function updatePurchaseComputedValues() {
  if (elements.movementType.value !== "compra") return;
  const qty        = Number(elements.movementQuantity.value || 0);
  const avgWeight  = Number(elements.movPurchaseAvgWeight?.value || 0);
  const pricePerKg = Number(elements.movPurchasePricePerKg?.value || 0);
  const farm       = getMovementDialogFarm();
  const currency   = farm ? getFarmCurrency(farm.id) : "BRL";
  const sym        = currency === "USD" ? "US$" : "R$";

  // ── Peso médio hint ──
  if (document.getElementById("fmtAvgWeight")) {
    document.getElementById("fmtAvgWeight").textContent =
      avgWeight > 0 ? avgWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " kg/cab." : "";
  }

  // ── Peso total ──
  let totalWeight = 0;
  if (qty > 0 && avgWeight > 0) {
    const computed = +(qty * avgWeight).toFixed(1);
    if (elements.movPurchaseTotalWeight && !elements.movPurchaseTotalWeight.dataset.manualEdit) {
      totalWeight = computed;
      elements.movPurchaseTotalWeight.value =
        computed.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " kg";
    } else {
      totalWeight = parseFloat((elements.movPurchaseTotalWeight?.value || "0").replace(/\./g, "").replace(",", ".")) || 0;
    }
  } else {
    totalWeight = parseFloat((elements.movPurchaseTotalWeight?.value || "0").replace(/\./g, "").replace(",", ".")) || 0;
  }

  // ── Valor por kg hint ──
  if (document.getElementById("fmtPricePerKg")) {
    document.getElementById("fmtPricePerKg").textContent =
      pricePerKg > 0 ? sym + " " + pricePerKg.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + "/kg" : "";
  }

  // ── Valor total e por animal ──
  let total = 0;
  if (pricePerKg > 0 && totalWeight > 0) {
    total = +(pricePerKg * totalWeight).toFixed(2);
    elements.movementValue.value = total;
    if (qty > 0 && elements.movPurchaseValuePerHead) {
      const perHead = total / qty;
      elements.movPurchaseValuePerHead.value =
        sym + " " + perHead.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  } else if (Number(elements.movementValue.value) > 0 && qty > 0 && elements.movPurchaseValuePerHead) {
    total = Number(elements.movementValue.value);
    const perHead = total / qty;
    elements.movPurchaseValuePerHead.value =
      sym + " " + perHead.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Hint valor total ──
  refreshMovementValueHint(sym);

  // ── Barra de totais ──
  const bar = document.getElementById("movPurchaseTotalsBar");
  if (bar) {
    const hasData = total > 0 || totalWeight > 0;
    bar.hidden = !hasData;
    if (hasData) {
      const fmtTotal     = document.getElementById("fmtPurchaseTotal");
      const fmtPerHead   = document.getElementById("fmtPurchasePerHead");
      const fmtTotalWt   = document.getElementById("fmtPurchaseTotalWeight");
      if (fmtTotal)   fmtTotal.textContent   = total > 0   ? "Total: " + sym + " " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
      if (fmtPerHead) fmtPerHead.textContent = (total > 0 && qty > 0) ? "/ cab.: " + sym + " " + (total / qty).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
      if (fmtTotalWt) fmtTotalWt.textContent = totalWeight > 0 ? totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) + " kg total" : "";
    }
  }

  updateUsdBrlEquiv();
}

function refreshMovementValueHint(sym) {
  const hint = document.getElementById("fmtMovementValue");
  if (!hint) return;
  const v = Number(elements.movementValue?.value || 0);
  if (!sym) {
    const farm = getMovementDialogFarm();
    sym = farm && getFarmCurrency(farm.id) === "USD" ? "US$" : "R$";
  }
  hint.textContent = v > 0
    ? sym + " " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";
}

function syncMovementCategoryOptionsForFarm(farm) {
  const species = elements.movementSpecies?.value || "bovino";
  if (!farm) {
    elements.movementCategory.innerHTML = '<option value="">Selecione uma fazenda primeiro</option>';
    elements.movementCategory.value = "";
    syncMovementPotreirosOptions();
    updateMovementCategoryTotal();
    return;
  }
  if (species === "ovino") {
    elements.movementCategory.innerHTML = getFarmOvinoCategories(farm).map((category) => {
      const entry = (farm.ovinos || []).find((item) => item.categoryId === category.id);
      const quantity = Number(entry?.quantity || 0);
      return `<option value="${category.id}">${escapeHtml(category.name)} — ${formatInteger(quantity)} cab.</option>`;
    }).join("");
  } else {
    elements.movementCategory.innerHTML = farm.categories.map((category) => `
      <option value="${category.id}">${escapeHtml(category.name)} — ${formatInteger(category.quantity)} cab.</option>
    `).join("");
  }
  syncMovementPotreirosOptions();
  updateMovementCategoryTotal();
}

function updateMovementCategoryTotal() {
  const wrapEl = document.getElementById("movCategoryTotalWrap");
  const hintEl = document.getElementById("movCategoryTotalHint");
  if (!wrapEl || !hintEl) return;
  const farm = getMovementDialogFarm();
  const catId = elements.movementCategory?.value;
  if (!farm || !catId) {
    wrapEl.hidden = true;
    return;
  }
  const species = elements.movementSpecies?.value || "bovino";
  if (species === "ovino") {
    const cat = getFarmOvinoCategories(farm).find((c) => c.id === catId);
    if (!cat) { wrapEl.hidden = true; return; }
    const entry = (farm.ovinos || []).find((item) => item.categoryId === catId);
    const quantity = Number(entry?.quantity || 0);
    hintEl.innerHTML = `<span class="cat-total-icon">🐑</span> <strong>${escapeHtml(cat.name)}</strong> — estoque atual: <strong>${formatInteger(quantity)} cabeças</strong> em ${escapeHtml(farm.name)}`;
    wrapEl.hidden = false;
    return;
  }
  const cat = farm.categories.find((c) => c.id === catId);
  if (!cat) { wrapEl.hidden = true; return; }
  hintEl.innerHTML = `<span class="cat-total-icon">🐄</span> <strong>${escapeHtml(cat.name)}</strong> — estoque atual: <strong>${formatInteger(cat.quantity)} cabeças</strong> em ${escapeHtml(farm.name)}`;
  wrapEl.hidden = false;
}

function syncCategoryOptions() {
  syncMovementCategoryOptionsForFarm(getMovementDialogFarm());
}

function syncMovementOvinoDestFarmOptions(farm) {
  if (!elements.movementOvinoDestFarm) return;
  const farms = getAllFarms().filter((item) => item.id !== farm?.id);
  elements.movementOvinoDestFarm.innerHTML = farms.map((item) => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>
  `).join("");
}

function syncMovementPotreirosOptions() {
  if (!elements.movementPotreiro) return;
  const farm = getMovementDialogFarm();
  const type = elements.movementType?.value;
  if (!farm || !type) {
    elements.movementPotreiro.innerHTML = '<option value="">Selecione uma fazenda primeiro</option>';
    elements.movementPotreiro.value = "";
    if (elements.movementPotreiroDest) {
      elements.movementPotreiroDest.innerHTML = '<option value="">Selecione uma fazenda primeiro</option>';
      elements.movementPotreiroDest.value = "";
    }
    return;
  }

  const species = elements.movementSpecies?.value || "bovino";
  if (species === "ovino") {
    elements.movementPotreiro.innerHTML = "";
    elements.movementPotreiro.value = "";
    if (elements.movementPotreiroDest) {
      elements.movementPotreiroDest.innerHTML = "";
      elements.movementPotreiroDest.value = "";
    }
    return;
  }

  const typeMeta = MOVEMENT_TYPES.find((t) => t.value === type);
  const isExit = typeMeta?.direction === -1;
  const isTransfer = type === "transferencia";
  const potreiros = getPotreroEntries(farm);
  const categoryId = elements.movementCategory?.value;
  const category = farm.categories.find((c) => c.id === categoryId);
  const alloc = category?.allocation || {};

  const unallocatedQty = Number(alloc[UNALLOCATED_POTREIRO_KEY] || 0);
  const unallocatedLabel = isExit || isTransfer
    ?`Sem potreiro (${formatInteger(unallocatedQty)} animais)`
    : "Sem potreiro (padrão)";

  const potreroOptions = [
    `<option value="${UNALLOCATED_POTREIRO_KEY}">${unallocatedLabel}</option>`,
    ...potreiros.map((p) => {
      const qty = Number(alloc[p.id] || 0);
      const label = (isExit || isTransfer)
        ?`${escapeHtml(p.name)} (${formatInteger(qty)} animais)`
        : escapeHtml(p.name);
      return `<option value="${escapeHtml(p.id)}">${label}</option>`;
    })
  ].join("");

  elements.movementPotreiro.innerHTML = potreroOptions;

  if (elements.movementPotreiroDest) {
    elements.movementPotreiroDest.innerHTML = [
      `<option value="${UNALLOCATED_POTREIRO_KEY}">Sem potreiro</option>`,
      ...potreiros.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`)
    ].join("");
  }
}

function ensureCategoryAllocation(category) {
  if (!category.allocation || typeof category.allocation !== "object") {
    category.allocation = {};
  }
  // Se o pool não-alocado nunca foi definido, calcula como total menos o que já está em potreiros
  if (!Object.prototype.hasOwnProperty.call(category.allocation, UNALLOCATED_POTREIRO_KEY)) {
    const allocatedElsewhere = Object.values(category.allocation).reduce((s, v) => s + Number(v || 0), 0);
    category.allocation[UNALLOCATED_POTREIRO_KEY] = Math.max(0, Number(category.quantity || 0) - allocatedElsewhere);
  }
}

function updatePotreroQuantitiesFromAllocation(farm) {
  const totals = {};
  farm.categories.forEach((cat) => {
    const alloc = cat.allocation || {};
    Object.entries(alloc).forEach(([potreirosId, qty]) => {
      if (potreirosId !== UNALLOCATED_POTREIRO_KEY) {
        totals[potreirosId] = (totals[potreirosId] || 0) + Number(qty || 0);
      }
    });
  });
  farm.potreiros.forEach((p) => {
    if (totals[p.id] !== undefined) {
      p.quantity = totals[p.id];
    }
  });
}

function syncSanitaryFormOptions() {
  const availableFarms = getAllFarms();
  if (!availableFarms.length) {
    return;
  }

  const currentFarmId = (elements.sanitaryFarm?.value && state.data.farms[elements.sanitaryFarm.value])
    ?elements.sanitaryFarm.value
    : (state.data.selectedFarmId !== TOTAL_FARM_ID ?state.data.selectedFarmId : availableFarms[0].id);
  const farm = state.data.farms[currentFarmId] || availableFarms[0];
  const species = elements.sanitarySpecies?.value || "bovino";
  const selectedCategory = elements.sanitaryCategory.value;
  const selectedProduct = elements.sanitaryProduct.value;
  const selectedPotrero = elements.sanitaryPotrero?.value || "";

  elements.sanitaryFarm.innerHTML = availableFarms.map((item) => `
    <option value="${item.id}" ${item.id === farm.id ?"selected" : ""}>${escapeHtml(item.name)}</option>
  `).join("");

  elements.sanitaryCategory.innerHTML = getSanitaryCategoryOptions(farm, species).map((category) => `
    <option value="${category.id}" ${category.id === selectedCategory ?"selected" : ""}>${escapeHtml(category.name)}</option>
  `).join("");

  const productOptions = farm.sanitaryProducts.map((product) => `
    <option value="${escapeHtml(product)}" ${product === selectedProduct ?"selected" : ""}>${escapeHtml(product)}</option>
  `);
  productOptions.push(`<option value="__new__" ${selectedProduct === "__new__" ?"selected" : ""}>Outros</option>`);

  elements.sanitaryProduct.innerHTML = productOptions.join("");
  if (!elements.sanitaryProduct.value && farm.sanitaryProducts.length) {
    elements.sanitaryProduct.value = farm.sanitaryProducts[0];
  }

  const potreroOptions = [
    '<option value="Sem potreiro">Sem potreiro</option>',
    ...getPotreroEntries(farm).map((potrero) => `
      <option value="${escapeHtml(potrero.name)}" ${potrero.name === selectedPotrero ?"selected" : ""}>${escapeHtml(potrero.name)}</option>
    `),
    `<option value="__new__" ${selectedPotrero === "__new__" ?"selected" : ""}>Outro potreiro</option>`
  ];
  elements.sanitaryPotrero.innerHTML = potreroOptions.join("");
  if (!elements.sanitaryPotrero.value) {
    elements.sanitaryPotrero.value = "Sem potreiro";
  }

  if (!elements.sanitaryDate.value) {
    elements.sanitaryDate.value = new Date().toISOString().slice(0, 10);
  }
  updateSanitaryProductMode();
  updateSanitaryPotreroMode();
}

function getSanitaryCategoryOptions(farm, species = "bovino") {
  const categoryMap = new Map();
  if (species === "ovino") {
    getFarmOvinoCategories(farm).forEach((category) => categoryMap.set(category.id, { id: category.id, name: category.name }));
  } else {
    farm.categories.forEach((category) => {
      categoryMap.set(category.id, { id: category.id, name: category.name });
    });
  }
  farm.sanitaryRecords.forEach((record) => {
    if ((record.especie || "bovino") === species && !categoryMap.has(record.categoryId)) {
      categoryMap.set(record.categoryId, { id: record.categoryId, name: record.categoryName });
    }
  });
  return [...categoryMap.values()];
}

function ensureSanitaryCategoryOption(categoryId, categoryName) {
  ensureSelectOption(elements.sanitaryCategory, categoryId, categoryName);
}

function ensureSelectOption(select, value, label) {
  if (![...select.options].some((option) => option.value === value)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }
}

function updateSanitaryProductMode() {
  const isNewProduct = elements.sanitaryProduct.value === "__new__";
  elements.newProductWrap.hidden = !isNewProduct;
  elements.newProductName.required = isNewProduct;
  if (!isNewProduct) {
    elements.newProductName.value = "";
  }
}

function updateSanitaryPotreroMode() {
  const isNewPotrero = elements.sanitaryPotrero?.value === "__new__";
  elements.newPotreroWrap.hidden = !isNewPotrero;
  elements.newPotreroName.required = isNewPotrero;
  if (!isNewPotrero) {
    elements.newPotreroName.value = "";
  }
}

async function handleMovementSubmit(event) {
  event.preventDefault();
  const farm = getMovementDialogFarm();
  if (!farm || farm.id === TOTAL_FARM_ID) {
    alert("Selecione uma fazenda específica para registrar movimentações.");
    return;
  }

  // ── MODO EDIÇÃO: atualiza apenas campos financeiros/descritivos, sem tocar no estoque ──
  const editing = runtime.editingMovement;
  if (editing) {
    const editFarm = state.data.farms[editing.farmId];
    const oldIdx = editFarm?.movements.findIndex((m) => m.id === editing.movementId) ?? -1;
    if (!editFarm || oldIdx === -1) { runtime.editingMovement = null; return; }

    const oldMov = editFarm.movements[oldIdx];
    const date  = elements.movementDate.value;
    const notes = elements.movementNotes.value.trim();
    let value = Number(elements.movementValue.value || 0);
    let saleDetails = oldMov.saleDetails;
    let purchaseDetails = oldMov.purchaseDetails;

    if (oldMov.type === "venda" && oldMov.saleDetails) {
      const saleMode = isPremiumSaleFarm(editFarm) ? elements.movementSaleMode.value : (oldMov.saleDetails.mode || "vivo");
      const pricePerKg = Number(saleMode === "carcaca" ? elements.movementCarcassPrice.value : elements.movementLivePrice.value) || oldMov.saleDetails.pricePerKg;
      const weightKg   = Number(saleMode === "carcaca" ? elements.movementCarcassKg.value   : elements.movementLiveKg.value)   || oldMov.saleDetails.weightKg;
      const buyer = elements.movSaleBuyer?.value?.trim() || oldMov.saleDetails.buyer || "";
      const yieldPct = Number(elements.movSaleYieldPct?.value) || oldMov.saleDetails.yieldPct || null;
      value = pricePerKg * weightKg;
      saleDetails = { ...oldMov.saleDetails, mode: saleMode, pricePerKg, weightKg, buyer, yieldPct, valuePerHead: oldMov.quantity > 0 ? +(value / oldMov.quantity).toFixed(2) : null };
    }
    if (oldMov.type === "compra") {
      const sourceProperty = elements.movPurchaseSource?.value?.trim() || oldMov.purchaseDetails?.sourceProperty || "";
      const pricePerKg = Number(elements.movPurchasePricePerKg?.value) || oldMov.purchaseDetails?.pricePerKg || null;
      const valuePerHead = Number(elements.movPurchaseValuePerHead?.value) || oldMov.purchaseDetails?.valuePerHead || null;
      purchaseDetails = { ...oldMov.purchaseDetails, sourceProperty, pricePerKg, valuePerHead };
    }

    editFarm.movements[oldIdx] = {
      ...oldMov,
      date,
      value,
      saleDetails,
      purchaseDetails,
      notes,
      userModified: true,
      updatedAt: new Date().toISOString()
    };

    runtime.editingMovement = null;
    logAuditEvent("Edição", "movimentação", `Valores ajustados: ${capitalize(oldMov.type)} - ${oldMov.categoryName || ""}`, {
      farmId: editFarm.id, farmName: editFarm.name, recordCode: oldMov.code || ""
    });
    saveData();
    populateYearFilter();
    resetMovementPhotoDrafts();
    elements.movementDialog.close();
    render();
    return;
  }

  const movementAuditMeta = { action: "Adição", details: "Novo lançamento do rebanho registrado" };
  const editingOriginalId = null;
  let editingRollback = null;
  const rollbackEditing = () => {};
  const type = elements.movementType.value;
  const quantity = Number(elements.movementQuantity.value);
  const adjustDirection = elements.adjustDirection.value;
  const date = elements.movementDate.value;
  const categoryId = elements.movementCategory.value;
  const notes = elements.movementNotes.value.trim();
  const category = farm.categories.find((item) => item.id === categoryId);
  let value = Number(elements.movementValue.value || 0);
  let saleDetails = null;
  let purchaseDetails = null;
  const species = elements.movementSpecies?.value || "bovino";

  if (species === "ovino") {
    handleOvinoMovementSubmit(farm, { type, quantity, adjustDirection, date, categoryId, notes, value });
    return;
  }

  // Handle transfer between potreiros (no stock change, only reallocation)
  if (type === "transferencia") {
    if (!category || !date || !quantity || quantity < 1) {
      rollbackEditing();
      alert("Selecione uma categoria, informe a data e uma quantidade válida (mínimo 1) para a transferência.");
      return;
    }
    const originId = elements.movementPotreiro?.value || UNALLOCATED_POTREIRO_KEY;
    const destId = elements.movementPotreiroDest?.value || UNALLOCATED_POTREIRO_KEY;
    if (originId === destId) {
      rollbackEditing();
      alert("Selecione potreiros de origem e destino diferentes para a transferência.");
      return;
    }
    ensureCategoryAllocation(category);
    const originQty = Number(category.allocation[originId] || 0);
    if (originQty < quantity) {
      rollbackEditing();
      const originName = originId === UNALLOCATED_POTREIRO_KEY ?"Sem potreiro" : (farm.potreiros.find((p) => p.id === originId)?.name || originId);
      alert(`Apenas ${formatInteger(originQty)} animais estão alocados em "${originName}" para essa categoria.`);
      return;
    }
    category.allocation[originId] = originQty - quantity;
    category.allocation[destId] = (Number(category.allocation[destId] || 0)) + quantity;
    updatePotreroQuantitiesFromAllocation(farm);
    farm.movements.push({
      id: createMovementId(),
      code: generateMovementCode(farm),
      type: "transferencia",
      date,
      categoryId,
      categoryName: category.name,
      quantity,
      delta: 0,
      value: 0,
      saleDetails: null,
      notes,
      especie: "bovino",
      potreiro: originId,
      potreiroDest: destId,
      photos: []
    });
    saveData();
    populateYearFilter();
    resetMovementPhotoDrafts();
    elements.movementDialog.close();
    render();
    return;
  }

  if (!category || !date || !quantity || quantity < 1) {
    rollbackEditing();
    alert("Selecione uma categoria, informe a data e uma quantidade válida (mínimo 1) para o lançamento.");
    return;
  }

  const exchangeRate = (!elements.movUsdRateWrap?.hidden && elements.movUsdRate?.value)
    ? Number(elements.movUsdRate.value) || null
    : null;

  if (type === "compra") {
    const sourceProperty = elements.movPurchaseSource?.value?.trim() || "";
    const avgWeight   = Number(elements.movPurchaseAvgWeight?.value) || null;
    // movPurchaseTotalWeight agora é type="text" com formato "90.000 kg" — extrai o número
    const rawTw       = (elements.movPurchaseTotalWeight?.value || "").replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
    const totalWeight = parseFloat(rawTw) || null;
    const pricePerKg  = Number(elements.movPurchasePricePerKg?.value) || null;
    // movPurchaseValuePerHead agora é type="text" com prefixo "US$ / R$ " — extrai o número
    const rawVph      = (elements.movPurchaseValuePerHead?.value || "").replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
    const valuePerHead = parseFloat(rawVph) || null;
    purchaseDetails = { sourceProperty, avgWeight, totalWeight, pricePerKg, valuePerHead, exchangeRate };
  }

  if (type === "venda") {
    const saleMode = isPremiumSaleFarm(farm) ?elements.movementSaleMode.value : "vivo";
    const pricePerKg = Number(saleMode === "carcaca" ?elements.movementCarcassPrice.value : elements.movementLivePrice.value);
    const weightKg = Number(saleMode === "carcaca" ?elements.movementCarcassKg.value : elements.movementLiveKg.value);

    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0 || !Number.isFinite(weightKg) || weightKg <= 0) {
      rollbackEditing();
      alert("Preencha o valor por kg e o peso da venda para calcular o total.");
      return;
    }

    value = pricePerKg * weightKg;
    const buyer = elements.movSaleBuyer?.value?.trim() || "";
    const yieldPct = Number(elements.movSaleYieldPct?.value) || null;
    const valuePerHead = quantity > 0 ?+(value / quantity).toFixed(2) : null;
    saleDetails = {
      mode: saleMode,
      pricePerKg,
      weightKg,
      buyer,
      yieldPct,
      valuePerHead,
      exchangeRate
    };
  }

  const delta = getMovementDelta(type, quantity, adjustDirection);
  if (!Number.isFinite(delta)) {
    rollbackEditing();
    return;
  }

  if (category.quantity + delta < 0) {
    rollbackEditing();
    alert("A quantidade informada deixa o estoque negativo para essa categoria.");
    return;
  }

  const selectedPotreiro = (!elements.movementPotreiroWrap?.hidden && elements.movementPotreiro?.value)
    ?elements.movementPotreiro.value
    : UNALLOCATED_POTREIRO_KEY;

  ensureCategoryAllocation(category);
  category.quantity += delta;
  if (delta > 0) {
    category.allocation[selectedPotreiro] = (Number(category.allocation[selectedPotreiro] || 0)) + quantity;
  } else if (delta < 0) {
    category.allocation[selectedPotreiro] = Math.max(0, (Number(category.allocation[selectedPotreiro] || 0)) - quantity);
  }
  updatePotreroQuantitiesFromAllocation(farm);

  farm.movements.push({
    id: editingOriginalId || createMovementId(),
    code: generateMovementCode(farm),
    type,
    date,
    categoryId,
    categoryName: category.name,
    quantity,
    delta,
    value,
    saleDetails,
    purchaseDetails,
    currency: getFarmCurrency(farm.id),
    notes,
    especie: "bovino",
    potreiro: selectedPotreiro,
    photos: movementTypeSupportsPhotos(type) ?runtime.movementPhotoDrafts.map((photo) => ({ ...photo })) : [],
    userModified: true,
    updatedAt: new Date().toISOString()
  });

  if (farm.declaredTotal === 0) {
    farm.declaredTotal = getFarmTotal(farm);
  }

  const latestMovement = farm.movements[farm.movements.length - 1];
  logAuditEvent(movementAuditMeta.action, "movimentação", `${movementAuditMeta.details}: ${capitalize(type)} - ${category?.name || "Categoria"}`, {
    farmId: farm.id,
    farmName: farm.name,
    recordCode: latestMovement?.code || ""
  });
  saveData();
  populateYearFilter();
  resetMovementPhotoDrafts();
  elements.movementDialog.close();
  render();
}

function handleOvinoMovementSubmit(farm, { type, quantity, adjustDirection, date, categoryId, notes, value }) {
  const categoryMeta = getFarmOvinoCategories(farm).find((item) => item.id === categoryId);
  if (!categoryMeta || !date || !quantity || quantity < 1) {
    alert("Selecione uma categoria, informe a data e uma quantidade válida (mínimo 1) para o lançamento.");
    return;
  }

  const exchangeRate = (!elements.movUsdRateWrap?.hidden && elements.movUsdRate?.value)
    ? Number(elements.movUsdRate.value) || null
    : null;

  if (type === "transferencia") {
    const destFarmId = elements.movementOvinoDestFarm?.value || "";
    const destFarm = destFarmId ? state.data.farms[destFarmId] : null;
    if (!destFarm || destFarm.id === farm.id) {
      alert("Selecione uma fazenda de destino diferente para a transferência.");
      return;
    }

    const originEntry = findOrCreateOvinoEntry(farm, categoryMeta.id, categoryMeta.name);
    const stockError = validateStockExit(quantity, originEntry.quantity);
    if (stockError) {
      alert(stockError);
      return;
    }

    originEntry.quantity -= quantity;
    const destEntry = findOrCreateOvinoEntry(destFarm, categoryMeta.id, categoryMeta.name);
    destEntry.quantity += quantity;

    farm.movements.push({
      id: createMovementId(),
      code: generateMovementCode(farm),
      type: "transferencia",
      date,
      categoryId: categoryMeta.id,
      categoryName: categoryMeta.name,
      quantity,
      delta: -quantity,
      value: 0,
      saleDetails: null,
      purchaseDetails: null,
      notes,
      especie: "ovino",
      transferTo: destFarm.name,
      photos: []
    });
    destFarm.movements.push({
      id: createMovementId(),
      code: generateMovementCode(destFarm),
      type: "transferencia",
      date,
      categoryId: categoryMeta.id,
      categoryName: categoryMeta.name,
      quantity,
      delta: quantity,
      value: 0,
      saleDetails: null,
      purchaseDetails: null,
      notes,
      especie: "ovino",
      transferFrom: farm.name,
      photos: []
    });

    logAuditEvent("Adição", "movimentação", `Transferência de ovinos: ${categoryMeta.name} de ${farm.name} para ${destFarm.name}`, {
      farmId: farm.id,
      farmName: farm.name,
      recordCode: farm.movements[farm.movements.length - 1].code
    });
    saveData();
    populateYearFilter();
    resetMovementPhotoDrafts();
    elements.movementDialog.close();
    render();
    return;
  }

  let saleDetails = null;
  let purchaseDetails = null;

  if (type === "compra") {
    const sourceProperty = elements.movPurchaseSource?.value?.trim() || "";
    const avgWeight   = Number(elements.movPurchaseAvgWeight?.value) || null;
    const rawTw       = (elements.movPurchaseTotalWeight?.value || "").replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
    const totalWeight = parseFloat(rawTw) || null;
    const pricePerKg  = Number(elements.movPurchasePricePerKg?.value) || null;
    const rawVph      = (elements.movPurchaseValuePerHead?.value || "").replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
    const valuePerHead = parseFloat(rawVph) || null;
    purchaseDetails = { sourceProperty, avgWeight, totalWeight, pricePerKg, valuePerHead, exchangeRate };
  }

  if (type === "venda") {
    const saleMode = isPremiumSaleFarm(farm) ? elements.movementSaleMode.value : "vivo";
    const pricePerKg = Number(saleMode === "carcaca" ? elements.movementCarcassPrice.value : elements.movementLivePrice.value);
    const weightKg = Number(saleMode === "carcaca" ? elements.movementCarcassKg.value : elements.movementLiveKg.value);

    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0 || !Number.isFinite(weightKg) || weightKg <= 0) {
      alert("Preencha o valor por kg e o peso da venda para calcular o total.");
      return;
    }

    value = pricePerKg * weightKg;
    const buyer = elements.movSaleBuyer?.value?.trim() || "";
    const yieldPct = Number(elements.movSaleYieldPct?.value) || null;
    const valuePerHead = quantity > 0 ? +(value / quantity).toFixed(2) : null;
    saleDetails = { mode: saleMode, pricePerKg, weightKg, buyer, yieldPct, valuePerHead, exchangeRate };
  }

  const delta = getMovementDelta(type, quantity, adjustDirection);
  if (!Number.isFinite(delta)) {
    return;
  }

  const entry = findOrCreateOvinoEntry(farm, categoryMeta.id, categoryMeta.name);
  if (delta < 0) {
    const stockError = validateStockExit(quantity, entry.quantity);
    if (stockError) {
      alert(stockError);
      return;
    }
  }
  entry.quantity += delta;

  farm.movements.push({
    id: createMovementId(),
    code: generateMovementCode(farm),
    type,
    date,
    categoryId: categoryMeta.id,
    categoryName: categoryMeta.name,
    quantity,
    delta,
    value,
    saleDetails,
    purchaseDetails,
    currency: getFarmCurrency(farm.id),
    notes,
    especie: "ovino",
    photos: movementTypeSupportsPhotos(type) ? runtime.movementPhotoDrafts.map((photo) => ({ ...photo })) : [],
    userModified: true,
    updatedAt: new Date().toISOString()
  });

  if (farm.declaredTotal === 0) {
    farm.declaredTotal = getFarmTotal(farm);
  }

  const latestMovement = farm.movements[farm.movements.length - 1];
  logAuditEvent("Adição", "movimentação", `Novo lançamento do rebanho registrado: ${capitalize(type)} - ${categoryMeta.name}`, {
    farmId: farm.id,
    farmName: farm.name,
    recordCode: latestMovement?.code || ""
  });
  saveData();
  populateYearFilter();
  resetMovementPhotoDrafts();
  elements.movementDialog.close();
  render();
}

function handleCategorySubmit(event) {
  event.preventDefault();
  const farmId = elements.categoryFarm.value;
  const farm = state.data.farms[farmId];
  if (!farm) return;
  const species = elements.categorySpecies?.value || "bovino";
  const name = elements.categoryName.value.trim();
  const quantity = Number(elements.categoryInitialQuantity.value || 0);
  const potreirosId = elements.categoryPotreiro?.value || "";

  if (!name) {
    alert("Informe um nome para a nova categoria.");
    return;
  }

  if (species === "ovino") {
    const categoryId = slugify(`${name}-${Date.now()}`);
    const entry = findOrCreateOvinoEntry(farm, categoryId, name);
    entry.quantity = (Number(entry.quantity) || 0) + quantity;
  } else {
    farm.categories.push({ id: slugify(`${name}-${Date.now()}`), name, quantity });

    if (potreirosId && quantity > 0) {
      const potrero = getPotreroEntries(farm).find((p) => p.id === potreirosId);
      if (potrero) {
        potrero.quantity = (Number(potrero.quantity) || 0) + quantity;
      }
    }
  }

  logAuditEvent("Adição", "categoria", `${name} (${farm.name})`, { farmId: farm.id, farmName: farm.name });
  saveData();
  elements.categoryDialog.close();
  render();
}

function handleMonthlyDataSubmit(event) {
  event.preventDefault();
  const farm = state.data.farms[elements.monthlyDataFarm.value];
  const period = elements.monthlyDataPeriod.value;
  const category = elements.monthlyDataCategory.value;
  const title = elements.monthlyDataTitle.value.trim();
  const quantity = Number(elements.monthlyDataQuantity.value || 0);
  const value = Number(elements.monthlyDataValue.value || 0);
  const notes = elements.monthlyDataNotes.value.trim();
  const editingId = elements.monthlyDataEditingId.value;

  if (!farm || !period || !category || !title) {
    return;
  }

  if (quantity < 0 || value < 0) {
    alert("Quantidade e valor atribuído não podem ser negativos.");
    return;
  }

  const payload = {
    period,
    category,
    title,
    quantity: Number.isFinite(quantity) ?Math.round(quantity) : 0,
    value: Number.isFinite(value) ?Number(value.toFixed(2)) : 0,
    notes
  };
  const isEditingMonthly = Boolean(editingId);

  if (editingId) {
    const ownerFarm = getAllFarms().find((item) => getMonthlyRecords(item).some((record) => record.id === editingId));
    const existing = ownerFarm ?getMonthlyRecords(ownerFarm).find((record) => record.id === editingId) : null;
    if (existing && ownerFarm?.id === farm.id) {
      Object.assign(existing, payload);
    } else if (existing) {
      ownerFarm.monthlyRecords = ownerFarm.monthlyRecords.filter((record) => record.id !== editingId);
      farm.monthlyRecords.push({
        id: editingId,
        ...payload
      });
    } else {
      farm.monthlyRecords.push({
        id: editingId,
        ...payload
      });
    }
  } else {
    farm.monthlyRecords.push({
      id: createMovementId(),
      ...payload
    });
  }

  state.data.selectedFarmId = farm.id;
  logAuditEvent(isEditingMonthly ?"Edição" : "Adição", "dado mensal", `${title} (${period})`, {
    farmId: farm.id,
    farmName: farm.name,
    recordCode: editingId || ""
  });
  saveData();
  populateYearFilter();
  elements.monthlyDataDialog.close();
  render();
}

function handleSanitarySubmit(event) {
  event.preventDefault();
  const farm = getSanitaryDialogFarm();
  if (!farm || farm.id === TOTAL_FARM_ID) {
    alert("Selecione uma fazenda específica para registrar ou editar o manejo sanitário.");
    return;
  }

  const editingId = elements.sanitaryEditingId.value;
  const species = elements.sanitarySpecies?.value || "bovino";
  const date = elements.sanitaryDate.value;
  const quantity = Number(elements.sanitaryQuantity.value);
  const categoryId = elements.sanitaryCategory.value;
  const categoryLabel = elements.sanitaryCategory.selectedOptions[0]?.textContent || "Categoria";
  const selectedProduct = elements.sanitaryProduct.value;
  const newProductName = elements.newProductName.value.trim();
  const product = selectedProduct === "__new__" ?newProductName : selectedProduct;
  const selectedPotrero = elements.sanitaryPotrero.value;
  const newPotreroName = elements.newPotreroName.value.trim();
  const potreiro = selectedPotrero === "__new__" ?newPotreroName : selectedPotrero;
  const notes = elements.sanitaryNotes.value.trim();
  const isEditingSanitary = Boolean(editingId);

  if (!date || !categoryId || !Number.isFinite(quantity) || quantity < 1 || !product || !potreiro) {
    alert("Preencha data, categoria, quantidade (mínimo 1), produto e potreiro para registrar o manejo sanitário.");
    return;
  }

  if (selectedProduct === "__new__" && !farm.sanitaryProducts.includes(product)) {
    farm.sanitaryProducts.push(product);
  }
  if (selectedPotrero === "__new__" && !getPotreroEntries(farm).some((item) => normalizeText(item.name) === normalizeText(potreiro))) {
    farm.potreiros.push({
      id: createPotreroId(potreiro),
      name: potreiro,
      quantity: 0
    });
  }

  const recordPayload = {
    date,
    farmId: farm.id,
    especie: species,
    quantity,
    categoryId,
    categoryName: categoryLabel,
    product,
    potreiro,
    notes
  };

  if (editingId) {
    const ownerFarm = getAllFarms().find((item) => item.sanitaryRecords.some((record) => record.id === editingId || record.sourceId === editingId));
    const existingRecord = ownerFarm?.sanitaryRecords.find((item) => item.id === editingId || item.sourceId === editingId);
    if (existingRecord && ownerFarm?.id === farm.id) {
      Object.assign(existingRecord, recordPayload);
    } else if (existingRecord) {
      ownerFarm.sanitaryRecords = ownerFarm.sanitaryRecords.filter((item) => item.id !== editingId && item.sourceId !== editingId);
      farm.sanitaryRecords.push({
        ...existingRecord,
        ...recordPayload
      });
    }
  } else {
    farm.sanitaryRecords.push({
      id: createMovementId(),
      code: generateSanitaryCode(farm),
      farmId: farm.id,
      ...recordPayload
    });
  }

  const savedSanitaryRecord = editingId
    ?farm.sanitaryRecords.find((item) => item.id === editingId || item.sourceId === editingId)
    : farm.sanitaryRecords[farm.sanitaryRecords.length - 1];
  state.data.selectedFarmId = farm.id;
  logAuditEvent(isEditingSanitary ?"Edição" : "Adição", "sanitário", `${product} em ${potreiro}`, {
    farmId: farm.id,
    farmName: farm.name,
    recordCode: savedSanitaryRecord?.code || ""
  });
  saveData();
  populateYearFilter();
  closeSanitaryDialog();
  render();
}

function handleEditStockSubmit(event) {
  // Legacy stub — replaced by handleSaveStockEdit
  event?.preventDefault();
  const farm = state.data.farms[Object.keys(state.data.farms)[0]];
  if (!farm) {
    return;
  }
  const declaredTotal = Number(elements.editDeclaredTotal.value);
  if (!Number.isFinite(declaredTotal) || declaredTotal < 0) {
    return;
  }

  const categoryRows = [...elements.editStockList.querySelectorAll("[data-category-row]")];
  const seenCategories = new Set();
  for (const row of categoryRows) {
    const categoryId = row.dataset.categoryId;
    const name = row.querySelector("[data-category-name]")?.value.trim() || "";
    const quantity = Number(row.querySelector("[data-category-quantity]")?.value);
    if (!name) {
      alert("Informe o nome de todas as categorias.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return;
    }
    const normalizedName = normalizeText(name);
    if (seenCategories.has(normalizedName)) {
      alert(`A categoria ${name} foi informada mais de uma vez. Ajuste os nomes para continuar.`);
      return;
    }
    seenCategories.add(normalizedName);

    const category = farm.categories.find((item) => item.id === categoryId);
    if (category) {
      category.name = name;
      category.quantity = quantity;
      farm.movements.forEach((movement) => {
        if (movement.categoryId === category.id) {
          movement.categoryName = name;
        }
      });
      farm.sanitaryRecords.forEach((record) => {
        if (record.categoryId === category.id) {
          record.categoryName = name;
        }
      });
    }
  }

  const potreroRows = [...elements.potreroStockList.querySelectorAll("[data-potrero-row]")];
  const nextPotreiros = [];
  const seenPotreiros = new Set();
  for (const row of potreroRows) {
    const name = row.querySelector("[data-potrero-name]")?.value.trim() || "";
    const quantity = Number(row.querySelector("[data-potrero-quantity]")?.value);
    if (!name) {
      alert("Informe o nome de todos os potreiros cadastrados.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      alert(`Informe uma quantidade válida para o potreiro ${name}.`);
      return;
    }

    const normalizedName = normalizeText(name);
    if (seenPotreiros.has(normalizedName)) {
      alert(`O potreiro ${name} foi informado mais de uma vez. Ajuste os nomes para continuar.`);
      return;
    }

    seenPotreiros.add(normalizedName);
    nextPotreiros.push({
      id: row.dataset.potreroId || createPotreroId(name),
      name,
      quantity: normalizePotreroQuantity(quantity)
    });
  }

  farm.potreiros = nextPotreiros;
  farm.declaredTotal = declaredTotal;
  state.data.selectedFarmId = runtime.editStockContextFarmId === TOTAL_FARM_ID
    ?TOTAL_FARM_ID
    : farm.id;
  saveData();
  elements.editStockDialog.close();
  render();
}

function summarizePeriod(farm, year, month, especie = state.filters.especie) {
  const summary = {
    totalMovements: 0,
    netChange: 0,
    saldo: 0,
    totalValue: 0,
    adjustPositive: 0,
    adjustNegative: 0,
    saleValue: 0,
    byType: { compra: 0, venda: 0, consumo: 0, nascimento: 0, morte: 0, ajuste: 0, transferencia: 0 }
  };

  farm.movements.forEach((movement) => {
    const movementDate = new Date(movement.date);
    const movementYear = String(movementDate.getFullYear());
    const movementMonth = String(movementDate.getMonth() + 1).padStart(2, "0");
    const matchesYear = movementYear === String(year);
    const matchesMonth = month === "all" || movementMonth === month;
    const matchesSpecies = especie === "todas" || (movement.especie || "bovino") === especie;
    if (!matchesYear || !matchesMonth || !matchesSpecies) {
      return;
    }

    summary.totalMovements += 1;
    summary.byType[movement.type] += movement.quantity;
    summary.netChange += movement.delta;
    summary.totalValue += Number(movement.value || 0);
    if (movement.type === "venda") {
      summary.saleValue += Number(movement.value || 0);
    }

    if (movement.type === "ajuste") {
      if (movement.delta >= 0) {
        summary.adjustPositive += movement.delta;
      } else {
        summary.adjustNegative += Math.abs(movement.delta);
      }
    }
    if (movement.type === "transferencia") {
      summary.byType.transferencia += movement.quantity;
      summary.totalMovements -= 1; // don't count transfers as stock movements
    }
  });

  summary.saldo = summary.byType.compra + summary.byType.nascimento + summary.adjustPositive
    - summary.byType.venda - summary.byType.consumo - summary.byType.morte - summary.adjustNegative;

  return summary;
}

function getFilteredSanitaryRecords(farm, year = state.filters.year, month = state.filters.month) {
  return farm.sanitaryRecords.filter((record) => {
    const recordDate = new Date(record.date);
    const recordYear = String(recordDate.getFullYear());
    const recordMonth = String(recordDate.getMonth() + 1).padStart(2, "0");
    const matchesYear = recordYear === String(year);
    const matchesMonth = month === "all" || recordMonth === month;
    return matchesYear && matchesMonth;
  });
}

function getPotreroTotals(farm) {
  const totalAnimals = Math.max(getFarmTotal(farm), 1);
  return getPotreroEntries(farm)
    .map((potrero) => {
      const quantity = normalizePotreroQuantity(potrero.quantity);
      return {
        id: potrero.id,
        name: potrero.name,
        farmId: potrero.farmId || (farm.id === TOTAL_FARM_ID ?"" : farm.id),
        farmName: potrero.farmName || (farm.id === TOTAL_FARM_ID ?"" : farm.name),
        quantity,
        share: (quantity / totalAnimals) * 100
      };
    })
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}

function getMovementDelta(type, quantity, adjustDirection) {
  if (type === "ajuste") {
    return adjustDirection === "subtract" ?-quantity : quantity;
  }

  const meta = MOVEMENT_TYPES.find((item) => item.value === type);
  return (meta?.direction || 0) * quantity;
}

function getDiscrepancyText(farm) {
  const computedTotal = getFarmTotal(farm);
  if (!farm.declaredTotal) {
    return `A fazenda ${farm.name} ainda não possui total declarado. O sistema está usando o estoque atual como referência operacional.`;
  }

  const difference = farm.declaredTotal - computedTotal;
  if (difference === 0) {
    return `Inventario alinhado ao total declarado de ${formatInteger(farm.declaredTotal)} animais.`;
  }

  return `Atenção: o total declarado para ${farm.name} é ${formatInteger(farm.declaredTotal)} animais, mas o estoque atual mostra ${formatInteger(computedTotal)}. Diferença de ${formatInteger(difference)} animais.`;
}

function openPdfOptionsDialog() {
  elements.pdfOptionsForm.reset();
  runtime.pdfContextFarmId = state.data.selectedFarmId;
  populatePdfPeriodFilters();
  renderPdfFarmOptions(runtime.pdfContextFarmId === TOTAL_FARM_ID ?getAllFarms().map((farm) => farm.id) : [runtime.pdfContextFarmId]);
  const currentScope = elements.pdfOptionsForm.querySelector('input[name="pdfScope"][value="current"]');
  if (currentScope) {
    currentScope.checked = true;
  }
  updatePdfScopeMode();
  elements.pdfOptionsDialog.showModal();
}

function renderPdfFarmOptions(selectedIds = []) {
  const selected = new Set(selectedIds);
  elements.pdfFarmList.innerHTML = getAllFarms().map((farm) => `
    <label class="user-row pdf-farm-row">
      <input type="checkbox" name="pdfFarmIds" value="${farm.id}" ${selected.has(farm.id) ?"checked" : ""}>
      <div>
        <strong>${escapeHtml(farm.name)}</strong>
        <span>${formatInteger(getFarmTotal(farm))} animais em estoque atualmente</span>
      </div>
      <span class="chip">${formatInteger(farm.movements.length)} mov.</span>
    </label>
  `).join("");
}

function getPdfScopeSelection() {
  return elements.pdfOptionsForm.querySelector('input[name="pdfScope"]:checked')?.value || "current";
}

function updatePdfScopeMode() {
  const scope = getPdfScopeSelection();
  elements.pdfFarmList.hidden = scope !== "custom";

  if (scope === "custom" && !elements.pdfFarmList.querySelector('input[name="pdfFarmIds"]:checked')) {
    const currentFarmId = runtime.pdfContextFarmId !== TOTAL_FARM_ID ?runtime.pdfContextFarmId : state.data.selectedFarmId;
    const currentFarmInput = elements.pdfFarmList.querySelector(`input[name="pdfFarmIds"][value="${currentFarmId}"]`);
    if (currentFarmInput) {
      currentFarmInput.checked = true;
    }
  }
}

function getSelectedPdfFarmIds() {
  const scope = getPdfScopeSelection();
  if (scope === "all") {
    return getAllFarms().map((farm) => farm.id);
  }

  if (scope === "custom") {
    return [...elements.pdfFarmList.querySelectorAll('input[name="pdfFarmIds"]:checked')].map((input) => input.value);
  }

  const currentFarmId = runtime.pdfContextFarmId || state.data.selectedFarmId;
  if (currentFarmId === TOTAL_FARM_ID) {
    return getAllFarms().map((farm) => farm.id);
  }

  return [currentFarmId];
}

function getPdfPeriodSelection() {
  return {
    year: elements.pdfYearFilter.value || state.filters.year,
    month: elements.pdfMonthFilter.value || state.filters.month
  };
}

function handlePdfOptionsSubmit(event) {
  event.preventDefault();
  const farmIds = getSelectedPdfFarmIds();
  const period = getPdfPeriodSelection();

  if (!farmIds.length) {
    alert("Selecione pelo menos uma fazenda para gerar o PDF.");
    return;
  }

  elements.pdfOptionsDialog.close();
  exportPdfReport(farmIds, period);
}

async function addPdfHeader(doc, farm, periodLabel, monthly) {
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
  doc.text(`Relatório Pecuário - ${farm.name}`, 42, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`Período analisado: ${periodLabel}`, 42, 33);
  doc.text(`Responsável técnico: ${TECHNICAL_MANAGER_NAME}`, 42, 39);
  doc.text(`Movimentações no período: ${formatInteger(monthly.totalMovements)}`, 14, 50);
  doc.text(`Saldo do período: ${monthly.netChange > 0 ?"+" : ""}${formatInteger(monthly.netChange)}`, 92, 50);
  return 56;
}

function getPdfPageSize(doc) {
  return {
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight()
  };
}

function drawPdfPastureBackground(doc) {
  const { width, height } = getPdfPageSize(doc);
  doc.setFillColor(27, 77, 47);
  doc.rect(0, 0, width, height, "F");

  doc.setFillColor(38, 96, 57);
  doc.rect(0, height * 0.44, width, height * 0.56, "F");

  doc.setFillColor(73, 126, 66);
  doc.ellipse(width * 0.14, height * 0.88, width * 0.26, height * 0.16, "F");
  doc.ellipse(width * 0.52, height * 0.84, width * 0.34, height * 0.17, "F");
  doc.ellipse(width * 0.9, height * 0.87, width * 0.28, height * 0.16, "F");

  doc.setFillColor(106, 156, 82);
  doc.ellipse(width * 0.3, height * 0.96, width * 0.34, height * 0.13, "F");
  doc.ellipse(width * 0.73, height * 0.97, width * 0.36, height * 0.14, "F");

  doc.setDrawColor(181, 214, 161);
  doc.setLineWidth(0.8);
  doc.line(0, height * 0.63, width, height * 0.63);
}

async function appendPdfCoverPage(doc, farms, periodLabel, reportSubtitle = "Relatório Pecuário") {
  const { width, height } = getPdfPageSize(doc);
  const scopeLabel = farms.length === 1
    ?farms[0].name
    : farms.length === getAllFarms().length
      ?"Todas as fazendas"
      : `${formatInteger(farms.length)} fazendas selecionadas`;

  doc.setFillColor(6, 6, 6);
  doc.rect(0, 0, width, height, "F");
  const imageX = width * 0.52;
  const imageW = width - imageX;
  try {
    const coverImage = await loadAssetAsDataUrl(PDF_COVER_IMAGE_PATH);
    doc.addImage(coverImage, "JPEG", imageX, 0, imageW, height);
  } catch (error) {
    console.warn("Não foi possível carregar a imagem da capa do PDF.", error);
  }

  const left = 18;
  doc.setDrawColor(197, 167, 74);
  doc.setLineWidth(1.1);
  doc.line(left, 27, left + 19, 27);
  doc.setTextColor(197, 167, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PREMIUM", left, 40);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("Painel Pecuário", left, 56);
  doc.text("Premium", left, 72);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(215, 215, 215);
  doc.text(reportSubtitle, left, 91);
  doc.setFontSize(9);
  doc.setTextColor(197, 167, 74);
  doc.text("Fazendas Da Bruna", left, 101);
  doc.setFontSize(8);
  doc.setTextColor(170, 170, 170);
  doc.text(`Fazenda: ${scopeLabel}`, left, height - 37);
  doc.text(`Período: ${periodLabel}`, left, height - 29);
  doc.text(`Administrador: ${ADMINISTRATOR_NAME}`, left, height - 21);
  doc.text(`Responsável Técnico: ${TECHNICAL_MANAGER_NAME}`, left, height - 13);
  doc.setDrawColor(197, 167, 74);
  doc.setLineWidth(0.5);
  doc.line(left, height - 7, left + 74, height - 7);
  return;

  drawPdfPastureBackground(doc);

  try {
    const imageData = await loadLogoForPdf("#1b4d2f");
    doc.addImage(imageData, "JPEG", (width / 2) - 45, 18, 90, 90);
  } catch (error) {
    console.warn("Não foi possível carregar o logo para a capa do PDF.", error);
  }

  doc.setTextColor(248, 244, 236);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Painel Pecuário", width / 2, 122, { align: "center" });
  doc.setFontSize(12);
  doc.text("Fazendas Da Bruna", width / 2, 131, { align: "center" });

  doc.setDrawColor(225, 232, 214);
  doc.setLineWidth(0.7);
  doc.line(58, 141, width - 58, 141);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(scopeLabel, width / 2, 152, { align: "center" });
  doc.text(`Período analisado: ${periodLabel}`, width / 2, 161, { align: "center" });
  doc.text(`Responsável técnico: ${TECHNICAL_MANAGER_NAME}`, width / 2, 170, { align: "center" });

  doc.text(`Administrador: ${ADMINISTRATOR_NAME}`, width / 2, 179, { align: "center" });
  doc.setFontSize(9.5);
  doc.setTextColor(230, 239, 223);
  doc.text("Relatório gerencial com consolidado, movimentações, sanitário e dados mensais.", width / 2, height - 26, { align: "center" });
}

function appendFarmDividerPage(doc, farm, periodLabel, year, month, sectionIndex, sectionCount) {
  const { width, height } = getPdfPageSize(doc);
  const monthly = summarizePeriod(farm, year, month);
  const sanitarySummary = getSanitarySummary(farm, year, month);
  const monthlySummary = getMonthlySummary(farm, year, month);
  doc.setFillColor(242, 238, 228);
  doc.rect(0, 0, width, height, "F");

  doc.setFillColor(37, 88, 58);
  doc.rect(0, 0, width, 58, "F");

  doc.setTextColor(248, 244, 236);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Fazenda ${sectionIndex} de ${sectionCount}`, 16, 18);
  doc.setFontSize(24);
  doc.text(farm.name, 16, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Período analisado: ${periodLabel}`, 16, 46);

  doc.setTextColor(45, 35, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Separação de fazenda", 16, 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("As próximas páginas detalham o estoque, o comercial, o sanitário e os dados mensais desta unidade.", 16, 89, {
    maxWidth: width - 32
  });

  const cards = [
    { label: "Estoque atual", value: `${formatInteger(getFarmTotal(farm))} animais` },
    { label: "Movimentações", value: formatInteger(monthly.totalMovements) },
    { label: "Registros sanitários", value: formatInteger(sanitarySummary.totalApplications) },
    { label: "Valor atribuído", value: formatCurrency(monthlySummary.totalValue) }
  ];

  const left = 16;
  const gap = 8;
  const cardWidth = (width - (left * 2) - gap) / 2;
  const cardHeight = 34;
  let y = 108;

  cards.forEach((card, index) => {
    const column = index % 2;
    if (index > 0 && column === 0) {
      y += cardHeight + 8;
    }

    const x = left + (column * (cardWidth + gap));
    doc.setFillColor(255, 252, 245);
    doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, "F");
    doc.setDrawColor(219, 209, 191);
    doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(87, 69, 52);
    doc.text(card.label, x + 6, y + 12);
    doc.setFontSize(13);
    doc.setTextColor(38, 66, 48);
    doc.text(card.value, x + 6, y + 23);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(112, 94, 76);
  doc.text("Painel Pecuário | separação por fazenda no relatório consolidado", 16, height - 18);
}

function appendPdfFarmReportDivider(doc, farm, periodLabel, reportTitle, cards, sectionIndex, sectionCount) {
  const { width, height } = getPdfPageSize(doc);
  doc.setFillColor(242, 238, 228);
  doc.rect(0, 0, width, height, "F");
  doc.setFillColor(37, 88, 58);
  doc.rect(0, 0, width, 46, "F");

  doc.setTextColor(248, 244, 236);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Fazenda ${sectionIndex} de ${sectionCount}`, 14, 15);
  doc.setFontSize(20);
  doc.text(farm.name, 14, 29);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${reportTitle} | ${periodLabel}`, 14, 38);

  doc.setTextColor(45, 35, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Separação por fazenda", 14, 64);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("As proximas paginas detalham somente os registros desta unidade.", 14, 73);

  const gap = 7;
  const cardWidth = (width - 28 - gap * (cards.length - 1)) / cards.length;
  cards.forEach((card, index) => {
    const x = 14 + index * (cardWidth + gap);
    const y = 88;
    doc.setFillColor(255, 252, 245);
    doc.roundedRect(x, y, cardWidth, 28, 3, 3, "F");
    doc.setDrawColor(219, 209, 191);
    doc.roundedRect(x, y, cardWidth, 28, 3, 3, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(87, 69, 52);
    doc.text(card.label, x + 5, y + 10);
    doc.setFontSize(11);
    doc.setTextColor(38, 66, 48);
    doc.text(String(card.value), x + 5, y + 21);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(112, 94, 76);
  doc.text("Painel Pecuário Premium | Fazendas Da Bruna", 14, height - 18);
}

function addPdfFooters(doc, options = {}) {
  const { coverPage = false } = options;
  const pageCount = doc.getNumberOfPages();
  const firstFooterPage = coverPage ?2 : 1;
  const visiblePageCount = coverPage ?Math.max(pageCount - 1, 0) : pageCount;

  for (let page = firstFooterPage; page <= pageCount; page += 1) {
    doc.setPage(page);
    const { width, height } = getPdfPageSize(doc);
    const margin = 14;
    doc.setDrawColor(220, 209, 193);
    doc.line(margin, height - 11, width - margin, height - 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(112, 94, 76);
    if (height < 260) {
      doc.text(`Fazendas Da Bruna | Responsável tecnico: ${TECHNICAL_MANAGER_NAME}`, margin, height - 6);
      doc.text(`Pagina ${coverPage ?page - 1 : page} de ${visiblePageCount}`, width - margin, height - 6, { align: "right" });
      doc.setTextColor(45, 35, 25);
      continue;
    }
    doc.text(`Fazendas Da Bruna | Responsável técnico: ${TECHNICAL_MANAGER_NAME}`, 14, 291);
    doc.text(`Página ${coverPage ?page - 1 : page} de ${visiblePageCount}`, 196, 291, { align: "right" });
    doc.setTextColor(45, 35, 25);
  }
}

function appendExecutivePdfTable(doc, farm, monthly, discrepancy, topY) {
  const registeredPotreiros = getPotreroEntries(farm).length;
  const registeredAnimals = getRegisteredPotreroAnimals(farm);
  const potreroBalance = getPotreroBalance(farm);
  const total = getFarmTotal(farm);
  const annualForMortality = summarizePeriod(farm, String(new Date().getFullYear()), "all");
  const mortalityRate = total > 0 ?((annualForMortality.byType.morte / total) * 100).toFixed(2) : "0.00";
  doc.autoTable({
    startY: topY + 4,
    head: [["Indicador executivo", "Valor"]],
    body: [
      ["Estoque atual", `${formatInteger(total)} animais`],
      ["Total declarado", farm.declaredTotal ?`${formatInteger(farm.declaredTotal)} animais` : "Não informado"],
      ["Conferência de estoque", discrepancy === 0 ?"Alinhado" : `${discrepancy > 0 ?"+" : ""}${formatInteger(discrepancy)} animais`],
      ["Taxa de mortalidade (ano)", `${mortalityRate}%`],
      ["Potreiros cadastrados", formatInteger(registeredPotreiros)],
      ["Animais distribuídos em potreiros", `${formatInteger(registeredAnimals)} animais`],
      ["Saldo da distribuição", potreroBalance === 0 ?"Alinhado" : `${potreroBalance > 0 ?"+" : ""}${formatInteger(potreroBalance)} animais`],
      ["Movimentações no período", formatInteger(monthly.totalMovements)],
      ["Saldo do período", `${monthly.netChange > 0 ?"+" : ""}${formatInteger(monthly.netChange)}`],
      ["Responsável técnico", TECHNICAL_MANAGER_NAME]
    ],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendInventoryPdfTable(doc, farm) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Categoria", "Quantidade"]],
    body: farm.categories.map((category) => [category.name, formatInteger(category.quantity)]),
    theme: "grid",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendOperationalPdfTable(doc, monthly, annual, saleSummary) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Indicador", "Valor"]],
    body: [
      ["Compras no período", formatInteger(monthly.byType.compra)],
      ["Vendas no período", formatInteger(monthly.byType.venda)],
      ["Faturamento de vendas", formatCurrency(saleSummary.totalValue)],
      ["Consumo no período", formatInteger(monthly.byType.consumo)],
      ["Nascimentos no período", formatInteger(monthly.byType.nascimento)],
      ["Mortes no período", formatInteger(monthly.byType.morte)],
      ["Movimentações no ano", formatInteger(annual.totalMovements)],
      ["Valor anual movimentado", annual.totalValue ?formatCurrency(annual.totalValue) : "Sem valor informado"]
    ],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendSaleSummaryPdfTable(doc, saleSummary) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Indicador comercial", "Valor"]],
    body: [
      ["Vendas registradas", formatInteger(saleSummary.count)],
      ["Faturamento total", formatCurrency(saleSummary.totalValue)],
      ["Kg vivo negociado", formatWeight(saleSummary.liveKg)],
      ["Kg carcaça negociado", formatWeight(saleSummary.carcassKg)],
      ["Preço médio kg vivo", saleSummary.liveKg > 0 ?formatCurrency(saleSummary.totalValue / saleSummary.liveKg) : formatCurrency(0)]
    ],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendSaleDetailsPdfTable(doc, saleSummary) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Data", "Categoria", "Base", "Kg", "R$/kg", "Total", "Fotos"]],
    body: saleSummary.movements.length
      ?saleSummary.movements.map((movement) => [
        formatDate(movement.date),
        movement.categoryName,
        movement.saleDetails ?getSaleModeLabel(movement.saleDetails.mode || "vivo") : "Relatório mensal",
        movement.saleDetails ?formatWeight(movement.saleDetails.weightKg || 0) : "-",
        movement.saleDetails ?formatCurrency(movement.saleDetails.pricePerKg || 0) : "-",
        formatCurrency(movement.value || 0),
        formatMovementPhotoCount(movement)
      ])
      : [["-", "-", "-", "-", "-", "Sem vendas no período", "-"]],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendPurchaseSummaryPdfTable(doc, purchaseSummary) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Indicador de compras", "Valor"]],
    body: [
      ["Compras registradas", formatInteger(purchaseSummary.count)],
      ["Animais adquiridos", formatInteger(purchaseSummary.totalAnimals)],
      ["Custo total de aquisição", formatCurrency(purchaseSummary.totalValue)],
      ["Custo médio por animal", purchaseSummary.totalAnimals > 0 ?formatCurrency(purchaseSummary.totalValue / purchaseSummary.totalAnimals) : formatCurrency(0)]
    ],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendPurchaseDetailsPdfTable(doc, purchaseSummary) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Data", "Categoria", "Qtd.", "Custo total", "Custo/cab.", "Observações"]],
    body: purchaseSummary.movements.length
      ?purchaseSummary.movements.map((movement) => {
        const qty = Number(movement.quantity || 0);
        const val = Number(movement.value || 0);
        return [
          formatDate(movement.date),
          movement.categoryName || "-",
          formatInteger(qty),
          formatCurrency(val),
          qty > 0 ?formatCurrency(val / qty) : "-",
          movement.notes || "-"
        ];
      })
      : [["-", "-", "-", "-", "-", "Sem compras no período"]],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendFinancialBalancePdfTable(doc, saleSummary, purchaseSummary) {
  const saldo = saleSummary.totalValue - purchaseSummary.totalValue;
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Resultado financeiro do período", "Valor"]],
    body: [
      ["Receita de vendas", formatCurrency(saleSummary.totalValue)],
      ["Custo de compras", formatCurrency(purchaseSummary.totalValue)],
      ["Resultado líquido", `${saldo >= 0 ?"+" : ""}${formatCurrency(saldo)}`]
    ],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    bodyStyles: (row) => row.index === 2 ?{ fontStyle: "bold" } : {}
  });
}

function appendPotreroPdfTable(doc, potreroTotals) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Potreiro", "Animais atuais", "% do rebanho"]],
    body: potreroTotals.length
      ?potreroTotals.map((item) => [item.name, formatInteger(item.quantity), `${item.share.toFixed(1)}%`])
      : [["Sem cadastro", "0", "0,0%"]],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendMonthlySummaryPdfTable(doc, monthlySummary) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Indicador mensal", "Valor"]],
    body: [
      ["Registros no período", formatInteger(monthlySummary.count)],
      ["Quantidade informada", formatInteger(monthlySummary.totalQuantity)],
      ["Valor atribuído", formatCurrency(monthlySummary.totalValue)],
      ["Categorias ativas", formatInteger(monthlySummary.activeCategories)]
    ],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendMonthlyDetailsPdfTable(doc, farm, monthlyRecords) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Competência", "Categoria", "Indicador", "Qtd.", "Valor", "Observações"]],
    body: monthlyRecords.length
      ?monthlyRecords.map((record) => [
        formatMonthYear(record.period),
        getMonthlyCategoryLabel(record.category),
        record.farmName && farm.id === TOTAL_FARM_ID ?`${record.farmName} | ${record.title}` : record.title,
        record.quantity ?formatInteger(record.quantity) : "-",
        record.value ?formatCurrency(record.value) : "-",
        record.notes || "-"
      ])
      : [["-", "-", "Sem dados mensais no período", "-", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendSanitarySummaryPdfTable(doc, sanitarySummary) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Indicador sanitário", "Valor"]],
    body: [
      ["Aplicações no período", formatInteger(sanitarySummary.totalApplications)],
      ["Animais tratados", formatInteger(sanitarySummary.treatedAnimals)],
      ["Produtos utilizados", formatInteger(sanitarySummary.uniqueProducts)],
    { title: "Último manejo", value: latestRecord ?formatDate(latestRecord.date) : "—", detail: latestRecord ?latestRecord.product : "nenhum registro disponível" }
    ],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendSanitaryDetailsPdfTable(doc, sanitaryRecords) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Data", "Categoria", "Qtd.", "Produto", "Observações"]],
    body: sanitaryRecords.length
      ?sanitaryRecords.map((record) => [
        formatDate(record.date),
        record.categoryName,
        formatMaybeQuantity(record.quantity),
        record.product,
        record.notes || "-"
      ])
      : [["-", "-", "-", "Sem registros sanitários no período", "-"]],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendInsightsPdfTable(doc, insights) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Insight gerencial", "Leitura"]],
    body: insights.map((item) => [item.tag, item.text]),
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendRecentMovementsPdfTable(doc, recentMovements) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Data", "Tipo", "Categoria", "Qtd.", "Valor", "Fotos", "Observação"]],
    body: recentMovements.length
      ?recentMovements.map((movement) => [
        formatDate(movement.date),
        capitalize(movement.type),
        movement.categoryName,
        formatInteger(movement.quantity),
        movement.value ?formatCurrency(movement.value) : "-",
        formatMovementPhotoCount(movement),
        getMovementNotes(movement)
      ])
      : [["-", "-", "-", "-", "-", "-", "Sem movimentações recentes"]],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

function appendUnifiedHistoryPdfTable(doc, records) {
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Código", "Data", "Operação", "Categoria", "Qtd.", "Registro"]],
    body: records.length
      ?records.map((record) => [
        getHistoryRecordCode(record),
        formatDate(record.date),
        getHistoryOperationLabel(record.operation),
        record.categoryName,
        formatInteger(record.quantity),
        record.details || "-"
      ])
      : [["-", "-", "-", "-", "-", "Sem registros no histórico do período"]],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] }
  });
}

async function appendMovementPhotoPages(doc, farm, year, month) {
  const photoEntries = getMovementPhotoEntries(farm, year, month);
  if (!photoEntries.length) return;

  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const gap = 6;
  const photosPerRow = 2;
  const rowsPerPage = 3;
  const photosPerPage = photosPerRow * rowsPerPage;

  const boxW = (pageW - margin * 2 - gap) / photosPerRow;
  const boxH = 72;
  const imgH = 52;
  const headerH = 26;

  for (let pageStart = 0; pageStart < photoEntries.length; pageStart += photosPerPage) {
    const pageEntries = photoEntries.slice(pageStart, pageStart + photosPerPage);
    doc.addPage();

    doc.setFillColor(248, 244, 236);
    doc.rect(0, 0, pageW, pageH, "F");

    doc.setFillColor(37, 88, 58);
    doc.rect(0, 0, pageW, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(248, 244, 236);
    doc.text(`Anexos Fotográficos — ${farm.name}`, pageW / 2, 11, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 225, 205);
    doc.text(`Registros com foto do período · ${photosPerRow} por linha`, pageW / 2, 19, { align: "center" });

    for (let i = 0; i < pageEntries.length; i++) {
      const entry = pageEntries[i];
      const col = i % photosPerRow;
      const row = Math.floor(i / photosPerRow);
      const boxX = margin + col * (boxW + gap);
      const boxY = headerH + 6 + row * (boxH + gap);

      doc.setFillColor(255, 252, 247);
      doc.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "F");
      doc.setDrawColor(210, 200, 182);
      doc.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "S");

      const typeLabel = capitalize(entry.movement.type || "");
      const dateLabel = formatDate(entry.movement.date);
      const catLabel = entry.movement.categoryName || "";
      const headerText = `${typeLabel} · ${dateLabel} · ${catLabel}`;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(37, 88, 58);
      doc.text(doc.splitTextToSize(headerText, boxW - 4)[0], boxX + 3, boxY + 6);

      const imageData = await fetchPhotoForPdf(entry.photo);
      if (imageData) {
        drawPdfMovementPhoto(doc, imageData, boxX + 3, boxY + 9, boxW - 6, imgH - 8);
      } else {
        doc.setFillColor(240, 235, 225);
        doc.roundedRect(boxX + 3, boxY + 9, boxW - 6, imgH - 8, 2, 2, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 130, 100);
        doc.text("Imagem indisponível", boxX + boxW / 2, boxY + 9 + (imgH - 8) / 2, { align: "center" });
      }

      const obs = getMovementNotes(entry.movement) || "";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(112, 94, 76);
      const obsText = obs ?doc.splitTextToSize(obs, boxW - 6)[0] : "";
      doc.text(obsText, boxX + 3, boxY + boxH - 4);
    }
  }
}

function appendPdfSectionTitle(doc, title, startY) {
  doc.autoTable({
    startY: startY !== undefined ?startY : (doc.lastAutoTable ?doc.lastAutoTable.finalY + 8 : 55),
    head: [[{ content: title, styles: { halign: "left" } }]],
    body: [],
    theme: "plain",
    headStyles: {
      fillColor: [37, 88, 58],
      textColor: [255, 252, 245],
      fontSize: 9.5,
      fontStyle: "bold",
      cellPadding: { top: 3, bottom: 3, left: 5, right: 5 }
    },
    margin: { left: 14, right: 14 }
  });
}

function appendInventoryWithPercentTable(doc, farm) {
  const total = getFarmTotal(farm);
  const rows = farm.categories.map((cat) => [
    cat.name,
    formatInteger(cat.quantity),
    total > 0 ?`${((cat.quantity / total) * 100).toFixed(1)}%` : "0,0%"
  ]);
  if (!rows.length) rows.push(["Sem categorias cadastradas", "0", "0,0%"]);
  doc.autoTable({
    startY: doc.lastAutoTable ?doc.lastAutoTable.finalY + 2 : 55,
    head: [["Categoria", "Quantidade", "% do rebanho"]],
    body: rows,
    foot: [["Total", formatInteger(total), "100%"]],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    footStyles: { fillColor: [237, 244, 238], fontStyle: "bold", textColor: [30, 60, 40] },
    alternateRowStyles: { fillColor: [245, 250, 246] },
    margin: { left: 14, right: 14 }
  });
}

function appendPurchasesByCategoryPdfTable(doc, purchaseSummary) {
  const byCategory = {};
  purchaseSummary.movements.forEach((m) => {
    const cat = m.categoryName || "Sem categoria";
    if (!byCategory[cat]) byCategory[cat] = { qty: 0, value: 0 };
    byCategory[cat].qty += Number(m.quantity || 0);
    byCategory[cat].value += Number(m.value || 0);
  });
  const rows = Object.entries(byCategory)
    .sort((a, b) => b[1].qty - a[1].qty)
    .map(([cat, data]) => [
      cat,
      formatInteger(data.qty),
      formatCurrency(data.value),
      data.qty > 0 ?formatCurrency(data.value / data.qty) : "-"
    ]);
  if (!rows.length) {
    rows.push(["Sem compras no período", "-", "-", "-"]);
  } else {
    rows.push(["TOTAL", formatInteger(purchaseSummary.totalAnimals), formatCurrency(purchaseSummary.totalValue),
      purchaseSummary.totalAnimals > 0 ?formatCurrency(purchaseSummary.totalValue / purchaseSummary.totalAnimals) : "-"]);
  }
  doc.autoTable({
    startY: doc.lastAutoTable ?doc.lastAutoTable.finalY + 2 : 55,
    head: [["Categoria", "Qtd. animais", "Custo total", "Custo/cab."]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    alternateRowStyles: { fillColor: [240, 246, 255] },
    margin: { left: 14, right: 14 }
  });
}

function appendSalesByCategoryPdfTable(doc, saleSummary) {
  const byCategory = {};
  saleSummary.movements.forEach((m) => {
    const cat = m.categoryName || "Sem categoria";
    if (!byCategory[cat]) byCategory[cat] = { qty: 0, value: 0, liveKg: 0 };
    byCategory[cat].qty += Number(m.quantity || 0);
    byCategory[cat].value += Number(m.value || 0);
    if (m.saleDetails && (m.saleDetails.mode || "vivo") !== "carcaca") {
      byCategory[cat].liveKg += Number(m.saleDetails.weightKg || 0);
    }
  });
  const totalQty = saleSummary.movements.reduce((s, m) => s + Number(m.quantity || 0), 0);
  const rows = Object.entries(byCategory)
    .sort((a, b) => b[1].value - a[1].value)
    .map(([cat, data]) => [
      cat,
      formatInteger(data.qty),
      data.liveKg > 0 ?formatWeight(data.liveKg) : "-",
      formatCurrency(data.value),
      data.liveKg > 0 ?formatCurrency(data.value / data.liveKg) : "-"
    ]);
  if (!rows.length) {
    rows.push(["Sem vendas no período", "-", "-", "-", "-"]);
  } else {
    rows.push(["TOTAL", formatInteger(totalQty), formatWeight(saleSummary.liveKg),
      formatCurrency(saleSummary.totalValue),
      saleSummary.liveKg > 0 ?formatCurrency(saleSummary.totalValue / saleSummary.liveKg) : "-"]);
  }
  doc.autoTable({
    startY: doc.lastAutoTable ?doc.lastAutoTable.finalY + 2 : 55,
    head: [["Categoria", "Qtd. animais", "Kg vivo", "Receita total", "R$/kg vivo"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    alternateRowStyles: { fillColor: [255, 247, 237] },
    margin: { left: 14, right: 14 }
  });
}

function appendChronologicalEvolutionPdfTable(doc, farm, year) {
  let totalBuyQty = 0, totalBuyVal = 0, totalSellQty = 0, totalSellVal = 0;
  const rows = [];
  for (let m = 1; m <= 12; m++) {
    const monthStr = String(m).padStart(2, "0");
    const purchase = summarizePurchasePeriod(farm, year, monthStr);
    const sale = summarizeSalePeriod(farm, year, monthStr);
    if (purchase.count === 0 && sale.count === 0) continue;
    const saldo = sale.totalValue - purchase.totalValue;
    rows.push([
      MONTH_NAMES[m - 1],
      formatInteger(purchase.count),
      formatCurrency(purchase.totalValue),
      formatInteger(sale.count),
      formatCurrency(sale.totalValue),
      `${saldo >= 0 ?"+" : ""}${formatCurrency(saldo)}`
    ]);
    totalBuyQty += purchase.count;
    totalBuyVal += purchase.totalValue;
    totalSellQty += sale.count;
    totalSellVal += sale.totalValue;
  }
  if (!rows.length) {
    rows.push(["Sem movimentações no ano", "-", "-", "-", "-", "-"]);
  } else {
    const totalSaldo = totalSellVal - totalBuyVal;
    rows.push(["TOTAL", formatInteger(totalBuyQty), formatCurrency(totalBuyVal),
      formatInteger(totalSellQty), formatCurrency(totalSellVal),
      `${totalSaldo >= 0 ?"+" : ""}${formatCurrency(totalSaldo)}`]);
  }
  doc.autoTable({
    startY: doc.lastAutoTable ?doc.lastAutoTable.finalY + 2 : 55,
    head: [["Mês", "Compras (op.)", "Custo compras", "Vendas (op.)", "Receita vendas", "Saldo"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    alternateRowStyles: { fillColor: [240, 248, 242] },
    margin: { left: 14, right: 14 }
  });
}

function appendSanitaryByProductPdfTable(doc, sanitaryRecords) {
  const byProduct = {};
  sanitaryRecords.forEach((record) => {
    const product = record.product || "Produto não informado";
    if (!byProduct[product]) byProduct[product] = { applications: 0, animals: 0, lastDate: "" };
    byProduct[product].applications += 1;
    byProduct[product].animals += Number(record.quantity || 0);
    if (!byProduct[product].lastDate || record.date > byProduct[product].lastDate) {
      byProduct[product].lastDate = record.date;
    }
  });
  const rows = Object.entries(byProduct)
    .sort((a, b) => b[1].applications - a[1].applications)
    .map(([product, data]) => [
      product,
      formatInteger(data.applications),
      formatInteger(data.animals),
      data.lastDate ?formatDate(data.lastDate) : "-"
    ]);
  if (!rows.length) rows.push(["Sem registros sanitários no período", "-", "-", "-"]);
  doc.autoTable({
    startY: doc.lastAutoTable ?doc.lastAutoTable.finalY + 2 : 55,
    head: [["Produto / Vacina", "Aplicações", "Animais tratados", "Último uso"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    alternateRowStyles: { fillColor: [240, 248, 242] },
    margin: { left: 14, right: 14 }
  });
}

function appendConsolidatedPdfIntro(doc, farms, periodLabel, year, month) {
  const totals = farms.reduce((acc, farm) => {
    const sale = summarizeSalePeriod(farm, year, month);
    const purchase = summarizePurchasePeriod(farm, year, month);
    const sanitary = getSanitarySummary(farm, year, month);
    acc.animals += getFarmTotal(farm);
    acc.salesValue += sale.totalValue;
    acc.salesQty += sale.count;
    acc.purchasesValue += purchase.totalValue;
    acc.purchasesQty += purchase.count;
    acc.sanitaryCount += sanitary.totalApplications;
    acc.treatedAnimals += sanitary.treatedAnimals;
    return acc;
  }, { animals: 0, salesValue: 0, salesQty: 0, purchasesValue: 0, purchasesQty: 0, sanitaryCount: 0, treatedAnimals: 0 });

  const { width } = getPdfPageSize(doc);
  const margin = 14;
  const saldo = totals.salesValue - totals.purchasesValue;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(27, 77, 47);
  doc.text("Grupo Fazendas Da Bruna", margin, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(87, 69, 52);
  doc.text(`Visão consolidada · ${periodLabel} · ${formatInteger(farms.length)} fazendas`, margin, 23);
  doc.setTextColor(45, 35, 25);

  const kpis = [
    { label: "Total de animais", value: formatInteger(totals.animals), color: [37, 88, 58] },
    { label: "Compras realizadas", value: `${formatInteger(totals.purchasesQty)} op.`, color: [79, 115, 168] },
    { label: "Custo total de compras", value: formatCurrency(totals.purchasesValue), color: [60, 90, 145] },
    { label: "Vendas realizadas", value: `${formatInteger(totals.salesQty)} op.`, color: [195, 130, 65] },
    { label: "Receita total de vendas", value: formatCurrency(totals.salesValue), color: [170, 110, 50] },
    { label: "Saldo financeiro", value: formatCurrency(Math.abs(saldo)), sub: saldo >= 0 ?"positivo" : "negativo", color: saldo >= 0 ?[55, 91, 67] : [140, 60, 50] },
    { label: "Aplicações sanitárias", value: formatInteger(totals.sanitaryCount), color: [80, 110, 60] },
    { label: "Animais tratados", value: formatInteger(totals.treatedAnimals), color: [65, 90, 50] }
  ];

  const cardsPerRow = 4;
  const gap = 4;
  const cardW = (width - margin * 2 - gap * (cardsPerRow - 1)) / cardsPerRow;
  const cardH = 26;
  const startY = 28;

  kpis.forEach((kpi, i) => {
    const col = i % cardsPerRow;
    const row = Math.floor(i / cardsPerRow);
    const x = margin + col * (cardW + gap);
    const y = startY + row * (cardH + 4);
    doc.setFillColor(...kpi.color);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 195, 180);
    doc.text(kpi.label, x + 4, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 252, 245);
    doc.text(kpi.value, x + 4, y + 18);
    if (kpi.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(200, 195, 180);
      doc.text(kpi.sub, x + 4, y + 24);
    }
  });

  const tableY = startY + Math.ceil(kpis.length / cardsPerRow) * (cardH + 4) + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(27, 77, 47);
  doc.text("Comparativo por fazenda", margin, tableY);

  doc.autoTable({
    startY: tableY + 4,
    head: [["Fazenda", "Animais", "Compras (op.)", "Custo compras", "Vendas (op.)", "Receita vendas", "Saldo", "Sanitário"]],
    body: farms.map((farm) => {
      const sale = summarizeSalePeriod(farm, year, month);
      const purchase = summarizePurchasePeriod(farm, year, month);
      const sanitary = getSanitarySummary(farm, year, month);
      const farmSaldo = sale.totalValue - purchase.totalValue;
      return [
        farm.name,
        formatInteger(getFarmTotal(farm)),
        formatInteger(purchase.count),
        formatCurrency(purchase.totalValue),
        formatInteger(sale.count),
        formatCurrency(sale.totalValue),
        `${farmSaldo >= 0 ?"+" : ""}${formatCurrency(farmSaldo)}`,
        formatInteger(sanitary.totalApplications)
      ];
    }),
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184], fontSize: 8 },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [245, 250, 246] },
    margin: { left: 14, right: 14 }
  });
}

async function appendFarmPdfSection(doc, farm, periodLabel, year, month) {
  const monthly = summarizePeriod(farm, year, month);
  const saleSummary = summarizeSalePeriod(farm, year, month);
  const purchaseSummary = summarizePurchasePeriod(farm, year, month);
  const topY = await addPdfHeader(doc, farm, periodLabel, monthly);

  const { width } = getPdfPageSize(doc);
  const margin = 14;
  const saldo = saleSummary.totalValue - purchaseSummary.totalValue;
  const kpis = [
    { label: "Estoque atual", value: `${formatInteger(getFarmTotal(farm))} animais`, color: [37, 88, 58] },
    { label: "Receita de vendas", value: formatCurrency(saleSummary.totalValue), color: [195, 130, 65] },
    { label: "Custo de compras", value: formatCurrency(purchaseSummary.totalValue), color: [79, 115, 168] },
    { label: "Saldo financeiro", value: formatCurrency(Math.abs(saldo)), sub: saldo >= 0 ?"positivo" : "negativo", color: saldo >= 0 ?[55, 91, 67] : [140, 60, 50] }
  ];
  const cardW = (width - margin * 2 - 12) / 4;
  const cardH = 22;
  kpis.forEach((kpi, i) => {
    const x = margin + i * (cardW + 4);
    doc.setFillColor(...kpi.color);
    doc.roundedRect(x, topY, cardW, cardH, 3, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 195, 180);
    doc.text(kpi.label, x + 4, topY + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 252, 245);
    doc.text(kpi.value, x + 4, topY + 16);
    if (kpi.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(200, 195, 180);
      doc.text(kpi.sub, x + 4, topY + 21);
    }
  });

  const afterCardsY = topY + cardH + 6;

  appendPdfSectionTitle(doc, "Estoque por Categoria", afterCardsY);
  appendInventoryWithPercentTable(doc, farm);
  appendPdfSectionTitle(doc, "Campos / Potreiros");
  appendPotreroPdfTable(doc, getPotreroTotals(farm));

  appendPdfSectionTitle(doc, "Compras no Período");
  appendPurchasesByCategoryPdfTable(doc, purchaseSummary);

  appendPdfSectionTitle(doc, "Vendas no Período");
  appendSalesByCategoryPdfTable(doc, saleSummary);

  appendPdfSectionTitle(doc, `Evolução Cronológica – ${year}`);
  appendChronologicalEvolutionPdfTable(doc, farm, year);
}

async function exportReproducaoPdf() {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("A biblioteca de PDF não foi carregada. Verifique sua conexão e tente novamente.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ?getAllFarms() : [getFarm()].filter(Boolean);
  if (!farms.length) { alert("Nenhuma fazenda encontrada."); return; }

  const year = String(state.filters.year);
  const month = state.filters.month;
  const periodLabel = month === "all" ?`Ano ${year}` : `${MONTH_NAMES[Number(month) - 1]}/${year}`;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let firstPage = true;

  await appendPdfCoverPage(doc, farms, periodLabel, "Relatório de Reprodução");
  doc.addPage();

  if (isTotalView) {
    appendReproductionConsolidatedPdfIntro(doc, farms, periodLabel, year, month);
    doc.addPage();
  }

  for (const farm of farms) {
    if (!firstPage) doc.addPage();
    firstPage = false;

    if (isTotalView) {
      const recordsForDivider = getReproductionRecords(farm).filter((record) => {
        const d = record.date || "";
        if (year !== "all" && !d.startsWith(year)) return false;
        if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
        return true;
      });
      const dividerStats = calcReproductionStats(recordsForDivider);
      appendPdfFarmReportDivider(doc, farm, periodLabel, "Relatório de Reprodução", [
        { label: "Eventos", value: formatInteger(recordsForDivider.length) },
        { label: "Prenhas", value: formatInteger(dividerStats.totalPegou) },
        { label: "Falhadas", value: formatInteger(dividerStats.totalFalhou) },
        { label: "Taxa", value: dividerStats.taxaSucesso != null ?`${dividerStats.taxaSucesso.toFixed(1)}%` : "-" }
      ], farms.indexOf(farm) + 1, farms.length);
      doc.addPage();
    }

    // Header
    try {
      const logoData = await loadLogoForPdf("#ffffff");
      doc.addImage(logoData, "JPEG", margin, 8, 18, 18);
    } catch (e) { /* ignore */ }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(45, 35, 25);
    doc.text("Relatório de Reprodução", margin + 22, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(87, 69, 52);
    doc.text(`Fazenda: ${farm.name}   Período: ${periodLabel}   Responsável: ${TECHNICAL_MANAGER_NAME}`, margin + 22, 22);

    doc.setDrawColor(140, 80, 45);
    doc.setLineWidth(0.6);
    doc.line(margin, 27, pageW - margin, 27);

    const repRecords = (farm.reproductionRecords || [])
      .filter((r) => {
        const d = r.date || "";
        if (year !== "all" && !d.startsWith(year)) return false;
        if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const stats = calcReproductionStats(repRecords);
    const pendentes = repRecords.filter((r) => !r.verificationDate).length;
    const taxaStr = stats.taxaSucesso != null ?`${stats.taxaSucesso.toFixed(1)}%` : "—";

    // KPI row
    const kpis = [
      { label: "Total eventos", value: formatInteger(repRecords.length) },
      { label: "Inseminações", value: formatInteger(stats.totalInseminacoes) },
      { label: "Entouradas", value: formatInteger(stats.totalEntouradas) },
      { label: "Prenhes", value: formatInteger(stats.totalPegou) },
      { label: "Falhadas", value: formatInteger(stats.totalFalhou) },
      { label: "Taxa prenhez", value: taxaStr },
      { label: "Aguardando", value: formatInteger(pendentes) }
    ];

    const kpiW = (pageW - margin * 2 - 6 * kpis.length) / kpis.length;
    kpis.forEach((kpi, i) => {
      const x = margin + i * (kpiW + 6);
      const y = 30;
      doc.setFillColor(37, 88, 58);
      doc.roundedRect(x, y, kpiW, 18, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(180, 210, 185);
      doc.text(kpi.label, x + kpiW / 2, y + 5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(248, 244, 236);
      doc.text(kpi.value, x + kpiW / 2, y + 13, { align: "center" });
    });

    // Events table
    doc.autoTable({
      startY: 52,
      head: [["Código", "Data", "Tipo", "Categoria", "Qtd.", "Data Verif.", "Prenha", "Falhada", "% Prenhez", "Obs."]],
      body: repRecords.length
        ?repRecords.map((r) => {
          const qty = Number(r.quantity || 0);
          const pegou = r.quantityPegou != null ?formatInteger(r.quantityPegou) : "—";
          const falhou = r.verificationDate && r.quantityPegou != null
            ?formatInteger(Math.max(0, qty - Number(r.quantityPegou)))
            : "—";
          const taxa = r.verificationDate && r.quantityPegou != null && qty > 0
            ?`${((Number(r.quantityPegou) / qty) * 100).toFixed(1)}%`
            : "Aguardando";
          return [
            r.code || "—",
            formatDate(r.date),
            r.type === "inseminacao" ?"Inseminação" : "Entourada",
            r.categoryName || "—",
            formatInteger(qty),
            r.verificationDate ?formatDate(r.verificationDate) : "Pendente",
            pegou,
            falhou,
            taxa,
            (r.notes || "").slice(0, 30)
          ];
        })
        : [["—", "—", "—", "—", "—", "—", "—", "—", "Sem eventos no período", ""]],
      theme: "striped",
      headStyles: { fillColor: [43, 132, 184], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      margin: { left: margin, right: margin }
    });

    // Footer handled after all pages are assembled.
    /*
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(150, 130, 100);
      doc.text(`Página ${i} de ${pageCount}`, pageW - margin, pageH - 6, { align: "right" });
      doc.text(`Fazendas Da Bruna · Reprodução · ${periodLabel}`, margin, pageH - 6);
    }
    */
  }

  addPdfFooters(doc, { coverPage: true });
  const periodSuffix = month === "all" ?year : `${year}-${month}`;
  const farmSuffix = isTotalView ?"todas-fazendas" : slugify(farms[0]?.name || "");
  doc.save(`reproducao-${farmSuffix}-${periodSuffix}.pdf`);
}

function appendReproductionConsolidatedPdfIntro(doc, farms, periodLabel, year, month) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const allRecords = farms.flatMap((farm) =>
    getReproductionRecords(farm)
      .filter((record) => {
        const d = record.date || "";
        if (year !== "all" && !d.startsWith(year)) return false;
        if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
        return true;
      })
      .map((record) => ({ ...record, farmName: farm.name }))
  );
  const stats = calcReproductionStats(allRecords);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(45, 35, 25);
  doc.text("Relatório de Reprodução - Todas as Fazendas", margin, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(87, 69, 52);
  doc.text(`Período: ${periodLabel} | Fazendas: ${formatInteger(farms.length)} | Responsável: ${TECHNICAL_MANAGER_NAME}`, margin, 24);
  doc.setDrawColor(140, 80, 45);
  doc.line(margin, 30, pageW - margin, 30);

  doc.autoTable({
    startY: 38,
    head: [["Indicador", "Valor"]],
    body: [
      ["Eventos no período", formatInteger(allRecords.length)],
      ["Inseminacoes", formatInteger(stats.totalInseminacoes)],
      ["Entouradas", formatInteger(stats.totalEntouradas)],
      ["Prenhas confirmadas", formatInteger(stats.totalPegou)],
      ["Falhadas", formatInteger(stats.totalFalhou)],
      ["Taxa de prenhez", stats.taxaSucesso != null ?`${stats.taxaSucesso.toFixed(1)}%` : "-"],
      ["Aguardando resultado", formatInteger(allRecords.filter((record) => !record.verificationDate).length)]
    ],
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: margin, right: margin }
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Fazenda", "Eventos", "Prenhas", "Falhadas", "Pendentes", "Taxa"]],
    body: farms.map((farm) => {
      const records = allRecords.filter((record) => record.farmName === farm.name);
      const farmStats = calcReproductionStats(records);
      return [
        farm.name,
        formatInteger(records.length),
        formatInteger(farmStats.totalPegou),
        formatInteger(farmStats.totalFalhou),
        formatInteger(records.filter((record) => !record.verificationDate).length),
        farmStats.taxaSucesso != null ?`${farmStats.taxaSucesso.toFixed(1)}%` : "-"
      ];
    }),
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: margin, right: margin }
  });
}

async function exportSanitaryPdfReport() {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("A biblioteca de PDF não foi carregada. Verifique sua conexão e tente novamente.");
    return;
  }

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ?getAllFarms() : [getFarm()].filter(Boolean);
  if (!farms.length) {
    alert("Nenhuma fazenda válida encontrada.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const periodSuffix = state.filters.month === "all"
    ?state.filters.year
    : `${state.filters.year}-${state.filters.month}`;
  const periodLabel = state.filters.month === "all"
    ?`Ano ${state.filters.year}`
    : `${MONTH_NAMES[Number(state.filters.month) - 1]}/${state.filters.year}`;

  await appendPdfCoverPage(doc, farms, periodLabel, "Relatório Sanitário");

  if (farms.length > 1) {
    doc.addPage();
    appendSanitaryConsolidatedPdfIntro(doc, farms);
    for (const [index, farm] of farms.entries()) {
      doc.addPage();
      const summary = getSanitarySummary(farm, state.filters.year, state.filters.month);
      appendPdfFarmReportDivider(doc, farm, periodLabel, "Relatório Sanitário", [
        { label: "Aplicacoes", value: formatInteger(summary.totalApplications) },
        { label: "Animais tratados", value: formatInteger(summary.treatedAnimals) },
        { label: "Produtos", value: formatInteger(summary.uniqueProducts) },
        { label: "Estoque", value: formatInteger(getFarmTotal(farm)) }
      ], index + 1, farms.length);
      doc.addPage();
      await appendSanitaryPdfReport(doc, farm);
    }
    addPdfFooters(doc, { coverPage: true });
    doc.save(`manejo-sanitario-todas-fazendas-${periodSuffix}.pdf`);
  } else {
    doc.addPage();
    await appendSanitaryPdfReport(doc, farms[0]);
    addPdfFooters(doc, { coverPage: true });
    doc.save(`manejo-sanitario-${slugify(farms[0].name)}-${periodSuffix}.pdf`);
  }
}

function appendSanitaryConsolidatedPdfIntro(doc, farms) {
  const year = state.filters.year;
  const month = state.filters.month;
  const periodLabel = month === "all"
    ?`Ano ${year}`
    : `${MONTH_NAMES[Number(month) - 1]}/${year}`;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  const rows = farms.map((farm) => {
    const summary = getSanitarySummary(farm, year, month);
    return [
      farm.name,
      formatInteger(summary.totalApplications),
      formatInteger(summary.treatedAnimals),
      formatInteger(summary.uniqueProducts),
      summary.latestRecord ?`${formatDate(summary.latestRecord.date)} - ${summary.latestRecord.product}` : "-"
    ];
  });
  const totals = rows.reduce((acc, row) => {
    acc.applications += Number(String(row[1]).replace(/\D/g, "") || 0);
    acc.animals += Number(String(row[2]).replace(/\D/g, "") || 0);
    return acc;
  }, { applications: 0, animals: 0 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(45, 35, 25);
  doc.text("Relatório Sanitário - Todas as Fazendas", margin, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(87, 69, 52);
  doc.text(`Período: ${periodLabel} | Fazendas: ${formatInteger(farms.length)} | Responsável: ${TECHNICAL_MANAGER_NAME}`, margin, 24);
  doc.setDrawColor(55, 91, 67);
  doc.line(margin, 30, pageW - margin, 30);

  doc.autoTable({
    startY: 38,
    head: [["Fazenda", "Aplica??es", "Animais tratados", "Produtos", "?ltimo manejo"]],
    body: rows.concat([["TOTAL", formatInteger(totals.applications), formatInteger(totals.animals), "-", "-"]]),
    theme: "striped",
    headStyles: { fillColor: [43, 132, 184] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: margin, right: margin }
  });
}

async function appendSanitaryPdfReport(doc, farm) {
  const year = state.filters.year;
  const month = state.filters.month;
  const periodLabel = month === "all"
    ?`Ano ${year}`
    : `${MONTH_NAMES[Number(month) - 1]}/${year}`;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header
  try {
    const logoData = await loadLogoForPdf("#ffffff");
    doc.addImage(logoData, "JPEG", margin, 8, 18, 18);
  } catch (e) { /* ignore */ }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório de Manejo Sanitário", margin + 22, 14);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Fazenda: ${farm.name}   Período: ${periodLabel}`, margin + 22, 20);
  doc.text(`Responsável técnico: ${TECHNICAL_MANAGER_NAME}`, margin + 22, 26);

  // Divider
  doc.setDrawColor(55, 91, 67);
  doc.setLineWidth(0.6);
  doc.line(margin, 30, pageW - margin, 30);

  // Summary stats
  const { totalApplications, treatedAnimals, uniqueProducts } = getSanitarySummary(farm);
  const records = getFilteredSanitaryRecords(farm).sort((a, b) => new Date(b.date) - new Date(a.date));

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 91, 67);
  doc.text(`Aplicações: ${totalApplications}`, margin, 37);
  doc.text(`Animais tratados: ${treatedAnimals}`, margin + 50, 37);
  doc.text(`Produtos distintos: ${uniqueProducts}`, margin + 110, 37);
  doc.text(`Total de registros: ${records.length}`, margin + 170, 37);
  doc.setTextColor(0, 0, 0);

  // Table
  let y = 44;
  const colW = [
    (pageW - 2 * margin) * 0.10,
    (pageW - 2 * margin) * 0.08,
    (pageW - 2 * margin) * 0.17,
    (pageW - 2 * margin) * 0.07,
    (pageW - 2 * margin) * 0.22,
    (pageW - 2 * margin) * 0.36
  ];
  const headers = ["Código", "Data", "Categoria", "Qtd.", "Produto", "Observações"];
  const rowH = 8;

  // Table header
  doc.setFillColor(55, 91, 67);
  doc.rect(margin, y, pageW - 2 * margin, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 5.5);
    x += colW[i];
  });
  y += rowH;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  records.forEach((record, idx) => {
    if (y + rowH > pageH - 12) {
      doc.addPage();
      y = 14;
      doc.setFillColor(55, 91, 67);
      doc.rect(margin, y, pageW - 2 * margin, rowH, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      x = margin;
      headers.forEach((h, i) => { doc.text(h, x + 2, y + 5.5); x += colW[i]; });
      y += rowH;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
    }

    if (idx % 2 === 0) {
      doc.setFillColor(245, 240, 230);
      doc.rect(margin, y, pageW - 2 * margin, rowH, "F");
    }

    doc.setFontSize(7.5);
    const cells = [
      record.code || (record.sourceId?.startsWith("xls-san-") ?`IMP-${getFarmCodePrefix(farm.id)}` : "—"),
      formatDate(record.date),
      record.categoryName || "—",
      String(record.quantity || "—"),
      record.product || "—",
      record.notes || ""
    ];

    x = margin;
    cells.forEach((cell, i) => {
      const maxW = colW[i] - 4;
      const text = doc.splitTextToSize(String(cell), maxW)[0] || "";
      doc.text(text, x + 2, y + 5.5);
      x += colW[i];
    });

    doc.setDrawColor(220, 210, 195);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowH, pageW - margin, y + rowH);
    y += rowH;
  });

  // Footer handled after all pages are assembled.
  /*
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(150, 130, 100);
    doc.text(`Página ${i} de ${pageCount}`, pageW - margin, pageH - 6, { align: "right" });
    doc.text(`Fazendas Da Bruna · Manejo Sanitário · ${periodLabel}`, margin, pageH - 6);
  }
  */
}

function getPdfFileName(farms, year, month) {
  const periodSuffix = month === "all" ?year : `${year}-${month}`;
  if (farms.length === 1) {
    return `relatorio-${slugify(farms[0].name)}-${periodSuffix}.pdf`;
  }

  return `relatorio-fazendas-da-bruna-${periodSuffix}.pdf`;
}

async function exportPdfReport(farmIds = [state.data.selectedFarmId], period = { year: state.filters.year, month: state.filters.month }) {
  const farms = farmIds.map((farmId) => state.data.farms[farmId]).filter(Boolean);
  if (!farms.length) {
    alert("Nenhuma fazenda válida foi selecionada para o PDF.");
    return;
  }

  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("A biblioteca de PDF não foi carregada. Verifique sua conexão e tente novamente.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  if (typeof doc.autoTable !== "function") {
    alert("O módulo de tabela do PDF não foi carregado. Verifique sua conexão e tente novamente.");
    return;
  }

  const year = String(period.year || state.filters.year);
  const month = period.month || state.filters.month;
  const periodLabel = month === "all" ?`Ano de ${year}` : `${MONTH_NAMES[Number(month) - 1]} de ${year}`;

  await appendPdfCoverPage(doc, farms, periodLabel);

  if (farms.length > 1) {
    doc.addPage();
    appendConsolidatedPdfIntro(doc, farms, periodLabel, year, month);
  }

  for (const [index, farm] of farms.entries()) {
    doc.addPage();
    appendFarmDividerPage(doc, farm, periodLabel, year, month, index + 1, farms.length);
    doc.addPage();
    await appendFarmPdfSection(doc, farm, periodLabel, year, month);
    await appendMovementPhotoPages(doc, farm, year, month);
  }

  addPdfFooters(doc, { coverPage: true });

  doc.save(getPdfFileName(farms, year, month));
}

function cloneSeedData() {
  if (typeof structuredClone === "function") {
    return structuredClone(seedData);
  }

  return JSON.parse(JSON.stringify(seedData));
}

function ensureDataShape(data, options = {}) {
  const preserveSnapshot = Boolean(options.preserveSnapshot);
  if (!data.farms || typeof data.farms !== "object") {
    data.farms = {};
  }

  if (typeof data.selectedFarmId !== "string") {
    data.selectedFarmId = TOTAL_FARM_ID;
  }

  if (!data.auth || typeof data.auth !== "object") {
    data.auth = cloneDeep(seedData.auth);
  }
  if (!Array.isArray(data.auth.users) || !data.auth.users.length) {
    data.auth.users = cloneDeep(seedData.auth.users);
  }
  if (typeof data.auth.sessionUserId !== "string") {
    data.auth.sessionUserId = "";
  }
  if (!Array.isArray(data.auth.auditLog)) {
    data.auth.auditLog = [];
  }
  data.auth.users = data.auth.users.map((user, index) => ({
    id: user.id || `user-${index + 1}`,
    login: user.login || `Usuário ${index + 1}`,
    role: user.role || "usuario"
  }));
  data.auth.users = data.auth.users.map((user) => {
    if (user.id === "user-da-luz") {
      return {
        ...user,
        login: user.login || "Hugo Balbuena",
        role: user.role || "admin"
      };
    }

    return user;
  });
  // Migrate users without roles — first user is admin, rest are usuario
  data.auth.users.forEach((user, index) => {
    if (!user.role) {
      user.role = index === 0 ?"admin" : "usuario";
    }
  });
  if (!data.auth.users.some((user) => user.id === data.auth.sessionUserId)) {
    data.auth.sessionUserId = "";
  }

  Object.entries(seedData.farms).forEach(([farmId, farmTemplate]) => {
    if (!data.farms[farmId]) {
      data.farms[farmId] = cloneDeep(farmTemplate);
    }
  });

  if (data.selectedFarmId !== TOTAL_FARM_ID && !data.farms[data.selectedFarmId]) {
    data.selectedFarmId = TOTAL_FARM_ID;
  }

  Object.values(data.farms).forEach((farm) => {
    if (!Array.isArray(farm.categories)) {
      farm.categories = [];
    }
    if (!Array.isArray(farm.movements)) {
      farm.movements = [];
    }
    if (!Array.isArray(farm.sanitaryRecords)) {
      farm.sanitaryRecords = [];
    }
    if (!Array.isArray(farm.monthlyRecords)) {
      farm.monthlyRecords = [];
    }
    if (!Array.isArray(farm.reproductionRecords)) {
      farm.reproductionRecords = [];
    }
    farm.reproductionRecords = farm.reproductionRecords.map((record) => ({
      ...record,
      id: record.id || record.sourceId || createMovementId(),
      farmId: farm.id,
      categoryName: record.categoryName || record.categoryId || "Sem categoria",
      categoryId: record.categoryId || record.categoryName || "",
      quantity: Number(record.quantity || 0),
      quantityPegou: record.quantityPegou == null ?null : Number(record.quantityPegou || 0),
      verificationDate: record.verificationDate || null,
      verificationNotes: record.verificationNotes || "",
      notes: record.notes || ""
    }));
    if (typeof farm.reproductionCodeSequence !== "number") {
      farm.reproductionCodeSequence = farm.reproductionRecords.length;
    }
    if (!Array.isArray(farm.sanitaryProducts) || !farm.sanitaryProducts.length) {
      farm.sanitaryProducts = [...DEFAULT_SANITARY_PRODUCTS];
    }
    farm.importedBaselineVersion = Number(farm.importedBaselineVersion || 0);
    if (!Array.isArray(farm.potreiros)) {
      farm.potreiros = normalizePotreroEntries([], DEFAULT_POTREIROS);
    } else {
      farm.potreiros = normalizePotreroEntries(farm.potreiros);
    }
    STANDARD_FARM_CATEGORIES.forEach((template) => {
      if (!farm.categories.some((category) => category.id === template.id)) {
        farm.categories.push({ ...template, quantity: 0 });
      }
    });
    farm.categories.forEach((category) => {
      if (!category.allocation || typeof category.allocation !== "object") {
        category.allocation = { [UNALLOCATED_POTREIRO_KEY]: Number(category.quantity || 0) };
      }
    });
    farm.sanitaryRecords = farm.sanitaryRecords.map((record) => ({
      ...record,
      id: record.id || record.sourceId || createMovementId(),
      code: record.code || "",
      potreiro: record.potreiro || "Sem potreiro"
    }));
    if (typeof farm.sanitaryCodeSequence !== "number") {
      farm.sanitaryCodeSequence = farm.sanitaryRecords.filter((r) => !r.sourceId).length;
    }
    farm.movements = farm.movements.map((movement) => ({
      ...movement,
      id: movement.id || movement.sourceId || createMovementId(),
      code: movement.code || "",
      sourceId: movement.sourceId || "",
      quantity: Number(movement.quantity || 0),
      delta: Number(movement.delta || 0),
      value: Number(movement.value || 0),
      notes: movement.notes || "",
      photos: normalizeMovementPhotos(movement.photos),
      saleDetails: movement.saleDetails
        ?{
          ...movement.saleDetails,
          mode: movement.saleDetails.mode || "vivo",
          pricePerKg: Number(movement.saleDetails.pricePerKg || 0),
          weightKg: Number(movement.saleDetails.weightKg || 0)
        }
        : null
    }));
    ensureSanitaryCodesForFarm(farm);
    ensureMovementCodesForFarm(farm);
    farm.monthlyRecords = farm.monthlyRecords.map((record) => ({
      ...record,
      id: record.id || createMovementId(),
      sourceId: record.sourceId || "",
      period: record.period || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
      category: record.category || "outros",
      title: record.title || "Indicador mensal",
      quantity: Number(record.quantity || 0),
      value: Number(record.value || 0),
      notes: record.notes || ""
    }));
    pruneLegacyPotreiros(farm);
    applyImportedFarmBaseline(farm);
  });

  // Always apply sanitary imports — idempotent (sourceId check prevents duplicates)
  Object.entries(IMPORTED_SANITARY_RECORDS).forEach(([farmId, records]) => {
    const farm = data.farms[farmId];
    if (!farm) {
      return;
    }

    records.forEach((record) => {
      if (!farm.sanitaryRecords.some((item) => item.sourceId === record.sourceId)) {
        farm.sanitaryRecords.push({
          ...record,
          id: record.sourceId || createMovementId(),
          potreiro: record.potreiro || "Sem potreiro"
        });
      }
      if (!farm.sanitaryProducts.includes(record.product)) {
        farm.sanitaryProducts.push(record.product);
      }
      if (record.potreiro && !getPotreroEntries(farm).some((item) => normalizeText(item.name) === normalizeText(record.potreiro))) {
        farm.potreiros.push({
          id: createPotreroId(record.potreiro),
          name: record.potreiro,
          quantity: 0
        });
      }
    });
  });

  Object.values(data.farms).forEach((farm) => {
    ensureSanitaryCodesForFarm(farm);
    ensureMovementCodesForFarm(farm);
  });

  if (!preserveSnapshot) {
    const allMonthlyRecords = { ...IMPORTED_MONTHLY_RECORDS };
    Object.entries(EXTENDED_MONTHLY_RECORDS).forEach(([farmId, records]) => {
      if (!allMonthlyRecords[farmId]) allMonthlyRecords[farmId] = [];
      allMonthlyRecords[farmId] = [...allMonthlyRecords[farmId], ...records];
    });

    Object.entries(allMonthlyRecords).forEach(([farmId, records]) => {
      const farm = data.farms[farmId];
      if (!farm) {
        return;
      }

      records.forEach((record) => {
        if (!farm.monthlyRecords.some((item) => item.sourceId === record.sourceId)) {
          farm.monthlyRecords.push({
            ...record,
            id: createMovementId()
          });
        }
      });
    });

    const needsMovementUpdate = (data.commercialMovementsVersion || 0) < COMMERCIAL_MOVEMENTS_VERSION;
    Object.entries(IMPORTED_COMMERCIAL_MOVEMENTS).forEach(([farmId, movements]) => {
      const farm = data.farms[farmId];
      if (!farm) {
        return;
      }

      movements.forEach((movement) => {
        const existingIdx = farm.movements.findIndex((item) => item.sourceId === movement.sourceId);
        if (existingIdx === -1) {
          farm.movements.push({
            ...movement,
            id: movement.sourceId || createMovementId()
          });
        } else if (needsMovementUpdate && !farm.movements[existingIdx].userModified) {
          const farmCurrency = getFarmCurrency(farmId);
          const existing = farm.movements[existingIdx];
          let updatedValue = movement.value;
          let updatedPricePerKg = movement.saleDetails?.pricePerKg;
          if (farmCurrency === "USD" && existing.saleDetails?.weightKg) {
            const usdPrice = extractUsdPriceFromNotes(movement.notes);
            if (usdPrice !== null) {
              updatedPricePerKg = usdPrice;
              updatedValue = Math.round(usdPrice * existing.saleDetails.weightKg * 100) / 100;
            }
          }
          farm.movements[existingIdx] = {
            ...existing,
            value: updatedValue,
            notes: movement.notes,
            currency: farmCurrency,
            saleDetails: movement.saleDetails
              ? { ...movement.saleDetails, pricePerKg: updatedPricePerKg }
              : existing.saleDetails
          };
        }
      });
    });
    data.commercialMovementsVersion = COMMERCIAL_MOVEMENTS_VERSION;
  }

  return data;
}

function applyImportedFarmBaseline(farm) {
  const imported = IMPORTED_FARM_BASELINES[farm.id];
  if (!imported || farm.importedBaselineVersion >= IMPORTED_FARM_BASELINE_VERSION) {
    return;
  }
  if (!isPlaceholderInventory(farm)) {
    return;
  }

  farm.declaredTotal = Number(imported.declaredTotal || 0);
  farm.note = imported.note || farm.note;
  farm.categories = imported.categories.map((category) => ({
    id: category.id || slugify(category.name || "categoria"),
    name: category.name || "Categoria",
    quantity: Number(category.quantity || 0)
  }));
  farm.importedBaselineVersion = IMPORTED_FARM_BASELINE_VERSION;
}

function isPlaceholderInventory(farm) {
  const categories = Array.isArray(farm.categories) ?farm.categories : [];
  const hasAnyCategoryValue = categories.some((category) => Number(category.quantity || 0) > 0);
  const usesOnlyStandardCategories = categories.every((category) => STANDARD_FARM_CATEGORIES.some((template) => template.id === category.id));
  const hasOperationalHistory = (farm.movements?.length || 0) > 0
    || getPotreroEntries(farm).some((potrero) => normalizePotreroQuantity(potrero.quantity) > 0);
  const normalizedNote = normalizeText(farm.note || "");

  return !hasAnyCategoryValue
    && !hasOperationalHistory
    && usesOnlyStandardCategories
    && Number(farm.declaredTotal || 0) === 0
    && (!normalizedNote || normalizedNote.includes("estrutura pronta para receber o inventario inicial"));
}

function cloneDeep(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

const assetDataUrlCache = new Map();

function createMovementId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `mov-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createLinearColor(canvas, startColor, endColor) {
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height || 320);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  return gradient;
}

function createRadialColor(canvas, color, index) {
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    16,
    canvas.width / 2,
    canvas.height / 2,
    (canvas.width / 2) + (index * 2)
  );
  gradient.addColorStop(0, lightenColor(color, 0.18));
  gradient.addColorStop(1, color);
  return gradient;
}

function centerTextPlugin(getText) {
  return {
    id: "centerTextPlugin",
    afterDraw(chart) {
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data || !meta.data.length) {
        return;
      }

      const text = getText();
      const point = meta.data[0];
      const { ctx } = chart;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#2d2319";
      ctx.font = "700 28px Yrsa";
      ctx.fillText(text.title, point.x, point.y - 10);
      ctx.fillStyle = "#7a6754";
      ctx.font = "600 12px Manrope";
      ctx.fillText(trimLabel(text.subtitle, 24), point.x, point.y + 18);
      ctx.restore();
    }
  };
}

function drawChartFallback(canvasId, message) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const width = Math.max(canvas.clientWidth || 0, 320);
  const height = Math.max(canvas.clientHeight || 0, 320);
  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f5ede1";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#776552";
  context.font = "16px Manrope";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(message, canvas.width / 2, canvas.height / 2);
}

function showStartupError(error) {
  const message = error instanceof Error ?error.message : String(error);
  const target = document.querySelector(".page-shell");
  if (!target) {
    return;
  }

  target.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Falha na inicialização</p>
          <h2>O painel encontrou um erro ao abrir</h2>
        </div>
      </div>
      <div class="note-box">
        Verifique a conexão com a internet e recarregue a página. Detalhe técnico: ${escapeHtml(message)}
      </div>
    </section>
  `;
}

async function loadLogoForPdf(bgColor = "#ffffff") {
  const cacheKey = `logo-bg-${bgColor}`;
  if (assetDataUrlCache.has(cacheKey)) return assetDataUrlCache.get(cacheKey);

  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Falha ao carregar logo PNG"));
    el.src = PDF_LOGO_PATH;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 256;
  canvas.height = img.naturalHeight || 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  assetDataUrlCache.set(cacheKey, dataUrl);
  return dataUrl;
}

async function loadAssetAsDataUrl(path) {
  if (assetDataUrlCache.has(path)) {
    return assetDataUrlCache.get(path);
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Falha ao carregar asset: ${path}`);
  }

  const blob = await response.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Falha ao converter asset em base64: ${path}`));
    reader.readAsDataURL(blob);
  });

  assetDataUrlCache.set(path, dataUrl);
  return dataUrl;
}

function normalizeMovementPhotos(photos) {
  if (!Array.isArray(photos)) {
    return [];
  }

  return photos
    .filter((photo) => photo && (
      (typeof photo.url === "string" && photo.url.startsWith("https://")) ||
      (typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:image/"))
    ))
    .map((photo, index) => ({
      id: photo.id || `photo-${index + 1}`,
      name: String(photo.name || `Foto ${index + 1}`),
      caption: String(photo.caption || ""),
      mimeType: String(photo.mimeType || (photo.dataUrl ?getDataUrlMimeType(photo.dataUrl) : "image/jpeg")),
      url: photo.url || null,
      dataUrl: photo.dataUrl || null
    }));
}

function getDataUrlMimeType(dataUrl = "") {
  const match = String(dataUrl).match(/^data:([^;]+);/i);
  return match ?match[1] : "image/jpeg";
}

function getDataUrlImageFormat(dataUrl = "") {
  const mimeType = getDataUrlMimeType(dataUrl).toLowerCase();
  if (mimeType.includes("png")) {
    return "PNG";
  }
  if (mimeType.includes("webp")) {
    return "WEBP";
  }
  return "JPEG";
}

function getMovementPhotoCount(movement) {
  return normalizeMovementPhotos(movement?.photos).length;
}

function formatMovementPhotoCount(movement) {
  const count = getMovementPhotoCount(movement);
  return count ?`${formatInteger(count)} ${count === 1 ?"foto" : "fotos"}` : "-";
}

function getMovementPhotoFlagMarkup(movement) {
  const count = getMovementPhotoCount(movement);
  if (!count) {
    return "";
  }

  return `<span class="photo-flag">${formatInteger(count)} ${count === 1 ?"foto" : "fotos"}</span>`;
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Falha ao ler o arquivo ${file?.name || ""}.`));
    reader.readAsDataURL(file);
  });
}

async function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao preparar a imagem selecionada."));
    image.src = dataUrl;
  });
}

async function normalizePhotoDataUrlForPdf(dataUrl) {
  if (!dataUrl) {
    return null;
  }

  const image = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Falha ao preparar a imagem para o PDF.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.9);
}

async function uploadToCloudinary(blob, fileName) {
  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "painel-pecuario");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary: ${err}`);
  }

  const data = await response.json();
  return data.secure_url;
}

async function fetchPhotoForPdf(photo) {
  if (photo.dataUrl) {
    return await normalizePhotoDataUrlForPdf(photo.dataUrl);
  }
  if (!photo.url) {
    return null;
  }
  try {
    const response = await fetch(photo.url);
    const blob = await response.blob();
    const originalDataUrl = await readFileAsDataUrl(blob);
    return await normalizePhotoDataUrlForPdf(originalDataUrl);
  } catch (error) {
    console.warn("Não foi possível carregar a foto do servidor para o PDF.", error);
    return null;
  }
}

async function createMovementPhotoAttachment(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(originalDataUrl);
  const scale = Math.min(1, MOVEMENT_PHOTO_MAX_DIMENSION / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Falha ao preparar a imagem para o lançamento.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const fileName = file.name || `foto-${Date.now()}.jpg`;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", MOVEMENT_PHOTO_QUALITY));
  const url = await uploadToCloudinary(blob, fileName);

  return {
    id: createMovementId(),
    name: fileName,
    caption: "Anexo do lançamento",
    mimeType: "image/jpeg",
    url
  };
}

function movementMatchesPeriod(movement, year, month) {
  const [movementYear = "", movementMonth = ""] = String(movement.date || "").split("-");
  if (!movementYear || !movementMonth) {
    return false;
  }
  return movementYear === String(year) && (month === "all" || movementMonth === month);
}

function getMovementPhotoEntries(farm, year, month) {
  return farm.movements
    .filter((movement) => movementMatchesPeriod(movement, year, month) && movementTypeSupportsPhotos(movement.type) && getMovementPhotoCount(movement) > 0)
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
    .flatMap((movement) => normalizeMovementPhotos(movement.photos).map((photo, index) => ({
      movement,
      photo,
      sequence: index + 1
    })));
}

function drawPdfMovementPhoto(doc, dataUrl, x, y, maxWidth, maxHeight) {
  try {
    const imageFormat = getDataUrlImageFormat(dataUrl);
    const properties = doc.getImageProperties(dataUrl);
    const ratio = Math.min(maxWidth / properties.width, maxHeight / properties.height);
    const width = properties.width * ratio;
    const height = properties.height * ratio;
    const originX = x + ((maxWidth - width) / 2);
    const originY = y + ((maxHeight - height) / 2);
    doc.addImage(dataUrl, imageFormat, originX, originY, width, height);
  } catch (error) {
    console.warn("Não foi possível incluir uma foto no PDF.", error);
    doc.setDrawColor(219, 209, 191);
    doc.rect(x, y, maxWidth, maxHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(112, 94, 76);
    doc.text("Imagem indisponível", x + (maxWidth / 2), y + (maxHeight / 2), { align: "center" });
    doc.setTextColor(45, 35, 25);
  }
}

function formatInteger(value) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value || 0);
}

function formatMaybeQuantity(value) {
  return Number.isFinite(value) ?formatInteger(value) : "?";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatWeight(value) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value || 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(`${dateString}T00:00:00`);
  if (isNaN(d.getTime())) return String(dateString);
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

function formatMonthYear(period) {
  const [year, month] = String(period || "").split("-");
  const monthIndex = Number(month) - 1;
  if (!year || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return period || "-";
  }

  return `${MONTH_NAMES[monthIndex]}/${year}`;
}

function getCategoryImage(categoryName) {
  const normalized = normalizeText(categoryName);
  if (normalized.includes("touro")) {
    return CATEGORY_VISUALS.touro;
  }
  if (normalized.includes("terneir") || normalized.includes("novilh")) {
    return CATEGORY_VISUALS.terneiro;
  }
  if (normalized.includes("vaca") || normalized.includes("boi")) {
    return CATEGORY_VISUALS.vaca;
  }
  return CATEGORY_VISUALS.rebanho;
}

function getCategoryFamily(categoryName) {
  const normalized = normalizeText(categoryName);
  if (normalized.includes("touro")) {
    return "Reprodutores";
  }
  if (normalized.includes("terneir")) {
    return "Terneiros";
  }
  if (normalized.includes("novilh")) {
    return "Novilhas";
  }
  if (normalized.includes("boi")) {
    return "Abate";
  }
  if (normalized.includes("vaca")) {
    return "Matrizes";
  }
  return "Rebanho";
}

function trimLabel(value, max) {
  return value.length > max ?`${value.slice(0, max - 1)}...` : value;
}

function lightenColor(hexColor, amount) {
  const hex = hexColor.replace("#", "");
  const color = Number.parseInt(hex, 16);
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  const nextR = Math.min(255, Math.round(r + ((255 - r) * amount)));
  const nextG = Math.min(255, Math.round(g + ((255 - g) * amount)));
  const nextB = Math.min(255, Math.round(b + ((255 - b) * amount)));
  return `rgb(${nextR}, ${nextG}, ${nextB})`;
}

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ── Backup / Restore ─────────────────────────────────────────────────────────

function getLastBackupDate() {
  const stored = localStorage.getItem(BACKUP_DATE_KEY);
  return stored ?new Date(stored) : null;
}

function getDaysSinceBackup() {
  const last = getLastBackupDate();
  if (!last) return null;
  return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
}

function markBackupDone() {
  localStorage.setItem(BACKUP_DATE_KEY, new Date().toISOString());
}

function exportBackup() {
  const snapshot = JSON.parse(JSON.stringify(state.data));
  snapshot.auth = {
    ...snapshot.auth,
    sessionUserId: "",
    users: (snapshot.auth.users || []).map((user) => ({
      id: user.id,
      login: user.login,
      role: user.role
    }))
  };

  const payload = {
    sistema: "Painel Pecuário Da Bruna",
    versao: 2,
    dataBackup: new Date().toISOString(),
    dados: snapshot
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const dateTag = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `backup-painel-pecuario-${dateTag}.json`;
  anchor.click();
  URL.revokeObjectURL(url);

  markBackupDone();
  logAuditEvent("Backup", "sistema", `Backup exportado: backup-painel-pecuario-${dateTag}.json`);
  saveData();
  alert(`Backup realizado com sucesso!\nArquivo: backup-painel-pecuario-${dateTag}.json\nGuarde em local seguro (Drive, pen drive, etc).`);
}

async function handleEmergencyRestore(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  try {
    const text = await file.text();
    const payload = JSON.parse(text);

    if (!payload.dados || !payload.dados.farms || !payload.dados.auth) {
      alert("Arquivo inválido. Este não parece ser um backup do Painel Pecuário.");
      return;
    }

    const confirmed = confirm(
      `Backup de ${new Date(payload.dataBackup || Date.now()).toLocaleDateString("pt-BR")} encontrado.\n\n` +
      `Fazendas: ${Object.keys(payload.dados.farms || {}).join(", ")}\n\n` +
      `Restaurar estes dados? Os dados atuais do dispositivo serão substituídos.`
    );
    if (!confirmed) return;

    const restored = ensureDataShape(payload.dados, { preserveSnapshot: true });
    restored.selectedFarmId = TOTAL_FARM_ID;
    restored.auth.sessionUserId = "";

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
    alert("Backup restaurado com sucesso!\n\nAgora faça login com seu usuário. Se o servidor estiver fora, use o acesso de emergência quando solicitado.");
    location.reload();
  } catch (err) {
    alert("Erro ao ler o arquivo de backup: " + (err.message || "arquivo inválido."));
  }
}

async function handleRestoreFile(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  const confirmed = confirm(
    "Restaurar o backup vai substituir TODOS os dados atuais do sistema.\n\nTem certeza que deseja continuar?"
  );
  if (!confirmed) return;

  try {
    const text = await file.text();
    const payload = JSON.parse(text);

    if (!payload.dados || !payload.dados.farms || !payload.dados.auth) {
      alert("Arquivo inválido. Este não parece ser um backup do Painel Pecuário.");
      return;
    }

    const restored = ensureDataShape(payload.dados, { preserveSnapshot: true });
    const currentSessionUserId = state.data.auth.sessionUserId;
    const currentUsers = Array.isArray(state.data.auth.users) ?[...state.data.auth.users] : [];
    restored.selectedFarmId = TOTAL_FARM_ID;
    restored.auth.users = currentUsers;
    restored.auth.sessionUserId = restored.auth.users.some((user) => user.id === currentSessionUserId)
      ?currentSessionUserId
      : "";

    state.data = restored;
    logAuditEvent("Restauração", "sistema", `Backup restaurado${payload.dataBackup ?` de ${new Date(payload.dataBackup).toLocaleString("pt-BR")}` : ""}`);
    saveData();
    markBackupDone();
    renderAuthState();
    initializeAppShell();
    render();
    alert(`Backup restaurado com sucesso!\nData do backup: ${payload.dataBackup ?new Date(payload.dataBackup).toLocaleString("pt-BR") : "desconhecida"}`);
  } catch (error) {
    console.error("Falha ao restaurar backup.", error);
    alert("Não foi possível restaurar o backup. Verifique se o arquivo está correto.");
  }
}

function checkBackupWarning() {
  const days = getDaysSinceBackup();
  const neverDid = days === null;

  if (!neverDid && days < BACKUP_WARN_DAYS) return;

  if (neverDid) {
    elements.backupWarningTitle.textContent = "Nenhum backup realizado";
    elements.backupWarningMessage.textContent =
      "Você ainda não fez nenhum backup dos dados do sistema. Em caso de problema no navegador, todos os registros podem ser perdidos. Faça um backup agora.";
  } else {
    elements.backupWarningTitle.textContent = `Backup há ${days} dias`;
    elements.backupWarningMessage.textContent =
      `O último backup foi realizado há ${days} dias. Recomendamos fazer backup a cada ${BACKUP_WARN_DAYS} dias para proteger seus dados.`;
  }

  elements.backupWarningDialog.showModal();
}

// ─── MÓDULO: REPRODUÇÃO ───────────────────────────────────────────────────────

function getReproductionRecords(farm) {
  return Array.isArray(farm?.reproductionRecords) ?farm.reproductionRecords : [];
}

function withReproductionFarmContext(record, farm) {
  return {
    ...record,
    farmId: farm.id,
    farmName: farm.name
  };
}

function getAllReproductionRecords() {
  return getAllFarms().flatMap((farm) =>
    getReproductionRecords(farm).map((rec) => withReproductionFarmContext(rec, farm))
  );
}

function findReproductionRecordLocation(recordId, preferredFarmId = null) {
  if (!recordId) return null;

  const farms = preferredFarmId && preferredFarmId !== TOTAL_FARM_ID
    ?[state.data.farms[preferredFarmId]].filter(Boolean)
    : getAllFarms();

  for (const farm of farms) {
    const index = getReproductionRecords(farm).findIndex((record) => record.id === recordId);
    if (index >= 0) {
      return { farm, farmId: farm.id, index, record: farm.reproductionRecords[index] };
    }
  }

  if (preferredFarmId && preferredFarmId !== TOTAL_FARM_ID) {
    return findReproductionRecordLocation(recordId, null);
  }

  return null;
}

function getFilteredReproductionRecords() {
  const farmId = state.data.selectedFarmId;
  const year = state.filters.year;
  const month = state.filters.month;

  let records;
  if (farmId === TOTAL_FARM_ID) {
    records = getAllReproductionRecords();
  } else {
    const farm = state.data.farms[farmId];
    records = farm ?getReproductionRecords(farm).map((rec) => withReproductionFarmContext(rec, farm)) : [];
  }

  return records.filter((rec) => {
    const d = rec.date || "";
    if (year !== "all" && !d.startsWith(year)) return false;
    if (month !== "all") {
      const m = d.slice(5, 7);
      if (m !== String(month).padStart(2, "0")) return false;
    }
    return true;
  }).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function calcReproductionStats(records) {
  let totalInseminacoes = 0;
  let totalEntouradas = 0;
  let verifiedInseminacoes = 0;
  let verifiedEntouradas = 0;
  let totalPegou = 0;
  let totalFalhou = 0;

  records.forEach((rec) => {
    const qty = Number(rec.quantity || 0);
    if (rec.type === "inseminacao") {
      totalInseminacoes += qty;
    } else {
      totalEntouradas += qty;
    }
    if (rec.verificationDate && rec.quantityPegou != null) {
      const pegou = Number(rec.quantityPegou || 0);
      const falhou = qty - pegou;
      totalPegou += pegou;
      totalFalhou += Math.max(0, falhou);
      if (rec.type === "inseminacao") verifiedInseminacoes += qty;
      else verifiedEntouradas += qty;
    }
  });

  const totalVerified = verifiedInseminacoes + verifiedEntouradas;
  const taxaSucesso = totalVerified > 0 ?(totalPegou / totalVerified) * 100 : null;

  return { totalInseminacoes, totalEntouradas, totalPegou, totalFalhou, taxaSucesso, totalVerified };
}

// ── Classificação de desempenho reprodutivo ─────────────────────────────
function getRepStatus(taxa) {
  if (taxa == null) return { label: "Sem dados", cls: "rep2-nd" };
  if (taxa >= 75)   return { label: "Excelente", cls: "rep2-ex" };
  if (taxa >= 65)   return { label: "Bom",       cls: "rep2-bom" };
  if (taxa >= 50)   return { label: "Atencao",   cls: "rep2-at" };
  return               { label: "Critico",    cls: "rep2-crit" };
}

function renderReproducaoView() {
  renderRepFarmSwitch();
  renderRepKpiCards();
  renderRepBarChart();
  renderRepDonutChart();
  renderRepFarmRanking();
  renderRepHistoryLineChart();
  renderRepHistoryTable();
}

function renderRepFarmSwitch() {
  if (!elements.repFarmSwitch) return;
  elements.repFarmSwitch.innerHTML = "";
  const items = [{ id: TOTAL_FARM_ID, name: "Todas as fazendas" }, ...getAllFarms()];
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `farm-btn ${item.id === state.data.selectedFarmId ? "active" : ""}`;
    btn.textContent = item.name;
    btn.addEventListener("click", () => {
      state.data.selectedFarmId = item.id;
      runtime.repPage = 0;
      saveData();
      renderReproducaoView();
    });
    elements.repFarmSwitch.appendChild(btn);
  });
}

function renderRepKpiCards() {
  if (!elements.repSummarySection) return;
  const records = getFilteredReproductionRecords();
  const stats   = calcReproductionStats(records);
  const pending = records.filter((r) => !r.verificationDate).length;
  const status  = getRepStatus(stats.taxaSucesso);

  // Melhor e pior fazenda
  const farms = getAllFarms();
  const year  = state.filters.year;
  const month = state.filters.month;
  let bestFarm = null, worstFarm = null, bestTaxa = -1, worstTaxa = 101;
  farms.forEach((f) => {
    let recs = getReproductionRecords(f).filter((r) => {
      const d = r.date || "";
      if (year !== "all" && !d.startsWith(year)) return false;
      if (month !== "all" && d.slice(5,7) !== String(month).padStart(2,"0")) return false;
      return true;
    });
    const s = calcReproductionStats(recs);
    if (s.taxaSucesso != null && s.totalVerified >= 5) {
      if (s.taxaSucesso > bestTaxa)  { bestTaxa = s.taxaSucesso;  bestFarm  = f; }
      if (s.taxaSucesso < worstTaxa) { worstTaxa = s.taxaSucesso; worstFarm = f; }
    }
  });

  const taxaColor = stats.taxaSucesso == null ? "var(--muted)"
    : stats.taxaSucesso >= 65 ? "#1b6e3e"
    : stats.taxaSucesso >= 50 ? "#856404"
    : "#c0392b";

  const icons = {
    insem:   "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%231e40af' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M8 12h8M12 8v8'/%3E%3C/svg%3E",
    entour:  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23854d0e' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 8v8M8 12h8'/%3E%3C/svg%3E",
    prenha:  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%231b6e3e' stroke-width='2'%3E%3Cpath d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/%3E%3C/svg%3E",
    falhada: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23c0392b' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='15' y1='9' x2='9' y2='15'/%3E%3Cline x1='9' y1='9' x2='15' y2='15'/%3E%3C/svg%3E",
    taxa:    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%231b6e3e' stroke-width='2'%3E%3Cpolyline points='22 12 18 12 15 21 9 3 6 12 2 12'/%3E%3C/svg%3E",
    pend:    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23856404' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E%3C/svg%3E",
  };

  const taxaLabel = stats.taxaSucesso != null ? `${stats.taxaSucesso.toFixed(1)}%` : "—";

  elements.repSummarySection.innerHTML = `
    <div class="rep2-kpi-grid">
      <div class="rep2-kpi-card">
        <div class="rep2-kpi-icon-wrap" style="background:#dbeafe">
          <img src="${icons.insem}" width="18" height="18" alt="">
        </div>
        <div class="rep2-kpi-value" style="color:#1e40af">${formatInteger(stats.totalInseminacoes)}</div>
        <div class="rep2-kpi-label">Inseminacoes</div>
        <div class="rep2-kpi-desc">animais inseminados no periodo</div>
        <span class="rep2-kpi-badge rep2-blue">IA</span>
      </div>
      <div class="rep2-kpi-card">
        <div class="rep2-kpi-icon-wrap" style="background:#fef9c3">
          <img src="${icons.entour}" width="18" height="18" alt="">
        </div>
        <div class="rep2-kpi-value" style="color:#854d0e">${formatInteger(stats.totalEntouradas)}</div>
        <div class="rep2-kpi-label">Entouradas</div>
        <div class="rep2-kpi-desc">animais em cobertura com touro</div>
        <span class="rep2-kpi-badge rep2-gold">Monta</span>
      </div>
      <div class="rep2-kpi-card">
        <div class="rep2-kpi-icon-wrap" style="background:#d4edda">
          <img src="${icons.prenha}" width="18" height="18" alt="">
        </div>
        <div class="rep2-kpi-value" style="color:#1b6e3e">${formatInteger(stats.totalPegou)}</div>
        <div class="rep2-kpi-label">Prenhes</div>
        <div class="rep2-kpi-desc">animais confirmados prenhes</div>
        <span class="rep2-kpi-badge rep2-ex">Confirmado</span>
      </div>
      <div class="rep2-kpi-card">
        <div class="rep2-kpi-icon-wrap" style="background:#f8d7da">
          <img src="${icons.falhada}" width="18" height="18" alt="">
        </div>
        <div class="rep2-kpi-value" style="color:#c0392b">${formatInteger(stats.totalFalhou)}</div>
        <div class="rep2-kpi-label">Falhadas</div>
        <div class="rep2-kpi-desc">animais que nao emprenharam</div>
        <span class="rep2-kpi-badge rep2-crit">Nao prenhe</span>
      </div>
      <div class="rep2-kpi-card">
        <div class="rep2-kpi-icon-wrap" style="background:#d4edda">
          <img src="${icons.taxa}" width="18" height="18" alt="">
        </div>
        <div class="rep2-kpi-value" style="color:${taxaColor}">${taxaLabel}</div>
        <div class="rep2-kpi-label">Taxa de Prenhez</div>
        <div class="rep2-kpi-desc">${stats.totalVerified > 0 ? `base: ${formatInteger(stats.totalVerified)} verificados` : "aguardando verificacoes"}</div>
        <span class="rep2-kpi-badge ${status.cls}">${status.label}</span>
      </div>
      <div class="rep2-kpi-card">
        <div class="rep2-kpi-icon-wrap" style="background:#fff3cd">
          <img src="${icons.pend}" width="18" height="18" alt="">
        </div>
        <div class="rep2-kpi-value" style="color:#856404">${formatInteger(pending)}</div>
        <div class="rep2-kpi-label">Aguardando</div>
        <div class="rep2-kpi-desc">eventos sem diagnostico registrado</div>
        <span class="rep2-kpi-badge rep2-pend">Pendente</span>
      </div>
    </div>
  `;
}

function renderRepBarChart() {
  const canvas = document.getElementById("repBarChart");
  if (!canvas) return;
  if (state.charts.repBar) { state.charts.repBar.destroy(); state.charts.repBar = null; }

  const farms = getAllFarms();
  const year  = state.filters.year;
  const month = state.filters.month;

  const farmData = farms.map((farm) => {
    let recs = getReproductionRecords(farm).filter((r) => {
      const d = r.date || "";
      if (year !== "all" && !d.startsWith(year)) return false;
      if (month !== "all" && d.slice(5,7) !== String(month).padStart(2,"0")) return false;
      return true;
    });
    const s = calcReproductionStats(recs);
    return { name: farm.name, stats: s };
  }).filter((f) => f.stats.totalInseminacoes > 0 || f.stats.totalEntouradas > 0);

  if (!farmData.length) {
    canvas.style.display = "none";
    const p = canvas.parentElement.querySelector(".rep2-empty");
    if (!p) {
      const el = document.createElement("div");
      el.className = "rep2-empty";
      el.innerHTML = `<div style="font-size:2rem;opacity:.3;margin-bottom:10px">📊</div><div class="rep2-empty-t">Nenhum evento no periodo</div><div class="rep2-empty-s">Registre eventos reprodutivos para visualizar o grafico.</div>`;
      canvas.parentElement.appendChild(el);
    }
    return;
  }
  canvas.style.display = "";
  canvas.parentElement.querySelector(".rep2-empty")?.remove();

  const labels    = farmData.map((f) => f.name);
  const dataInsem = farmData.map((f) => f.stats.totalInseminacoes);
  const dataEntou = farmData.map((f) => f.stats.totalEntouradas);
  const dataPren  = farmData.map((f) => f.stats.totalPegou);
  const dataFalh  = farmData.map((f) => f.stats.totalFalhou);

  const h = Math.min(480, Math.max(280, labels.length * 60 + 80));
  canvas.style.setProperty("height", `${h}px`, "important");
  canvas.style.setProperty("max-height", `${h}px`, "important");
  canvas.removeAttribute("height");
  canvas.removeAttribute("width");

  const labelPlugin = {
    id: "rep2Label",
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart;
      const insD = data.datasets[0]?.data || [];
      const enD  = data.datasets[1]?.data || [];
      const tots = insD.map((v, i) => (v || 0) + (enD[i] || 0));
      data.datasets.forEach((ds, di) => {
        const meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach((bar, idx) => {
          const val = ds.data[idx];
          const tot = tots[idx];
          if (!val || !tot) return;
          const pct = Math.round((val / tot) * 100);
          const bw  = Math.abs(bar.x - bar.base);
          ctx.save();
          ctx.textBaseline = "middle";
          if (bw >= 50) {
            ctx.textAlign = "right"; ctx.font = `bold 10px Manrope,sans-serif`;
            ctx.fillStyle = "rgba(255,255,255,.92)";
            ctx.fillText(`${val} · ${pct}%`, bar.x - 7, bar.y);
          } else if (bw >= 12) {
            ctx.textAlign = "left"; ctx.font = "bold 9px Manrope,sans-serif";
            ctx.fillStyle = "#333";
            ctx.fillText(`${val}`, bar.x + 5, bar.y);
          }
          ctx.restore();
        });
      });
    }
  };

  state.charts.repBar = new Chart(canvas, {
    type: "bar",
    plugins: [labelPlugin],
    data: {
      labels,
      datasets: [
        { label: "Inseminacoes", data: dataInsem, backgroundColor: "#2563eb", borderRadius: 5, borderSkipped: false, barThickness: 14 },
        { label: "Entouradas",   data: dataEntou, backgroundColor: "#d97706", borderRadius: 5, borderSkipped: false, barThickness: 14 },
        { label: "Prenhas",      data: dataPren,  backgroundColor: "#1b6e3e", borderRadius: 5, borderSkipped: false, barThickness: 14 },
        { label: "Falhadas",     data: dataFalh,  backgroundColor: "#dc2626", borderRadius: 5, borderSkipped: false, barThickness: 14 },
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 100,
      layout: { padding: { right: 6, top: 6, bottom: 6 } },
      plugins: {
        legend: { position: "bottom", labels: { padding: 18, usePointStyle: true, pointStyle: "circle", font: { size: 12 }, color: "#444" } },
        tooltip: {
          backgroundColor: "#111", titleColor: "#fff", bodyColor: "rgba(255,255,255,.82)",
          padding: 12, cornerRadius: 8, boxPadding: 4,
          callbacks: {
            label: (ctx) => {
              const ins = dataInsem[ctx.dataIndex] || 0;
              const ent = dataEntou[ctx.dataIndex] || 0;
              const tot = ins + ent;
              const pct = tot > 0 ? ` (${Math.round((ctx.parsed.x / tot) * 100)}%)` : "";
              return ` ${ctx.dataset.label}: ${ctx.parsed.x}${pct}`;
            },
            afterBody: (items) => {
              const i = items[0]?.dataIndex;
              const s = farmData[i]?.stats;
              if (!s || !s.totalVerified) return [];
              return [`  Taxa prenhez: ${s.taxaSucesso?.toFixed(1)}%`];
            }
          }
        }
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0, color: "#aaa", font: { size: 10 } }, grid: { color: "rgba(0,0,0,.05)" }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false }, ticks: { color: "#222", font: { size: 12, weight: "600" }, padding: 8 } }
      }
    }
  });
}

function renderRepDonutChart() {
  const canvas    = document.getElementById("repDonutChart");
  const legendEl  = document.getElementById("repDonutLegend");
  const centerEl  = document.getElementById("repDonutCenter");
  if (!canvas || !legendEl) return;
  if (state.charts.repDonut) { state.charts.repDonut.destroy(); state.charts.repDonut = null; }

  const records = getFilteredReproductionRecords();
  const stats   = calcReproductionStats(records);

  if (!stats.totalVerified) {
    if (centerEl) centerEl.innerHTML = `<span class="rep2-donut-cvalue" style="font-size:1.1rem;color:var(--muted)">—</span><span class="rep2-donut-clabel">sem dados</span>`;
    legendEl.innerHTML = `<p style="text-align:center;color:var(--muted);font-size:13px;padding:8px 0">Nenhum resultado verificado ainda.</p>`;
    return;
  }

  const taxaStr = stats.taxaSucesso != null ? `${stats.taxaSucesso.toFixed(1)}%` : "—";
  const st      = getRepStatus(stats.taxaSucesso);

  if (centerEl) {
    centerEl.innerHTML = `
      <span class="rep2-donut-cvalue">${taxaStr}</span>
      <span class="rep2-donut-clabel">Prenhez</span>
    `;
  }

  state.charts.repDonut = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Prenhas", "Falhadas"],
      datasets: [{ data: [stats.totalPegou, stats.totalFalhou], backgroundColor: ["#1b6e3e", "#dc2626"], hoverBackgroundColor: ["#22863a","#e74c3c"], borderWidth: 3, borderColor: "#fff", hoverOffset: 8 }]
    },
    options: {
      responsive: true, cutout: "74%",
      animation: { animateRotate: true, animateScale: true },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#111", titleColor: "#fff", bodyColor: "rgba(255,255,255,.82)", padding: 12, cornerRadius: 8,
          callbacks: { label: (ctx) => { const pct = stats.totalVerified > 0 ? ((ctx.parsed / stats.totalVerified) * 100).toFixed(1) : 0; return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`; } }
        }
      }
    }
  });

  const falhosPct = stats.totalVerified > 0 ? ((stats.totalFalhou / stats.totalVerified) * 100).toFixed(1) : "0.0";
  legendEl.innerHTML = `
    <div class="rep2-donut-row"><div class="rep2-donut-dot" style="background:#1b6e3e"></div><span>Prenhas: <strong>${formatInteger(stats.totalPegou)}</strong></span></div>
    <div class="rep2-donut-row"><div class="rep2-donut-dot" style="background:#dc2626"></div><span>Falhadas: <strong>${formatInteger(stats.totalFalhou)}</strong> (${falhosPct}%)</span></div>
    <div class="rep2-donut-row"><div class="rep2-donut-dot" style="background:#6b7280"></div><span>Verificados: <strong>${formatInteger(stats.totalVerified)}</strong> animais</span></div>
    <span class="rep2-donut-status ${st.cls}">${st.label}</span>
  `;
}

function renderRepFarmRanking() {
  const card = document.getElementById("repRankingCard");
  if (!card) return;

  const farms = getAllFarms();
  const year  = state.filters.year;
  const month = state.filters.month;

  const ranked = farms.map((f) => {
    let recs = getReproductionRecords(f).filter((r) => {
      const d = r.date || "";
      if (year !== "all" && !d.startsWith(year)) return false;
      if (month !== "all" && d.slice(5,7) !== String(month).padStart(2,"0")) return false;
      return true;
    });
    const s = calcReproductionStats(recs);
    return { name: f.name, stats: s, totalEvents: s.totalInseminacoes + s.totalEntouradas };
  }).sort((a, b) => {
    if (a.stats.taxaSucesso == null && b.stats.taxaSucesso == null) return 0;
    if (a.stats.taxaSucesso == null) return 1;
    if (b.stats.taxaSucesso == null) return -1;
    return b.stats.taxaSucesso - a.stats.taxaSucesso;
  });

  const posClasses = ["p1","p2","p3","pg","pg"];

  const rows = ranked.map((f, i) => {
    const st       = getRepStatus(f.stats.taxaSucesso);
    const taxaStr  = f.stats.taxaSucesso != null ? `${f.stats.taxaSucesso.toFixed(1)}%` : "—";
    const posClass = posClasses[i] || "pg";
    return `
      <div class="rep2-ri">
        <div class="rep2-ri-pos ${posClass}">${i + 1}</div>
        <div class="rep2-ri-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>
        <div class="rep2-ri-taxa">${taxaStr}</div>
        <span class="rep2-ri-badge ${st.cls}">${st.label}</span>
      </div>
    `;
  }).join("");

  card.innerHTML = `
    <div class="rep2-card-hd" style="margin-bottom:14px">
      <h3>Ranking das Fazendas</h3>
      <p>Ordenado por taxa de prenhez no periodo</p>
    </div>
    <div class="rep2-ranking-list">${rows || '<p class="rep2-empty-s" style="text-align:center;padding:20px 0">Nenhum dado disponivel.</p>'}</div>
  `;
}

function renderRepHistoryLineChart() {
  const canvas = document.getElementById("repHistoryChart");
  if (!canvas) return;
  if (state.charts.repHistory) { state.charts.repHistory.destroy(); state.charts.repHistory = null; }

  const farms = getAllFarms();
  const selectedId  = state.data.selectedFarmId;
  const farmsToShow = selectedId === TOTAL_FARM_ID ? farms : farms.filter((f) => f.id === selectedId);

  // Detecta o mês do primeiro evento registrado para não mostrar meses vazios no início.
  // Exibe de firstEventMonth até hoje (máximo 12 meses).
  const now = new Date();
  let firstDate = null;
  farmsToShow.forEach((f) => {
    (f.reproductionRecords || []).forEach((r) => {
      if (r.date && (!firstDate || r.date < firstDate)) firstDate = r.date;
    });
  });

  // Se tiver primeiro evento, começa de lá. Se não, usa 6 meses atrás.
  const startDate = firstDate
    ? new Date(firstDate.slice(0, 7) + "-01")
    : new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Garante no máximo 12 meses
  const minStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const effectiveStart = startDate < minStart ? minStart : startDate;

  const months = [];
  let cursor = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), 1);
  while (cursor <= now) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const lbl = cursor.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
    months.push({ key, lbl, insem: 0, entou: 0, pren: 0, falh: 0, verif: 0 });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  farmsToShow.forEach((f) => {
    (f.reproductionRecords || []).forEach((r) => {
      const key = (r.date || "").slice(0, 7);
      const bucket = months.find((m) => m.key === key);
      if (!bucket) return;
      if (r.type === "inseminacao") bucket.insem += (r.quantity || 0);
      else bucket.entou += (r.quantity || 0);
      if (r.verificationDate && r.quantityPegou != null) {
        bucket.pren  += r.quantityPegou;
        bucket.falh  += Math.max(0, (r.quantity || 0) - r.quantityPegou);
        bucket.verif += (r.quantity || 0);
      }
    });
  });

  const hasData = months.some((m) => m.insem > 0 || m.entou > 0);
  if (!hasData) {
    canvas.style.display = "none";
    const p = canvas.parentElement.querySelector(".rep2-empty");
    if (!p) {
      const el = document.createElement("div");
      el.className = "rep2-empty";
      el.innerHTML = `<div style="font-size:2rem;opacity:.3;margin-bottom:10px">📈</div><div class="rep2-empty-t">Sem historico disponivel</div><div class="rep2-empty-s">Registros apareceram aqui conforme os eventos forem lancados.</div>`;
      canvas.parentElement.appendChild(el);
    }
    return;
  }
  canvas.style.display = "";
  canvas.parentElement.querySelector(".rep2-empty")?.remove();

  canvas.style.setProperty("height", "220px", "important");
  canvas.style.setProperty("max-height", "220px", "important");
  canvas.removeAttribute("height");
  canvas.removeAttribute("width");

  state.charts.repHistory = new Chart(canvas, {
    type: "line",
    data: {
      labels: months.map((m) => m.lbl),
      datasets: [
        { label: "Inseminacoes", data: months.map((m) => m.insem), borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,.08)", tension: 0.35, fill: true, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2 },
        { label: "Entouradas",   data: months.map((m) => m.entou), borderColor: "#d97706", backgroundColor: "rgba(217,119,6,.08)", tension: 0.35, fill: true, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2 },
        { label: "Prenhas",      data: months.map((m) => m.pren),  borderColor: "#1b6e3e", backgroundColor: "rgba(27,110,62,.10)", tension: 0.35, fill: true, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2 },
        { label: "Falhadas",     data: months.map((m) => m.falh),  borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,.06)", tension: 0.35, fill: false, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2, borderDash: [4,3] },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, resizeDelay: 100,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom", labels: { padding: 16, usePointStyle: true, pointStyle: "circle", font: { size: 11 }, color: "#444" } },
        tooltip: {
          backgroundColor: "#111", titleColor: "#fff", bodyColor: "rgba(255,255,255,.82)", padding: 12, cornerRadius: 8,
          callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}` }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: "#aaa", font: { size: 10 } } },
        y: { beginAtZero: true, ticks: { precision: 0, color: "#aaa", font: { size: 10 } }, grid: { color: "rgba(0,0,0,.05)" }, border: { display: false } }
      }
    }
  });
}

const REP_PAGE_SIZE = 50;

function renderRepHistoryTable() {
  if (!elements.repTableBody) return;

  const searchEl = elements.repHistorySearch;
  const search   = (searchEl?.value || "").toLowerCase().trim();
  let records    = getFilteredReproductionRecords();

  if (search) {
    records = records.filter((rec) => {
      const farmName  = (rec.farmName || rec.farmId || "").toLowerCase();
      const code      = (rec.code || "").toLowerCase();
      const category  = (rec.categoryName || rec.categoryId || "").toLowerCase();
      const notes     = (rec.notes || "").toLowerCase();
      const typeLabel = rec.type === "inseminacao" ? "inseminacao" : "entourada";
      return [farmName, code, category, notes, typeLabel].some((s) => s.includes(search));
    });
  }

  // Atualiza contador
  const countEl = document.getElementById("repTableCountLabel");
  if (countEl) countEl.textContent = `${records.length} registro${records.length !== 1 ? "s" : ""} encontrado${records.length !== 1 ? "s" : ""}`;

  const total      = records.length;
  const totalPages = Math.max(1, Math.ceil(total / REP_PAGE_SIZE));
  const page       = Math.min(Math.max(0, runtime.repPage || 0), totalPages - 1);
  runtime.repPage  = page;
  const start      = page * REP_PAGE_SIZE;
  const pageRecs   = records.slice(start, start + REP_PAGE_SIZE);

  elements.repTableBody.innerHTML = pageRecs.map((rec) => {
    const farmId   = rec.farmId || state.data.selectedFarmId;
    const qty      = Number(rec.quantity || 0);
    const pegou    = rec.quantityPegou != null ? formatInteger(rec.quantityPegou) : "—";
    const falhou   = rec.verificationDate && rec.quantityPegou != null ? formatInteger(Math.max(0, qty - Number(rec.quantityPegou))) : "—";
    const taxaN    = rec.verificationDate && rec.quantityPegou != null && qty > 0 ? (Number(rec.quantityPegou) / qty) : null;
    const taxaStr  = taxaN != null ? `${(taxaN * 100).toFixed(1)}%` : "—";
    const taxaCls  = taxaN == null ? "" : taxaN >= 0.65 ? "rep2-taxa-ok" : "rep2-taxa-low";

    const verifCell = rec.verificationDate
      ? `<div class="rep2-verif-cell">
           <span class="rep2-verif-date">${formatDate(rec.verificationDate)}</span>
           <span class="rep2-taxa-v ${taxaCls}">${taxaStr !== "—" ? taxaStr + " prenhez" : ""}</span>
         </div>`
      : `<span class="rep2-badge-pend">Aguardando</span>`;

    const typeTag = rec.type === "inseminacao"
      ? `<span class="rep2-tag rep2-t-insem">IA</span>`
      : `<span class="rep2-tag rep2-t-entour">Monta</span>`;

    const registrarBtn = !rec.verificationDate
      ? `<button type="button" class="rep2-ab rep2-ab-reg" data-rep-verif-id="${escapeHtml(rec.id)}" data-farm-id="${escapeHtml(farmId)}" title="Registrar resultado">Registrar</button>`
      : "";

    const pegouCell  = rec.quantityPegou != null ? `<strong class="rep2-n-ok">${pegou}</strong>` : "—";
    const falhouCell = rec.verificationDate && rec.quantityPegou != null ? `<strong class="rep2-n-fail">${falhou}</strong>` : "—";

    return `
      <tr class="${rec.verificationDate ? "r-done" : "r-pend"}">
        <td><span class="rep2-code">${escapeHtml(rec.code || "—")}</span></td>
        <td>${escapeHtml(rec.farmName || farmId)}</td>
        <td>${typeTag}</td>
        <td>${formatDate(rec.date)}</td>
        <td><strong>${escapeHtml(rec.categoryName || rec.categoryId || "—")}</strong></td>
        <td class="rep2-td-r">${formatInteger(qty)}</td>
        <td>${verifCell}</td>
        <td class="rep2-td-r">${pegouCell}</td>
        <td class="rep2-td-r">${falhouCell}</td>
        <td class="rep2-td-r"><span class="rep2-taxa-v ${taxaCls}">${taxaStr}</span></td>
        <td title="${escapeHtml(rec.notes || "")}" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml((rec.notes || "").slice(0, 28) + (rec.notes?.length > 28 ? "…" : ""))}</td>
        <td>
          <div class="rep2-acts">
            <button type="button" class="rep2-ab rep2-ab-edit" data-rep-edit-id="${escapeHtml(rec.id)}" data-farm-id="${escapeHtml(farmId)}">Editar</button>
            ${registrarBtn}
            <button type="button" class="rep2-ab rep2-ab-del" data-rep-del-id="${escapeHtml(rec.id)}" data-farm-id="${escapeHtml(farmId)}">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  if (!pageRecs.length) {
    elements.repTableBody.innerHTML = `
      <tr><td colspan="12">
        <div class="rep2-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          <div class="rep2-empty-t">${search ? "Nenhum registro encontrado" : "Nenhum evento cadastrado"}</div>
          <div class="rep2-empty-s">${search ? "Tente outros termos de busca." : "Use o botao + Novo Evento Reprodutivo para comecar."}</div>
        </div>
      </td></tr>
    `;
  }

  renderRepPagination(total, page);

  elements.repTableBody.querySelectorAll("[data-rep-edit-id]").forEach((btn) => {
    btn.addEventListener("click", () => openRepDialog(btn.dataset.repEditId, btn.dataset.farmId));
  });
  elements.repTableBody.querySelectorAll("[data-rep-del-id]").forEach((btn) => {
    btn.addEventListener("click", () => deleteRepRecordFixed(btn.dataset.repDelId, btn.dataset.farmId));
  });
  elements.repTableBody.querySelectorAll("[data-rep-verif-id]").forEach((btn) => {
    btn.addEventListener("click", () => openRepVerifDialogFixed(btn.dataset.repVerifId, btn.dataset.farmId));
  });
}

function renderRepPagination(total, page) {
  if (!elements.repHistoryPagination) return;
  const totalPages = Math.ceil(total / REP_PAGE_SIZE);
  if (totalPages <= 1) {
    elements.repHistoryPagination.innerHTML = total > 0 ? `<span class="pagination-info">${total} registro${total !== 1 ? "s" : ""}</span>` : "";
    return;
  }
  elements.repHistoryPagination.innerHTML = `
    <span class="pagination-info">${total} registros</span>
    <button type="button" class="ghost-btn" id="repPagePrev" ${page === 0 ? "disabled" : ""}>&larr; Anterior</button>
    <span class="pagination-info">Pagina ${page + 1} de ${totalPages}</span>
    <button type="button" class="ghost-btn" id="repPageNext" ${page >= totalPages - 1 ? "disabled" : ""}>Proxima &rarr;</button>
  `;
  document.getElementById("repPagePrev")?.addEventListener("click", () => { runtime.repPage = Math.max(0, (runtime.repPage || 0) - 1); renderRepHistoryTable(); });
  document.getElementById("repPageNext")?.addEventListener("click", () => { runtime.repPage = Math.min(totalPages - 1, (runtime.repPage || 0) + 1); renderRepHistoryTable(); });
}
function openRepDialog(editingId = null, editingFarmId = null) {
  const dlg = elements.reproducaoDlg;
  if (!dlg) return;

  const titleEl = document.getElementById("repDlgTitle");
  const idEl = document.getElementById("repEditingId");
  const farmEl = document.getElementById("repFarm");
  const typeEl = document.getElementById("repType");
  const dateEl = document.getElementById("repDate");
  const catEl = document.getElementById("repCategory");
  const qtyEl = document.getElementById("repQuantity");
  const bullEl = document.getElementById("repBullInfo");
  const techEl = document.getElementById("repTechInfo");
  const notesEl = document.getElementById("repNotes");

  // Populate farm selector
  const farms = getAllFarms();
  farmEl.innerHTML = farms.map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)}</option>`).join("");

  if (editingId) {
    const location = findReproductionRecordLocation(editingId, editingFarmId || state.data.selectedFarmId);
    if (!location) return;
    const { farmId, rec } = { farmId: location.farmId, rec: location.record };
    titleEl.textContent = "Editar Evento Reprodutivo";
    idEl.value = rec.id;
    idEl.dataset.farmId = farmId;
    farmEl.value = farmId;
    typeEl.value = rec.type;
    dateEl.value = rec.date || "";
    qtyEl.value = rec.quantity || "";
    bullEl.value = rec.bullInfo || "";
    techEl.value = rec.techInfo || "";
    notesEl.value = rec.notes || "";
    syncRepFarmFields();
    setTimeout(() => {
      catEl.value = rec.categoryId || "";
    }, 0);
  } else {
    titleEl.textContent = "Novo Evento Reprodutivo";
    idEl.value = "";
    delete idEl.dataset.farmId;
    const currentFarmId = state.data.selectedFarmId !== TOTAL_FARM_ID ?state.data.selectedFarmId : farms[0]?.id || "";
    farmEl.value = currentFarmId;
    typeEl.value = "inseminacao";
    dateEl.value = new Date().toISOString().slice(0, 10);
    qtyEl.value = "";
    bullEl.value = "";
    techEl.value = "";
    notesEl.value = "";
    syncRepFarmFields();
  }

  syncRepTypeFields();
  syncRepStockHint();
  dlg.showModal();
}

function syncRepFarmFields() {
  const farmEl = document.getElementById("repFarm");
  const catEl = document.getElementById("repCategory");
  if (!farmEl || !catEl) return;

  const farm = state.data.farms[farmEl.value];
  if (!farm) return;

  catEl.innerHTML = farm.categories.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("");
  syncRepStockHint();
}

function syncRepStockHint() {
  const hintEl = document.getElementById("repStockHint");
  const farmEl = document.getElementById("repFarm");
  const catEl  = document.getElementById("repCategory");
  if (!hintEl || !farmEl) return;

  const farm = state.data.farms[farmEl.value];
  if (!farm) { hintEl.hidden = true; return; }

  const farmTotal = getFarmTotal(farm);
  const catId = catEl?.value;
  const catObj = farm.categories.find((c) => c.id === catId);
  const catTotal = catObj ? catObj.quantity : null;
  const catName  = catObj ? catObj.name : "";

  hintEl.hidden = false;
  hintEl.innerHTML = `
    <div class="rep-stock-hint">
      <div class="rep-stock-item">
        <span class="rep-stock-label">Total na fazenda</span>
        <strong class="rep-stock-value">${formatInteger(farmTotal)} animais</strong>
      </div>
      ${catTotal !== null ? `
      <div class="rep-stock-item rep-stock-item-cat">
        <span class="rep-stock-label">${escapeHtml(catName)}</span>
        <strong class="rep-stock-value rep-stock-cat">${formatInteger(catTotal)} animais</strong>
      </div>` : ""}
    </div>
  `;
}

function syncRepTypeFields() {
  const typeEl = document.getElementById("repType");
  const bullWrap = document.getElementById("repBullInfoWrap");
  const techWrap = document.getElementById("repTechInfoWrap");
  if (!typeEl || !bullWrap || !techWrap) return;
  const isEntourada = typeEl.value === "entourada";
  bullWrap.hidden = !isEntourada;
  techWrap.hidden = isEntourada;
}

function handleRepFormSubmit() {
  const farmEl = document.getElementById("repFarm");
  const typeEl = document.getElementById("repType");
  const dateEl = document.getElementById("repDate");
  const catEl = document.getElementById("repCategory");
  const qtyEl = document.getElementById("repQuantity");
  const bullEl = document.getElementById("repBullInfo");
  const techEl = document.getElementById("repTechInfo");
  const notesEl = document.getElementById("repNotes");
  const idEl = document.getElementById("repEditingId");

  const farmId = farmEl?.value;
  const type = typeEl?.value;
  const date = dateEl?.value;
  const qty = Number(qtyEl?.value || 0);

  if (!farmId || !type || !date || qty < 1) {
    alert("Preencha todos os campos obrigatórios (fazenda, tipo, data e quantidade).");
    return;
  }

  const farm = state.data.farms[farmId];
  if (!farm) return;

  const catId = catEl?.value || "";
  const catName = farm.categories.find((c) => c.id === catId)?.name || catId;
  const editId = idEl?.value;

  if (editId) {
    const recIdx = farm.reproductionRecords.findIndex((r) => r.id === editId);
    if (recIdx >= 0) {
      farm.reproductionRecords[recIdx] = {
        ...farm.reproductionRecords[recIdx],
        type,
        date,
        categoryId: catId,
        categoryName: catName,
        quantity: qty,
        bullInfo: bullEl?.value || "",
        techInfo: techEl?.value || "",
        notes: notesEl?.value || ""
      };
      logAuditEvent("Reprodução editada", farmId, `${farm.reproductionRecords[recIdx].code} — ${type} em ${date}`);
    }
  } else {
    const newRec = {
      id: createMovementId(),
      code: generateReproductionCode(farm),
      farmId,
      type,
      date,
      categoryId: catId,
      categoryName: catName,
      quantity: qty,
      bullInfo: bullEl?.value || "",
      techInfo: techEl?.value || "",
      verificationDate: null,
      quantityPegou: null,
      verificationNotes: "",
      notes: notesEl?.value || "",
      createdAt: new Date().toISOString()
    };
    farm.reproductionRecords.push(newRec);
    logAuditEvent("Reprodução registrada", farmId, `${newRec.code} — ${type} em ${date} (${qty} animais)`);
  }

  saveData();
  elements.reproducaoDlg.close();
  if (state.activeView === "reproducao") renderReproducaoView();
}

function handleRepFormSubmitFixed() {
  const farmEl = document.getElementById("repFarm");
  const typeEl = document.getElementById("repType");
  const dateEl = document.getElementById("repDate");
  const catEl = document.getElementById("repCategory");
  const qtyEl = document.getElementById("repQuantity");
  const bullEl = document.getElementById("repBullInfo");
  const techEl = document.getElementById("repTechInfo");
  const notesEl = document.getElementById("repNotes");
  const idEl = document.getElementById("repEditingId");

  const farmId = farmEl?.value;
  const type = typeEl?.value;
  const date = dateEl?.value;
  const qty = Number(qtyEl?.value || 0);

  if (!farmId || !type || !date || qty < 1) {
    alert("Preencha todos os campos obrigatorios (fazenda, tipo, data e quantidade).");
    return;
  }

  const farm = state.data.farms[farmId];
  if (!farm) return;
  if (!Array.isArray(farm.reproductionRecords)) farm.reproductionRecords = [];

  const catId = catEl?.value || "";
  const catName = farm.categories.find((c) => c.id === catId)?.name || catId;
  const editId = idEl?.value;

  if (editId) {
    const existing = findReproductionRecordLocation(editId, idEl?.dataset.farmId || farmId);
    if (!existing) return;
    const updatedRecord = {
      ...existing.record,
      farmId,
      type,
      date,
      categoryId: catId,
      categoryName: catName,
      quantity: qty,
      bullInfo: bullEl?.value || "",
      techInfo: techEl?.value || "",
      notes: notesEl?.value || ""
    };

    if (existing.farmId !== farmId) {
      existing.farm.reproductionRecords.splice(existing.index, 1);
      farm.reproductionRecords.push(updatedRecord);
    } else {
      farm.reproductionRecords[existing.index] = updatedRecord;
    }
    logAuditEvent("Reproducao editada", farmId, `${updatedRecord.code} - ${type} em ${date}`);
  } else {
    const newRec = {
      id: createMovementId(),
      code: generateReproductionCode(farm),
      farmId,
      type,
      date,
      categoryId: catId,
      categoryName: catName,
      quantity: qty,
      bullInfo: bullEl?.value || "",
      techInfo: techEl?.value || "",
      verificationDate: null,
      quantityPegou: null,
      verificationNotes: "",
      notes: notesEl?.value || "",
      createdAt: new Date().toISOString()
    };
    farm.reproductionRecords.push(newRec);
    logAuditEvent("Reproducao registrada", farmId, `${newRec.code} - ${type} em ${date} (${qty} animais)`);
  }

  saveData();
  elements.reproducaoDlg.close();
  if (state.activeView === "reproducao") renderReproducaoView();
}

function deleteRepRecordFixed(id, farmId) {
  const location = findReproductionRecordLocation(id, farmId);
  if (!location) return;

  const { farm, record: rec } = location;
  if (!confirm(`Excluir o registro ${rec.code || id}?\n\nEsta acao nao pode ser desfeita.`)) return;

  farm.reproductionRecords.splice(location.index, 1);
  logAuditEvent("Reproducao excluida", location.farmId, `${rec.code || id} - ${rec.type || ""} em ${rec.date || ""}`);
  saveData();
  renderReproducaoView();
}

function deleteRepRecord(id, farmId) {
  const farm = farmId !== TOTAL_FARM_ID ?state.data.farms[farmId] : null;
  if (!farm) return;
  const rec = getReproductionRecords(farm).find((r) => r.id === id);
  if (!rec) return;
  if (!confirm(`Excluir o registro ${rec.code}?\n\nEsta ação não pode ser desfeita.`)) return;
  farm.reproductionRecords = farm.reproductionRecords.filter((r) => r.id !== id);
  logAuditEvent("Reprodução excluída", farmId, `${rec.code} — ${rec.type} em ${rec.date}`);
  saveData();
  renderReproducaoView();
}

function openRepVerifDialogFixed(recordId, farmId) {
  const dlg = elements.repVerifDlg;
  if (!dlg) return;

  const location = findReproductionRecordLocation(recordId, farmId);
  if (!location) return;

  const { farm, record: rec } = location;
  document.getElementById("repVerifId").value = recordId;
  document.getElementById("repVerifId").dataset.farmId = location.farmId;
  document.getElementById("repVerifDate").value = rec.verificationDate || new Date().toISOString().slice(0, 10);
  document.getElementById("repVerifPegou").value = rec.quantityPegou != null ?rec.quantityPegou : "";
  document.getElementById("repVerifNotes").value = rec.verificationNotes || "";
  document.getElementById("repVerifFeedback").hidden = true;

  const typeLabel = rec.type === "inseminacao" ?"Inseminacao" : "Entourada";
  document.getElementById("repVerifInfo").innerHTML = `
    <div class="rep-verif-info-box">
      <span class="rep-tag ${rec.type === "inseminacao" ?"rep-tag-insem" : "rep-tag-entour"}">${typeLabel}</span>
      <span><strong>Fazenda:</strong> ${escapeHtml(farm.name)}</span>
      <span><strong>Data do evento:</strong> ${formatDate(rec.date)}</span>
      <span><strong>Categoria:</strong> ${escapeHtml(rec.categoryName || rec.categoryId)}</span>
      <span><strong>Potreiro:</strong> ${escapeHtml(rec.potreiro || "—")}</span>
      <span><strong>Total no evento:</strong> ${formatInteger(Number(rec.quantity || 0))} animais</span>
    </div>
  `;

  updateRepVerifFalhou();
  dlg.showModal();
}

function openRepVerifDialog(recordId, farmId) {
  const dlg = elements.repVerifDlg;
  if (!dlg) return;

  const farm = farmId !== TOTAL_FARM_ID ?state.data.farms[farmId] : null;
  const rec = farm ?getReproductionRecords(farm).find((r) => r.id === recordId) : null;
  if (!rec || !farm) return;

  document.getElementById("repVerifId").value = recordId;
  document.getElementById("repVerifId").dataset.farmId = farmId;
  document.getElementById("repVerifDate").value = rec.verificationDate || new Date().toISOString().slice(0, 10);
  document.getElementById("repVerifPegou").value = rec.quantityPegou != null ?rec.quantityPegou : "";
  document.getElementById("repVerifNotes").value = rec.verificationNotes || "";
  document.getElementById("repVerifFeedback").hidden = true;

  const typeLabel = rec.type === "inseminacao" ?"Inseminação" : "Entourada";
  document.getElementById("repVerifInfo").innerHTML = `
    <div class="rep-verif-info-box">
      <span class="rep-tag ${rec.type === "inseminacao" ?"rep-tag-insem" : "rep-tag-entour"}">${typeLabel}</span>
      <span><strong>Fazenda:</strong> ${escapeHtml(farm.name)}</span>
      <span><strong>Data do evento:</strong> ${formatDate(rec.date)}</span>
      <span><strong>Categoria:</strong> ${escapeHtml(rec.categoryName || rec.categoryId)}</span>
      <span><strong>Potreiro:</strong> ${escapeHtml(rec.potreiro || "—")}</span>
      <span><strong>Total no evento:</strong> ${formatInteger(Number(rec.quantity || 0))} animais</span>
    </div>
  `;

  updateRepVerifFalhou();
  dlg.showModal();
}

function updateRepVerifFalhou() {
  const verifId = document.getElementById("repVerifId");
  const pegouEl = document.getElementById("repVerifPegou");
  const falhouEl = document.getElementById("repVerifFalhou");
  if (!verifId || !pegouEl || !falhouEl) return;

  const farmId = verifId.dataset.farmId;
  const farm = farmId ?state.data.farms[farmId] : null;
  const rec = farm ?getReproductionRecords(farm).find((r) => r.id === verifId.value) : null;
  if (!rec) return;

  const qty = Number(rec.quantity || 0);
  const pegou = Number(pegouEl.value || 0);
  falhouEl.value = Math.max(0, qty - pegou);
}

function handleRepVerifSubmit() {
  const verifIdEl = document.getElementById("repVerifId");
  const dateEl = document.getElementById("repVerifDate");
  const pegouEl = document.getElementById("repVerifPegou");
  const notesEl = document.getElementById("repVerifNotes");
  const feedbackEl = document.getElementById("repVerifFeedback");

  const recordId = verifIdEl?.value;
  const farmId = verifIdEl?.dataset.farmId;
  const date = dateEl?.value;
  const pegou = Number(pegouEl?.value ?? "");

  if (!date || isNaN(pegou) || pegou < 0) {
    if (feedbackEl) { feedbackEl.textContent = "Preencha a data e a quantidade de animais prenhas."; feedbackEl.hidden = false; }
    return;
  }

  const farm = farmId ?state.data.farms[farmId] : null;
  const recIdx = farm ?farm.reproductionRecords.findIndex((r) => r.id === recordId) : -1;
  if (recIdx < 0) return;

  const qty = Number(farm.reproductionRecords[recIdx].quantity || 0);
  if (pegou > qty) {
    if (feedbackEl) { feedbackEl.textContent = `Qtd. que pegou (${pegou}) não pode exceder o total do evento (${qty}).`; feedbackEl.hidden = false; }
    return;
  }

  farm.reproductionRecords[recIdx].verificationDate = date;
  farm.reproductionRecords[recIdx].quantityPegou = pegou;
  farm.reproductionRecords[recIdx].verificationNotes = notesEl?.value || "";

  const rec = farm.reproductionRecords[recIdx];
  logAuditEvent("Verificação reprodutiva", farmId, `${rec.code} — ${pegou} prenhes de ${qty} (${((pegou / qty) * 100).toFixed(1)}%)`);

  saveData();
  elements.repVerifDlg.close();
  if (state.activeView === "reproducao") renderReproducaoView();
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPRAS VIEW
// ─────────────────────────────────────────────────────────────────────────────

const COMPRAS_PAGE_SIZE = 50;

const COMMERCIAL_CHART_THEME = {
  compra: {
    name: "Compras",
    headLabel: "Cabeças adquiridas",
    valueLabel: "Valor total",
    emptyFarm: "Nenhuma compra registrada no período selecionado.",
    emptyEvolution: "Nenhuma compra registrada no ano selecionado.",
    primary: "#2f6b4a",
    primarySoft: "rgba(47, 107, 74, 0.54)",
    primaryBest: "#1f5a39",
    accent: "#b89242",
    accentSoft: "rgba(184, 146, 66, 0.09)",
  },
  venda: {
    name: "Vendas",
    headLabel: "Cabeças vendidas",
    valueLabel: "Receita total",
    emptyFarm: "Nenhuma venda registrada no período selecionado.",
    emptyEvolution: "Nenhuma venda registrada no ano selecionado.",
    primary: "#8f3438",
    primarySoft: "rgba(143, 52, 56, 0.52)",
    primaryBest: "#6f252a",
    accent: "#bf9844",
    accentSoft: "rgba(191, 152, 68, 0.09)",
  },
};

const commercialValueFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const commercialFullValueFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCommercialMoney(value, compact = false, currency = "BRL") {
  const num = Number(value || 0);
  if (!num) return "—";
  if (currency === "USD") {
    const fmt = new Intl.NumberFormat("pt-BR", compact
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return "US$ " + fmt.format(num);
  }
  return compact ? commercialValueFmt.format(num) : commercialFullValueFmt.format(num);
}

function getCommercialCurrencyFromMovs(movs) {
  if (!movs.length) return "BRL";
  const currencies = new Set(movs.map((m) => m.currency || getFarmCurrency(m._farmId)));
  return currencies.size === 1 ? [...currencies][0] : "BRL";
}

function getCommercialTableFilters(type) {
  const prefix = type === "compra" ? "compras" : "vendas";
  return {
    farm: elements[`${prefix}FilterFarm`]?.value || "",
    dateFrom: elements[`${prefix}FilterDateFrom`]?.value || "",
    dateTo: elements[`${prefix}FilterDateTo`]?.value || "",
    category: elements[`${prefix}FilterCategory`]?.value || "",
  };
}

function getCommercialMovements(type, options = {}) {
  const { includeMonth = true, includeTableFilters = true, filterType = type } = options;
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const selectedFarm = getFarm();
  const base = isTotalView
    ? getAllFarms().flatMap((farm) =>
        (farm.movements || [])
          .filter((m) => m.type === type)
          .map((m) => ({ ...m, _farmId: farm.id, _farmName: farm.name }))
      )
    : (selectedFarm?.movements || [])
        .filter((m) => m.type === type)
        .map((m) => ({ ...m, _farmId: selectedFarm.id, _farmName: selectedFarm.name }));

  const year = state.filters.year;
  const month = state.filters.month;
  const tableFilters = includeTableFilters ? getCommercialTableFilters(filterType) : {};

  return base.filter((m) => {
    const d = String(m.date || "");
    if (year !== "all" && !d.startsWith(year)) return false;
    if (includeMonth && month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
    if (state.data.selectedFarmId === TOTAL_FARM_ID && tableFilters.farm && m._farmId !== tableFilters.farm) return false;
    if (tableFilters.dateFrom && d < tableFilters.dateFrom) return false;
    if (tableFilters.dateTo && d > tableFilters.dateTo) return false;
    if (tableFilters.category && m.categoryName !== tableFilters.category) return false;
    return true;
  });
}

function summarizeCommercialMovements(movs) {
  const heads = movs.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
  const value = movs.reduce((sum, m) => sum + Number(m.value || 0), 0);
  return {
    operations: movs.length,
    heads,
    value,
    average: heads > 0 ? value / heads : 0,
  };
}

function getTopCommercialFarm(movs) {
  const byFarm = new Map();
  movs.forEach((m) => {
    const item = byFarm.get(m._farmId) || { name: m._farmName || "—", heads: 0, value: 0 };
    item.heads += Number(m.quantity || 0);
    item.value += Number(m.value || 0);
    byFarm.set(m._farmId, item);
  });
  return [...byFarm.values()].sort((a, b) => b.heads - a.heads || b.value - a.value)[0] || null;
}

function renderCommercialKpiCards(container, focusType) {
  if (!container) return;

  const sales = getCommercialMovements("venda", { filterType: focusType });
  const purchases = getCommercialMovements("compra", { filterType: focusType });
  const saleStats = summarizeCommercialMovements(sales);
  const purchaseStats = summarizeCommercialMovements(purchases);
  const combinedHeads = saleStats.heads + purchaseStats.heads;
  const combinedValue = saleStats.value + purchaseStats.value;
  const ticket = combinedHeads > 0 ? combinedValue / combinedHeads : 0;
  const topFarm = getTopCommercialFarm(focusType === "compra" ? purchases : sales);

  const currency = getCommercialCurrencyFromMovs([...sales, ...purchases]);
  const fmt = (v, compact = true) => formatCommercialMoney(v, compact, currency);

  const card = ({ label, value, desc, tone, badge }) => `
    <article class="com2-kpi-card com2-kpi-card-${tone}">
      <div class="com2-kpi-topline">
        <span class="com2-kpi-dot"></span>
        <span class="com2-kpi-badge com2-badge-${tone}">${badge}</span>
      </div>
      <p class="com2-kpi-label">${label}</p>
      <p class="com2-kpi-value">${value}</p>
      <p class="com2-kpi-desc">${desc}</p>
    </article>`;

  container.innerHTML = `
    <div class="com2-kpi-grid">
      ${card({ label: "Cabeças vendidas", value: formatInteger(saleStats.heads), desc: `${formatInteger(saleStats.operations)} operações de venda`, tone: "v", badge: "Saídas" })}
      ${card({ label: "Receita total", value: fmt(saleStats.value), desc: "valor bruto vendido no período", tone: "fin", badge: "Receita" })}
      ${card({ label: "Cabeças compradas", value: formatInteger(purchaseStats.heads), desc: `${formatInteger(purchaseStats.operations)} operações de compra`, tone: "c", badge: "Entradas" })}
      ${card({ label: "Valor em compras", value: fmt(purchaseStats.value), desc: "capital movimentado em aquisições", tone: "fin", badge: "Investimento" })}
      ${card({ label: "Ticket médio/cabeça", value: fmt(ticket), desc: "média combinada de compras e vendas", tone: "neu", badge: "Média" })}
      ${card({
        label: "Maior volume",
        value: topFarm ? escapeHtml(topFarm.name) : "—",
        desc: topFarm ? `${formatInteger(topFarm.heads)} cabeças no recorte atual` : "sem movimentação no período",
        tone: focusType === "compra" ? "c" : "v",
        badge: focusType === "compra" ? "Compra" : "Venda",
      })}
    </div>`;
}

function buildCommercialFarmSeries(type) {
  const movs = getCommercialMovements(type);
  const grouped = new Map();
  movs.forEach((m) => {
    const item = grouped.get(m._farmId) || { farmId: m._farmId, farmName: m._farmName, heads: 0, value: 0 };
    item.heads += Number(m.quantity || 0);
    item.value += Number(m.value || 0);
    grouped.set(m._farmId, item);
  });
  const rows = [...grouped.values()].filter((item) => item.heads > 0).sort((a, b) => b.heads - a.heads || b.value - a.value);
  const totalHeads = rows.reduce((sum, item) => sum + item.heads, 0);
  return rows.map((item, index) => ({
    ...item,
    percent: totalHeads > 0 ? (item.heads / totalHeads) * 100 : 0,
    isLeader: index === 0,
  }));
}

function buildCommercialMonthlySeries(type) {
  const movs = getCommercialMovements(type, { includeMonth: false });
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: String(index + 1).padStart(2, "0"),
    label: MONTH_NAMES[index].slice(0, 3),
    heads: 0,
    value: 0,
  }));

  movs.forEach((m) => {
    const idx = Number(String(m.date || "").slice(5, 7)) - 1;
    if (idx >= 0 && idx < 12) {
      monthly[idx].heads += Number(m.quantity || 0);
      monthly[idx].value += Number(m.value || 0);
    }
  });

  const maxHeads = Math.max(...monthly.map((item) => item.heads));
  const maxValue = Math.max(...monthly.map((item) => item.value));
  return monthly.map((item) => ({
    ...item,
    isPeak: item.heads === maxHeads && maxHeads > 0,
    isValuePeak: item.value === maxValue && maxValue > 0,
  }));
}

function setCommercialEmptyState(canvas, className, message, show) {
  const parent = canvas.parentElement;
  if (show) {
    canvas.style.display = "none";
    if (!parent.querySelector(`.${className}`)) {
      const p = document.createElement("p");
      p.className = `com2-empty ${className}`;
      p.innerHTML = `<span class="com2-empty-t">${message}</span><span class="com2-empty-s">Ajuste os filtros ou registre uma nova operação.</span>`;
      parent.appendChild(p);
    }
    return;
  }
  canvas.style.display = "";
  parent.querySelector(`.${className}`)?.remove();
}

const commercialBarLabelPlugin = {
  id: "commercialBarLabelPlugin",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const rows = chart.config.options.plugins.commercialMeta?.rows || [];
    ctx.save();
    ctx.font = "700 11px Inter, Arial, sans-serif";
    ctx.textBaseline = "middle";
    meta.data.forEach((bar, index) => {
      const row = rows[index];
      if (!row) return;
      const label = `${formatInteger(row.heads)} cab. · ${row.percent.toFixed(1)}%`;
      ctx.fillStyle = row.isLeader ? "#1f2937" : "#667085";
      ctx.textAlign = "right";
      ctx.fillText(label, chart.chartArea.right - 4, bar.y);
    });
    ctx.restore();
  },
};

const commercialPeakPlugin = {
  id: "commercialPeakPlugin",
  afterDatasetsDraw(chart) {
    const rows = chart.config.options.plugins.commercialMeta?.rows || [];
    const type = chart.config.options.plugins.commercialMeta?.type || "venda";
    const theme = COMMERCIAL_CHART_THEME[type];
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    meta.data.forEach((bar, index) => {
      const row = rows[index];
      if (!row?.isPeak) return;
      ctx.fillStyle = theme.primaryBest;
      ctx.font = "700 10px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("pico", bar.x, Math.max(12, bar.y - 8));
    });
    ctx.restore();
  },
};

function renderCommercialFarmBarChart(type, canvasId, chartKey) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const theme = COMMERCIAL_CHART_THEME[type];
  if (state.charts[chartKey]) {
    state.charts[chartKey].destroy();
    state.charts[chartKey] = null;
  }

  const rows = buildCommercialFarmSeries(type);
  setCommercialEmptyState(canvas, `${type}-farm-empty`, theme.emptyFarm, !rows.length);
  if (!rows.length) return;

  const chartCurrency = getCommercialCurrencyFromMovs(getCommercialMovements(type));

  const chartH = Math.min(500, Math.max(300, rows.length * 48 + 84));
  canvas.style.setProperty("height", `${chartH}px`, "important");
  canvas.style.setProperty("max-height", `${chartH}px`, "important");
  canvas.removeAttribute("height");
  canvas.removeAttribute("width");

  state.charts[chartKey] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map((row) => row.farmName),
      datasets: [{
        label: theme.headLabel,
        data: rows.map((row) => row.heads),
        backgroundColor: rows.map((row) => row.isLeader ? theme.primaryBest : theme.primarySoft),
        borderColor: rows.map((row) => row.isLeader ? theme.primaryBest : theme.primary),
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 15,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 120,
      layout: { padding: { right: 122, top: 8, bottom: 8, left: 2 } },
      plugins: {
        commercialMeta: { rows },
        legend: { display: false },
        tooltip: {
          backgroundColor: "#111827",
          titleColor: "#ffffff",
          bodyColor: "rgba(255,255,255,0.86)",
          padding: 14,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: (items) => rows[items[0].dataIndex]?.farmName || "",
            label: (ctx) => {
              const row = rows[ctx.dataIndex];
              return [
                `${theme.headLabel}: ${formatInteger(row.heads)}`,
                `${theme.valueLabel}: ${formatCommercialMoney(row.value, false, chartCurrency)}`,
                `Ticket médio: ${formatCommercialMoney(row.heads > 0 ? row.value / row.heads : 0, false, chartCurrency)}`,
                `Participação: ${row.percent.toFixed(1)}%`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, color: "#8a94a3", font: { size: 10.5 } },
          grid: { color: "rgba(31, 41, 55, 0.032)", drawTicks: false },
          border: { display: false },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: "#202938", font: { size: 12, weight: "700" }, padding: 12 },
        },
      },
    },
    plugins: [commercialBarLabelPlugin],
  });
}

function renderCommercialEvolutionChart(type, canvasId, chartKey) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const theme = COMMERCIAL_CHART_THEME[type];
  if (state.charts[chartKey]) {
    state.charts[chartKey].destroy();
    state.charts[chartKey] = null;
  }

  const rows = buildCommercialMonthlySeries(type);
  const hasData = rows.some((row) => row.heads > 0 || row.value > 0);
  setCommercialEmptyState(canvas, `${type}-evolution-empty`, theme.emptyEvolution, !hasData);
  if (!hasData) return;

  const evolutionCurrency = getCommercialCurrencyFromMovs(getCommercialMovements(type, { includeMonth: false }));

  canvas.style.setProperty("height", "326px", "important");
  canvas.style.setProperty("max-height", "326px", "important");
  canvas.removeAttribute("height");
  canvas.removeAttribute("width");

  state.charts[chartKey] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: theme.headLabel,
          data: rows.map((row) => row.heads),
          backgroundColor: rows.map((row) => row.isPeak ? theme.primaryBest : theme.primarySoft),
          borderRadius: 9,
          borderSkipped: false,
          yAxisID: "yLeft",
          barPercentage: 0.46,
          categoryPercentage: 0.68,
        },
        {
          type: "line",
          label: theme.valueLabel,
          data: rows.map((row) => row.value),
          borderColor: theme.accent,
          backgroundColor: theme.accentSoft,
          pointBackgroundColor: rows.map((row) => row.isValuePeak ? "#7a5c00" : "#ffffff"),
          pointBorderColor: rows.map((row) => row.isValuePeak ? "#ffffff" : "transparent"),
          pointBorderWidth: rows.map((row) => row.isValuePeak ? 2 : 0),
          pointRadius: rows.map((row) => row.isValuePeak ? 5 : 0),
          pointHoverRadius: 5,
          tension: 0.38,
          fill: true,
          yAxisID: "yRight",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 120,
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 16, right: 8, left: 2 } },
      plugins: {
        commercialMeta: { rows, type },
        legend: {
          position: "bottom",
          labels: { padding: 18, boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: "circle", font: { size: 11, weight: "700" }, color: "#667085" },
        },
        tooltip: {
          backgroundColor: "#111827",
          titleColor: "#ffffff",
          bodyColor: "rgba(255,255,255,0.86)",
          padding: 14,
          cornerRadius: 10,
          callbacks: {
            title: (items) => MONTH_NAMES[items[0].dataIndex],
            label: (ctx) => {
              const row = rows[ctx.dataIndex];
              if (ctx.dataset.yAxisID === "yLeft") return `${theme.headLabel}: ${formatInteger(row.heads)}`;
              return `${theme.valueLabel}: ${formatCommercialMoney(row.value, false, evolutionCurrency)}`;
            },
            afterBody: (items) => {
              const row = rows[items[0].dataIndex];
              const notes = [];
              if (row.isPeak) notes.push("Maior volume de cabeças no ano");
              if (row.isValuePeak) notes.push("Maior valor financeiro no ano");
              return notes;
            },
          },
        },
      },
      scales: {
        yLeft: {
          beginAtZero: true,
          position: "left",
          ticks: { precision: 0, color: theme.primary, font: { size: 10.5, weight: "700" } },
          grid: { color: "rgba(31, 41, 55, 0.032)" },
          border: { display: false },
        },
        yRight: {
          beginAtZero: true,
          position: "right",
          ticks: {
            color: theme.accent,
            font: { size: 10.5, weight: "700" },
            callback: (v) => v > 0 ? `R$ ${new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v).replace("R$", "").trim()}` : "",
          },
          grid: { display: false },
          border: { display: false },
        },
        x: {
          ticks: { color: "#667085", font: { size: 10.5, weight: "700" } },
          grid: { display: false },
          border: { display: false },
        },
      },
    },
    plugins: [commercialPeakPlugin],
  });
}

function renderComprasView() {
  renderComprasFarmSwitch();
  renderComprasFilterSelects();
  renderComprasKpiCards();
  renderComprasCharts();
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
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  if (isTotalView) {
    return getAllFarms().flatMap((f) =>
      f.movements.filter((m) => m.type === "compra").map((m) => ({ ...m, _farmId: f.id, _farmName: f.name }))
    );
  }
  const farm = getFarm();
  return (farm?.movements || []).filter((m) => m.type === "compra").map((m) => ({ ...m, _farmId: farm.id, _farmName: farm.name }));
}

function renderComprasKpiCards() {
  renderCommercialKpiCards(elements.comprasKpiSection, "compra");
}

// ── BI Compras: paleta de categorias ─────────────────────────────────
const COMPRA_CAT_PALETTE = [
  "#1b5e2e","#2d7d50","#bf9844","#1e4fa0","#5a3580",
  "#c76b28","#8f3438","#4a7ab5","#2d8a70","#6b8f3a"
];

function buildComprasCategorySeries() {
  const movs = getCommercialMovements("compra", { includeTableFilters: false });
  const grouped = new Map();
  movs.forEach((m) => {
    const cat = m.categoryName || "Sem categoria";
    const item = grouped.get(cat) || { category: cat, heads: 0, value: 0 };
    item.heads += Number(m.quantity || 0);
    item.value += Number(m.value || 0);
    grouped.set(cat, item);
  });
  const rows = [...grouped.values()].filter(r => r.heads > 0).sort((a, b) => b.heads - a.heads);
  const totalHeads = rows.reduce((s, r) => s + r.heads, 0);
  return rows.map((r, i) => ({
    ...r,
    percent: totalHeads > 0 ? (r.heads / totalHeads) * 100 : 0,
    color: COMPRA_CAT_PALETTE[i % COMPRA_CAT_PALETTE.length]
  }));
}

function buildComprasMonthByCategorySeries() {
  const movs = getCommercialMovements("compra", { includeMonth: false, includeTableFilters: false });
  const catTotals = new Map();
  movs.forEach(m => {
    const cat = m.categoryName || "Sem categoria";
    catTotals.set(cat, (catTotals.get(cat) || 0) + Number(m.quantity || 0));
  });
  const categories = [...catTotals.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
  const monthHeads = {};
  const monthValue = {};
  categories.forEach(cat => { monthHeads[cat] = new Array(12).fill(0); monthValue[cat] = new Array(12).fill(0); });
  movs.forEach((m) => {
    const cat = m.categoryName || "Sem categoria";
    const idx = Number(String(m.date || "").slice(5, 7)) - 1;
    if (idx >= 0 && idx < 12 && monthHeads[cat]) {
      monthHeads[cat][idx] += Number(m.quantity || 0);
      monthValue[cat][idx] += Number(m.value || 0);
    }
  });
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => categories.reduce((s, cat) => s + monthHeads[cat][i], 0));
  const peakIdx = monthlyTotals.indexOf(Math.max(...monthlyTotals));
  return { categories, monthHeads, monthValue, monthlyTotals, peakIdx };
}

function renderComprasInsightStrip() {
  const el = document.getElementById("comprasInsightStrip");
  if (!el) return;
  const { monthlyTotals, peakIdx } = buildComprasMonthByCategorySeries();
  const catSeries = buildComprasCategorySeries();
  const currency = getCommercialCurrencyFromMovs(getCommercialMovements("compra", { includeTableFilters: false }));
  const sym = currency === "USD" ? "US$" : "R$";
  const totalHeads = monthlyTotals.reduce((s, v) => s + v, 0);
  const activeMths = monthlyTotals.filter(v => v > 0).length || 1;
  const sorted3 = [...monthlyTotals].sort((a, b) => b - a).slice(0, 3).reduce((s, v) => s + v, 0);
  const conc = totalHeads > 0 ? Math.round((sorted3 / totalHeads) * 100) : 0;
  const totalValue = catSeries.reduce((s, r) => s + r.value, 0);
  const ticketMedio = totalHeads > 0 ? totalValue / totalHeads : 0;
  const numFmt = (v) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);
  const chips = [
    { icon: "📅", label: "Mes de maior aquisicao", value: MONTH_NAMES[peakIdx] || "—",           sub: `${numFmt(monthlyTotals[peakIdx] || 0)} cabecas` },
    { icon: "🏷️", label: "Categoria mais comprada", value: catSeries[0]?.category || "—",          sub: `${(catSeries[0]?.percent || 0).toFixed(1)}% do volume` },
    { icon: "📊", label: "Media mensal",             value: `${numFmt(Math.round(totalHeads / activeMths))} cab.`, sub: "nos meses com compra" },
    { icon: "🎯", label: "Concentracao",             value: `${conc}%`,                              sub: "volume nos top 3 meses" },
    { icon: "💰", label: "Custo medio/animal",       value: ticketMedio > 0 ? `${sym} ${numFmt(ticketMedio)}` : "—", sub: "investimento medio por cabeca" },
  ];
  el.innerHTML = chips.map(c => `
    <div class="bi-insight-chip bi-insight-chip-c">
      <span class="bi-chip-icon">${c.icon}</span>
      <span class="bi-chip-label">${c.label}</span>
      <span class="bi-chip-value">${escapeHtml(c.value)}</span>
      <span class="bi-chip-sub">${c.sub}</span>
    </div>`).join("");
}

function renderComprasStackedMonthly() {
  const canvas = document.getElementById("comprasEvolutionChart");
  if (!canvas) return;
  if (state.charts["comprasEvolution"]) { state.charts["comprasEvolution"].destroy(); state.charts["comprasEvolution"] = null; }
  const { categories, monthHeads, monthlyTotals, peakIdx } = buildComprasMonthByCategorySeries();
  const hasData = monthlyTotals.some(v => v > 0);
  setCommercialEmptyState(canvas, "compras-stacked-empty", "Nenhuma compra no periodo selecionado", !hasData);
  if (!hasData) return;

  const labels = MONTH_NAMES.map((m, i) => i === peakIdx ? m.slice(0, 3) + " ▲" : m.slice(0, 3));
  const datasets = categories.map((cat, i) => ({
    label: cat,
    data: monthHeads[cat],
    backgroundColor: COMPRA_CAT_PALETTE[i % COMPRA_CAT_PALETTE.length] + "d4",
    borderColor: COMPRA_CAT_PALETTE[i % COMPRA_CAT_PALETTE.length],
    borderWidth: 0,
    borderRadius: 0,
    borderSkipped: false,
  }));

  canvas.style.setProperty("height", "290px", "important");
  canvas.style.setProperty("max-height", "290px", "important");
  canvas.removeAttribute("height"); canvas.removeAttribute("width");

  state.charts["comprasEvolution"] = new Chart(canvas, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 18, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "rect", font: { size: 11, weight: "600" }, color: "#555" }
        },
        tooltip: {
          backgroundColor: "#1a1a1a", titleColor: "#fff", bodyColor: "rgba(255,255,255,0.85)",
          padding: 14, cornerRadius: 10,
          callbacks: {
            title: (items) => {
              const i = items[0].dataIndex;
              return `${MONTH_NAMES[i]} — ${new Intl.NumberFormat("pt-BR").format(monthlyTotals[i])} cabecas${i === peakIdx ? "  🏆 Pico" : ""}`;
            },
            label: (ctx) => {
              const v = ctx.parsed.y;
              if (!v) return null;
              const tot = monthlyTotals[ctx.dataIndex];
              const pct = tot > 0 ? ((v / tot) * 100).toFixed(1) : "0";
              return `${ctx.dataset.label}: ${new Intl.NumberFormat("pt-BR").format(v)} cab. (${pct}%)`;
            },
            afterBody: (items) => {
              const i = items[0].dataIndex;
              return i === peakIdx ? ["", "★ Mes com maior volume do periodo"] : [];
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true, grid: { display: false }, border: { display: false },
          ticks: {
            color: (ctx) => ctx.index === peakIdx ? "#1b5e2e" : "#888",
            font: (ctx) => ({ size: 11, weight: ctx.index === peakIdx ? "800" : "500" })
          }
        },
        y: {
          stacked: true, beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.035)", drawTicks: false }, border: { display: false },
          ticks: { precision: 0, color: "#aaa", font: { size: 10.5 }, callback: (v) => new Intl.NumberFormat("pt-BR").format(v) }
        }
      }
    }
  });
}

function renderComprasHeatmap() {
  const el = document.getElementById("comprasHeatmap");
  if (!el) return;
  const { categories, monthHeads, monthlyTotals } = buildComprasMonthByCategorySeries();
  if (!categories.length) {
    el.innerHTML = `<p style="padding:24px;text-align:center;color:#ccc;font-size:0.8rem;">Sem dados para o periodo</p>`;
    return;
  }
  let maxVal = 0;
  categories.forEach(cat => monthHeads[cat].forEach(v => { if (v > maxVal) maxVal = v; }));
  if (!maxVal) maxVal = 1;

  const mo = MONTH_NAMES.map(m => m.slice(0, 3));
  const cell = (val) => {
    if (!val) return `<td class="bi-hm-cell" style="background:rgba(230,240,234,0.5);color:#ccc;">—</td>`;
    const t = Math.sqrt(val / maxVal);
    const bg = `rgba(27,94,46,${(t * 0.82).toFixed(2)})`;
    const fg = t > 0.52 ? "#fff" : "#0d3018";
    return `<td class="bi-hm-cell" style="background:${bg};color:${fg};" title="${val} cabecas">${new Intl.NumberFormat("pt-BR").format(val)}</td>`;
  };

  const headRow = `<tr>
    <th class="bi-hm-row-hd">Categoria</th>
    ${mo.map(m => `<th>${m}</th>`).join("")}
    <th style="text-align:right;padding-left:8px;color:#999;">Total</th>
  </tr>`;

  const bodyRows = categories.map((cat, ci) => {
    const color = COMPRA_CAT_PALETTE[ci % COMPRA_CAT_PALETTE.length];
    const rowTotal = monthHeads[cat].reduce((s, v) => s + v, 0);
    return `<tr>
      <td class="bi-hm-cat-label">
        <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};margin-right:5px;vertical-align:middle;"></span>${escapeHtml(cat)}
      </td>
      ${monthHeads[cat].map(v => cell(v)).join("")}
      <td style="text-align:right;padding-left:8px;font-size:0.72rem;font-weight:700;color:#1b5e2e;">${new Intl.NumberFormat("pt-BR").format(rowTotal)}</td>
    </tr>`;
  }).join("");

  const grandTotal = categories.reduce((s, cat) => s + monthHeads[cat].reduce((a, b) => a + b, 0), 0);
  const footRow = `<tr>
    <td class="bi-hm-foot-label">Total</td>
    ${monthlyTotals.map(v => `<td style="text-align:center;font-size:0.69rem;font-weight:700;color:${v > 0 ? "#333" : "#ddd"};">${v > 0 ? new Intl.NumberFormat("pt-BR").format(v) : "—"}</td>`).join("")}
    <td class="bi-hm-foot-total" style="color:#1b5e2e;">${new Intl.NumberFormat("pt-BR").format(grandTotal)}</td>
  </tr>`;

  el.innerHTML = `
    <table class="bi-heatmap">
      <thead>${headRow}</thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>${footRow}</tfoot>
    </table>
    <div class="bi-hm-scale">
      <span>Menor</span>
      <div class="bi-hm-scale-bar" style="background:linear-gradient(to right,rgba(27,94,46,0.08),rgba(27,94,46,0.82));"></div>
      <span>Maior</span>
    </div>`;
}

function renderComprasCategoryBar() {
  const canvas = document.getElementById("comprasBarChart");
  if (!canvas) return;
  if (state.charts["comprasBar"]) { state.charts["comprasBar"].destroy(); state.charts["comprasBar"] = null; }
  const rows = buildComprasCategorySeries();
  setCommercialEmptyState(canvas, "compras-catbar-empty", "Nenhuma compra no periodo selecionado", !rows.length);
  if (!rows.length) return;

  const currency = getCommercialCurrencyFromMovs(getCommercialMovements("compra", { includeTableFilters: false }));
  const sym = currency === "USD" ? "US$" : "R$";
  const numFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const chartH = Math.min(380, Math.max(200, rows.length * 46 + 56));
  canvas.style.setProperty("height", `${chartH}px`, "important");
  canvas.style.setProperty("max-height", `${chartH}px`, "important");
  canvas.removeAttribute("height"); canvas.removeAttribute("width");

  state.charts["comprasBar"] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map(r => r.category),
      datasets: [{ label: "Cabecas", data: rows.map(r => r.heads), backgroundColor: rows.map(r => r.color + "cc"), borderColor: rows.map(r => r.color), borderWidth: 1, borderRadius: 8, borderSkipped: false, barThickness: 20 }]
    },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      layout: { padding: { right: 108, top: 4, bottom: 4 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1a1a1a", titleColor: "#fff", bodyColor: "rgba(255,255,255,0.85)",
          padding: 14, cornerRadius: 10, displayColors: false,
          callbacks: {
            title: (items) => rows[items[0].dataIndex]?.category || "",
            label: (ctx) => {
              const r = rows[ctx.dataIndex];
              return [`Cabecas: ${numFmt.format(r.heads)} (${r.percent.toFixed(1)}%)`, `Investimento: ${sym} ${numFmt.format(r.value)}`, `Custo medio: ${sym} ${numFmt.format(r.heads > 0 ? r.value / r.heads : 0)}`];
            }
          }
        }
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0, color: "#bbb", font: { size: 10 } }, grid: { color: "rgba(0,0,0,0.03)" }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false }, ticks: { color: "#333", font: { size: 12, weight: "600" }, padding: 8 } }
      }
    },
    plugins: [{
      id: "catBarLabelsC",
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.font = "600 10.5px Inter, Arial, sans-serif";
        ctx.textBaseline = "middle";
        meta.data.forEach((bar, idx) => {
          const r = rows[idx];
          if (!r) return;
          ctx.fillStyle = "#666";
          ctx.textAlign = "left";
          ctx.fillText(`${numFmt.format(r.heads)}  ${r.percent.toFixed(1)}%`, chart.chartArea.right - 100, bar.y);
        });
        ctx.restore();
      }
    }]
  });
}

function renderComprasCharts() {
  renderComprasInsightStrip();
  renderComprasStackedMonthly();
  renderComprasHeatmap();
  renderComprasCategoryBar();
}

function renderComprasBarChart() { /* substituido por renderComprasCategoryBar */ }
function renderComprasEvolutionChart() { /* substituido por renderComprasStackedMonthly */
}

function renderComprasFilterSelects() {
  if (!elements.comprasFilterFarm || !elements.comprasFilterCategory) return;

  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = getAllFarms();
  const allMovs = getComprasMovements();

  // Farm filter
  const currentFarmFilter = elements.comprasFilterFarm.value;
  elements.comprasFilterFarm.innerHTML = `<option value="">Todas as fazendas</option>` +
    farms.map((f) => `<option value="${escapeHtml(f.id)}" ${currentFarmFilter === f.id ? "selected" : ""}>${escapeHtml(f.name)}</option>`).join("");
  elements.comprasFilterFarm.hidden = !isTotalView;
  elements.comprasFilterFarm.closest && elements.comprasFilterFarm.closest(".san-history-filters")?.querySelector("#comprasFilterFarm")?.parentElement;

  // Category filter
  const cats = [...new Set(allMovs.map((m) => m.categoryName).filter(Boolean))].sort();
  const currentCat = elements.comprasFilterCategory.value;
  elements.comprasFilterCategory.innerHTML = `<option value="">Todas as categorias</option>` +
    cats.map((c) => `<option value="${escapeHtml(c)}" ${currentCat === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("");
}

function renderComprasTable() {
  if (!elements.comprasTableBody) return;

  const year = state.filters.year;
  const month = state.filters.month;
  const search = (elements.comprasHistorySearch?.value || "").trim().toLowerCase();
  const filterFarm = elements.comprasFilterFarm?.value || "";
  const filterDateFrom = elements.comprasFilterDateFrom?.value || "";
  const filterDateTo = elements.comprasFilterDateTo?.value || "";
  const filterCat = elements.comprasFilterCategory?.value || "";

  let movs = getComprasMovements().filter((m) => {
    const d = m.date || "";
    if (year !== "all" && !d.startsWith(year)) return false;
    if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
    if (filterFarm && m._farmId !== filterFarm) return false;
    if (filterDateFrom && d < filterDateFrom) return false;
    if (filterDateTo && d > filterDateTo) return false;
    if (filterCat && m.categoryName !== filterCat) return false;
    if (search) {
      const origin = (m.purchaseDetails?.sourceProperty || "").toLowerCase();
      const base = [m.code, m.categoryName, m.notes, m._farmName].join(" ").toLowerCase();
      if (!base.includes(search) && !origin.includes(search)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = movs.length;
  const totalPages = Math.max(1, Math.ceil(total / COMPRAS_PAGE_SIZE));
  const page = Math.min(Math.max(0, runtime.comprasPage || 0), totalPages - 1);
  runtime.comprasPage = page;
  const slice = movs.slice(page * COMPRAS_PAGE_SIZE, (page + 1) * COMPRAS_PAGE_SIZE);

  if (!slice.length) {
    elements.comprasTableBody.innerHTML = `<tr><td colspan="12" class="table-empty-cell">${search || filterFarm || filterCat || filterDateFrom || filterDateTo ? "Nenhum registro encontrado com estes filtros." : "Nenhuma compra registrada ainda."}</td></tr>`;
  } else {
    elements.comprasTableBody.innerHTML = slice.map((m) => {
      const p = m.purchaseDetails || {};
      const currency = m.currency || getFarmCurrency(m._farmId);
      const sym = currency === "USD" ? "US$" : "R$";
      const fmtVal = (v) => v > 0 ? `${sym} ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}` : `<span class="muted-cell">—</span>`;
      const fmtKg  = (v) => v > 0 ? `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v)} kg` : `<span class="muted-cell">—</span>`;
      const fmtPriceKg = (v) => v > 0 ? `${sym} ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v)}` : `<span class="muted-cell">—</span>`;
      const code = m.code
        ? `<span class="movement-code">${escapeHtml(m.code)}</span>`
        : `<span class="movement-code movement-code-legacy">—</span>`;
      const origin = p.sourceProperty ? escapeHtml(p.sourceProperty) : `<span class="muted-cell">—</span>`;
      const currBadge = `<span class="currency-badge ${currency === "USD" ? "usd" : "brl"}">${currency}</span>`;
      const valuePerHead = p.valuePerHead || (m.quantity > 0 && m.value > 0 ? m.value / m.quantity : 0);
      return `<tr class="mov-record-row mov-record-row-compra">
        <td>${code}</td>
        <td><div class="mov-records-main-cell"><strong>${escapeHtml(m._farmName)}</strong></div></td>
        <td>${formatDate(m.date)}</td>
        <td><strong>${escapeHtml(m.categoryName)}</strong></td>
        <td class="num-col"><strong>${formatInteger(m.quantity)}</strong></td>
        <td>${origin}</td>
        <td class="num-col">${fmtKg(p.avgWeight || 0)}</td>
        <td class="num-col">${fmtKg(p.totalWeight || 0)}</td>
        <td class="num-col">${fmtPriceKg(p.pricePerKg || 0)}</td>
        <td class="num-col">${fmtVal(valuePerHead)}</td>
        <td class="num-col fin-value">${currBadge} ${fmtVal(m.value)}</td>
        <td class="movement-actions-cell">
          <button class="movement-action-btn edit-btn" data-farm-id="${escapeHtml(m._farmId)}" data-movement-id="${escapeHtml(m.id)}">Editar</button>
          <button class="movement-action-btn delete-btn" data-farm-id="${escapeHtml(m._farmId)}" data-movement-id="${escapeHtml(m.id)}">Excluir</button>
        </td>
      </tr>`;
    }).join("");

    elements.comprasTableBody.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openEditMovementDialog(btn.dataset.farmId, btn.dataset.movementId));
    });
    elements.comprasTableBody.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        deleteMovement(btn.dataset.farmId, btn.dataset.movementId);
      });
    });
  }

  // Pagination
  if (elements.comprasHistoryPagination) {
    if (totalPages <= 1) {
      elements.comprasHistoryPagination.innerHTML = total > 0
        ? `<span class="pagination-info">${total} registro${total !== 1 ? "s" : ""}</span>`
        : "";
    } else {
      elements.comprasHistoryPagination.innerHTML = `
        <span class="pagination-info">${total} registros</span>
        <button type="button" class="ghost-btn" id="comprasPagePrev" ${page === 0 ? "disabled" : ""}>&#8592; Anterior</button>
        <span class="pagination-info">Página ${page + 1} de ${totalPages}</span>
        <button type="button" class="ghost-btn" id="comprasPageNext" ${page >= totalPages - 1 ? "disabled" : ""}>Próxima &#8594;</button>
      `;
      document.getElementById("comprasPagePrev")?.addEventListener("click", () => {
        runtime.comprasPage = Math.max(0, page - 1);
        renderComprasTable();
      });
      document.getElementById("comprasPageNext")?.addEventListener("click", () => {
        runtime.comprasPage = Math.min(totalPages - 1, page + 1);
        renderComprasTable();
      });
    }
  }
}

// ─── PDF de Compras ───────────────────────────────────────────────────────────

async function exportComprasPdfReport() {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("A biblioteca de PDF não foi carregada. Verifique sua conexão e tente novamente.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ? getAllFarms() : [getFarm()].filter(Boolean);
  if (!farms.length) { alert("Nenhuma fazenda encontrada."); return; }

  const year = String(state.filters.year);
  const month = state.filters.month;
  const periodLabel = month === "all" ? `Ano ${year}` : `${MONTH_NAMES[Number(month) - 1]}/${year}`;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let firstPage = true;

  await appendPdfCoverPage(doc, farms, periodLabel, "Relatório de Compras");
  doc.addPage();

  for (const farm of farms) {
    if (!firstPage) doc.addPage();
    firstPage = false;

    const compras = farm.movements.filter((m) => {
      if (m.type !== "compra") return false;
      const d = m.date || "";
      if (!d.startsWith(year)) return false;
      if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalCabecas = compras.reduce((s, m) => s + Number(m.quantity || 0), 0);
    const totalValor = compras.reduce((s, m) => s + Number(m.value || 0), 0);
    const currency = getFarmCurrency(farm.id);
    const sym = currency === "USD" ? "US$" : "R$";
    const fmtVal = (v) => v > 0 ? `${sym} ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}` : "—";

    if (isTotalView) {
      appendPdfFarmReportDivider(doc, farm, periodLabel, "Relatório de Compras", [
        { label: "Operações", value: formatInteger(compras.length) },
        { label: "Cabeças", value: formatInteger(totalCabecas) },
        { label: "Investido", value: fmtVal(totalValor) }
      ], farms.indexOf(farm) + 1, farms.length);
      doc.addPage();
    }

    // Header
    try {
      const logoData = await loadLogoForPdf("#ffffff");
      doc.addImage(logoData, "JPEG", margin, 8, 18, 18);
    } catch (e) { /* ignore */ }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(45, 35, 25);
    doc.text("Relatório de Compras", margin + 22, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(87, 69, 52);
    doc.text(`Fazenda: ${farm.name}   Período: ${periodLabel}   Responsável: ${TECHNICAL_MANAGER_NAME}`, margin + 22, 22);
    doc.setDrawColor(140, 80, 45);
    doc.setLineWidth(0.6);
    doc.line(margin, 27, pageW - margin, 27);

    // KPI summary boxes
    let xBox = margin;
    const boxW = 60;
    const boxH = 16;
    const boxY = 30;
    const kpis = [
      { label: "Operações", value: String(compras.length) },
      { label: "Cabeças adquiridas", value: formatInteger(totalCabecas) },
      { label: `Investimento (${currency})`, value: fmtVal(totalValor) },
      { label: "Média/cabeça", value: totalCabecas > 0 ? fmtVal(totalValor / totalCabecas) : "—" }
    ];
    kpis.forEach((kpi) => {
      doc.setFillColor(250, 244, 234);
      doc.setDrawColor(200, 185, 160);
      doc.setLineWidth(0.3);
      doc.roundedRect(xBox, boxY, boxW - 2, boxH, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(kpi.value, xBox + (boxW - 2) / 2, boxY + 7, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 80, 55);
      doc.text(kpi.label, xBox + (boxW - 2) / 2, boxY + 13, { align: "center" });
      xBox += boxW;
    });

    // Table
    if (!compras.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(130, 110, 90);
      doc.text("Nenhuma compra registrada neste período.", margin, boxY + boxH + 10);
      continue;
    }

    const tableStartY = boxY + boxH + 8;
    const cols = [
      { header: "Código", w: 20 },
      { header: "Data", w: 18 },
      { header: "Categoria", w: 34 },
      { header: "Cab.", w: 14, align: "right" },
      { header: "Origem / Propriedade", w: 42 },
      { header: "P.Méd(kg)", w: 20, align: "right" },
      { header: "P.Lote(kg)", w: 22, align: "right" },
      { header: `${currency}/kg`, w: 22, align: "right" },
      { header: `${currency}/Animal`, w: 28, align: "right" },
      { header: `Valor (${currency})`, w: 0, align: "right" }
    ];
    const lastColW = pageW - margin * 2 - cols.slice(0, -1).reduce((s, c) => s + c.w, 0);
    cols[cols.length - 1].w = Math.max(20, lastColW);

    // Table header
    let curX = margin;
    const rowH = 7;
    doc.setFillColor(45, 35, 25);
    doc.rect(margin, tableStartY, pageW - margin * 2, rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    cols.forEach((col) => {
      doc.text(col.header, col.align === "right" ? curX + col.w - 2 : curX + 2, tableStartY + 4.8, { align: col.align === "right" ? "right" : "left" });
      curX += col.w;
    });

    // Table rows
    let rowY = tableStartY + rowH;
    const maxY = doc.internal.pageSize.getHeight() - margin - 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    compras.forEach((m, idx) => {
      if (rowY + rowH > maxY) {
        doc.addPage();
        rowY = margin + 8;
        // Re-draw header
        curX = margin;
        doc.setFillColor(45, 35, 25);
        doc.rect(margin, rowY - rowH, pageW - margin * 2, rowH, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        cols.forEach((col) => {
          doc.text(col.header, col.align === "right" ? margin + cols.slice(0, cols.indexOf(col) + 1).reduce((s, c) => s + c.w, 0) - 2 : margin + cols.slice(0, cols.indexOf(col)).reduce((s, c) => s + c.w, 0) + 2, rowY - rowH + 4.8, { align: col.align === "right" ? "right" : "left" });
        });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
      }

      const p = m.purchaseDetails || {};
      if (idx % 2 === 0) {
        doc.setFillColor(249, 244, 236);
        doc.rect(margin, rowY, pageW - margin * 2, rowH, "F");
      }
      doc.setTextColor(30, 30, 30);

      const vph = p.valuePerHead || (m.quantity > 0 && m.value > 0 ? m.value / m.quantity : 0);
      const numFmt = (v, dec = 2) => v > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v) : "—";
      const rowValues = [
        m.code || "—",
        formatDate(m.date),
        m.categoryName || "—",
        formatInteger(m.quantity),
        (p.sourceProperty || "—").slice(0, 26),
        p.avgWeight > 0 ? numFmt(p.avgWeight, 1) : "—",
        p.totalWeight > 0 ? numFmt(p.totalWeight, 0) : "—",
        p.pricePerKg > 0 ? numFmt(p.pricePerKg, 3) : "—",
        vph > 0 ? numFmt(vph, 2) : "—",
        m.value > 0 ? numFmt(m.value, 2) : "—"
      ];

      curX = margin;
      rowValues.forEach((val, ci) => {
        const col = cols[ci];
        const isRight = col.align === "right";
        doc.text(String(val), isRight ? curX + col.w - 2 : curX + 2, rowY + 4.8, { align: isRight ? "right" : "left", maxWidth: col.w - 3 });
        curX += col.w;
      });
      doc.setDrawColor(220, 210, 195);
      doc.setLineWidth(0.15);
      doc.line(margin, rowY + rowH, pageW - margin, rowY + rowH);
      rowY += rowH;
    });

    // Footer total line
    doc.setDrawColor(120, 80, 40);
    doc.setLineWidth(0.5);
    doc.line(margin, rowY, pageW - margin, rowY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    const totalX = pageW - margin - cols[cols.length - 1].w - cols[cols.length - 2].w;
    doc.text(`Total: ${formatInteger(totalCabecas)} cab.   ${fmtVal(totalValor)}`, totalX, rowY + 5);
  }

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 140, 120);
    doc.text(`Página ${i} de ${pageCount}`, pageW - margin, doc.internal.pageSize.getHeight() - 5, { align: "right" });
    doc.text(`Fazendas Da Bruna — Relatório de Compras — ${periodLabel}`, margin, doc.internal.pageSize.getHeight() - 5);
  }

  doc.save(`compras-${isTotalView ? "todas-fazendas" : farms[0]?.name?.toLowerCase().replace(/\s+/g, "-") || "fazenda"}-${periodLabel.replace(/\//g, "-")}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDAS VIEW
// ─────────────────────────────────────────────────────────────────────────────

const VENDAS_PAGE_SIZE = 50;

function renderVendasView() {
  renderVendasFarmSwitch();
  renderVendasFilterSelects();
  renderVendasKpiCards();
  renderVendasCharts();
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
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  if (isTotalView) {
    return getAllFarms().flatMap((f) =>
      f.movements.filter((m) => m.type === "venda").map((m) => ({ ...m, _farmId: f.id, _farmName: f.name }))
    );
  }
  const farm = getFarm();
  return (farm?.movements || []).filter((m) => m.type === "venda").map((m) => ({ ...m, _farmId: farm.id, _farmName: farm.name }));
}

function renderVendasKpiCards() {
  renderCommercialKpiCards(elements.vendasKpiSection, "venda");
}

// ── BI Vendas: paleta de categorias ──────────────────────────────────
const VENDA_CAT_PALETTE = [
  "#8f3438","#bf9844","#1b5e2e","#1e4fa0","#c76b28",
  "#7a3580","#2d8a70","#c4442a","#4a7ab5","#6b8f3a"
];

function buildVendasCategorySeries() {
  const movs = getCommercialMovements("venda", { includeTableFilters: false });
  const grouped = new Map();
  movs.forEach((m) => {
    const cat = m.categoryName || "Sem categoria";
    const item = grouped.get(cat) || { category: cat, heads: 0, value: 0 };
    item.heads += Number(m.quantity || 0);
    item.value += Number(m.value || 0);
    grouped.set(cat, item);
  });
  const rows = [...grouped.values()].filter(r => r.heads > 0).sort((a, b) => b.heads - a.heads);
  const totalHeads = rows.reduce((s, r) => s + r.heads, 0);
  return rows.map((r, i) => ({
    ...r,
    percent: totalHeads > 0 ? (r.heads / totalHeads) * 100 : 0,
    color: VENDA_CAT_PALETTE[i % VENDA_CAT_PALETTE.length]
  }));
}

function buildVendasMonthByCategorySeries() {
  const movs = getCommercialMovements("venda", { includeMonth: false, includeTableFilters: false });
  const catTotals = new Map();
  movs.forEach(m => {
    const cat = m.categoryName || "Sem categoria";
    catTotals.set(cat, (catTotals.get(cat) || 0) + Number(m.quantity || 0));
  });
  const categories = [...catTotals.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
  const monthHeads = {};
  const monthValue = {};
  categories.forEach(cat => { monthHeads[cat] = new Array(12).fill(0); monthValue[cat] = new Array(12).fill(0); });
  movs.forEach((m) => {
    const cat = m.categoryName || "Sem categoria";
    const idx = Number(String(m.date || "").slice(5, 7)) - 1;
    if (idx >= 0 && idx < 12 && monthHeads[cat]) {
      monthHeads[cat][idx] += Number(m.quantity || 0);
      monthValue[cat][idx] += Number(m.value || 0);
    }
  });
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => categories.reduce((s, cat) => s + monthHeads[cat][i], 0));
  const maxTotal = Math.max(...monthlyTotals, 1);
  const peakIdx = monthlyTotals.indexOf(Math.max(...monthlyTotals));
  return { categories, monthHeads, monthValue, monthlyTotals, maxTotal, peakIdx };
}

function renderVendasInsightStrip() {
  const el = document.getElementById("vendasInsightStrip");
  if (!el) return;
  const { categories, monthlyTotals, peakIdx } = buildVendasMonthByCategorySeries();
  const catSeries = buildVendasCategorySeries();
  const currency = getCommercialCurrencyFromMovs(getCommercialMovements("venda", { includeTableFilters: false }));
  const sym = currency === "USD" ? "US$" : "R$";
  const totalHeads = monthlyTotals.reduce((s, v) => s + v, 0);
  const activeMths = monthlyTotals.filter(v => v > 0).length || 1;
  const sorted3 = [...monthlyTotals].sort((a, b) => b - a).slice(0, 3).reduce((s, v) => s + v, 0);
  const conc = totalHeads > 0 ? Math.round((sorted3 / totalHeads) * 100) : 0;
  const totalValue = catSeries.reduce((s, r) => s + r.value, 0);
  const ticketMedio = totalHeads > 0 ? totalValue / totalHeads : 0;
  const numFmt = (v) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);
  const chips = [
    { icon: "📅", label: "Mes mais forte",    value: MONTH_NAMES[peakIdx] || "—",          sub: `${numFmt(monthlyTotals[peakIdx] || 0)} cabecas` },
    { icon: "🏷️", label: "Categoria lider",   value: catSeries[0]?.category || "—",         sub: `${(catSeries[0]?.percent || 0).toFixed(1)}% do volume` },
    { icon: "📊", label: "Media mensal",       value: `${numFmt(Math.round(totalHeads / activeMths))} cab.`, sub: "nos meses com venda" },
    { icon: "🎯", label: "Concentracao",       value: `${conc}%`,                             sub: "volume nos top 3 meses" },
    { icon: "💰", label: "Ticket medio/animal", value: ticketMedio > 0 ? `${sym} ${numFmt(ticketMedio)}` : "—", sub: "valor medio por cabeca" },
  ];
  el.innerHTML = chips.map(c => `
    <div class="bi-insight-chip">
      <span class="bi-chip-icon">${c.icon}</span>
      <span class="bi-chip-label">${c.label}</span>
      <span class="bi-chip-value">${escapeHtml(c.value)}</span>
      <span class="bi-chip-sub">${c.sub}</span>
    </div>`).join("");
}

function renderVendasStackedMonthly() {
  const canvas = document.getElementById("vendasEvolutionChart");
  if (!canvas) return;
  if (state.charts["vendasEvolution"]) { state.charts["vendasEvolution"].destroy(); state.charts["vendasEvolution"] = null; }
  const { categories, monthHeads, monthlyTotals, peakIdx } = buildVendasMonthByCategorySeries();
  const hasData = monthlyTotals.some(v => v > 0);
  setCommercialEmptyState(canvas, "vendas-stacked-empty", "Nenhuma venda no periodo selecionado", !hasData);
  if (!hasData) return;

  const labels = MONTH_NAMES.map((m, i) => i === peakIdx ? m.slice(0, 3) + " ▲" : m.slice(0, 3));
  const datasets = categories.map((cat, i) => ({
    label: cat,
    data: monthHeads[cat],
    backgroundColor: VENDA_CAT_PALETTE[i % VENDA_CAT_PALETTE.length] + "d4",
    borderColor: VENDA_CAT_PALETTE[i % VENDA_CAT_PALETTE.length],
    borderWidth: 0,
    borderRadius: 0,
    borderSkipped: false,
  }));

  canvas.style.setProperty("height", "290px", "important");
  canvas.style.setProperty("max-height", "290px", "important");
  canvas.removeAttribute("height"); canvas.removeAttribute("width");

  state.charts["vendasEvolution"] = new Chart(canvas, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 18, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "rect", font: { size: 11, weight: "600" }, color: "#555" }
        },
        tooltip: {
          backgroundColor: "#1a1a1a",
          titleColor: "#fff",
          bodyColor: "rgba(255,255,255,0.85)",
          padding: 14, cornerRadius: 10,
          callbacks: {
            title: (items) => {
              const i = items[0].dataIndex;
              return `${MONTH_NAMES[i]} — ${new Intl.NumberFormat("pt-BR").format(monthlyTotals[i])} cabecas${i === peakIdx ? "  🏆 Pico" : ""}`;
            },
            label: (ctx) => {
              const v = ctx.parsed.y;
              if (!v) return null;
              const tot = monthlyTotals[ctx.dataIndex];
              const pct = tot > 0 ? ((v / tot) * 100).toFixed(1) : "0";
              return `${ctx.dataset.label}: ${new Intl.NumberFormat("pt-BR").format(v)} cab. (${pct}%)`;
            },
            afterBody: (items) => {
              const i = items[0].dataIndex;
              if (i !== peakIdx) return [];
              return ["", "★ Mes com maior volume do periodo"];
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: (ctx) => ctx.index === peakIdx ? "#8f3438" : "#888",
            font: (ctx) => ({ size: 11, weight: ctx.index === peakIdx ? "800" : "500" })
          }
        },
        y: {
          stacked: true, beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.035)", drawTicks: false },
          border: { display: false },
          ticks: { precision: 0, color: "#aaa", font: { size: 10.5 }, callback: (v) => new Intl.NumberFormat("pt-BR").format(v) }
        }
      }
    }
  });
}

function renderVendasHeatmap() {
  const el = document.getElementById("vendasHeatmap");
  if (!el) return;
  const { categories, monthHeads, monthlyTotals } = buildVendasMonthByCategorySeries();
  if (!categories.length) {
    el.innerHTML = `<p style="padding:24px;text-align:center;color:#ccc;font-size:0.8rem;">Sem dados para o periodo</p>`;
    return;
  }
  let maxVal = 0;
  categories.forEach(cat => monthHeads[cat].forEach(v => { if (v > maxVal) maxVal = v; }));
  if (!maxVal) maxVal = 1;

  const mo = MONTH_NAMES.map(m => m.slice(0, 3));
  const cell = (val) => {
    if (!val) return `<td class="bi-hm-cell" style="background:rgba(240,234,228,0.5);color:#ddd;">—</td>`;
    const t = Math.sqrt(val / maxVal);
    const bg = `rgba(111,37,42,${(t * 0.82).toFixed(2)})`;
    const fg = t > 0.52 ? "#fff" : "#3a1012";
    return `<td class="bi-hm-cell" style="background:${bg};color:${fg};" title="${val} cabecas">${new Intl.NumberFormat("pt-BR").format(val)}</td>`;
  };

  const headRow = `<tr>
    <th class="bi-hm-row-hd">Categoria</th>
    ${mo.map(m => `<th>${m}</th>`).join("")}
    <th style="text-align:right;padding-left:8px;color:#999;">Total</th>
  </tr>`;

  const bodyRows = categories.map((cat, ci) => {
    const color = VENDA_CAT_PALETTE[ci % VENDA_CAT_PALETTE.length];
    const rowTotal = monthHeads[cat].reduce((s, v) => s + v, 0);
    return `<tr>
      <td class="bi-hm-cat-label">
        <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};margin-right:5px;vertical-align:middle;flex-shrink:0;"></span>${escapeHtml(cat)}
      </td>
      ${monthHeads[cat].map(v => cell(v)).join("")}
      <td style="text-align:right;padding-left:8px;font-size:0.72rem;font-weight:700;color:#8f3438;">${new Intl.NumberFormat("pt-BR").format(rowTotal)}</td>
    </tr>`;
  }).join("");

  const grandTotal = categories.reduce((s, cat) => s + monthHeads[cat].reduce((a, b) => a + b, 0), 0);
  const footRow = `<tr>
    <td class="bi-hm-foot-label">Total</td>
    ${monthlyTotals.map(v => `<td style="text-align:center;font-size:0.69rem;font-weight:700;color:${v > 0 ? "#333" : "#ddd"};">${v > 0 ? new Intl.NumberFormat("pt-BR").format(v) : "—"}</td>`).join("")}
    <td class="bi-hm-foot-total">${new Intl.NumberFormat("pt-BR").format(grandTotal)}</td>
  </tr>`;

  el.innerHTML = `
    <table class="bi-heatmap">
      <thead>${headRow}</thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>${footRow}</tfoot>
    </table>
    <div class="bi-hm-scale">
      <span>Menor</span><div class="bi-hm-scale-bar"></div><span>Maior</span>
    </div>`;
}

function renderVendasCategoryBar() {
  const canvas = document.getElementById("vendasBarChart");
  if (!canvas) return;
  if (state.charts["vendasBar"]) { state.charts["vendasBar"].destroy(); state.charts["vendasBar"] = null; }
  const rows = buildVendasCategorySeries();
  setCommercialEmptyState(canvas, "vendas-catbar-empty", "Nenhuma venda no periodo selecionado", !rows.length);
  if (!rows.length) return;

  const currency = getCommercialCurrencyFromMovs(getCommercialMovements("venda", { includeTableFilters: false }));
  const sym = currency === "USD" ? "US$" : "R$";
  const numFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const chartH = Math.min(380, Math.max(200, rows.length * 46 + 56));
  canvas.style.setProperty("height", `${chartH}px`, "important");
  canvas.style.setProperty("max-height", `${chartH}px`, "important");
  canvas.removeAttribute("height"); canvas.removeAttribute("width");

  state.charts["vendasBar"] = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map(r => r.category),
      datasets: [{ label: "Cabecas", data: rows.map(r => r.heads), backgroundColor: rows.map(r => r.color + "cc"), borderColor: rows.map(r => r.color), borderWidth: 1, borderRadius: 8, borderSkipped: false, barThickness: 20 }]
    },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      layout: { padding: { right: 108, top: 4, bottom: 4 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1a1a1a", titleColor: "#fff", bodyColor: "rgba(255,255,255,0.85)",
          padding: 14, cornerRadius: 10, displayColors: false,
          callbacks: {
            title: (items) => rows[items[0].dataIndex]?.category || "",
            label: (ctx) => {
              const r = rows[ctx.dataIndex];
              return [`Cabecas: ${numFmt.format(r.heads)} (${r.percent.toFixed(1)}%)`, `Receita: ${sym} ${numFmt.format(r.value)}`, `Ticket medio: ${sym} ${numFmt.format(r.heads > 0 ? r.value / r.heads : 0)}`];
            }
          }
        }
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0, color: "#bbb", font: { size: 10 } }, grid: { color: "rgba(0,0,0,0.03)" }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false }, ticks: { color: "#333", font: { size: 12, weight: "600" }, padding: 8 } }
      }
    },
    plugins: [{
      id: "catBarLabels",
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.font = "600 10.5px Inter, Arial, sans-serif";
        ctx.textBaseline = "middle";
        meta.data.forEach((bar, idx) => {
          const r = rows[idx];
          if (!r) return;
          ctx.fillStyle = "#666";
          ctx.textAlign = "left";
          ctx.fillText(`${numFmt.format(r.heads)}  ${r.percent.toFixed(1)}%`, chart.chartArea.right - 100, bar.y);
        });
        ctx.restore();
      }
    }]
  });
}

function renderVendasCharts() {
  renderVendasInsightStrip();
  renderVendasStackedMonthly();
  renderVendasHeatmap();
  renderVendasCategoryBar();
}

function renderVendasBarChart() { /* substituido por renderVendasCategoryBar */ }
function renderVendasEvolutionChart() { /* substituido por renderVendasStackedMonthly */ }

function renderVendasFilterSelects() {
  if (!elements.vendasFilterFarm || !elements.vendasFilterCategory) return;
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const allMovs = getVendasMovements();
  const currentFarm = elements.vendasFilterFarm.value;
  elements.vendasFilterFarm.innerHTML = `<option value="">Todas as fazendas</option>` +
    getAllFarms().map((f) => `<option value="${escapeHtml(f.id)}" ${currentFarm === f.id ? "selected" : ""}>${escapeHtml(f.name)}</option>`).join("");
  elements.vendasFilterFarm.hidden = !isTotalView;
  const cats = [...new Set(allMovs.map((m) => m.categoryName).filter(Boolean))].sort();
  const currentCat = elements.vendasFilterCategory.value;
  elements.vendasFilterCategory.innerHTML = `<option value="">Todas as categorias</option>` +
    cats.map((c) => `<option value="${escapeHtml(c)}" ${currentCat === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("");
}

function renderVendasTable() {
  if (!elements.vendasTableBody) return;
  const year = state.filters.year;
  const month = state.filters.month;
  const search = (elements.vendasHistorySearch?.value || "").trim().toLowerCase();
  const filterFarm = elements.vendasFilterFarm?.value || "";
  const filterDateFrom = elements.vendasFilterDateFrom?.value || "";
  const filterDateTo = elements.vendasFilterDateTo?.value || "";
  const filterCat = elements.vendasFilterCategory?.value || "";

  let movs = getVendasMovements().filter((m) => {
    const d = m.date || "";
    if (year !== "all" && !d.startsWith(year)) return false;
    if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
    if (filterFarm && m._farmId !== filterFarm) return false;
    if (filterDateFrom && d < filterDateFrom) return false;
    if (filterDateTo && d > filterDateTo) return false;
    if (filterCat && m.categoryName !== filterCat) return false;
    if (search) {
      const buyer = (m.saleDetails?.buyer || extractBuyerFromNotes(m.notes) || "").toLowerCase();
      const base = [m.code, m.categoryName, m.notes, m._farmName].join(" ").toLowerCase();
      if (!base.includes(search) && !buyer.includes(search)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = movs.length;
  const totalPages = Math.max(1, Math.ceil(total / VENDAS_PAGE_SIZE));
  const page = Math.min(Math.max(0, runtime.vendasPage || 0), totalPages - 1);
  runtime.vendasPage = page;
  const slice = movs.slice(page * VENDAS_PAGE_SIZE, (page + 1) * VENDAS_PAGE_SIZE);

  if (!slice.length) {
    elements.vendasTableBody.innerHTML = `<tr><td colspan="13" class="table-empty-cell">${search || filterFarm || filterCat || filterDateFrom || filterDateTo ? "Nenhum registro encontrado com estes filtros." : "Nenhuma venda registrada ainda."}</td></tr>`;
  } else {
    elements.vendasTableBody.innerHTML = slice.map((m) => {
      const d = m.saleDetails || {};
      const currency = m.currency || getFarmCurrency(m._farmId);
      const sym = currency === "USD" ? "US$" : "R$";
      const fmtVal      = (v) => v > 0 ? `${sym} ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}` : `<span class="muted-cell">—</span>`;
      const fmtKg       = (v) => v > 0 ? `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v)} kg` : `<span class="muted-cell">—</span>`;
      const fmtPriceKg  = (v) => v > 0 ? `${sym} ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v)}` : `<span class="muted-cell">—</span>`;
      const code = m.code ? `<span class="movement-code">${escapeHtml(m.code)}</span>` : `<span class="movement-code movement-code-legacy">—</span>`;
      const buyer = d.buyer || extractBuyerFromNotes(m.notes);
      const buyerCell = buyer ? escapeHtml(buyer) : `<span class="muted-cell">—</span>`;
      const pricePerKg  = d.pricePerKg || (d.weightKg > 0 && m.value > 0 ? m.value / d.weightKg : 0);
      const avgWeight   = d.weightKg > 0 && m.quantity > 0 ? d.weightKg / m.quantity : 0;
      const valuePerHead = d.valuePerHead || (m.quantity > 0 && m.value > 0 ? m.value / m.quantity : 0);
      const modeLabel   = d.mode ? getSaleModeLabel(d.mode) : `<span class="muted-cell">—</span>`;
      const currBadge   = `<span class="currency-badge ${currency === "USD" ? "usd" : "brl"}">${currency}</span>`;
      return `<tr class="mov-record-row mov-record-row-venda">
        <td>${code}</td>
        <td><div class="mov-records-main-cell"><strong>${escapeHtml(m._farmName)}</strong></div></td>
        <td>${formatDate(m.date)}</td>
        <td><strong>${escapeHtml(m.categoryName)}</strong></td>
        <td class="num-col"><strong>${formatInteger(m.quantity)}</strong></td>
        <td>${buyerCell}</td>
        <td><span class="sale-mode-badge">${modeLabel}</span></td>
        <td class="num-col">${fmtKg(d.weightKg || 0)}</td>
        <td class="num-col">${fmtKg(avgWeight)}</td>
        <td class="num-col">${fmtPriceKg(pricePerKg)}</td>
        <td class="num-col">${fmtVal(valuePerHead)}</td>
        <td class="num-col fin-value">${currBadge} ${fmtVal(m.value)}</td>
        <td class="movement-actions-cell">
          <button class="movement-action-btn edit-btn" data-farm-id="${escapeHtml(m._farmId)}" data-movement-id="${escapeHtml(m.id)}">Editar</button>
          <button class="movement-action-btn delete-btn" data-farm-id="${escapeHtml(m._farmId)}" data-movement-id="${escapeHtml(m.id)}">Excluir</button>
        </td>
      </tr>`;
    }).join("");

    elements.vendasTableBody.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openEditMovementDialog(btn.dataset.farmId, btn.dataset.movementId));
    });
    elements.vendasTableBody.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteMovement(btn.dataset.farmId, btn.dataset.movementId));
    });
  }

  if (elements.vendasHistoryPagination) {
    if (totalPages <= 1) {
      elements.vendasHistoryPagination.innerHTML = total > 0 ? `<span class="pagination-info">${total} registro${total !== 1 ? "s" : ""}</span>` : "";
    } else {
      elements.vendasHistoryPagination.innerHTML = `
        <span class="pagination-info">${total} registros</span>
        <button type="button" class="ghost-btn" id="vendasPagePrev" ${page === 0 ? "disabled" : ""}>&#8592; Anterior</button>
        <span class="pagination-info">Página ${page + 1} de ${totalPages}</span>
        <button type="button" class="ghost-btn" id="vendasPageNext" ${page >= totalPages - 1 ? "disabled" : ""}>Próxima &#8594;</button>
      `;
      document.getElementById("vendasPagePrev")?.addEventListener("click", () => { runtime.vendasPage = Math.max(0, page - 1); renderVendasTable(); });
      document.getElementById("vendasPageNext")?.addEventListener("click", () => { runtime.vendasPage = Math.min(totalPages - 1, page + 1); renderVendasTable(); });
    }
  }
}

async function exportVendasPdfReport() {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("A biblioteca de PDF não foi carregada. Verifique sua conexão e tente novamente.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const isTotalView = state.data.selectedFarmId === TOTAL_FARM_ID;
  const farms = isTotalView ? getAllFarms() : [getFarm()].filter(Boolean);
  if (!farms.length) { alert("Nenhuma fazenda encontrada."); return; }

  const year = String(state.filters.year);
  const month = state.filters.month;
  const periodLabel = month === "all" ? `Ano ${year}` : `${MONTH_NAMES[Number(month) - 1]}/${year}`;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let firstPage = true;

  await appendPdfCoverPage(doc, farms, periodLabel, "Relatório de Vendas");
  doc.addPage();

  for (const farm of farms) {
    if (!firstPage) doc.addPage();
    firstPage = false;

    const vendas = farm.movements.filter((m) => {
      if (m.type !== "venda") return false;
      const d = m.date || "";
      if (!d.startsWith(year)) return false;
      if (month !== "all" && d.slice(5, 7) !== String(month).padStart(2, "0")) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalCabecas = vendas.reduce((s, m) => s + Number(m.quantity || 0), 0);
    const totalValor = vendas.reduce((s, m) => s + Number(m.value || 0), 0);
    const totalKg = vendas.reduce((s, m) => s + Number(m.saleDetails?.weightKg || 0), 0);
    const currency = getFarmCurrency(farm.id);
    const sym = currency === "USD" ? "US$" : "R$";
    const fmtVal = (v) => v > 0 ? `${sym} ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}` : "—";

    if (isTotalView) {
      appendPdfFarmReportDivider(doc, farm, periodLabel, "Relatório de Vendas", [
        { label: "Operações", value: String(vendas.length) },
        { label: "Cabeças", value: formatInteger(totalCabecas) },
        { label: "Receita", value: fmtVal(totalValor) }
      ], farms.indexOf(farm) + 1, farms.length);
      doc.addPage();
    }

    try { const logoData = await loadLogoForPdf("#ffffff"); doc.addImage(logoData, "JPEG", margin, 8, 18, 18); } catch (e) { /* ignore */ }
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(45, 35, 25);
    doc.text("Relatório de Vendas", margin + 22, 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(87, 69, 52);
    doc.text(`Fazenda: ${farm.name}   Período: ${periodLabel}   Responsável: ${TECHNICAL_MANAGER_NAME}`, margin + 22, 22);
    doc.setDrawColor(140, 80, 45); doc.setLineWidth(0.6); doc.line(margin, 27, pageW - margin, 27);

    let xBox = margin;
    const boxW = 58, boxH = 16, boxY = 30;
    [
      { label: "Operações", value: String(vendas.length) },
      { label: "Cabeças vendidas", value: formatInteger(totalCabecas) },
      { label: `Receita (${currency})`, value: fmtVal(totalValor) },
      { label: "Kg negociados", value: totalKg > 0 ? `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(totalKg)} kg` : "—" },
      { label: "Média/cabeça", value: totalCabecas > 0 ? fmtVal(totalValor / totalCabecas) : "—" }
    ].forEach((kpi) => {
      doc.setFillColor(250, 244, 234); doc.setDrawColor(200, 185, 160); doc.setLineWidth(0.3);
      doc.roundedRect(xBox, boxY, boxW - 2, boxH, 2, 2, "FD");
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
      doc.text(kpi.value, xBox + (boxW - 2) / 2, boxY + 6.5, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(100, 80, 55);
      doc.text(kpi.label, xBox + (boxW - 2) / 2, boxY + 13, { align: "center" });
      xBox += boxW;
    });

    if (!vendas.length) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(130, 110, 90);
      doc.text("Nenhuma venda registrada neste período.", margin, boxY + boxH + 10);
      continue;
    }

    const tableStartY = boxY + boxH + 8;
    const cols = [
      { header: "Código", w: 20 }, { header: "Data", w: 18 }, { header: "Categoria", w: 30 },
      { header: "Cab.", w: 12, align: "right" }, { header: "Frigorífico/Comprador", w: 40 },
      { header: "Base", w: 16 },
      { header: "Kg Lote", w: 20, align: "right" }, { header: "P.Méd(kg)", w: 18, align: "right" },
      { header: `${sym}/kg`, w: 20, align: "right" }, { header: `${sym}/Animal`, w: 26, align: "right" },
      { header: `Valor (${currency})`, w: 0, align: "right" }
    ];
    cols[cols.length - 1].w = Math.max(18, pageW - margin * 2 - cols.slice(0, -1).reduce((s, c) => s + c.w, 0));

    let curX = margin; const rowH = 7;
    doc.setFillColor(45, 35, 25); doc.rect(margin, tableStartY, pageW - margin * 2, rowH, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
    cols.forEach((col) => {
      doc.text(col.header, col.align === "right" ? curX + col.w - 2 : curX + 2, tableStartY + 4.8, { align: col.align === "right" ? "right" : "left" });
      curX += col.w;
    });

    let rowY = tableStartY + rowH;
    const maxY = doc.internal.pageSize.getHeight() - margin - 8;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);

    vendas.forEach((m, idx) => {
      if (rowY + rowH > maxY) { doc.addPage(); rowY = margin + 8; }
      const sd = m.saleDetails || {};
      const buyer = sd.buyer || extractBuyerFromNotes(m.notes) || "—";
      const pricePerKg = sd.pricePerKg || (sd.weightKg > 0 && m.value > 0 ? m.value / sd.weightKg : 0);
      if (idx % 2 === 0) { doc.setFillColor(249, 244, 236); doc.rect(margin, rowY, pageW - margin * 2, rowH, "F"); }
      doc.setTextColor(30, 30, 30);
      const avgWt  = sd.weightKg > 0 && m.quantity > 0 ? sd.weightKg / m.quantity : 0;
      const vph    = sd.valuePerHead || (m.quantity > 0 && m.value > 0 ? m.value / m.quantity : 0);
      const numFmt = (v, dec = 2) => v > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v) : "—";
      const rowVals = [
        m.code || "—", formatDate(m.date), (m.categoryName || "—").slice(0, 18),
        formatInteger(m.quantity), buyer.slice(0, 24),
        sd.mode ? getSaleModeLabel(sd.mode) : "—",
        sd.weightKg > 0 ? numFmt(sd.weightKg, 0) : "—",
        avgWt > 0 ? numFmt(avgWt, 1) : "—",
        pricePerKg > 0 ? numFmt(pricePerKg, 3) : "—",
        vph > 0 ? numFmt(vph, 2) : "—",
        m.value > 0 ? numFmt(m.value, 2) : "—"
      ];
      curX = margin;
      rowVals.forEach((val, ci) => {
        const col = cols[ci]; const isRight = col.align === "right";
        doc.text(String(val), isRight ? curX + col.w - 2 : curX + 2, rowY + 4.8, { align: isRight ? "right" : "left", maxWidth: col.w - 3 });
        curX += col.w;
      });
      doc.setDrawColor(220, 210, 195); doc.setLineWidth(0.15);
      doc.line(margin, rowY + rowH, pageW - margin, rowY + rowH);
      rowY += rowH;
    });

    doc.setDrawColor(120, 80, 40); doc.setLineWidth(0.5); doc.line(margin, rowY, pageW - margin, rowY);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(30, 30, 30);
    doc.text(`Total: ${formatInteger(totalCabecas)} cab.   ${fmtVal(totalValor)}`, pageW - margin - 60, rowY + 5);
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(160, 140, 120);
    doc.text(`Página ${i} de ${pageCount}`, pageW - margin, doc.internal.pageSize.getHeight() - 5, { align: "right" });
    doc.text(`Fazendas Da Bruna — Relatório de Vendas — ${periodLabel}`, margin, doc.internal.pageSize.getHeight() - 5);
  }

  doc.save(`vendas-${isTotalView ? "todas-fazendas" : farms[0]?.name?.toLowerCase().replace(/\s+/g, "-") || "fazenda"}-${periodLabel.replace(/\//g, "-")}.pdf`);
}
