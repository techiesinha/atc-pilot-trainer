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

const METAR_CACHE_STORAGE_KEY = 'atcMetarCache';
const MIN_SEARCH_QUERY_LENGTH = 2;

export interface CachedAirport {
  icao: string;
  name: string;
  savedAt: string;
}

const getMetarCacheRaw = (): Record<string, CachedAirport> => {
  try {
    const rawCache = localStorage.getItem(METAR_CACHE_STORAGE_KEY);
    return rawCache
      ? (JSON.parse(rawCache) as Record<string, CachedAirport>)
      : {};
  } catch {
    return {};
  }
};

export const saveToMetarCache = (icao: string, airportName: string): void => {
  try {
    const existingCache = getMetarCacheRaw();
    existingCache[icao] = {
      icao,
      name: airportName,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(METAR_CACHE_STORAGE_KEY, JSON.stringify(existingCache));
  } catch {
    /* storage quota or parse error — ignore silently */
  }
};

export const getCachedAirports = (): CachedAirport[] => {
  try {
    return Object.values(getMetarCacheRaw());
  } catch {
    return [];
  }
};

export const searchCachedAirports = (searchQuery: string): CachedAirport[] => {
  if (!searchQuery || searchQuery.length < MIN_SEARCH_QUERY_LENGTH) return [];

  const normalizedQuery = searchQuery.toLowerCase();

  return getCachedAirports().filter(
    (airport) =>
      airport.icao.toLowerCase().includes(normalizedQuery) ||
      airport.name.toLowerCase().includes(normalizedQuery)
  );
};
