import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('la página de login carga correctamente', async ({ page }) => {
    await page.goto('/login');
    // getByText('DiscaConecta') es ambiguo: el banner de privacidad también dice "DiscaConecta
    // recolecta datos...", así que apuntamos al heading específico.
    await expect(page.getByRole('heading', { name: 'DiscaConecta' })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('redirige al login si accede a una ruta protegida sin sesión', async ({ page }) => {
    await page.goto('/dashboard/perfil');
    await expect(page).toHaveURL(/\/login/);
  });

  test('sin sesión, /dashboard entra directo al buscador público (no fuerza login)', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard\/alumno/);
  });
});
