import crypto from 'node:crypto';
import supabase, { createStatelessAuthClient } from '../config/supabase.js';
import { sendPasswordResetEmail } from '../services/alertService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

function getResetSecret() {
  return process.env.PASSWORD_RESET_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function createResetToken(userId, email) {
  const payload = Buffer.from(
    JSON.stringify({ userId, email, exp: Date.now() + RESET_TOKEN_TTL_MS })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getResetSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifyResetToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
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
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded?.userId || !decoded?.exp || Date.now() > decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function validateCredentials(email, password) {
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return 'Informe um endereço de e-mail válido.';
  }

  if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  return null;
}

async function syncPublicUser(user) {
  if (!user?.id || !user?.email) return;

  const { error } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email }, { onConflict: 'id' });

  if (error) {
    console.error('[AuthController] Erro ao sincronizar usuário em public.users:', error);
  }
}

export async function register(req, res, next) {
  try {
    const { email, password } = req.body ?? {};
    const validationError = validateCredentials(email, password);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (createError) {
      const isDuplicate =
        createError.message?.toLowerCase().includes('already') ||
        createError.status === 422;
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
        password,
      });

    if (signInError || !sessionData?.session) {
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

export async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {};
    const validationError = validateCredentials(email, password);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const authClient = createStatelessAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
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

export function getCurrentUser(req, res) {
  return res.status(200).json({ user: req.user });
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body ?? {};
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
      const token = createResetToken(user.id, user.email);
      const baseUrl = (
        process.env.FRONTEND_URL ||
        req.headers.origin ||
        'http://localhost:5173'
      ).replace(/\/$/, '');
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

      await sendPasswordResetEmail({ email: user.email, resetUrl });
    }

    return res.status(200).json({
      message: 'Se o e-mail estiver cadastrado, enviaremos um link para criar uma nova senha.',
    });
  } catch (error) {
    console.error('[AuthController] Erro ao solicitar redefinição de senha:', error);
    return next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body ?? {};

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
