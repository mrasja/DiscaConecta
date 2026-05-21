import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const prof = await prisma.professionals.findFirst({ where: { user_id: user.id } });
    if (!prof) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });

    const [reviewStats, favoriteCount, conversationCount] = await Promise.all([
      prisma.reviews.aggregate({
        where: { target_type: 'professional', target_id: prof.id },
        _avg:   { rating: true },
        _count: { id: true },
      }),
      prisma.favorites.count({
        where: { target_type: 'professional', target_id: prof.id },
      }),
      prisma.conversations.count({
        where: {
          OR: [
            { participant_a: user.id },
            { participant_b: user.id },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      avgRating:         reviewStats._avg.rating ? parseFloat(reviewStats._avg.rating.toFixed(1)) : null,
      reviewCount:       reviewStats._count.id,
      favoriteCount,
      conversationCount,
      isVerified:        prof.is_verified,
      verificationStatus: prof.verification_status,
      isAvailable:       prof.is_available,
    });
  } catch (error) {
    console.error('Error GET /api/professionals/stats:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
