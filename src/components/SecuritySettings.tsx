'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { startRegistration } from '@simplewebauthn/browser';
import { useAuth } from '@/context/AuthContext';

/* ── TOTP 2FA ─────────────────────────────────────────────── */
function TwoFactorSection({ token }: { token: string }) {
  const [enabled, setEnabled]       = useState<boolean | null>(null);
  const [step, setStep]             = useState<'idle' | 'setup' | 'disable'>('idle');
  const [qrUrl, setQrUrl]           = useState('');
  const [secret, setSecret]         = useState('');
  const [otp, setOtp]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');
  const [error, setError]           = useState('');

  useEffect(() => {
    fetch('/api/users/2fa', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setEnabled(d.enabled));
  }, [token]);

  const startSetup = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/users/2fa', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setQrUrl(data.qrDataUrl);
    setSecret(data.secret);
    setStep('setup');
    setLoading(false);
  };

  const enableTotp = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/users/2fa', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ secret, otp }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setEnabled(true); setStep('idle'); setOtp(''); setMsg('2FA activado correctamente.');
    setLoading(false);
  };

  const disableTotp = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/users/2fa', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ otp }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setEnabled(false); setStep('idle'); setOtp(''); setMsg('2FA desactivado.');
    setLoading(false);
  };

  if (enabled === null) return <p className="text-sm text-gray-400">Cargando…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">Doble factor (2FA)</p>
          <p className="text-xs text-gray-400">Google Authenticator, Authy, etc.</p>
        </div>
        {enabled ? (
          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Activo</span>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Inactivo</span>
        )}
      </div>

      {msg && <p className="mt-2 text-sm text-green-600">{msg}</p>}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {step === 'idle' && (
        <button
          onClick={() => { setMsg(''); enabled ? setStep('disable') : startSetup(); }}
          disabled={loading}
          className={`mt-3 text-sm font-medium px-4 py-2 rounded-lg transition-colors
            ${enabled
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {loading ? 'Cargando…' : enabled ? 'Desactivar 2FA' : 'Activar 2FA'}
        </button>
      )}

      {step === 'setup' && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-600">
            1. Abrí <strong>Google Authenticator</strong> o <strong>Authy</strong> en tu celular.
            <br />2. Escaneá el código QR o ingresá el código manual.
            <br />3. Ingresá el código de 6 dígitos que te muestre la app.
          </p>
          {qrUrl && (
            <div className="flex flex-col items-center gap-2">
              <Image src={qrUrl} alt="QR Code 2FA" width={200} height={200} className="rounded-lg border border-gray-100" />
              <p className="text-xs text-gray-400 break-all text-center max-w-xs">
                Código manual: <span className="font-mono text-gray-600">{secret}</span>
              </p>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-500">Código de verificación</label>
            <input
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" maxLength={6}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center tracking-[0.3em] font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={enableTotp} disabled={loading || otp.length < 6}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Verificando…' : 'Confirmar'}
            </button>
            <button onClick={() => { setStep('idle'); setOtp(''); setError(''); }}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {step === 'disable' && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">Ingresá tu código actual de 6 dígitos para desactivar el 2FA.</p>
          <input
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000" maxLength={6}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center tracking-[0.3em] font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={disableTotp} disabled={loading || otp.length < 6}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
              {loading ? 'Desactivando…' : 'Desactivar'}
            </button>
            <button onClick={() => { setStep('idle'); setOtp(''); setError(''); }}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── WebAuthn / Passkeys ─────────────────────────────────── */
function PasskeySection({ token, userId }: { token: string; userId: string }) {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [msg, setMsg]                 = useState('');
  const [error, setError]             = useState('');

  const load = () =>
    fetch('/api/auth/passkey/list', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setCredentials)
      .catch(() => {});

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const register = async () => {
    setLoading(true); setMsg(''); setError('');
    try {
      const optRes = await fetch('/api/auth/passkey/register-options', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!optRes.ok) throw new Error((await optRes.json()).error);
      const options = await optRes.json();

      const registrationResponse = await startRegistration({ optionsJSON: options });

      const deviceName = navigator.userAgent.includes('iPhone') ? 'iPhone'
        : navigator.userAgent.includes('Android') ? 'Android'
        : navigator.userAgent.includes('Mac') ? 'Mac'
        : 'Dispositivo';

      const verifyRes = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ response: registrationResponse, deviceName }),
      });
      if (!verifyRes.ok) throw new Error((await verifyRes.json()).error);

      setMsg('Passkey registrada correctamente.');
      load();
    } catch (e: any) {
      setError(e.message || 'No se pudo registrar la passkey');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (credentialId: string) => {
    await fetch(`/api/auth/passkey/list?id=${credentialId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">Huella / Face ID (Passkey)</p>
          <p className="text-xs text-gray-400">Iniciá sesión con biometría del dispositivo</p>
        </div>
        {credentials.length > 0 ? (
          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
            {credentials.length} passkey{credentials.length > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Sin registrar</span>
        )}
      </div>

      {credentials.length > 0 && (
        <ul className="mt-3 space-y-2">
          {credentials.map((c: any) => (
            <li key={c.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-700">📱 {c.device_name || 'Dispositivo'}</span>
              <button onClick={() => remove(c.credential_id)}
                className="text-xs text-red-500 hover:text-red-700 no-min">
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {msg   && <p className="mt-2 text-sm text-green-600">{msg}</p>}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <button onClick={register} disabled={loading}
        className="mt-3 text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {loading ? 'Registrando…' : 'Agregar passkey'}
      </button>
    </div>
  );
}

/* ── Export ───────────────────────────────────────────────── */
export function SecuritySettings() {
  const { token, appUser } = useAuth();
  if (!token || !appUser) return null;

  return (
    <div className="space-y-6 divide-y divide-gray-100">
      <TwoFactorSection token={token} />
      <div className="pt-6">
        <PasskeySection token={token} userId={appUser.id} />
      </div>
    </div>
  );
}
