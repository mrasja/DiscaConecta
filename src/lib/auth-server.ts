import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';
import { prisma } from './prisma';

export async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const user = await prisma.users.findUnique({ where: { firebase_uid: decoded.uid } });
    return user;
  } catch { return null; }
}