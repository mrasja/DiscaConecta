import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min por IP
});

export async function middleware(request: NextRequest) {
  // Rate limiting en rutas API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 
           request.headers.get('x-real-ip') ?? 
           '127.0.0.1';
    const { success, limit, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, {
        status: 429,
        headers: { 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': String(remaining) }
      });
    }
  }
  // Rutas protegidas
  const protectedPaths = ['/dashboard', '/profile', '/register-professional'];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));
  if (isProtected) {
    const token = request.cookies.get('session')?.value;
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/api/:path*', '/dashboard/:path*', '/profile/:path*'] };