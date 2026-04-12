import React from 'react';
import { AERODROMES, Aerodrome } from '../../config/aerodromes';
import { t } from '../../locales';
import styles from './TowerSelector.module.css';

interface Props {
  selected: Aerodrome;
  onChange: (a: Aerodrome) => void;
}

export function TowerSelector({ selected, onChange }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{t.tower.label}</div>
      <select
        className={styles.select}
        value={selected.icao}
        onChange={(e) => {
          const found = AERODROMES.find((a) => a.icao === e.target.value);
          if (found) onChange(found);
        }}
      >
        <optgroup label={t.tower.groupControlled}>
          {AERODROMES.filter((a) => a.controlled).map((a) => (
            <option key={a.icao} value={a.icao}>{a.icao} — {a.city}</option>
          ))}
        </optgroup>
        <optgroup label={t.tower.groupUncontrolled}>
          {AERODROMES.filter((a) => !a.controlled).map((a) => (
            <option key={a.icao} value={a.icao}>{a.icao} — {a.city}</option>
          ))}
        </optgroup>
      </select>
      <div className={`${styles.badge} ${selected.controlled ? styles.controlled : styles.uncontrolled}`}>
        {selected.controlled ? t.tower.controlled : t.tower.ctaf}
      </div>
    </div>
  );
}
