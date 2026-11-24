import type { Page, Route } from '@playwright/test';
import type {
  AuthenticatedUser,
  AuthSessionPayload,
  PingLog,
  Project,
  ProjectFormPayload,
  ProjectsListResponse,
  ProjectsSummary,
  SinglePingResponse,
} from '../../src/types';

export interface MockApiOptions {
  initialProjects?: Project[];
  initialLogs?: PingLog[];
  authenticatedUser?: AuthenticatedUser;
  failDashboardRequests?: boolean;
}

const DEFAULT_USER: AuthenticatedUser = {
  id: 'user-e2e-1',
  email: 'admin@keepalive.dev',
};

export function createSampleProjects(): Project[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'proj-1',
      userId: DEFAULT_USER.id,
      notificationEmail: DEFAULT_USER.email,
      name: 'API Principal',
      pingUrl: 'https://api-principal.onrender.com/health',
      secretHeader: null,
      providerInfo: 'Render + Postgres',
      isActive: true,
      lastStatus: 'ONLINE',
      lastPingAt: now,
      lastLatencyMs: 145,
      dbSizeMb: 42.5,
      createdAt: now,
      updatedAt: now,
      logs: [],
    },
    {
      id: 'proj-2',
      userId: DEFAULT_USER.id,
      notificationEmail: DEFAULT_USER.email,
      name: 'Worker Faturamento',
      pingUrl: 'https://worker-faturamento.vercel.app/api/ping',
      secretHeader: null,
      providerInfo: 'Vercel + Supabase',
      isActive: true,
      lastStatus: 'COLD_START',
      lastPingAt: now,
      lastLatencyMs: 3200,
      dbSizeMb: 18.2,
      createdAt: now,
      updatedAt: now,
      logs: [],
    },
    {
      id: 'proj-3',
      userId: DEFAULT_USER.id,
      notificationEmail: DEFAULT_USER.email,
      name: 'Gateway Pagamentos',
      pingUrl: 'https://gateway.example.com/health',
      secretHeader: null,
      providerInfo: 'Cloudflare + D1',
      isActive: true,
      lastStatus: 'OFFLINE',
      lastPingAt: now,
      lastLatencyMs: 0,
      dbSizeMb: null,
      createdAt: now,
      updatedAt: now,
      logs: [],
    },
  ];
}

export function createSampleLogs(): PingLog[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'log-1',
      projectId: 'proj-1',
      httpStatus: 200,
      status: 'ONLINE',
      httpLatencyMs: 145,
      dbLatencyMs: 28,
      errorMessage: null,
      triggerType: 'CRON',
      createdAt: now,
      project: {
        name: 'API Principal',
        providerInfo: 'Render + Postgres',
      },
    },
  ];
}

function computeSummary(projects: Project[]): ProjectsSummary {
  return {
    totalProjects: projects.length,
    onlineCount: projects.filter((p) => p.lastStatus === 'ONLINE').length,
    coldStartCount: projects.filter((p) => p.lastStatus === 'COLD_START').length,
    offlineCount: projects.filter((p) => p.lastStatus === 'OFFLINE').length,
  };
}

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Intercepta chamadas `/api/**` no Playwright mantendo estado em memória por teste,
 * garantindo execução E2E determinística sem depender do Supabase remoto.
 */
export async function setupMockApi(page: Page, options: MockApiOptions = {}): Promise<void> {
  let projects = [...(options.initialProjects ?? createSampleProjects())];
  let logs = [...(options.initialLogs ?? createSampleLogs())];
  const user = options.authenticatedUser ?? DEFAULT_USER;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

    if (options.failDashboardRequests && (path === '/projects' || path === '/logs')) {
      await fulfillJson(route, 500, { error: 'Falha simulada no servidor de monitoramento.' });
      return;
    }

    if (method === 'POST' && (path === '/auth/login' || path === '/auth/register')) {
      const payload: AuthSessionPayload = {
        user,
        accessToken: 'e2e-jwt-token',
        refreshToken: 'e2e-refresh-token',
      };
      await fulfillJson(route, 200, payload);
      return;
    }

    if (method === 'GET' && path === '/auth/me') {
      const authHeader = request.headers().authorization;
      if (!authHeader) {
        await fulfillJson(route, 401, { error: 'Token ausente.' });
        return;
      }
      await fulfillJson(route, 200, { user });
      return;
    }

    if (method === 'GET' && path === '/projects') {
      const response: ProjectsListResponse = {
        summary: computeSummary(projects),
        projects,
      };
      await fulfillJson(route, 200, response);
      return;
    }

    if (method === 'GET' && path === '/logs') {
      await fulfillJson(route, 200, logs);
      return;
    }

    if (method === 'POST' && path === '/projects') {
      const body = request.postDataJSON() as ProjectFormPayload;
      const now = new Date().toISOString();
      const created: Project = {
        id: `proj-${Date.now()}`,
        userId: user.id,
        notificationEmail: user.email,
        name: body.name,
        pingUrl: body.pingUrl,
        secretHeader: body.secretHeader,
        providerInfo: body.providerInfo,
        isActive: body.isActive ?? true,
        lastStatus: 'PENDING',
        lastPingAt: null,
        lastLatencyMs: null,
        dbSizeMb: null,
        createdAt: now,
        updatedAt: now,
        logs: [],
      };
      projects = [created, ...projects];
      await fulfillJson(route, 201, created);
      return;
    }

    const pingMatch = path.match(/^\/projects\/([^/]+)\/ping$/);
    if (method === 'POST' && pingMatch) {
      const projectId = pingMatch[1];
      const target = projects.find((p) => p.id === projectId);
      if (!target) {
        await fulfillJson(route, 404, { error: 'Projeto não encontrado.' });
        return;
      }
      const now = new Date().toISOString();
      const updated: Project = {
        ...target,
        lastStatus: 'ONLINE',
        lastPingAt: now,
        lastLatencyMs: 112,
        updatedAt: now,
      };
      projects = projects.map((p) => (p.id === projectId ? updated : p));

      const newLog: PingLog = {
        id: `log-${Date.now()}`,
        projectId,
        httpStatus: 200,
        status: 'ONLINE',
        httpLatencyMs: 112,
        dbLatencyMs: 24,
        errorMessage: null,
        triggerType: 'MANUAL',
        createdAt: now,
        project: {
          name: updated.name,
          providerInfo: updated.providerInfo,
        },
      };
      logs = [newLog, ...logs];

      const response: SinglePingResponse = {
        message: 'Ping executado com sucesso.',
        project: updated,
        log: newLog,
      };
      await fulfillJson(route, 200, response);
      return;
    }

    const projectMatch = path.match(/^\/projects\/([^/]+)$/);
    if (projectMatch && method === 'PATCH') {
      const projectId = projectMatch[1];
      const body = request.postDataJSON() as Partial<ProjectFormPayload>;
      const target = projects.find((p) => p.id === projectId);
      if (!target) {
        await fulfillJson(route, 404, { error: 'Projeto não encontrado.' });
        return;
      }
      const updated: Project = {
        ...target,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      projects = projects.map((p) => (p.id === projectId ? updated : p));
      await fulfillJson(route, 200, updated);
      return;
    }

    if (projectMatch && method === 'DELETE') {
      const projectId = projectMatch[1];
      projects = projects.filter((p) => p.id !== projectId);
      logs = logs.filter((l) => l.projectId !== projectId);
      await fulfillJson(route, 200, { message: 'Projeto excluído com sucesso.' });
      return;
    }

    await fulfillJson(route, 404, { error: `Rota mock não mapeada: ${method} ${path}` });
  });
}
