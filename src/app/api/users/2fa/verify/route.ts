import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require('otplib');
import { verifyToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { otp } = await request.json();
  if (!otp) return NextResponse.json({ error: 'Falta el código OTP' }, { status: 400 });

  const profile = await prisma.users.findUnique({
    where: { id: user.id },
    select: { totp_secret: true, totp_enabled: true },
  });

  if (!profile?.totp_enabled || !profile.totp_secret)
    return NextResponse.json({ error: '2FA no está habilitado' }, { status: 400 });

  const isValid = authenticator.check(otp, profile.totp_secret);
  if (!isValid)
    return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 401 });

  return NextResponse.json({ ok: true });
}
