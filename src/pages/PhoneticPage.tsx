/**
 * © 2025-2026 Abhishek Sinha. All rights reserved.
 * ATC Pilot Trainer — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */
import React, { useState, useCallback, useRef } from 'react';
import { PHONETIC_ALPHABET, AVIATION_NUMBERS } from '../data/phonetics';
import styles from './PhoneticPage.module.css';

type DrillMode = 'learn' | 'l2p' | 'p2l' | 'numbers';

interface QuizItem { question: string; answer: string; hint: string; }

function buildQuiz(mode: DrillMode): QuizItem[] {
  if (mode === 'numbers') {
    return AVIATION_NUMBERS.map((n) => ({ question: n.digit, answer: n.spoken.toLowerCase(), hint: `"${n.digit}" is spoken "${n.spoken}" in aviation to prevent confusion.` }));
  }
  const shuffled = [...PHONETIC_ALPHABET].sort(() => Math.random() - 0.5);
  if (mode === 'l2p') return shuffled.map((p) => ({ question: p.letter, answer: p.phonetic.toLowerCase(), hint: `"${p.letter}" = "${p.phonetic}". Example: "${p.example}"` }));
  return shuffled.map((p) => ({ question: p.phonetic, answer: p.letter.toLowerCase(), hint: `"${p.phonetic}" = the letter "${p.letter}"` }));
}

export function PhoneticPage() {
  const [mode, setMode] = useState<DrillMode>('learn');
  const [items, setItems] = useState<QuizItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState<'asking' | 'correct' | 'wrong'>('asking');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const startDrill = useCallback((m: DrillMode) => {
    if (m === 'learn') { setMode('learn'); return; }
    setItems(buildQuiz(m)); setIdx(0); setInput(''); setChecked('asking');
    setScore({ correct: 0, total: 0 }); setMode(m);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const current = items[idx];

  const check = useCallback(() => {
    if (!current || checked !== 'asking') return;
    const ok = input.trim().toLowerCase() === current.answer.toLowerCase();
    setChecked(ok ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  }, [current, input, checked]);

  const next = useCallback(() => {
    if (idx + 1 >= items.length) { startDrill(mode); return; }
    setIdx((i) => i + 1); setInput(''); setChecked('asking');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [idx, items.length, mode, startDrill]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { if (checked === 'asking') check(); else next(); }
  }, [checked, check, next]);

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>PHONETIC ALPHABET</div>
        <div className={styles.subtitle}>ICAO STANDARD — NATO PHONETIC ALPHABET</div>
      </div>

      <div className={styles.modeRow}>
        {([
          { id: 'learn', label: 'Study Table' },
          { id: 'l2p', label: 'Letter → Phonetic' },
          { id: 'p2l', label: 'Phonetic → Letter' },
          { id: 'numbers', label: 'Aviation Numbers' },
        ] as { id: DrillMode; label: string }[]).map((m) => (
          <button key={m.id} className={`${styles.modeBtn} ${mode === m.id ? styles.modeActive : ''}`} onClick={() => startDrill(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'learn' && (
        <div className={styles.tableSection}>
          <div className={styles.alphaGrid}>
            {PHONETIC_ALPHABET.map((p) => (
              <div key={p.letter} className={styles.alphaCard}>
                <div className={styles.alphaLetter}>{p.letter}</div>
                <div className={styles.alphaPhonetic}>{p.phonetic}</div>
                <div className={styles.alphaExample}>{p.example}</div>
              </div>
            ))}
          </div>
          <div className={styles.numSection}>
            <div className={styles.numTitle}>AVIATION NUMBERS</div>
            <div className={styles.numGrid}>
              {AVIATION_NUMBERS.map((n) => (
                <div key={n.digit} className={styles.numCard}>
                  <div className={styles.numDigit}>{n.digit}</div>
                  <div className={styles.numSpoken}>{n.spoken}</div>
                </div>
              ))}
            </div>
            <div className={styles.numNote}>
              Key differences from everyday English: 3="Tree", 4="Fower", 5="Fife", 8="Ait", 9="Niner". These prevent confusion over noisy radio channels.
            </div>
          </div>
        </div>
      )}

      {mode !== 'learn' && current && (
        <div className={styles.drill}>
          <div className={styles.scoreRow}>
            <span className={styles.pill}>CORRECT <strong>{score.correct}</strong></span>
            <span className={styles.pill}>TOTAL <strong>{score.total}</strong></span>
            <span className={styles.pill}>ACCURACY <strong>{pct}%</strong></span>
            <span className={styles.progress}>{idx + 1} / {items.length}</span>
          </div>

          <div className={styles.questionCard}>
            <div className={styles.qLabel}>
              {mode === 'l2p' ? 'PHONETIC WORD FOR:' : mode === 'p2l' ? 'LETTER FOR THIS WORD:' : 'AVIATION SPOKEN FORM:'}
            </div>
            <div className={styles.qValue}>{current.question}</div>
          </div>

          {checked === 'asking' && (
            <div className={styles.answerRow}>
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Type your answer..." className={styles.answerInput} autoFocus />
              <button className={styles.checkBtn} onClick={check}>CHECK</button>
            </div>
          )}

          {checked === 'correct' && (
            <div className={styles.resultCorrect}>
              <span className={styles.rIcon}>✓</span>
              <span>Correct — <strong>{current.answer}</strong></span>
              <button className={styles.nextBtn} onClick={next}>NEXT →</button>
            </div>
          )}

          {checked === 'wrong' && (
            <div className={styles.resultWrong}>
              <span className={styles.rIcon}>✗</span>
              <div>
                <div>Answer: <strong>{current.answer}</strong></div>
                <div className={styles.hint}>{current.hint}</div>
              </div>
              <button className={styles.nextBtn} onClick={next}>NEXT →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
