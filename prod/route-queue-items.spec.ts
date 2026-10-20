import { test, expect, Page } from '@playwright/test';
import { env, AUTH_FILE, QueuePerson } from '../env';

test.use({ storageState: AUTH_FILE });

const PEOPLE_QUEUES: QueuePerson[] = env.queueUsers;

const ROW_CHECKBOX_ROLE_NAME = 'selecione ou anule a seleção da linha';

function rowCheckboxes(page: Page) {
  return page.getByRole('checkbox', { name: ROW_CHECKBOX_ROLE_NAME });
}

async function hasRemainingRows(page: Page): Promise<boolean> {
  const total = await rowCheckboxes(page).count();
  return total > 0;
}

async function selectNextRow(page: Page) {
  const checkboxInput = rowCheckboxes(page).first();
  await checkboxInput.waitFor({ state: 'attached', timeout: 10000 });

  const label = checkboxInput.locator('xpath=following-sibling::label[1]');
  await label.click({ timeout: 10000 });
}

async function routeSelectedItemsToQueue(
  page: Page,
  person: QueuePerson
) {
  const rotaMenuItem = page.getByRole('menuitem', { name: 'Rota Encaminhar os itens' });

  console.log('[rotear] procurando o menu "Rota" já visível...');
  const jaVisivel = await rotaMenuItem
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (!jaVisivel) {
    console.log('[rotear] "Rota" não apareceu direto, abrindo menu de mais comandos...');
    await page.getByText(/Linhas:\s*\d+Selecionado\(s\):/).click({ timeout: 10000 });
  }

  console.log('[rotear] clicando em "Rota Encaminhar os itens"');
  await rotaMenuItem.click({ timeout: 10000 });

  console.log('[rotear] clicando no combobox "Rotear para"');
  await page.getByRole('combobox', { name: 'Rotear para' }).click({ timeout: 10000 });

  console.log('[rotear] selecionando opção "Usuário/Equipe"');
  await page.getByRole('option', { name: 'Usuário/Equipe' }).click({ timeout: 10000 });

  console.log('[rotear] clicando no combobox de usuário');
  const userCombo = page.getByRole('combobox', { name: 'Adicionar ao seguinte usuário' });
  await userCombo.click({ timeout: 10000 });

  console.log(`[rotear] preenchendo "${person.searchTerm}"`);
  await userCombo.fill(person.searchTerm);

  console.log(`[rotear] selecionando "${person.displayName}" na árvore`);
  await page.getByRole('treeitem', { name: person.displayName }).click({ timeout: 10000 });

  console.log('[rotear] confirmando em "Roteiro"');
  await page.getByRole('button', { name: 'Roteiro' }).click({ timeout: 10000 });

  console.log('[rotear] item roteado com sucesso');
}

test('distribuir itens da fila um a um entre as pessoas da fila (round-robin)', async ({ page }) => {
  test.setTimeout(10 * 60 * 1000);

  console.log('[fila] reutilizando sessão salva, abrindo Dynamics direto...');
  await page.goto(env.dashboardUrl);
  await page
    .locator('div')
    .filter({ hasText: /^\.cls-1\{fill:none;\}Queue_EFBFItens da Fila$/ })
    .nth(1)
    .click();

  await page.getByRole('button', { name: 'Trabalhado por' }).click();
  await page.getByRole('menuitem', { name: 'Filtrar por' }).click();
  await page.getByText('É igual a').click();
  await page.getByRole('option', { name: 'Não contém dados' }).click();
  await page.getByRole('button', { name: 'Aplicar' }).click();

  await page.waitForTimeout(800);

  console.log('[filtro2] clicando no cabeçalho "Resposta Enviada? (Objeto)"');
  await page.getByRole('button', { name: 'Resposta Enviada? (Objeto)' }).click({ timeout: 8000 });

  console.log('[filtro2] clicando em "Filtrar por"');
  await page.getByRole('menuitem', { name: 'Filtrar por' }).click({ timeout: 8000 });

  console.log('[filtro2] abrindo dropdown de operador ("É igual a")');
  await page.getByText('É igual a').click({ timeout: 8000 });

  console.log('[filtro2] selecionando operador "Começa com"');
  await page.getByRole('option', { name: 'Começa com', exact: true }).click({ timeout: 8000 });

  console.log('[filtro2] clicando no campo "Filtrar por valor"');
  await page.getByRole('textbox', { name: 'Filtrar por valor' }).click({ timeout: 8000 });

  console.log('[filtro2] preenchendo valor "N"');
  await page.getByRole('textbox', { name: 'Filtrar por valor' }).fill('N');

  console.log('[filtro2] clicando em "Aplicar"');
  await page.getByRole('button', { name: 'Aplicar' }).click({ timeout: 8000 });

  console.log('[filtro2] filtro aplicado com sucesso');

  await rowCheckboxes(page)
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});

  const checkboxCountNow = await rowCheckboxes(page).count();
  console.log(`[filtro2] checkboxes de linha encontrados: ${checkboxCountNow}`);

  const MAX_ITEMS_SAFETY_LIMIT = 500;
  let personIndex = 0;

  while (await hasRemainingRows(page)) {
    if (personIndex >= MAX_ITEMS_SAFETY_LIMIT) {
      throw new Error(`Limite de segurança de ${MAX_ITEMS_SAFETY_LIMIT} itens atingido.`);
    }

    const person = PEOPLE_QUEUES[personIndex % PEOPLE_QUEUES.length];

    console.log(`[distribuir] item ${personIndex + 1} -> ${person.displayName}`);

    await selectNextRow(page);

    await routeSelectedItemsToQueue(page, person);
    
    console.log('[distribuir] aguardando grid atualizar...');
    await rowCheckboxes(page)
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {});

    console.log(`[distribuir] linhas restantes no grid: ${await rowCheckboxes(page).count()}`);

    personIndex++;
  }

  await page.waitForTimeout(8000);
});
