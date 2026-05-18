import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('la página de login carga correctamente', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Discapp')).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('redirige al login si accede a una ruta protegida sin sesión', async ({ page }) => {
    await page.goto('/dashboard/perfil');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirige al login desde /dashboard sin sesión', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
