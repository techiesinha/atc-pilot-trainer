import { useState, useEffect } from 'react';

export interface ClockState {
  localTime: string;
  utcTime:   string;
  utcDate:   string;
}

function formatClock(d: Date): ClockState {
  const pad = (n: number) => String(n).padStart(2, '0');

  const lh = pad(d.getHours());
  const lm = pad(d.getMinutes());
  const ls = pad(d.getSeconds());

  const uh = pad(d.getUTCHours());
  const um = pad(d.getUTCMinutes());
  const us = pad(d.getUTCSeconds());

  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dateStr = `${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

  return {
    localTime: `${lh}:${lm}:${ls}`,
    utcTime:   `${uh}:${um}:${us}Z`,
    utcDate:   dateStr,
  };
}

export function useClock(): ClockState {
  const [clock, setClock] = useState<ClockState>(() => formatClock(new Date()));

  useEffect(() => {
    // Align to the next whole second boundary first
    const now     = Date.now();
    const offset  = 1000 - (now % 1000);
    let interval: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      setClock(formatClock(new Date()));
      interval = setInterval(() => setClock(formatClock(new Date())), 1000);
    }, offset);

    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, []);

  return clock;
}
