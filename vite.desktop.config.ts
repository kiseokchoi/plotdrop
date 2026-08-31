import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function offlineServiceWorker(): Plugin {
  return {
    name: "plotdrop-offline-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
      const bundledFiles = Object.keys(bundle).sort();
      const version = bundledFiles
        .join("|")
        .split("")
        .reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 0)
        .toString(36);
      const files = [
        "./",
        "./index.html",
        "./manifest.webmanifest",
        "./favicon.svg",
        "./icon-192.png",
        "./icon-512.png",
        ...bundledFiles.map((file) => `./${file}`),
      ];
      const source = `const CACHE_PREFIX = "plotdrop-web-";
const CACHE_NAME = CACHE_PREFIX + ${JSON.stringify(version)};
const APP_FILES = ${JSON.stringify(files, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    })),
  );
});
`;

      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig(({ mode }) => ({
  root: "desktop",
  base: "./",
  publicDir: "../public",
  plugins: [react(), ...(mode === "pwa" ? [offlineServiceWorker()] : [])],
  clearScreen: false,
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir: "../desktop-dist",
    emptyOutDir: true,
  },
}));

