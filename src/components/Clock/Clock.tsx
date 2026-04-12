import React from 'react';
import { useClock } from '../../hooks/useClock';
import { t } from '../../locales';
import styles from './Clock.module.css';

export function Clock() {
  const { localTime, utcTime, utcDate } = useClock();
  return (
    <div className={styles.clock}>
      <div className={styles.row}>
        <span className={styles.label}>{t.clock.local}</span>
        <span className={styles.time}>{localTime}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{t.clock.utc}</span>
        <span className={styles.timeUtc}>{utcTime}</span>
      </div>
      <div className={styles.date}>{utcDate}</div>
    </div>
  );
}
