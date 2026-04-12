import { Aerodrome } from '../config/aerodromes';
import { ScenarioTemplate } from '../types';
import { callsignToPhonetic } from './callsigns';

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [

  // ── GROUND (Controlled) ───────────────────────────────────────────────────
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
      { label: 'Station addressed first', keys: ['ground'], err: 'Address the station first — "{AERODROME} Ground"' },
      { label: 'Your callsign included',  keys: ['victor tango', 'vt-'], err: 'State your callsign to confirm the clearance is yours' },
      { label: 'QNH read back',           keys: ['qnh', 'one zero', 'one one'], err: 'QNH must always be read back — it sets your altimeter' },
      { label: 'Runway read back',        keys: ['runway', 'zero', 'two', 'three'], err: 'Read back the expected departure runway' },
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
    situationTemplate: 'You have completed your pre-flight checks. Aircraft is ready. Request taxi to the active runway from {AERODROME} Ground on {GROUND_FREQ}.',
    atcCallTemplate: '',
    idealResponseTemplate: '{AERODROME} Ground, {CALLSIGN}, request taxi, runway {RUNWAY}, VFR, information {ATIS}.',
    checks: [
      { label: 'Station addressed',         keys: ['ground'], err: 'Call "{AERODROME} Ground" first' },
      { label: 'Your callsign stated',       keys: ['victor tango', 'vt-'], err: 'State your callsign' },
      { label: '"Request taxi" stated',      keys: ['request taxi', 'taxi'], err: 'Say "request taxi" clearly' },
      { label: 'Runway stated',              keys: ['runway'], err: 'State the runway you expect — "runway {RUNWAY}"' },
      { label: 'Flight rules stated',        keys: ['vfr'], err: 'State your flight rules — "VFR" for visual flight' },
    ],
    teachingNote: 'When requesting taxi, always: address the station, give your callsign, say "request taxi", state the runway, state VFR or IFR, and confirm you have the current ATIS information. This gives the controller everything they need to issue your clearance.',
  },

  {
    id: 'taxi_clearance',
    category: 'ground',
    label: 'Taxi Clearance Readback',
    difficulty: 'basic',
    freqType: 'ground',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Ground, taxi to holding point Alpha, runway {RUNWAY}, via taxiway Bravo, QNH {QNH}.',
    idealResponseTemplate: 'Taxi holding point Alpha, runway {RUNWAY}, via Bravo, QNH {QNH}, {CALLSIGN}.',
    checks: [
      { label: 'Holding point read back',  keys: ['alpha', 'holding point'], err: 'Read back the holding point — runway incursions start here' },
      { label: 'Runway read back',         keys: ['runway'], err: 'Read back the runway designation' },
      { label: 'Taxi route read back',     keys: ['bravo', 'via bravo'], err: 'Read back the taxi route — "via Bravo"' },
      { label: 'QNH read back',            keys: ['qnh', 'one zero', 'one one'], err: 'Read back the QNH' },
      { label: 'Callsign at end',          keys: ['victor tango', 'vt-'], err: 'End with your callsign' },
    ],
    teachingNote: 'Taxi clearances require a FULL readback of every element. Runway incursions — aircraft entering an active runway incorrectly — are the most deadly class of aviation accident on the ground. A correct readback is your last line of defence.',
  },

  // ── TOWER (Controlled) ────────────────────────────────────────────────────
  {
    id: 'backtrack_lineup',
    category: 'tower',
    label: 'Backtrack & Line Up',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Tower, runway {RUNWAY}, backtrack and line up, wait.',
    idealResponseTemplate: 'Runway {RUNWAY}, backtrack, line up and wait, {CALLSIGN}.',
    checks: [
      { label: 'Runway read back',                keys: ['runway'], err: 'Read back the runway' },
      { label: '"Backtrack" acknowledged',         keys: ['backtrack'], err: 'Explicitly read back "backtrack"' },
      { label: '"Line up and wait" read back',     keys: ['line up and wait', 'line up wait'], err: '"Line up and wait" must be read back verbatim — you do NOT have takeoff clearance yet' },
      { label: 'Callsign at end',                  keys: ['victor tango', 'vt-'], err: 'End with your callsign' },
    ],
    teachingNote: '"Line up and wait" means enter the runway and stop — you do NOT have takeoff clearance. Several fatal accidents have occurred when pilots took off on a "line up" instruction without takeoff clearance. Read it back exactly and do not move until cleared.',
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
      { label: 'Runway read back',                   keys: ['runway'], err: 'Read back the runway — confirms you are on the correct runway' },
      { label: '"Cleared for takeoff" exact phrase',  keys: ['cleared for takeoff'], err: '"Cleared for takeoff" must be read back verbatim — never say "cleared to go" or just "taking off"' },
      { label: 'Callsign at end',                     keys: ['victor tango', 'vt-'], err: 'End with your callsign to confirm acceptance' },
      { label: 'Did not use "Roger" alone',           keys: ['roger'], warn: true, err: 'Never respond to a takeoff clearance with "Roger" alone — full readback is mandatory' },
    ],
    teachingNote: 'The three mandatory elements of a takeoff clearance readback: runway, "cleared for takeoff" (verbatim), callsign. This is one of the most safety-critical readbacks in VFR flying. A "Roger" alone has caused fatal accidents when a wrong-runway situation existed.',
  },

  {
    id: 'circuit_clearance',
    category: 'tower',
    label: 'Circuit Altitude Clearance',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, climb to circuit altitude one thousand feet, report crosswind.',
    idealResponseTemplate: 'Climb circuit altitude one thousand feet, wilco report crosswind, {CALLSIGN}.',
    checks: [
      { label: 'Circuit altitude read back',   keys: ['one thousand', '1000', 'circuit altitude'], err: 'Read back the circuit altitude — "one thousand feet"' },
      { label: '"Wilco" or will comply stated', keys: ['wilco', 'will report', 'roger'], err: 'Acknowledge the report instruction — say "wilco" or "will report crosswind"' },
      { label: 'Reporting point read back',    keys: ['crosswind'], err: 'Read back the reporting point — "crosswind"' },
      { label: 'Callsign at end',              keys: ['victor tango', 'vt-'], err: 'End with your callsign' },
    ],
    teachingNote: 'Circuit altitude clearances must include the altitude and the reporting point. "Wilco" means "will comply" — use it when you are acknowledging an instruction you will carry out. It is more informative than "Roger" which only means you heard the message.',
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
      { label: 'Runway read back',        keys: ['runway'], err: 'Read back the runway' },
      { label: '"Touch and go" read back', keys: ['touch and go'], err: 'Read back "touch and go" — confirms the type of clearance' },
      { label: 'Callsign at end',         keys: ['victor tango', 'vt-'], err: 'End with your callsign' },
    ],
    teachingNote: 'Touch and go clearances are standard during circuit training. Only read back the clearance elements — not the wind. ATC gives you wind for situational awareness, not for readback.',
  },

  {
    id: 'join_circuit',
    category: 'tower',
    label: 'Sector Rejoin — Joining Circuit',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, join right hand downwind runway {RUNWAY}, number two, follow the Cessna on base leg, report final.',
    idealResponseTemplate: 'Right hand downwind, runway {RUNWAY}, number two, traffic in sight, will report final, {CALLSIGN}.',
    checks: [
      { label: 'Circuit direction read back',  keys: ['right hand', 'right-hand'], err: 'Read back the circuit direction — "right hand downwind"' },
      { label: 'Runway read back',             keys: ['runway'], err: 'Read back the runway' },
      { label: 'Sequence number read back',    keys: ['number two', 'no two', 'number 2'], err: 'Read back your sequence number — "number two"' },
      { label: 'Traffic sighting confirmed',   keys: ['traffic in sight', 'in sight', 'visual', 'tally'], err: 'Confirm traffic in sight — or say "traffic not in sight" so ATC can assist' },
      { label: '"Will report final" stated',   keys: ['report final', 'will report', 'final'], err: 'Acknowledge the reporting instruction — "will report final"' },
      { label: 'Callsign at end',              keys: ['victor tango', 'vt-'], err: 'End with your callsign' },
    ],
    teachingNote: 'Returning from a training area (sector rejoin) and joining the circuit requires: direction, runway, sequence, traffic sighting, and acknowledgement of the reporting point. If you cannot see the preceding traffic, say so — ATC will provide separation assistance.',
  },

  {
    id: 'go_around',
    category: 'tower',
    label: 'Go-Around Instruction',
    difficulty: 'intermediate',
    freqType: 'tower',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, go around, I say again, go around, acknowledge.',
    idealResponseTemplate: 'Going around, {CALLSIGN}.',
    checks: [
      { label: '"Going around" read back', keys: ['going around', 'go around'], err: 'Read back "going around" — this is an urgent instruction' },
      { label: 'Callsign included',        keys: ['victor tango', 'vt-'], err: 'Include your callsign' },
    ],
    teachingNote: 'A go-around from ATC is URGENT. Apply full power as you transmit. Your response must be immediate, short, and clear. Do not make a long readback — the manoeuvre takes priority over the radio call.',
  },

  // ── APPROACH ─────────────────────────────────────────────────────────────
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
      { label: 'Squawk code read back digit by digit', keys: ['four five two one', '4521'], err: 'Read back the squawk code digit by digit — "four five two one", never as a whole number' },
      { label: 'Callsign at end', keys: ['victor tango', 'vt-'], err: 'End with your callsign' },
    ],
    teachingNote: 'Squawk codes are always read back digit by digit. A wrong squawk entered in the transponder means ATC may not see you on radar, or worse — may mistake you for another aircraft.',
  },

  {
    id: 'approach_descent',
    category: 'approach',
    label: 'Descent Clearance',
    difficulty: 'intermediate',
    freqType: 'approach',
    pilotInitiated: false,
    atcCallTemplate: '{CALLSIGN}, {AERODROME} Approach, radar contact, descend to altitude three thousand feet, QNH {QNH}.',
    idealResponseTemplate: 'Descend altitude three thousand feet, QNH {QNH}, {CALLSIGN}.',
    checks: [
      { label: 'Altitude read back',    keys: ['three thousand', '3000', 'altitude three thousand'], err: 'Read back the cleared altitude — critical for vertical separation' },
      { label: 'QNH read back',         keys: ['qnh', 'one zero', 'one one'], err: 'Read back the QNH' },
      { label: 'Callsign at end',       keys: ['victor tango', 'vt-'], err: 'End with your callsign' },
    ],
    teachingNote: 'Under radar control, always read back the cleared altitude and QNH. "Radar contact" means ATC can see you on their screen — any altitude deviation will be immediately visible. Vertical separation is maintained by your readback compliance.',
  },

  // ── EMERGENCY ─────────────────────────────────────────────────────────────
  {
    id: 'pan_pan',
    category: 'emergency',
    label: 'PAN-PAN — Low Fuel',
    difficulty: 'advanced',
    freqType: 'emergency',
    pilotInitiated: true,
    situationTemplate: 'You are 40 minutes from {AERODROME}. Fuel endurance: 35 minutes. 2 persons on board. Declare urgency on 121.5 MHz and squawk 7700.',
    atcCallTemplate: '',
    idealResponseTemplate: 'PAN PAN, PAN PAN, PAN PAN, {AERODROME} Approach, {CALLSIGN}, low fuel, endurance three five minutes, two persons on board, request immediate return {AERODROME}.',
    checks: [
      { label: '"PAN PAN" spoken three times', keys: ['pan pan'], tripleKey: 'pan pan', err: 'PAN-PAN must be spoken exactly three times: "PAN PAN, PAN PAN, PAN PAN"' },
      { label: 'Station addressed',            keys: ['approach'], err: 'Address the ATC station — "{AERODROME} Approach" on 121.5 MHz' },
      { label: 'Your callsign stated',         keys: ['victor tango', 'vt-'], err: 'State your callsign immediately after the station' },
      { label: 'Nature of urgency stated',     keys: ['fuel', 'low fuel', 'endurance', 'minimum fuel'], err: 'State the nature of urgency — "low fuel"' },
      { label: 'Endurance in minutes stated',  keys: ['three five', '35', 'thirty five', 'endurance'], err: 'State fuel endurance in minutes — "endurance three five minutes"' },
      { label: 'Persons on board stated',      keys: ['two', '2', 'pob', 'souls', 'persons'], err: 'State persons on board — critical for emergency services' },
      { label: 'Intentions stated',            keys: ['return', 'land', 'request', 'immediate'], err: 'State your intentions — "request immediate return"' },
    ],
    teachingNote: 'PAN-PAN is an urgency call — not yet life-threatening, but potentially. Format: PAN PAN × 3, station, callsign, nature, position, endurance, POB, intentions. Squawk 7700 simultaneously. 121.5 MHz is monitored by all ATC and most aircraft.',
  },

  {
    id: 'mayday',
    category: 'emergency',
    label: 'MAYDAY — Engine Failure',
    difficulty: 'advanced',
    freqType: 'emergency',
    pilotInitiated: true,
    situationTemplate: 'Engine failure at 3,500 ft, 15 miles from {AERODROME}. 1 person on board. You are gliding and have selected a field. Declare MAYDAY on 121.5 MHz.',
    atcCallTemplate: '',
    idealResponseTemplate: 'MAYDAY MAYDAY MAYDAY, {AERODROME} Approach, {CALLSIGN}, engine failure, altitude three thousand five hundred, fifteen miles from {AERODROME}, one person on board, landing in field.',
    checks: [
      { label: '"MAYDAY" spoken three times',  keys: ['mayday'], tripleKey: 'mayday', err: 'MAYDAY must be spoken exactly three times: "MAYDAY MAYDAY MAYDAY"' },
      { label: 'Station addressed',            keys: ['approach'], err: 'Address ATC — "{AERODROME} Approach"' },
      { label: 'Your callsign stated',         keys: ['victor tango', 'vt-'], err: 'State your callsign' },
      { label: 'Engine failure stated',        keys: ['engine', 'engine failure', 'engine stopped', 'power loss'], err: 'State the nature of distress — "engine failure"' },
      { label: 'Altitude stated',              keys: ['three thousand', '3500', 'altitude'], err: 'State your current altitude' },
      { label: 'Position stated',              keys: ['miles', 'south', 'north', 'east', 'west', 'position'], err: 'State your position relative to a known point' },
      { label: 'Persons on board stated',      keys: ['one', '1', 'pob', 'souls', 'person'], err: 'State persons on board' },
      { label: 'Intentions stated',            keys: ['field', 'landing', 'forced', 'glide'], err: 'State your intention — "landing in field"' },
    ],
    teachingNote: 'MAYDAY is a distress call — immediate danger to life. Squawk 7700, then transmit. After the call, ATC clears all traffic and gives you absolute priority. Keep transmissions short — you are managing a critical emergency.',
  },

  // ── INFORMATION ────────────────────────────────────────────────────────────
  {
    id: 'atis',
    category: 'information',
    label: 'ATIS & First Contact',
    difficulty: 'basic',
    freqType: 'atis',
    pilotInitiated: false,
    atcCallTemplate: '{AERODROME} Information Kilo. Time zero nine three zero. Runway in use {RUNWAY}. Wind two six zero degrees one zero knots. Visibility ten kilometres. Few at two thousand five hundred. Temperature two eight, dewpoint two two. QNH {QNH}. Advise on first contact you have information Kilo.',
    idealResponseTemplate: '{AERODROME} Ground, {CALLSIGN}, request taxi, runway {RUNWAY}, information Kilo.',
    checks: [
      { label: 'Station addressed',           keys: ['ground'], err: 'After copying ATIS, call Ground frequency — "{AERODROME} Ground"' },
      { label: 'Callsign stated',             keys: ['victor tango', 'vt-'], err: 'State your callsign' },
      { label: 'Request stated',              keys: ['request taxi', 'taxi', 'request'], err: 'State your request — "request taxi"' },
      { label: 'ATIS identifier confirmed',   keys: ['kilo', 'information kilo'], err: 'Confirm you have the ATIS — "information Kilo"' },
    ],
    teachingNote: 'Copy the full ATIS before calling ATC. Always confirm the ATIS letter — "information Kilo" — in your first call. This saves the controller 30 seconds of weather passing and signals that you have current QNH.',
  },

  // ── UNCONTROLLED AIRSPACE (CTAF) ──────────────────────────────────────────
  {
    id: 'ctaf_taxi',
    category: 'uncontrolled',
    label: 'CTAF — Taxiing',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: '{AERODROME} is an uncontrolled aerodrome. CTAF is {CTAF_FREQ} MHz. Make a broadcast before taxiing.',
    atcCallTemplate: '',
    idealResponseTemplate: '{AERODROME} Traffic, {CALLSIGN}, taxiing runway {RUNWAY}, {AERODROME}.',
    checks: [
      { label: '"Traffic" used instead of station name', keys: ['traffic'], err: 'At uncontrolled aerodromes say "{AERODROME} Traffic" — there is no ATC' },
      { label: 'Your callsign stated',                   keys: ['victor tango', 'vt-'], err: 'State your callsign' },
      { label: '"Taxiing" stated',                       keys: ['taxi', 'taxiing'], err: 'State your intention — "taxiing"' },
      { label: 'Runway stated',                          keys: ['runway'], err: 'State the runway — "runway {RUNWAY}"' },
      { label: 'Aerodrome name at end',                  keys: ['aerodrome', 'airport'], err: 'End the broadcast with the aerodrome name to identify which traffic area you are in' },
    ],
    teachingNote: 'At uncontrolled aerodromes there is NO ATC. You broadcast your intentions on the Common Traffic Advisory Frequency (CTAF) so other pilots know where you are. Format: "{AERODROME} Traffic, [callsign], [intention], [aerodrome name]." The aerodrome name at the end is critical — multiple aerodromes may share the same CTAF frequency.',
  },

  {
    id: 'ctaf_takeoff',
    category: 'uncontrolled',
    label: 'CTAF — Takeoff Broadcast',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'You are holding point at {AERODROME}, an uncontrolled aerodrome. Make your broadcast before entering the runway and taking off.',
    atcCallTemplate: '',
    idealResponseTemplate: '{AERODROME} Traffic, {CALLSIGN}, taking off runway {RUNWAY}, departing to the north, {AERODROME}.',
    checks: [
      { label: '"Traffic" used',        keys: ['traffic'], err: 'Use "{AERODROME} Traffic" — no ATC at this aerodrome' },
      { label: 'Callsign stated',       keys: ['victor tango', 'vt-'], err: 'State your callsign' },
      { label: '"Taking off" stated',   keys: ['taking off', 'departing'], err: 'State you are taking off' },
      { label: 'Runway stated',         keys: ['runway'], err: 'State the runway you are departing from' },
      { label: 'Departure direction',   keys: ['north', 'south', 'east', 'west', 'departing'], err: 'State your departure direction so other traffic knows where you are going' },
      { label: 'Aerodrome name at end', keys: ['aerodrome', 'airport'], err: 'End with the aerodrome name' },
    ],
    teachingNote: 'At uncontrolled aerodromes, always broadcast before entering any runway. Include your departure direction so arriving aircraft can anticipate your position. Unlike controlled airspace, nobody is watching — your broadcasts are the ONLY safety mechanism.',
  },

  {
    id: 'ctaf_downwind',
    category: 'uncontrolled',
    label: 'CTAF — Downwind Position',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'You are in the circuit at {AERODROME} (uncontrolled). Make your downwind position report.',
    atcCallTemplate: '',
    idealResponseTemplate: '{AERODROME} Traffic, {CALLSIGN}, downwind, runway {RUNWAY}, touch and go, {AERODROME}.',
    checks: [
      { label: '"Traffic" used',          keys: ['traffic'], err: 'Use "{AERODROME} Traffic"' },
      { label: 'Callsign stated',         keys: ['victor tango', 'vt-'], err: 'State your callsign' },
      { label: '"Downwind" position',     keys: ['downwind'], err: 'State your circuit position — "downwind"' },
      { label: 'Runway stated',           keys: ['runway'], err: 'State the runway' },
      { label: 'Intention stated',        keys: ['touch and go', 'landing', 'full stop', 'low approach'], err: 'State your intention — "touch and go", "full stop landing", etc.' },
      { label: 'Aerodrome name at end',   keys: ['aerodrome', 'airport'], err: 'End with the aerodrome name' },
    ],
    teachingNote: 'At uncontrolled aerodromes, broadcast at each key circuit position: crosswind, downwind, base, and final. This keeps other circuit traffic informed of your position. The more pilots broadcast, the safer the circuit.',
  },

  {
    id: 'ctaf_final',
    category: 'uncontrolled',
    label: 'CTAF — Final Approach',
    difficulty: 'basic',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'You are on final approach at {AERODROME} (uncontrolled). Make your final approach broadcast.',
    atcCallTemplate: '',
    idealResponseTemplate: '{AERODROME} Traffic, {CALLSIGN}, final, runway {RUNWAY}, full stop, {AERODROME}.',
    checks: [
      { label: '"Traffic" used',        keys: ['traffic'], err: 'Use "{AERODROME} Traffic"' },
      { label: 'Callsign stated',       keys: ['victor tango', 'vt-'], err: 'State your callsign' },
      { label: '"Final" stated',        keys: ['final'], err: 'State your position — "final"' },
      { label: 'Runway stated',         keys: ['runway'], err: 'State the runway you are landing on' },
      { label: 'Intention stated',      keys: ['full stop', 'touch and go', 'landing'], err: 'State whether full stop or touch and go' },
      { label: 'Aerodrome name at end', keys: ['aerodrome', 'airport'], err: 'End with the aerodrome name' },
    ],
    teachingNote: 'The final approach broadcast is the most critical CTAF call. Any aircraft on the ground or in the circuit uses this to ensure runway is clear for you. Always state runway and landing type — "full stop" vs "touch and go" affects how long you will occupy the runway.',
  },

  {
    id: 'ctaf_overhead_join',
    category: 'uncontrolled',
    label: 'CTAF — Overhead Join',
    difficulty: 'intermediate',
    freqType: 'ctaf',
    pilotInitiated: true,
    situationTemplate: 'You are approaching {AERODROME} (uncontrolled) at 2,000ft overhead. Make your joining broadcast before commencing the overhead join.',
    atcCallTemplate: '',
    idealResponseTemplate: '{AERODROME} Traffic, {CALLSIGN}, overhead, two thousand feet, descending dead side, joining right hand downwind runway {RUNWAY}, {AERODROME}.',
    checks: [
      { label: '"Traffic" used',          keys: ['traffic'], err: 'Use "{AERODROME} Traffic"' },
      { label: 'Callsign stated',         keys: ['victor tango', 'vt-'], err: 'State your callsign' },
      { label: '"Overhead" stated',       keys: ['overhead'], err: 'State your position — "overhead"' },
      { label: 'Altitude stated',         keys: ['two thousand', '2000', 'feet'], err: 'State your altitude when overhead — "two thousand feet"' },
      { label: 'Circuit direction stated', keys: ['right hand', 'left hand', 'downwind', 'dead side'], err: 'State which way you are joining — dead side, then circuit direction' },
      { label: 'Runway stated',           keys: ['runway'], err: 'State the runway' },
      { label: 'Aerodrome name at end',   keys: ['aerodrome', 'airport'], err: 'End with the aerodrome name' },
    ],
    teachingNote: 'An overhead join is a structured arrival at an uncontrolled aerodrome. You cross the threshold at circuit height + 500ft, cross to the dead side (non-circuit side), descend to circuit height, then join downwind. Broadcasting each phase keeps all traffic informed.',
  },
];

