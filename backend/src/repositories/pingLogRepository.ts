import type { PostgrestError } from '@supabase/supabase-js';
import supabase from '../config/supabase.js';
import type {
  CreatePingLogInput,
  DbPingLogRow,
  HttpError,
  PingLogDTO,
} from '../types/index.js';
import { mapPingLogFromDb } from './mappers.js';

/**
 * Encapsula erros do PostgREST preservando a causa original (`err.cause`)
 * e o código SQLSTATE (`err.code`) para rastreamento nos logs do servidor.
 */
function throwSupabaseError(context: string, error: PostgrestError): never {
  const err: HttpError = new Error(`${context}: ${error.message}`);
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
}: CreatePingLogInput): Promise<PingLogDTO> {
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

  if (error || !data) {
    throwSupabaseError('[PingLogRepository] Erro ao inserir log de ping', error!);
  }

  return mapPingLogFromDb(data as DbPingLogRow);
}

/**
 * Busca os logs mais recentes aplicando filtro multi-tenant via inner join com `projects`:
 * - Visitantes (`userId = null`) visualizam apenas logs de projetos públicos (`user_id IS NULL`).
 * - Usuários autenticados visualizam seus próprios projetos e os projetos públicos.
 */
export async function findRecentPingLogs(
  limit = 30,
  userId: string | null = null
): Promise<PingLogDTO[]> {
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

  return ((data as DbPingLogRow[] | null) ?? []).map(mapPingLogFromDb);
}

/**
 * Remove logs anteriores à data de corte para manter o banco dentro da cota do Free Tier (500 MB).
 */
export async function deletePingLogsOlderThan(cutoffDate: Date): Promise<number> {
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
