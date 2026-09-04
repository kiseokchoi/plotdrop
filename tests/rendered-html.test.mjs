import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the PlotSift application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="en">/i);
  assert.match(html, /<title>PlotSift — Local Graph Digitizer<\/title>/i);
  assert.match(html, /Processed locally/);
  assert.match(html, /Open image/);
  assert.match(html, /Extracted data/);
  assert.match(html, /Ctrl\/⌘/);
  assert.match(html, /Y error/);
  assert.match(html, /＋ Sheet/);
  assert.match(html, /<option value="auto" selected="">Auto<\/option>/);
});

test("keeps the research extraction, standalone, and PWA features wired", async () => {
  const [page, desktopEntry, tauriConfig, manifestSource, viteConfig, license] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../desktop/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../vite.desktop.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../LICENSE", import.meta.url), "utf8"),
  ]);

  assert.match(page, /event\.ctrlKey\s*\|\|\s*event\.metaKey/);
  assert.match(page, /extractionScope === "brush"/);
  assert.match(page, /spacingMode === "adaptive"/);
  assert.match(page, /addDataSheet/);
  assert.match(page, /plotsift-language/);
  assert.match(page, /window\.addEventListener\("languagechange", followSystemLanguage\)/);
  assert.match(page, /import\("@tauri-apps\/plugin-dialog"\)/);
  assert.match(page, /writeTextFile\(path, contents\)/);
  assert.match(desktopEntry, /<Home \/>/);
  assert.match(desktopEntry, /serviceWorker\.register\("\.\/sw\.js"\)/);
  assert.equal(JSON.parse(tauriConfig).productName, "PlotSift");
  const manifest = JSON.parse(manifestSource);
  assert.equal(manifest.short_name, "PlotSift");
  assert.equal(manifest.display, "standalone");
  assert.match(viteConfig, /offlineServiceWorker/);
  assert.match(viteConfig, /base: "\.\/"/);
  assert.match(license, /Apache License\s+Version 2\.0/);
});
