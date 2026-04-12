import React from 'react';
import { NavLink } from 'react-router-dom';
import { Clock } from '../Clock/Clock';
import { CockpitPlacard } from '../CockpitPlacard/CockpitPlacard';
import { VoiceSelector } from '../VoiceSelector/VoiceSelector';
import { UserProfile } from '../UserProfile/UserProfile';
import { VoicePreference, AppUser } from '../../types';
import { t } from '../../locales';
import { config } from '../../config';
import styles from './Nav.module.css';

const LINKS = [
  { to: '/',        full: t.nav.simulator,   short: t.nav.simulatorShort,   highlight: false },
  { to: '/metar',   full: t.nav.metar,        short: t.nav.metarShort,        highlight: false },
  { to: '/phonetic',full: t.nav.phonetics,    short: t.nav.phoneticsShort,    highlight: false },
  { to: '/progress',full: t.nav.progress,     short: t.nav.progressShort,     highlight: false },
  { to: '/feedback',full: t.nav.suggestions,  short: t.nav.suggestionsShort,  highlight: true  },
  { to: '/legal',   full: 'Legal',            short: 'LEG',                   highlight: false },
];

interface Props {
  user: AppUser | null;
  onClearUser: () => void;
  callsign: string;
  onRerollCallsign: () => void;
  voicePref: VoicePreference;
  availableVoices: { male: SpeechSynthesisVoice[]; female: SpeechSynthesisVoice[] };
  onVoiceGender: (g: 'male' | 'female') => void;
  onVoiceName: (n: string) => void;
}

export function Nav({
  user, onClearUser,
  callsign, onRerollCallsign,
  voicePref, availableVoices, onVoiceGender, onVoiceName,
}: Props) {
  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <div className={styles.logoRow}>
            <span className={styles.logoMain}>ATC</span>
            <span className={styles.logoVersion}>{t.app.version}{config.app.version}</span>
          </div>
          <span className={styles.logoSub}>TRAINER</span>
        </div>
        <div className={styles.links}>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                [styles.link, isActive ? styles.active : '', l.highlight ? styles.highlight : ''].join(' ')
              }
            >
              <span className={styles.short}>{l.short}</span>
              <span className={styles.full}>{l.full}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <CockpitPlacard callsign={callsign} onReroll={onRerollCallsign} />
        <VoiceSelector
          voicePref={voicePref}
          availableVoices={availableVoices}
          onGenderChange={onVoiceGender}
          onVoiceChange={onVoiceName}
        />
        <Clock />
        {user && <UserProfile user={user} onClear={onClearUser} />}
      </div>
    </nav>
  );
}
