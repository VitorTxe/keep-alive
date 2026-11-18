import type { AuthenticatedUser } from './index.js';

/**
 * Estende a interface Request do Express para incluir o usuário autenticado
 * injetado pelos middlewares `requireAuth` e `attachOptionalUser`.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser | null;
    }
  }
}

export {};
