import { MetarData, MetarInterpretation } from '../types';
import { config, log } from '../config';

/**
 * METAR Service — two sources, automatic fallback
 *
 * Source priority is set by config.metar.primary:
 *
 *   'checkwx'         → CheckWX API (config.metar.checkwx)
 *                        Structured JSON, native CORS, 500 req/month free tier
 *                        Falls back to aviationweather if request fails
 *
 *   'aviationweather' → Aviation Weather Center (config.metar.aviationWeather)
 *                        NOAA/NWS data, free, no key needed
 *                        Requires config.metar.corsProxy because of CORS policy
 *
 * corsproxy.io format: https://corsproxy.io/?{encoded_target_url}
 */

interface RawAWC {
  rawOb?: string;
  stationId?: string;
  reportTime?: string;
  temp?: number;
  dewpoint?: number;
  wdir?: number | string;
  wspd?: number;
  visib?: number | string;
  altim?: number;
  clouds?: Array<{ cover: string; base?: number }>;
  flightCategory?: string;
  remarks?: string;
}

export async function fetchMetar(icao: string): Promise<MetarData> {
  const code = icao.trim().toUpperCase();

  // Try primary source first
  if (config.metar.primary === 'checkwx' && config.metar.checkwx.key) {
    try {
      return await fetchCheckWX(code);
    } catch (e) {
      log.warn('CheckWX failed, falling back to AWC via proxy:', e);
    }
  }

  // Aviation Weather Center via CORS proxy
  return await fetchAWCWithProxy(code);
}

async function fetchAWCWithProxy(icao: string): Promise<MetarData> {
  const target = `${config.metar.aviationWeather.baseUrl}/metar?ids=${icao}&format=json&hours=2`;
  const proxied = `${config.metar.corsProxy}${encodeURIComponent(target)}`;

  log.info(`Fetching METAR via corsproxy: ${icao}`);

  const res = await fetch(proxied, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`AWC via proxy returned HTTP ${res.status}`);

  const data: RawAWC[] = await res.json();
  if (!data || data.length === 0) throw new Error(`No METAR found for ${icao}`);

  return parseAWC(data[0], icao);
}

async function fetchCheckWX(icao: string): Promise<MetarData> {
  const url = `${config.metar.checkwx.baseUrl}/metar/${icao}/decoded`;

  log.info(`Fetching METAR via CheckWX: ${icao}`);

  const res = await fetch(url, {
    headers: { 'X-API-Key': config.metar.checkwx.key },
  });
  if (!res.ok) throw new Error(`CheckWX returned HTTP ${res.status}`);

  const json = await res.json();
  const d = json?.data?.[0];
  if (!d) throw new Error(`No CheckWX data for ${icao}`);

  // Map CheckWX decoded response → internal RawAWC shape
  const raw: RawAWC = {
    rawOb: d.raw_text,
    stationId: d.icao,
    reportTime: d.observed,
    temp: d.temperature?.celsius,
    dewpoint: d.dewpoint?.celsius,
    wdir: d.wind?.degrees ?? 'VRB',
    wspd: d.wind?.speed_kts,
    visib: d.visibility?.miles_float,
    altim: d.barometer?.hpa,
    clouds: d.clouds?.map((c: { code: string; base_feet_agl?: number }) => ({
      cover: c.code,
      base: c.base_feet_agl ? Math.round(c.base_feet_agl / 100) : undefined,
    })),
    flightCategory: d.flight_category,
    remarks: d.remarks,
  };

  return parseAWC(raw, icao);
}

function parseAWC(raw: RawAWC, icao: string): MetarData {
  const wind = formatWind(raw.wdir, raw.wspd);
  const visibility = formatVisibility(raw.visib);
  const clouds = formatClouds(raw.clouds);
  const temp = raw.temp !== undefined ? `${Math.round(raw.temp)}°C` : 'Not reported';
  const dewpoint = raw.dewpoint !== undefined ? `${Math.round(raw.dewpoint)}°C` : 'Not reported';
  const altimeter = raw.altim !== undefined ? `${raw.altim.toFixed(0)} hPa` : 'Not reported';
  const cat = validateCategory(raw.flightCategory);

  return {
    raw: raw.rawOb ?? 'Raw METAR not available',
    station: raw.stationId ?? icao,
    name: icao,
    time: raw.reportTime ? formatTime(raw.reportTime) : 'Unknown',
    wind,
    visibility,
    clouds,
    temp,
    dewpoint,
    altimeter,
    remarks: raw.remarks ?? 'None',
    flightCategory: cat,
    interpretation: buildInterpretation(raw, cat),
  };
}

