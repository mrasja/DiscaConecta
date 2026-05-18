import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city         = searchParams.get('city');
    const province     = searchParams.get('province');
    const lat          = parseFloat(searchParams.get('lat') || '0');
    const lng          = parseFloat(searchParams.get('lng') || '0');
    const radiusKm     = parseFloat(searchParams.get('radiusKm') || '25');
    const specialty       = searchParams.get('disabilityType');
    const profession      = searchParams.get('profession');
    const isVerifiedOnly  = searchParams.get('isVerifiedOnly') === 'true';
    const nombre          = searchParams.get('nombre');
    const obraSocial      = searchParams.get('obraSocial');
    const limit           = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset          = parseInt(searchParams.get('offset') || '0');

    const professionals = await prisma.$queryRaw<any[]>`
      SELECT p.id, p.user_id, p.profession, p.license_number,
             p.is_verified, p.bio, p.specialties, p.work_zones,
             p.address, p.neighborhood, p.city, p.province,
             p.contact_phone, p.contact_whatsapp, p.is_available,
             u.full_name, u.avatar_url, u.email, u.firebase_uid,
             ST_AsText(p.location) AS location_text,
             CASE WHEN ${lat} != 0 AND p.location IS NOT NULL THEN
               ROUND((ST_Distance(
                 p.location::geography,
                 ST_MakePoint(${lng}, ${lat})::geography
               ) / 1000)::numeric, 1)
             ELSE NULL END AS distancia_km,
             COALESCE((
               SELECT ROUND(AVG(r.rating)::numeric, 1)
               FROM reviews r
               WHERE r.target_type = 'professional' AND r.target_id = p.id
             ), 0) AS avg_rating,
             (SELECT COUNT(*)::int
               FROM reviews r
               WHERE r.target_type = 'professional' AND r.target_id = p.id
             ) AS review_count
      FROM professionals p
      JOIN users u ON u.id = p.user_id
      WHERE p.is_available = TRUE
        AND (${city}::text IS NULL OR p.city ILIKE ${`%${city}%`})
        AND (${province}::text IS NULL OR p.province ILIKE ${`%${province}%`})
        AND (${specialty}::text IS NULL OR ${specialty} = ANY(p.specialties))
        AND (${profession}::text IS NULL OR p.profession = ${profession})
        AND (${isVerifiedOnly} = FALSE OR p.is_verified = TRUE)
        AND (${nombre}::text IS NULL OR u.full_name ILIKE ${`%${nombre}%`})
        AND (${obraSocial}::text IS NULL OR ${obraSocial} = ANY(p.obras_sociales))
        AND (${lat} = 0 OR p.location IS NULL OR
             ST_DWithin(
               p.location::geography,
               ST_MakePoint(${lng}, ${lat})::geography,
               ${radiusKm * 1000}
             ))
      ORDER BY distancia_km ASC NULLS LAST, p.is_verified DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json(professionals);
  } catch (error) {
    console.error('Error GET /api/professionals:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await request.json();

    const existing = await prisma.professionals.findFirst({
      where: { user_id: user.id }
    });

    if (existing) {
      const updated = await prisma.professionals.update({
        where: { id: existing.id },
        data: {
          profession:       body.profession,
          license_number:   body.licenseNumber,
          bio:              body.bio,
          specialties:      body.specialties || [],
          work_zones:       body.workZones || [],
          city:             body.city,
          province:         body.province,
          address:          body.address,
          neighborhood:     body.neighborhood,
          contact_phone:    body.contactPhone,
          contact_whatsapp: body.contactWhatsapp,
          is_available:     body.isAvailable ?? true,
        }
      });
      return NextResponse.json(updated);
    }

    const professional = await prisma.professionals.create({
      data: {
        user_id:          user.id,
        profession:       body.profession,
        license_number:   body.licenseNumber,
        bio:              body.bio,
        specialties:      body.specialties || [],
        work_zones:       body.workZones || [],
        city:             body.city,
        province:         body.province,
        address:          body.address,
        neighborhood:     body.neighborhood,
        contact_phone:    body.contactPhone,
        contact_whatsapp: body.contactWhatsapp,
        is_available:     body.isAvailable ?? true,
        is_verified:      false,
      }
    });

    if (body.lat && body.lng) {
      await prisma.$executeRaw`
        UPDATE professionals
        SET location = ST_MakePoint(${body.lng}, ${body.lat})::geography
        WHERE id = ${professional.id}::uuid
      `;
    }

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/professionals:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}