const REQUIRED_SERVER = [
  'DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
] as const;

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
] as const;

function validateEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const missing: string[] = [];

  for (const key of REQUIRED_SERVER) {
    if (!process.env[key]) missing.push(key);
  }
  for (const key of REQUIRED_PUBLIC) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    throw new Error(
      `[DiscaConecta] Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
      'Add them to your .env.local or deployment environment.',
    );
  }
}

validateEnv();

export const env = {
  databaseUrl:          process.env.DATABASE_URL!,
  firebaseProjectId:    process.env.FIREBASE_PROJECT_ID!,
  firebaseClientEmail:  process.env.FIREBASE_CLIENT_EMAIL!,
  firebasePrivateKey:   process.env.FIREBASE_PRIVATE_KEY!,
  googleMapsKey:        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
} as const;
