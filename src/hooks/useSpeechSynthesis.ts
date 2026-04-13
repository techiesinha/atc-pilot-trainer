import { useCallback, useEffect, useState } from 'react';
import { VoiceGender, VoicePreference } from '../types';

const VOICE_PREFERENCE_STORAGE_KEY = 'atcVoicePref';
const PREFERRED_LANGUAGE = 'en-GB';
const FALLBACK_LANGUAGE_PREFIX = 'en';
const SPEECH_RATE_NORMAL = 0.85;
const SPEECH_VOLUME_FULL = 1.0;
const PITCH_DESKTOP_MALE = 0.88;
const PITCH_DESKTOP_FEMALE = 1.1;
const PITCH_MOBILE_MALE = 0.6;
const PITCH_MOBILE_FEMALE = 1.2;
const MOBILE_USER_AGENT_PATTERN = /android|iphone|ipad|ipod|mobile/i;

const FEMALE_VOICE_HINTS = [
  'female', 'woman', 'girl', 'zira', 'hazel', 'susan',
  'victoria', 'karen', 'samantha', 'fiona', 'moira',
  'tessa', 'veena', 'raveena',
] as const;

const MALE_VOICE_HINTS = [
  'male', 'man', 'guy', 'david', 'george', 'daniel',
  'james', 'alex', 'fred', 'thomas', 'rishi',
] as const;

const DEFAULT_VOICE_PREFERENCE: VoicePreference = {
  gender: VoiceGender.Male,
  voiceName: null,
};

const loadVoicePreference = (): VoicePreference => {
  try {
    const stored = localStorage.getItem(VOICE_PREFERENCE_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as VoicePreference;
  } catch {
    /* parse error — use default */
  }
  return DEFAULT_VOICE_PREFERENCE;
};

const saveVoicePreference = (preference: VoicePreference): void => {
  localStorage.setItem(VOICE_PREFERENCE_STORAGE_KEY, JSON.stringify(preference));
};

const isMobileDevice = (): boolean =>
  MOBILE_USER_AGENT_PATTERN.test(navigator.userAgent);

const classifyVoiceGender = (voice: SpeechSynthesisVoice): VoiceGender => {
  const voiceNameLower = voice.name.toLowerCase();
  if (FEMALE_VOICE_HINTS.some((hint) => voiceNameLower.includes(hint))) return VoiceGender.Female;
  if (MALE_VOICE_HINTS.some((hint) => voiceNameLower.includes(hint))) return VoiceGender.Male;
  return VoiceGender.Male;
};

export interface UseSpeechSynthesisResult {
  speak: (text: string, onStart?: () => void, onEnd?: () => void) => void;
  cancel: () => void;
  voicePref: VoicePreference;
  availableVoices: { male: SpeechSynthesisVoice[]; female: SpeechSynthesisVoice[] };
  setVoiceGender: (gender: VoiceGender) => void;
  setVoiceName: (name: string) => void;
}

export const useSpeechSynthesis = (): UseSpeechSynthesisResult => {
  const [voicePreference, setVoicePreference] = useState<VoicePreference>(loadVoicePreference);
  const [availableVoiceList, setAvailableVoiceList] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const englishVoices = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.startsWith(FALLBACK_LANGUAGE_PREFIX));
      setAvailableVoiceList(englishVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const availableVoices = {
    male: availableVoiceList.filter((voice) => classifyVoiceGender(voice) === VoiceGender.Male),
    female: availableVoiceList.filter((voice) => classifyVoiceGender(voice) === VoiceGender.Female),
  };

  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voicePool = voicePreference.gender === VoiceGender.Male
      ? availableVoices.male
      : availableVoices.female;

    if (voicePreference.voiceName) {
      const namedVoice = voicePool.find((voice) => voice.name === voicePreference.voiceName);
      if (namedVoice) return namedVoice;
    }

    return voicePool.find((voice) => voice.lang === PREFERRED_LANGUAGE)
      ?? voicePool.find((voice) => voice.lang.startsWith(FALLBACK_LANGUAGE_PREFIX))
      ?? null;
  }, [voicePreference, availableVoices.male, availableVoices.female]);

  const speak = useCallback((
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
  ) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const onMobile = isMobileDevice();
    const isMaleVoice = voicePreference.gender === VoiceGender.Male;

    utterance.rate = SPEECH_RATE_NORMAL;
    utterance.volume = SPEECH_VOLUME_FULL;
    utterance.pitch = onMobile
      ? (isMaleVoice ? PITCH_MOBILE_MALE : PITCH_MOBILE_FEMALE)
      : (isMaleVoice ? PITCH_DESKTOP_MALE : PITCH_DESKTOP_FEMALE);

    const selectedVoice = getBestVoice();
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  }, [getBestVoice, voicePreference.gender]);

  const cancel = useCallback(() => window.speechSynthesis.cancel(), []);

  const setVoiceGender = useCallback((gender: VoiceGender) => {
    const updatedPreference: VoicePreference = { gender, voiceName: null };
    saveVoicePreference(updatedPreference);
    setVoicePreference(updatedPreference);
  }, []);

  const setVoiceName = useCallback((voiceName: string) => {
    const updatedPreference: VoicePreference = { ...voicePreference, voiceName };
    saveVoicePreference(updatedPreference);
    setVoicePreference(updatedPreference);
  }, [voicePreference]);

  return {
    speak,
    cancel,
    voicePref: voicePreference,
    availableVoices,
    setVoiceGender,
    setVoiceName,
  };
};
