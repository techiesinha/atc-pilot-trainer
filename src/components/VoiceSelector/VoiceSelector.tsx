import React, { useState, useRef, useEffect } from 'react';
import { t } from '../../locales';
import { VoicePreference } from '../../types';
import styles from './VoiceSelector.module.css';

interface Props {
  voicePref: VoicePreference;
  availableVoices: { male: SpeechSynthesisVoice[]; female: SpeechSynthesisVoice[] };
  onGenderChange: (g: 'male' | 'female') => void;
  onVoiceChange: (name: string) => void;
}

export function VoiceSelector({ voicePref, availableVoices, onGenderChange, onVoiceChange }: Props) {
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef<HTMLDivElement>(null);
  const pool = voicePref.gender === 'male' ? availableVoices.male : availableVoices.female;

  // Close dropdown when clicking outside
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

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.genderBtns}>
        <button
          className={`${styles.gBtn} ${voicePref.gender === 'male' ? styles.gActive : ''}`}
          onClick={() => onGenderChange('male')}
          title={t.voice.maleTitle}
        >
          {t.voice.male}
        </button>
        <button
          className={`${styles.gBtn} ${voicePref.gender === 'female' ? styles.gActive : ''}`}
          onClick={() => onGenderChange('female')}
          title={t.voice.femaleTitle}
        >
          {t.voice.female}
        </button>
        {pool.length > 1 && (
          <button
            className={`${styles.voicePickBtn} ${open ? styles.voicePickActive : ''}`}
            onClick={() => setOpen((o) => !o)}
            title={t.voice.pickTitle}
          >
            {t.voice.expand}
          </button>
        )}
      </div>

      {open && pool.length > 0 && (
        <div className={styles.dropdown}>
          <div className={styles.dropLabel}>{t.voice.dropLabel}</div>
          {pool.map((v) => (
            <button
              key={v.name}
              className={`${styles.voiceOpt} ${voicePref.voiceName === v.name ? styles.voiceOptActive : ''}`}
              onClick={() => { onVoiceChange(v.name); setOpen(false); }}
            >
              {v.name.replace(/Microsoft|Google|Apple/g, '').trim()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
