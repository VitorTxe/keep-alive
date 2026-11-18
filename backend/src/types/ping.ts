export type PingStatus = 'ONLINE' | 'COLD_START' | 'OFFLINE';

export type TriggerType = 'CRON' | 'MANUAL';

/** Representação bruta da linha na tabela `public.ping_logs` do PostgreSQL. */
export interface DbPingLogRow {
  id: string;
  project_id: string;
  http_status: number;
  status: PingStatus;
  http_latency_ms: number;
  db_latency_ms: number | null;
  error_message: string | null;
  trigger_type: TriggerType;
  created_at: string;
  projects?: {
    name: string;
    provider_info: string;
    user_id?: string | null;
  } | null;
}

/** DTO exposto pela API para um log de execução de ping. */
export interface PingLogDTO {
  id: string;
  projectId: string;
  httpStatus: number;
  status: PingStatus;
  httpLatencyMs: number;
  dbLatencyMs: number | null;
  errorMessage: string | null;
  triggerType: TriggerType;
  createdAt: string;
  project?: {
    name: string;
    providerInfo: string;
  };
}

export interface CreatePingLogInput {
  projectId: string;
  httpStatus: number;
  status: PingStatus;
  httpLatencyMs: number;
  dbLatencyMs: number | null;
  errorMessage: string | null;
  triggerType: TriggerType;
}

export interface BatchPingDetail {
  projectId: string;
  name: string;
  status: PingStatus;
  httpStatus: number;
  httpLatencyMs: number;
}

export interface BatchPingSummary {
  total: number;
  online: number;
  cold_start: number;
  offline: number;
  failedExecutions: number;
  cleanedLogsCount: number;
  details: BatchPingDetail[];
}
