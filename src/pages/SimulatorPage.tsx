/**
 * © 2025-2026 Abhishek Sinha. All rights reserved.
 * ATC Pilot Trainer — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TowerSelector } from '../components/TowerSelector/TowerSelector';
import { Aerodrome, DEFAULT_AERODROME } from '../config/aerodromes';
import { SCENARIO_TEMPLATES, CATEGORIES, resolveScenario } from '../data/scenarios';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { t } from '../locales';
import { formatForSpeech } from '../services/avSpeak';
import { evaluateReadback } from '../services/scoring';
import { logEvent } from '../services/userService';
import { Scenario, TranscriptEntry, FeedbackResult, SessionRecord, ScenarioCategory } from '../types';
import styles from './SimulatorPage.module.css';

type SimState = 'idle' | 'atc_speaking' | 'standby' | 'transmitting' | 'evaluating' | 'feedback';

interface Props {
  callsign: string;
  userId?: string;
  speak: (text: string, onStart?: () => void, onEnd?: () => void) => void;
  cancel: () => void;
}

export function SimulatorPage({ callsign, userId, speak, cancel }: Props) {
  const [aerodrome, setAerodrome] = useState<Aerodrome>(DEFAULT_AERODROME);
  const [activeCategory, setCategory] = useState<ScenarioCategory>('ground');
  const [currentScenario, setScenario] = useState<Scenario | null>(null);
  const [simState, setSimState] = useState<SimState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [liveText, setLiveText] = useState('');
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [waveActive, setWaveActive] = useState(false);
  const [, setSessions] = useLocalStorage<SessionRecord[]>('atcSessions', []);

  const txRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef('');
  const fbRef = useRef<HTMLDivElement>(null);

  const { isSupported, start: startSTT, stop: stopSTT } = useSpeechRecognition();

  const availableCategories = CATEGORIES.filter((c) => {
    if (!aerodrome.controlled) return ['uncontrolled', 'emergency', 'information'].includes(c.id);
    return c.id !== 'uncontrolled';
  });

  const scenarioList = SCENARIO_TEMPLATES
    .filter((tmpl) => tmpl.category === activeCategory)
    .map((tmpl) => resolveScenario(tmpl, callsign, aerodrome));

  useEffect(() => {
    if (!aerodrome.controlled && !['uncontrolled', 'emergency', 'information'].includes(activeCategory)) {
      setCategory('uncontrolled');
    } else if (aerodrome.controlled && activeCategory === 'uncontrolled') {
      setCategory('ground');
    }
  }, [aerodrome, activeCategory]);

  useEffect(() => {
    if (txRef.current) txRef.current.scrollTop = txRef.current.scrollHeight;
  }, [transcript, liveText]);

  useEffect(() => {
    if (feedback && fbRef.current) fbRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [feedback]);

  const addEntry = useCallback((source: TranscriptEntry['source'], text: string) => {
    setTranscript((p) => [...p, { source, text, timestamp: new Date() }]);
  }, []);

  const loadScenario = useCallback((s: Scenario) => {
    cancel(); stopSTT();
    setScenario(s); setTranscript([]); setFeedback(null);
    setLiveText(''); liveRef.current = '';
    if (s.pilotInitiated) {
      addEntry('system', s.situation ?? '');
      setSimState('standby');
    } else {
      setSimState('atc_speaking');
      addEntry('atc', s.atcCall);
      speak(formatForSpeech(s.atcCall), undefined, () => setSimState('standby'));
    }
  }, [cancel, stopSTT, addEntry, speak]);

  const replayATC = useCallback(() => {
    if (!currentScenario || currentScenario.pilotInitiated) return;
    cancel(); setSimState('atc_speaking');
    speak(formatForSpeech(currentScenario.atcCall), undefined, () => setSimState('standby'));
  }, [currentScenario, cancel, speak]);

  const startTx = useCallback(() => {
    if (simState !== 'standby' && simState !== 'feedback') return;
    cancel(); setSimState('transmitting'); setWaveActive(true);
    setLiveText(''); liveRef.current = '';
    startSTT((tx) => { liveRef.current = tx; setLiveText(tx); });
  }, [simState, cancel, startSTT]);

  const stopTx = useCallback(() => {
    if (simState !== 'transmitting') return;
    stopSTT(); setWaveActive(false); setSimState('evaluating');
    const final = liveRef.current.trim();
    if (!final) {
      addEntry('system', t.simulator.errors.noAudio);
      setSimState('standby'); return;
    }
    addEntry('pilot', final);
    setTimeout(() => {
      if (!currentScenario) return;
      const result = evaluateReadback(final, currentScenario);
      setFeedback(result); setSimState('feedback');
      const record: SessionRecord = {
        id: Date.now().toString(),
        scenarioId: currentScenario.id,
        scenarioLabel: currentScenario.label,
        category: currentScenario.category,
        date: new Date().toISOString(),
        passed: result.status === 'pass',
        score: result.score,
        transcript: final,
        aerodromeIcao: aerodrome.icao,
      };
      setSessions((p) => [record, ...p].slice(0, 500));
      if (userId) {
        logEvent(userId, 'scenario_attempted', {
          scenario_id: currentScenario.id,
          category: currentScenario.category,
          passed: result.status === 'pass',
          score: result.score,
          aerodrome: aerodrome.icao,
        }).catch(() => { });
      }
    }, 350);
  }, [simState, stopSTT, addEntry, currentScenario, aerodrome, userId, setSessions]);

  const stateLabel: Record<SimState, string> = {
    idle: t.simulator.state.idle,
    atc_speaking: t.simulator.state.atcSpeaking,
    standby: t.simulator.state.standby,
    transmitting: t.simulator.state.transmitting,
    evaluating: t.simulator.state.evaluating,
    feedback: t.simulator.state.feedback,
  };

  const stateColor: Record<SimState, string> = {
    idle: 'var(--green-dim)', atc_speaking: 'var(--blue)',
    standby: 'var(--green-bright)', transmitting: 'var(--green-bright)',
    evaluating: 'var(--amber)',
    feedback: feedback?.status === 'pass' ? 'var(--green-bright)' : 'var(--amber)',
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.towerWrap}>
          <TowerSelector selected={aerodrome} onChange={(a) => { setAerodrome(a); setScenario(null); setFeedback(null); setTranscript([]); }} />
        </div>
        <div className={styles.catList}>
          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catActive : ''}`}
              style={{ '--cat': cat.color } as React.CSSProperties}
              onClick={() => setCategory(cat.id as ScenarioCategory)}
            >
              <span className={styles.catLabel}>{cat.label}</span>
              <span className={styles.catDesc}>{t.simulator.categoryDesc[cat.id as keyof typeof t.simulator.categoryDesc]}</span>
            </button>
          ))}
        </div>
        <div className={styles.scenList}>
          {scenarioList.map((s) => (
            <button
              key={s.id}
              className={`${styles.scenBtn} ${currentScenario?.id === s.id ? styles.scenActive : ''}`}
              onClick={() => loadScenario(s)}
            >
              <span className={styles.scenLabel}>{s.label}</span>
              <span className={`${styles.diff} ${styles[s.difficulty]}`}>
                {t.simulator.difficulty[s.difficulty]}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.radioHead}>
          <div>
            <div className={styles.radioMeta}>{t.simulator.radio.vhfComm}</div>
            <div className={styles.freqDisplay}>{currentScenario?.freq ?? t.simulator.radio.freqEmpty}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className={styles.radioMeta}>{t.simulator.radio.squawk}</div>
            <div className={styles.squawkDisplay}>{currentScenario?.squawk ?? t.simulator.radio.squawkEmpty}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.radioMeta}>{t.simulator.radio.status}</div>
            <div className={styles.stateDisplay} style={{ color: stateColor[simState] }}>
              {stateLabel[simState]}
            </div>
          </div>
        </div>

        <div className={styles.transcript} ref={txRef}>
          {transcript.length === 0 && (
            <div className={styles.empty}>{t.simulator.log.empty}</div>
          )}
          {transcript.map((e, i) => (
            <div key={i} className={`${styles.entry} ${styles[e.source]}`}>
              <span className={styles.src}>
                {e.source === 'atc' ? t.simulator.log.labelAtc
                  : e.source === 'pilot' ? t.simulator.log.labelPilot
                    : t.simulator.log.labelSys}
              </span>
              <span className={styles.entryText}>{e.text}</span>
            </div>
          ))}
          {simState === 'transmitting' && liveText && (
            <div className={`${styles.entry} ${styles.pilot}`}>
              <span className={styles.src}>{t.simulator.log.labelPilot}</span>
              <span className={styles.entryText}>{liveText}<span className={styles.cursor}>▋</span></span>
            </div>
          )}
        </div>

        <Waveform active={waveActive} />

        <div className={styles.controls}>
          <button
            className={styles.replayBtn}
            onClick={replayATC}
            disabled={!currentScenario || currentScenario.pilotInitiated || simState === 'transmitting'}
          >
            {t.simulator.buttons.replayAtc}
          </button>
          <button
            className={`${styles.pttBtn} ${simState === 'transmitting' ? styles.pttActive : ''}`}
            onMouseDown={startTx}
            onMouseUp={stopTx}
            onTouchStart={(e) => { e.preventDefault(); startTx(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopTx(); }}
            disabled={['idle', 'atc_speaking', 'evaluating'].includes(simState)}
          >
            {simState === 'transmitting' ? t.simulator.buttons.transmitting : t.simulator.buttons.holdPtt}
          </button>
        </div>

        {feedback && (
          <div ref={fbRef}><FeedbackPanel feedback={feedback} /></div>
        )}

        {!isSupported && (
          <div className={styles.noSpeech}>{t.simulator.errors.noSpeech}</div>
        )}
      </main>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  const [heights, setHeights] = useState<number[]>(Array(32).fill(3));
  useEffect(() => {
    if (!active) { setHeights(Array(32).fill(3)); return; }
    const id = setInterval(() => setHeights(Array(32).fill(0).map(() => Math.random() * 24 + 2)), 60);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div className={styles.waveform}>
      {heights.map((h, i) => (
        <div key={i} className={`${styles.waveBar} ${active ? styles.waveBarActive : ''}`} style={{ height: `${h}px` }} />
      ))}
    </div>
  );
}

function FeedbackPanel({ feedback }: { feedback: FeedbackResult }) {
  const colors = { pass: 'var(--green-bright)', partial: 'var(--amber)', fail: 'var(--red)', idle: 'var(--green-dim)' };
  const labels = { pass: t.simulator.feedback.pass, partial: t.simulator.feedback.partial, fail: t.simulator.feedback.retry, idle: '' };
  return (
    <div className={styles.feedbackPanel}>
      <div className={styles.fbHeader}>
        <span className={styles.fbStatus} style={{ color: colors[feedback.status] }}>{labels[feedback.status]}</span>
        <span className={styles.fbScore}>{feedback.score}%</span>
      </div>
      <div className={styles.checkList}>
        {feedback.checkResults.map((r, i) => (
          <div key={i} className={`${styles.checkItem} ${r.warning ? (r.passed ? styles.checkOk : styles.checkWarn) : r.passed ? styles.checkOk : styles.checkFail}`}>
            <span className={styles.checkIcon}>
              {r.warning && !r.passed ? t.simulator.feedback.checkWarn : r.passed ? t.simulator.feedback.checkOk : t.simulator.feedback.checkFail}
            </span>
            <div>
              <div className={styles.checkLabel}>{r.label}</div>
              {r.detail && <div className={styles.checkDetail}>{r.detail}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.refBox}>
        <div className={styles.boxLabel}>{t.simulator.feedback.refReadback}</div>
        <div className={styles.refText}>{feedback.idealResponse}</div>
      </div>
      <div className={styles.teachBox}>
        <div className={styles.boxLabel}>{t.simulator.feedback.teachingNote}</div>
        <div className={styles.teachText}>{feedback.teachingNote}</div>
      </div>
    </div>
  );
}
