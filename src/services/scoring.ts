import { CheckResult, FeedbackResult, FeedbackStatus, Scenario } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const PASS_SCORE_THRESHOLD = 80;
const PARTIAL_SCORE_THRESHOLD = 50;
const MINIMUM_TRIPLE_COUNT = 3;
const PERCENTAGE_MULTIPLIER = 100;

// Maximum word-distance between two tokens of a multi-word key to still count as a match.
// e.g. "victor uh tango" — "victor" and "tango" are 2 words apart → still matches "victor tango"
const WINDOW_SIZE = 6;

// ── Filler words ──────────────────────────────────────────────────────────────

const FILLER_WORDS = new Set([
  'uh', 'um', 'er', 'ah', 'like', 'so', 'okay', 'ok', 'right', 'well',
]);

// ── Number normalisation ──────────────────────────────────────────────────────
// Covers: ICAO pronunciation variants, digit characters, spoken-digit combos
// Applied before substitution so substitution map works on clean text

const NUMBER_NORMALISATION: Array<[RegExp, string]> = [
  // Digits → ICAO words  (must run before word substitutions)
  [/\b0\b/g, 'zero'],
  [/\b1\b/g, 'one'],
  [/\b2\b/g, 'two'],
  [/\b3\b/g, 'three'],
  [/\b4\b/g, 'four'],
  [/\b5\b/g, 'five'],
  [/\b6\b/g, 'six'],
  [/\b7\b/g, 'seven'],
  [/\b8\b/g, 'eight'],
  [/\b9\b/g, 'niner'],
  // Common compound number mishearings
  [/\bone nineteen\b/g, 'one one niner'],
  [/\b119\b/g, 'one one niner'],
  [/\bone twenty\b/g, 'one two zero'],
  [/\b120\b/g, 'one two zero'],
  [/\bone twenty one\b/g, 'one two one'],
  [/\b121\b/g, 'one two one'],
  [/\bone twenty two\b/g, 'one two two'],
  [/\b122\b/g, 'one two two'],
  [/\bone twenty three\b/g, 'one two three'],
  [/\b123\b/g, 'one two three'],
  [/\b7700\b/g, 'seven seven zero zero'],
  [/\b7000\b/g, 'seven zero zero zero'],
  [/\b4521\b/g, 'four five two one'],
  // ICAO non-standard pronunciations back to standard
  [/\btree\b/g, 'three'],
  [/\bfower\b/g, 'four'],
  [/\bfife\b/g, 'five'],
  [/\bait\b/g, 'eight'],
  [/\bnine\b/g, 'niner'],   // "nine" almost always means "niner" in aviation context
];

// ── Aviation substitution map ─────────────────────────────────────────────────
// Keys: what the speech engine actually produces
// Values: what the pilot almost certainly said
// Ordered longest-first so multi-word substitutions run before single words

