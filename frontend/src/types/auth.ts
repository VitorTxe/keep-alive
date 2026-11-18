export type AuthMode = 'login' | 'register';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthSessionPayload {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}
