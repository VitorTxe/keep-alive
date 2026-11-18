import supabase from '../config/supabase.js';

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

/**
 * Valida o segredo de execução do Cron (ex: GitHub Actions / Cloudflare Workers).
 * Em ambiente sem CRON_SECRET definido, libera em modo desenvolvimento com aviso.
 */
export function verifyCronSecret(req, res, next) {
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret) {
    console.warn(
      '[AuthMiddleware] CRON_SECRET não definido no .env. Permitindo requisição em modo de desenvolvimento.'
    );
    return next();
  }

  const receivedSecret = req.headers['x-cron-secret'];

  if (!receivedSecret || receivedSecret !== configuredSecret) {
    return res.status(401).json({
      error: 'Não autorizado. Header x-cron-secret inválido ou ausente.',
    });
  }

  return next();
}

/**
 * Anexa req.user se um token JWT válido do Supabase Auth for enviado.
 * Caso contrário, segue como visitante (req.user = null).
 */
export async function attachOptionalUser(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
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
 * Exige autenticação via JWT do Supabase Auth para ações de criação, edição e exclusão.
 */
export async function requireAuth(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Não autorizado. Faça login para executar esta ação.',
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
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

/**
 * Permite execução via CRON_SECRET (automações) ou via JWT de usuário autenticado (painel).
 */
export async function verifyCronOrUser(req, res, next) {
  const receivedSecret = req.headers['x-cron-secret'];
  if (receivedSecret) {
    return verifyCronSecret(req, res, next);
  }

  const token = extractBearerToken(req);
  if (token) {
    return requireAuth(req, res, next);
  }

  return verifyCronSecret(req, res, next);
}
