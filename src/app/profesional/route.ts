import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';
import * as Sentry from '@sentry/nextjs';
import type { Professional } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const lat       = parseFloat(searchParams.get('lat') || '0');
    const lng       = parseFloat(searchParams.get('lng') || '0');
    const radiusKm  = parseFloat(searchParams.get('radiusKm') || '25');
    const specialty = searchParams.get('disabilityType');
    const city      = searchParams.get('city');
    const province  = searchParams.get('province');
    const profession = searchParams.get('profession');

    // Búsqueda geoespacial con PostGIS (raw query para máximo rendimiento)
    const professionals = await prisma.$queryRaw<Professional[]>`
      SELECT p.*, u.full_name, u.avatar_url, u.email,
             ST_Distance(p.location::geography, ST_MakePoint(${lng}, ${lat})::geography) / 1000 AS distance_km
      FROM professionals p
      JOIN users u ON u.id = p.user_id
      WHERE p.is_available = TRUE
        AND (${lat} = 0 OR ST_DWithin(
              p.location::geography,
              ST_MakePoint(${lng}, ${lat})::geography,
              ${radiusKm * 1000}
            ))
        AND (${city}::text IS NULL OR p.city ILIKE ${`%${city}%`})
        AND (${province}::text IS NULL OR p.province ILIKE ${`%${province}%`})
        AND (${specialty}::text IS NULL OR ${specialty} = ANY(p.specialties))
        AND (${profession}::text IS NULL OR p.profession = ${profession})
      ORDER BY distance_km ASC NULLS LAST, p.is_verified DESC
      LIMIT 100
    `;

    return NextResponse.json(professionals);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();

    // Validar con Zod
    const { professionalSchema } = await import('@/lib/validations');
    const parsed = professionalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { lat, lng, ...professionalData } = parsed.data;
    const professional = await prisma.professionals.create({
    data: {
        ...professionalData,
        user_id: user.id,
    }
    });

    // Si hay coordenadas, actualizás la location con query raw
    if (lat && lng) {
    await prisma.$executeRaw`
        UPDATE professionals 
        SET location = ST_MakePoint(${lng}, ${lat})::geography
        WHERE id = ${professional.id}
    `;
    }

    // Log de auditoría
    await prisma.audit_logs.create({
    data: { 
        user_id: user.id, 
        action: 'CREATE_PROFESSIONAL', 
        entity_type: 'professional', 
        entity_id: professional.id 
    }
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}