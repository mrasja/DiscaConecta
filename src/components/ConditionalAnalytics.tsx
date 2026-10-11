'use client';
import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

export function ConditionalAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => setAllowed(localStorage.getItem('discaconecta_consent_v1') === 'accepted');
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  if (!allowed) return null;
  return <Analytics />;
}