function formatWind(dir?: number | string, speed?: number): string {
  if (!speed || speed === 0) return 'Calm';
  if (dir === 'VRB') return `Variable at ${speed} knots`;
  return `${String(dir).padStart(3, '0')}° at ${speed} knots`;
}

function formatVisibility(vis?: number | string): string {
  if (vis === undefined) return 'Not reported';
  const n = Number(vis);
  if (n >= 9999 || vis === '+9999') return '10 km or more';
  if (n >= 1) return `${n.toFixed(1)} km`;
  return `${Math.round(n * 1000)} m`;
}

function formatClouds(clouds?: Array<{ cover: string; base?: number }>): string {
  if (!clouds || clouds.length === 0) return 'Sky clear';
  const map: Record<string, string> = {
    SKC: 'Sky clear', CLR: 'Clear below 12,000ft',
    FEW: 'Few', SCT: 'Scattered', BKN: 'Broken', OVC: 'Overcast',
  };
  return clouds
    .map((c) => `${map[c.cover] ?? c.cover}${c.base !== undefined ? ` at ${c.base * 100} ft` : ''}`)
    .join(', ');
}

function formatTime(t: string): string {
  try { return new Date(t).toUTCString().replace('GMT', 'UTC'); } catch { return t; }
}

type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR' | 'UNKNOWN';

function validateCategory(cat?: string): FlightCategory {
  const valid: FlightCategory[] = ['VFR', 'MVFR', 'IFR', 'LIFR'];
  return valid.includes(cat as FlightCategory)
    ? (cat as FlightCategory)
    : 'UNKNOWN';
}

function buildInterpretation(raw: RawAWC, cat: MetarData['flightCategory']): MetarInterpretation {
  const speed = raw.wspd ?? 0;
  const windSummary = speed === 0
    ? 'Wind is calm. No crosswind on any runway.'
    : speed > 20
      ? `Strong wind — ${speed} kt. Crosswind may exceed C-172R limit (15 kt). Check before committing.`
      : `Wind ${speed} kt from ${raw.wdir}°. Calculate crosswind component for your runway.`;

  const vis = Number(raw.visib ?? 9999);
  const visibilitySummary = vis >= 8
    ? 'Good visibility — no restrictions to VFR.'
    : vis >= 5
      ? 'Marginal VFR. Legal but reduced — extra vigilance required.'
      : 'Below VFR minima. Do not depart VFR without ATC approval.';

  const hasLowCloud = raw.clouds?.some((c) => ['BKN', 'OVC'].includes(c.cover) && (c.base ?? 999) < 15);
  const cloudSummary = hasLowCloud
    ? 'Low cloud base — verify VFR cloud clearance and minimum sector altitudes.'
    : 'Cloud cover acceptable for VFR. Monitor for development.';

  const t2 = raw.temp ?? 20;
  const dp = raw.dewpoint ?? 0;
  const spread = t2 - dp;
  const tempSummary = spread < 3
    ? `Temp/dew spread only ${spread}°C — fog or low cloud likely.`
    : `Temp ${Math.round(t2)}°C / Dew ${Math.round(dp)}°C — spread ${spread}°C, no immediate fog risk.`;

  const qnh = raw.altim ?? 1013;
  const altimeterSummary = `QNH ${Math.round(qnh)} hPa. ${qnh < 1000 ? 'Low pressure — density altitude elevated, performance reduced.'
      : qnh > 1025 ? 'High pressure — good performance, watch for temperature inversions.'
        : 'Near standard pressure.'
    }`;

  const adviceMap: Record<string, string> = {
    VFR: 'Conditions are VFR. Visual flight permitted. Monitor for changes.',
    MVFR: 'Marginal VFR. Proceed with caution. Consider delaying if conditions worsening.',
    IFR: 'IFR conditions. VFR flight not permitted. Do not depart unless instrument rated.',
    LIFR: 'Low IFR — severely restricted. Do not operate VFR.',
    UNKNOWN: 'Flight category undetermined. Assess each element before flight.',
  };

  return { windSummary, visibilitySummary, cloudSummary, tempSummary, altimeterSummary, pilotAdvice: adviceMap[cat] };
}
