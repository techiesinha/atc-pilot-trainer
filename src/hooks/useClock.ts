import { useEffect, useState } from 'react';

export interface ClockState {
  localTime: string;
  utcTime: string;
  utcDate: string;
}

const MONTH_ABBREVIATIONS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

const TICK_INTERVAL_MS = 1000;
const PAD_LENGTH = 2;
const PAD_CHARACTER = '0';

const padTimeUnit = (timeUnit: number): string =>
  String(timeUnit).padStart(PAD_LENGTH, PAD_CHARACTER);

const formatClock = (date: Date): ClockState => {
  const localHours = padTimeUnit(date.getHours());
  const localMinutes = padTimeUnit(date.getMinutes());
  const localSeconds = padTimeUnit(date.getSeconds());

  const utcHours = padTimeUnit(date.getUTCHours());
  const utcMinutes = padTimeUnit(date.getUTCMinutes());
  const utcSeconds = padTimeUnit(date.getUTCSeconds());

  const utcDay = padTimeUnit(date.getUTCDate());
  const utcMonth = MONTH_ABBREVIATIONS[date.getUTCMonth()];
  const utcYear = date.getUTCFullYear();

  return {
    localTime: `${localHours}:${localMinutes}:${localSeconds}`,
    utcTime: `${utcHours}:${utcMinutes}:${utcSeconds}Z`,
    utcDate: `${utcDay} ${utcMonth} ${utcYear}`,
  };
};

export const useClock = (): ClockState => {
  const [clock, setClock] = useState<ClockState>(() => formatClock(new Date()));

  useEffect(() => {
    const now = Date.now();
    const msUntilNextTick = TICK_INTERVAL_MS - (now % TICK_INTERVAL_MS);
    let tickInterval: ReturnType<typeof setInterval>;

    const alignmentTimeout = setTimeout(() => {
      setClock(formatClock(new Date()));
      tickInterval = setInterval(
        () => setClock(formatClock(new Date())),
        TICK_INTERVAL_MS
      );
    }, msUntilNextTick);

    return () => {
      clearTimeout(alignmentTimeout);
      clearInterval(tickInterval);
    };
  }, []);

  return clock;
};
