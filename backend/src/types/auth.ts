export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface ResetTokenPayload {
  userId: string;
  email: string;
  exp: number;
}
