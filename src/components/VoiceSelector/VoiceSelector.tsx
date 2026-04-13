import React, { useEffect, useRef, useState } from 'react';
import { t } from '../../locales';
import { VoiceGender, VoicePreference } from '../../types';
import styles from './VoiceSelector.module.css';

const VENDOR_NAMES_PATTERN = /Microsoft|Google|Apple/g;
const EMPTY_STRING = '';

interface VoiceSelectorProps {
  voicePref: VoicePreference;
  availableVoices: { male: SpeechSynthesisVoice[]; female: SpeechSynthesisVoice[] };
  onGenderChange: (gender: VoiceGender) => void;
  onVoiceChange: (voiceName: string) => void;
}

export const VoiceSelector = ({
  voicePref,
  availableVoices,
  onGenderChange,
  onVoiceChange,
}: VoiceSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const voicePool = voicePref.gender === VoiceGender.Male
    ? availableVoices.male
    : availableVoices.female;

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (mouseEvent: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(mouseEvent.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => { document.removeEventListener('mousedown', handleOutsideClick); };
  }, [isOpen]);

  const cleanVoiceName = (rawVoiceName: string): string => {
    return rawVoiceName.replace(VENDOR_NAMES_PATTERN, EMPTY_STRING).trim();
  };

  return (
    <div className={styles.wrap} ref={wrapperRef}>
      <div className={styles.genderBtns}>
        <button
          className={`${styles.gBtn} ${voicePref.gender === VoiceGender.Male ? styles.gActive : ''}`}
          onClick={() => { onGenderChange(VoiceGender.Male); }}
          title={t.voice.maleTitle}
        >
          {t.voice.male}
        </button>
        <button
          className={`${styles.gBtn} ${voicePref.gender === VoiceGender.Female ? styles.gActive : ''}`}
          onClick={() => { onGenderChange(VoiceGender.Female); }}
          title={t.voice.femaleTitle}
        >
          {t.voice.female}
        </button>
        {voicePool.length > 1 && (
          <button
            className={`${styles.voicePickBtn} ${isOpen ? styles.voicePickActive : ''}`}
            onClick={() => { setIsOpen((previousOpen) => !previousOpen); }}
            title={t.voice.pickTitle}
          >
            {t.voice.expand}
          </button>
        )}
      </div>

      {isOpen && voicePool.length > 0 && (
        <div className={styles.dropdown}>
          <div className={styles.dropLabel}>{t.voice.dropLabel}</div>
          {voicePool.map((voice) => (
            <button
              key={voice.name}
              className={`${styles.voiceOpt} ${voicePref.voiceName === voice.name ? styles.voiceOptActive : ''}`}
              onClick={() => { onVoiceChange(voice.name); setIsOpen(false); }}
            >
              {cleanVoiceName(voice.name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
