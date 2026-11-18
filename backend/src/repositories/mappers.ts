import type {
  DbPingLogRow,
  DbProjectRow,
  PingLogDTO,
  ProjectDTO,
} from '../types/index.js';

/**
 * Converte um registro bruto de `public.ping_logs` (snake_case) para o DTO da API (camelCase).
 * Isola o formato das colunas do PostgreSQL para que refatorações de banco não quebrem o contrato JSON.
 */
export function mapPingLogFromDb(row: DbPingLogRow): PingLogDTO {
  const mapped: PingLogDTO = {
    id: row.id,
    projectId: row.project_id,
    httpStatus: row.http_status,
    status: row.status,
    httpLatencyMs: row.http_latency_ms,
    dbLatencyMs: row.db_latency_ms ?? null,
    errorMessage: row.error_message ?? null,
    triggerType: row.trigger_type,
    createdAt: row.created_at,
  };

  if (row.projects) {
    mapped.project = {
      name: row.projects.name,
      providerInfo: row.projects.provider_info,
    };
  }

  return mapped;
}

/**
 * Converte um registro bruto de `public.projects` (snake_case) para o DTO da API (camelCase),
 * garantindo ordenação decrescente dos logs aninhados por data de criação.
 */
export function mapProjectFromDb(row: DbProjectRow): ProjectDTO {
  const mapped: ProjectDTO = {
    id: row.id,
    userId: row.user_id ?? null,
    notificationEmail: row.notification_email ?? null,
    name: row.name,
    pingUrl: row.ping_url,
    secretHeader: row.secret_header ?? null,
    providerInfo: row.provider_info,
    isActive: row.is_active,
    lastStatus: row.last_status,
    lastPingAt: row.last_ping_at ?? null,
    lastLatencyMs: row.last_latency_ms ?? null,
    dbSizeMb: row.db_size_mb ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (Array.isArray(row.ping_logs)) {
    mapped.logs = row.ping_logs
      .map(mapPingLogFromDb)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return mapped;
}
