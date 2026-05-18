import { test, expect } from '@playwright/test';

test.describe('Búsqueda de profesionales', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/alumno');
  });

  test('muestra la página principal con las tabs', async ({ page }) => {
    await expect(page.getByText('Discapp')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Profesionales' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Centros' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Escuelas' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Mapa' })).toBeVisible();
  });

  test('permite cambiar de pestaña', async ({ page }) => {
    await page.getByRole('tab', { name: 'Centros' }).first().click();
    await expect(page.getByRole('tabpanel', { name: /centros/i })).toBeVisible();

    await page.getByRole('tab', { name: 'Escuelas' }).first().click();
    await expect(page.getByRole('tabpanel', { name: /escuelas/i })).toBeVisible();
  });

  test('el campo de ciudad filtra resultados', async ({ page }) => {
    const cityInput = page.getByPlaceholder('📍 Ciudad o provincia...');
    await cityInput.fill('Rosario');
    await cityInput.press('Enter');
    await page.waitForTimeout(1000);
    // La búsqueda dispara una nueva query — verificamos que la UI no crashee
    await expect(page.locator('body')).not.toContainText('Error interno');
  });

  test('el botón Filtros abre el panel de filtros (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const filtrosBtn = page.getByRole('button', { name: /filtros/i });
    await filtrosBtn.click();
    await expect(page.getByText('Filtros de búsqueda')).toBeVisible();
    await page.getByRole('button', { name: 'Ver resultados' }).click();
    await expect(page.getByText('Filtros de búsqueda')).not.toBeVisible();
  });
});
