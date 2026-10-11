import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

// Umbral de auto-ocultamiento: si el saldo de votos negativos supera este valor,
// el reporte deja de mostrarse (pero admin siempre puede borrarlo del todo).
const HIDE_THRESHOLD = 3;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id: reportId } = await params;
    const { vote } = await request.json();
    if (vote !== 1 && vote !== -1) {
      return NextResponse.json({ error: 'Voto inválido' }, { status: 400 });
    }

    const report = await prisma.accessibility_reports.findUnique({ where: { id: reportId } });
    if (!report) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.accessibility_report_votes.findUnique({
        where: { report_id_user_id: { report_id: reportId, user_id: user.id } },
      });

      let myVote: 1 | -1 | null;
      if (existing && existing.vote === vote) {
        // Volver a tocar el mismo botón retira el voto.
        await tx.accessibility_report_votes.delete({ where: { id: existing.id } });
        myVote = null;
      } else if (existing) {
        await tx.accessibility_report_votes.update({ where: { id: existing.id }, data: { vote } });
        myVote = vote;
      } else {
        await tx.accessibility_report_votes.create({
          data: { report_id: reportId, user_id: user.id, vote },
        });
        myVote = vote;
      }

      const [{ up, down }] = await tx.$queryRaw<{ up: bigint; down: bigint }[]>`
        SELECT
          COUNT(*) FILTER (WHERE vote = 1)  AS up,
          COUNT(*) FILTER (WHERE vote = -1) AS down
        FROM accessibility_report_votes
        WHERE report_id = ${reportId}::uuid
      `;
      const upvotes = Number(up);
      const downvotes = Number(down);
      const isActive = (downvotes - upvotes) < HIDE_THRESHOLD;

      const updated = await tx.accessibility_reports.update({
        where: { id: reportId },
        data: { upvotes, downvotes, is_active: isActive, updated_at: new Date() },
      });

      return { upvotes: updated.upvotes, downvotes: updated.downvotes, is_active: updated.is_active, my_vote: myVote };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error POST /api/accessibility-reports/[id]/vote:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
