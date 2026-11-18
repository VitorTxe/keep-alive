import type { DbPingLogRow, PingLogDTO, PingStatus } from './ping.js';

export type ProjectStatus = PingStatus | 'PENDING';

/** Representação bruta da linha na tabela `public.projects` do PostgreSQL. */
export interface DbProjectRow {
  id: string;
  user_id: string | null;
  notification_email: string | null;
  name: string;
  ping_url: string;
  secret_header: string | null;
  provider_info: string;
  is_active: boolean;
  last_status: ProjectStatus;
  last_ping_at: string | null;
  last_latency_ms: number | null;
  db_size_mb: number | null;
  created_at: string;
  updated_at: string;
  ping_logs?: DbPingLogRow[];
}

/** DTO exposto pela API para um projeto monitorado. */
export interface ProjectDTO {
  id: string;
  userId: string | null;
  notificationEmail: string | null;
  name: string;
  pingUrl: string;
  secretHeader: string | null;
  providerInfo: string;
  isActive: boolean;
  lastStatus: ProjectStatus;
  lastPingAt: string | null;
  lastLatencyMs: number | null;
  dbSizeMb: number | null;
  createdAt: string;
  updatedAt: string;
  logs?: PingLogDTO[];
}

export interface CreateProjectInput {
  userId: string | null;
  notificationEmail: string | null;
  name: string;
  pingUrl: string;
  secretHeader: string | null;
  providerInfo: string;
  isActive?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  pingUrl?: string;
  secretHeader?: string | null;
  providerInfo?: string;
  isActive?: boolean;
  lastStatus?: ProjectStatus;
  lastPingAt?: string;
  lastLatencyMs?: number;
  dbSizeMb?: number;
}
