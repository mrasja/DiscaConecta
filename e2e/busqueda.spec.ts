import { test, expect } from '@playwright/test';

test.describe('Búsqueda de profesionales', () => {
  test.beforeEach(async ({ page }) => {
    // El banner de privacidad y el modal de onboarding son overlays de pantalla completa
    // en la primera visita — precargamos sus flags para probar la búsqueda en sí, no esos overlays.
    await page.addInitScript(() => {
      localStorage.setItem('discaconecta_consent_v1', 'accepted');
      localStorage.setItem('discaconecta_geo_asked', '1');
      localStorage.setItem('discaconecta_onboarding_done_v2', '1');
    });
    // networkidle, no el 'load' default: con 'load', a veces el click de un test
    // llega antes de que React termine de hidratar el botón — el elemento ya está
    // visible en el DOM servido pero todavía no tiene el handler de React enganchado,
    // así que el click no hace nada y la aserción posterior falla sin motivo aparente.
    await page.goto('/dashboard/alumno', { waitUntil: 'networkidle' });
  });

  test('muestra la página principal con las tabs', async ({ page }) => {
    await expect(page.getByText('DiscaConecta')).toBeVisible();
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
    // El input con este placeholder solo existe en la barra compacta mobile (md:hidden).
    await page.setViewportSize({ width: 390, height: 844 });
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
