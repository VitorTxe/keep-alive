import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ApiClientError,
  fetchCurrentUser,
  loginUser,
  registerUser,
} from '../services/api';
import type { AuthenticatedUser, AuthMode, ShowToastFn } from '../types';

const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const LEGACY_USER_KEY = 'AUTH_USER';

function readStoredToken(): string {
  try {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
  } catch (error) {
    console.error('[useAuthSession] Erro ao ler token do localStorage:', error);
    return '';
  }
}

export interface AuthenticateParams {
  mode: AuthMode;
  email: string;
  password: string;
}

export interface UseAuthSessionReturn {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  authenticate: (params: AuthenticateParams) => Promise<boolean>;
  signOut: () => void;
}

/**
 * Gerencia autenticação por e-mail e senha persistindo apenas o JWT (`AUTH_TOKEN`)
 * no localStorage; os dados do usuário ficam somente em memória via `GET /auth/me`
 * para evitar exposição de PII persistida no navegador.
 */
export function useAuthSession(showToast?: ShowToastFn): UseAuthSessionReturn {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(() => Boolean(readStoredToken()));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isAuthenticated = Boolean(hasToken && (user?.id || readStoredToken()));

  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_USER_KEY);
    } catch {
      // Ignora erro de acesso ao storage em contextos restritos
    }

    const token = readStoredToken();
    if (!token) return;

    let cancelled = false;

    async function hydrateUser(): Promise<void> {
      try {
        const data = await fetchCurrentUser();
        if (!cancelled && data?.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('[useAuthSession] Erro ao carregar usuário autenticado:', error);
        if (!cancelled && error instanceof ApiClientError && error.status === 401) {
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
          setHasToken(false);
          setUser(null);
          showToast?.({
            type: 'info',
            title: 'Sessão expirada',
            message: 'Faça login novamente para gerenciar seus projetos.',
          });
        }
      }
    }

    void hydrateUser();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const authenticate = useCallback(
    async ({ mode, email, password }: AuthenticateParams): Promise<boolean> => {
      const normalizedEmail = email.trim();

      if (!normalizedEmail || !password) {
        showToast?.({
          type: 'error',
          title: 'Campos obrigatórios',
          message: 'Preencha seu e-mail e senha para continuar.',
        });
        return false;
      }

      setIsSubmitting(true);
      try {
        const action = mode === 'register' ? registerUser : loginUser;
        const payload = await action({ email: normalizedEmail, password });

        window.localStorage.setItem(AUTH_TOKEN_KEY, payload.accessToken);
        setHasToken(true);
        setUser(payload.user);

        showToast?.({
          type: 'success',
          title: mode === 'register' ? 'Conta criada' : 'Bem-vindo de volta',
          message:
            mode === 'register'
              ? `Alertas de status serão enviados para ${payload.user.email}.`
              : `Conectado como ${payload.user.email}.`,
        });

        navigate('/dashboard');
        return true;
      } catch (error) {
        console.error('[useAuthSession] Falha na autenticação:', error);
        const message =
          error instanceof Error
            ? error.message
            : 'Verifique suas credenciais e tente novamente.';
        showToast?.({
          type: 'error',
          title: mode === 'register' ? 'Erro ao criar conta' : 'Falha no login',
          message,
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigate, showToast]
  );

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(LEGACY_USER_KEY);
      setHasToken(false);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('[useAuthSession] Falha ao encerrar sessão:', error);
      showToast?.({
        type: 'error',
        title: 'Erro ao sair',
        message: 'Não foi possível limpar os dados da sessão.',
      });
    }
  }, [navigate, showToast]);

  return {
    user,
    isAuthenticated,
    isSubmitting,
    authenticate,
    signOut,
  };
}
