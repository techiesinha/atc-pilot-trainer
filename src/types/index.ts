export type ScenarioCategory =
  | 'ground'
  | 'tower'
  | 'approach'
  | 'emergency'
  | 'information'
  | 'uncontrolled';

export interface CheckItem {
  label: string;
  keys: string[];
  err: string;
  warn?: boolean;
  tripleKey?: string;
}

export interface ScenarioTemplate {
  id: string;
  category: ScenarioCategory;
  label: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  freqType: 'ground' | 'tower' | 'approach' | 'atis' | 'emergency' | 'ctaf';
  atcCallTemplate: string;
  pilotInitiated: boolean;
  situationTemplate?: string;
  idealResponseTemplate: string;
  checks: CheckItem[];
  teachingNote: string;
}

export interface Scenario extends Omit<ScenarioTemplate,
  'atcCallTemplate' | 'idealResponseTemplate' | 'situationTemplate' | 'freqType'> {
  atcCall: string;
  idealResponse: string;
  situation?: string;
  freq: string;
  squawk: string;
}

export interface TranscriptEntry {
  source: 'atc' | 'pilot' | 'system';
  text: string;
  timestamp: Date;
}

export type FeedbackStatus = 'pass' | 'partial' | 'fail' | 'idle';

export interface CheckResult {
  label: string;
  passed: boolean;
  warning: boolean;
  detail?: string;
}

export interface FeedbackResult {
  status: FeedbackStatus;
  checkResults: CheckResult[];
  idealResponse: string;
  teachingNote: string;
  score: number;
}

export interface SessionRecord {
  id: string;
  scenarioId: string;
  scenarioLabel: string;
  category: ScenarioCategory;
  date: string;
  passed: boolean;
  score: number;
  transcript: string;
  aerodromeIcao: string;
}

export interface MetarData {
  raw: string;
  station: string;
  name: string;
  time: string;
  wind: string;
  visibility: string;
  clouds: string;
  temp: string;
  dewpoint: string;
  altimeter: string;
  remarks: string;
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR' | 'UNKNOWN';
  interpretation: MetarInterpretation;
}

export interface MetarInterpretation {
  windSummary: string;
  visibilitySummary: string;
  cloudSummary: string;
  tempSummary: string;
  altimeterSummary: string;
  pilotAdvice: string;
}

export interface PhoneticItem {
  letter: string;
  phonetic: string;
  example: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  country: string;
  pilotLevel: string;
  registeredAt: string;
  lastSeen: string;
  sessions: number;
  isNewUser: boolean;
}

export enum VoiceGender {
  Male = 'male',
  Female = 'female',
}

export interface VoicePreference {
  gender: VoiceGender;
  voiceName: string | null;
}
