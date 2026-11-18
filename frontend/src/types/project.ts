import type { PingLog, PingStatus } from './ping';

export type ProjectStatus = PingStatus | 'PENDING';

export interface Project {
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
  logs?: PingLog[];
}

export interface ProjectsSummary {
  totalProjects: number;
  onlineCount: number;
  coldStartCount: number;
  offlineCount: number;
}

export interface ProjectsListResponse {
  summary: ProjectsSummary;
  projects: Project[];
}

export interface ProjectFormPayload {
  name: string;
  pingUrl: string;
  providerInfo: string;
  secretHeader: string | null;
  isActive?: boolean;
}
