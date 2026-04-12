import { useState, useEffect, useCallback } from 'react';
import { AppUser } from '../types';
import { getSessionUser } from '../services/userService';
import { log } from '../config';

const STORAGE_KEY         = 'atcUser';
const PENDING_LEVEL_KEY   = 'atcPendingPilotLevel';
const PENDING_COUNTRY_KEY = 'atcPendingCountry';

/**
 * useUser
 *
 * Manages the authenticated user lifecycle with Google OAuth.
 *
 * On every mount it runs in this order:
 *   1. Check localStorage for an existing session  → use it
 *   2. Check Supabase for an active Google session → create/fetch profile
 *   3. Neither found                               → show registration modal
 *
 * The registration modal collects only pilot level and country.
 * Name and email come from Google automatically.
 */
export function useUser() {
  const [user, setUser]                       = useState<AppUser | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    const init = async () => {
      // Step 1 — existing local session
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AppUser;
          setUser(parsed);
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Step 2 — returning from Google OAuth redirect
      const pendingLevel   = localStorage.getItem(PENDING_LEVEL_KEY)   ?? 'Student pilot (PPL training)';
      const pendingCountry = localStorage.getItem(PENDING_COUNTRY_KEY) ?? 'India';

      try {
        const sessionUser = await getSessionUser(pendingLevel, pendingCountry);
        if (sessionUser) {
          localStorage.removeItem(PENDING_LEVEL_KEY);
          localStorage.removeItem(PENDING_COUNTRY_KEY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
          setUser(sessionUser);
          setLoading(false);
          return;
        }
      } catch (e) {
        log.warn('Session check failed:', e);
      }

      // Step 3 — no user found — show registration modal
      setNeedsRegistration(true);
      setLoading(false);
    };

    init();
  }, []);

  /**
   * Called by UserRegistration before redirecting to Google.
   * Saves the user's pilot level and country so they are available
   * after the OAuth redirect returns.
   */
  const savePending = useCallback((pilotLevel: string, country: string) => {
    localStorage.setItem(PENDING_LEVEL_KEY,   pilotLevel);
    localStorage.setItem(PENDING_COUNTRY_KEY, country);
  }, []);

  /**
   * Clears the local session — triggers the registration modal on next load.
   */
  const clearUser = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PENDING_LEVEL_KEY);
    localStorage.removeItem(PENDING_COUNTRY_KEY);
  }, []);

  return { user, needsRegistration, loading, savePending, clearUser };
}
