/**
 * © 2025 Abhishek Sinha. All rights reserved.
 * ATC Pilot Trainer — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TowerSelector } from '../components/TowerSelector/TowerSelector';
import { Aerodrome, DEFAULT_AERODROME } from '../config/aerodromes';
import { CATEGORIES, resolveScenario, SCENARIO_TEMPLATES } from '../data/scenarios';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { t } from '../locales';
import { formatForSpeech } from '../services/avSpeak';
import { evaluateReadback } from '../services/scoring';
import { logEvent } from '../services/userService';
import { AppUser, FeedbackResult, FeedbackStatus, Scenario, ScenarioCategory, SessionRecord, TranscriptEntry } from '../types';
import styles from './SimulatorPage.module.css';

// ── Enums ─────────────────────────────────────────────────────────────────────

enum SimulatorState {
  Idle = 'idle',
  AtcSpeaking = 'atcSpeaking',
  Standby = 'standby',
  Transmitting = 'transmitting',
  Evaluating = 'evaluating',
  Feedback = 'feedback',
}

enum TranscriptSource {
  Atc = 'atc',
  Pilot = 'pilot',
  System = 'system',
}

enum CategoryId {
  Ground = 'ground',
  Tower = 'tower',
  Approach = 'approach',
  Emergency = 'emergency',
  Information = 'information',
  Uncontrolled = 'uncontrolled',
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSIONS_STORAGE_KEY = 'atcSessions';
const MAX_STORED_SESSIONS = 500;
const EVALUATION_DELAY_MS = 350;
const SCROLL_BEHAVIOR = 'smooth' as const;
const SCROLL_BLOCK = 'nearest' as const;
const WAVEFORM_BAR_COUNT = 32;
const WAVEFORM_TICK_MS = 60;
const WAVEFORM_MIN_HEIGHT = 2;
const WAVEFORM_MAX_HEIGHT = 24;
const WAVEFORM_IDLE_HEIGHT = 3;
const EMPTY_STRING = '';

const UNCONTROLLED_ALLOWED_CATEGORIES: CategoryId[] = [
  CategoryId.Uncontrolled,
  CategoryId.Emergency,
  CategoryId.Information,
];

const DISABLED_PTT_STATES: SimulatorState[] = [
  SimulatorState.Idle,
  SimulatorState.AtcSpeaking,
  SimulatorState.Evaluating,
];

const CSS_COLOR_GREEN_BRIGHT = 'var(--green-bright)';
const CSS_COLOR_GREEN_DIM = 'var(--green-dim)';
const CSS_COLOR_BLUE = 'var(--blue)';
const CSS_COLOR_AMBER = 'var(--amber)';
const CSS_COLOR_RED = 'var(--red)';

const FEEDBACK_STATUS_COLORS: Record<FeedbackStatus, string> = {
  [FeedbackStatus.Pass]: CSS_COLOR_GREEN_BRIGHT,
  [FeedbackStatus.Partial]: CSS_COLOR_AMBER,
  [FeedbackStatus.Fail]: CSS_COLOR_RED,
  [FeedbackStatus.Idle]: CSS_COLOR_GREEN_DIM,
};

const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  [FeedbackStatus.Pass]: t.simulator.feedback.pass,
  [FeedbackStatus.Partial]: t.simulator.feedback.partial,
  [FeedbackStatus.Fail]: t.simulator.feedback.retry,
  [FeedbackStatus.Idle]: EMPTY_STRING,
};

const STATE_COLOR_MAP: Record<SimulatorState, string> = {
  [SimulatorState.Idle]: CSS_COLOR_GREEN_DIM,
  [SimulatorState.AtcSpeaking]: CSS_COLOR_BLUE,
  [SimulatorState.Standby]: CSS_COLOR_GREEN_BRIGHT,
  [SimulatorState.Transmitting]: CSS_COLOR_GREEN_BRIGHT,
  [SimulatorState.Evaluating]: CSS_COLOR_AMBER,
  [SimulatorState.Feedback]: CSS_COLOR_AMBER,
};

const STATE_LABEL_MAP: Record<SimulatorState, string> = {
  [SimulatorState.Idle]: t.simulator.state.idle,
  [SimulatorState.AtcSpeaking]: t.simulator.state.atcSpeaking,
  [SimulatorState.Standby]: t.simulator.state.standby,
  [SimulatorState.Transmitting]: t.simulator.state.transmitting,
  [SimulatorState.Evaluating]: t.simulator.state.evaluating,
  [SimulatorState.Feedback]: t.simulator.state.feedback,
};

// ── Interfaces ────────────────────────────────────────────────────────────────

interface SimulatorPageProps {
  callsign: string;
  userId?: string;
  user?: AppUser | null;
  speak: (text: string, onStart?: () => void, onEnd?: () => void) => void;
  cancel: () => void;
}

interface WaveformProps {
  isActive: boolean;
}

interface FeedbackPanelProps {
  feedbackResult: FeedbackResult;
}

// ── Waveform component ────────────────────────────────────────────────────────

const Waveform = ({ isActive }: WaveformProps) => {
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(WAVEFORM_BAR_COUNT).fill(WAVEFORM_IDLE_HEIGHT)
  );

  useEffect(() => {
    if (!isActive) {
      setBarHeights(Array(WAVEFORM_BAR_COUNT).fill(WAVEFORM_IDLE_HEIGHT));
      return;
    }

    const tickInterval = setInterval(() => {
      setBarHeights(
        Array(WAVEFORM_BAR_COUNT)
          .fill(0)
          .map(() => {
            return Math.random() * WAVEFORM_MAX_HEIGHT + WAVEFORM_MIN_HEIGHT;
          })
      );
    }, WAVEFORM_TICK_MS);

    return () => { clearInterval(tickInterval); };
  }, [isActive]);

  return (
    <div className={styles.waveform}>
      {barHeights.map((barHeight, barIndex) => (
        <div
          key={barIndex}
          className={`${styles.waveBar} ${isActive ? styles.waveBarActive : ''}`}
          style={{ height: `${barHeight}px` }}
        />
      ))}
    </div>
  );
};

// ── FeedbackPanel component ───────────────────────────────────────────────────

const FeedbackPanel = ({ feedbackResult }: FeedbackPanelProps) => {
  return (
    <div className={styles.feedbackPanel}>
      <div className={styles.fbHeader}>
        <span
          className={styles.fbStatus}
          style={{ color: FEEDBACK_STATUS_COLORS[feedbackResult.status] }}
        >
          {FEEDBACK_STATUS_LABELS[feedbackResult.status]}
        </span>
        <span className={styles.fbScore}>{feedbackResult.score}%</span>
      </div>

      <div className={styles.checkList}>
        {feedbackResult.checkResults.map((checkResult, checkIndex) => {
          const checkClassName = checkResult.warning
            ? (checkResult.passed ? styles.checkOk : styles.checkWarn)
            : (checkResult.passed ? styles.checkOk : styles.checkFail);

          const checkIcon = checkResult.warning && !checkResult.passed
            ? t.simulator.feedback.checkWarn
            : checkResult.passed
              ? t.simulator.feedback.checkOk
              : t.simulator.feedback.checkFail;

          return (
            <div key={checkIndex} className={`${styles.checkItem} ${checkClassName}`}>
              <span className={styles.checkIcon}>{checkIcon}</span>
              <div>
                <div className={styles.checkLabel}>{checkResult.label}</div>
                {checkResult.detail && (
                  <div className={styles.checkDetail}>{checkResult.detail}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.refBox}>
        <div className={styles.boxLabel}>{t.simulator.feedback.refReadback}</div>
        <div className={styles.refText}>{feedbackResult.idealResponse}</div>
      </div>

      <div className={styles.teachBox}>
        <div className={styles.boxLabel}>{t.simulator.feedback.teachingNote}</div>
        <div className={styles.teachText}>{feedbackResult.teachingNote}</div>
      </div>
    </div>
  );
};

// ── SimulatorPage ─────────────────────────────────────────────────────────────

export const SimulatorPage = ({
  user,
  callsign,
  userId,
  speak,
  cancel,
}: SimulatorPageProps) => {
  const [selectedAerodrome, setSelectedAerodrome] = useState<Aerodrome>(DEFAULT_AERODROME);
  const [activeCategory, setActiveCategory] = useState<ScenarioCategory>(CategoryId.Ground);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [simulatorState, setSimulatorState] = useState<SimulatorState>(SimulatorState.Idle);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [liveTranscriptText, setLiveTranscriptText] = useState(EMPTY_STRING);
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null);
  const [isWaveformActive, setIsWaveformActive] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [, setSessions] = useLocalStorage<SessionRecord[]>(SESSIONS_STORAGE_KEY, []);

  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const liveTranscriptRef = useRef(EMPTY_STRING);
  const feedbackScrollRef = useRef<HTMLDivElement>(null);

  const { isSupported, start: startSpeechToText, stop: stopSpeechToText } = useSpeechRecognition();

  const availableCategories = CATEGORIES.filter((category) => {
    if (!selectedAerodrome.controlled) {
      return UNCONTROLLED_ALLOWED_CATEGORIES.includes(category.id as CategoryId);
    }
    return category.id !== CategoryId.Uncontrolled;
  });

  const scenarioList = SCENARIO_TEMPLATES
    .filter((template) => { return template.category === activeCategory; })
    .map((template) => { return resolveScenario(template, callsign, selectedAerodrome, user?.name ?? 'Trainee'); });

  useEffect(() => {
    const isUncontrolledCategory = UNCONTROLLED_ALLOWED_CATEGORIES.includes(activeCategory as CategoryId);
    if (!selectedAerodrome.controlled && !isUncontrolledCategory) {
      setActiveCategory(CategoryId.Uncontrolled);
    } else if (selectedAerodrome.controlled && activeCategory === CategoryId.Uncontrolled) {
      setActiveCategory(CategoryId.Ground);
    }
  }, [selectedAerodrome, activeCategory]);

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcriptEntries, liveTranscriptText]);

  useEffect(() => {
    if (feedbackResult && feedbackScrollRef.current) {
      feedbackScrollRef.current.scrollIntoView({
        behavior: SCROLL_BEHAVIOR,
        block: SCROLL_BLOCK,
      });
    }
  }, [feedbackResult]);

  const addTranscriptEntry = useCallback((
    source: TranscriptEntry['source'],
    text: string
  ) => {
    setTranscriptEntries((previousEntries) => {
      return [...previousEntries, { source, text, timestamp: new Date() }];
    });
  }, []);

  const loadScenario = useCallback((scenario: Scenario) => {
    cancel();
    stopSpeechToText();
    setCurrentScenario(scenario);
    setTranscriptEntries([]);
    setFeedbackResult(null);
    setLiveTranscriptText(EMPTY_STRING);
    setShowReference(false);
    liveTranscriptRef.current = EMPTY_STRING;

    if (scenario.pilotInitiated) {
      addTranscriptEntry(TranscriptSource.System, scenario.situation ?? EMPTY_STRING);
      setSimulatorState(SimulatorState.Standby);
    } else {
      setSimulatorState(SimulatorState.AtcSpeaking);
      addTranscriptEntry(TranscriptSource.Atc, scenario.atcCall);
      speak(
        formatForSpeech(scenario.atcCall),
        undefined,
        () => { setSimulatorState(SimulatorState.Standby); }
      );
    }
  }, [cancel, stopSpeechToText, addTranscriptEntry, speak]);

  const replayAtc = useCallback(() => {
    if (!currentScenario || currentScenario.pilotInitiated) return;
    cancel();
    setSimulatorState(SimulatorState.AtcSpeaking);
    speak(
      formatForSpeech(currentScenario.atcCall),
      undefined,
      () => { setSimulatorState(SimulatorState.Standby); }
    );
  }, [currentScenario, cancel, speak]);

  const startTransmission = useCallback(() => {
    if (
      simulatorState !== SimulatorState.Standby &&
      simulatorState !== SimulatorState.Feedback
    ) return;

    cancel();
    setSimulatorState(SimulatorState.Transmitting);
    setIsWaveformActive(true);
    setLiveTranscriptText(EMPTY_STRING);
    liveTranscriptRef.current = EMPTY_STRING;

    startSpeechToText((transcribedText) => {
      liveTranscriptRef.current = transcribedText;
      setLiveTranscriptText(transcribedText);
    });
  }, [simulatorState, cancel, startSpeechToText]);

  const stopTransmission = useCallback(() => {
    if (simulatorState !== SimulatorState.Transmitting) return;

    stopSpeechToText();
    setIsWaveformActive(false);
    setSimulatorState(SimulatorState.Evaluating);

    const finalTranscript = liveTranscriptRef.current.trim();

    if (!finalTranscript) {
      addTranscriptEntry(TranscriptSource.System, t.simulator.errors.noAudio);
      setSimulatorState(SimulatorState.Standby);
      return;
    }

    addTranscriptEntry(TranscriptSource.Pilot, finalTranscript);

    setTimeout(() => {
      if (!currentScenario) return;

      const evaluationResult = evaluateReadback(finalTranscript, currentScenario);
      setFeedbackResult(evaluationResult);
      setSimulatorState(SimulatorState.Feedback);

      const sessionRecord: SessionRecord = {
        id: Date.now().toString(),
        scenarioId: currentScenario.id,
        scenarioLabel: currentScenario.label,
        category: currentScenario.category,
        date: new Date().toISOString(),
        passed: evaluationResult.status === FeedbackStatus.Pass,
        score: evaluationResult.score,
        transcript: finalTranscript,
        aerodromeIcao: selectedAerodrome.icao,
      };

      setSessions((previousSessions) => {
        return [sessionRecord, ...previousSessions].slice(0, MAX_STORED_SESSIONS);
      });

      if (userId) {
        logEvent(userId, 'scenario_attempted', {
          scenarioId: currentScenario.id,
          category: currentScenario.category,
          passed: evaluationResult.status === FeedbackStatus.Pass,
          score: evaluationResult.score,
          aerodrome: selectedAerodrome.icao,
        }).catch(() => { });
      }
    }, EVALUATION_DELAY_MS);
  }, [
    simulatorState,
    stopSpeechToText,
    addTranscriptEntry,
    currentScenario,
    selectedAerodrome,
    userId,
    setSessions,
  ]);

  const handleAerodromeChange = useCallback((aerodrome: Aerodrome) => {
    setSelectedAerodrome(aerodrome);
    setCurrentScenario(null);
    setFeedbackResult(null);
    setTranscriptEntries([]);
  }, []);

  const feedbackStateColor = feedbackResult?.status === FeedbackStatus.Pass
    ? CSS_COLOR_GREEN_BRIGHT
    : CSS_COLOR_AMBER;

  const currentStateColor = simulatorState === SimulatorState.Feedback
    ? feedbackStateColor
    : STATE_COLOR_MAP[simulatorState];

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.towerWrap}>
          <TowerSelector selected={selectedAerodrome} onChange={handleAerodromeChange} />
        </div>

        <div className={styles.catList}>
          {availableCategories.map((category) => (
            <button
              key={category.id}
              className={`${styles.catBtn} ${activeCategory === category.id ? styles.catActive : ''}`}
              style={{ '--cat': category.color } as React.CSSProperties}
              onClick={() => { setActiveCategory(category.id as ScenarioCategory); }}
            >
              <span className={styles.catLabel}>{category.label}</span>
              <span className={styles.catDesc}>
                {t.simulator.categoryDesc[category.id as keyof typeof t.simulator.categoryDesc]}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.scenList}>
          {scenarioList.map((scenario) => (
            <button
              key={scenario.id}
              className={`${styles.scenBtn} ${currentScenario?.id === scenario.id ? styles.scenActive : ''}`}
              onClick={() => { loadScenario(scenario); }}
            >
              <span className={styles.scenLabel}>{scenario.label}</span>
              <span className={`${styles.diff} ${styles[scenario.difficulty]}`}>
                {t.simulator.difficulty[scenario.difficulty]}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.radioHead}>
          <div>
            <div className={styles.radioMeta}>{t.simulator.radio.vhfComm}</div>
            <div className={styles.freqDisplay}>
              {currentScenario?.freq ?? t.simulator.radio.freqEmpty}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className={styles.radioMeta}>{t.simulator.radio.squawk}</div>
            <div className={styles.squawkDisplay}>
              {currentScenario?.squawk ?? t.simulator.radio.squawkEmpty}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.radioMeta}>{t.simulator.radio.status}</div>
            <div className={styles.stateDisplay} style={{ color: currentStateColor }}>
              {STATE_LABEL_MAP[simulatorState]}
            </div>
          </div>
        </div>

        <div className={styles.transcript} ref={transcriptScrollRef}>
          {transcriptEntries.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyDesktop}>{t.simulator.log.empty}</span>
              <span className={styles.emptyMobile}>{t.simulator.log.emptyMobile}</span>
            </div>
          )}
          {transcriptEntries.map((entry, entryIndex) => (
            <div
              key={entryIndex}
              className={`${styles.entry} ${styles[entry.source]}`}
            >
              <span className={styles.src}>
                {entry.source === TranscriptSource.Atc
                  ? t.simulator.log.labelAtc
                  : entry.source === TranscriptSource.Pilot
                    ? t.simulator.log.labelPilot
                    : t.simulator.log.labelSys}
              </span>
              <span className={styles.entryText}>{entry.text}</span>
            </div>
          ))}
          {simulatorState === SimulatorState.Transmitting && liveTranscriptText && (
            <div className={`${styles.entry} ${styles.pilot}`}>
              <span className={styles.src}>{t.simulator.log.labelPilot}</span>
              <span className={styles.entryText}>
                {liveTranscriptText}
                <span className={styles.cursor}>▋</span>
              </span>
            </div>
          )}
        </div>

        <Waveform isActive={isWaveformActive} />

        {currentScenario && (
          <div className={styles.referenceWrap}>
            <button
              className={`${styles.referenceToggle} ${showReference ? styles.referenceToggleOn : ''}`}
              onClick={() => { setShowReference((prev) => !prev); }}
            >
              <span className={styles.referenceToggleLabel}>REFERENCE CALL</span>
              <span className={styles.referenceToggleSwitch}>
                <span className={`${styles.referenceTrack} ${showReference ? styles.referenceTrackOn : ''}`}>
                  <span className={`${styles.referenceThumb} ${showReference ? styles.referenceThumbOn : ''}`} />
                </span>
                <span className={styles.referenceOnOff}>{showReference ? 'ON' : 'OFF'}</span>
              </span>
            </button>
            {showReference && (
              <div className={styles.referencePanel}>
                <div className={styles.referenceLabel}>IDEAL READBACK</div>
                <div className={styles.referenceText}>{currentScenario.idealResponse}</div>
              </div>
            )}
          </div>
        )}

        <div className={styles.controls}>
          <button
            className={styles.replayBtn}
            onClick={replayAtc}
            disabled={
              !currentScenario ||
              currentScenario.pilotInitiated ||
              simulatorState === SimulatorState.Transmitting
            }
          >
            {t.simulator.buttons.replayAtc}
          </button>
          <button
            className={`${styles.pttBtn} ${simulatorState === SimulatorState.Transmitting ? styles.pttActive : ''}`}
            onMouseDown={startTransmission}
            onMouseUp={stopTransmission}
            onTouchStart={(touchEvent) => { touchEvent.preventDefault(); startTransmission(); }}
            onTouchEnd={(touchEvent) => { touchEvent.preventDefault(); stopTransmission(); }}
            disabled={DISABLED_PTT_STATES.includes(simulatorState)}
          >
            {simulatorState === SimulatorState.Transmitting
              ? t.simulator.buttons.transmitting
              : t.simulator.buttons.holdPtt}
          </button>
        </div>

        {feedbackResult && (
          <div ref={feedbackScrollRef}>
            <FeedbackPanel feedbackResult={feedbackResult} />
          </div>
        )}

        {!isSupported && (
          <div className={styles.noSpeech}>{t.simulator.errors.noSpeech}</div>
        )}
      </main>
    </div>
  );
};
