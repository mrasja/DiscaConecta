import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const credentials = await prisma.webauthn_credentials.findMany({
    where: { user_id: user.id },
    select: { id: true, credential_id: true, device_name: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json(credentials);
}

export async function DELETE(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const credentialId = searchParams.get('id');
  if (!credentialId) return NextResponse.json({ error: 'Falta el id' }, { status: 400 });

  await prisma.webauthn_credentials.deleteMany({
    where: { id: credentialId, user_id: user.id },
  });
  return NextResponse.json({ ok: true });
}
