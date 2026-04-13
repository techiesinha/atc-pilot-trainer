import { useCallback, useState } from 'react';
import { randomCallsign } from '../data/callsigns';

const CALLSIGN_STORAGE_KEY = 'atcCallsign';

export const useCallsign = () => {
  const [callsign, setCallsign] = useState<string>(() => {
    return localStorage.getItem(CALLSIGN_STORAGE_KEY) ?? randomCallsign();
  });

  const reroll = useCallback(() => {
    const nextCallsign = randomCallsign();
    localStorage.setItem(CALLSIGN_STORAGE_KEY, nextCallsign);
    setCallsign(nextCallsign);
  }, []);

  if (!localStorage.getItem(CALLSIGN_STORAGE_KEY)) {
    localStorage.setItem(CALLSIGN_STORAGE_KEY, callsign);
  }

  return { callsign, reroll };
};
