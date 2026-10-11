import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

// Datos sensibles (tipos de discapacidad) — se valida contra una lista cerrada
// en vez de aceptar cualquier string, y se acotan los largos de texto libre.
const StudentSchema = z.object({
  disabilityTypes: z.array(z.enum(['visual', 'auditiva', 'motriz', 'intelectual', 'tea', 'multiple', 'otra'])).max(10).optional(),
  schoolName:       z.string().trim().max(200).optional().nullable(),
  needsCompanion:   z.boolean().optional(),
  needsNurse:       z.boolean().optional(),
  description:      z.string().trim().max(2000).optional().nullable(),
  city:             z.string().trim().max(120).optional().nullable(),
  province:         z.string().trim().max(120).optional().nullable(),
  contactPhone:     z.string().trim().max(40).optional().nullable(),
  isVisible:        z.boolean().optional(),
  sensitiveDataConsent: z.boolean().optional(),
  guardianDeclaration:  z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const student = await prisma.students.findFirst({ where: { user_id: user.id } });
    return NextResponse.json(student ?? null);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const parsed = StudentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    const existing = await prisma.students.findFirst({ where: { user_id: user.id } });

    const hasSensitiveData = (body.disabilityTypes?.length ?? 0) > 0;
    if (hasSensitiveData && (!body.sensitiveDataConsent || !body.guardianDeclaration)) {
      return NextResponse.json(
        { error: 'Para cargar tipos de discapacidad hace falta confirmar el consentimiento y la declaración de mayoría de edad / representación legal.' },
        { status: 400 },
      );
    }

    const data = {
      disability_types: body.disabilityTypes || [],
      school_name:      body.schoolName      || null,
      needs_companion:  body.needsCompanion  ?? false,
      needs_nurse:      body.needsNurse      ?? false,
      description:      body.description     || null,
      city:             body.city            || null,
      province:         body.province        || null,
      contact_phone:    body.contactPhone    || null,
      is_visible:       body.isVisible       ?? true,
      // El consentimiento y la declaración se registran (con fecha) solo cuando hay
      // datos sensibles; si el usuario después borra todas las discapacidades, no
      // se pisa el consentimiento previo — queda como historial de cuándo se otorgó.
      ...(hasSensitiveData ? {
        sensitive_data_consent_at: existing?.sensitive_data_consent_at ?? new Date(),
        guardian_declaration: true,
      } : {}),
    };

    let student;
    if (existing) {
      student = await prisma.students.update({ where: { id: existing.id }, data });
    } else {
      student = await prisma.students.create({ data: { user_id: user.id, ...data } });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
