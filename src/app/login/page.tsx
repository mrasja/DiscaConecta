'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithCustomToken } from 'firebase/auth';
import { signInWithGoogle, signInWithEmail, registerWithEmail, auth } from '@/lib/firebase';
import { startAuthentication } from '@simplewebauthn/browser';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [role, setRole]         = useState<'alumno' | 'profesional'>('alumno');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [ageConfirmed, setAgeConfirmed]   = useState(false);
  const [error, setError]           = useState('');
  const [errorField, setErrorField] = useState<'name' | 'email' | 'password' | null>(null);
  const [loading, setLoading]       = useState(false);
  const [registering, setRegistering] = useState(false);
  // 2FA
  const [pending2FA, setPending2FA]   = useState(false);
  const [checking2FA, setChecking2FA] = useState(false);
  const [otpCode, setOtpCode]         = useState('');
  const [tempToken, setTempToken]     = useState('');

  const { appUser, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || registering || pending2FA || checking2FA) return;
    if (appUser) router.replace('/dashboard');
  }, [appUser, authLoading, registering, pending2FA, checking2FA, router]);

  const check2FA = async (idToken: string): Promise<boolean> => {
    const res = await fetch('/api/users/2fa', { headers: { Authorization: `Bearer ${idToken}` } });
    if (!res.ok) return false;
    const { enabled } = await res.json();
    if (enabled) { setTempToken(idToken); setPending2FA(true); }
    return enabled;
  };

  const verify2FA = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/users/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tempToken}` },
      body: JSON.stringify({ otp: otpCode }),
    });
    if (!res.ok) { setError((await res.json()).error || 'Código inválido'); setLoading(false); return; }
    setPending2FA(false);
    setLoading(false);
  };

  const handlePasskeyLogin = async () => {
    if (!email) { setError('Ingresá tu email primero'); return; }
    setLoading(true); setChecking2FA(true); setError('');
    try {
      const optRes = await fetch('/api/auth/passkey/authenticate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!optRes.ok) throw new Error((await optRes.json()).error);
      const authResponse = await startAuthentication({ optionsJSON: await optRes.json() });
      const verifyRes = await fetch('/api/auth/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, response: authResponse }),
      });
      if (!verifyRes.ok) throw new Error((await verifyRes.json()).error);
      const { customToken } = await verifyRes.json();
      await signInWithCustomToken(auth, customToken);
    } catch (e: any) {
      setError(e.message || 'No se pudo autenticar con passkey');
      setChecking2FA(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setChecking2FA(true); setError('');
    try {
      await signInWithGoogle();
      const fbUser = auth.currentUser;
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        await check2FA(idToken);
      }
    } catch {
      setError('Error al iniciar sesión con Google');
    } finally {
      setLoading(false); setChecking2FA(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setErrorField(null);
    try {
      if (mode === 'login') {
        setChecking2FA(true);
        await signInWithEmail(email, password);
        const fbUser = auth.currentUser;
        if (fbUser) {
          const idToken = await fbUser.getIdToken();
          await check2FA(idToken);
        }
        setChecking2FA(false);
      } else {
        if (!name.trim()) { setError('Ingresá tu nombre'); setErrorField('name'); setLoading(false); return; }
        if (!acceptedTerms) { setError('Debés aceptar los Términos y la Política de Privacidad para continuar'); setLoading(false); return; }
        if (!ageConfirmed) { setError('Debés confirmar que sos mayor de 13 años o representante legal'); setLoading(false); return; }
        setRegistering(true);
        const credential = await registerWithEmail(email, password);
        const idToken    = await credential.user.getIdToken();
        // Guardar nombre y rol elegido antes de que el useEffect navegue
        await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ full_name: name, role, terms_accepted_at: new Date().toISOString() }),
        });
        await refreshUser();
        setRegistering(false);
        // La navegación la dispara el useEffect cuando registering = false y appUser está listo
      }
    } catch (e: any) {
      setRegistering(false); setChecking2FA(false);
      if (e?.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con ese email');
        setErrorField('email');
      } else if (e?.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres');
        setErrorField('password');
      } else {
        setError(e?.message || 'Error de autenticación');
        setErrorField(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <span className="text-white text-3xl font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DiscaConecta</h1>
          <p className="text-gray-500 text-sm mt-1">Conectando personas, transformando vidas</p>
        </div>

        {/* ── Paso 2FA ── */}
        {pending2FA ? (
          <div className="space-y-5">
            <div className="text-center">
              <div className="text-5xl mb-3">🔐</div>
              <h2 className="text-lg font-bold text-gray-900">Verificación en dos pasos</h2>
              <p className="text-sm text-gray-500 mt-1">
                Ingresá el código de 6 dígitos de tu app autenticadora
              </p>
            </div>
            <input
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" maxLength={6} autoFocus
              className="w-full px-4 py-4 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {error && <p className="text-red-500 text-sm text-center bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button onClick={verify2FA} disabled={loading || otpCode.length < 6}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button onClick={() => { setPending2FA(false); setOtpCode(''); setError(''); }}
              className="w-full text-gray-500 text-sm hover:text-gray-700 py-2">
              Cancelar y volver al inicio
            </button>
          </div>
        ) : (<>

        {/* Tabs */}
        <div role="tablist" aria-label="Modo de acceso" className="flex rounded-lg bg-gray-100 p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
                ${mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
              {m === 'login' ? 'Ingresar' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleEmail} className="space-y-4" aria-label={mode === 'login' ? 'Formulario de inicio de sesión' : 'Formulario de registro'}>
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input id="full-name" type="text" placeholder="Tu nombre completo" value={name}
                  onChange={e => setName(e.target.value)} required autoComplete="name"
                  aria-invalid={errorField === 'name'}
                  aria-describedby={errorField === 'name' ? 'form-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500
                    ${errorField === 'name' ? 'border-red-400' : 'border-gray-200'}`} />
              </div>

              {/* Selector de rol */}
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-2">Soy...</legend>
                <div className="grid grid-cols-2 gap-3" role="radiogroup">
                  {([
                    { value: 'alumno',      label: 'Alumno / Familia', icon: '🎓' },
                    { value: 'profesional', label: 'Profesional',       icon: '👩‍⚕️' },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button"
                      role="radio" aria-checked={role === opt.value}
                      onClick={() => setRole(opt.value)}
                      className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all
                        ${role === opt.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      <span className="text-2xl mb-1" aria-hidden="true">{opt.icon}</span>
                      <span className="text-xs font-medium text-center">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="login-email" type="email" placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email"
              aria-invalid={errorField === 'email'}
              aria-describedby={errorField === 'email' ? 'form-error' : undefined}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${errorField === 'email' ? 'border-red-400' : 'border-gray-200'}`} />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input id="login-password" type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-invalid={errorField === 'password'}
              aria-describedby={errorField === 'password' ? 'form-error' : undefined}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${errorField === 'password' ? 'border-red-400' : 'border-gray-200'}`} />
          </div>

          {mode === 'register' && (
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Acepto los{' '}
                  <Link href="/terminos" target="_blank" className="text-indigo-600 underline">Términos y Condiciones</Link>
                  {' '}y la{' '}
                  <Link href="/privacidad" target="_blank" className="text-indigo-600 underline">Política de Privacidad</Link>.
                  Entiendo que la app puede almacenar datos sensibles de salud/discapacidad con mi consentimiento explícito.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={e => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Soy mayor de 13 años o actúo como representante legal de un menor.
                </span>
              </label>
            </div>
          )}

          {error && (
            <p id="form-error" role="alert" aria-live="assertive"
              className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" disabled={loading || registering || (mode === 'register' && (!acceptedTerms || !ageConfirmed))}
            aria-busy={loading || registering}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading || registering ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <div role="separator" className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"/></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">o</span></div>
        </div>

        <button onClick={handleGoogle} disabled={loading}
          aria-label="Continuar con Google"
          className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700 font-medium">Continuar con Google</span>
        </button>

        {mode === 'login' && (
          <>
            <p className="text-center text-xs text-gray-400 mt-4">
              Con Google podés elegir tu perfil en el siguiente paso.
            </p>
            <button onClick={handlePasskeyLogin} disabled={loading || !email}
              className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-200 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 text-sm text-gray-600 font-medium">
              <span>🔑</span> Ingresar con passkey (biometría)
            </button>
          </>
        )}
        </> )}
      </div>
    </div>
  );
}
