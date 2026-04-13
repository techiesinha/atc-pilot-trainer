import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, log } from '../config';
import { AppUser } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const GOOGLE_PROVIDER_ID = 'google';
const DEFAULT_PILOT_LEVEL = 'Student pilot';
const FALLBACK_COUNTRY = 'India';
const OFFLINE_ACCESS_TYPE = 'offline';
const OAUTH_PROMPT_CONSENT = 'consent';

const RPC_FUNCTION_NAME_PROD = 'get_or_create_user';
const RPC_FUNCTION_NAME_DEV = 'get_or_create_user_dev';

const RPC_PARAM_EMAIL = 'p_email';
const RPC_PARAM_NAME = 'p_name';
const RPC_PARAM_COUNTRY = 'p_country';
const RPC_PARAM_PILOT_LEVEL = 'p_pilot_level';
const RPC_PARAM_PROVIDER = 'p_provider';
const RPC_PARAM_PROVIDER_ID = 'p_provider_id';

const DB_COLUMN_COUNTRY = 'country';
const DB_COLUMN_PILOT_LEVEL = 'pilot_level';
const DB_COLUMN_ID = 'id';

const ERROR_SUPABASE_NOT_CONFIGURED =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local';
const ERROR_NO_SESSION = 'getSessionUser: no active session';
const ERROR_RPC_NO_ROWS = 'get_or_create_user returned no rows';

const LOG_SUPABASE_NOT_CONFIGURED =
  'Supabase not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local';
const LOG_SUPABASE_INITIALISED = 'Supabase client initialised';
const LOG_COUNTRY_DETECTED = 'Country detected from timezone';
const LOG_TIMEZONE_NOT_MAPPED = 'Timezone not mapped:';
const LOG_TIMEZONE_FALLBACK = '— defaulting to';
const LOG_BUILDING_PROFILE = 'Building user profile for:';
const LOG_NEW_USER = 'New user:';
const LOG_RETURNING_USER = 'Returning user:';
const LOG_PROFILE_UPDATED = 'Profile updated:';
const LOG_LEVEL_LABEL = '| level:';
const LOG_COUNTRY_LABEL = '| country:';

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

// ── Supabase client ───────────────────────────────────────────────────────────

let supabaseClientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = config.tracking.supabase;
  if (!url || !anonKey) {
    log.warn(LOG_SUPABASE_NOT_CONFIGURED);
    return null;
  }
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(url, anonKey);
    log.info(LOG_SUPABASE_INITIALISED);
  }
  return supabaseClientInstance;
};

// ── Country detection ─────────────────────────────────────────────────────────

export const detectCountry = (): string => {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const detectedCountry = TIMEZONE_TO_COUNTRY[systemTimezone];

  if (detectedCountry) {
    log.info(LOG_COUNTRY_DETECTED, systemTimezone, '→', detectedCountry);
    return detectedCountry;
  }

  log.info(LOG_TIMEZONE_NOT_MAPPED, systemTimezone, LOG_TIMEZONE_FALLBACK, FALLBACK_COUNTRY);
  return FALLBACK_COUNTRY;
};

// ── Google OAuth ──────────────────────────────────────────────────────────────

export const signInWithGoogle = async (): Promise<void> => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) throw new Error(ERROR_SUPABASE_NOT_CONFIGURED);

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: GOOGLE_PROVIDER_ID,
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: OFFLINE_ACCESS_TYPE,
        prompt: OAUTH_PROMPT_CONSENT,
      },
    },
  });

  if (error) throw new Error(error.message);
};

// ── Session user ──────────────────────────────────────────────────────────────

export const getSessionUser = async (): Promise<AppUser | null> => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) return null;

  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError || !session) {
    log.warn(ERROR_NO_SESSION);
    return null;
  }

  const googleUser = session.user;
  const userEmail = googleUser.email ?? '';
  const userName = googleUser.user_metadata?.full_name
    ?? googleUser.user_metadata?.name
    ?? userEmail.split('@')[0];
  const detectedCountry = detectCountry();

  log.info(LOG_BUILDING_PROFILE, userEmail, LOG_COUNTRY_LABEL, detectedCountry);

  const rpcFunctionName = config.debug.enabled
    ? RPC_FUNCTION_NAME_DEV
    : RPC_FUNCTION_NAME_PROD;

  const { data: rpcResult, error: rpcError } = await supabaseClient.rpc(rpcFunctionName, {
    [RPC_PARAM_EMAIL]: userEmail,
    [RPC_PARAM_NAME]: userName,
    [RPC_PARAM_COUNTRY]: detectedCountry,
    [RPC_PARAM_PILOT_LEVEL]: DEFAULT_PILOT_LEVEL,
    [RPC_PARAM_PROVIDER]: GOOGLE_PROVIDER_ID,
    [RPC_PARAM_PROVIDER_ID]: googleUser.id,
  });

  if (rpcError) {
    log.warn('RPC error:', JSON.stringify(rpcError));
    return null;
  }

  const firstRow = rpcResult?.[0];
  if (!firstRow) {
    log.warn(ERROR_RPC_NO_ROWS);
    return null;
  }

  log.info(
    firstRow.is_new_user ? LOG_NEW_USER : LOG_RETURNING_USER,
    firstRow.user_id
  );

  return {
    id: firstRow.user_id,
    name: userName,
    email: userEmail,
    country: detectedCountry,
    pilotLevel: DEFAULT_PILOT_LEVEL,
    registeredAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    sessions: 1,
    isNewUser: firstRow.is_new_user,
  };
};

// ── Profile update ────────────────────────────────────────────────────────────

export const updateUserProfile = async (
  userId: string,
  country: string,
  pilotLevel: string
): Promise<void> => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) return;

  const { error } = await supabaseClient
    .from(config.tracking.supabase.usersTable)
    .update({
      [DB_COLUMN_COUNTRY]: country,
      [DB_COLUMN_PILOT_LEVEL]: pilotLevel,
    })
    .eq(DB_COLUMN_ID, userId);

  if (error) {
    log.warn('updateUserProfile error:', error.message);
    throw new Error(error.message);
  }

  log.info(LOG_PROFILE_UPDATED, userId, LOG_COUNTRY_LABEL, country, LOG_LEVEL_LABEL, pilotLevel);
};

// ── Event logging ─────────────────────────────────────────────────────────────

export const logEvent = async (
  userId: string,
  eventName: string,
  eventData: Record<string, unknown>
): Promise<void> => {
  if (!config.tracking.logEvents) return;

  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) return;

  const { error } = await supabaseClient
    .from(config.tracking.supabase.eventsTable)
    .insert({
      user_id: userId,
      event: eventName,
      data: eventData,
      timestamp: new Date().toISOString(),
    });

  if (error) log.warn('logEvent error:', error.message);
};
