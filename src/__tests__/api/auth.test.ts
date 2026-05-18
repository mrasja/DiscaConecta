import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-server', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    professionals: {
      findFirst: vi.fn().mockResolvedValue(null),
      create:    vi.fn().mockResolvedValue({ id: 'new-prof-1' }),
    },
    $executeRaw: vi.fn().mockResolvedValue(1),
  },
}));

describe('POST /api/professionals — autenticación', () => {
  it('rechaza requests sin token', async () => {
    const { verifyToken } = await import('@/lib/auth-server');
    vi.mocked(verifyToken).mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/professionals/route');
    const req = new NextRequest('http://localhost/api/professionals', {
      method: 'POST',
      body: JSON.stringify({ profession: 'psicologo', city: 'Buenos Aires' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('crea profesional con token válido', async () => {
    const { verifyToken } = await import('@/lib/auth-server');
    vi.mocked(verifyToken).mockResolvedValueOnce({ id: 'user-1', role: 'profesional' } as any);

    const { POST } = await import('@/app/api/professionals/route');
    const req = new NextRequest('http://localhost/api/professionals', {
      method: 'POST',
      body: JSON.stringify({
        profession: 'psicologo',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        specialties: ['tea'],
        workZones: [],
        isAvailable: true,
      }),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
