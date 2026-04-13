/**
 * © 2025 Abhishek Sinha. All rights reserved.
 * ATC Pilot Trainer — For training purposes only.
 * Unauthorised copying or reproduction without prior written permission is prohibited.
 */
import React, { useCallback, useState } from 'react';
import { INDIAN_AIRPORTS, searchAirports } from '../data/indianAirports';
import { t } from '../locales';
import { fetchMetar } from '../services/aviationWeather';
import { searchCachedAirports, saveToMetarCache } from '../services/metarCache';
import { MetarData } from '../types';
import styles from './MetarPage.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_ICAO_LENGTH = 3;
const MIN_SEARCH_QUERY_LENGTH = 2;
const EMPTY_STRING = '';

const FLIGHT_CATEGORY_COLORS: Record<string, string> = {
  VFR: '#39ff14',
  MVFR: '#58a6ff',
  IFR: '#f0a030',
  LIFR: '#f85149',
  UNKNOWN: '#888780',
};

interface QuickAirportEntry {
  icao: string;
  label: string;
}

const QUICK_AIRPORTS: QuickAirportEntry[] = [
  { icao: 'VAPO', label: 'Pune' },
  { icao: 'VABB', label: 'Mumbai' },
  { icao: 'VIDP', label: 'Delhi' },
  { icao: 'VOBG', label: 'Bangalore' },
  { icao: 'VOMM', label: 'Chennai' },
  { icao: 'VOHY', label: 'Hyderabad' },
];

interface SuggestionEntry {
  icao: string;
  name: string;
}

const ERROR_SIGNAL_PARSE = ['JSON', 'Unexpected', 'parse'] as const;
const ERROR_SIGNAL_NOTFOUND = ['404', 'not found'] as const;
const ERROR_SIGNAL_NETWORK = ['network', 'fetch', 'Failed to fetch'] as const;
const ERROR_SIGNAL_NOMETAR = ['No METAR', 'length === 0'] as const;

const KNOWN_ICAO_SET = new Set(INDIAN_AIRPORTS.map((airport) => { return airport.icao; }));

// ── Helpers ───────────────────────────────────────────────────────────────────

