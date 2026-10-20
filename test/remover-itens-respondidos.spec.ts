import { test, expect } from '@playwright/test';
import { env, AUTH_FILE } from '../env';

test.use({ storageState: AUTH_FILE });

test('remover itens da fila com resposta já enviada', async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);

  console.log('[fila] reutilizando sessão salva, abrindo Dynamics direto...');
  await page.goto(env.dashboardUrl);

  console.log('[fila] abrindo "Itens da Fila"');
  await page.getByText('.cls-1{fill:none;}Queue_EFBFItens da Fila').click({ timeout: 30000 });

  console.log('[filtro] abrindo cabeçalho "Resposta Enviada? (Objeto)"');
  await page.getByRole('button', { name: 'Resposta Enviada? (Objeto)' }).click({ timeout: 10000 });
  await page.getByRole('menuitem', { name: 'Filtrar por' }).click({ timeout: 10000 });
  await page.getByText('É igual a').click({ timeout: 10000 });
  await page.getByRole('option', { name: 'Começa com', exact: true }).click({ timeout: 10000 });
  await page.getByRole('textbox', { name: 'Filtrar por valor' }).click({ timeout: 10000 });
  await page.getByRole('textbox', { name: 'Filtrar por valor' }).fill('S');
  await page.getByRole('button', { name: 'Aplicar' }).click({ timeout: 10000 });

  console.log('[filtro] aguardando grade recarregar com o filtro aplicado...');
  await page.waitForTimeout(1500);

  const rowCheckboxes = page.getByRole('checkbox', { name: 'selecione ou anule a seleção da linha' });
  const hasRows = await rowCheckboxes
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (!hasRows) {
    console.log('[filtro] nenhuma linha encontrada para o filtro aplicado, encerrando sem remover.');
    return;
  }

  console.log(`[selecionar] linhas encontradas: ${await rowCheckboxes.count()}, marcando todas`);
  const selectAllCheckbox = page.getByRole('checkbox', { name: 'Alternar seleção de todas as linhas' });
  await selectAllCheckbox.locator('xpath=following-sibling::label[1]').click({ timeout: 10000 });

  console.log('[remover] clicando em "Remover"');
  await page.getByRole('menuitem', { name: 'Remover Remover este item da' }).click({ timeout: 10000 });

  console.log('[remover] confirmando remoção');
  await page.getByRole('button', { name: 'Remover' }).click({ timeout: 15000 });

  console.log('[remover] itens removidos com sucesso');
});