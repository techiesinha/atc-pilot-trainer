/**
 * © 2025 Abhishek Sinha. All rights reserved.
 * ATC Pilot Trainer — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */
import React, { useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SessionRecord } from '../types';
import { CATEGORIES } from '../data/scenarios';
import { t } from '../locales';
import styles from './ProgressPage.module.css';

export function ProgressPage() {
  const [sessions, setSessions] = useLocalStorage<SessionRecord[]>('atcSessions', []);

  const stats = useMemo(() => {
    if (!sessions.length) return null;
    const total  = sessions.length;
    const passed = sessions.filter((s) => s.passed).length;
    const avg    = Math.round(sessions.reduce((a, s) => a + s.score, 0) / total);

    const byCategory = CATEGORIES.map((cat) => {
      const cs = sessions.filter((s) => s.category === cat.id);
      const cp = cs.filter((s) => s.passed).length;
      return { ...cat, total: cs.length, passed: cp, pct: cs.length ? Math.round((cp/cs.length)*100) : 0 };
    }).filter((c) => c.total > 0);

    const map = sessions.reduce<Record<string, { label:string; total:number; passed:number }>>((acc, s) => {
      if (!acc[s.scenarioId]) acc[s.scenarioId] = { label:s.scenarioLabel, total:0, passed:0 };
      acc[s.scenarioId].total++;
      if (s.passed) acc[s.scenarioId].passed++;
      return acc;
    }, {});

    const weak = Object.entries(map)
      .map(([id,v]) => ({ id, ...v, pct: Math.round((v.passed/v.total)*100) }))
      .filter((s) => s.total >= 2)
      .sort((a,b) => a.pct - b.pct)
      .slice(0, 4);

    return { total, passed, avg, passRate: Math.round((passed/total)*100), byCategory, weak };
  }, [sessions]);

  const clear = () => {
    if (window.confirm(t.progress.clearConfirm)) setSessions([]);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>{t.progress.title}</div>
        <div className={styles.subtitle}>{t.progress.subtitle}</div>
      </div>

      {!sessions.length ? (
        <div className={styles.empty}>{t.progress.empty}</div>
      ) : (
        <>
          <div className={styles.statGrid}>
            {([
              [t.progress.stats.totalAttempts, String(stats?.total),            'var(--green-text)'],
              [t.progress.stats.passRate,      `${stats?.passRate}%`,           'var(--green-bright)'],
              [t.progress.stats.avgScore,      String(stats?.avg),              'var(--green-text)'],
              [t.progress.stats.passed,        String(stats?.passed),           'var(--green-bright)'],
            ] as [string,string,string][]).map(([label,value,color]) => (
              <div key={label} className={styles.statCard}>
                <div className={styles.statValue} style={{ color }}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>

          <div className={styles.sectionTitle}>{t.progress.sections.byCategory}</div>
          <div className={styles.catGrid}>
            {stats?.byCategory.map((cat) => (
              <div key={cat.id} className={styles.catCard}>
                <div className={styles.catTop}>
                  <span className={styles.catName} style={{ color:cat.color }}>{cat.label}</span>
                  <span className={styles.catPct}  style={{ color:cat.color }}>{cat.pct}%</span>
                </div>
                <div className={styles.bar}><div className={styles.barFill} style={{ width:`${cat.pct}%`, background:cat.color }} /></div>
                <div className={styles.catMeta}>{cat.passed} / {cat.total} {t.progress.session.passed.toLowerCase()}</div>
              </div>
            ))}
          </div>

          {stats && stats.weak.length > 0 && (
            <>
              <div className={styles.sectionTitle}>{t.progress.sections.needsPractice}</div>
              <div className={styles.weakList}>
                {stats.weak.map((s) => (
                  <div key={s.id} className={styles.weakItem}>
                    <div>
                      <div className={styles.weakLabel}>{s.label}</div>
                      <div className={styles.weakMeta}>{s.total} attempts · {s.pct}% pass rate</div>
                    </div>
                    <div className={styles.weakPct} style={{ color:s.pct<50?'var(--red)':'var(--amber)' }}>{s.pct}%</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={styles.sectionTitle}>{t.progress.sections.recentSessions}</div>
          <div className={styles.sessionList}>
            {sessions.slice(0,40).map((s) => (
              <div key={s.id} className={styles.sessionRow}>
                <div className={`${styles.dot} ${s.passed?styles.dotPass:styles.dotFail}`} />
                <div className={styles.sessionInfo}>
                  <span className={styles.sessionLabel}>{s.scenarioLabel}</span>
                  <span className={styles.sessionDate}>{new Date(s.date).toLocaleString()}</span>
                </div>
                <span className={styles.sessionAero}>{s.aerodromeIcao}</span>
                <div className={styles.sessionScore} style={{ color:s.passed?'var(--green-bright)':'var(--red)' }}>{s.score}%</div>
              </div>
            ))}
          </div>

          <button className={styles.clearBtn} onClick={clear}>{t.progress.clearBtn}</button>
        </>
      )}
    </div>
  );
}
