import { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { log } from '../config';
import { getSupabaseClient, getSessionUser } from '../services/userService';
import { AppUser } from '../types';

const USER_STORAGE_KEY = 'atcUser';
const OAUTH_PROGRESS_KEY = 'atcOAuthInProgress';

const OAUTH_RETURN_URL_SIGNALS = {
  ACCESS_TOKEN: 'access_token',
  ERROR_DESCRIPTION: 'error_description',
  CODE_PARAM: 'code=',
  ERROR_PARAM: 'error=',
} as const;

const AUTH_SAFETY_TIMEOUT_MS = 8000;

const AUTH_EVENTS = {
  SIGNED_IN: 'SIGNED_IN',
  INITIAL_SESSION: 'INITIAL_SESSION',
  SIGNED_OUT: 'SIGNED_OUT',
} as const;

const isOAuthReturnUrl = (): boolean => {
  const urlHash = window.location.hash;
  const urlSearch = window.location.search;

  const hasTokenInHash =
    urlHash.includes(OAUTH_RETURN_URL_SIGNALS.ACCESS_TOKEN) ||
    urlHash.includes(OAUTH_RETURN_URL_SIGNALS.ERROR_DESCRIPTION);

  const hasCodeInSearch =
    urlSearch.includes(OAUTH_RETURN_URL_SIGNALS.CODE_PARAM) ||
    urlSearch.includes(OAUTH_RETURN_URL_SIGNALS.ERROR_PARAM);

  return hasTokenInHash || hasCodeInSearch;
};

export const useUser = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let resolved = false;

    const resolve = (resolvedUser: AppUser | null, showRegistration: boolean) => {
      if (resolved) return;
      resolved = true;
      setUser(resolvedUser);
      setNeedsRegistration(showRegistration);
      setLoading(false);
    };

    // Step A — existing localStorage session
    const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUserJson) {
      try {
        resolve(JSON.parse(storedUserJson) as AppUser, false);
        return;
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      resolve(null, true);
      return;
    }

    // Step B — OAuth return detection
    // PRIMARY: atcOAuthInProgress is set in savePending() before redirect.
    // It survives the full OAuth round-trip and is only cleared on success.
    // SECONDARY: URL params — Supabase may already have cleaned these via
    // history.replaceState before React runs.
    const hasPendingOAuth = localStorage.getItem(OAUTH_PROGRESS_KEY) === 'true';
    const hasOAuthInUrl = isOAuthReturnUrl();
    const isReturningFromOAuth = hasPendingOAuth || hasOAuthInUrl;

    log.info(
      'isOAuthReturn:', isReturningFromOAuth,
      '| hasPendingAuth:', hasPendingOAuth,
      '| hasOAuthInUrl:', hasOAuthInUrl
    );

    // Step C — Build AppUser from active Supabase session
    const buildUserFromSession = async (_session: Session) => {
      try {
        const sessionUser = await getSessionUser();
        if (sessionUser) {
          localStorage.removeItem(OAUTH_PROGRESS_KEY);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
          resolve(sessionUser, false);
        } else {
          resolve(null, true);
        }
      } catch (error) {
        log.warn('buildUserFromSession error:', error);
        resolve(null, true);
      }
    };

    // Step D — Subscribe to Supabase auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (authEvent, session) => {
        log.info('Auth event:', authEvent, '| session:', !!session);

        switch (authEvent) {
          case AUTH_EVENTS.SIGNED_IN:
            if (session) buildUserFromSession(session);
            break;

          case AUTH_EVENTS.INITIAL_SESSION:
            if (session) {
              buildUserFromSession(session);
            } else if (!isReturningFromOAuth) {
              resolve(null, true);
            }
            // isReturningFromOAuth && !session: token still processing — wait for SIGNED_IN
            break;

          case AUTH_EVENTS.SIGNED_OUT:
            // Use setState directly — resolve() is a no-op after initial auth
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(OAUTH_PROGRESS_KEY);
            setUser(null);
            setNeedsRegistration(true);
            setLoading(false);
            break;

          default:
            break;
        }
      }
    );

    // Step E — Safety timeout to unblock UI if Supabase never fires
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        log.warn('Auth safety timeout — showing registration modal');
        localStorage.removeItem(OAUTH_PROGRESS_KEY);
        resolve(null, true);
      }
    }, AUTH_SAFETY_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const savePending = useCallback(() => {
    localStorage.setItem(OAUTH_PROGRESS_KEY, 'true');
  }, []);

  const completeProfile = useCallback(async (
    country: string,
    pilotLevel: string
  ) => {
    if (!user) return;
    const { updateUserProfile } = await import('../services/userService');
    try {
      await updateUserProfile(user.id, country, pilotLevel);
    } catch (error) {
      log.warn('completeProfile error — dismissing anyway:', error);
    }
    const updatedUser: AppUser = { ...user, country, pilotLevel, isNewUser: false };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const clearUser = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(OAUTH_PROGRESS_KEY);
    getSupabaseClient()?.auth.signOut().catch((error) => {
      log.warn('signOut error:', error);
      setUser(null);
      setNeedsRegistration(true);
    });
  }, []);

  return { user, needsRegistration, loading, savePending, completeProfile, clearUser };
};
