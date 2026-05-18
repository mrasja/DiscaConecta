'use client';
import { useState, useCallback } from 'react';

const KEY = 'discapp_recent_cities';
const MAX = 5;

function load(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(() =>
    typeof window !== 'undefined' ? load() : []
  );

  const addSearch = useCallback((city: string) => {
    if (!city.trim() || city.length < 2) return;
    setRecent(prev => {
      const next = [city, ...prev.filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, MAX);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  return { recent, addSearch, clearRecent };
}
