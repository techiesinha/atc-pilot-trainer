import { useCallback, useRef, useState, useEffect } from 'react';
import { VoicePreference } from '../types';

const VOICE_PREF_KEY = 'atcVoicePref';

function loadPref(): VoicePreference {
  try {
    const s = localStorage.getItem(VOICE_PREF_KEY);
    if (s) return JSON.parse(s) as VoicePreference;
  } catch { /* ignore */ }
  return { gender: 'male', voiceName: null };
}

function savePref(pref: VoicePreference) {
  localStorage.setItem(VOICE_PREF_KEY, JSON.stringify(pref));
}

/** Heuristically classify a SpeechSynthesisVoice as male or female. */
function classifyVoice(v: SpeechSynthesisVoice): 'male' | 'female' {
  const n = v.name.toLowerCase();
  const femaleHints = ['female','woman','girl','zira','hazel','susan','victoria','karen','samantha','fiona','moira','tessa','veena','raveena'];
  const maleHints   = ['male','man','guy','david','george','daniel','james','alex','fred','thomas','rishi'];
  if (femaleHints.some((h) => n.includes(h))) return 'female';
  if (maleHints.some((h) => n.includes(h))) return 'male';
  // Default heuristic: voices with no gender hint alternate male/female by index
  return 'male';
}

export interface UseSpeechSynthesisResult {
  speak: (text: string, onStart?: () => void, onEnd?: () => void) => void;
  cancel: () => void;
  voicePref: VoicePreference;
  availableVoices: { male: SpeechSynthesisVoice[]; female: SpeechSynthesisVoice[] };
  setVoiceGender: (gender: 'male' | 'female') => void;
  setVoiceName: (name: string) => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const [voicePref, setVoicePref] = useState<VoicePreference>(loadPref);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
      setVoices(all);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const availableVoices = {
    male:   voices.filter((v) => classifyVoice(v) === 'male'),
    female: voices.filter((v) => classifyVoice(v) === 'female'),
  };

  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const pool = voicePref.gender === 'male' ? availableVoices.male : availableVoices.female;
    if (voicePref.voiceName) {
      const named = pool.find((v) => v.name === voicePref.voiceName);
      if (named) return named;
    }
    // Prefer en-GB for ICAO standard
    return pool.find((v) => v.lang === 'en-GB') ?? pool.find((v) => v.lang.startsWith('en')) ?? null;
  }, [voicePref, availableVoices.male, availableVoices.female]);

  const speak = useCallback((text: string, onStart?: () => void, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = voicePref.gender === 'male' ? 0.88 : 1.1;
    u.volume = 1.0;
    const voice = getBestVoice();
    if (voice) u.voice = voice;
    u.onstart = () => onStart?.();
    u.onend   = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  }, [getBestVoice, voicePref.gender]);

  const cancel = useCallback(() => window.speechSynthesis.cancel(), []);

  const setVoiceGender = useCallback((gender: 'male' | 'female') => {
    const pref: VoicePreference = { gender, voiceName: null };
    savePref(pref);
    setVoicePref(pref);
  }, []);

  const setVoiceName = useCallback((voiceName: string) => {
    const pref: VoicePreference = { ...voicePref, voiceName };
    savePref(pref);
    setVoicePref(pref);
  }, [voicePref]);

  return { speak, cancel, voicePref, availableVoices, setVoiceGender, setVoiceName };
}
