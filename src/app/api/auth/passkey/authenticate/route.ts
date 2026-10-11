import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { adminAuth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

const RP_ID  = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL    || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const { email, response: authResponse } = await request.json();
  if (!email || !authResponse)
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const profile = await prisma.users.findUnique({
    where: { email },
    select: {
      id: true, firebase_uid: true,
      webauthn_challenge: true, webauthn_challenge_exp: true,
      webauthn_credentials: true,
    },
  });

  if (!profile?.webauthn_challenge || !profile.webauthn_challenge_exp ||
      profile.webauthn_challenge_exp < new Date())
    return NextResponse.json({ error: 'Challenge expirado' }, { status: 400 });

  const credential = profile.webauthn_credentials.find(
    c => c.credential_id === authResponse.id
  );
  if (!credential)
    return NextResponse.json({ error: 'Passkey no encontrada' }, { status: 400 });

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: profile.webauthn_challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credential.credential_id,
        publicKey: new Uint8Array(credential.public_key),
        counter: Number(credential.counter),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Verificación fallida' }, { status: 400 });
  }

  if (!verification.verified)
    return NextResponse.json({ error: 'Verificación fallida' }, { status: 401 });

  // Actualizar counter y limpiar challenge
  await prisma.webauthn_credentials.update({
    where: { credential_id: credential.credential_id },
    data: { counter: BigInt(verification.authenticationInfo.newCounter) },
  });
  await prisma.users.update({
    where: { id: profile.id },
    data: { webauthn_challenge: null, webauthn_challenge_exp: null },
  });

  // Crear Firebase custom token para que el cliente inicie sesión
  const customToken = await adminAuth.createCustomToken(profile.firebase_uid);
  return NextResponse.json({ customToken });
}
