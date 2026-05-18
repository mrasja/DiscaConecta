import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const favorites = await prisma.favorites.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
  });

  // Enriquecer cada favorito con los datos del recurso
  const resolved = await Promise.all(favorites.map(async (fav) => {
    if (fav.target_type === 'professional') {
      const prof = await prisma.professionals.findUnique({
        where: { id: fav.target_id },
        select: {
          id: true, profession: true, city: true, province: true, is_verified: true,
          user: { select: { full_name: true, avatar_url: true } },
        },
      });
      return {
        ...fav,
        detail: prof ? {
          name:       prof.user?.full_name ?? 'Profesional',
          subtitle:   prof.profession.replace(/_/g, ' '),
          location:   `${prof.city}, ${prof.province}`,
          avatar:     prof.user?.avatar_url ?? null,
          isVerified: prof.is_verified,
          href:       `/profesional/${prof.id}`,
        } : null,
      };
    }

    // Centro
    const center = await prisma.centros_terapeuticos.findUnique({
      where: { id: fav.target_id },
      select: { id: true, nombre: true, tipo: true, localidad: true, provincia: true, logo_url: true, is_verified: true },
    });
    return {
      ...fav,
      detail: center ? {
        name:       center.nombre,
        subtitle:   center.tipo?.replace(/_/g, ' ') ?? 'Centro',
        location:   `${center.localidad}, ${center.provincia}`,
        avatar:     center.logo_url ?? null,
        isVerified: center.is_verified,
        href:       null,
      } : null,
    };
  }));

  return NextResponse.json(resolved);
}

export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { target_type, target_id } = await request.json();
  if (!target_type || !target_id)
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const existing = await prisma.favorites.findFirst({
    where: { user_id: user.id, target_type, target_id },
  });

  if (existing) {
    await prisma.favorites.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorites.create({
    data: { user_id: user.id, target_type, target_id },
  });
  return NextResponse.json({ favorited: true });
}
