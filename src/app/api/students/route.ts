import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city           = searchParams.get('city');
    const province       = searchParams.get('province');
    const lat            = parseFloat(searchParams.get('lat') || '0');
    const lng            = parseFloat(searchParams.get('lng') || '0');
    const radiusKm       = parseFloat(searchParams.get('radiusKm') || '25');
    const disabilityType = searchParams.get('disabilityType');
    const needsCompanion = searchParams.get('needsCompanion') === 'true';
    const needsNurse     = searchParams.get('needsNurse') === 'true';

    const students = await prisma.$queryRaw<any[]>`
      SELECT
        s.id, s.user_id, s.disability_types, s.school_name,
        s.school_zone, s.needs_companion, s.needs_nurse,
        s.description, s.address, s.neighborhood,
        s.city, s.province, s.contact_phone,
        u.full_name, u.avatar_url,
        ST_AsText(s.location) AS location_text,
        CASE WHEN ${lat} != 0 AND s.location IS NOT NULL THEN
          ROUND((ST_Distance(
            s.location::geography,
            ST_MakePoint(${lng}, ${lat})::geography
          ) / 1000)::numeric, 1)
        ELSE NULL END AS distancia_km
      FROM students s
      JOIN users u ON u.id = s.user_id
      WHERE s.is_visible = TRUE
        AND (${city}::text IS NULL OR s.city ILIKE ${`%${city}%`})
        AND (${province}::text IS NULL OR s.province ILIKE ${`%${province}%`})
        AND (${disabilityType}::text IS NULL OR ${disabilityType} = ANY(s.disability_types))
        AND (NOT ${needsCompanion} OR s.needs_companion = TRUE)
        AND (NOT ${needsNurse}     OR s.needs_nurse = TRUE)
        AND (${lat} = 0 OR s.location IS NULL OR
             ST_DWithin(
               s.location::geography,
               ST_MakePoint(${lng}, ${lat})::geography,
               ${radiusKm * 1000}
             ))
      ORDER BY distancia_km ASC NULLS LAST
      LIMIT 100
    `;

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error GET /api/students:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { verifyToken } = await import('@/lib/auth-server');
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();

    const existing = await prisma.students.findFirst({
      where: { user_id: user.id }
    });

    if (existing) {
      const updated = await prisma.students.update({
        where: { id: existing.id },
        data: {
          disability_types: body.disabilityTypes || [],
          school_name:      body.schoolName,
          school_zone:      body.schoolZone,
          needs_companion:  body.needsCompanion ?? false,
          needs_nurse:      body.needsNurse ?? false,
          description:      body.description,
          address:          body.address,
          neighborhood:     body.neighborhood,
          city:             body.city,
          province:         body.province,
          contact_phone:    body.contactPhone,
          is_visible:       body.isVisible ?? true,
        }
      });
      return NextResponse.json(updated);
    }

    const student = await prisma.students.create({
      data: {
        user_id:          user.id,
        disability_types: body.disabilityTypes || [],
        school_name:      body.schoolName,
        school_zone:      body.schoolZone,
        needs_companion:  body.needsCompanion ?? false,
        needs_nurse:      body.needsNurse ?? false,
        description:      body.description,
        address:          body.address,
        neighborhood:     body.neighborhood,
        city:             body.city,
        province:         body.province,
        contact_phone:    body.contactPhone,
        is_visible:       body.isVisible ?? true,
      }
    });

    if (body.lat && body.lng) {
      await prisma.$executeRaw`
        UPDATE students
        SET location = ST_MakePoint(${body.lng}, ${body.lat})::geography
        WHERE id = ${student.id}::uuid
      `;
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/students:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
