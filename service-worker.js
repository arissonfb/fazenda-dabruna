// Service Worker do Painel Wolf Pecuária.
// Guarda o "app shell" em cache para o sistema abrir mesmo sem internet
// (principalmente quando instalado via "Adicionar à Tela de Início" no
// iOS/Android). Os dados continuam sendo lidos/gravados via localStorage
// e sincronizados com a API pelo próprio app.js — este arquivo não mexe
// em dados, só nos arquivos estáticos (HTML/CSS/JS/ícones).
//
// IMPORTANTE: sempre que os números de versão (?v=...) em index.html
// forem atualizados em um novo deploy, bump também o CACHE_VERSION
// abaixo e a lista PRECACHE_URLS. Sem isso, quem estiver offline pode
// ficar preso numa versão antiga do painel.
const CACHE_VERSION = "wolf-shell-20260725a";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./bruna.css",
  "./styles.css?v=20260725a",
  "./app.js?v=20260725a",
  "./bruna-extras.js?v=20260714a",
  "./pastagens.js?v=20260712c",
  "./eventos.js?v=20260711a",
  "./alambrado.js?v=20260711a",
  "./assets/jspdf.umd.min.js",
  "./assets/jspdf.autotable.min.js",
  "./assets/wolf-seal.jpg",
  "./assets/wolf-banner-hero.png",
  "./assets/wolf-bull-only.png",
];

// Bibliotecas de CDN usadas pelo app (graficos e exportacao Excel). Sao
// versoes fixas (pinadas no numero da versao na propria URL), entao cache
// permanente por versao e seguro — precisam ser precarregadas a parte
// porque tem origem diferente do site.
const PRECACHE_CDN_URLS = [
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => Promise.all([
        cache.addAll(PRECACHE_URLS),
        cache.addAll(PRECACHE_CDN_URLS.map((url) => new Request(url, { mode: "cors" }))),
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isPinnedCdn = PRECACHE_CDN_URLS.includes(request.url);
  if (url.origin !== self.location.origin && !isPinnedCdn) return;

  // Arquivos com "?v=" ou libs de CDN pinadas por versao: cache-first.
  if (url.searchParams.has("v") || isPinnedCdn) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      }))
    );
    return;
  }

  // Navegacao (abrir/recarregar a pagina) e demais arquivos sem versao:
  // tenta a rede primeiro para pegar o HTML mais novo; se estiver
  // offline, cai para o cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
  );
});
