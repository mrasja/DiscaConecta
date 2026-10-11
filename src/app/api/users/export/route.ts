import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [profile, professional, student, reviews, savedSearches, favorites] = await Promise.all([
    prisma.users.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, full_name: true, role: true,
        created_at: true, terms_accepted_at: true,
      },
    }),
    prisma.professionals.findFirst({ where: { user_id: user.id } }),
    prisma.students.findFirst({ where: { user_id: user.id } }),
    prisma.reviews.findMany({ where: { reviewer_id: user.id } }),
    prisma.saved_searches.findMany({ where: { user_id: user.id } }),
    prisma.favorites.findMany({ where: { user_id: user.id } }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    notice: 'Exportación de datos personales conforme a la Ley 25.326 (Argentina)',
    profile,
    professional,
    student,
    reviews,
    savedSearches,
    favorites,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="discaconecta-mis-datos-${Date.now()}.json"`,
    },
  });
}
