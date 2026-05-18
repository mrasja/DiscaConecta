import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, isAdminUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [
      totalUsers,
      totalStudents,
      totalProfessionals,
      totalEscuelas,
      totalCentros,
      pendingVerifications,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.students.count(),
      prisma.professionals.count(),
      prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as count FROM escuelas_especiales WHERE is_active = TRUE`,
      prisma.centros_terapeuticos.count({ where: { is_active: true } }),
      prisma.professionals.count({ where: { is_verified: false } }),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [activeThisWeek, searchesToday] = await Promise.all([
      prisma.audit_logs.groupBy({
        by: ['user_id'],
        where: { created_at: { gte: sevenDaysAgo } }
      }).then(g => g.length),
      prisma.audit_logs.count({
        where: { action: { startsWith: 'SEARCH' }, created_at: { gte: today } }
      }),
    ]);

    // Top jurisdicciones de escuelas
    const topJurisdicciones = await prisma.$queryRaw<any[]>`
      SELECT jurisdiccion as city, COUNT(*)::int as count
      FROM escuelas_especiales
      WHERE is_active = TRUE
      GROUP BY jurisdiccion
      ORDER BY count DESC
      LIMIT 10
    `;

    // Top discapacidades buscadas
    const topDisabilities = await prisma.$queryRaw<any[]>`
      SELECT unnest(disability_types) as type, COUNT(*)::int as count
      FROM students
      GROUP BY type
      ORDER BY count DESC
      LIMIT 8
    `;

    return NextResponse.json({
      totalUsers,
      totalStudents,
      totalProfessionals,
      totalEscuelas: (totalEscuelas[0] as any)?.count || 0,
      totalCentros,
      pendingVerifications,
      activeThisWeek,
      searchesToday,
      topCities: topJurisdicciones,
      topDisabilities,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}