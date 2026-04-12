import { PHONETIC_ALPHABET } from './phonetics';

/**
 * VT- callsign pool for the simulator.
 * VT is India's aircraft nationality prefix (ICAO Annex 7).
 * Real callsigns use 3 suffix letters, spoken phonetically.
 */
export const VT_CALLSIGNS = [
  'VT-BMX', 'VT-SKY', 'VT-ACE', 'VT-KAL', 'VT-SIM',
  'VT-JET', 'VT-CES', 'VT-IND', 'VT-PNQ', 'VT-MUM',
  'VT-DLH', 'VT-BLR', 'VT-HYD', 'VT-GOA', 'VT-AIR',
  'VT-FLY', 'VT-NAV', 'VT-ATC', 'VT-PPL', 'VT-CPL',
  'VT-ABS', 'VT-SIN', 'VT-HAM', 'VT-IFR', 'VT-VFR',
];

const phoneticMap: Record<string, string> = {};
PHONETIC_ALPHABET.forEach((p) => {
  phoneticMap[p.letter.toUpperCase()] = p.phonetic;
});

/**
 * Convert a VT-XXX callsign to full ICAO phonetic spoken form.
 * VT-BMX → "Victor Tango Bravo Mike X-ray"
 */
export function callsignToPhonetic(callsign: string): string {
  return callsign
    .replace(/-/g, '')
    .toUpperCase()
    .split('')
    .map((ch) => phoneticMap[ch] ?? ch)
    .join(' ');
}

/**
 * Short form used in ATC scripts after first contact.
 * VT-BMX → "Bravo Mike X-ray" (suffix only)
 */
export function callsignShort(callsign: string): string {
  const suffix = callsign.replace('VT-', '');
  return suffix
    .split('')
    .map((ch) => phoneticMap[ch.toUpperCase()] ?? ch)
    .join(' ');
}

export function randomCallsign(): string {
  return VT_CALLSIGNS[Math.floor(Math.random() * VT_CALLSIGNS.length)];
}
