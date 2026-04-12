import { useRef, useCallback } from 'react';

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  start: (onResult: (transcript: string) => void) => void;
  stop: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef    = useRef<((t: string) => void) | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback((onResult: (transcript: string) => void) => {
    if (!isSupported) return;
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition as typeof SpeechRecognition ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition as typeof SpeechRecognition;

    const recognition = new SR();
    onResultRef.current      = onResult;
    recognitionRef.current   = recognition;
    recognition.continuous   = true;
    recognition.interimResults = true;
    recognition.lang         = 'en-GB';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      onResultRef.current?.(full);
    };
    recognition.onerror = (e) => { if (e.error !== 'aborted') console.warn('STT error:', e.error); };
    recognition.onend   = () => { recognitionRef.current = null; };
    try { recognition.start(); } catch { /* already started */ }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
  }, []);

  return { isSupported, start, stop };
}
