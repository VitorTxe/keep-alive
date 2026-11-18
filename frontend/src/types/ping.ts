import type { Project } from './project';

export type PingStatus = 'ONLINE' | 'COLD_START' | 'OFFLINE';

export type StatusFilterKey = 'ALL' | PingStatus;

export type TriggerType = 'CRON' | 'MANUAL';

export interface PingLog {
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

export interface SinglePingResponse {
  message: string;
  project: Project;
  log: PingLog;
}

export interface BatchPingResponse {
  message: string;
  total: number;
  online: number;
  cold_start: number;
  offline: number;
  failedExecutions: number;
  cleanedLogsCount: number;
}
