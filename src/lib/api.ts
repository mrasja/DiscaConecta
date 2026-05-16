import { auth } from './firebase';
import type { Student, Professional, Center, SearchFilters, User } from '@/types';

async function getAuthHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Error en la solicitud');
  }
  return res.json();
}

export const api = {
  // Alumnos
  searchStudents: (filters: SearchFilters) =>
    request<Student[]>(`/students?${new URLSearchParams(filters as any)}`),
  createStudent: (data: any) =>
    request<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: string, data: any) =>
    request<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Profesionales
  searchProfessionals: (filters: SearchFilters) =>
    request<Professional[]>(`/professionals?${new URLSearchParams(filters as any)}`),
  createProfessional: (data: any) =>
    request<Professional>('/professionals', { method: 'POST', body: JSON.stringify(data) }),
  updateProfessional: (id: string, data: any) =>
    request<Professional>(`/professionals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Centros
  searchCenters: (filters: SearchFilters) =>
    request<Center[]>(`/centers?${new URLSearchParams(filters as any)}`),
  createCenter: (data: any) =>
    request<Center>('/centers', { method: 'POST', body: JSON.stringify(data) }),

  // Usuario
  getMe: () => request<User>('/users/me'),
};
