import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import supabase, { createStatelessAuthClient } from '../config/supabase.js';
import { sendPasswordResetEmail } from '../services/alertService.js';
import type { ResetTokenPayload } from '../types/index.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

interface CredentialsBody {
  email?: unknown;
  password?: unknown;
}

interface ResetPasswordBody {
  token?: unknown;
  password?: unknown;
}

function getResetSecret(): string {
  return process.env.PASSWORD_RESET_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

/**
 * Gera um token stateless auto-contido (`payloadBase64.hmacSignature`) com expiração de 15 minutos.
 * Evita a necessidade de criar uma tabela extra de tokens de reset no banco de dados.
 */
function createResetToken(userId: string, email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, email, exp: Date.now() + RESET_TOKEN_TTL_MS })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getResetSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verifica a integridade e a validade temporal do token de reset usando `timingSafeEqual`
 * para mitigar ataques de temporização (timing attacks) na comparação de assinaturas HMAC.
 */
function verifyResetToken(token: unknown): ResetTokenPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', getResetSecret())
    .update(payload)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded !== 'object') return null;

    const candidate = decoded as Partial<ResetTokenPayload>;
    if (
      typeof candidate.userId !== 'string' ||
      typeof candidate.email !== 'string' ||
      typeof candidate.exp !== 'number' ||
      Date.now() > candidate.exp
    ) {
      return null;
    }

    return {
      userId: candidate.userId,
      email: candidate.email,
      exp: candidate.exp,
    };
  } catch {
    return null;
  }
}

function validateCredentials(email: unknown, password: unknown): string | null {
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return 'Informe um endereço de e-mail válido.';
  }

  if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  return null;
}

/**
 * Garante que o usuário autenticado exista na tabela `public.users` (fallback defensivo
 * caso a trigger `on_auth_user_created` do PostgreSQL ainda não tenha sido aplicada).
 */
async function syncPublicUser(user: { id?: string; email?: string } | null): Promise<void> {
  if (!user?.id || !user?.email) return;

  const { error } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email }, { onConflict: 'id' });

  if (error) {
    console.error('[AuthController] Erro ao sincronizar usuário em public.users:', error);
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { email, password } = (req.body ?? {}) as CredentialsBody;
    const validationError = validateCredentials(email, password);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normalizedEmail = (email as string).trim().toLowerCase();
    const validPassword = password as string;

    const { error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: validPassword,
      email_confirm: true,
    });

    if (createError) {
      const isDuplicate =
        createError.message?.toLowerCase().includes('already') || createError.status === 422;
      return res.status(isDuplicate ? 409 : 400).json({
        error: isDuplicate
          ? 'Este e-mail já está cadastrado. Faça login.'
          : createError.message || 'Não foi possível criar a conta.',
      });
    }

    const authClient = createStatelessAuthClient();
    const { data: sessionData, error: signInError } =
      await authClient.auth.signInWithPassword({
        email: normalizedEmail,
        password: validPassword,
      });

    if (signInError || !sessionData?.session || !sessionData.user) {
      return res.status(500).json({
        error: 'Conta criada, mas não foi possível iniciar a sessão automaticamente.',
      });
    }

    await syncPublicUser(sessionData.user);

    return res.status(201).json({
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
      },
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
    });
  } catch (error) {
    console.error('[AuthController] Erro ao registrar usuário:', error);
    return next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { email, password } = (req.body ?? {}) as CredentialsBody;
    const validationError = validateCredentials(email, password);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const authClient = createStatelessAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
      email: (email as string).trim().toLowerCase(),
      password: password as string,
    });

    if (error || !data?.session || !data?.user) {
      return res.status(401).json({
        error: 'E-mail ou senha inválidos.',
      });
    }

    await syncPublicUser(data.user);

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    console.error('[AuthController] Erro ao autenticar usuário:', error);
    return next(error);
  }
}

export function getCurrentUser(req: Request, res: Response): Response {
  return res.status(200).json({ user: req.user });
}

/**
 * Solicita redefinição de senha retornando sempre a mesma mensagem HTTP 200
 * mesmo quando o e-mail não existe, prevenindo enumeração de usuários (User Enumeration).
 */
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { email } = (req.body ?? {}) as { email?: unknown };
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(`[AuthController] Erro ao buscar usuário para reset: ${error.message}`);
    }

    if (user) {
      const token = createResetToken(user.id as string, user.email as string);
      const baseUrl = (
        process.env.FRONTEND_URL ||
        req.headers.origin ||
        'http://localhost:5173'
      ).replace(/\/$/, '');
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

      await sendPasswordResetEmail({ email: user.email as string, resetUrl });
    }

    return res.status(200).json({
      message: 'Se o e-mail estiver cadastrado, enviaremos um link para criar uma nova senha.',
    });
  } catch (error) {
    console.error('[AuthController] Erro ao solicitar redefinição de senha:', error);
    return next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { token, password } = (req.body ?? {}) as ResetPasswordBody;

    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      });
    }

    const decoded = verifyResetToken(token);
    if (!decoded) {
      return res.status(400).json({
        error: 'Link de redefinição inválido ou expirado. Solicite um novo link.',
      });
    }

    const { error } = await supabase.auth.admin.updateUserById(decoded.userId, {
      password,
    });

    if (error) {
      return res.status(400).json({
        error: error.message || 'Não foi possível atualizar a senha.',
      });
    }

    return res.status(200).json({
      message: 'Senha redefinida com sucesso! Você já pode fazer login.',
    });
  } catch (error) {
    console.error('[AuthController] Erro ao redefinir senha:', error);
    return next(error);
  }
}
