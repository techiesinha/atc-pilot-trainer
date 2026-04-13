import { config, log } from '../config';
import { t } from '../locales';
import { MetarData, MetarInterpretation } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_VISIBILITY_METRES = 9999;
const ONE_KM_IN_METRES = 1000;
const LOW_CLOUD_BASE_CEILING_FL = 15;
const FOG_SPREAD_THRESHOLD_CELSIUS = 3;
const STANDARD_QNH_LOW_HPA = 1000;
const STANDARD_QNH_HIGH_HPA = 1025;
const STRONG_WIND_THRESHOLD_KTS = 20;
const CROSSWIND_LIMIT_C172R_KTS = 15;
const MARGINAL_VFR_VISIBILITY_KM = 8;
const BELOW_VFR_VISIBILITY_KM = 5;
const DEFAULT_TEMPERATURE_CELSIUS = 20;
const DEFAULT_DEWPOINT_CELSIUS = 0;
const DEFAULT_QNH_HPA = 1013;
const DEFAULT_VISIBILITY = 9999;
const FEET_PER_FLIGHT_LEVEL = 100;
const METAR_HOURS_LOOKBACK = 2;
const WIND_DIRECTION_VARIABLE = 'VRB';
const VISIBILITY_PLUS_MAX = '+9999';
const WIND_PAD_LENGTH = 3;
const WIND_PAD_CHARACTER = '0';

const LOW_CLOUD_COVER_CODES = ['BKN', 'OVC'] as const;

const CLOUD_COVER_LABELS: Record<string, string> = {
  SKC: t.aviationWeather.skyClear,
  CLR: t.aviationWeather.clearBelow12000,
  FEW: t.aviationWeather.cloudFew,
  SCT: t.aviationWeather.cloudScattered,
  BKN: t.aviationWeather.cloudBroken,
  OVC: t.aviationWeather.cloudOvercast,
};

enum FlightCategory {
  VFR = 'VFR',
  MVFR = 'MVFR',
  IFR = 'IFR',
  LIFR = 'LIFR',
  Unknown = 'UNKNOWN',
}

const VALID_FLIGHT_CATEGORIES: FlightCategory[] = [
  FlightCategory.VFR,
  FlightCategory.MVFR,
  FlightCategory.IFR,
  FlightCategory.LIFR,
];

const PILOT_ADVICE: Record<FlightCategory, string> = {
  [FlightCategory.VFR]: t.aviationWeather.pilotAdvice.VFR,
  [FlightCategory.MVFR]: t.aviationWeather.pilotAdvice.MVFR,
  [FlightCategory.IFR]: t.aviationWeather.pilotAdvice.IFR,
  [FlightCategory.LIFR]: t.aviationWeather.pilotAdvice.LIFR,
  [FlightCategory.Unknown]: t.aviationWeather.pilotAdvice.UNKNOWN,
};

// ── Interfaces ────────────────────────────────────────────────────────────────

interface RawCloudLayer {
  cover: string;
  base?: number;
}

interface RawMetarData {
  rawOb?: string;
  stationId?: string;
  reportTime?: string;
  temp?: number;
  dewpoint?: number;
  wdir?: number | string;
  wspd?: number;
  visib?: number | string;
  altim?: number;
  clouds?: RawCloudLayer[];
  flightCategory?: string;
  remarks?: string;
}

interface CheckWxCloud {
  code: string;
  base_feet_agl?: number;
}