export const CATEGORIES = [
  { id: 'ground',        label: 'Ground',        color: '#39ff14', description: 'Startup, taxi, pre-departure' },
  { id: 'tower',         label: 'Tower',         color: '#58a6ff', description: 'Takeoff, circuit, landing' },
  { id: 'approach',      label: 'Approach',      color: '#f0a030', description: 'Radar, squawk, descent' },
  { id: 'emergency',     label: 'Emergency',     color: '#f85149', description: 'PAN-PAN, MAYDAY' },
  { id: 'information',   label: 'Information',   color: '#7ec87e', description: 'ATIS, frequencies' },
  { id: 'uncontrolled',  label: 'Uncontrolled',  color: '#c084fc', description: 'CTAF broadcasts' },
] as const;

/** Resolve a template into a live Scenario with callsign and aerodrome injected */
export function resolveScenario(
  template: ScenarioTemplate,
  callsign: string,
  aerodrome: Aerodrome,
  atisLetter = 'Kilo',
) {
  const phonetic = callsignToPhonetic(callsign);
  const runway = aerodrome.runways[0];
  const qnh = `${aerodrome.typicalQNH}`;

  const replace = (s: string) =>
    s
      .replace(/{CALLSIGN}/g, phonetic)
      .replace(/{AERODROME}/g, aerodrome.atcName)
      .replace(/{RUNWAY}/g, runway)
      .replace(/{QNH}/g, qnh)
      .replace(/{ATIS}/g, atisLetter)
      .replace(/{GROUND_FREQ}/g, aerodrome.groundFreq)
      .replace(/{CTAF_FREQ}/g, aerodrome.ctafFreq ?? '122.800');

  const freqMap: Record<string, string> = {
    ground:    aerodrome.groundFreq,
    tower:     aerodrome.towerFreq,
    approach:  aerodrome.approachFreq,
    atis:      aerodrome.atisFreq,
    emergency: '121.500',
    ctaf:      aerodrome.ctafFreq ?? '122.800',
  };

  const squawkMap: Record<string, string> = {
    ground: '7000', tower: '7000', approach: '4521',
    atis: '7000', emergency: '7700', ctaf: '7000',
  };

  return {
    id:             template.id,
    category:       template.category,
    label:          template.label,
    difficulty:     template.difficulty,
    freq:           freqMap[template.freqType] ?? '118.100',
    squawk:         squawkMap[template.freqType] ?? '7000',
    atcCall:        replace(template.atcCallTemplate),
    pilotInitiated: template.pilotInitiated,
    situation:      template.situationTemplate ? replace(template.situationTemplate) : undefined,
    idealResponse:  replace(template.idealResponseTemplate),
    checks:         template.checks.map((c) => ({ ...c, err: replace(c.err) })),
    teachingNote:   replace(template.teachingNote),
  };
}
