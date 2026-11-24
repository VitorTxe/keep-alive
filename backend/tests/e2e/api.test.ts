import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
}));

vi.mock('../../src/config/supabase.js', () => ({
  default: {
    auth: {
      getUser: getUserMock,
    },
  },
}));

import app from '../../src/app.js';

describe('Backend API E2E', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  describe('Healthcheck & 404', () => {
    it('GET /api/health deve retornar status ok e metadados do serviço', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'monitoramento-keep-alive',
      });
      expect(typeof response.body.uptimeSeconds).toBe('number');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('deve retornar 404 JSON para rota inexistente', async () => {
      const response = await request(app).get('/api/rota-que-nao-existe');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Rota não encontrada: GET /api/rota-que-nao-existe',
      });
    });
  });

  describe('CORS', () => {
    it('deve permitir requisições da origem autorizada http://localhost:5173', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('deve responder 204 no preflight OPTIONS para origem autorizada', async () => {
      const response = await request(app)
        .options('/api/projects')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization, x-cron-secret');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('deve bloquear origem não autorizada com HTTP 403', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://origem-nao-autorizada.example.com');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Origem não permitida pelo CORS');
    });
  });

  describe('Autenticação & Autorização', () => {
    it('deve bloquear mutações em /api/projects sem Bearer token (HTTP 401)', async () => {
      const [createRes, updateRes, deleteRes, pingRes] = await Promise.all([
        request(app).post('/api/projects').send({ name: 'Teste' }),
        request(app).patch('/api/projects/proj-1').send({ name: 'Editado' }),
        request(app).delete('/api/projects/proj-1'),
        request(app).post('/api/projects/proj-1/ping'),
      ]);

      for (const res of [createRes, updateRes, deleteRes, pingRes]) {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({
          error: 'Não autorizado. Faça login para executar esta ação.',
        });
      }
    });

    it('GET /api/auth/me deve retornar 401 quando o token JWT for inválido', async () => {
      getUserMock.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Invalid JWT'),
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
      expect(resError(response.body)).toBe('Sessão inválida ou expirada. Faça login novamente.');
    });

    it('GET /api/auth/me deve retornar o usuário autenticado quando o token for válido', async () => {
      getUserMock.mockResolvedValueOnce({
        data: { user: { id: 'user-1', email: 'dev@keepalive.test' } },
        error: null,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-valido');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: { id: 'user-1', email: 'dev@keepalive.test' },
      });
    });

    it('POST /api/cron/ping-all deve retornar 401 quando CRON_SECRET estiver ativo e o header for inválido', async () => {
      process.env.CRON_SECRET = 'segredo-cron-teste';

      const response = await request(app)
        .post('/api/cron/ping-all')
        .set('x-cron-secret', 'segredo-errado');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Não autorizado. Header x-cron-secret inválido ou ausente.',
      });
    });
  });

  describe('Rate Limit', () => {
    it('deve incluir headers padrão RateLimit-* nas rotas da API', async () => {
      const response = await request(app)
        .get('/api/rota-qualquer')
        .set('X-Forwarded-For', '10.0.0.50');

      expect(response.status).toBe(404);
      expect(response.headers.ratelimit).toBeDefined();
    });

    it('deve bloquear após 10 tentativas em /api/auth/login retornando HTTP 429', async () => {
      const clientIp = '10.0.0.99';

      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('X-Forwarded-For', clientIp)
          .send({});

        expect(res.status).not.toBe(429);
      }

      const blockedResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', clientIp)
        .send({});

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body).toEqual({
        error: 'Muitas tentativas de autenticação. Aguarde 15 minutos antes de tentar novamente.',
      });
    });
  });
});

function resError(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const value = (body as { error: unknown }).error;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}
