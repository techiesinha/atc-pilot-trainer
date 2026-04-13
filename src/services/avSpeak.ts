/**
 * avSpeak — Aviation phonetic number formatter
 *
 * Converts numeric strings to digit-by-digit format before
 * passing to Text-to-Speech so the browser reads them correctly.
 *
 * Rules (ICAO Doc 9432):
 *   QNH / pressure  : digit by digit  1013 → "1 0 1 3"
 *   Frequency        : digit by digit  118.3 → "1 1 8 decimal 3"
 *   Runway           : digit by digit  27 → "2 7"  27L → "2 7 left"
 *   Squawk           : digit by digit  7700 → "7 7 0 0"
 *   Heading          : digit by digit  360 → "3 6 0"
 *   Altitude/FL      : spoken normally 2000 → "2 thousand"  FL150 → "flight level 1 5 0"
 */

// Splits a string of digits into space-separated individual digits
// "1013" → "1 0 1 3"
function spellDigits(str: string): string {
    return str.split('').join(' ');
}

// Replace decimal point with "decimal" for frequencies
// "118.3" → "1 1 8 decimal 3"
function formatFrequency(freq: string): string {
    return freq
        .replace('.', ' decimal ')
        .split('')
        .filter((c) => c !== '.')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Full regex replacements applied to ATC call text before TTS
export function formatForSpeech(text: string): string {
    return text
        // Frequencies: 3 digits . 1-2 digits  e.g. 118.3, 121.50
        .replace(/\b(\d{3})\.(\d{1,2})\b/g, (_, a, b) =>
            `${spellDigits(a)} decimal ${spellDigits(b)}`
        )

        // QNH / pressure: exactly 4 digits  e.g. 1013, 1008
        .replace(/\bQ?(\d{4})\b/g, (match, digits) =>
            match.startsWith('Q')
                ? `QNH ${spellDigits(digits)}`
                : spellDigits(digits)
        )

        // Squawk: exactly 4 digits already covered above

        // Runway with suffix: 27L, 09R, 36C
        .replace(/\brunway (\d{1,2})([LRC]?)\b/gi, (_, num, suffix) => {
            const digits = spellDigits(num.padStart(2, '0'));
            const sfx = suffix === 'L' ? ' left'
                : suffix === 'R' ? ' right'
                    : suffix === 'C' ? ' centre'
                        : '';
            return `runway ${digits}${sfx}`;
        })

        // Headings: "heading 270" → "heading 2 7 0"
        .replace(/\bheading (\d{3})\b/gi, (_, h) => `heading ${spellDigits(h)}`)

        // Flight level: FL150 → "flight level 1 5 0"
        .replace(/\bFL(\d{2,3})\b/gi, (_, fl) => `flight level ${spellDigits(fl)}`)

        // 3-digit standalone numbers (headings, speeds) — spell out
        .replace(/\b(\d{3})\b/g, (_, n) => spellDigits(n))

        // 2-digit standalone numbers (runway without keyword)
        // Skip — "2 7" without "runway" prefix is ambiguous
        ;
}
