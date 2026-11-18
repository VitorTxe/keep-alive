import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, loginUser, registerUser } from '../services/api';

const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const LEGACY_USER_KEY = 'AUTH_USER';

function readStoredToken() {
  try {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
  } catch (error) {
    console.error('[useAuthSession] Erro ao ler token do localStorage:', error);
    return '';
  }
}

/**
 * Gerencia autenticação por e-mail e senha persistindo apenas o JWT (`AUTH_TOKEN`)
 * no localStorage; os dados do usuário ficam somente em memória via GET /auth/me.
 */
export function useAuthSession(showToast) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasToken, setHasToken] = useState(() => Boolean(readStoredToken()));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated = Boolean(hasToken && (user?.id || readStoredToken()));

  useEffect(() => {
    // Limpa chave legada caso exista de sessões anteriores
    try {
      window.localStorage.removeItem(LEGACY_USER_KEY);
    } catch {
      // Ignora erro de acesso ao storage aqui; o fluxo principal já trata
    }

    const token = readStoredToken();
    
    if (!token) return;

    let cancelled = false;

    async function hydrateUser() {
      try {
        const data = await fetchCurrentUser();
        if (!cancelled && data?.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('[useAuthSession] Erro ao carregar usuário autenticado:', error);
        if (!cancelled && error.status === 401) {
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
          setHasToken(false);
          setUser(null);
          if (showToast) {
            showToast({
              type: 'info',
              title: 'Sessão expirada',
              message: 'Faça login novamente para gerenciar seus projetos.',
            });
          }
        }
      }
    }

    hydrateUser();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const authenticate = useCallback(
    async ({ mode, email, password }) => {
      const normalizedEmail = email.trim();

      if (!normalizedEmail || !password) {
        showToast({
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

        showToast({
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
        showToast({
          type: 'error',
          title: mode === 'register' ? 'Erro ao criar conta' : 'Falha no login',
          message: error.message || 'Verifique suas credenciais e tente novamente.',
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
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Erro ao sair',
          message: 'Não foi possível limpar os dados da sessão.',
        });
      }
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
