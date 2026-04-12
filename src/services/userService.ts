import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, log } from '../config';
import { AppUser } from '../types';

/**
 * User Service
 *
 * Handles Google OAuth sign-in and Supabase user tracking.
 *
 * OAuth flow:
 *   1. signInWithGoogle()    — saves pending prefs, redirects to Google
 *   2. onAuthStateChange()   — fires SIGNED_IN when token is ready (in useUser.ts)
 *   3. getSessionUser()      — builds AppUser from the active session + RPC
 *
 * The Supabase client is created eagerly (not lazily inside a function).
 * This is critical — the client must exist the moment the module loads so it
 * can immediately process the OAuth token from the URL hash on redirect return.
 *
 * Email lives in Supabase identities table only.
 * The app stores users.id locally — never the email.
 */

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns the shared Supabase client.
 * Exported so useUser.ts can subscribe to onAuthStateChange.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = config.tracking.supabase;
  if (!url || !anonKey) {
    log.warn('Supabase not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local');
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey);
    log.info('Supabase client initialised');
  }
  return supabaseClient;
}

// Internal alias
function getClient() { return getSupabaseClient(); }

// ── Google OAuth ──────────────────────────────────────────────────────────────

/**
 * Redirects the browser to Google for authentication.
 * The pending pilot level and country must be saved to localStorage
 * BEFORE calling this — they survive the redirect and are read on return.
 */
export async function signInWithGoogle(): Promise<void> {
  const sb = getClient();
  if (!sb) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
    );
  }

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
 * Builds an AppUser from the active Supabase session.
 * Called inside onAuthStateChange after the SIGNED_IN event fires —
 * at this point the session is guaranteed to be valid.
 *
 * Calls the get_or_create_user RPC to create or fetch the Supabase profile.
 * Returns null if anything fails — the caller shows the registration modal.
 */
export async function getSessionUser(
  pendingPilotLevel: string,
  pendingCountry: string
): Promise<AppUser | null> {
  const sb = getClient();
  if (!sb) return null;

  const { data: { session }, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !session) {
    log.warn('getSessionUser: no active session');
    return null;
  }

  const googleUser = session.user;
  const email = googleUser.email ?? '';
  const name = googleUser.user_metadata?.full_name
    ?? googleUser.user_metadata?.name
    ?? email.split('@')[0];

  log.info('Building user profile for:', email);

  const rpcName = config.debug.enabled
    ? 'get_or_create_user_dev'
    : 'get_or_create_user';

  const { data, error: rpcError } = await sb.rpc(rpcName, {
    p_email: email,
    p_name: name,
    p_country: pendingCountry,
    p_pilot_level: pendingPilotLevel,
    p_provider: 'google',
    p_provider_id: googleUser.id,
  });

  if (rpcError) {
    log.warn('get_or_create_user RPC error:', rpcError.message);
    return null;
  }

  const row = data?.[0];
  if (!row) {
    log.warn('get_or_create_user returned no rows');
    return null;
  }

  log.info(row.is_new_user ? 'New user created:' : 'Returning user:', row.user_id);

  return {
    id: row.user_id,
    name,
    email,
    country: pendingCountry,
    pilotLevel: pendingPilotLevel,
    registeredAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    sessions: 1,
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

  const { error } = await sb
    .from(config.tracking.supabase.eventsTable)
    .insert({ user_id: userId, event, data, timestamp: new Date().toISOString() });

  if (error) log.warn('logEvent error:', error.message);
}
