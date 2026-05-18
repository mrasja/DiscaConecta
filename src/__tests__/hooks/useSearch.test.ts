import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfessionals, useCenters, useEscuelas } from '@/hooks/useSearch';
import React from 'react';

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

const mockProfList = [
  { id: 'p1', profession: 'psicologo', city: 'Buenos Aires', avg_rating: 4.5, review_count: 3 },
];
const mockCenterList = [
  { id: 'c1', name: 'Centro X', centerType: 'rehabilitacion', city: 'Buenos Aires' },
];
const mockEscuelaList = [
  { id: 'e1', nombre: 'Escuela N° 1', localidad: 'La Plata', jurisdiccion: 'Buenos Aires' },
];

describe('useProfessionals', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfList),
    });
  });

  it('no ejecuta la query sin ciudad ni lat', () => {
    const { result } = renderHook(
      () => useProfessionals({}),
      { wrapper: createWrapper() }
    );
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('ejecuta la query cuando hay ciudad', async () => {
    const { result } = renderHook(
      () => useProfessionals({ city: 'Buenos Aires', province: 'Buenos Aires', radiusKm: 50 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProfList);
  });

  it('devuelve [] si el fetch falla', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const { result } = renderHook(
      () => useProfessionals({ city: 'Buenos Aires' }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useCenters', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCenterList),
    });
  });

  it('trae centros correctamente', async () => {
    const { result } = renderHook(
      () => useCenters({ city: 'Buenos Aires' }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCenterList);
  });
});

describe('useEscuelas', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEscuelaList),
    });
  });

  it('trae escuelas correctamente', async () => {
    const { result } = renderHook(
      () => useEscuelas({ city: 'La Plata' }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEscuelaList);
  });
});
