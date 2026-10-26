#!/usr/bin/env node
/**
 * iSusuPro — Native shell builder (Capacitor + Tauri)
 * ----------------------------------------------------
 * The Next.js app is server-dependent (API routes + NestJS backend + Prisma),
 * so the native Android/iOS/desktop shells load the HOSTED server URL.
 *
 * This script generates `dist/` — a tiny branded bootstrap shell that:
 *   1. Shows the iSusuPro splash while connecting
 *   2. Redirects the WebView to the configured server (APP_SERVER_URL)
 *   3. Falls back to a branded offline screen when the device is offline
 *
 * The same `dist/` serves as:
 *   • Capacitor `webDir` (fallback assets; runtime uses server.url)
 *   • Tauri `frontendDist` (window loads dist/index.html which redirects)
 *
 * Usage:
 *   APP_SERVER_URL=https://isusupro.com bun run shell:build
 *
 * Env precedence:
 *   APP_SERVER_URL > CAP_SERVER_URL > TAURI_SERVER_URL > default
 */

import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');

// ---- Resolve target server URL -------------------------------------------------

const DEFAULT_SERVER_URL = 'https://isusupro.com';
const serverUrl =
  process.env.APP_SERVER_URL ||
  process.env.CAP_SERVER_URL ||
  process.env.TAURI_SERVER_URL ||
  DEFAULT_SERVER_URL;

// Basic validation
try {
  const parsed = new URL(serverUrl);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('must be http(s)');
} catch {
  console.error(`✗ Invalid APP_SERVER_URL: "${serverUrl}" — must be a full http(s) URL`);
  process.exit(1);
}

// ---- Shell HTML ----------------------------------------------------------------

const splashHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>iSusuPro</title>
  <meta name="theme-color" content="#059669" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%);
      color: #fff;
      padding: 24px;
    }
    .card { max-width: 420px; text-align: center; }
    .logo {
      width: 88px; height: 88px; margin: 0 auto 20px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 24px;
      backdrop-filter: blur(8px);
    }
    .logo svg { width: 44px; height: 44px; }
    h1 { font-size: 26px; letter-spacing: -0.02em; margin-bottom: 6px; }
    .sub { font-size: 13px; opacity: 0.85; margin-bottom: 28px; }
    .spinner {
      width: 32px; height: 32px; margin: 0 auto 16px;
      border: 3px solid rgba(255,255,255,0.25);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status { font-size: 13px; opacity: 0.8; }
    .offline { display: none; }
    .offline .card2 {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 28px 24px;
      margin-top: 4px;
    }
    .offline p { font-size: 13px; line-height: 1.6; opacity: 0.9; margin: 12px 0 18px; }
    .offline button {
      width: 100%; padding: 13px; border: none; border-radius: 13px;
      background: #fff; color: #065f46; font-size: 15px; font-weight: 700; cursor: pointer;
    }
    .err { color: #fde68a; font-size: 11px; margin-top: 14px; word-break: break-all; opacity: 0.75; }
  </style>
</head>
<body>
  <div class="card">
    <!-- Connecting state -->
    <div class="connecting" id="connecting">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/>
        </svg>
      </div>
      <h1>iSusuPro</h1>
      <p class="sub">Ghana's Susu &amp; Microfinance Platform</p>
      <div class="spinner"></div>
      <p class="status" id="status">Connecting…</p>
    </div>

    <!-- Offline state -->
    <div class="offline" id="offline">
      <div class="card2">
        <h1 style="font-size:20px">You're offline</h1>
        <p>iSusuPro can't reach the internet right now. Pending collections are saved on this device and will sync when you reconnect.</p>
        <button onclick="location.reload()">Try Again</button>
        <p class="err" id="err"></p>
      </div>
    </div>
  </div>

  <script>
    (function () {
      var TARGET = ${JSON.stringify(serverUrl)};
      var statusEl = document.getElementById('status');
      var connectingEl = document.getElementById('connecting');
      var offlineEl = document.getElementById('offline');
      var errEl = document.getElementById('err');

      function showOffline(msg) {
        if (msg && errEl) errEl.textContent = msg;
        connectingEl.style.display = 'none';
        offlineEl.style.display = 'block';
      }

      if (!navigator.onLine) { showOffline(); return; }

      // Probe the server, then navigate the WebView to it.
      // A fetch probe lets us show the branded offline screen instead of the
      // WebView's raw connection-error page.
      var timer = setTimeout(function () { go(); }, 4000); // probe timeout → just try navigating

      function go() {
        clearTimeout(timer);
        try { window.location.replace(TARGET); } catch (e) { showOffline(String(e)); }
      }

      fetch(TARGET, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
        .then(function () { go(); })
        .catch(function () {
          // Probe failed — could be CORS opacity or a real outage; retry once, then navigate.
          if (statusEl) statusEl.textContent = 'Still connecting…';
          setTimeout(go, 1500);
        });
    })();
  </script>
</body>
</html>
`;

// ---- Write dist/ ---------------------------------------------------------------

mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, 'index.html'), splashHtml);

// Copy shared PWA assets (icons + manifest) so the shell is self-contained
const assets = ['manifest.json', 'logo.svg', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png'];
for (const asset of assets) {
  const src = join(PUBLIC, asset);
  if (existsSync(src)) copyFileSync(src, join(DIST, asset));
}

console.log(`✓ Native shell built → dist/`);
console.log(`  • Target server: ${serverUrl}`);
console.log(`  • Assets: index.html (bootstrap) + ${assets.filter((a) => existsSync(join(PUBLIC, a))).length} copied from public/`);
if (serverUrl === DEFAULT_SERVER_URL) {
  console.log(`  ⚠ Using default ${DEFAULT_SERVER_URL} — override with APP_SERVER_URL=<your-deployment>`);
}
