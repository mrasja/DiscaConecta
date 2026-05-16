import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchFilters } from '@/types';

export const useProfessionals = (filters: SearchFilters) =>
  useQuery({
    queryKey: ['professionals', filters],
    queryFn: () => api.searchProfessionals(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos cache
    enabled: !!filters.city || !!filters.lat,
  });

export const useStudents = (filters: SearchFilters) =>
  useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.city)     params.set('city', filters.city || '');
      if (filters.province) params.set('province', filters.province || '');
      if (filters.lat)      params.set('lat', String(filters.lat || 0));
      if (filters.lng)      params.set('lng', String(filters.lng || 0));
      if (filters.radiusKm) params.set('radiusKm', String(filters.radiusKm || 25));
      const res = await fetch(`/api/students?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });
  
export const useCenters = (filters: SearchFilters) =>
  useQuery({
    queryKey: ['centros', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.city)     params.set('city', filters.city);
      if (filters.province) params.set('province', filters.province || '');
      if (filters.lat)      params.set('lat', String(filters.lat));
      if (filters.lng)      params.set('lng', String(filters.lng));
      if (filters.radiusKm) params.set('radiusKm', String(filters.radiusKm));
      
      // ← CAMBIADO de /api/centers a /api/centros
      const res = await fetch(`/api/centros?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });


export const useCentrosTerapeuticos = (filters: SearchFilters) =>
  useQuery({
    queryKey: ['centros', filters],
    queryFn: () => fetch(
      `/api/centros?${new URLSearchParams(filters as any)}`
    ).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });

export const useEscuelas = (filters: SearchFilters) =>
  useQuery({
    queryKey: ['escuelas', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.city)     params.set('city', filters.city);
      if (filters.province) params.set('province', filters.province || '');
      if (filters.lat)      params.set('lat', String(filters.lat));
      if (filters.lng)      params.set('lng', String(filters.lng));
      if (filters.radiusKm) params.set('radiusKm', String(filters.radiusKm));
      const res = await fetch(`/api/escuelas?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: true,
  });