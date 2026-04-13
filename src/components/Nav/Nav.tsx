import React from 'react';
import { NavLink } from 'react-router-dom';
import { config } from '../../config';
import { t } from '../../locales';
import { AppUser, VoiceGender, VoicePreference } from '../../types';
import { Clock } from '../Clock/Clock';
import { CockpitPlacard } from '../CockpitPlacard/CockpitPlacard';
import { UserProfile } from '../UserProfile/UserProfile';
import { VoiceSelector } from '../VoiceSelector/VoiceSelector';
import styles from './Nav.module.css';

const ROOT_ROUTE = '/';

interface NavLinkItem {
  to: string;
  full: string;
  short: string;
  highlight: boolean;
}

const NAV_LINKS: NavLinkItem[] = [
  { to: '/', full: t.nav.simulator, short: t.nav.simulatorShort, highlight: false },
  { to: '/metar', full: t.nav.metar, short: t.nav.metarShort, highlight: false },
  { to: '/phonetic', full: t.nav.phonetics, short: t.nav.phoneticsShort, highlight: false },
  { to: '/progress', full: t.nav.progress, short: t.nav.progressShort, highlight: false },
  { to: '/feedback', full: t.nav.suggestions, short: t.nav.suggestionsShort, highlight: true },
  { to: '/legal', full: t.nav.legal, short: t.nav.legalShort, highlight: false },
];

interface NavProps {
  user: AppUser | null;
  onClearUser: () => void;
  callsign: string;
  onRerollCallsign: () => void;
  voicePref: VoicePreference;
  availableVoices: { male: SpeechSynthesisVoice[]; female: SpeechSynthesisVoice[] };
  onVoiceGender: (gender: VoiceGender) => void;
  onVoiceName: (voiceName: string) => void;
}

export const Nav = ({
  user,
  onClearUser,
  callsign,
  onRerollCallsign,
  voicePref,
  availableVoices,
  onVoiceGender,
  onVoiceName,
}: NavProps) => {
  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <div className={styles.logoRow}>
            <span className={styles.logoMain}>{t.app.name}</span>
            <span className={styles.logoVersion}>{t.app.version}{config.app.version}</span>
          </div>
          <span className={styles.logoSub}>{t.app.tagline}</span>
        </div>
        <div className={styles.links}>
          {NAV_LINKS.map((navLink) => (
            <NavLink
              key={navLink.to}
              to={navLink.to}
              end={navLink.to === ROOT_ROUTE}
              className={({ isActive }) => [
                styles.link,
                isActive ? styles.active : '',
                navLink.highlight ? styles.highlight : '',
              ].join(' ')}
            >
              <span className={styles.short}>{navLink.short}</span>
              <span className={styles.full}>{navLink.full}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.placardWrap}>
          <CockpitPlacard callsign={callsign} onReroll={onRerollCallsign} />
        </div>
        <VoiceSelector
          voicePref={voicePref}
          availableVoices={availableVoices}
          onGenderChange={onVoiceGender}
          onVoiceChange={onVoiceName}
        />
        <div className={styles.clockWrap}>
          <Clock />
        </div>
        {user && <UserProfile user={user} onClear={onClearUser} />}
      </div>
    </nav>
  );
};
