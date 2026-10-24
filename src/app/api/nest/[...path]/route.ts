import { ensureBackend, isBackendUp } from '@/lib/backend-manager';

export const dynamic = 'force-dynamic';

/**
 * Universal proxy to the NestJS API (mini-services/isusu-api on port 4000).
 *
 * Works from EVERYWHERE — direct localhost:3000, the Caddy gateway preview URL,
 * or any deployed origin — because the forwarding happens server-side.
 * Also self-heals: boots the NestJS service if it is not running.
 */

const API_BASE = 'http://localhost:4000/api/v1';

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params;
  const url = new URL(request.url);
  const qs = url.search && !url.search.startsWith('?XTransformPort') ? url.search : '';
  const target = `${API_BASE}/${(path || []).join('/')}${qs}`;

  // Self-healing: make sure the NestJS service is up (fast check, boot if needed)
  if (!(await isBackendUp(400))) {
    await ensureBackend(25000);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = request.headers.get('authorization');
  if (auth) headers.Authorization = auth;

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };
  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = await request.text();
  }

  try {
    const res = await fetch(target, { ...init, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return Response.json(
      { statusCode: 503, message: 'iSusuPro API (NestJS) is not reachable. Run: cd mini-services/isusu-api && bun run dev' },
      { status: 503 },
    );
  }
}

export async function GET(request: Request, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function POST(request: Request, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function PUT(request: Request, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function PATCH(request: Request, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function DELETE(request: Request, ctx: Ctx) {
  return proxy(request, ctx);
}
