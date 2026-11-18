import type { NextFunction, Request, Response } from 'express';
import supabase from '../config/supabase.js';

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

/**
 * Valida o segredo de execução do Cron (ex: GitHub Actions / cron-job.org).
 * Em ambiente sem `CRON_SECRET` definido, libera em modo desenvolvimento com aviso.
 */
export function verifyCronSecret(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret) {
    console.warn(
      '[AuthMiddleware] CRON_SECRET não definido no .env. Permitindo requisição em modo de desenvolvimento.'
    );
    return next();
  }

  const receivedSecret = req.headers['x-cron-secret'];

  if (typeof receivedSecret !== 'string' || receivedSecret !== configuredSecret) {
    return res.status(401).json({
      error: 'Não autorizado. Header x-cron-secret inválido ou ausente.',
    });
  }

  return next();
}

/**
 * Anexa `req.user` se um token JWT válido do Supabase Auth for enviado.
 * Caso contrário, segue como visitante (`req.user = null`) para permitir o modo somente leitura.
 */
export async function attachOptionalUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user || !data.user.email) {
      req.user = null;
      return next();
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };
    return next();
  } catch (error) {
    console.error('[AuthMiddleware] Erro ao validar token opcional:', error);
    req.user = null;
    return next();
  }
}

/**
 * Exige autenticação via JWT do Supabase Auth para mutações (criar, editar, excluir e pingar).
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Não autorizado. Faça login para executar esta ação.',
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user || !data.user.email) {
      return res.status(401).json({
        error: 'Sessão inválida ou expirada. Faça login novamente.',
      });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };
    return next();
  } catch (error) {
    console.error('[AuthMiddleware] Erro ao validar sessão do usuário:', error);
    return res.status(500).json({
      error: 'Erro interno ao validar autenticação.',
    });
  }
}
