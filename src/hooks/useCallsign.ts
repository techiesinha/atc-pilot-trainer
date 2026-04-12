import { useState, useCallback } from 'react';
import { randomCallsign } from '../data/callsigns';

const KEY = 'atcCallsign';

export function useCallsign() {
  const [callsign, setCallsign] = useState<string>(() => {
    return localStorage.getItem(KEY) ?? randomCallsign();
  });

  const reroll = useCallback(() => {
    const next = randomCallsign();
    localStorage.setItem(KEY, next);
    setCallsign(next);
  }, []);

  // Persist on first load
  if (!localStorage.getItem(KEY)) {
    localStorage.setItem(KEY, callsign);
  }

  return { callsign, reroll };
}
