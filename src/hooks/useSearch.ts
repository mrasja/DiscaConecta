import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { SearchFilters } from '@/types';

const PAGE_SIZE = 20;

function buildParams(filters: SearchFilters, extra?: Record<string, string>) {
  const p = new URLSearchParams();
  if (filters.city)     p.set('city',     filters.city);
  if (filters.province) p.set('province', filters.province);
  if (filters.lat)      p.set('lat',      String(filters.lat));
  if (filters.lng)      p.set('lng',      String(filters.lng));
  if (filters.radiusKm) p.set('radiusKm', String(filters.radiusKm));
  if (extra) Object.entries(extra).forEach(([k, v]) => v && p.set(k, v));
  return p;
}

// ── Profesionales con paginación infinita ──────────────────────
export const useProfessionals = (filters: SearchFilters) =>
  useInfiniteQuery({
    queryKey: ['professionals', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const p = buildParams(filters, {
        disabilityType:    filters.disabilityType    || '',
        profession:        filters.profession        || '',
        isVerifiedOnly:    filters.isVerifiedOnly ? 'true' : '',
        nombre:            filters.nombreProfesional || '',
        obraSocial:        filters.obraSocial        || '',
        limit:             String(PAGE_SIZE),
        offset:            String(pageParam),
      });
      const res = await fetch(`/api/professionals?${p}`);
      if (!res.ok) return [];
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any[], allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: !!filters.city || !!filters.lat,
  });

// ── Centros con paginación infinita ───────────────────────────
export const useCenters = (filters: SearchFilters) =>
  useInfiniteQuery({
    queryKey: ['centros', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const p = buildParams(filters, {
        tipo:           filters.centerType   || '',
        isVerifiedOnly: filters.isVerifiedOnly ? 'true' : '',
        limit:          String(PAGE_SIZE),
        offset:         String(pageParam),
      });
      const res = await fetch(`/api/centros?${p}`);
      if (!res.ok) return [];
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any[], allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });

export const useCentrosTerapeuticos = useCenters;

// ── Asociaciones con paginación infinita ──────────────────────
export const useAsociaciones = (filters: SearchFilters) =>
  useInfiniteQuery({
    queryKey: ['asociaciones', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const p = buildParams(filters, {
        disciplina:     filters.disciplina     || '',
        disabilityType: filters.disabilityType || '',
        isVerifiedOnly: filters.isVerifiedOnly ? 'true' : '',
        limit:          String(PAGE_SIZE),
        offset:         String(pageParam),
      });
      const res = await fetch(`/api/asociaciones?${p}`);
      if (!res.ok) return [];
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any[], allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });

// ── Asociaciones para el mapa (sin paginar) ────────────────────
export const useMapAsociaciones = (filters: SearchFilters, enabled: boolean) =>
  useQuery({
    queryKey: ['asociaciones-map', filters],
    queryFn: async () => {
      const p = buildParams(filters, { limit: '150', offset: '0' });
      const res = await fetch(`/api/asociaciones?${p}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: enabled && (!!filters.city || !!filters.lat),
  });

// ── Escuelas (sin paginar — dataset estático grande) ──────────
export const useEscuelas = (filters: SearchFilters) =>
  useQuery({
    queryKey: ['escuelas', filters],
    queryFn: async () => {
      const p = buildParams(filters, {
        nombre: filters.school || '',
        sector: filters.sector || '',
        nivel:  filters.nivel  || '',
      });
      const res = await fetch(`/api/escuelas?${p}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: true,
  });

// ── Todos los profesionales con ubicación para el mapa (sin paginar) ──
export const useMapProfessionals = (filters: SearchFilters, enabled: boolean) =>
  useQuery({
    queryKey: ['professionals-map', filters],
    queryFn: async () => {
      const p = buildParams(filters, {
        disabilityType: filters.disabilityType    || '',
        profession:     filters.profession        || '',
        isVerifiedOnly: filters.isVerifiedOnly ? 'true' : '',
        nombre:         filters.nombreProfesional || '',
        obraSocial:     filters.obraSocial        || '',
        limit:          '200',
        offset:         '0',
      });
      const res = await fetch(`/api/professionals?${p}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: enabled && (!!filters.city || !!filters.lat),
  });

// ── Centros para el mapa (sin paginar, basado en centro del mapa) ──
export const useMapCenters = (filters: SearchFilters, enabled: boolean) =>
  useQuery({
    queryKey: ['centers-map', filters],
    queryFn: async () => {
      const p = buildParams(filters, { limit: '150', offset: '0' });
      const res = await fetch(`/api/centros?${p}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: enabled && (!!filters.city || !!filters.lat),
  });

// ── Escuelas para el mapa (sin paginar, basado en centro del mapa) ──
export const useMapEscuelas = (filters: SearchFilters, enabled: boolean) =>
  useQuery({
    queryKey: ['escuelas-map', filters],
    queryFn: async () => {
      const p = buildParams(filters, { limit: '150', offset: '0' });
      const res = await fetch(`/api/escuelas?${p}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: enabled && (!!filters.city || !!filters.lat),
  });

// ── Reportes de accesibilidad para el mapa colaborativo (sin paginar) ──
export const useMapAccessibilityReports = (filters: SearchFilters, enabled: boolean, token?: string | null) =>
  useQuery({
    queryKey: ['accessibility-reports-map', filters],
    queryFn: async () => {
      const p = buildParams(filters, { limit: '300', offset: '0' });
      const res = await fetch(`/api/accessibility-reports?${p}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    enabled: enabled && (!!filters.city || !!filters.lat),
  });

export const useStudents = (filters: SearchFilters) =>
  useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const p = buildParams(filters);
      const res = await fetch(`/api/students?${p}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });
