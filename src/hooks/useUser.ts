import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { AppUser } from '../types';
import { getSupabaseClient, getSessionUser } from '../services/userService';
import { log } from '../config';

const STORAGE_KEY = 'atcUser';
const PENDING_LEVEL_KEY = 'atcPendingPilotLevel';
const PENDING_COUNTRY_KEY = 'atcPendingCountry';

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let resolved = false;

    const resolve = (u: AppUser | null, showReg: boolean) => {
      if (resolved) return;
      resolved = true;
      setUser(u);
      setNeedsRegistration(showReg);
      setLoading(false);
    };

    const logout = () => {
      // Use setState directly — resolve() is a no-op once the user
      // is already in the app
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PENDING_LEVEL_KEY);
      localStorage.removeItem(PENDING_COUNTRY_KEY);
      setUser(null);
      setNeedsRegistration(true);
      setLoading(false);
    }

    // ── A: existing localStorage session ─────────────────────────────────────
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        resolve(JSON.parse(stored) as AppUser, false);
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const sb = getSupabaseClient();
    if (!sb) {
      resolve(null, true);
      return;
    }

    // ── OAuth return detection ─────────────────────────────────────────────────
    // PRIMARY signal: atcPendingPilotLevel is set by savePending() before
    // signInWithGoogle() redirects the browser. It survives the full OAuth
    // round-trip and is only cleared on success. If it exists, an OAuth
    // exchange is in progress — do NOT show the registration modal yet.
    //
    // SECONDARY signals: URL params (unreliable — Supabase may have already
    // cleaned them via history.replaceState before React runs).
    const hasPendingAuth = localStorage.getItem(PENDING_LEVEL_KEY) !== null;
    const hasOAuthInUrl =
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('error_description') ||
      window.location.search.includes('code=') ||
      window.location.search.includes('error=');

    const isOAuthReturn = hasPendingAuth || hasOAuthInUrl;

    log.info('isOAuthReturn:', isOAuthReturn,
      '| hasPendingAuth:', hasPendingAuth,
      '| hasOAuthInUrl:', hasOAuthInUrl);

    // ── Build AppUser from an active Supabase session ─────────────────────────
    const buildUser = async (_session: Session) => {
      const pendingLevel = localStorage.getItem(PENDING_LEVEL_KEY) ?? 'Student pilot (PPL training)';
      const pendingCountry = localStorage.getItem(PENDING_COUNTRY_KEY) ?? 'India';

      try {
        const sessionUser = await getSessionUser(pendingLevel, pendingCountry);
        if (sessionUser) {
          localStorage.removeItem(PENDING_LEVEL_KEY);
          localStorage.removeItem(PENDING_COUNTRY_KEY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
          resolve(sessionUser, false);
        } else {
          log.warn('getSessionUser returned null — RPC may have failed');
          resolve(null, true);
        }
      } catch (e) {
        log.warn('buildUser error:', e);
        resolve(null, true);
      }
    };

    // ── Auth state listener ───────────────────────────────────────────────────
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (event, session) => {
        log.info('Auth event:', event, '| session:', !!session);

        switch (event) {

          case 'SIGNED_IN':
            if (session) buildUser(session);
            break;

          case 'INITIAL_SESSION':
            if (session) {
              buildUser(session);
            } else if (!isOAuthReturn) {
              resolve(null, true);
            }
            // isOAuthReturn && !session: wait for SIGNED_IN
            break;

          case 'SIGNED_OUT':
            logout();
            break;

          default:
            break;
        }
      }
    );

    // ── Safety timeout ────────────────────────────────────────────────────────
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        log.warn('Auth safety timeout — clearing pending auth and showing modal');
        localStorage.removeItem(PENDING_LEVEL_KEY);
        localStorage.removeItem(PENDING_COUNTRY_KEY);
        resolve(null, true);
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const savePending = useCallback((pilotLevel: string, country: string) => {
    localStorage.setItem(PENDING_LEVEL_KEY, pilotLevel);
    localStorage.setItem(PENDING_COUNTRY_KEY, country);
  }, []);

  const clearUser = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PENDING_LEVEL_KEY);
    localStorage.removeItem(PENDING_COUNTRY_KEY);
    getSupabaseClient()?.auth.signOut().catch(() => { });
  }, []);

  return { user, needsRegistration, loading, savePending, clearUser };
}
