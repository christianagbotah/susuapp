import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Server-side manager for the NestJS backend (mini-services/isusu-api).
 *
 * In this sandbox the Next.js dev server is the only persistent process,
 * so the NestJS API (port 4000) is spawned as a detached child of it and
 * health-checked. On sandbox restarts the system supervisor (.zscripts/dev.sh)
 * starts the API automatically via its `dev` script.
 */

const API_HEALTH = 'http://localhost:4000/api/v1/health';
const API_DIR = path.join(process.cwd(), 'mini-services', 'isusu-api');
const API_LOG = path.join(API_DIR, 'api.log');

let spawning = false;
let lastSpawnAt = 0;

export async function isBackendUp(timeoutMs = 800): Promise<boolean> {
  try {
    const res = await fetch(API_HEALTH, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

export function spawnBackend(): void {
  // Avoid double-spawn within 30s
  if (spawning || Date.now() - lastSpawnAt < 30_000) return;
  spawning = true;
  lastSpawnAt = Date.now();

  try {
    const out = fs.openSync(API_LOG, 'a');
    const child = spawn('bun', ['run', 'start'], {
      cwd: API_DIR,
      detached: true,
      stdio: ['ignore', out, out],
      env: { ...process.env, PORT: '4000' },
    });
    child.unref();
    child.on('error', () => {
      spawning = false;
    });
  } catch {
    spawning = false;
  }
}

export async function ensureBackend(maxWaitMs = 25000): Promise<{ running: boolean }> {
  if (await isBackendUp()) return { running: true };
  spawnBackend();
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isBackendUp(600)) return { running: true };
  }
  return { running: false };
}
