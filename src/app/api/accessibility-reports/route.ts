import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

const CATEGORIES = ['barrera', 'acceso_positivo', 'servicio'];
const SUBTYPES = [
  'vereda_rota', 'sin_rampa', 'escalon_sin_salvar', 'obra_bloquea_paso', 'otro_barrera',
  'rampa_buen_estado', 'entrada_sin_escalones', 'bano_accesible', 'semaforo_sonoro', 'piso_tactil', 'otro_positivo',
  'estacionamiento_reservado', 'parada_transporte_accesible', 'ascensor', 'otro_servicio',
] as const;

const ReportSchema = z.object({
  category:    z.enum(CATEGORIES as [string, ...string[]]),
  subtype:     z.enum(SUBTYPES),
  description: z.string().trim().max(1000).optional().nullable(),
  photo_url:   z.string().trim().url().max(2000).optional().nullable(),
  address:     z.string().trim().max(300).optional().nullable(),
  lat:         z.number().min(-90).max(90),
  lng:         z.number().min(-180).max(180),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat      = parseFloat(searchParams.get('lat') || '0');
    const lng      = parseFloat(searchParams.get('lng') || '0');
    const radiusKm = parseFloat(searchParams.get('radiusKm') || '25');
    const category = searchParams.get('category');
    const limit    = Math.min(parseInt(searchParams.get('limit') || '200'), 300);
    const offset   = parseInt(searchParams.get('offset') || '0');

    const reports = await prisma.$queryRaw<any[]>`
      SELECT
        r.id, r.category, r.subtype, r.description, r.photo_url, r.address,
        r.upvotes, r.downvotes, r.created_at,
        ST_AsText(r.location) AS location_text
      FROM accessibility_reports r
      WHERE r.is_active = TRUE
        AND (${category}::text IS NULL OR r.category = ${category})
        AND (${lat} = 0 OR
             ST_DWithin(
               r.location,
               ST_MakePoint(${lng}, ${lat})::geography,
               ${radiusKm * 1000}
             ))
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Adjuntar el voto propio del usuario, si envía token — no revela quién reportó.
    const user = await verifyToken(request);
    if (user && reports.length > 0) {
      const votes = await prisma.accessibility_report_votes.findMany({
        where: { user_id: user.id, report_id: { in: reports.map(r => r.id) } },
        select: { report_id: true, vote: true },
      });
      const voteMap = new Map(votes.map(v => [v.report_id, v.vote]));
      for (const r of reports) r.my_vote = voteMap.get(r.id) ?? null;
    }

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error GET /api/accessibility-reports:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const parsed = ReportSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    const { category, subtype, description, photo_url, address, lat, lng } = parsed.data;

    const [report] = await prisma.$queryRaw<any[]>`
      INSERT INTO accessibility_reports
        (reporter_id, category, subtype, description, photo_url, address, location)
      VALUES
        (${user.id}::uuid, ${category}, ${subtype}, ${description || null}, ${photo_url || null},
         ${address || null}, ST_MakePoint(${lng}, ${lat})::geography)
      RETURNING
        id, category, subtype, description, photo_url, address,
        upvotes, downvotes, created_at, ST_AsText(location) AS location_text
    `;

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/accessibility-reports:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
