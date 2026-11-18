const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3333').replace(/\/$/, '');

function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('AUTH_TOKEN') || '';
}

function getCronSecret() {
  return typeof window !== 'undefined' ? window.localStorage.getItem('CRON_SECRET') || '' : '';
}

async function request(endpoint, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || `Erro HTTP ${response.status} ao acessar ${endpoint}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function fetchProjects() {
  return request('/projects');
}

export function fetchRecentLogs() {
  return request('/logs');
}

export function createProject(data) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProject(id, data) {
  return request(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteProject(id) {
  return request(`/projects/${id}`, {
    method: 'DELETE',
  });
}

export function pingProject(id) {
  return request(`/projects/${id}/ping`, {
    method: 'POST',
  });
}

export function registerUser({ email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function loginUser({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser() {
  return request('/auth/me');
}

export function requestPasswordReset(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordReset({ token, password }) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export function pingAllProjects(cronSecret) {
  const resolvedSecret = cronSecret || getCronSecret();
  return request('/cron/ping-all', {
    method: 'POST',
    headers: resolvedSecret ? { 'x-cron-secret': resolvedSecret } : {},
  });
}
