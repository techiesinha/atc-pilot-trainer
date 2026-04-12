import React from 'react';
import { callsignToPhonetic } from '../../data/callsigns';
import { t } from '../../locales';
import styles from './CockpitPlacard.module.css';

interface Props {
  callsign: string;
  onReroll: () => void;
}

export function CockpitPlacard({ callsign, onReroll }: Props) {
  const phonetic = callsignToPhonetic(callsign);
  return (
    <div className={styles.placard} title={`${t.placard.rerollTitle}\n${phonetic}`}>
      <div className={styles.inner}>
        <div className={styles.topLabel}>{t.placard.topLabel}</div>
        <div className={styles.callsign}>{callsign}</div>
        <div className={styles.bottomLabel}>{t.placard.bottomLabel}</div>
      </div>
      <button className={styles.rerollBtn} onClick={onReroll} title={t.placard.rerollTitle}>
        {t.placard.rerollIcon}
      </button>
    </div>
  );
}
