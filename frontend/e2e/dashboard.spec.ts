import { expect, test } from '@playwright/test';
import { setupMockApi } from './helpers/mockApi';

test.describe('Keep-Alive Monitor E2E', () => {
  test('visitante visualiza dashboard, busca por nome e filtra por status', async ({ page }) => {
    await setupMockApi(page);

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Keep-Alive Monitor' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'API Principal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Worker Faturamento' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gateway Pagamentos' })).toBeVisible();

    const searchInput = page.getByPlaceholder('Buscar por nome ou provedor...');
    await searchInput.fill('Worker');
    await expect(page.getByRole('heading', { name: 'Worker Faturamento' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'API Principal' })).toBeHidden();

    await searchInput.fill('');
    await page.getByRole('button', { name: 'Offline', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Gateway Pagamentos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'API Principal' })).toBeHidden();

    await page.getByRole('button', { name: 'Todos', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'API Principal' })).toBeVisible();
  });

  test('visitante recebe aviso de acesso restrito ao tentar criar projeto', async ({ page }) => {
    await setupMockApi(page);

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Novo Projeto' }).click();

    await expect(page.getByText('Acesso restrito')).toBeVisible();
    await expect(page.getByText(/Faça login para criar projetos/i)).toBeVisible();
  });

  test('fluxo completo autenticado: login, criação, ping manual, pausa, edição e exclusão', async ({
    page,
  }) => {
    await setupMockApi(page);

    await page.goto('/login');
    await page.getByLabel(/E-mail/i).fill('admin@keepalive.dev');
    await page.getByLabel(/Senha \*/i).fill('segredo123');
    await page.getByRole('button', { name: 'Entrar no Dashboard' }).click();

    await page.waitForURL('**/dashboard');
    await expect(page.getByText('admin@keepalive.dev')).toBeVisible();

    // Criar novo projeto
    await page.getByRole('button', { name: 'Novo Projeto' }).click();
    await page.getByLabel(/Nome do Projeto/i).fill('Serviço E2E');
    await page.getByLabel(/URL da Rota de Ping/i).fill('https://e2e.example.com/health');
    await page.getByLabel(/Infraestrutura \/ Provedor/i).fill('Render + Postgres');
    await page.getByRole('button', { name: 'Cadastrar Projeto' }).click();

    const createdCard = page.locator('article', {
      has: page.getByRole('heading', { name: 'Serviço E2E' }),
    });
    await expect(createdCard).toBeVisible();

    // Executar ping manual no projeto recém-criado
    await createdCard.getByRole('button', { name: 'Pingar Agora' }).click();
    await expect(page.getByText('Ping executado')).toBeVisible();

    // Pausar monitoramento via switch
    await createdCard.getByRole('switch').click();
    await expect(createdCard.getByText('Pausado')).toBeVisible();

    // Editar projeto
    await createdCard.getByTitle('Editar projeto').click();
    await page.getByLabel(/Nome do Projeto/i).fill('Serviço E2E Editado');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();

    const editedCard = page.locator('article', {
      has: page.getByRole('heading', { name: 'Serviço E2E Editado' }),
    });
    await expect(editedCard).toBeVisible();

    // Excluir projeto com confirmação em duas etapas
    await editedCard.getByTitle('Excluir projeto').click();
    await editedCard.getByRole('button', { name: 'Confirmar' }).click();
    await expect(editedCard).toBeHidden();
  });

  test('exibe toast de erro quando a API retorna falha 500', async ({ page }) => {
    await setupMockApi(page, { failDashboardRequests: true });

    await page.goto('/dashboard');

    await expect(page.getByText('Falha ao carregar dados').first()).toBeVisible();
    await expect(
      page.getByText('Falha simulada no servidor de monitoramento.').first()
    ).toBeVisible();
  });
});
