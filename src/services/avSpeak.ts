/**
 * avSpeak — Aviation phonetic number formatter
 *
 * Converts numbers in ATC call text to ICAO-standard spoken form
 * before passing to Text-to-Speech.
 *
 * ICAO Doc 9432 pronunciation rules:
 *   0 → "zero"   (not "oh")
 *   9 → "niner"  (not "nine" — avoids confusion with German "nein")
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const ICAO_DIGIT_WORDS: Record<string, string> = {
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'niner',
};

const RUNWAY_SUFFIX_WORDS: Record<string, string> = {
    L: 'left',
    R: 'right',
    C: 'centre',
};

const SPOKEN = {
    DECIMAL: 'decimal',
    QNH: 'QNH',
    FLIGHT_LEVEL: 'flight level',
    RUNWAY: 'runway',
    HEADING: 'heading',
    SQUAWK: 'squawk',
} as const;

const REGEX = {
    // Frequency: 118.3, 121.50
    FREQUENCY: /\b(\d{3})\.(\d{1,2})\b/g,
    // QNH with prefix: QNH1013 or QNH 1013
    QNH_WITH_PREFIX: /\bQNH\s*(\d{4})\b/gi,
    // Flight level: FL150, FL80
    FLIGHT_LEVEL: /\bFL(\d{2,3})\b/gi,
    // Runway with optional suffix: runway 27L, runway 09R
    RUNWAY_WITH_SUFFIX: /\brunway\s+(\d{1,2})([LRC]?)\b/gi,
    // Heading: heading 270
    HEADING: /\bheading\s+(\d{3})\b/gi,
    // Squawk: squawk 7700
    SQUAWK: /\bsquawk\s+(\d{4})\b/gi,
    // Standalone 4-digit number
    FOUR_DIGITS: /\b(\d{4})\b/g,
    // Standalone 3-digit number
    THREE_DIGITS: /\b(\d{3})\b/g,
    // Standalone 2-digit number
    TWO_DIGITS: /\b(\d{2})\b/g,
    // Standalone single digit
    ONE_DIGIT: /\b(\d)\b/g,
    // Multiple spaces
    MULTI_SPACE: /\s+/g,
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a string of digit characters to ICAO spoken words.
 * "1013" → "one zero one three"
 * "09"   → "zero niner"
 */
function spellDigits(digitString: string): string {
    return digitString
        .split('')
        .map((digit) => ICAO_DIGIT_WORDS[digit] ?? digit)
        .join(' ');
}

/**
 * Converts a runway number to its spoken form, zero-padded to two digits.
 * "9" → "zero niner"
 * "27" → "two seven"
 */
function spellRunwayNumber(runwayNumber: string): string {
    const paddedNumber = runwayNumber.padStart(2, '0');
    return spellDigits(paddedNumber);
}

/**
 * Converts a runway suffix letter to its spoken word.
 * "L" → "left", "R" → "right", "C" → "centre", "" → ""
 */
function spellRunwaySuffix(suffixLetter: string): string {
    return RUNWAY_SUFFIX_WORDS[suffixLetter as keyof typeof RUNWAY_SUFFIX_WORDS] ?? '';
}

// ── Main formatter ────────────────────────────────────────────────────────────

/**
 * Formats ATC call text for ICAO-compliant Text-to-Speech output.
 * Apply this to every string before passing to speak().
 */
export function formatForSpeech(atcText: string): string {
    return atcText

        // Frequencies: 118.3 → "one one eight decimal three"
        .replace(REGEX.FREQUENCY, (_, integerPart: string, decimalPart: string) =>
            `${spellDigits(integerPart)} ${SPOKEN.DECIMAL} ${spellDigits(decimalPart)}`
        )

        // QNH: QNH 1013 → "QNH one zero one three"
        .replace(REGEX.QNH_WITH_PREFIX, (_, pressureDigits: string) =>
            `${SPOKEN.QNH} ${spellDigits(pressureDigits)}`
        )

        // Flight level: FL150 → "flight level one five zero"
        .replace(REGEX.FLIGHT_LEVEL, (_, levelDigits: string) =>
            `${SPOKEN.FLIGHT_LEVEL} ${spellDigits(levelDigits)}`
        )

        // Runway: runway 27L → "runway two seven left"
        .replace(REGEX.RUNWAY_WITH_SUFFIX, (_, runwayNumber: string, suffixLetter: string) => {
            const spokenNumber = spellRunwayNumber(runwayNumber);
            const spokenSuffix = spellRunwaySuffix(suffixLetter);
            const suffix = spokenSuffix ? ` ${spokenSuffix}` : '';
            return `${SPOKEN.RUNWAY} ${spokenNumber}${suffix}`;
        })

        // Heading: heading 270 → "heading two seven zero"
        .replace(REGEX.HEADING, (_, headingDigits: string) =>
            `${SPOKEN.HEADING} ${spellDigits(headingDigits)}`
        )

        // Squawk: squawk 7700 → "squawk seven seven zero zero"
        .replace(REGEX.SQUAWK, (_, squawkDigits: string) =>
            `${SPOKEN.SQUAWK} ${spellDigits(squawkDigits)}`
        )

        // Remaining standalone numbers — longest first to avoid partial matches
        .replace(REGEX.FOUR_DIGITS, (_, digits: string) => spellDigits(digits))
        .replace(REGEX.THREE_DIGITS, (_, digits: string) => spellDigits(digits))
        .replace(REGEX.TWO_DIGITS, (_, digits: string) => spellDigits(digits))
        .replace(REGEX.ONE_DIGIT, (_, digit: string) => ICAO_DIGIT_WORDS[digit] ?? digit)

        // Clean up double spaces from replacements
        .replace(REGEX.MULTI_SPACE, ' ')
        .trim();
}