const AVIATION_SUBSTITUTIONS: Array<[RegExp, string]> = [
  // ── Callsign prefix ───────────────────────────────────────────────────────
  [/\bvictor tango\b/g, 'victor tango'],   // already correct — ensures normalisation
  [/\bfactor tango\b/g, 'victor tango'],
  [/\bpicture tango\b/g, 'victor tango'],
  [/\bbitter tango\b/g, 'victor tango'],
  [/\bfiction tango\b/g, 'victor tango'],
  [/\bvictory tango\b/g, 'victor tango'],

  // ── Emergency calls ───────────────────────────────────────────────────────
  [/\bmay day\b/g, 'mayday'],
  [/\bpay day\b/g, 'mayday'],
  [/\bmade a\b/g, 'mayday'],
  [/\bpan pen\b/g, 'pan pan'],
  [/\bpen pen\b/g, 'pan pan'],
  [/\bpan pan pan\b/g, 'pan pan pan'],    // keep triple intact

  // ── Key aviation words ────────────────────────────────────────────────────
  [/\bwill go\b/g, 'wilco'],
  [/\bwiltco\b/g, 'wilco'],
  [/\bwild co\b/g, 'wilco'],
  [/\bbilco\b/g, 'wilco'],
  [/\bwill co\b/g, 'wilco'],

  [/\bsquad\b/g, 'squawk'],
  [/\bsquat\b/g, 'squawk'],
  [/\bsquak\b/g, 'squawk'],
  [/\bscore\b/g, 'squawk'],

  [/\bdead side\b/g, 'deadside'],
  [/\bbed side\b/g, 'deadside'],
  [/\bdead site\b/g, 'deadside'],
  [/\bdeadsite\b/g, 'deadside'],

  [/\bre join\b/g, 'rejoin'],
  [/\bre-join\b/g, 'rejoin'],
  [/\bregion\b/g, 'rejoin'],

  [/\bhawking\b/g, 'holding'],
  [/\bholding point\b/g, 'holding point'],  // keep compound intact
  [/\bholding position\b/g, 'holding position'],

  [/\bque nh\b/g, 'qnh'],
  [/\bqueue nh\b/g, 'qnh'],
  [/\bk n h\b/g, 'qnh'],
  [/\bq n h\b/g, 'qnh'],

  [/\blining up\b/g, 'lining up'],      // keep intact
  [/\blying up\b/g, 'lining up'],
  [/\blining op\b/g, 'lining up'],

  [/\bclear take off\b/g, 'clear take-off'],
  [/\bclear takeoff\b/g, 'clear take-off'],
  [/\bcleared take off\b/g, 'cleared for takeoff'],
  [/\bcleared takeoff\b/g, 'cleared for takeoff'],

  [/\bline up and wait\b/g, 'line up and wait'],  // keep intact
  [/\blined up and wait\b/g, 'line up and wait'],
  [/\bline up and weight\b/g, 'line up and wait'],

  [/\bgoing around\b/g, 'going around'],   // keep intact
  [/\bgo around\b/g, 'go around'],      // keep intact
  [/\bgoing a round\b/g, 'going around'],

  [/\bread you fine\b/g, 'read you fine'],  // keep intact
  [/\bread you find\b/g, 'read you fine'],
  [/\bread you vine\b/g, 'read you fine'],

  [/\bops normal\b/g, 'ops normal'],     // keep intact
  [/\bops no more\b/g, 'ops normal'],
  [/\bops no man\b/g, 'ops normal'],

  [/\bgeneral flying\b/g, 'general flying'], // keep intact
  [/\bgeneral fly in\b/g, 'general flying'],

  [/\bstartup\b/g, 'startup'],
  [/\bstart up\b/g, 'startup'],
  [/\bstart-up\b/g, 'startup'],

  // ── Phonetic alphabet common mishearings ──────────────────────────────────
  [/\bfactor\b/g, 'victor'],
  [/\bvictor\b/g, 'victor'],         // keep intact
  [/\bcharley\b/g, 'charlie'],
  [/\bcharly\b/g, 'charlie'],
  [/\bzooloo\b/g, 'zulu'],
  [/\bzoo loo\b/g, 'zulu'],
  [/\bfox trot\b/g, 'foxtrot'],
  [/\bno vember\b/g, 'november'],
  [/\bkey lo\b/g, 'kilo'],
  [/\bkillo\b/g, 'kilo'],
  [/\bmango\b/g, 'tango'],           // common "tango" mishearing
  [/\btan go\b/g, 'tango'],

  // ── Aerodrome name mishearings ────────────────────────────────────────────
  [/\bdhola\b/g, 'dhule'],
  [/\bdhool\b/g, 'dhule'],
  [/\bdhula\b/g, 'dhule'],
  [/\bdoola\b/g, 'dhule'],

  // ── Requesting mishearings ────────────────────────────────────────────────
  [/\bquestion\b/g, 'requesting'],
  [/\bquestioning\b/g, 'requesting'],
  [/\brequest in\b/g, 'requesting'],
];

// ── Pipeline functions ────────────────────────────────────────────────────────

const stripFillerWords = (text: string): string => {
  return text
    .split(' ')
    .filter((token) => { return !FILLER_WORDS.has(token); })
    .join(' ');
};

