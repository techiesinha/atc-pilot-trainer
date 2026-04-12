/**
 * © 2025 Abhishek Sinha. All rights reserved.
 * ATC Pilot Trainer — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */
import React, { useState, useCallback } from 'react';
import { fetchMetar } from '../services/aviationWeather';
import { MetarData } from '../types';
import { searchAirports, INDIAN_AIRPORTS } from '../data/indianAirports';
import { saveToMetarCache, searchCachedAirports } from '../services/metarCache';
import { t } from '../locales';
import styles from './MetarPage.module.css';

const CAT_COLORS: Record<string, string> = {
  VFR:'#39ff14', MVFR:'#58a6ff', IFR:'#f0a030', LIFR:'#f85149', UNKNOWN:'#888780',
};

const QUICK_AIRPORTS = [
  { icao:'VAPO', label:'Pune'      },
  { icao:'VABB', label:'Mumbai'    },
  { icao:'VIDP', label:'Delhi'     },
  { icao:'VOBG', label:'Bangalore' },
  { icao:'VOMM', label:'Chennai'   },
  { icao:'VOHY', label:'Hyderabad' },
];

/** Friendly error message for raw API / JSON errors */
function humaniseError(raw: unknown): string {
  const msg = raw instanceof Error ? raw.message : String(raw);
  if (msg.includes('JSON') || msg.includes('Unexpected') || msg.includes('parse')) {
    return 'No weather data available for this station. The station may not report METARs, the ICAO code may be incorrect, or the weather service may be temporarily unavailable. Try a nearby major airport.';
  }
  if (msg.includes('404') || msg.includes('not found')) {
    return 'Station not found. Verify the ICAO code and try again.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
    return 'Network error — check your internet connection and try again.';
  }
  if (msg.includes('No METAR') || msg.includes('length === 0')) {
    return 'No METAR available for this station. It may not have an active weather reporting system.';
  }
  return t.metar.errors.generic;
}

const KNOWN_ICAOS = new Set(INDIAN_AIRPORTS.map((a) => a.icao));

export function MetarPage() {
  const [query, setQuery]             = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ icao: string; name: string }>>([]);
  const [metar, setMetar]             = useState<MetarData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const doFetch = useCallback(async (icao: string, displayName?: string) => {
    setLoading(true); setError(null); setMetar(null); setSuggestions([]);
    try {
      const data = await fetchMetar(icao);
      if (displayName) data.name = displayName;

      // If this ICAO is not in our static list, cache it for future suggestions
      if (!KNOWN_ICAOS.has(icao)) {
        saveToMetarCache(icao, displayName ?? data.station ?? icao);
      }

      setMetar(data);
    } catch (e) {
      setError(humaniseError(e));
    } finally { setLoading(false); }
  }, []);

  const handleQuery = (val: string) => {
    setQuery(val);
    if (val.length >= 2) {
      const staticResults  = searchAirports(val).map((a) => ({ icao: a.icao, name: a.city }));
      const cachedResults  = searchCachedAirports(val).map((a) => ({ icao: a.icao, name: a.name }));
      // Merge, deduplicate by ICAO, static list first
      const seen = new Set(staticResults.map((r) => r.icao));
      const merged = [...staticResults, ...cachedResults.filter((r) => !seen.has(r.icao))];
      setSuggestions(merged);
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const upper = query.trim().toUpperCase();
    if (upper.length >= 3) doFetch(upper);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>{t.metar.title}</div>
        <div className={styles.subtitle}>{t.metar.subtitle}</div>
      </div>

      <div className={styles.quickRow}>
        {QUICK_AIRPORTS.map((ap) => (
          <button key={ap.icao} className={styles.quickBtn}
            onClick={() => { setQuery(ap.icao); doFetch(ap.icao, ap.label); }}>
            {ap.icao}<span className={styles.quickCity}>{ap.label}</span>
          </button>
        ))}
      </div>

      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <div className={styles.inputWrap}>
          <input value={query} onChange={(e) => handleQuery(e.target.value)}
            placeholder={t.metar.searchPlaceholder} className={styles.searchInput} />
          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((s) => (
                <button key={s.icao} type="button" className={styles.suggItem}
                  onClick={() => { setQuery(s.icao); doFetch(s.icao, s.name); setSuggestions([]); }}>
                  <span className={styles.suggIcao}>{s.icao}</span>
                  <span className={styles.suggName}>{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className={styles.fetchBtn} disabled={loading || query.trim().length < 3}>
          {loading ? t.metar.fetching : t.metar.fetchBtn}
        </button>
      </form>

      {error && (
        <div className={styles.error}>
          <div className={styles.errorTitle}>METAR UNAVAILABLE</div>
          <div className={styles.errorMsg}>{error}</div>
        </div>
      )}
      {loading && <div className={styles.loading}><span className={styles.blink}>▋</span> {t.metar.loading}</div>}

      {metar && (
        <div className={styles.content}>
          <div className={styles.rawPanel}>
            <div className={styles.panelLabel}>{t.metar.sections.rawMetar}</div>
            <div className={styles.rawText}>{metar.raw}</div>
            <div className={styles.rawMeta}>
              {metar.station}{metar.name && metar.name !== metar.station ? ` — ${metar.name}` : ''} · {metar.time}
            </div>
          </div>

          <div className={styles.catRow}>
            <span className={styles.catDot} style={{ background: CAT_COLORS[metar.flightCategory] }} />
            <span className={styles.catText} style={{ color: CAT_COLORS[metar.flightCategory] }}>{metar.flightCategory}</span>
            <span className={styles.catDesc}>{t.metar.catDesc[metar.flightCategory as keyof typeof t.metar.catDesc] ?? ''}</span>
          </div>

          <div className={styles.fieldGrid}>
            {([
              ['wind', metar.wind], ['vis', metar.visibility], ['cloud', metar.clouds],
              ['tempDew', `${metar.temp} / ${metar.dewpoint}`], ['qnh', metar.altimeter], ['remarks', metar.remarks],
            ] as [keyof typeof t.metar.fields, string][]).map(([key, value]) => (
              <div key={key} className={styles.field}>
                <div className={styles.fieldLabel}>{t.metar.fields[key]}</div>
                <div className={styles.fieldValue}>{value}</div>
              </div>
            ))}
          </div>

          {/* Interpretation section */}
          <div className={styles.interpHeader}>
            <div className={styles.interpLabel}>{t.metar.sections.interpretation}</div>
            <div className={styles.interpSource}>{t.metar.interpretationSource}</div>
          </div>
          <div className={styles.interpGrid}>
            {([
              ['wind', metar.interpretation.windSummary],
              ['vis', metar.interpretation.visibilitySummary],
              ['cloud', metar.interpretation.cloudSummary],
              ['tempDew', metar.interpretation.tempSummary],
              ['altimeter', metar.interpretation.altimeterSummary],
            ] as [keyof typeof t.metar.interpFields, string][]).map(([key, text]) => (
              <div key={key} className={styles.interpCard}>
                <div className={styles.interpCardLabel}>{t.metar.interpFields[key]}</div>
                <div className={styles.interpCardText}>{text}</div>
              </div>
            ))}
          </div>

          <div className={styles.advice} style={{ borderLeftColor: CAT_COLORS[metar.flightCategory] }}>
            <div className={styles.adviceLabel}>{t.metar.sections.advice}</div>
            <div className={styles.adviceText}>{metar.interpretation.pilotAdvice}</div>
          </div>
        </div>
      )}

      <div className={styles.apiNote}>{t.metar.apiNote}</div>
    </div>
  );
}
