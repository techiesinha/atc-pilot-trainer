import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { AppUser } from '../types';
import { getSupabaseClient, getSessionUser, updateUserProfile } from '../services/userService';
import { log } from '../config';

const STORAGE_KEY = 'atcUser';
const OAUTH_PROGRESS_KEY = 'atcOAuthInProgress';

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

    const hasPendingAuth = localStorage.getItem(OAUTH_PROGRESS_KEY) === 'true';
    const hasOAuthInUrl =
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('error_description') ||
      window.location.search.includes('code=') ||
      window.location.search.includes('error=');

    const isOAuthReturn = hasPendingAuth || hasOAuthInUrl;

    log.info('isOAuthReturn:', isOAuthReturn,
      '| hasPendingAuth:', hasPendingAuth,
      '| hasOAuthInUrl:', hasOAuthInUrl);

    const buildUser = async (_session: Session) => {
      try {
        const sessionUser = await getSessionUser();
        if (sessionUser) {
          localStorage.removeItem(OAUTH_PROGRESS_KEY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
          resolve(sessionUser, false);
        } else {
          resolve(null, true);
        }
      } catch (e) {
        log.warn('buildUser error:', e);
        resolve(null, true);
      }
    };

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
            break;
          case 'SIGNED_OUT':
            localStorage.removeItem(STORAGE_KEY);
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

    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        log.warn('Auth safety timeout — showing registration modal');
        localStorage.removeItem(OAUTH_PROGRESS_KEY);
        resolve(null, true);
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const savePending = useCallback(() => {
    localStorage.setItem(OAUTH_PROGRESS_KEY, 'true');
  }, []);

  const completeProfile = useCallback(async (country: string, pilotLevel: string) => {
    if (!user) return;
    try {
      await updateUserProfile(user.id, country, pilotLevel);
    } catch (e) {
      log.warn('completeProfile error — dismissing anyway:', e);
    }
    const updated = { ...user, country, pilotLevel, isNewUser: false };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  const clearUser = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OAUTH_PROGRESS_KEY);
    getSupabaseClient()?.auth.signOut().catch((e) => {
      log.warn('signOut error:', e);
      setUser(null);
      setNeedsRegistration(true);
    });
  }, []);

  return { user, needsRegistration, loading, savePending, completeProfile, clearUser };
}
