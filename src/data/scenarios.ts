import { Aerodrome, pickRandomQnh } from '../config/aerodromes';
import { ScenarioTemplate } from '../types';
import { callsignToPhonetic } from './callsigns';
import { pickRandomCaptain } from './captains';

// ── Token pools ───────────────────────────────────────────────────────────────

const ATIS_LETTERS: readonly string[] = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot',
  'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima',
] as const;

const SECTOR_DIRECTIONS: readonly string[] = ['North', 'South'] as const;

const ENDURANCE_OPTIONS: readonly string[] = [
  '4 hours', '5 hours', '6 hours',
] as const;

const DURATION_OPTIONS: readonly string[] = [
  '45 minutes', '1 hour', '1 hour 30 minutes',
] as const;

const FUEL_ENDURANCE_OPTIONS: readonly string[] = [
  '45 minutes', '1 hour', '1 hour 30 minutes',
] as const;

const POB_OPTIONS: readonly number[] = [1, 2, 3] as const;

const EMPTY_STRING = '';

// ── Random pickers ────────────────────────────────────────────────────────────

const pickRandom = <T>(pool: readonly T[]): T => {
  return pool[Math.floor(Math.random() * pool.length)];
};

// ── Scenario templates ────────────────────────────────────────────────────────

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [

  // ════════════════════════════════════════════════════════════════════════════
  // GROUND — Controlled aerodrome
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'startup',
    category: 'ground',
    label: 'Startup Clearance',
    difficulty: 'basic',
    freqType: 'ground',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Ground, startup approved, QNH {QNH}, expect runway {RUNWAY}.',
    idealResponseTemplate: '{AERODROME} Ground, {CALLSIGN}, startup approved, QNH {QNH}, runway {RUNWAY}, {CALLSIGN}.',
    checks: [
      { label: 'Station addressed', keys: ['ground'], err: 'Address the station first — "{AERODROME} Ground"' },
      { label: 'Callsign included', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'QNH read back', keys: ['qnh'], err: 'QNH must always be read back — it sets your altimeter' },
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the expected departure runway' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign to confirm receipt' },
    ],
    teachingNote: 'Startup clearance readback: station, your callsign, "startup approved", QNH, runway, your callsign again. The QNH readback is non-negotiable — an incorrect altimeter setting is a primary accident cause.',
  },

  {
    id: 'request_taxi',
    category: 'ground',
    label: 'Request Taxi',
    difficulty: 'basic',
    freqType: 'ground',
    pilotInitiated: true,
    situationTemplate: 'Pre-flight checks complete. Aircraft ready. Request taxi to runway {RUNWAY} from {AERODROME} Ground on {GROUND_FREQ}.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Ground, {CALLSIGN}, request taxi, runway {RUNWAY}, VFR, information {ATIS}.',
    checks: [
      { label: 'Station addressed', keys: ['ground'], err: 'Call "{AERODROME} Ground" first' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Request taxi" stated', keys: ['request taxi', 'taxi'], err: 'Say "request taxi" clearly' },
      { label: 'Runway stated', keys: ['runway'], err: 'State the runway you expect — "runway {RUNWAY}"' },
      { label: 'Flight rules stated', keys: ['vfr'], err: 'State your flight rules — "VFR" for visual flight' },
      { label: 'ATIS acknowledged', keys: ['information'], err: 'Confirm you have the ATIS — "information {ATIS}"' },
    ],
    teachingNote: 'When requesting taxi, always: address the station, give your callsign, say "request taxi", state the runway, state VFR or IFR, and confirm the ATIS information letter. This gives the controller everything they need to issue your clearance.',
  },

  {
    id: 'taxi_clearance',
    category: 'ground',
    label: 'Taxi Clearance Readback',
    difficulty: 'basic',
    freqType: 'ground',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Ground, taxi to holding point Alpha, runway {RUNWAY}, via taxiway Bravo, QNH {QNH}.',
    idealResponseTemplate: 'Taxi to holding point Alpha, runway {RUNWAY}, via taxiway Bravo, QNH {QNH}, {CALLSIGN}.',
    checks: [
      { label: 'Holding point read back', keys: ['alpha', 'holding point'], err: 'Read back the holding point — runway incursions start here' },
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway designation' },
      { label: 'Taxi route read back', keys: ['bravo'], err: 'Read back the taxi route — "via taxiway Bravo"' },
      { label: 'QNH read back', keys: ['qnh'], err: 'Read back the QNH' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'Taxi clearances require a FULL readback of every element. Runway incursions — aircraft entering an active runway incorrectly — are the most deadly class of accident on the ground. A correct readback is your last line of defence.',
  },

  {
    id: 'atis_first_contact',
    category: 'ground',
    label: 'ATIS First Contact',
    difficulty: 'basic',
    freqType: 'atis',
    pilotInitiated: false,
    atcCallTemplate: '{AERODROME} Information {ATIS}. Time zero nine three zero. Runway in use {RUNWAY}. Wind two six zero degrees one zero knots. Visibility ten kilometres. Few at two thousand five hundred. Temperature two eight, dewpoint two two. QNH {QNH}. Advise on first contact you have information {ATIS}.',
    idealResponseTemplate: '{AERODROME} Ground, {CALLSIGN}, request taxi, runway {RUNWAY}, VFR, information {ATIS}.',
    checks: [
      { label: 'Ground frequency called', keys: ['ground'], err: 'After copying ATIS, call Ground — "{AERODROME} Ground"' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Request taxi stated', keys: ['request taxi', 'taxi'], err: 'State your request — "request taxi"' },
      { label: 'ATIS letter confirmed', keys: ['information'], err: 'Confirm you have the ATIS — "information {ATIS}"' },
    ],
    teachingNote: 'Copy the full ATIS before calling ATC. Always confirm the ATIS letter in your first call — "information {ATIS}". This saves the controller 30 seconds of weather passing and signals you have the current QNH. Never call Ground without copying ATIS first.',
  },

  {
    id: 'pushback_request',
    category: 'ground',
    label: 'Pushback Request',
    difficulty: 'intermediate',
    freqType: 'ground',
    pilotInitiated: true,
    situationTemplate: 'You are on stand at {AERODROME}. Request pushback and engine start approval from Ground on {GROUND_FREQ}.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Ground, {CALLSIGN}, stand Delta, request pushback and start, runway {RUNWAY}.',
    checks: [
      { label: 'Station addressed', keys: ['ground'], err: 'Call "{AERODROME} Ground" first' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Stand position stated', keys: ['stand', 'delta', 'bay'], err: 'State your stand or bay position' },
      { label: 'Pushback requested', keys: ['pushback', 'push back'], err: 'Say "request pushback"' },
      { label: 'Start requested', keys: ['start'], err: 'Request engine start — "and start"' },
      { label: 'Runway stated', keys: ['runway'], err: 'State the runway you expect to use — "runway {RUNWAY}"' },
    ],
    teachingNote: 'At aerodromes where pushback is required, this is your first call — before startup. Always state your stand position so ground crew and controllers know where you are. Pushback approval and startup approval are often combined in one call at smaller aerodromes.',
  },

  {
    id: 'backtrack',
    category: 'ground',
    label: 'Backtrack on Runway',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Tower, runway {RUNWAY}, backtrack and line up, wait.',
    idealResponseTemplate: 'Runway {RUNWAY}, backtrack, line up and wait, {CALLSIGN}.',
    checks: [
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway' },
      { label: '"Backtrack" acknowledged', keys: ['backtrack'], err: 'Read back "backtrack" explicitly' },
      { label: '"Line up and wait" read back', keys: ['line up and wait', 'line up wait'], err: '"Line up and wait" must be read back verbatim — you do NOT have takeoff clearance yet' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: '"Line up and wait" means enter the runway and hold — you do NOT have takeoff clearance. Several fatal accidents have occurred when pilots took off on a "line up" instruction. Read it back exactly and wait for a separate takeoff clearance.',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // TOWER — Controlled aerodrome
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'lineup_wait',
    category: 'tower',
    label: 'Line-Up and Wait',
    difficulty: 'basic',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Tower, runway {RUNWAY}, line up and wait.',
    idealResponseTemplate: 'Runway {RUNWAY}, line up and wait, {CALLSIGN}.',
    checks: [
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway' },
      { label: '"Line up and wait" read back', keys: ['line up and wait', 'line up wait'], err: 'Read back "line up and wait" verbatim — this is NOT a takeoff clearance' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: '"Line up and wait" is a HOLDING instruction — enter the runway and stop. You are NOT cleared to take off. Wait for a separate takeoff clearance before commencing the take-off roll.',
  },

  {
    id: 'takeoff',
    category: 'tower',
    label: 'Takeoff Clearance',
    difficulty: 'basic',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Tower, runway {RUNWAY}, wind two six zero degrees one five knots, cleared for takeoff.',
    idealResponseTemplate: 'Runway {RUNWAY}, cleared for takeoff, {CALLSIGN}.',
    checks: [
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway — confirms you are on the correct runway' },
      { label: '"Cleared for takeoff" verbatim', keys: ['cleared for takeoff'], err: '"Cleared for takeoff" must be read back verbatim — never say "cleared to go"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign to confirm acceptance' },
      { label: 'Did not acknowledge with roger alone', keys: ['roger'], warn: true, err: 'Never respond to a takeoff clearance with "Roger" alone — full readback mandatory' },
    ],
    teachingNote: 'Three mandatory elements: runway, "cleared for takeoff" (verbatim), callsign. This is the most safety-critical readback in VFR flying. A "Roger" alone has caused fatal accidents when a wrong-runway situation existed.',
  },

  {
    id: 'conditional_lineup',
    category: 'tower',
    label: 'Conditional Line-Up',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Tower, behind the landing Cessna on short final, runway {RUNWAY}, line up and wait behind.',
    idealResponseTemplate: 'Behind the landing Cessna, runway {RUNWAY}, line up and wait behind, {CALLSIGN}.',
    checks: [
      { label: 'Condition read back', keys: ['behind', 'cessna', 'landing'], err: 'Read back the condition — "behind the landing Cessna"' },
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway' },
      { label: '"Line up and wait behind" stated', keys: ['line up and wait behind', 'wait behind'], err: 'Read back "line up and wait BEHIND" — the word "behind" is part of the clearance' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'A conditional clearance includes a condition that must be satisfied first. You MUST read back the condition — "behind the landing Cessna". DO NOT enter the runway until the Cessna has touched down and cleared. The word "behind" in the readback is mandatory.',
  },

  {
    id: 'go_around_atc',
    category: 'tower',
    label: 'Go-Around — ATC Instructed',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, go around, I say again, go around, acknowledge.',
    idealResponseTemplate: 'Going around, {CALLSIGN}.',
    checks: [
      { label: '"Going around" stated', keys: ['going around', 'go around'], err: 'Read back "going around" immediately' },
      { label: 'Callsign included', keys: ['victor tango', 'vt'], err: 'Include your callsign' },
    ],
    teachingNote: 'A go-around from ATC is URGENT. Apply full power as you transmit. Your response must be immediate, short, and clear — "going around, {CALLSIGN}". Do not make a long readback — the manoeuvre takes absolute priority over the radio call.',
  },

  {
    id: 'go_around_pilot',
    category: 'tower',
    label: 'Go-Around — Pilot Initiated',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: true,
    situationTemplate: 'You are on final approach for runway {RUNWAY} at {AERODROME}. The runway ahead is occupied. You decide to go around.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Tower, {CALLSIGN}, going around.',
    checks: [
      { label: 'Station addressed', keys: ['tower'], err: 'Inform Tower immediately — "{AERODROME} Tower"' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Going around" stated', keys: ['going around'], err: 'Say "going around" — this is the standard phrase, never just "abort" or "pulling off"' },
    ],
    teachingNote: 'When you decide to go around, inform Tower immediately with just three words: "{AERODROME} Tower, {CALLSIGN}, going around." Keep it short — you are managing a time-critical manoeuvre. ATC will give you further instructions when workload allows.',
  },

  {
    id: 'freq_change_departure',
    category: 'tower',
    label: 'Frequency Change After Departure',
    difficulty: 'basic',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, contact {AERODROME} Approach on one one niner decimal five, good day.',
    idealResponseTemplate: 'One one niner decimal five, {CALLSIGN}, good day.',
    checks: [
      { label: 'Frequency read back', keys: ['one one niner', 'one nineteen', '119'], err: 'Read back the frequency digit by digit — "one one niner decimal five"' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Good day" stated', keys: ['good day'], err: 'Respond with "good day" to close the frequency' },
    ],
    teachingNote: 'When instructed to change frequency, always read back the complete frequency. Never just say "switching" — the readback confirms you have the correct frequency before you leave the Tower frequency. Then immediately contact the new unit.',
  },

  {
    id: 'touch_go',
    category: 'tower',
    label: 'Touch and Go',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, runway {RUNWAY}, cleared touch and go, surface wind two five zero degrees one two knots.',
    idealResponseTemplate: 'Runway {RUNWAY}, cleared touch and go, {CALLSIGN}.',
    checks: [
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway' },
      { label: '"Touch and go" read back', keys: ['touch and go'], err: 'Read back "touch and go" to confirm the type of clearance' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'Read back only the clearance elements — not the wind. ATC gives you wind for situational awareness, not for readback. "Touch and go" means land, apply power, and take off without stopping — configure flaps and trim during the ground roll.',
  },

  {
    id: 'full_stop_landing',
    category: 'tower',
    label: 'Full Stop Landing',
    difficulty: 'basic',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Tower, runway {RUNWAY}, cleared to land, surface wind two seven zero degrees one zero knots.',
    idealResponseTemplate: 'Runway {RUNWAY}, cleared to land, {CALLSIGN}.',
    checks: [
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway you are cleared to land on' },
      { label: '"Cleared to land" read back', keys: ['cleared to land'], err: 'Read back "cleared to land" verbatim' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'A landing clearance must be read back with the runway and "cleared to land". The wind is for your information only — do not read it back. Cleared to land means the runway is yours, but you are responsible for ensuring it is clear before you touch down.',
  },

  {
    id: 'visual_approach',
    category: 'tower',
    label: 'Visual Approach Clearance',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, cleared visual approach, descend to circuit altitude, report downwind, left hand circuit runway {RUNWAY}, QNH {QNH}.',
    idealResponseTemplate: 'Cleared visual approach, leaving for circuit altitude, will report downwind, left hand circuit runway {RUNWAY}, QNH {QNH}, {CALLSIGN}.',
    checks: [
      { label: '"Cleared visual approach" read back', keys: ['cleared visual approach', 'visual approach'], err: 'Read back "cleared visual approach"' },
      { label: 'Circuit direction stated', keys: ['left hand', 'left-hand'], err: 'Read back the circuit direction — "left hand circuit"' },
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway' },
      { label: 'QNH read back', keys: ['qnh'], err: 'Read back the QNH' },
      { label: 'Reporting point acknowledged', keys: ['downwind', 'will report'], err: 'Acknowledge the report point — "will report downwind"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'A visual approach clearance requires readback of all elements. You are responsible for ensuring you remain in VMC and can see the runway throughout. If you lose sight of the runway, discontinue and inform Tower immediately.',
  },

  {
    id: 'discontinue_visual',
    category: 'tower',
    label: 'Discontinue Visual Approach',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: true,
    situationTemplate: 'You are on downwind at {AERODROME}, cleared for visual approach. You have lost sight of the runway due to deteriorating visibility. Discontinue the approach.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Tower, {CALLSIGN}, discontinuing visual approach, runway not in sight, position downwind, circuit altitude, request instructions.',
    checks: [
      { label: 'Station addressed', keys: ['tower'], err: 'Inform Tower immediately — "{AERODROME} Tower"' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Discontinuing" stated', keys: ['discontinuing', 'abandoning'], err: 'Say "discontinuing visual approach" or "abandoning visual approach"' },
      { label: 'Reason given', keys: ['not in sight', 'lost sight', 'runway'], err: 'Give the reason — "runway not in sight"' },
      { label: 'Position stated', keys: ['downwind', 'position'], err: 'State your position — "position downwind"' },
      { label: 'Instructions requested', keys: ['request', 'instructions'], err: 'Request further instructions from ATC' },
    ],
    teachingNote: 'If you lose sight of the runway during a visual approach, immediately inform Tower with your position, reason, and request instructions. Do not attempt to continue — descending in IMC without an instrument clearance is fatal.',
  },

  {
    id: 'circuit_altitude',
    category: 'tower',
    label: 'Circuit Altitude Clearance',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, climb to circuit altitude one thousand feet, report crosswind.',
    idealResponseTemplate: 'Climb to circuit altitude one thousand feet, wilco report crosswind, {CALLSIGN}.',
    checks: [
      { label: 'Altitude read back', keys: ['one thousand', 'circuit altitude'], err: 'Read back the circuit altitude — "one thousand feet"' },
      { label: '"Wilco" or acknowledgement', keys: ['wilco', 'will report', 'roger'], err: 'Acknowledge the instruction — "wilco report crosswind"' },
      { label: 'Reporting point read back', keys: ['crosswind'], err: 'Read back the reporting point — "crosswind"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: '"Wilco" means "will comply" — use it when acknowledging an instruction you will carry out. It is more informative than "Roger" which only means you received the message.',
  },

  {
    id: 'wind_shear_report',
    category: 'tower',
    label: 'Wind Shear Report',
    difficulty: 'advanced',
    freqType: 'tower',
    pilotInitiated: true,
    situationTemplate: 'You have just landed on runway {RUNWAY} at {AERODROME}. During approach through 700 feet, you experienced moderate wind shear in the approach path. Report it to Tower.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Tower, {CALLSIGN}, wind shear report, time zero niner one five, intensity moderate, height seven hundred feet, runway {RUNWAY} approach path.',
    checks: [
      { label: 'Station addressed', keys: ['tower'], err: 'Report to Tower — "{AERODROME} Tower"' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Wind shear report" stated', keys: ['wind shear'], err: 'Use the phrase "wind shear report"' },
      { label: 'Intensity stated', keys: ['moderate', 'severe', 'light'], err: 'State the intensity — "moderate", "severe", or "light"' },
      { label: 'Height stated', keys: ['feet', 'hundred'], err: 'State the height at which wind shear was encountered' },
      { label: 'Location stated', keys: ['approach', 'runway'], err: 'State the location — "runway {RUNWAY} approach path"' },
    ],
    teachingNote: 'Wind shear reports protect following aircraft. Format: station, callsign, "wind shear report", time, intensity, height, location. ATC will issue a wind shear warning to all subsequent arrivals using your report. Always report — it may save lives.',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // APPROACH — Controlled aerodrome
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'initial_call',
    category: 'approach',
    label: 'Initial Approach Call',
    difficulty: 'basic',
    freqType: 'approach',
    pilotInitiated: true,
    situationTemplate: 'You are 30 NM south of {AERODROME} at 3000 feet, inbound for landing. Make your initial call to {AERODROME} Approach on {APPROACH_FREQ}.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Approach, {CALLSIGN}, Cessna 172, 30 miles south, altitude three thousand feet, VFR, inbound for landing, information {ATIS}.',
    checks: [
      { label: 'Station addressed', keys: ['approach'], err: 'Call "{AERODROME} Approach" — not Tower' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Aircraft type stated', keys: ['cessna', 'aircraft'], err: 'State your aircraft type — "Cessna 172"' },
      { label: 'Position stated', keys: ['miles', 'south', 'north', 'east', 'west', 'nm'], err: 'State your position — "30 miles south"' },
      { label: 'Altitude stated', keys: ['three thousand', 'altitude', 'feet'], err: 'State your altitude — "altitude three thousand feet"' },
      { label: 'Intentions stated', keys: ['inbound', 'landing'], err: 'State your intentions — "inbound for landing"' },
      { label: 'ATIS acknowledged', keys: ['information'], err: 'Confirm you have the ATIS — "information {ATIS}"' },
    ],
    teachingNote: 'The initial approach call is your introduction to Approach Control. Include all elements: station, callsign, aircraft type, position, altitude, flight rules, intentions, and ATIS letter. A complete first call prevents several back-and-forth exchanges and shows professional awareness.',
  },

  {
    id: 'squawk',
    category: 'approach',
    label: 'Squawk Assignment',
    difficulty: 'basic',
    freqType: 'approach',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, squawk four five two one.',
    idealResponseTemplate: 'Squawk four five two one, {CALLSIGN}.',
    checks: [
      { label: 'Squawk code read back digit by digit', keys: ['four five two one', '4521', 'four five'], err: 'Read back the squawk code digit by digit — never as a whole number' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'Squawk codes are always read back digit by digit. A wrong squawk entered in the transponder means ATC may not see you on radar, or may mistake you for another aircraft. Enter the code before reading back to confirm it is correct.',
  },

  {
    id: 'radar_descent',
    category: 'approach',
    label: 'Radar Contact and Descent',
    difficulty: 'intermediate',
    freqType: 'approach',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Approach, radar contact, descend to altitude three thousand feet, QNH {QNH}.',
    idealResponseTemplate: 'Descend altitude three thousand feet, QNH {QNH}, {CALLSIGN}.',
    checks: [
      { label: 'Altitude read back', keys: ['three thousand', 'altitude'], err: 'Read back the cleared altitude — critical for vertical separation' },
      { label: 'QNH read back', keys: ['qnh'], err: 'Read back the QNH' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'Under radar control, always read back the cleared altitude and QNH. "Radar contact" means ATC can see you on their screen — any altitude deviation is immediately visible. Vertical separation depends entirely on readback compliance.',
  },

  {
    id: 'radar_vectors',
    category: 'approach',
    label: 'Radar Vectors to Final',
    difficulty: 'intermediate',
    freqType: 'approach',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, turn right heading two seven zero, descend two thousand feet, reduce speed one six zero knots, expect ILS approach runway {RUNWAY}.',
    idealResponseTemplate: 'Right heading two seven zero, descending two thousand feet, reducing speed one six zero knots, {CALLSIGN}.',
    checks: [
      { label: 'Heading read back', keys: ['two seven zero', 'heading'], err: 'Read back the assigned heading — "heading two seven zero"' },
      { label: 'Altitude read back', keys: ['two thousand', 'descending'], err: 'Read back the altitude — "descending two thousand feet"' },
      { label: 'Speed read back', keys: ['one six zero', 'knots', 'speed'], err: 'Read back the speed — "one six zero knots"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'Multiple instructions in one transmission must all be read back. Read them in the same sequence as given: heading, altitude, speed. During radar vectoring, the controller sequences you for the final approach — fly each heading precisely and report if unable to comply.',
  },

  {
    id: 'ils_established',
    category: 'approach',
    label: 'ILS Localiser Established',
    difficulty: 'intermediate',
    freqType: 'approach',
    pilotInitiated: true,
    situationTemplate: 'You are being radar vectored for an ILS approach to runway {RUNWAY} at {AERODROME}. You have just intercepted and established on the localiser.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Approach, {CALLSIGN}, established on localiser runway {RUNWAY}.',
    checks: [
      { label: 'Station addressed', keys: ['approach'], err: 'Report to Approach — "{AERODROME} Approach"' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Established" stated', keys: ['established'], err: 'Say "established on localiser" — this is the standard phrase' },
      { label: 'Localiser mentioned', keys: ['localiser', 'localizer', 'ils'], err: 'Specify you are on the localiser — "established on localiser"' },
      { label: 'Runway stated', keys: ['runway'], err: 'State the runway — "runway {RUNWAY}"' },
    ],
    teachingNote: 'When you intercept the ILS localiser, report "established on localiser runway {RUNWAY}" to Approach. This triggers the controller to issue landing clearance or further instructions. Until you report established, the controller does not know you have captured the beam.',
  },

  {
    id: 'missed_approach',
    category: 'approach',
    label: 'Missed Approach',
    difficulty: 'advanced',
    freqType: 'approach',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, go around, fly runway heading, climb to three thousand feet, contact Approach on one one niner decimal five.',
    idealResponseTemplate: 'Going around, runway heading, climbing three thousand feet, switching one one niner decimal five, {CALLSIGN}.',
    checks: [
      { label: '"Going around" stated', keys: ['going around'], err: 'Read back "going around" first — this is the priority action' },
      { label: '"Runway heading" read back', keys: ['runway heading'], err: 'Read back "runway heading" — do not turn until established' },
      { label: 'Altitude read back', keys: ['three thousand', 'climbing'], err: 'Read back the climb altitude — "climbing three thousand feet"' },
      { label: 'Frequency acknowledged', keys: ['one one niner', 'switching', '119'], err: 'Acknowledge the frequency change' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'A missed approach is time-critical. Apply full power and read back simultaneously. Fly the assigned missed approach procedure exactly. The controller has already planned your re-sequencing — follow instructions precisely.',
  },

  {
    id: 'holding',
    category: 'approach',
    label: 'Holding Instructions',
    difficulty: 'advanced',
    freqType: 'approach',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, hold at DELTA, inbound track two seven zero, right hand pattern, one minute legs, expect approach in two zero minutes.',
    idealResponseTemplate: 'Holding at DELTA, inbound track two seven zero, right hand pattern, one minute legs, expect approach in two zero minutes, {CALLSIGN}.',
    checks: [
      { label: 'Fix read back', keys: ['delta', 'hold'], err: 'Read back the holding fix — "hold at DELTA"' },
      { label: 'Inbound track read back', keys: ['two seven zero', 'inbound'], err: 'Read back the inbound track — "inbound track two seven zero"' },
      { label: 'Pattern direction read back', keys: ['right hand', 'right-hand'], err: 'Read back the pattern direction — "right hand pattern"' },
      { label: 'Leg time read back', keys: ['one minute', 'minute legs'], err: 'Read back the leg time — "one minute legs"' },
      { label: 'Expect time read back', keys: ['two zero', 'twenty', 'expect'], err: 'Read back the expect approach time — "two zero minutes"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'Holding instructions must be read back in full — all elements are safety-critical. The fix, track, direction, and leg time define the holding pattern geometry. If you miss any element, ATC cannot confirm you will fly the correct pattern, risking conflict with other holding aircraft.',
  },

  {
    id: 'position_report',
    category: 'approach',
    label: 'En-Route Position Report',
    difficulty: 'advanced',
    freqType: 'approach',
    pilotInitiated: true,
    situationTemplate: 'You are en-route, approaching reporting point ALPHA at 1100 UTC, flight level 330. Next fix is BRAVO estimated 1115, then CHARLIE next.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Control, {CALLSIGN}, position, ALPHA one one zero zero, flight level three three zero, estimating BRAVO one one one five, CHARLIE next.',
    checks: [
      { label: 'Station addressed', keys: ['control', 'approach'], err: 'Address the controlling unit — "{AERODROME} Control"' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Position" stated', keys: ['position'], err: 'Use the word "position" to signal a position report' },
      { label: 'Reporting fix stated', keys: ['alpha'], err: 'State the reporting fix name — "ALPHA"' },
      { label: 'Time stated', keys: ['one one zero zero', 'zero zero', 'time'], err: 'State the time over the fix' },
      { label: 'Flight level stated', keys: ['flight level', 'three three zero', 'fl'], err: 'State your flight level — "flight level three three zero"' },
      { label: 'Next fix estimated', keys: ['estimating', 'bravo'], err: 'Estimate the next reporting fix — "estimating BRAVO"' },
    ],
    teachingNote: 'The position report format from ICAO: station, callsign, "position", fix name, time, flight level, estimated next fix with time, fix ensuing. Position reports are mandatory at compulsory reporting points even when in radar contact. They are your lifeline in radar-silent areas.',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // INFORMATION — ATIS and FIS
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'atis_broadcast',
    category: 'information',
    label: 'ATIS — Full Broadcast',
    difficulty: 'basic',
    freqType: 'atis',
    pilotInitiated: false,
    atcCallTemplate: '{AERODROME} Information {ATIS}. Time zero nine three zero. Runway in use {RUNWAY}. Wind two six zero degrees one zero knots. Visibility ten kilometres. Scattered at two thousand five hundred. Temperature two eight, dewpoint two two. QNH {QNH}. NOSIG. Advise on first contact you have information {ATIS}.',
    idealResponseTemplate: '{AERODROME} Ground, {CALLSIGN}, request taxi, runway {RUNWAY}, information {ATIS}.',
    checks: [
      { label: 'Ground called correctly', keys: ['ground'], err: 'After ATIS, call "{AERODROME} Ground" for taxi' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Request stated', keys: ['taxi', 'request'], err: 'State your request — "request taxi"' },
      { label: 'ATIS letter confirmed', keys: ['information'], err: 'Always confirm the ATIS letter — "information {ATIS}"' },
    ],
    teachingNote: 'Copy the ATIS on the ATIS frequency BEFORE calling Ground. Write down: runway, wind, visibility, cloud, temp, dewpoint, QNH, and the information letter. Confirming the ATIS letter in your first call saves time and tells ATC you have the current QNH set.',
  },

  {
    id: 'fis_position',
    category: 'information',
    label: 'FIS Position Report',
    difficulty: 'intermediate',
    freqType: 'approach',
    pilotInitiated: true,
    situationTemplate: 'You are flying VFR in uncontrolled airspace, 20 miles north of {AERODROME} at 4000 feet. Contact {AERODROME} Information for a FIS (Flight Information Service) position report.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Information, {CALLSIGN}, Cessna 172, 20 miles north, altitude four thousand feet, VFR, destination {AERODROME}, request FIS.',
    checks: [
      { label: '"Information" addressed', keys: ['information'], err: 'Call "{AERODROME} Information" for FIS — not Tower or Approach' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Aircraft type stated', keys: ['cessna', 'aircraft'], err: 'State your aircraft type' },
      { label: 'Position stated', keys: ['miles', 'north', 'south', 'east', 'west'], err: 'State your position — "20 miles north"' },
      { label: 'Altitude stated', keys: ['four thousand', 'altitude', 'feet'], err: 'State your altitude' },
      { label: 'FIS requested', keys: ['fis', 'information service', 'request'], err: 'Request FIS — "request FIS" or "request Flight Information Service"' },
    ],
    teachingNote: 'FIS (Flight Information Service) is available in uncontrolled airspace. The provider gives traffic information, weather, and aerodrome information, but does NOT issue clearances or provide separation. You remain responsible for collision avoidance under VFR.',
  },

  {
    id: 'traffic_information',
    category: 'information',
    label: 'Traffic Information',
    difficulty: 'intermediate',
    freqType: 'approach',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, traffic information, a Cessna 152 at your two o\'clock, five miles, altitude two thousand five hundred feet, north-bound, VFR.',
    idealResponseTemplate: 'Traffic in sight, {CALLSIGN}.',
    checks: [
      { label: 'Traffic sighting confirmed', keys: ['traffic in sight', 'in sight', 'visual', 'tally'], err: 'Confirm traffic in sight — or say "traffic not in sight" so ATC can assist' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
    ],
    teachingNote: 'When given traffic information, look for the traffic and respond with either "traffic in sight" or "traffic not in sight". If not in sight, ATC will advise further. Once you have the traffic in sight, you become responsible for maintaining separation from that aircraft.',
  },

  {
    id: 'monitor_atis',
    category: 'information',
    label: 'Monitor ATIS Frequency',
    difficulty: 'basic',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, monitor ATIS on one two six decimal three five zero, advise on next contact.',
    idealResponseTemplate: 'Monitoring ATIS one two six decimal three five zero, {CALLSIGN}.',
    checks: [
      { label: 'ATIS frequency read back', keys: ['one two six', '126', 'monitoring'], err: 'Read back the ATIS frequency' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: '"Monitor" means listen only — do not transmit on that frequency. Copy the ATIS information letter and QNH, then report the letter on your next contact with ATC. This is different from "contact" which requires you to establish two-way communication.',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // EMERGENCY
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: 'pan_pan_fuel',
    category: 'emergency',
    label: 'PAN-PAN — Low Fuel',
    difficulty: 'intermediate',
    freqType: 'emergency',
    pilotInitiated: true,
    situationTemplate: 'You are 40 minutes from {AERODROME}. Fuel endurance: 35 minutes. {POB} person(s) on board. Declare urgency on 121.5 MHz.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'PAN PAN, PAN PAN, PAN PAN, {AERODROME} Approach, {CALLSIGN}, low fuel, endurance three five minutes, {POB} persons on board, request immediate return {AERODROME}.',
    checks: [
      { label: '"PAN PAN" spoken three times', keys: ['pan pan'], tripleKey: 'pan pan', err: 'PAN-PAN must be spoken exactly three times: "PAN PAN, PAN PAN, PAN PAN"' },
      { label: 'Station addressed', keys: ['approach', 'control'], err: 'Address the ATC station — "{AERODROME} Approach"' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign after the station' },
      { label: 'Nature of urgency stated', keys: ['fuel', 'low fuel', 'endurance'], err: 'State the nature of urgency — "low fuel"' },
      { label: 'Endurance stated', keys: ['three five', '35', 'endurance'], err: 'State fuel endurance in minutes — "endurance three five minutes"' },
      { label: 'Persons on board stated', keys: ['persons', 'pob', 'souls', 'person'], err: 'State persons on board — critical for emergency services' },
      { label: 'Intentions stated', keys: ['return', 'land', 'immediate', 'request'], err: 'State your intentions — "request immediate return"' },
    ],
    teachingNote: 'PAN-PAN is an urgency call — not yet life-threatening but potentially serious. Squawk 7700. Format: PAN PAN × 3, station, callsign, nature, endurance, POB, intentions. Transmit on the frequency in use — switch to 121.5 MHz only if asked.',
  },

  {
    id: 'pan_pan_full',
    category: 'emergency',
    label: 'PAN-PAN — Full Format',
    difficulty: 'advanced',
    freqType: 'emergency',
    pilotInitiated: true,
    situationTemplate: 'You are 15 miles north of {AERODROME} at 3000 feet. One passenger is seriously ill. Fuel endurance {FUEL}. {POB} persons on board including crew. Declare urgency on the frequency in use.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'PAN PAN, PAN PAN, PAN PAN, {AERODROME} Approach, {CALLSIGN}, Cessna 172, medical emergency, passenger seriously ill, position 15 miles north, altitude three thousand feet, endurance {FUEL}, {POB} persons on board, request priority landing.',
    checks: [
      { label: '"PAN PAN" three times', keys: ['pan pan'], tripleKey: 'pan pan', err: 'PAN-PAN must be spoken exactly three times' },
      { label: 'Station addressed', keys: ['approach', 'control', 'tower'], err: 'Address the controlling unit' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Aircraft type stated', keys: ['cessna', 'aircraft', 'type'], err: 'State your aircraft type — "Cessna 172"' },
      { label: 'Nature of urgency stated', keys: ['medical', 'ill', 'emergency'], err: 'State the nature of urgency — "medical emergency, passenger seriously ill"' },
      { label: 'Position stated', keys: ['miles', 'north', 'south', 'east', 'west'], err: 'State your position — "15 miles north"' },
      { label: 'Altitude stated', keys: ['three thousand', 'altitude'], err: 'State your altitude' },
      { label: 'Endurance stated', keys: ['endurance', 'fuel'], err: 'State fuel endurance' },
      { label: 'Persons on board stated', keys: ['persons', 'pob', 'souls'], err: 'State persons on board — critical for emergency services' },
      { label: 'Intentions stated', keys: ['priority', 'landing', 'request'], err: 'State your intentions — "request priority landing"' },
    ],
    teachingNote: 'Full PAN-PAN format: PAN PAN × 3, station, callsign, type, nature of urgency, position, altitude, endurance, POB, intentions. A medical PAN-PAN gets priority handling from ATC. Ambulance, fire, and medical services are notified. Squawk 7700 simultaneously.',
  },

  {
    id: 'mayday_engine',
    category: 'emergency',
    label: 'MAYDAY — Engine Failure',
    difficulty: 'advanced',
    freqType: 'emergency',
    pilotInitiated: true,
    situationTemplate: 'Engine failure at 3500 ft, 15 miles from {AERODROME}. {POB} person(s) on board. You are gliding and have selected a forced landing field. Declare MAYDAY on 121.5 MHz.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'MAYDAY MAYDAY MAYDAY, {AERODROME} Approach, {CALLSIGN}, engine failure, altitude three thousand five hundred feet, 15 miles from {AERODROME}, {POB} persons on board, landing in field.',
    checks: [
      { label: '"MAYDAY" spoken three times', keys: ['mayday'], tripleKey: 'mayday', err: 'MAYDAY must be spoken exactly three times: "MAYDAY MAYDAY MAYDAY"' },
      { label: 'Station addressed', keys: ['approach', 'control', 'tower'], err: 'Address ATC — "{AERODROME} Approach" or nearest station' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Engine failure stated', keys: ['engine', 'engine failure'], err: 'State the nature of distress — "engine failure"' },
      { label: 'Altitude stated', keys: ['three thousand five hundred', 'altitude', 'feet'], err: 'State your current altitude' },
      { label: 'Position stated', keys: ['miles', 'south', 'north', 'east', 'west'], err: 'State your position relative to a known point' },
      { label: 'Persons on board stated', keys: ['persons', 'pob', 'souls', 'person'], err: 'State persons on board' },
      { label: 'Intentions stated', keys: ['field', 'landing', 'forced', 'glide'], err: 'State your intention — "landing in field"' },
    ],
    teachingNote: 'MAYDAY is a distress call — immediate danger to life. Squawk 7700, then transmit. After the call, ATC clears all traffic and gives you absolute priority. Fly the aircraft first — a good transmission is useless if you lose control. Keep transmissions short.',
  },

  {
    id: 'mayday_decompression',
    category: 'emergency',
    label: 'MAYDAY — Cabin Decompression',
    difficulty: 'advanced',
    freqType: 'emergency',
    pilotInitiated: true,
    situationTemplate: 'You are at flight level 330, experiencing cabin decompression. {POB} persons on board including crew. Fuel endurance {FUEL}. Declare MAYDAY and request immediate descent.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'MAYDAY MAYDAY MAYDAY, {AERODROME} Control, {CALLSIGN}, Cessna 172, experiencing decompression, flight level three three zero, request immediate descent flight level nine zero, {POB} persons on board, endurance {FUEL}.',
    checks: [
      { label: '"MAYDAY" three times', keys: ['mayday'], tripleKey: 'mayday', err: 'MAYDAY must be spoken exactly three times' },
      { label: 'Station addressed', keys: ['control', 'approach'], err: 'Address the controlling unit' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Nature stated', keys: ['decompression', 'pressure'], err: 'State the nature of emergency — "decompression"' },
      { label: 'Flight level stated', keys: ['flight level', 'three three zero'], err: 'State your current flight level' },
      { label: 'Descent requested', keys: ['descent', 'descend', 'request'], err: 'Request immediate descent — "request immediate descent"' },
      { label: 'POB stated', keys: ['persons', 'pob', 'souls'], err: 'State persons on board' },
    ],
    teachingNote: 'Cabin decompression at altitude is an immediate threat to life — hypoxia occurs within seconds above FL250. Initiate emergency descent immediately while transmitting. Aim for FL100 or below (oxygen levels safe for unassisted breathing). Squawk 7700.',
  },

  {
    id: 'mayday_fire',
    category: 'emergency',
    label: 'MAYDAY — Engine Fire',
    difficulty: 'advanced',
    freqType: 'emergency',
    pilotInitiated: true,
    situationTemplate: 'You are en-route at 4000 feet, 10 minutes from {AERODROME}. Your left engine is on fire. {POB} persons on board. Endurance {FUEL}. Intend to make a force landing at {AERODROME}.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'MAYDAY MAYDAY MAYDAY, {AERODROME} Tower, {CALLSIGN}, engine on fire, altitude four thousand feet, 10 miles from {AERODROME}, estimating {AERODROME} in one zero minutes, request force landing, {POB} persons on board, endurance {FUEL}.',
    checks: [
      { label: '"MAYDAY" three times', keys: ['mayday'], tripleKey: 'mayday', err: 'MAYDAY must be spoken exactly three times' },
      { label: 'Station addressed', keys: ['tower', 'control', 'approach'], err: 'Address the nearest ATC unit' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Nature stated', keys: ['fire', 'engine on fire', 'engine'], err: 'State the nature — "engine on fire"' },
      { label: 'Altitude stated', keys: ['four thousand', 'altitude'], err: 'State your altitude' },
      { label: 'Position stated', keys: ['miles', 'from'], err: 'State your position — distance from {AERODROME}' },
      { label: 'Intentions stated', keys: ['force landing', 'landing', 'request'], err: 'State intentions — "request force landing"' },
      { label: 'POB stated', keys: ['persons', 'pob', 'souls'], err: 'State persons on board' },
    ],
    teachingNote: 'Engine fire requires immediate action — fuel shutoff, fire extinguisher, forced landing planning. Transmit MAYDAY simultaneously with the fire drills. Include: nature, position, altitude, estimate to landing, POB, and endurance. ATC will alert airport emergency services.',
  },

  {
    id: 'emergency_cancel',
    category: 'emergency',
    label: 'Cancel Emergency',
    difficulty: 'intermediate',
    freqType: 'emergency',
    pilotInitiated: true,
    situationTemplate: 'You previously declared a PAN-PAN for low fuel. You have now landed safely at {AERODROME}. Cancel the emergency.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Tower, {CALLSIGN}, cancel PAN-PAN, landed {AERODROME}, all persons safe.',
    checks: [
      { label: 'Station addressed', keys: ['tower', 'approach', 'control'], err: 'Address the station that handled your emergency' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Cancel" stated', keys: ['cancel'], err: 'Say "cancel PAN-PAN" or "cancel MAYDAY" explicitly — ATC needs confirmation the emergency is over' },
      { label: 'Emergency type stated', keys: ['pan pan', 'mayday', 'emergency'], err: 'State which emergency is being cancelled — "cancel PAN-PAN"' },
      { label: 'Persons safe stated', keys: ['safe', 'all safe', 'persons safe'], err: 'Confirm all persons are safe — "all persons safe"' },
    ],
    teachingNote: 'Always cancel your emergency declaration once the situation is resolved. ATC keeps emergency services on standby until cancellation is received. Format: "cancel PAN-PAN/MAYDAY, all persons safe." Failure to cancel wastes emergency resources and keeps the frequency congested.',
  },

  {
    id: 'mayday_relay',
    category: 'emergency',
    label: 'MAYDAY Relay',
    difficulty: 'advanced',
    freqType: 'emergency',
    pilotInitiated: true,
    situationTemplate: 'You have received a MAYDAY call from VT-RJX (Cessna, engine failure, 50 miles north of {AERODROME}, altitude 3000 feet, 2 POB). You cannot establish contact with ATC. Relay the MAYDAY.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'MAYDAY MAYDAY MAYDAY, {AERODROME} Approach, {CALLSIGN}, MAYDAY relay, VT-RJX, Cessna, engine failure, position 50 miles north {AERODROME}, altitude three thousand feet, 2 persons on board.',
    checks: [
      { label: '"MAYDAY" three times', keys: ['mayday'], tripleKey: 'mayday', err: 'MAYDAY relay also begins with MAYDAY spoken three times' },
      { label: '"MAYDAY relay" stated', keys: ['mayday relay', 'relay'], err: 'Say "MAYDAY relay" to indicate you are relaying for another aircraft' },
      { label: 'Aircraft in distress stated', keys: ['vt-', 'victor tango', 'rjx'], err: 'State the callsign of the aircraft in distress — VT-RJX' },
      { label: 'Nature of emergency', keys: ['engine failure', 'engine'], err: 'Relay the nature of the emergency — "engine failure"' },
      { label: 'Position relayed', keys: ['miles', 'north', 'position'], err: 'Relay the position — "50 miles north"' },
      { label: 'Altitude relayed', keys: ['three thousand', 'altitude'], err: 'Relay the altitude' },
      { label: 'POB relayed', keys: ['persons', 'two', '2', 'pob'], err: 'Relay persons on board' },
    ],
    teachingNote: 'A MAYDAY relay is transmitted when an aircraft in distress cannot contact ATC directly. Use the full MAYDAY format but add "MAYDAY relay" and relay all information exactly as received. Your callsign goes after the station — you are identifying as the relay source.',
  },

  {
    id: 'engine_failure_takeoff',
    category: 'emergency',
    label: 'Engine Failure After Takeoff',
    difficulty: 'advanced',
    freqType: 'tower',
    pilotInitiated: true,
    situationTemplate: 'You have just taken off from runway {RUNWAY} at {AERODROME}. At 400 feet the engine fails. You intend to land straight ahead. You have time for one brief transmission.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: '{AERODROME} Tower, {CALLSIGN}, engine failure, landing straight ahead.',
    checks: [
      { label: 'Station addressed', keys: ['tower'], err: 'Inform Tower — "{AERODROME} Tower"' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Engine failure stated', keys: ['engine failure', 'engine'], err: 'State the emergency — "engine failure"' },
      { label: 'Intentions stated', keys: ['straight ahead', 'landing', 'ahead'], err: 'State your intention — "landing straight ahead"' },
    ],
    teachingNote: 'Engine failure after takeoff — aviate first, communicate second. The critical actions are: maintain airspeed, do NOT turn back (below 1000ft the "impossible turn" is fatal), land straight ahead. Your radio call is 7 words. Do not attempt a long MAYDAY — fly the aircraft.',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // UNCONTROLLED — VADN Dhule, Bombay Flying Club
  //
  // Real RT sequence verified against student pilot notes (April 2026).
  // Frequency: 123.450 MHz. Station: "Dhule Tower" (AFISO operated).
  // No VOR, NDB, ILS, or approach radar.
  // Two sectors: North and South only.
  // ════════════════════════════════════════════════════════════════════════════

  {
    // FIX 1: ATC response is "read you fine, go ahead" — not "loud and clear"
    id: 'vadn_radio_check',
    category: 'uncontrolled',
    label: 'Radio Check',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, read you fine, go ahead.',
    idealResponseTemplate: 'Read you fine, go ahead, {CALLSIGN}.',
    checks: [
      { label: '"Read you fine" stated', keys: ['read you fine', 'fine'], err: 'Respond with "read you fine" — the standard at Dhule, not "loud and clear"' },
      { label: '"Go ahead" acknowledged', keys: ['go ahead'], err: 'Acknowledge "go ahead" — this means the AFISO is ready for your next call' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'Before engine start, call: "Dhule Tower, VT-___, how do you read?" The AFISO responds "VT-___, read you fine, go ahead." Acknowledge and proceed with your startup call. At Dhule the phrase is "read you fine" — not "loud and clear" used at controlled aerodromes.',
  },

  {
    // FIX 2: ATC says "information copied. Startup Approved." Pilot reads back just "Startup Approved"
    id: 'vadn_startup',
    category: 'uncontrolled',
    label: 'Startup Request',
    difficulty: 'intermediate',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'Radio check complete. AFISO said "go ahead." Request startup for general flying on Dhule Tower 123.450 MHz.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'Dhule Tower, {CALLSIGN}, request startup for general flying, PIC Captain {CAPTAIN}, Trainee {TRAINEE}, endurance {ENDURANCE}, duration {DURATION}, through security checks.',
    checks: [
      { label: '"Dhule Tower" called', keys: ['dhule tower', 'tower'], err: 'Address Dhule Tower specifically' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"General flying" stated', keys: ['general flying'], err: 'State the purpose — "general flying"' },
      { label: '"PIC Captain" stated', keys: ['captain', 'pic'], err: 'State PIC — "PIC Captain {CAPTAIN}"' },
      { label: 'Trainee name stated', keys: ['trainee'], err: 'State the trainee name — "Trainee {TRAINEE}"' },
      { label: 'Endurance stated', keys: ['endurance'], err: 'State fuel endurance — "endurance {ENDURANCE}"' },
      { label: 'Duration stated', keys: ['duration'], err: 'State planned duration — "duration {DURATION}"' },
      { label: '"Security checks" stated', keys: ['security'], err: '"Through security checks" is mandatory in Indian GA — always include it' },
    ],
    teachingNote: 'The AFISO responds: "VT-___, information copied. Startup Approved." Your readback is simply: "Startup Approved, VT-___." Do NOT repeat back the full startup details — only acknowledge the approval.',
  },

  {
    // Startup approval readback — new step from notes
    id: 'vadn_startup_readback',
    category: 'uncontrolled',
    label: 'Startup Approval Readback',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, information copied. Startup Approved.',
    idealResponseTemplate: 'Startup Approved, {CALLSIGN}.',
    checks: [
      { label: '"Startup Approved" read back', keys: ['startup approved', 'start up approved'], err: 'Read back "Startup Approved" — the key clearance element' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'After the AFISO says "information copied. Startup Approved." your readback is short and simple: "Startup Approved, VT-___." You do not repeat back the full information — just acknowledge the clearance.',
  },

  {
    // FIX 3: "requesting taxiway" not "requesting taxi"
    id: 'vadn_taxi_request',
    category: 'uncontrolled',
    label: 'Taxi Request',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'Engine running. Ready to move from parking. Request taxi to the holding point on Dhule Tower 123.450.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'Dhule Tower, {CALLSIGN}, requesting taxiway.',
    checks: [
      { label: '"Dhule Tower" called', keys: ['dhule tower', 'tower'], err: 'Call "Dhule Tower" first' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Requesting taxiway" stated', keys: ['requesting taxiway', 'taxiway'], err: 'Say "requesting taxiway" — not "request taxi" which is the controlled aerodrome format' },
    ],
    teachingNote: 'At Dhule, the taxi request uses the phrase "requesting taxiway" — not the controlled aerodrome format "request taxi." The AFISO then responds: "VT-___, taxi to runway {RUNWAY} holding position."',
  },

  {
    id: 'vadn_taxi',
    category: 'uncontrolled',
    label: 'Taxi Clearance Readback',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, taxi to runway {RUNWAY} holding position.',
    idealResponseTemplate: 'Taxi to runway {RUNWAY} holding position, {CALLSIGN}.',
    checks: [
      { label: '"Taxi" read back', keys: ['taxi'], err: 'Read back "taxi to runway holding position"' },
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway — "runway {RUNWAY}"' },
      { label: '"Holding position" stated', keys: ['holding position', 'holding point'], err: 'Read back "holding position"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'Note: Dhule AFISO uses "holding position" — at controlled aerodromes you may hear "holding point". Both mean the same thing — the designated spot before the runway where you stop and await further clearance.',
  },

  {
    // Line-up — pilot requests first (pilot initiated)
    id: 'vadn_lineup_request',
    category: 'uncontrolled',
    label: 'Line-Up Request',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'You are at the runway {RUNWAY} holding position. Request line-up.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'Dhule Tower, {CALLSIGN}, requesting lineup.',
    checks: [
      { label: '"Dhule Tower" called', keys: ['dhule tower', 'tower'], err: 'Call "Dhule Tower" first' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Requesting lineup" stated', keys: ['requesting lineup', 'lineup', 'line up'], err: 'Say "requesting lineup"' },
    ],
    teachingNote: 'Before entering the runway, always request lineup. The AFISO responds "VT-___, lineup on R/W {RUNWAY}." You then read it back as "Lining up runway {RUNWAY}, VT-___." Never enter the runway without this clearance.',
  },

  {
    // Line-up readback — ATC gives, pilot reads back
    id: 'vadn_lineup',
    category: 'uncontrolled',
    label: 'Line-Up Readback',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, lineup on runway {RUNWAY}.',
    idealResponseTemplate: 'Lining up runway {RUNWAY}, {CALLSIGN}.',
    checks: [
      { label: '"Lining up" stated', keys: ['lining up'], err: 'Say "lining up" as you enter the runway' },
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway — "runway {RUNWAY}"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'Read back with "lining up" (present continuous) — this tells the AFISO you are actively entering the runway now. Note the Dhule format: no "and wait" — at an uncontrolled aerodrome you line up and immediately become ready for departure.',
  },

  {
    id: 'vadn_takeoff',
    category: 'uncontrolled',
    label: 'Takeoff Clearance Readback',
    difficulty: 'intermediate',
    freqType: 'ctaf',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, clear take-off runway {RUNWAY}.',
    idealResponseTemplate: 'Clear take-off runway {RUNWAY}, {CALLSIGN}.',
    checks: [
      { label: '"Clear take-off" read back', keys: ['clear take-off', 'clear takeoff', 'clear take off'], err: 'Read back "clear take-off" verbatim — the Dhule AFISO format' },
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway — "runway {RUNWAY}"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'After lining up, state: "Dhule Tower, VT-___, ready for departure." The AFISO responds "clear take-off runway {RUNWAY}." At VADN the phrase is "clear take-off" — not "cleared for takeoff" used at controlled aerodromes. Read it back exactly.',
  },

  {
    // Pilot tells AFISO they are climbing to circuit altitude and will call when in sector
    id: 'vadn_circuit_altitude',
    category: 'uncontrolled',
    label: 'Clear to Circuit Altitude',
    difficulty: 'intermediate',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'You have taken off from runway {RUNWAY} and are climbing. Report your status to Dhule Tower — you are clear to circuit altitude and will call when in sector {SECTOR}.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'Dhule Tower, {CALLSIGN}, clear to circuit altitude, will call you when in sector {SECTOR}.',
    checks: [
      { label: '"Dhule Tower" called', keys: ['dhule tower', 'tower'], err: 'Address Dhule Tower' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Clear to circuit altitude" stated', keys: ['circuit altitude', 'clear to circuit'], err: 'State "clear to circuit altitude" to confirm your climb status' },
      { label: '"Will call you when in sector" stated', keys: ['will call', 'sector'], err: 'State which sector you will call from — "will call you when in sector {SECTOR}"' },
      { label: 'Sector direction stated', keys: ['north', 'south'], err: 'State the sector — North or South' },
    ],
    teachingNote: 'After takeoff at Dhule, YOU initiate this call — the AFISO does not prompt you. Say: "Dhule Tower, VT-___, clear to circuit altitude, will call you when in sector {SECTOR}." The AFISO responds "VT-___, Roger." Circuit altitude at VADN is 3500 feet AMSL.',
  },

  {
    id: 'vadn_sector_established',
    category: 'uncontrolled',
    label: 'Sector Established Report',
    difficulty: 'intermediate',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'You are airborne and established in Sector {SECTOR} at 3500 feet, 5 nautical miles from Dhule.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'Dhule Tower, {CALLSIGN}, sector {SECTOR} established, 3500 feet, 5 nautical miles, all ops normal.',
    checks: [
      { label: '"Dhule Tower" called', keys: ['dhule tower', 'tower'], err: 'Call "Dhule Tower" to initiate the report' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Sector stated', keys: ['sector'], err: 'State the sector — "sector {SECTOR}"' },
      { label: 'Sector direction stated', keys: ['north', 'south'], err: 'State the sector direction — North or South' },
      { label: '"Established" stated', keys: ['established'], err: 'Say "established" to confirm you are in the sector' },
      { label: 'Altitude stated', keys: ['three thousand five hundred', '3500', 'feet'], err: 'State your altitude — "3500 feet"' },
      { label: 'Distance stated', keys: ['five nautical', 'nautical miles', '5'], err: 'State your distance — "5 nautical miles"' },
      { label: '"All ops normal" stated', keys: ['ops normal', 'all ops'], err: 'State "all ops normal" to confirm no problems' },
    ],
    teachingNote: 'Once established in your sector, report to Dhule Tower with your sector, altitude, distance, and ops status. This is your first airborne report after departure. The AFISO logs your sector and time — this is the reference point for your subsequent 15-minute reports.',
  },

  {
    // FIX 6: New scenario — ATC instructs 15-min reporting, pilot reads back
    id: 'vadn_ops_normal_instruction',
    category: 'uncontrolled',
    label: '15-Min Report Instruction',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, report all ops normal every 15 minutes.',
    idealResponseTemplate: 'Report all ops normal every 15 minutes, {CALLSIGN}.',
    checks: [
      { label: '"Report all ops normal" read back', keys: ['report all ops normal', 'ops normal', 'all ops'], err: 'Read back "report all ops normal"' },
      { label: '"Every 15 minutes" read back', keys: ['15 minutes', 'fifteen minutes', 'every'], err: 'Read back the reporting interval — "every 15 minutes"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'After you report sector established, the AFISO instructs you to report ops normal every 15 minutes. Read back the full instruction. This is the AFISO\'s only way to track your safety — there is no radar at Dhule. Missing a 15-minute report will prompt the AFISO to contact you.',
  },

  {
    id: 'vadn_position_report',
    category: 'uncontrolled',
    label: '15-Minute Position Report',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: '15 minutes have passed since your last report. You are still in Sector {SECTOR} at 3500 feet. Make your routine position report.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'Dhule Tower, {CALLSIGN}, sector {SECTOR}, 3500 feet, all ops normal.',
    checks: [
      { label: '"Dhule Tower" called', keys: ['dhule tower', 'tower'], err: 'Call "Dhule Tower" for every position report' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Sector stated', keys: ['sector'], err: 'State the sector — "sector {SECTOR}"' },
      { label: 'Sector direction stated', keys: ['north', 'south'], err: 'State the sector direction — North or South' },
      { label: 'Altitude stated', keys: ['three thousand five hundred', '3500', 'feet'], err: 'State your altitude — "3500 feet"' },
      { label: '"All ops normal" stated', keys: ['ops normal', 'all ops'], err: 'State "all ops normal" to confirm everything is fine' },
    ],
    teachingNote: 'At Dhule, report every 15 minutes while airborne. Format: tower, callsign, sector, altitude, ops status. If you miss a report, the AFISO will call you. If no response, they will initiate an alert. This 15-minute reporting is your lifeline — there is no radar.',
  },

  {
    // Rejoin request — pilot initiated
    id: 'vadn_rejoin_request',
    category: 'uncontrolled',
    label: 'Sector Rejoin Request',
    difficulty: 'intermediate',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'You are in Sector {SECTOR} at 3500 feet, 5 to 7 NM out from Dhule. Request rejoin.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'Dhule Tower, {CALLSIGN}, sector {SECTOR}, 3500 feet, 5 nautical miles out, requesting rejoin.',
    checks: [
      { label: '"Dhule Tower" called', keys: ['dhule tower', 'tower'], err: 'Call "Dhule Tower" to request rejoin' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: 'Sector stated', keys: ['sector'], err: 'State your sector — "sector {SECTOR}"' },
      { label: 'Sector direction stated', keys: ['north', 'south'], err: 'State the sector direction — North or South' },
      { label: 'Altitude stated', keys: ['3500', 'three thousand five hundred', 'feet'], err: 'State your altitude — "3500 feet"' },
      { label: 'Distance stated', keys: ['nautical miles', 'miles', 'out'], err: 'State your distance from the aerodrome' },
      { label: '"Requesting rejoin" stated', keys: ['requesting rejoin', 'rejoin'], err: 'State "requesting rejoin"' },
    ],
    teachingNote: 'When ready to return, make a rejoin request including your sector, altitude, and distance. This tells the AFISO your current position so they can sequence you safely with any other circuit traffic. Typical distance at Dhule is 5 to 7 NM.',
  },

  {
    // FIX 5: ATC says "report deadside" (imperative) not "will report"
    id: 'vadn_rejoin',
    category: 'uncontrolled',
    label: 'Rejoin Clearance Readback',
    difficulty: 'advanced',
    freqType: 'ctaf',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, clear rejoin, report deadside runway {RUNWAY} at 3500 feet.',
    idealResponseTemplate: 'Clear rejoin, will report deadside runway {RUNWAY} at 3500 feet, {CALLSIGN}.',
    checks: [
      { label: '"Clear rejoin" read back', keys: ['clear rejoin'], err: 'Read back "clear rejoin"' },
      { label: '"Will report" stated', keys: ['will report'], err: 'Say "will report" in your readback — you are committing to call when on deadside' },
      { label: '"Deadside" stated', keys: ['deadside', 'dead side'], err: 'Acknowledge "deadside" — confirm you understand where to report from' },
      { label: 'Runway read back', keys: ['runway'], err: 'Read back the runway — "runway {RUNWAY}"' },
      { label: 'Altitude read back', keys: ['three thousand five hundred', '3500', 'feet'], err: 'Read back the altitude — "3500 feet"' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt'], err: 'End with your callsign' },
    ],
    teachingNote: 'The AFISO says "report deadside" (a command). Your readback converts this to "will report deadside" (a commitment). This is standard RT — ATC gives an instruction, you read it back as an undertaking you will carry out.',
  },

  {
    id: 'vadn_dead_side',
    category: 'uncontrolled',
    label: 'Dead Side Report',
    difficulty: 'advanced',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'You have been cleared to rejoin. You are now on the dead side of runway {RUNWAY} at 3500 feet.',
    atcCallTemplate: EMPTY_STRING,
    idealResponseTemplate: 'Dhule Tower, {CALLSIGN}, deadside runway {RUNWAY}, 3500 feet.',
    checks: [
      { label: '"Dhule Tower" called', keys: ['dhule tower', 'tower'], err: 'Report to Dhule Tower' },
      { label: 'Callsign stated', keys: ['victor tango', 'vt'], err: 'State your callsign' },
      { label: '"Deadside" stated', keys: ['deadside', 'dead side'], err: 'State "deadside" to confirm your position' },
      { label: 'Runway stated', keys: ['runway'], err: 'State the runway — "runway {RUNWAY}"' },
      { label: 'Altitude stated', keys: ['three thousand five hundred', '3500', 'feet'], err: 'State your altitude — "3500 feet"' },
    ],
    teachingNote: 'The dead side report confirms you are overhead the non-circuit side before descending to join the circuit. After this call, the AFISO will instruct you to report final. Descend to circuit height on the dead side, cross the upwind end, and join downwind.',
  },

];

// ── Categories ────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'ground', label: 'Ground', color: '#39ff14', description: 'Startup, taxi, pre-departure' },
  { id: 'tower', label: 'Tower', color: '#58a6ff', description: 'Takeoff, circuit, landing' },
  { id: 'approach', label: 'Approach', color: '#f0a030', description: 'Radar, ILS, descent' },
  { id: 'emergency', label: 'Emergency', color: '#f85149', description: 'PAN-PAN, MAYDAY' },
  { id: 'information', label: 'Information', color: '#7ec87e', description: 'ATIS, FIS, traffic' },
  { id: 'uncontrolled', label: 'Uncontrolled', color: '#c084fc', description: 'VADN Dhule — BFC format' },
] as const;

// ── Freq / squawk maps ────────────────────────────────────────────────────────

const FREQ_TYPE_MAP: Record<string, keyof Aerodrome> = {
  ground: 'groundFreq',
  tower: 'towerFreq',
  approach: 'approachFreq',
  atis: 'atisFreq',
  emergency: 'emergencyFreq',
  ctaf: 'ctafFreq',
};

const DEFAULT_SQUAWK_BY_FREQ_TYPE: Record<string, string> = {
  ground: '7000',
  tower: '7000',
  approach: '4521',
  atis: '7000',
  emergency: '7700',
  ctaf: '7000',
};

const EMERGENCY_FREQ = '121.500';
const FALLBACK_CTAF = '122.800';
const FALLBACK_FREQ = '118.100';

// ── resolveScenario ───────────────────────────────────────────────────────────

export const resolveScenario = (
  template: ScenarioTemplate,
  callsign: string,
  aerodrome: Aerodrome,
  traineeName: string = 'Trainee',
) => {
  const phoneticCallsign = callsignToPhonetic(callsign);
  const randomRunway = pickRandom(aerodrome.runways);
  const randomQnh = `${pickRandomQnh()}`;
  const randomAtisLetter = pickRandom(ATIS_LETTERS);
  const randomSector = pickRandom(SECTOR_DIRECTIONS);
  const randomCaptain = pickRandomCaptain();
  const randomEndurance = pickRandom(ENDURANCE_OPTIONS);
  const randomDuration = pickRandom(DURATION_OPTIONS);
  const randomPob = `${pickRandom(POB_OPTIONS)}`;
  const randomFuel = pickRandom(FUEL_ENDURANCE_OPTIONS);
  const traineeFirstName = traineeName.split(' ')[0] || 'Trainee';

  const resolveTokens = (templateString: string): string => {
    return templateString
      .replace(/{CALLSIGN}/g, phoneticCallsign)
      .replace(/{AERODROME}/g, aerodrome.atcName)
      .replace(/{RUNWAY}/g, randomRunway)
      .replace(/{QNH}/g, randomQnh)
      .replace(/{ATIS}/g, randomAtisLetter)
      .replace(/{ATIS_LETTER}/g, randomAtisLetter)
      .replace(/{GROUND_FREQ}/g, aerodrome.groundFreq)
      .replace(/{APPROACH_FREQ}/g, aerodrome.approachFreq)
      .replace(/{CTAF_FREQ}/g, aerodrome.ctafFreq ?? FALLBACK_CTAF)
      .replace(/{CAPTAIN}/g, randomCaptain)
      .replace(/{TRAINEE}/g, traineeFirstName)
      .replace(/{SECTOR}/g, randomSector)
      .replace(/{ENDURANCE}/g, randomEndurance)
      .replace(/{DURATION}/g, randomDuration)
      .replace(/{POB}/g, randomPob)
      .replace(/{FUEL}/g, randomFuel);
  };

  const freqKey = FREQ_TYPE_MAP[template.freqType];
  const resolvedFreq = template.freqType === 'emergency'
    ? EMERGENCY_FREQ
    : template.freqType === 'ctaf'
      ? (aerodrome.ctafFreq ?? FALLBACK_CTAF)
      : freqKey
        ? (aerodrome[freqKey] as string) || FALLBACK_FREQ
        : FALLBACK_FREQ;

  return {
    id: template.id,
    category: template.category,
    label: template.label,
    difficulty: template.difficulty,
    freq: resolvedFreq,
    squawk: DEFAULT_SQUAWK_BY_FREQ_TYPE[template.freqType] ?? '7000',
    atcCall: resolveTokens(template.atcCallTemplate),
    pilotInitiated: template.pilotInitiated,
    situation: template.situationTemplate
      ? resolveTokens(template.situationTemplate)
      : undefined,
    idealResponse: resolveTokens(template.idealResponseTemplate),
    checks: template.checks.map((check) => {
      return { ...check, err: resolveTokens(check.err) };
    }),
    teachingNote: resolveTokens(template.teachingNote),
  };
};
