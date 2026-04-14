import { useCallback, useRef } from 'react';

declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    readonly isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }

  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RECOGNITION_LANGUAGE = 'en-GB';
const MAX_ALTERNATIVES = 1;
const ABORTED_ERROR_CODE = 'aborted';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  start: (onResult: (transcript: string) => void) => void;
  stop: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useSpeechRecognition = (): UseSpeechRecognitionResult => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef<((transcript: string) => void) | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback((onResult: (transcript: string) => void) => {
    if (!isSupported) return;

    const SpeechRecognitionConstructor: new () => SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionConstructor();
    onResultRef.current = onResult;
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = RECOGNITION_LANGUAGE;
    recognition.maxAlternatives = MAX_ALTERNATIVES;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = '';
      for (let resultIndex = 0; resultIndex < event.results.length; resultIndex++) {
        fullTranscript += event.results[resultIndex][0].transcript;
      }
      onResultRef.current?.(fullTranscript);
    };

    recognition.onerror = (event: Event) => {
      const errorCode = (event as Event & { error: string }).error;
      if (errorCode !== ABORTED_ERROR_CODE) {
        console.warn('Speech recognition error:', errorCode);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      /* recognition already started — ignore */
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* recognition already stopped — ignore */
      }
      recognitionRef.current = null;
    }
  }, []);

  return { isSupported, start, stop };
};
