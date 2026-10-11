import { describe, it, expect, vi, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reviews: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-server', () => ({
  verifyToken: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';
import { POST, GET } from '@/app/api/reviews/route';

describe('POST /api/reviews', () => {
  it('retorna 401 sin token', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null as any);
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ target_type: 'professional', target_id: '11111111-1111-4111-8111-111111111111', rating: 5 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 si rating está fuera de rango', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(prisma.reviews.findFirst).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ target_type: 'professional', target_id: '11111111-1111-4111-8111-111111111111', rating: 10 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('crea reseña correctamente', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(prisma.reviews.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.reviews.create).mockResolvedValue({ id: 'rev-1', rating: 5 } as any);
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ target_type: 'professional', target_id: '22222222-2222-4222-8222-222222222222', rating: 5, comment: 'Excelente' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

describe('GET /api/reviews', () => {
  it('retorna reseñas de un profesional', async () => {
    const mockReviews = [{ id: 'rev-1', rating: 5, comment: 'Muy bueno', target_type: 'professional', target_id: 'prof-1' }];
    vi.mocked(prisma.reviews.findMany).mockResolvedValue(mockReviews as any);
    const req = new NextRequest('http://localhost/api/reviews?target_type=professional&target_id=prof-1');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.reviews).toHaveLength(1);
    expect(data.reviews[0].rating).toBe(5);
    expect(data.avg).toBe(5);
  });
});
