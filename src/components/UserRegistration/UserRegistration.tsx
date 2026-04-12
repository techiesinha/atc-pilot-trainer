import React, { useState } from 'react';
import { signInWithGoogle } from '../../services/userService';
import { t } from '../../locales';
import styles from './UserRegistration.module.css';

interface Props {
  onSavePending: (pilotLevel: string, country: string) => void;
}

/**
 * UserRegistration
 *
 * Google OAuth only — no name or email fields.
 * User selects their pilot level and country, then clicks
 * "Continue with Google". Those two values are saved to
 * localStorage before the redirect so they are available
 * when the app re-mounts after OAuth returns.
 */
export function UserRegistration({ onSavePending }: Props) {
  const [pilotLevel, setPilotLevel] = useState(t.registration.pilotLevels[0]);
  const [country, setCountry]       = useState(t.registration.countries[0]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      onSavePending(pilotLevel, country);
      await signInWithGoogle();
      // Page redirects to Google — execution does not continue here
    } catch (e) {
      setError(e instanceof Error ? e.message : t.registration.errorGeneric);
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <div className={styles.logo}>
          <span className={styles.logoMain}>{t.registration.logoMain}</span>
          <span className={styles.logoSub}>{t.registration.logoSub}</span>
        </div>

        <div className={styles.tagline}>{t.registration.tagline}</div>
        <p className={styles.desc}>{t.registration.description}</p>

        <div className={styles.form}>
          <div className={styles.formTitle}>{t.registration.formTitle}</div>

          <div className={styles.field}>
            <label className={styles.label}>{t.registration.levelLabel}</label>
            <select
              value={pilotLevel}
              onChange={(e) => setPilotLevel(e.target.value)}
              className={styles.select}
              disabled={loading}
            >
              {t.registration.pilotLevels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t.registration.countryLabel}</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={styles.select}
              disabled={loading}
            >
              {t.registration.countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.googleBtn}
            onClick={handleGoogle}
            disabled={loading}
          >
            {loading ? (
              <span>{t.registration.submitLoading}</span>
            ) : (
              <>
                <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t.registration.googleBtn}
              </>
            )}
          </button>
        </div>

        <div className={styles.privacy}>{t.registration.privacy}</div>

      </div>
    </div>
  );
}
