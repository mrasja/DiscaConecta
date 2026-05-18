import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/professionals/route';
import { NextRequest } from 'next/server';

const mockProfessionals = [
  {
    id: 'prof-1',
    user_id: 'user-1',
    full_name: 'Ana García',
    profession: 'psicologo',
    city: 'Buenos Aires',
    province: 'Buenos Aires',
    is_verified: true,
    is_available: true,
    specialties: ['tea'],
    work_zones: [],
    bio: 'Psicóloga especialista en TEA',
    avg_rating: 4.5,
    review_count: 8,
    location_text: null,
    distancia_km: null,
    contact_phone: null,
    contact_whatsapp: '5491122334455',
    avatar_url: null,
    email: 'ana@test.com',
    firebase_uid: 'uid-1',
  },
];

vi.mock('@/lib/prisma', () => ({
  prisma: { $queryRaw: vi.fn() },
}));

describe('GET /api/professionals', () => {
  beforeEach(async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.$queryRaw).mockResolvedValue(mockProfessionals);
  });

  it('devuelve lista de profesionales', async () => {
    const req = new NextRequest(
      'http://localhost/api/professionals?city=Buenos+Aires&province=Buenos+Aires'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].profession).toBe('psicologo');
  });

  it('devuelve 500 si la DB falla', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('DB error'));
    const req = new NextRequest('http://localhost/api/professionals');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('acepta filtro por profesión', async () => {
    const req = new NextRequest(
      'http://localhost/api/professionals?city=Buenos+Aires&profession=psicologo'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('acepta filtro solo verificados', async () => {
    const req = new NextRequest(
      'http://localhost/api/professionals?city=Buenos+Aires&isVerifiedOnly=true'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
