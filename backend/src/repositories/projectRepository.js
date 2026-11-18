import supabase from '../config/supabase.js';
import { mapProjectFromDb } from './mappers.js';

const INVALID_UUID_CODE = '22P02';

function throwSupabaseError(context, error) {
  const err = new Error(`${context}: ${error.message}`);
  err.cause = error;
  err.code = error.code;
  throw err;
}

export async function findAllProjectsWithRecentLogs(logLimit = 15, userId = null) {
  let query = supabase
    .from('projects')
    .select('*, ping_logs(*)')
    .order('created_at', { ascending: false })
    .order('created_at', { referencedTable: 'ping_logs', ascending: false })
    .limit(logLimit, { referencedTable: 'ping_logs' });

  query = userId
    ? query.or(`user_id.eq.${userId},user_id.is.null`)
    : query.is('user_id', null);

  const { data, error } = await query;

  if (error) {
    throwSupabaseError('[ProjectRepository] Erro ao listar projetos', error);
  }

  return (data ?? []).map(mapProjectFromDb);
}

export async function findProjectById(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_UUID_CODE) return null;
    throwSupabaseError('[ProjectRepository] Erro ao buscar projeto por ID', error);
  }

  return mapProjectFromDb(data);
}

export async function findProjectByIdWithLogs(id, logLimit = 50) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, ping_logs(*)')
    .eq('id', id)
    .order('created_at', { referencedTable: 'ping_logs', ascending: false })
    .limit(logLimit, { referencedTable: 'ping_logs' })
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_UUID_CODE) return null;
    throwSupabaseError('[ProjectRepository] Erro ao buscar projeto com logs', error);
  }

  return mapProjectFromDb(data);
}

export async function findActiveProjects(userId = null) {
  let query = supabase
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    throwSupabaseError('[ProjectRepository] Erro ao listar projetos ativos', error);
  }

  return (data ?? []).map(mapProjectFromDb);
}

export async function createProjectRecord({
  userId,
  notificationEmail,
  name,
  pingUrl,
  secretHeader,
  providerInfo,
  isActive,
}) {
  const payload = {
    user_id: userId ?? null,
    notification_email: notificationEmail ?? null,
    name,
    ping_url: pingUrl,
    secret_header: secretHeader ?? null,
    provider_info: providerInfo,
    ...(typeof isActive === 'boolean' ? { is_active: isActive } : {}),
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throwSupabaseError('[ProjectRepository] Erro ao criar projeto', error);
  }

  return mapProjectFromDb(data);
}

export async function updateProjectRecord(id, fields) {
  const payload = {};

  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.pingUrl !== undefined) payload.ping_url = fields.pingUrl;
  if (fields.secretHeader !== undefined) payload.secret_header = fields.secretHeader;
  if (fields.providerInfo !== undefined) payload.provider_info = fields.providerInfo;
  if (fields.isActive !== undefined) payload.is_active = fields.isActive;
  if (fields.lastStatus !== undefined) payload.last_status = fields.lastStatus;
  if (fields.lastPingAt !== undefined) payload.last_ping_at = fields.lastPingAt;
  if (fields.lastLatencyMs !== undefined) payload.last_latency_ms = fields.lastLatencyMs;
  if (fields.dbSizeMb !== undefined) payload.db_size_mb = fields.dbSizeMb;

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throwSupabaseError('[ProjectRepository] Erro ao atualizar projeto', error);
  }

  return mapProjectFromDb(data);
}

export async function deleteProjectRecord(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    throwSupabaseError('[ProjectRepository] Erro ao remover projeto', error);
  }
}
