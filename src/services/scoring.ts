import { CheckResult, FeedbackResult, FeedbackStatus, Scenario } from '../types';

const PASS_SCORE_THRESHOLD = 80;
const PARTIAL_SCORE_THRESHOLD = 50;
const MINIMUM_TRIPLE_COUNT = 3;
const PERCENTAGE_MULTIPLIER = 100;

const countOccurrences = (sourceString: string, searchTerm: string): number => {
  let occurrenceCount = 0;
  let searchPosition = 0;

  while ((searchPosition = sourceString.indexOf(searchTerm, searchPosition)) !== -1) {
    occurrenceCount++;
    searchPosition += searchTerm.length;
  }

  return occurrenceCount;
};

const evaluateTripleKeyCheck = (
  normalizedTranscript: string,
  tripleKey: string,
  checkLabel: string,
  errorMessage: string
): CheckResult => {
  const occurrenceCount = countOccurrences(
    normalizedTranscript,
    tripleKey.toLowerCase()
  );
  const passed = occurrenceCount >= MINIMUM_TRIPLE_COUNT;

  return {
    label: checkLabel,
    passed,
    warning: false,
    detail: passed ? undefined : errorMessage,
  };
};

const evaluateWarningCheck = (
  normalizedTranscript: string,
  checkKeys: string[],
  checkLabel: string,
  errorMessage: string
): CheckResult => {
  const keyFound = checkKeys.some(
    (checkKey) => normalizedTranscript.includes(checkKey.toLowerCase())
  );

  return {
    label: checkLabel,
    passed: !keyFound,
    warning: true,
    detail: keyFound ? errorMessage : undefined,
  };
};

const evaluateStandardCheck = (
  normalizedTranscript: string,
  checkKeys: string[],
  checkLabel: string,
  errorMessage: string
): CheckResult => {
  const keyFound = checkKeys.some(
    (checkKey) => normalizedTranscript.includes(checkKey.toLowerCase())
  );

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

export const evaluateReadback = (
  transcript: string,
  scenario: Scenario
): FeedbackResult => {
  const normalizedTranscript = transcript.toLowerCase().trim();

  const checkResults: CheckResult[] = scenario.checks.map((check) => {
    if (check.tripleKey) {
      return evaluateTripleKeyCheck(
        normalizedTranscript,
        check.tripleKey,
        check.label,
        check.err
      );
    }
    if (check.warn) {
      return evaluateWarningCheck(
        normalizedTranscript,
        check.keys,
        check.label,
        check.err
      );
    }
    return evaluateStandardCheck(
      normalizedTranscript,
      check.keys,
      check.label,
      check.err
    );
  });

  const mandatoryChecks = checkResults.filter((result) => !result.warning);
  const passedCheckCount = mandatoryChecks.filter((result) => result.passed).length;
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
