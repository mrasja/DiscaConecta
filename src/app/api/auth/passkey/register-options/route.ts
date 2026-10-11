import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { verifyToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

const RP_NAME = 'DiscaConecta';
const RP_ID   = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';

export async function GET(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const profile = await prisma.users.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, full_name: true, webauthn_credentials: true },
  });
  if (!profile) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(profile.id),
    userName: profile.email,
    userDisplayName: profile.full_name,
    attestationType: 'none',
    excludeCredentials: profile.webauthn_credentials.map(c => ({
      id: c.credential_id,
      type: 'public-key' as const,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Guardar challenge en DB (expira en 5 minutos)
  await prisma.users.update({
    where: { id: user.id },
    data: {
      webauthn_challenge:     options.challenge,
      webauthn_challenge_exp: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return NextResponse.json(options);
}
