import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

interface RateLimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
  skipPaths?: string[];
}

/**
 * Fábrica de middlewares de rate limit com resposta JSON padronizada (HTTP 429)
 * e headers padrão `RateLimit-*` (RFC draft-7).
 */
function createRateLimiter({
  windowMs,
  limit,
  message,
  skipPaths = [],
}: RateLimiterOptions): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
    skip: (req) => skipPaths.some((path) => req.path === path),
  });
}

/** Limite geral da API: protege contra flood/scraping sem afetar o polling do dashboard. */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  message: 'Muitas requisições enviadas. Aguarde 1 minuto e tente novamente.',
  skipPaths: ['/health'],
});

/** Limite estrito para autenticação e recuperação de senha (mitiga brute-force e abuso de e-mail). */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Muitas tentativas de autenticação. Aguarde 15 minutos antes de tentar novamente.',
});

/** Limite para disparos manuais ou em lote de ping HTTP. */
export const pingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: 'Limite de disparos de ping atingido. Aguarde 1 minuto e tente novamente.',
});
