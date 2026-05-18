import { useEffect } from 'react';
import type { SearchFilters } from '@/types';

const KEY = 'discapp_last_search';

export function saveLastSearch(filters: SearchFilters) {
  try {
    const { lat, lng, ...rest } = filters;
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {}
}

export function loadLastSearch(): Partial<SearchFilters> | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function useAutoSaveSearch(filters: SearchFilters) {
  useEffect(() => {
    const t = setTimeout(() => saveLastSearch(filters), 800);
    return () => clearTimeout(t);
  }, [filters]);
}
