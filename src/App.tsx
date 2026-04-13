import React, { useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import styles from './App.module.css';
import { Nav } from './components/Nav/Nav';
import { ProfileSetup } from './components/ProfileSetup/ProfileSetup';
import { UserRegistration } from './components/UserRegistration/UserRegistration';
import { useCallsign } from './hooks/useCallsign';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useUser } from './hooks/useUser';
import { t } from './locales';
import { FeedbackPage } from './pages/FeedbackPage';
import { LegalPage } from './pages/LegalPage';
import { MetarPage } from './pages/MetarPage';
import { PhoneticPage } from './pages/PhoneticPage';
import { ProgressPage } from './pages/ProgressPage';
import { SimulatorPage } from './pages/SimulatorPage';

export default function App() {
  const { user, needsRegistration, loading, savePending, completeProfile, clearUser } = useUser();
  const { callsign, reroll } = useCallsign();
  const { speak, cancel, voicePref, availableVoices, setVoiceGender, setVoiceName } = useSpeechSynthesis();

  const handleClearUser = useCallback(() => {
    clearUser();
  }, [clearUser]);

  if (loading) {
    return (
      <div className={styles.splash}>
        <div className={styles.splashLogo}>{t.app.loading}</div>
        <div className={styles.splashSub}>{t.app.loadingSub}</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {needsRegistration && (
        <UserRegistration onSavePending={savePending} />
      )}

      {!needsRegistration && user?.isNewUser && (
        <ProfileSetup
          name={user.name}
          onComplete={completeProfile}
        />
      )}

      <div className={styles.shell}>
        <Nav
          user={user}
          onClearUser={handleClearUser}
          callsign={callsign}
          onRerollCallsign={reroll}
          voicePref={voicePref}
          availableVoices={availableVoices}
          onVoiceGender={setVoiceGender}
          onVoiceName={setVoiceName}
        />

        <div className={styles.content}>
          <Routes>
            <Route path="/" element={<SimulatorPage user={user} callsign={callsign} userId={user?.id} speak={speak} cancel={cancel} />} />
            <Route path="/metar" element={<MetarPage />} />
            <Route path="/phonetic" element={<PhoneticPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/feedback" element={<FeedbackPage user={user} />} />
            <Route path="/legal" element={<LegalPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
