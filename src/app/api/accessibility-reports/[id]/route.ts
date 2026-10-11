import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, isAdminUser } from '@/lib/auth-server';
import { logAudit } from '@/lib/audit';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const report = await prisma.accessibility_reports.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const isOwner = report.reporter_id === user.id;
    if (!isOwner && !isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.accessibility_reports.delete({ where: { id } });

    if (!isOwner) {
      // Solo interesa auditar el borrado como moderación admin, no cuando el propio autor lo retira.
      await logAudit({
        userId: user.id, action: 'accessibility_report.delete', entityType: 'accessibility_reports',
        entityId: id, metadata: { category: report.category, subtype: report.subtype }, request,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error DELETE /api/accessibility-reports/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
