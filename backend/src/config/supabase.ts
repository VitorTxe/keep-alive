import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fail-fast no boot: impede que o servidor suba com configuração inválida
// e falhe silenciosamente apenas quando receber a primeira requisição.
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    '[SupabaseConfig] As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.'
  );
}

const CLIENT_OPTIONS = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
} as const;

/**
 * Cliente administrativo singleton com `service_role`.
 * Ignora RLS no banco de dados porque toda a autorização é validada na camada Express.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  CLIENT_OPTIONS
);

/**
 * Cria um cliente isolado para operações de `signInWithPassword`.
 * Importante: se `signInWithPassword` for chamado na instância singleton, o SDK do Supabase
 * substitui o header Authorization interno pelo JWT do usuário logado, fazendo a instância
 * perder os privilégios de `service_role` nas requisições subsequentes.
 */
export function createStatelessAuthClient(): SupabaseClient {
  return createClient(supabaseUrl!, supabaseServiceRoleKey!, CLIENT_OPTIONS);
}

export default supabase;
