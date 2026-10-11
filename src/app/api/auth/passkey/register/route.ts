import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { verifyToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

const RP_ID     = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
const ORIGIN    = process.env.NEXT_PUBLIC_APP_URL    || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { response: registrationResponse, deviceName } = await request.json();

  const profile = await prisma.users.findUnique({
    where: { id: user.id },
    select: { webauthn_challenge: true, webauthn_challenge_exp: true },
  });

  if (!profile?.webauthn_challenge || !profile.webauthn_challenge_exp ||
      profile.webauthn_challenge_exp < new Date())
    return NextResponse.json({ error: 'Challenge expirado. Intentá de nuevo.' }, { status: 400 });

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: profile.webauthn_challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Verificación fallida' }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo)
    return NextResponse.json({ error: 'Verificación fallida' }, { status: 400 });

  const { credential } = verification.registrationInfo;

  await prisma.webauthn_credentials.create({
    data: {
      user_id:       user.id,
      credential_id: credential.id,
      public_key:    Buffer.from(credential.publicKey),
      counter:       BigInt(credential.counter),
      device_name:   deviceName || 'Dispositivo',
    },
  });

  // Limpiar el challenge
  await prisma.users.update({
    where: { id: user.id },
    data: { webauthn_challenge: null, webauthn_challenge_exp: null },
  });

  return NextResponse.json({ ok: true });
}
