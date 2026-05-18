import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// ── Next.js ──────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter:      () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname:    () => '/',
  useSearchParams:() => new URLSearchParams(),
}));

// ── Firebase (auth) ───────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  auth:             {},
  logout:           vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithEmail:  vi.fn(),
}));

// ── AuthContext ───────────────────────────────────────────────
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    appUser:      { id: 'user-1', role: 'alumno', fullName: 'Test User', email: 'test@test.com' },
    token:        'fake-token',
    firebaseUser: { uid: 'firebase-uid-1' },
    refreshUser:  vi.fn(),
  }),
}));

// ── Capacitor ─────────────────────────────────────────────────
vi.mock('@capacitor/haptics', () => ({
  Haptics:      { impact: vi.fn() },
  ImpactStyle:  { Light: 'LIGHT', Medium: 'MEDIUM' },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    exitApp:     vi.fn(),
  },
}));

// ── Global fetch reset ────────────────────────────────────────
beforeEach(() => {
  vi.restoreAllMocks();
});