interface CheckWxResponse {
  raw_text?: string;
  icao?: string;
  observed?: string;
  temperature?: { celsius?: number };
  dewpoint?: { celsius?: number };
  wind?: { degrees?: number; speed_kts?: number };
  visibility?: { miles_float?: number };
  barometer?: { hpa?: number };
  clouds?: CheckWxCloud[];
  flight_category?: string;
  remarks?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const validateFlightCategory = (rawCategory?: string): FlightCategory => {
  const categoryValue = rawCategory as FlightCategory;
  return VALID_FLIGHT_CATEGORIES.includes(categoryValue)
    ? categoryValue
    : FlightCategory.Unknown;
};

const formatWindSummary = (
  windDirection?: number | string,
  windSpeed?: number
): string => {
  if (!windSpeed || windSpeed === 0) return t.aviationWeather.calmWind;
  if (windDirection === WIND_DIRECTION_VARIABLE) {
    return t.aviationWeather.wind.strong(windSpeed, CROSSWIND_LIMIT_C172R_KTS);
  }
  return t.aviationWeather.wind.normal(
    windSpeed,
    String(windDirection).padStart(WIND_PAD_LENGTH, WIND_PAD_CHARACTER)
  );
};

const formatVisibilitySummary = (rawVisibility?: number | string): string => {
  if (rawVisibility === undefined) return t.aviationWeather.notReported;

  const visibilityNumber = Number(rawVisibility);

  if (visibilityNumber >= MAX_VISIBILITY_METRES || rawVisibility === VISIBILITY_PLUS_MAX) {
    return t.aviationWeather.visibilityMaxKm;
  }
  if (visibilityNumber >= 1) {
    return `${visibilityNumber.toFixed(1)} km`;
  }
  return `${Math.round(visibilityNumber * ONE_KM_IN_METRES)} m`;
};

const formatCloudSummary = (cloudLayers?: RawCloudLayer[]): string => {
  if (!cloudLayers || cloudLayers.length === 0) return t.aviationWeather.skyClear;

  return cloudLayers
    .map((layer) => {
      const coverLabel = CLOUD_COVER_LABELS[layer.cover] ?? layer.cover;
      const baseLabel = layer.base !== undefined
        ? ` at ${layer.base * FEET_PER_FLIGHT_LEVEL} ft`
        : '';
      return `${coverLabel}${baseLabel}`;
    })
    .join(', ');
};

const formatReportTime = (reportTime: string): string => {
  try {
    return new Date(reportTime).toUTCString().replace('GMT', 'UTC');
  } catch {
    return reportTime;
  }
};

const buildInterpretation = (
  rawMetar: RawMetarData,
  flightCategory: FlightCategory
): MetarInterpretation => {
  const windSpeed = rawMetar.wspd ?? 0;
  const temperature = rawMetar.temp ?? DEFAULT_TEMPERATURE_CELSIUS;
  const dewpoint = rawMetar.dewpoint ?? DEFAULT_DEWPOINT_CELSIUS;
  const qnh = rawMetar.altim ?? DEFAULT_QNH_HPA;
  const visibility = Number(rawMetar.visib ?? DEFAULT_VISIBILITY);
  const tempDewSpread = temperature - dewpoint;

  const windSummary = windSpeed === 0
    ? t.aviationWeather.wind.calm
    : windSpeed > STRONG_WIND_THRESHOLD_KTS
      ? t.aviationWeather.wind.strong(windSpeed, CROSSWIND_LIMIT_C172R_KTS)
      : t.aviationWeather.wind.normal(windSpeed, rawMetar.wdir ?? WIND_DIRECTION_VARIABLE);

  const visibilitySummary = visibility >= MARGINAL_VFR_VISIBILITY_KM
    ? t.aviationWeather.visibility.good
    : visibility >= BELOW_VFR_VISIBILITY_KM
      ? t.aviationWeather.visibility.marginal
      : t.aviationWeather.visibility.poor;

  const hasLowCloudBase = rawMetar.clouds?.some(
    (layer) =>
      LOW_CLOUD_COVER_CODES.includes(layer.cover as typeof LOW_CLOUD_COVER_CODES[number]) &&
      (layer.base ?? DEFAULT_VISIBILITY) < LOW_CLOUD_BASE_CEILING_FL
  );

  const cloudSummary = hasLowCloudBase
    ? t.aviationWeather.cloud.low
    : t.aviationWeather.cloud.acceptable;

  const tempSummary = tempDewSpread < FOG_SPREAD_THRESHOLD_CELSIUS
    ? t.aviationWeather.temperature.fogRisk(tempDewSpread)
    : t.aviationWeather.temperature.noFogRisk(
      Math.round(temperature),
      Math.round(dewpoint),
      tempDewSpread
    );

  const pressureNote = qnh < STANDARD_QNH_LOW_HPA
    ? t.aviationWeather.pressure.low
    : qnh > STANDARD_QNH_HIGH_HPA
      ? t.aviationWeather.pressure.high
      : t.aviationWeather.pressure.standard;

  const altimeterSummary = t.aviationWeather.pressure.summary(
    Math.round(qnh),
    pressureNote
  );

  return {
    windSummary,
    visibilitySummary,
    cloudSummary,
    tempSummary,
    altimeterSummary,
    pilotAdvice: PILOT_ADVICE[flightCategory],
  };
};

const parseRawMetar = (rawMetar: RawMetarData, icao: string): MetarData => {
  const wind = formatWindSummary(rawMetar.wdir, rawMetar.wspd);
  const visibility = formatVisibilitySummary(rawMetar.visib);
  const clouds = formatCloudSummary(rawMetar.clouds);
  const temperature = rawMetar.temp !== undefined
    ? `${Math.round(rawMetar.temp)}°C`
    : t.aviationWeather.notReported;
  const dewpoint = rawMetar.dewpoint !== undefined
    ? `${Math.round(rawMetar.dewpoint)}°C`
    : t.aviationWeather.notReported;
  const altimeter = rawMetar.altim !== undefined
    ? `${rawMetar.altim.toFixed(0)} hPa`
    : t.aviationWeather.notReported;
  const flightCategory = validateFlightCategory(rawMetar.flightCategory);

  return {
    raw: rawMetar.rawOb ?? t.aviationWeather.rawMetarUnavailable,
    station: rawMetar.stationId ?? icao,
    name: icao,
    time: rawMetar.reportTime
      ? formatReportTime(rawMetar.reportTime)
      : t.aviationWeather.timeUnknown,
    wind,
    visibility,
    clouds,
    temp: temperature,
    dewpoint,
    altimeter,
    remarks: rawMetar.remarks ?? t.aviationWeather.remarksNone,
    flightCategory,
    interpretation: buildInterpretation(rawMetar, flightCategory),
  };
};

// ── Fetchers ──────────────────────────────────────────────────────────────────

const fetchFromAviationWeatherWithProxy = async (icaoCode: string): Promise<MetarData> => {
  const targetUrl = `${config.metar.aviationWeather.baseUrl}/metar?ids=${icaoCode}&format=json&hours=${METAR_HOURS_LOOKBACK}`;
  const proxiedUrl = `${config.metar.corsProxy}${encodeURIComponent(targetUrl)}`;

  log.info(`Fetching METAR via proxy: ${icaoCode}`);

  const response = await fetch(proxiedUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(t.aviationWeather.errors.proxyHttpError(response.status));
  }

  const rawDataArray: RawMetarData[] = await response.json();
  if (!rawDataArray || rawDataArray.length === 0) {
    throw new Error(t.aviationWeather.errors.noMetarFound(icaoCode));
  }

  return parseRawMetar(rawDataArray[0], icaoCode);
};

const fetchFromCheckWX = async (icaoCode: string): Promise<MetarData> => {
  const requestUrl = `${config.metar.checkwx.baseUrl}/metar/${icaoCode}/decoded`;

  log.info(`Fetching METAR via CheckWX: ${icaoCode}`);

  const response = await fetch(requestUrl, {
    headers: { 'X-API-Key': config.metar.checkwx.key },
  });

  if (!response.ok) {
    throw new Error(t.aviationWeather.errors.checkWxHttpError(response.status));
  }

  const responseJson = await response.json();
  const checkWxData: CheckWxResponse = responseJson?.data?.[0];
  if (!checkWxData) {
    throw new Error(t.aviationWeather.errors.noCheckWxData(icaoCode));
  }

  const normalizedRawMetar: RawMetarData = {
    rawOb: checkWxData.raw_text,
    stationId: checkWxData.icao,
    reportTime: checkWxData.observed,
    temp: checkWxData.temperature?.celsius,
    dewpoint: checkWxData.dewpoint?.celsius,
    wdir: checkWxData.wind?.degrees ?? WIND_DIRECTION_VARIABLE,
    wspd: checkWxData.wind?.speed_kts,
    visib: checkWxData.visibility?.miles_float,
    altim: checkWxData.barometer?.hpa,
    clouds: checkWxData.clouds?.map((cloudLayer) => ({
      cover: cloudLayer.code,
      base: cloudLayer.base_feet_agl
        ? Math.round(cloudLayer.base_feet_agl / FEET_PER_FLIGHT_LEVEL)
        : undefined,
    })),
    flightCategory: checkWxData.flight_category,
    remarks: checkWxData.remarks,
  };

  return parseRawMetar(normalizedRawMetar, icaoCode);
};

// ── Public API ────────────────────────────────────────────────────────────────

export const fetchMetar = async (icao: string): Promise<MetarData> => {
  const normalizedIcao = icao.trim().toUpperCase();

  if (config.metar.primary === 'checkwx' && config.metar.checkwx.key) {
    try {
      return await fetchFromCheckWX(normalizedIcao);
    } catch (fetchError) {
      log.warn('CheckWX failed, falling back to Aviation Weather via proxy:', fetchError);
    }
  }

  return fetchFromAviationWeatherWithProxy(normalizedIcao);
};
