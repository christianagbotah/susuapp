import { ensureBackend, isBackendUp } from '@/lib/backend-manager';

export const dynamic = 'force-dynamic';

/**
 * Backend bootstrap endpoint.
 * GET /api/backend          → ensures the NestJS API (port 4000) is running, waits if starting.
 * GET /api/backend?check=1  → quick status check only (no spawn).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('check')) {
    const running = await isBackendUp();
    return Response.json({ running });
  }
  const result = await ensureBackend();
  return Response.json({
    ...result,
    api: 'http://localhost:4000/api/v1',
    swagger: '/api/v1/docs?XTransformPort=4000',
    service: 'isusu-api (NestJS)',
  });
}