const applyNumberNormalisation = (text: string): string => {
  let result = text;
  for (const [pattern, replacement] of NUMBER_NORMALISATION) {
    result = result.replace(pattern, replacement);
  }
  return result;
};

const applyAviationSubstitutions = (text: string): string => {
  let result = text;
  for (const [pattern, replacement] of AVIATION_SUBSTITUTIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
};

/**
 * Full normalisation pipeline.
 * Order matters:
 *   1. Lowercase + trim
 *   2. Strip fillers (so they don't interfere with number patterns)
 *   3. Normalise numbers (so substitution map sees clean word forms)
 *   4. Apply aviation substitutions
 */
const normaliseTranscript = (rawTranscript: string): string => {
  const lowered = rawTranscript.toLowerCase().trim();
  const noFillers = stripFillerWords(lowered);
  const normNums = applyNumberNormalisation(noFillers);
  const normAviation = applyAviationSubstitutions(normNums);
  return normAviation;
};

// ── Token-level AND matching within a sliding window ─────────────────────────

/**
 * Checks whether all tokens of a key phrase appear within any WINDOW_SIZE-word
 * window of the transcript tokens.
 *
 * This handles cases where the engine inserts extra words between key words:
 *   key = "victor tango"
 *   transcript = "victor uh tango"  → matches (distance = 2, within window)
 *   transcript = "victor something completely different tango lots more" → no match
 */
const tokenWindowMatch = (transcriptTokens: string[], keyPhrase: string): boolean => {
  const keyTokens = keyPhrase.toLowerCase().trim().split(/\s+/);

  if (keyTokens.length === 1) {
    // Single token — simple includes check
    return transcriptTokens.includes(keyTokens[0]);
  }

  // Slide a window of WINDOW_SIZE across the transcript
  for (let windowStart = 0; windowStart <= transcriptTokens.length - keyTokens.length; windowStart++) {
    const windowEnd = Math.min(windowStart + WINDOW_SIZE, transcriptTokens.length);
    const windowTokens = transcriptTokens.slice(windowStart, windowEnd);

    // Check if ALL key tokens appear in this window
    const allFound = keyTokens.every((keyToken) => { return windowTokens.includes(keyToken); });
    if (allFound) return true;
  }

  return false;
};

// ── Levenshtein fuzzy match ───────────────────────────────────────────────────

const levenshtein = (firstString: string, secondString: string): number => {
  const firstLen = firstString.length;
  const secondLen = secondString.length;

  const matrix: number[][] = Array.from(
    { length: secondLen + 1 },
    (_, rowIndex) => {
      return Array.from({ length: firstLen + 1 }, (__, colIndex) => {
        if (rowIndex === 0) return colIndex;
        if (colIndex === 0) return rowIndex;
        return 0;
      });
    }
  );

  for (let rowIndex = 1; rowIndex <= secondLen; rowIndex++) {
    for (let colIndex = 1; colIndex <= firstLen; colIndex++) {
      if (secondString[rowIndex - 1] === firstString[colIndex - 1]) {
        matrix[rowIndex][colIndex] = matrix[rowIndex - 1][colIndex - 1];
      } else {
        matrix[rowIndex][colIndex] = Math.min(
          matrix[rowIndex - 1][colIndex - 1],
          matrix[rowIndex - 1][colIndex],
          matrix[rowIndex][colIndex - 1]
        ) + 1;
      }
    }
  }

  return matrix[secondLen][firstLen];
};

// Only apply fuzzy matching to single short tokens — fuzzy on phrases causes false positives
const MAX_FUZZY_DISTANCE = 2;
const MIN_TOKEN_LENGTH_FOR_FUZZY = 4;  // don't fuzz short tokens like "at", "on", "to"

const fuzzyTokenMatch = (transcriptTokens: string[], keyPhrase: string): boolean => {
  const keyTokens = keyPhrase.toLowerCase().trim().split(/\s+/);

  // Only apply fuzzy to single-word keys that are long enough
  if (keyTokens.length !== 1) return false;
  const keyToken = keyTokens[0];
  if (keyToken.length < MIN_TOKEN_LENGTH_FOR_FUZZY) return false;

  return transcriptTokens.some((transcriptToken) => {
    if (transcriptToken.length < MIN_TOKEN_LENGTH_FOR_FUZZY) return false;
    return levenshtein(transcriptToken, keyToken) <= MAX_FUZZY_DISTANCE;
  });
};

// ── Check evaluators ──────────────────────────────────────────────────────────

const countOccurrences = (sourceString: string, searchTerm: string): number => {
  let occurrenceCount = 0;
  let searchPosition = 0;
  const lowerTerm = searchTerm.toLowerCase();

  while ((searchPosition = sourceString.indexOf(lowerTerm, searchPosition)) !== -1) {
    occurrenceCount++;
    searchPosition += lowerTerm.length;
  }

  return occurrenceCount;
};

const evaluateTripleKeyCheck = (
  normalisedTranscript: string,
  tripleKey: string,
  checkLabel: string,
  errorMessage: string
): CheckResult => {
  const occurrenceCount = countOccurrences(normalisedTranscript, tripleKey);
  const passed = occurrenceCount >= MINIMUM_TRIPLE_COUNT;

  return {
    label: checkLabel,
    passed,
    warning: false,
    detail: passed ? undefined : errorMessage,
  };
};

const evaluateWarningCheck = (
  transcriptTokens: string[],
  checkKeys: string[],
  checkLabel: string,
  errorMessage: string
): CheckResult => {
  const keyFound = checkKeys.some((checkKey) => {
    return tokenWindowMatch(transcriptTokens, checkKey)
      || fuzzyTokenMatch(transcriptTokens, checkKey);
  });

  return {
    label: checkLabel,
    passed: !keyFound,
    warning: true,
    detail: keyFound ? errorMessage : undefined,
  };
};

const evaluateStandardCheck = (
  transcriptTokens: string[],
  checkKeys: string[],
  checkLabel: string,
  errorMessage: string
): CheckResult => {
  const keyFound = checkKeys.some((checkKey) => {
    return tokenWindowMatch(transcriptTokens, checkKey)
      || fuzzyTokenMatch(transcriptTokens, checkKey);
  });

  return {
    label: checkLabel,
    passed: keyFound,
    warning: false,
    detail: keyFound ? undefined : errorMessage,
  };
};

const determineStatus = (score: number): FeedbackStatus => {
  if (score >= PASS_SCORE_THRESHOLD) return FeedbackStatus.Pass;
  if (score >= PARTIAL_SCORE_THRESHOLD) return FeedbackStatus.Partial;
  return FeedbackStatus.Fail;
};

// ── Public API ────────────────────────────────────────────────────────────────

export const evaluateReadback = (
  transcript: string,
  scenario: Scenario
): FeedbackResult => {
  const normalisedTranscript = normaliseTranscript(transcript);
  const transcriptTokens = normalisedTranscript.split(/\s+/).filter(Boolean);

  const checkResults: CheckResult[] = scenario.checks.map((check) => {
    if (check.tripleKey) {
      return evaluateTripleKeyCheck(
        normalisedTranscript,
        check.tripleKey,
        check.label,
        check.err
      );
    }
    if (check.warn) {
      return evaluateWarningCheck(
        transcriptTokens,
        check.keys,
        check.label,
        check.err
      );
    }
    return evaluateStandardCheck(
      transcriptTokens,
      check.keys,
      check.label,
      check.err
    );
  });

  const mandatoryChecks = checkResults.filter((result) => { return !result.warning; });
  const passedCheckCount = mandatoryChecks.filter((result) => { return result.passed; }).length;
  const score = mandatoryChecks.length > 0
    ? Math.round((passedCheckCount / mandatoryChecks.length) * PERCENTAGE_MULTIPLIER)
    : 0;

  return {
    status: determineStatus(score),
    checkResults,
    idealResponse: scenario.idealResponse,
    teachingNote: scenario.teachingNote,
    score,
  };
};
