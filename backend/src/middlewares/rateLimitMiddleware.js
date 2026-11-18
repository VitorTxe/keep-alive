import rateLimit from 'express-rate-limit';

function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: message });
    },
  });
}

/** Limite geral para toda a API (120 req/min por IP). */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Muitas requisições deste IP. Aguarde um minuto e tente novamente.',
});

/** Limite estrito para autenticação e recuperação de senha (15 tentativas / 15 min). */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Muitas tentativas de autenticação. Aguarde 15 minutos e tente novamente.',
});

/** Limite para disparos manuais de ping (20 req/min por IP). */
export const pingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Limite de pings manuais atingido. Aguarde um minuto antes de tentar novamente.',
});
