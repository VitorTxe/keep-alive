import {
  createPingLogRecord,
  deletePingLogsOlderThan,
} from '../repositories/pingLogRepository.js';
import {
  findActiveProjects,
  updateProjectRecord,
} from '../repositories/projectRepository.js';
import type {
  BatchPingDetail,
  BatchPingSummary,
  PingLogDTO,
  PingStatus,
  ProjectDTO,
  TriggerType,
} from '../types/index.js';
import { sendStatusAlert } from './alertService.js';

/**
 * Timeout alto (55s) calibrado especificamente para hospedagens Free Tier (ex: Render),
 * cujo cold start de containers adormecidos pode levar entre 30s e 50s.
 */
const TIMEOUT_MS = 55000;
const COLD_START_THRESHOLD_MS = 3000;
const LOG_RETENTION_DAYS = 60;

interface TargetHealthPayload {
  dbLatencyMs?: unknown;
  dbSizeMb?: unknown;
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function buildDetailedErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Erro desconhecido durante a requisição.';
  }

  const err = error as { name?: string; message?: string; cause?: { message?: string } };

  if (err.name === 'TimeoutError' || err.name === 'AbortError') {
    return `Timeout: o servidor não respondeu dentro de ${TIMEOUT_MS / 1000}s.`;
  }

  const causeMessage = err.cause?.message ? ` (${err.cause.message})` : '';
  return `${err.name || 'NetworkError'}: ${err.message || 'Falha de conexão'}${causeMessage}`;
}

/**
 * Executa o ping em um único projeto, classifica a latência/status,
 * persiste log + estado atual e dispara alerta se OFFLINE ou recuperado.
 */
export async function pingSingleProject(
  project: ProjectDTO,
  triggerType: TriggerType = 'CRON'
): Promise<{ project: ProjectDTO; log: PingLogDTO }> {
  const startTime = performance.now();
  const headers: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'KeepAlive-Monitor/1.0',
  };

  if (project.secretHeader) {
    headers['x-ping-secret'] = project.secretHeader;
  }

  let httpStatus = 0;
  let status: PingStatus = 'OFFLINE';
  let httpLatencyMs = 0;
  let dbLatencyMs: number | null = null;
  let dbSizeMb: number | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(project.pingUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    httpLatencyMs = Math.round(performance.now() - startTime);
    httpStatus = response.status;

    const rawBody = await response.text().catch(() => '');
    if (rawBody) {
      try {
        const parsed: unknown = JSON.parse(rawBody);
        if (parsed && typeof parsed === 'object') {
          const payload = parsed as TargetHealthPayload;
          const parsedDbLatency = parseOptionalNumber(payload.dbLatencyMs);
          dbLatencyMs = parsedDbLatency !== null ? Math.round(parsedDbLatency) : null;
          dbSizeMb = parseOptionalNumber(payload.dbSizeMb);
        }
      } catch {
        // Rota alvo pode retornar texto puro (ex: "OK"); ignoramos falha de parse JSON.
      }
    }

    if (response.ok) {
      status = httpLatencyMs <= COLD_START_THRESHOLD_MS ? 'ONLINE' : 'COLD_START';
    } else {
      status = 'OFFLINE';
      errorMessage = `Resposta HTTP não sucedida: ${response.status} ${response.statusText}`.trim();
    }
  } catch (error) {
    httpLatencyMs = Math.round(performance.now() - startTime);
    httpStatus = 0;
    status = 'OFFLINE';
    errorMessage = buildDetailedErrorMessage(error);
  }

  const nowIso = new Date().toISOString();

  const createdLog = await createPingLogRecord({
    projectId: project.id,
    httpStatus,
    status,
    httpLatencyMs,
    dbLatencyMs,
    errorMessage,
    triggerType,
  });

  const updatedProject = await updateProjectRecord(project.id, {
    lastStatus: status,
    lastPingAt: nowIso,
    lastLatencyMs: httpLatencyMs,
    ...(dbSizeMb !== null ? { dbSizeMb } : {}),
  });

  await sendStatusAlert(updatedProject, createdLog, project.lastStatus);

  return {
    project: updatedProject,
    log: createdLog,
  };
}

/**
 * Executa ping paralelo em todos os projetos ativos via `Promise.allSettled`
 * (garantindo que a falha de um projeto não aborte os demais) e limpa logs > 60 dias.
 */
export async function pingAllActiveProjects(
  triggerType: TriggerType = 'CRON'
): Promise<BatchPingSummary> {
  const activeProjects = await findActiveProjects();

  const settledResults = await Promise.allSettled(
    activeProjects.map((project) => pingSingleProject(project, triggerType))
  );

  let online = 0;
  let coldStart = 0;
  let offline = 0;
  let failedExecutions = 0;
  const details: BatchPingDetail[] = [];

  for (const result of settledResults) {
    if (result.status === 'fulfilled') {
      const { project, log } = result.value;
      if (log.status === 'ONLINE') online += 1;
      else if (log.status === 'COLD_START') coldStart += 1;
      else offline += 1;

      details.push({
        projectId: project.id,
        name: project.name,
        status: log.status,
        httpStatus: log.httpStatus,
        httpLatencyMs: log.httpLatencyMs,
      });
    } else {
      failedExecutions += 1;
      console.error('[PingerService] Erro inesperado ao processar ping em lote:', result.reason);
    }
  }

  const retentionCutoff = new Date();
  retentionCutoff.setDate(retentionCutoff.getDate() - LOG_RETENTION_DAYS);

  const cleanedLogsCount = await deletePingLogsOlderThan(retentionCutoff);

  return {
    total: activeProjects.length,
    online,
    cold_start: coldStart,
    offline,
    failedExecutions,
    cleanedLogsCount,
    details,
  };
}
