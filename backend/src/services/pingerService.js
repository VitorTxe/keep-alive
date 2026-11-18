import {
  createPingLogRecord,
  deletePingLogsOlderThan,
} from '../repositories/pingLogRepository.js';
import {
  findActiveProjects,
  updateProjectRecord,
} from '../repositories/projectRepository.js';
import { sendStatusAlert } from './alertService.js';

const TIMEOUT_MS = 55000;
const COLD_START_THRESHOLD_MS = 3000;
const LOG_RETENTION_DAYS = 60;

function parseOptionalNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function buildDetailedErrorMessage(error) {
  if (!error) {
    return 'Erro desconhecido durante a requisição.';
  }

  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return `Timeout: o servidor não respondeu dentro de ${TIMEOUT_MS / 1000}s.`;
  }

  const causeMessage = error.cause?.message ? ` (${error.cause.message})` : '';
  return `${error.name || 'NetworkError'}: ${error.message}${causeMessage}`;
}

/**
 * Executa o ping em um único projeto, classifica a latência/status,
 * persiste log + estado atual em transação e dispara alerta se OFFLINE.
 */
export async function pingSingleProject(project, triggerType = 'CRON') {
  const startTime = performance.now();
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'KeepAlive-Monitor/1.0',
  };

  if (project.secretHeader) {
    headers['x-ping-secret'] = project.secretHeader;
  }

  let httpStatus = 0;
  let status = 'OFFLINE';
  let httpLatencyMs = 0;
  let dbLatencyMs = null;
  let dbSizeMb = null;
  let errorMessage = null;

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
        const parsed = JSON.parse(rawBody);
        if (parsed && typeof parsed === 'object') {
          const parsedDbLatency = parseOptionalNumber(parsed.dbLatencyMs);
          dbLatencyMs = parsedDbLatency !== null ? Math.round(parsedDbLatency) : null;
          dbSizeMb = parseOptionalNumber(parsed.dbSizeMb);
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
 * Executa ping paralelo em todos os projetos ativos e limpa logs com mais de 60 dias.
 */
export async function pingAllActiveProjects(triggerType = 'CRON') {
  const activeProjects = await findActiveProjects();

  const settledResults = await Promise.allSettled(
    activeProjects.map((project) => pingSingleProject(project, triggerType))
  );

  let online = 0;
  let coldStart = 0;
  let offline = 0;
  let failedExecutions = 0;
  const details = [];

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
