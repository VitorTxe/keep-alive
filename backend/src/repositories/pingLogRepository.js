import supabase from '../config/supabase.js';
import { mapPingLogFromDb } from './mappers.js';

function throwSupabaseError(context, error) {
  const err = new Error(`${context}: ${error.message}`);
  err.cause = error;
  err.code = error.code;
  throw err;
}

export async function createPingLogRecord({
  projectId,
  httpStatus,
  status,
  httpLatencyMs,
  dbLatencyMs,
  errorMessage,
  triggerType,
}) {
  const payload = {
    project_id: projectId,
    http_status: httpStatus,
    status,
    http_latency_ms: httpLatencyMs,
    db_latency_ms: dbLatencyMs ?? null,
    error_message: errorMessage ?? null,
    trigger_type: triggerType,
  };

  const { data, error } = await supabase
    .from('ping_logs')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throwSupabaseError('[PingLogRepository] Erro ao inserir log de ping', error);
  }

  return mapPingLogFromDb(data);
}

export async function findRecentPingLogs(limit = 30, userId = null) {
  let query = supabase
    .from('ping_logs')
    .select('*, projects!inner(name, provider_info, user_id)')
    .order('created_at', { ascending: false })
    .limit(limit);

  query = userId
    ? query.or(`user_id.eq.${userId},user_id.is.null`, { referencedTable: 'projects' })
    : query.is('projects.user_id', null);

  const { data, error } = await query;

  if (error) {
    throwSupabaseError('[PingLogRepository] Erro ao buscar logs recentes', error);
  }

  return (data ?? []).map(mapPingLogFromDb);
}

export async function deletePingLogsOlderThan(cutoffDate) {
  const { data, error } = await supabase
    .from('ping_logs')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    throwSupabaseError('[PingLogRepository] Erro ao limpar logs antigos', error);
  }

  return data?.length ?? 0;
}
