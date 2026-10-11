import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';

const RP_ID = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Falta el email' }, { status: 400 });

  const profile = await prisma.users.findUnique({
    where: { email },
    select: { id: true, webauthn_credentials: true },
  });
  if (!profile || profile.webauthn_credentials.length === 0)
    return NextResponse.json({ error: 'No hay passkeys registradas para este email' }, { status: 404 });

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'preferred',
    allowCredentials: profile.webauthn_credentials.map(c => ({
      id: c.credential_id,
      type: 'public-key' as const,
    })),
  });

  await prisma.users.update({
    where: { id: profile.id },
    data: {
      webauthn_challenge:     options.challenge,
      webauthn_challenge_exp: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return NextResponse.json(options);
}
