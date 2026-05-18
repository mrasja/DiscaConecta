import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target_type = searchParams.get('target_type');
  const target_id   = searchParams.get('target_id');
  if (!target_type || !target_id)
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

  const reviews = await prisma.reviews.findMany({
    where: { target_type, target_id },
    include: { reviewer: { select: { full_name: true, avatar_url: true } } },
    orderBy: { created_at: 'desc' },
  });

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length
    : null;

  return NextResponse.json({ reviews, avg, count: reviews.length });
}

export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { target_type, target_id, rating, comment } = await request.json();
  if (!target_type || !target_id || !rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const existing = await prisma.reviews.findFirst({
    where: { reviewer_id: user.id, target_type, target_id },
  });

  if (existing) {
    const updated = await prisma.reviews.update({
      where: { id: existing.id },
      data: { rating, comment: comment || null },
    });
    return NextResponse.json(updated);
  }

  const review = await prisma.reviews.create({
    data: { reviewer_id: user.id, target_type, target_id, rating, comment: comment || null },
  });
  return NextResponse.json(review, { status: 201 });
}
