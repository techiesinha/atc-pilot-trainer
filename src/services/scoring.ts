import { Scenario, FeedbackResult, CheckResult } from '../types';

function countOccurrences(str: string, sub: string): number {
  let count = 0, pos = 0;
  while ((pos = str.indexOf(sub, pos)) !== -1) { count++; pos += sub.length; }
  return count;
}

export function evaluateReadback(transcript: string, scenario: Scenario): FeedbackResult {
  const t = transcript.toLowerCase().trim();

  const checkResults: CheckResult[] = scenario.checks.map((check) => {
    if (check.tripleKey) {
      const occ = countOccurrences(t, check.tripleKey.toLowerCase());
      return { label: check.label, passed: occ >= 3, warning: false, detail: occ < 3 ? check.err : undefined };
    }
    if (check.warn) {
      const found = check.keys.some((k) => t.includes(k.toLowerCase()));
      return { label: check.label, passed: !found, warning: true, detail: found ? check.err : undefined };
    }
    const found = check.keys.some((k) => t.includes(k.toLowerCase()));
    return { label: check.label, passed: found, warning: false, detail: !found ? check.err : undefined };
  });

  const mandatory   = checkResults.filter((r) => !r.warning);
  const passedCount = mandatory.filter((r) => r.passed).length;
  const score       = mandatory.length > 0 ? Math.round((passedCount / mandatory.length) * 100) : 0;
  const status      = score >= 80 ? 'pass' : score >= 50 ? 'partial' : 'fail';

  return { status, checkResults, idealResponse: scenario.idealResponse, teachingNote: scenario.teachingNote, score };
}
