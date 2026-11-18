import type {
  AuthenticatedUser,
  AuthSessionPayload,
  BatchPingResponse,
  PingLog,
  Project,
  ProjectFormPayload,
  ProjectsListResponse,
  SinglePingResponse,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3333').replace(/\/$/, '');

export class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('AUTH_TOKEN') || '';
}

function getCronSecret(): string {
  return typeof window !== 'undefined' ? window.localStorage.getItem('CRON_SECRET') || '' : '';
}

/**
 * Wrapper HTTP tipado com injeção automática do JWT (`Bearer`) e normalização
 * de erros HTTP em instâncias de `ApiClientError` contendo `status` e `payload`.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { headers: customHeaders = {}, ...restOptions } = options;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload: unknown = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const errPayload = (payload ?? {}) as ApiErrorPayload;
    const errorMessage =
      errPayload.error ||
      errPayload.message ||
      `Erro HTTP ${response.status} ao acessar ${endpoint}`;
    throw new ApiClientError(errorMessage, response.status, payload);
  }

  return payload as T;
}

export function fetchProjects(): Promise<ProjectsListResponse> {
  return request<ProjectsListResponse>('/projects');
}

export function fetchRecentLogs(): Promise<PingLog[]> {
  return request<PingLog[]>('/logs');
}

export function createProject(data: ProjectFormPayload): Promise<Project> {
  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProject(id: string, data: Partial<ProjectFormPayload>): Promise<Project> {
  return request<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

export function pingProject(id: string): Promise<SinglePingResponse> {
  return request<SinglePingResponse>(`/projects/${id}/ping`, {
    method: 'POST',
  });
}

export function registerUser(credentials: {
  email: string;
  password: string;
}): Promise<AuthSessionPayload> {
  return request<AuthSessionPayload>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<AuthSessionPayload> {
  return request<AuthSessionPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function fetchCurrentUser(): Promise<{ user: AuthenticatedUser }> {
  return request<{ user: AuthenticatedUser }>('/auth/me');
}

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordReset(params: {
  token: string;
  password: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function pingAllProjects(cronSecret?: string): Promise<BatchPingResponse> {
  const resolvedSecret = cronSecret || getCronSecret();
  return request<BatchPingResponse>('/cron/ping-all', {
    method: 'POST',
    headers: resolvedSecret ? { 'x-cron-secret': resolvedSecret } : {},
  });
}
