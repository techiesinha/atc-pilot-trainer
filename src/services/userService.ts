import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, log } from '../config';
import { AppUser } from '../types';

let supabaseClient: SupabaseClient | null = null;

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

function getClient() { return getSupabaseClient(); }

// ── Country detection from timezone ──────────────────────────────────────────

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'India',
  'Asia/Calcutta': 'India',
  'Europe/London': 'United Kingdom',
  'America/New_York': 'United States',
  'America/Chicago': 'United States',
  'America/Denver': 'United States',
  'America/Los_Angeles': 'United States',
  'Australia/Sydney': 'Australia',
  'Australia/Melbourne': 'Australia',
  'America/Toronto': 'Canada',
  'America/Vancouver': 'Canada',
  'Africa/Johannesburg': 'South Africa',
  'Asia/Dubai': 'UAE',
  'Asia/Singapore': 'Singapore',
  'Pacific/Auckland': 'New Zealand',
  'Asia/Karachi': 'Pakistan',
  'Asia/Colombo': 'Sri Lanka',
  'Asia/Dhaka': 'Bangladesh',
  'Asia/Kathmandu': 'Nepal',
  'Asia/Kuala_Lumpur': 'Malaysia',
  'Asia/Manila': 'Philippines',
  'Africa/Lagos': 'Nigeria',
  'Africa/Nairobi': 'Kenya',
};

export function detectCountry(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const country = TIMEZONE_TO_COUNTRY[tz];
  if (country) {
    log.info('Country from timezone', tz, '→', country);
    return country;
  }
  log.info('Timezone not mapped:', tz, '— defaulting to India');
  return 'India';
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

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
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) throw new Error(error.message);
}

// ── Session user ──────────────────────────────────────────────────────────────

export async function getSessionUser(): Promise<AppUser | null> {
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
    p_country: detectCountry(),
    p_pilot_level: 'Student pilot',
    p_provider: 'google',
    p_provider_id: googleUser.id,
  });

  if (rpcError) {
    log.warn('RPC error:', JSON.stringify(rpcError));
    return null;
  }

  const row = data?.[0];
  if (!row) {
    log.warn('get_or_create_user returned no rows');
    return null;
  }

  log.info(row.is_new_user ? 'New user:' : 'Returning user:', row.user_id);

  return {
    id: row.user_id,
    name,
    email,
    country: detectCountry(),
    pilotLevel: 'Student pilot',
    registeredAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    sessions: 1,
    isNewUser: row.is_new_user,
  };
}

// ── Profile update ────────────────────────────────────────────────────────────

export async function updateUserProfile(
  userId: string,
  country: string,
  pilotLevel: string
): Promise<void> {
  const sb = getClient();
  if (!sb) return;

  const tableName = config.tracking.supabase.usersTable;

  const { error } = await sb
    .from(tableName)
    .update({ country, pilot_level: pilotLevel })
    .eq('id', userId);

  if (error) {
    log.warn('updateUserProfile error:', error.message);
    throw new Error(error.message);
  }

  log.info('Profile updated:', userId, '| country:', country, '| level:', pilotLevel);
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
