import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
};

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, CLIENT_OPTIONS);

/**
 * Cria um cliente isolado para operações de signInWithPassword, evitando que
 * a sessão do usuário contamine o cliente singleton (que precisa manter a service_role).
 */
export function createStatelessAuthClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, CLIENT_OPTIONS);
}

export default supabase;
