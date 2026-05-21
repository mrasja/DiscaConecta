import { describe, it, expect, vi, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn().mockResolvedValue(1),
    professionals: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-server', () => ({
  verifyToken: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';
import { GET, POST } from '@/app/api/professionals/route';

const mockProf = {
  id: 'prof-1',
  user_id: 'user-1',
  full_name: 'Test Professional',
  profession: 'psicologo',
  city: 'Buenos Aires',
  is_available: true,
  is_verified: true,
  avg_rating: 4.5,
  review_count: 10,
};

describe('GET /api/professionals', () => {
  it('devuelve lista de profesionales', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([mockProf]);
    const req = new NextRequest('http://localhost/api/professionals?city=Buenos+Aires');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].profession).toBe('psicologo');
  });

  it('devuelve array vacío si no hay resultados', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
    const req = new NextRequest('http://localhost/api/professionals?city=CiudadInexistente');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('devuelve 500 si la DB falla', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('DB error'));
    const req = new NextRequest('http://localhost/api/professionals');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/professionals', () => {
  it('retorna 401 sin token', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/professionals', {
      method: 'POST',
      body: JSON.stringify({ profession: 'psicologo' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('crea perfil nuevo si no existe', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(prisma.professionals.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.professionals.create).mockResolvedValue({ id: 'prof-new', profession: 'psicologo' } as any);
    const req = new NextRequest('http://localhost/api/professionals', {
      method: 'POST',
      body: JSON.stringify({ profession: 'psicologo', city: 'Buenos Aires', province: 'Buenos Aires' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('actualiza perfil existente', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(prisma.professionals.findFirst).mockResolvedValue({ id: 'prof-1' } as any);
    vi.mocked(prisma.professionals.update).mockResolvedValue({ id: 'prof-1', profession: 'fonoaudiologo' } as any);
    const req = new NextRequest('http://localhost/api/professionals', {
      method: 'POST',
      body: JSON.stringify({ profession: 'fonoaudiologo' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.profession).toBe('fonoaudiologo');
  });
});
