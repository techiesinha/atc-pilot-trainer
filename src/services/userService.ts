import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, log } from '../config';
import { AppUser } from '../types';

/**
 * User Service
 *
 * Handles Google OAuth sign-in and Supabase user tracking.
 *
 * OAuth flow:
 *   1. signInWithGoogle()       — redirects to Google
 *   2. getSessionUser()         — called on app mount after redirect returns
 *   3. get_or_create_user RPC   — creates or fetches the Supabase profile
 *
 * The email lives in Supabase identities table only.
 * The app stores users.id locally — never the email.
 */

let supabaseClient: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  const { url, anonKey } = config.tracking.supabase;
  if (!url || !anonKey) {
    log.warn('Supabase not configured — user tracking disabled');
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey);
    log.info('Supabase client initialised');
  }
  return supabaseClient;
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

/**
 * Redirects the user to Google for authentication.
 * Before calling this, save the pilot level to localStorage
 * so it can be read after the OAuth redirect returns.
 */
export async function signInWithGoogle(): Promise<void> {
  const sb = getClient();
  if (!sb) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local');

  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw new Error(error.message);
}

/**
 * Called on every app mount to check if the user has just returned
 * from a Google OAuth redirect, or if they have an existing session.
 *
 * Returns an AppUser if authenticated, null if not.
 */
export async function getSessionUser(
  pendingPilotLevel: string,
  pendingCountry: string
): Promise<AppUser | null> {
  const sb = getClient();
  if (!sb) return null;

  const { data: { session }, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !session) return null;

  const googleUser = session.user;
  const email      = googleUser.email ?? '';
  const name       = googleUser.user_metadata?.full_name
                  ?? googleUser.user_metadata?.name
                  ?? email.split('@')[0];

  log.info('Google session found for:', email);

  // Determine which RPC function to call (prod vs dev)
  const isDev   = config.debug.enabled;
  const rpcName = isDev ? 'get_or_create_user_dev' : 'get_or_create_user';

  const { data, error: rpcError } = await sb.rpc(rpcName, {
    p_email:       email,
    p_name:        name,
    p_country:     pendingCountry,
    p_pilot_level: pendingPilotLevel,
    p_provider:    'google',
    p_provider_id: googleUser.id,
  });

  if (rpcError) {
    log.warn('get_or_create_user error:', rpcError.message);
    return null;
  }

  const row = data?.[0];
  if (!row) return null;

  log.info(row.is_new_user ? 'New user registered:' : 'Returning user:', row.user_id);

  return {
    id:           row.user_id,
    name,
    email,
    country:      pendingCountry,
    pilotLevel:   pendingPilotLevel,
    registeredAt: new Date().toISOString(),
    lastSeen:     new Date().toISOString(),
    sessions:     1,
  };
}

// ── Event logging ─────────────────────────────────────────────────────────────

export async function logEvent(
  userId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!config.tracking.logEvents) return;
  const sb = getClient();
  if (!sb) return;

  const tableName = config.tracking.supabase.eventsTable;

  const { error } = await sb.from(tableName).insert({
    user_id:   userId,
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  if (error) log.warn('logEvent error:', error.message);
}
