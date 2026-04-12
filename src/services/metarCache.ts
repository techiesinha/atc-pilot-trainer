/**
 * METAR Cache
 *
 * When a successful METAR fetch returns for an ICAO code that is not in the
 * static INDIAN_AIRPORTS list, we save it to localStorage so it appears in
 * autocomplete suggestions on future searches.
 *
 * This means a pilot who regularly flies to a small airfield will see it
 * suggested automatically after the first successful lookup.
 */

const CACHE_KEY = 'atcMetarCache';

export interface CachedAirport {
  icao:    string;
  name:    string;    // station name or city returned by the API
  savedAt: string;    // ISO timestamp
}

export function saveToMetarCache(icao: string, name: string): void {
  try {
    const existing = getMetarCacheRaw();
    existing[icao] = { icao, name, savedAt: new Date().toISOString() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(existing));
  } catch { /* quota or parse error — ignore silently */ }
}

export function getCachedAirports(): CachedAirport[] {
  try {
    return Object.values(getMetarCacheRaw());
  } catch { return []; }
}

export function searchCachedAirports(query: string): CachedAirport[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return getCachedAirports().filter(
    (a) => a.icao.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
  );
}

function getMetarCacheRaw(): Record<string, CachedAirport> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CachedAirport>) : {};
  } catch { return {}; }
}
