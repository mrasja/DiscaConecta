import { NextRequest, NextResponse } from 'next/server';

let ratelimit: { limit: (id: string) => Promise<{ success: boolean }> } | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Rate limiting distribuido — recomendado para producción (persiste entre
  // instancias/regiones). Configurar UPSTASH_REDIS_REST_URL/TOKEN en el .env.
  const { Ratelimit } = require('@upstash/ratelimit');
  const { Redis }     = require('@upstash/redis');
  ratelimit = new Ratelimit({
    redis:   Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min por IP
  });
} else {
  // Fallback en memoria mientras no haya Upstash configurado: más débil (se
  // reinicia en cada cold start y no se comparte entre instancias), pero es
  // mejor que no tener ningún límite en producción por falta de credenciales.
  const hits = new Map<string, { count: number; resetAt: number }>();
  const WINDOW_MS = 60_000;
  const MAX_REQUESTS = 60; // 60 req/min por IP o usuario, igual que el límite de Upstash

  ratelimit = {
    limit: async (id: string) => {
      const now = Date.now();
      const entry = hits.get(id);
      if (!entry || now > entry.resetAt) {
        hits.set(id, { count: 1, resetAt: now + WINDOW_MS });
        return { success: true };
      }
      entry.count++;
      return { success: entry.count <= MAX_REQUESTS };
    },
  };

  // Evita que el Map crezca sin límite en procesos de larga duración.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (now > entry.resetAt) hits.delete(key);
  }, 5 * 60_000);
  (cleanup as unknown as { unref?: () => void }).unref?.();
}

function extractUserId(request: NextRequest): string | null {
  try {
    const auth = request.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.uid ?? payload.sub ?? null;
  } catch { return null; }
}

export async function middleware(request: NextRequest) {
  if (ratelimit && request.nextUrl.pathname.startsWith('/api/')) {
    const userId = extractUserId(request);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? request.headers.get('x-real-ip')
            ?? '127.0.0.1';
    const identifier = userId ? `user_${userId}` : `ip_${ip}`;
    const { success } = await ratelimit.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Esperá un momento.' },
        { status: 429 }
      );
    }
  }

  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=self, microphone=(), geolocation=self');
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  return res;
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
