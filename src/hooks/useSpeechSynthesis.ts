import { useCallback, useEffect, useState } from 'react';
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

function isMobile(): boolean {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function classifyVoice(v: SpeechSynthesisVoice): 'male' | 'female' {
  const n = v.name.toLowerCase();
  const femaleHints = ['female', 'woman', 'girl', 'zira', 'hazel', 'susan', 'victoria', 'karen', 'samantha', 'fiona', 'moira', 'tessa', 'veena', 'raveena'];
  const maleHints = ['male', 'man', 'guy', 'david', 'george', 'daniel', 'james', 'alex', 'fred', 'thomas', 'rishi'];
  if (femaleHints.some((h) => n.includes(h))) return 'female';
  if (maleHints.some((h) => n.includes(h))) return 'male';
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
    male: voices.filter((v) => classifyVoice(v) === 'male'),
    female: voices.filter((v) => classifyVoice(v) === 'female'),
  };

  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const pool = voicePref.gender === 'male' ? availableVoices.male : availableVoices.female;
    if (voicePref.voiceName) {
      const named = pool.find((v) => v.name === voicePref.voiceName);
      if (named) return named;
    }
    return pool.find((v) => v.lang === 'en-GB')
      ?? pool.find((v) => v.lang.startsWith('en'))
      ?? null;
  }, [voicePref, availableVoices.male, availableVoices.female]);

  const speak = useCallback((text: string, onStart?: () => void, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const mobile = isMobile();
    const isMale = voicePref.gender === 'male';

    u.rate = 0.85;
    u.volume = 1.0;

    if (mobile) {
      // On mobile, voice switching via Web Speech API is unreliable.
      // Android Chrome ignores the selected voice and uses the system default.
      // Compensate with pitch — lower for male, higher for female.
      u.pitch = isMale ? 0.6 : 1.2;
      // Still attempt voice selection in case the device supports it
      const voice = getBestVoice();
      if (voice) u.voice = voice;
    } else {
      // Desktop — full voice selection works reliably
      u.pitch = isMale ? 0.88 : 1.1;
      const voice = getBestVoice();
      if (voice) u.voice = voice;
    }

    u.onstart = () => onStart?.();
    u.onend = () => onEnd?.();
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
