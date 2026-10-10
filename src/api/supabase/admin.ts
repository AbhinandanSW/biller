import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/api/env";
import type { Database } from "@/types/database";
import { getPublicEnv } from "@/utils/env";

/**
 * Service-role client. BYPASSES RLS — use only in trusted server code for
 * operations that cannot run as the user (e.g. transactional numbering,
 * background jobs), and always scope queries by organization_id yourself.
 */
export function createAdminClient() {
  return createClient<Database>(
    getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
