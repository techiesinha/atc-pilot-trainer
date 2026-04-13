import { PHONETIC_ALPHABET } from './phonetics';

/**
 * VT- callsign pool for the simulator.
 * VT is India's aircraft nationality prefix (ICAO Annex 7).
 * Real callsigns use 3 suffix letters, spoken phonetically.
 *
 * Rules applied when selecting suffix letters:
 *   - Not an IATA airport code
 *   - Not an ICAO airline code
 *   - Not an aviation term or abbreviation
 *   - Not a city abbreviation or informal geographic code
 */

const INDIA_NATIONALITY_PREFIX = 'VT-';
const CALLSIGN_SUFFIX_START = 3;
const PHONETIC_SEPARATOR = ' ';
const HYPHEN_CHARACTER = '-';
const EMPTY_STRING = '';

export const VT_CALLSIGNS = [
  'VT-BMX', 'VT-OWL', 'VT-FOX', 'VT-JAY', 'VT-REX',
  'VT-ZAP', 'VT-ZEN', 'VT-YAK', 'VT-TAJ', 'VT-MAX',
  'VT-LEO', 'VT-IVY', 'VT-HOP', 'VT-GEM', 'VT-FIG',
  'VT-ELK', 'VT-DOT', 'VT-COB', 'VT-BEE', 'VT-APE',
  'VT-ABS', 'VT-WOK', 'VT-RXY', 'VT-KWZ', 'VT-MXO',
] as const;

const phoneticLookup: Record<string, string> = {};

PHONETIC_ALPHABET.forEach((phoneticItem) => {
  phoneticLookup[phoneticItem.letter.toUpperCase()] = phoneticItem.phonetic;
});

/**
 * Convert a VT-XXX callsign to full ICAO phonetic spoken form.
 * VT-BMX → "Victor Tango Bravo Mike X-ray"
 */
export const callsignToPhonetic = (callsign: string): string => {
  return callsign
    .replace(HYPHEN_CHARACTER, EMPTY_STRING)
    .toUpperCase()
    .split(EMPTY_STRING)
    .map((character) => { return phoneticLookup[character] ?? character; })
    .join(PHONETIC_SEPARATOR);
};

/**
 * Short form used in ATC scripts after first contact.
 * VT-BMX → "Bravo Mike X-ray" (suffix only)
 */
export const callsignShort = (callsign: string): string => {
  return callsign
    .slice(CALLSIGN_SUFFIX_START)
    .split(EMPTY_STRING)
    .map((character) => { return phoneticLookup[character.toUpperCase()] ?? character; })
    .join(PHONETIC_SEPARATOR);
};

export const randomCallsign = (): string => {
  return VT_CALLSIGNS[Math.floor(Math.random() * VT_CALLSIGNS.length)];
};

export const callsignWithoutPrefix = (callsign: string): string => {
  return callsign.replace(INDIA_NATIONALITY_PREFIX, EMPTY_STRING);
};
