import { test, expect } from '@playwright/test';

test.describe('Perfil de profesional', () => {
  test('la API de profesionales devuelve array', async ({ request }) => {
    const res = await request.get('/api/professionals?city=Buenos%20Aires&limit=5');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('la API de centros devuelve array', async ({ request }) => {
    const res = await request.get('/api/centros?limit=5');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('la API de escuelas devuelve array', async ({ request }) => {
    const res = await request.get('/api/escuelas?limit=5');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('un ID inválido en /profesional devuelve 404', async ({ page }) => {
    const res = await page.goto('/profesional/00000000-0000-0000-0000-000000000000');
    expect(res?.status()).toBe(404);
  });

  test('un ID inválido en /centro devuelve 404', async ({ page }) => {
    const res = await page.goto('/centro/00000000-0000-0000-0000-000000000000');
    expect(res?.status()).toBe(404);
  });
});