const humaniseError = (rawError: unknown): string => {
  const errorMessage = rawError instanceof Error ? rawError.message : String(rawError);

  if (ERROR_SIGNAL_PARSE.some((signal) => { return errorMessage.includes(signal); })) {
    return t.metar.errors.parseError;
  }
  if (ERROR_SIGNAL_NOTFOUND.some((signal) => { return errorMessage.includes(signal); })) {
    return t.metar.errors.notFound;
  }
  if (ERROR_SIGNAL_NETWORK.some((signal) => { return errorMessage.includes(signal); })) {
    return t.metar.errors.networkError;
  }
  if (ERROR_SIGNAL_NOMETAR.some((signal) => { return errorMessage.includes(signal); })) {
    return t.metar.errors.noMetar;
  }

  return t.metar.errors.generic;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const MetarPage = () => {
  const [searchQuery, setSearchQuery] = useState(EMPTY_STRING);
  const [suggestions, setSuggestions] = useState<SuggestionEntry[]>([]);
  const [metarData, setMetarData] = useState<MetarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMetarData = useCallback(async (
    icaoCode: string,
    displayName?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setMetarData(null);
    setSuggestions([]);

    try {
      const fetchedData = await fetchMetar(icaoCode);
      if (displayName) { fetchedData.name = displayName; }

      if (!KNOWN_ICAO_SET.has(icaoCode)) {
        saveToMetarCache(icaoCode, displayName ?? fetchedData.station ?? icaoCode);
      }

      setMetarData(fetchedData);
    } catch (fetchError) {
      setErrorMessage(humaniseError(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchInput = (inputValue: string) => {
    setSearchQuery(inputValue);

    if (inputValue.length >= MIN_SEARCH_QUERY_LENGTH) {
      const staticResults = searchAirports(inputValue).map((airport) => {
        return { icao: airport.icao, name: airport.city };
      });
      const cachedResults = searchCachedAirports(inputValue).map((airport) => {
        return { icao: airport.icao, name: airport.name };
      });

      const seenIcaoCodes = new Set(staticResults.map((result) => { return result.icao; }));
      const mergedResults = [
        ...staticResults,
        ...cachedResults.filter((result) => { return !seenIcaoCodes.has(result.icao); }),
      ];

      setSuggestions(mergedResults);
    } else {
      setSuggestions([]);
    }
  };

  const handleFormSubmit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    const upperIcao = searchQuery.trim().toUpperCase();
    if (upperIcao.length >= MIN_ICAO_LENGTH) {
      fetchMetarData(upperIcao);
    }
  };

  const handleSuggestionSelect = (suggestion: SuggestionEntry) => {
    setSearchQuery(suggestion.icao);
    fetchMetarData(suggestion.icao, suggestion.name);
    setSuggestions([]);
  };

  const handleQuickAirport = (airport: QuickAirportEntry) => {
    setSearchQuery(airport.icao);
    fetchMetarData(airport.icao, airport.label);
  };

  const metarFieldRows: [keyof typeof t.metar.fields, string][] = metarData
    ? [
      ['wind', metarData.wind],
      ['vis', metarData.visibility],
      ['cloud', metarData.clouds],
      ['tempDew', `${metarData.temp} / ${metarData.dewpoint}`],
      ['qnh', metarData.altimeter],
      ['remarks', metarData.remarks],
    ]
    : [];

  const interpretationRows: [keyof typeof t.metar.interpFields, string][] = metarData
    ? [
      ['wind', metarData.interpretation.windSummary],
      ['vis', metarData.interpretation.visibilitySummary],
      ['cloud', metarData.interpretation.cloudSummary],
      ['tempDew', metarData.interpretation.tempSummary],
      ['altimeter', metarData.interpretation.altimeterSummary],
    ]
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>{t.metar.title}</div>
        <div className={styles.subtitle}>{t.metar.subtitle}</div>
      </div>

      <div className={styles.quickRow}>
        {QUICK_AIRPORTS.map((airport) => (
          <button
            key={airport.icao}
            className={styles.quickBtn}
            onClick={() => { handleQuickAirport(airport); }}
          >
            {airport.icao}
            <span className={styles.quickCity}>{airport.label}</span>
          </button>
        ))}
      </div>

      <form className={styles.searchForm} onSubmit={handleFormSubmit}>
        <div className={styles.inputWrap}>
          <input
            value={searchQuery}
            onChange={(inputEvent) => { handleSearchInput(inputEvent.target.value); }}
            placeholder={t.metar.searchPlaceholder}
            className={styles.searchInput}
          />
          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.icao}
                  type="button"
                  className={styles.suggItem}
                  onClick={() => { handleSuggestionSelect(suggestion); }}
                >
                  <span className={styles.suggIcao}>{suggestion.icao}</span>
                  <span className={styles.suggName}>{suggestion.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className={styles.fetchBtn}
          disabled={isLoading || searchQuery.trim().length < MIN_ICAO_LENGTH}
        >
          {isLoading ? t.metar.fetching : t.metar.fetchBtn}
        </button>
      </form>

      {errorMessage && (
        <div className={styles.error}>
          <div className={styles.errorTitle}>{t.metar.errors.unavailableTitle}</div>
          <div className={styles.errorMsg}>{errorMessage}</div>
        </div>
      )}

      {isLoading && (
        <div className={styles.loading}>
          <span className={styles.blink}>▋</span> {t.metar.loading}
        </div>
      )}

      {metarData && (
        <div className={styles.content}>
          <div className={styles.rawPanel}>
            <div className={styles.panelLabel}>{t.metar.sections.rawMetar}</div>
            <div className={styles.rawText}>{metarData.raw}</div>
            <div className={styles.rawMeta}>
              {metarData.station}
              {metarData.name && metarData.name !== metarData.station
                ? ` — ${metarData.name}`
                : EMPTY_STRING
              } · {metarData.time}
            </div>
          </div>

          <div className={styles.catRow}>
            <span
              className={styles.catDot}
              style={{ background: FLIGHT_CATEGORY_COLORS[metarData.flightCategory] }}
            />
            <span
              className={styles.catText}
              style={{ color: FLIGHT_CATEGORY_COLORS[metarData.flightCategory] }}
            >
              {metarData.flightCategory}
            </span>
            <span className={styles.catDesc}>
              {t.metar.catDesc[metarData.flightCategory as keyof typeof t.metar.catDesc] ?? EMPTY_STRING}
            </span>
          </div>

          <div className={styles.fieldGrid}>
            {metarFieldRows.map(([fieldKey, fieldValue]) => (
              <div key={fieldKey} className={styles.field}>
                <div className={styles.fieldLabel}>{t.metar.fields[fieldKey]}</div>
                <div className={styles.fieldValue}>{fieldValue}</div>
              </div>
            ))}
          </div>

          <div className={styles.interpHeader}>
            <div className={styles.interpLabel}>{t.metar.sections.interpretation}</div>
            <div className={styles.interpSource}>{t.metar.interpretationSource}</div>
          </div>

          <div className={styles.interpGrid}>
            {interpretationRows.map(([fieldKey, fieldText]) => (
              <div key={fieldKey} className={styles.interpCard}>
                <div className={styles.interpCardLabel}>{t.metar.interpFields[fieldKey]}</div>
                <div className={styles.interpCardText}>{fieldText}</div>
              </div>
            ))}
          </div>

          <div
            className={styles.advice}
            style={{ borderLeftColor: FLIGHT_CATEGORY_COLORS[metarData.flightCategory] }}
          >
            <div className={styles.adviceLabel}>{t.metar.sections.advice}</div>
            <div className={styles.adviceText}>{metarData.interpretation.pilotAdvice}</div>
          </div>
        </div>
      )}

      <div className={styles.apiNote}>{t.metar.apiNote}</div>
    </div>
  );
};
