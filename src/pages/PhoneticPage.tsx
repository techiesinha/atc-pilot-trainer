/**
 * © 2025 Abhishek Sinha. All rights reserved.
 * ATC Pilot Trainer — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AVIATION_NUMBERS, PHONETIC_ALPHABET } from '../data/phonetics';
import { t } from '../locales';
import styles from './PhoneticPage.module.css';

// ── Enums ─────────────────────────────────────────────────────────────────────

enum DrillMode {
  Learn = 'learn',
  L2P = 'l2p',
  P2L = 'p2l',
  Numbers = 'numbers',
}

enum AnswerState {
  Asking = 'asking',
  Correct = 'correct',
  Wrong = 'wrong',
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERCENTAGE_MULTIPLIER = 100;
const FOCUS_DELAY_START_DRILL_MS = 100;
const FOCUS_DELAY_NEXT_ITEM_MS = 50;
const ENTER_KEY = 'Enter';
const EMPTY_STRING = '';
const ZERO_SCORE = { correctCount: 0, totalCount: 0 };

interface DrillModeOption {
  id: DrillMode;
  label: string;
}

const DRILL_MODE_OPTIONS: DrillModeOption[] = [
  { id: DrillMode.Learn, label: t.phonetics.modes.learn },
  { id: DrillMode.L2P, label: t.phonetics.modes.l2p },
  { id: DrillMode.P2L, label: t.phonetics.modes.p2l },
  { id: DrillMode.Numbers, label: t.phonetics.modes.numbers },
];

const DRILL_QUESTION_LABELS: Record<DrillMode, string> = {
  [DrillMode.Learn]: EMPTY_STRING,
  [DrillMode.L2P]: t.phonetics.drill.labelL2p,
  [DrillMode.P2L]: t.phonetics.drill.labelP2l,
  [DrillMode.Numbers]: t.phonetics.drill.labelNumbers,
};

// ── Interfaces ────────────────────────────────────────────────────────────────

interface QuizItem {
  question: string;
  answer: string;
  hint: string;
}

interface DrillScore {
  correctCount: number;
  totalCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildQuizItems = (drillMode: DrillMode): QuizItem[] => {
  if (drillMode === DrillMode.Numbers) {
    return AVIATION_NUMBERS.map((numberItem) => {
      return {
        question: numberItem.digit,
        answer: numberItem.spoken.toLowerCase(),
        hint: `"${numberItem.digit}" is spoken "${numberItem.spoken}" in aviation to prevent confusion.`,
      };
    });
  }

  const shuffledAlphabet = [...PHONETIC_ALPHABET].sort(() => { return Math.random() - 0.5; });

  if (drillMode === DrillMode.L2P) {
    return shuffledAlphabet.map((phoneticItem) => {
      return {
        question: phoneticItem.letter,
        answer: phoneticItem.phonetic.toLowerCase(),
        hint: `"${phoneticItem.letter}" = "${phoneticItem.phonetic}". Example: "${phoneticItem.example}"`,
      };
    });
  }

  return shuffledAlphabet.map((phoneticItem) => {
    return {
      question: phoneticItem.phonetic,
      answer: phoneticItem.letter.toLowerCase(),
      hint: `"${phoneticItem.phonetic}" = the letter "${phoneticItem.letter}"`,
    };
  });
};

// ── Component ─────────────────────────────────────────────────────────────────

export const PhoneticPage = () => {
  const [activeDrillMode, setActiveDrillMode] = useState<DrillMode>(DrillMode.Learn);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState(EMPTY_STRING);
  const [answerState, setAnswerState] = useState<AnswerState>(AnswerState.Asking);
  const [drillScore, setDrillScore] = useState<DrillScore>(ZERO_SCORE);
  const answerInputRef = useRef<HTMLInputElement>(null);

  const currentQuizItem = quizItems[currentItemIndex];

  const startDrill = useCallback((drillMode: DrillMode) => {
    if (drillMode === DrillMode.Learn) {
      setActiveDrillMode(DrillMode.Learn);
      return;
    }

    setQuizItems(buildQuizItems(drillMode));
    setCurrentItemIndex(0);
    setAnswerInput(EMPTY_STRING);
    setAnswerState(AnswerState.Asking);
    setDrillScore(ZERO_SCORE);
    setActiveDrillMode(drillMode);

    setTimeout(() => { answerInputRef.current?.focus(); }, FOCUS_DELAY_START_DRILL_MS);
  }, []);

  useEffect(() => {
    if (activeDrillMode !== DrillMode.Learn) {
      answerInputRef.current?.focus();
    }
  }, [activeDrillMode]);

  const checkAnswer = useCallback(() => {
    if (!currentQuizItem || answerState !== AnswerState.Asking) return;

    const isCorrect = answerInput.trim().toLowerCase() === currentQuizItem.answer.toLowerCase();
    setAnswerState(isCorrect ? AnswerState.Correct : AnswerState.Wrong);
    setDrillScore((previousScore) => {
      return {
        correctCount: previousScore.correctCount + (isCorrect ? 1 : 0),
        totalCount: previousScore.totalCount + 1,
      };
    });
  }, [currentQuizItem, answerInput, answerState]);

  const advanceToNext = useCallback(() => {
    if (currentItemIndex + 1 >= quizItems.length) {
      startDrill(activeDrillMode);
      return;
    }

    setCurrentItemIndex((previousIndex) => { return previousIndex + 1; });
    setAnswerInput(EMPTY_STRING);
    setAnswerState(AnswerState.Asking);
    setTimeout(() => { answerInputRef.current?.focus(); }, FOCUS_DELAY_NEXT_ITEM_MS);
  }, [currentItemIndex, quizItems.length, activeDrillMode, startDrill]);

  const handleKeyDown = useCallback((keyboardEvent: React.KeyboardEvent) => {
    if (keyboardEvent.key !== ENTER_KEY) return;
    if (answerState === AnswerState.Asking) {
      checkAnswer();
    } else {
      advanceToNext();
    }
  }, [answerState, checkAnswer, advanceToNext]);

  const accuracyPct = drillScore.totalCount > 0
    ? Math.round((drillScore.correctCount / drillScore.totalCount) * PERCENTAGE_MULTIPLIER)
    : 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>{t.phonetics.title}</div>
        <div className={styles.subtitle}>{t.phonetics.subtitle}</div>
      </div>

      <div className={styles.modeRow}>
        {DRILL_MODE_OPTIONS.map((modeOption) => (
          <button
            key={modeOption.id}
            className={`${styles.modeBtn} ${activeDrillMode === modeOption.id ? styles.modeActive : ''}`}
            onClick={() => { startDrill(modeOption.id); }}
          >
            {modeOption.label}
          </button>
        ))}
      </div>

      {activeDrillMode === DrillMode.Learn && (
        <div className={styles.tableSection}>
          <div className={styles.alphaGrid}>
            {PHONETIC_ALPHABET.map((phoneticItem) => (
              <div key={phoneticItem.letter} className={styles.alphaCard}>
                <div className={styles.alphaLetter}>{phoneticItem.letter}</div>
                <div className={styles.alphaPhonetic}>{phoneticItem.phonetic}</div>
                <div className={styles.alphaExample}>{phoneticItem.example}</div>
              </div>
            ))}
          </div>

          <div className={styles.numSection}>
            <div className={styles.numTitle}>{t.phonetics.numbersTitle}</div>
            <div className={styles.numGrid}>
              {AVIATION_NUMBERS.map((numberItem) => (
                <div key={numberItem.digit} className={styles.numCard}>
                  <div className={styles.numDigit}>{numberItem.digit}</div>
                  <div className={styles.numSpoken}>{numberItem.spoken}</div>
                </div>
              ))}
            </div>
            <div className={styles.numNote}>{t.phonetics.numbersNote}</div>
          </div>
        </div>
      )}

      {activeDrillMode !== DrillMode.Learn && currentQuizItem && (
        <div className={styles.drill}>
          <div className={styles.scoreRow}>
            <span className={styles.pill}>
              {t.phonetics.score.correct} <strong>{drillScore.correctCount}</strong>
            </span>
            <span className={styles.pill}>
              {t.phonetics.score.total} <strong>{drillScore.totalCount}</strong>
            </span>
            <span className={styles.pill}>
              {t.phonetics.score.accuracy} <strong>{accuracyPct}%</strong>
            </span>
            <span className={styles.progress}>
              {currentItemIndex + 1} / {quizItems.length}
            </span>
          </div>

          <div className={styles.questionCard}>
            <div className={styles.qLabel}>
              {DRILL_QUESTION_LABELS[activeDrillMode]}
            </div>
            <div className={styles.qValue}>{currentQuizItem.question}</div>
          </div>

          {answerState === AnswerState.Asking && (
            <div className={styles.answerRow}>
              <input
                ref={answerInputRef}
                value={answerInput}
                onChange={(inputEvent) => { setAnswerInput(inputEvent.target.value); }}
                onKeyDown={handleKeyDown}
                placeholder={t.phonetics.drill.placeholder}
                className={styles.answerInput}
                autoFocus
              />
              <button className={styles.checkBtn} onClick={checkAnswer}>
                {t.phonetics.drill.checkBtn}
              </button>
            </div>
          )}

          {answerState === AnswerState.Correct && (
            <div className={styles.resultCorrect}>
              <span className={styles.rIcon}>✓</span>
              <span>
                {t.phonetics.drill.correct} — <strong>{currentQuizItem.answer}</strong>
              </span>
              <button className={styles.nextBtn} onClick={advanceToNext}>
                {t.phonetics.drill.nextBtn}
              </button>
            </div>
          )}

          {answerState === AnswerState.Wrong && (
            <div className={styles.resultWrong}>
              <span className={styles.rIcon}>✗</span>
              <div>
                <div>
                  {t.phonetics.drill.answer} <strong>{currentQuizItem.answer}</strong>
                </div>
                <div className={styles.hint}>{currentQuizItem.hint}</div>
              </div>
              <button className={styles.nextBtn} onClick={advanceToNext}>
                {t.phonetics.drill.nextBtn}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
