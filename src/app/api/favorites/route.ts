import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

    if (fav.target_type === 'association') {
      const asociacion = await prisma.asociaciones.findUnique({
        where: { id: fav.target_id },
        select: { id: true, nombre: true, localidad: true, provincia: true, logo_url: true, is_verified: true },
      });
      return {
        ...fav,
        detail: asociacion ? {
          name:       asociacion.nombre,
          subtitle:   'Asociación',
          location:   `${asociacion.localidad}, ${asociacion.provincia}`,
          avatar:     asociacion.logo_url ?? null,
          isVerified: asociacion.is_verified,
          href:       `/asociacion/${asociacion.id}`,
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

const FavoriteSchema = z.object({
  target_type: z.enum(['professional', 'center', 'association']),
  target_id:   z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const parsed = FavoriteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const { target_type, target_id } = parsed.data;

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
