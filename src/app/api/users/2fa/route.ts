import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require('otplib');
import QRCode from 'qrcode';
import { verifyToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

// GET — obtener estado actual del 2FA
export async function GET(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const profile = await prisma.users.findUnique({
    where: { id: user.id },
    select: { totp_enabled: true, email: true },
  });
  return NextResponse.json({ enabled: !!profile?.totp_enabled });
}

// POST — setup: genera secret + QR code
export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const profile = await prisma.users.findUnique({
    where: { id: user.id },
    select: { email: true },
  });
  if (!profile) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const secret = authenticator.generateSecret(20);
  const otpauthUrl = authenticator.keyuri(profile.email, 'DiscaConecta', secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 256, margin: 2 });

  return NextResponse.json({ secret, qrDataUrl });
}

// PATCH — enable: verifica OTP y activa 2FA
export async function PATCH(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { secret, otp } = await request.json();
  if (!secret || !otp) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const isValid = authenticator.check(otp, secret);
  if (!isValid) return NextResponse.json({ error: 'Código inválido. Verificá que el reloj de tu dispositivo esté sincronizado.' }, { status: 400 });

  await prisma.users.update({
    where: { id: user.id },
    data: { totp_secret: secret, totp_enabled: true },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — disable: desactiva 2FA (requiere OTP actual)
export async function DELETE(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { otp } = await request.json();

  const profile = await prisma.users.findUnique({
    where: { id: user.id },
    select: { totp_secret: true, totp_enabled: true },
  });

  if (!profile?.totp_enabled || !profile.totp_secret)
    return NextResponse.json({ error: '2FA no está activo' }, { status: 400 });

  if (!authenticator.check(otp, profile.totp_secret))
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 });

  await prisma.users.update({
    where: { id: user.id },
    data: { totp_secret: null, totp_enabled: false },
  });

  return NextResponse.json({ ok: true });
}
