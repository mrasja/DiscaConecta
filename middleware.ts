import { NextRequest, NextResponse } from 'next/server';

// Rate limiting — activo solo si hay Upstash configurado en env
let ratelimit: { limit: (id: string) => Promise<{ success: boolean }> } | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Ratelimit } = require('@upstash/ratelimit');
  const { Redis }     = require('@upstash/redis');
  ratelimit = new Ratelimit({
    redis:   Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min por IP
  });
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
