import { prisma } from './prisma';
import { NextRequest } from 'next/server';

// Registra acciones sensibles (verificar/rechazar, suspender cuentas, borrar contenido,
// cambios de rol) para tener trazabilidad ante un incidente o reclamo — requisito
// razonable cuando se tratan datos de salud/discapacidad. No debe frenar el flujo
// principal si falla, por eso solo loguea el error y sigue.
export async function logAudit(params: {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}) {
  try {
    const ip = params.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? params.request?.headers.get('x-real-ip')
      ?? null;

    await prisma.audit_logs.create({
      data: {
        user_id:     params.userId,
        action:      params.action,
        entity_type: params.entityType ?? null,
        entity_id:   params.entityId ?? null,
        metadata:    params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
        ip_address:  ip,
      },
    });
  } catch (error) {
    console.error('Error registrando audit_log:', error);
  }
}
