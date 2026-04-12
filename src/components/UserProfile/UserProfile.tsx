import React, { useState, useRef, useEffect } from 'react';
import { AppUser } from '../../types';
import { t } from '../../locales';
import styles from './UserProfile.module.css';

interface Props {
  user: AppUser;
  onClear: () => void;
}

export function UserProfile({ user, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef         = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleClear = () => {
    if (window.confirm(t.userProfile.clearConfirm)) {
      onClear();
    }
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        className={`${styles.avatar} ${open ? styles.avatarOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={user.name}
      >
        {initials}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <div className={styles.dropInitials}>{initials}</div>
            <div className={styles.dropInfo}>
              <div className={styles.dropName}>{user.name}</div>
              {user.email && (
                <div className={styles.dropEmail}>{user.email}</div>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.dropRow}>
            <span className={styles.dropLabel}>{t.userProfile.pilotLevel}</span>
            <span className={styles.dropValue}>{user.pilotLevel}</span>
          </div>

          <div className={styles.dropRow}>
            <span className={styles.dropLabel}>COUNTRY</span>
            <span className={styles.dropValue}>{user.country}</span>
          </div>

          <div className={styles.divider} />

          <button className={styles.clearBtn} onClick={handleClear}>
            {t.userProfile.clearProfile}
          </button>
        </div>
      )}
    </div>
  );
}
