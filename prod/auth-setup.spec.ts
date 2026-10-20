import { test } from '@playwright/test';
import { env, AUTH_FILE } from '../env';

test('login e salvar sessão autenticada', async ({ page }) => {
  test.setTimeout(2 * 60 * 1000);

  await page.goto(env.loginUrl);
  await page.getByRole('textbox', { name: 'Enter your email, phone, or' }).click();
  await page.getByRole('textbox', { name: 'Enter your email, phone, or' }).fill(env.email);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#i0118').fill(env.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();

  console.log('[auth] login concluído, abrindo Dynamics para confirmar sessão...');
  await page.goto(env.dashboardUrl);
  await page.waitForTimeout(5000);

  await page.context().storageState({ path: AUTH_FILE });
  console.log(`[auth] sessão salva em ${AUTH_FILE}`);
});
