/**
 * Locale file — English (en)
 *
 * EVERY piece of user-visible text in the application lives here.
 * To change any UI string, edit this file only — no need to touch components.
 *
 * To add a new language:
 *   1. Copy this file to src/locales/hi.ts (or any language code)
 *   2. Translate the values
 *   3. In src/locales/index.ts, add the new locale and a selector
 */

export const en = {

  // ── APP ───────────────────────────────────────────────────────────────────
  app: {
    name: 'ATC Pilot Trainer',
    tagline: 'Radio Communication Trainer for Student Pilots',
    aircraft: 'Cessna 172R',
    builtBy: 'For the pilots by a pilot · India',
    version: 'v',               // prefix before version number e.g. "v1.0.0"
    loading: 'ATC',
    loadingSub: 'TRAINER',
  },

  // ── NAV ───────────────────────────────────────────────────────────────────
  nav: {
    simulator: 'Simulator',
    metar: 'METAR',
    phonetics: 'Phonetics',
    progress: 'Progress',
    suggestions: 'Suggestions',
    simulatorShort: 'SIM',
    metarShort: 'MET',
    phoneticsShort: 'PHO',
    progressShort: 'LOG',
    suggestionsShort: 'FB',
  },

  // ── CLOCK ─────────────────────────────────────────────────────────────────
  clock: {
    local: 'LCL',
    utc: 'UTC',
  },

  // ── COCKPIT PLACARD ───────────────────────────────────────────────────────
  placard: {
    topLabel: 'AIRCRAFT REG',
    bottomLabel: 'C-172R',
    rerollTitle: 'Click to assign a new callsign',
    rerollIcon: '↺',
  },

  // ── VOICE SELECTOR ────────────────────────────────────────────────────────
  voice: {
    male: '♂',
    female: '♀',
    maleTitle: 'Male ATC voice',
    femaleTitle: 'Female ATC voice',
    pickTitle: 'Choose specific voice',
    dropLabel: 'ATC VOICE',
    expand: '▾',
  },

  // ── TOWER SELECTOR ────────────────────────────────────────────────────────
  tower: {
    label: 'AERODROME',
    controlled: 'CONTROLLED',
    ctaf: 'CTAF',
    groupControlled: 'Controlled (ATC)',
    groupUncontrolled: 'Uncontrolled (CTAF)',
  },

  // ── USER REGISTRATION ─────────────────────────────────────────────────────
  registration: {
    logoMain: 'ATC',
    logoSub: 'PILOT TRAINER',
    tagline: 'Built by an SPL holder · Cessna 172R · India',
    description: 'Practice ICAO radio phraseology, decode live METARs, and drill the phonetic alphabet — all in one tool built specifically for student pilots.',
    googleBtn: 'Continue with Google',
    signingIn: 'Signing in...',
    errorGeneric: 'Sign in failed. Please try again.',
    privacy: 'Your name is provided by Google and used only to personalise your profile. Your data is never shared or sold.',
    pilotLevels: [
      'Student pilot (PPL training)',
      'Student pilot (CPL training)',
      'PPL holder',
      'CPL holder',
      'ATPL holder',
      'Flight instructor',
      'Aviation enthusiast',
    ],
  },

  // ── SIMULATOR ─────────────────────────────────────────────────────────────
  simulator: {
    // Category descriptions
    categoryDesc: {
      ground: 'Startup, taxi, pre-departure',
      tower: 'Takeoff, circuit, landing',
      approach: 'Radar, squawk, descent',
      emergency: 'PAN-PAN, MAYDAY',
      information: 'ATIS, frequencies',
      uncontrolled: 'CTAF broadcasts',
    },

    // Scenario difficulty labels
    difficulty: {
      basic: 'basic',
      intermediate: 'intermediate',
      advanced: 'advanced',
    },

    // Radio head labels
    radio: {
      vhfComm: 'VHF COMM',
      squawk: 'SQUAWK',
      status: 'STATUS',
      freqEmpty: '--- . ---',
      squawkEmpty: '----',
    },

    // Simulator state labels
    state: {
      idle: 'SELECT SCENARIO',
      atcSpeaking: 'ATC TRANSMITTING...',
      standby: 'STANDBY — HOLD PTT',
      transmitting: 'TRANSMITTING...',
      evaluating: 'EVALUATING...',
      feedback: 'READBACK COMPLETE',
    },

    // Communication log
    log: {
      empty: 'Select a scenario from the left panel to begin.',
      labelAtc: 'ATC',
      labelPilot: 'PILOT',
      labelSys: 'SYS',
    },

    // Buttons
    buttons: {
      replayAtc: 'REPLAY ATC',
      holdPtt: 'HOLD PTT TO RESPOND',
      transmitting: 'TRANSMITTING...',
    },

    // Feedback panel
    feedback: {
      pass: 'PASS',
      partial: 'PARTIAL',
      retry: 'RETRY',
      checkOk: '✓',
      checkWarn: '△',
      checkFail: '✗',
      refReadback: 'REFERENCE READBACK',
      teachingNote: 'TEACHING NOTE',
    },

    // Errors / warnings
    errors: {
      noAudio: 'No audio detected — check microphone permissions.',
      noSpeech: 'Speech recognition unavailable — use Chrome or Edge. You can still review reference readbacks below each scenario.',
    },
  },

  // ── METAR ─────────────────────────────────────────────────────────────────
  metar: {
    title: 'METAR DECODER',
    subtitle: 'LIVE AVIATION WEATHER · REAL DATA · UPDATED HOURLY',

    quickLabel: 'Quick airports',

    searchPlaceholder: 'ICAO code or city name (e.g. VABB or Mumbai)',
    fetchBtn: 'FETCH METAR',
    fetching: 'FETCHING...',

    loading: 'CONTACTING AVIATION WEATHER CENTER...',

    sections: {
      rawMetar: 'RAW METAR',
      interpretation: 'PILOT INTERPRETATION',
      advice: 'PILOT ADVICE',
    },

    fields: {
      wind: 'Wind',
      vis: 'Visibility',
      cloud: 'Cloud',
      tempDew: 'Temp / Dew',
      qnh: 'QNH',
      remarks: 'Remarks',
    },

    interpFields: {
      wind: 'Wind',
      vis: 'Visibility',
      cloud: 'Cloud',
      tempDew: 'Temp / Dew spread',
      altimeter: 'Altimeter',
    },

    catDesc: {
      VFR: '— Visual flight permitted',
      MVFR: '— Marginal VFR — extra caution',
      IFR: '— Instrument conditions — no VFR',
      LIFR: '— Low IFR — severely restricted',
    },

    apiNote: 'Live weather data sourced from official aviation weather services.',

    interpretationSource: 'Plain English interpretation is generated by this application from the raw METAR values — not from any external service. Wind, visibility, cloud, and temperature data are parsed from the METAR and assessed against standard VFR minima for the C-172R.',

    errors: {
      generic: 'No weather data available for this station. The station may not report METARs, or the ICAO code may be incorrect. Try a nearby major airport.',
    },
  },

  // ── AVIATION WEATHER INTERPRETATION ───────────────────────────────────────
  aviationWeather: {
    notReported: 'Not reported',
    calmWind: 'Calm',
    variableWind: 'Variable',
    skyClear: 'Sky clear',
    clearBelow12000: 'Clear below 12,000ft',
    cloudFew: 'Few',
    cloudScattered: 'Scattered',
    cloudBroken: 'Broken',
    cloudOvercast: 'Overcast',
    rawMetarUnavailable: 'Raw METAR not available',
    remarksNone: 'None',
    timeUnknown: 'Unknown',
    visibilityMaxKm: '10 km or more',

    wind: {
      calm: 'Wind is calm. No crosswind on any runway.',
      strong: (speed: number, limit: number) =>
        `Strong wind — ${speed} kt. Crosswind may exceed C-172R limit (${limit} kt). Check before committing.`,
      normal: (speed: number, direction: string | number) =>
        `Wind ${speed} kt from ${direction}°. Calculate crosswind component for your runway.`,
    },

    visibility: {
      good: 'Good visibility — no restrictions to VFR.',
      marginal: 'Marginal VFR. Legal but reduced — extra vigilance required.',
      poor: 'Below VFR minima. Do not depart VFR without ATC approval.',
    },

    cloud: {
      low: 'Low cloud base — verify VFR cloud clearance and minimum sector altitudes.',
      acceptable: 'Cloud cover acceptable for VFR. Monitor for development.',
    },

    temperature: {
      fogRisk: (spread: number) =>
        `Temp/dew spread only ${spread}°C — fog or low cloud likely.`,
      noFogRisk: (temp: number, dew: number, spread: number) =>
        `Temp ${temp}°C / Dew ${dew}°C — spread ${spread}°C, no immediate fog risk.`,
    },

    pressure: {
      summary: (qnh: number, note: string) => `QNH ${qnh} hPa. ${note}`,
      low: 'Low pressure — density altitude elevated, performance reduced.',
      high: 'High pressure — good performance, watch for temperature inversions.',
      standard: 'Near standard pressure.',
    },

    pilotAdvice: {
      VFR: 'Conditions are VFR. Visual flight permitted. Monitor for changes.',
      MVFR: 'Marginal VFR. Proceed with caution. Consider delaying if conditions worsening.',
      IFR: 'IFR conditions. VFR flight not permitted. Do not depart unless instrument rated.',
      LIFR: 'Low IFR — severely restricted. Do not operate VFR.',
      UNKNOWN: 'Flight category undetermined. Assess each element before flight.',
    },

    errors: {
      noMetarFound: (icao: string) => `No METAR found for ${icao}`,
      proxyHttpError: (status: number) => `Aviation Weather via proxy returned HTTP ${status}`,
      checkWxHttpError: (status: number) => `CheckWX returned HTTP ${status}`,
      noCheckWxData: (icao: string) => `No CheckWX data for ${icao}`,
    },
  },

  // ── PHONETICS ─────────────────────────────────────────────────────────────
  phonetics: {
    title: 'PHONETIC ALPHABET',
    subtitle: 'ICAO STANDARD — NATO PHONETIC ALPHABET',

    modes: {
      learn: 'Study Table',
      l2p: 'Letter → Phonetic',
      p2l: 'Phonetic → Letter',
      numbers: 'Aviation Numbers',
    },

    numbersTitle: 'AVIATION NUMBERS',
    numbersNote: '3="Tree", 4="Fower", 5="Fife", 8="Ait", 9="Niner". These prevent confusion over noisy radio channels.',

    drill: {
      labelL2p: 'PHONETIC WORD FOR:',
      labelP2l: 'LETTER FOR THIS WORD:',
      labelNumbers: 'AVIATION SPOKEN FORM:',
      placeholder: 'Type your answer...',
      checkBtn: 'CHECK',
      nextBtn: 'NEXT →',
      correct: 'CORRECT',
      answer: 'Answer:',
    },

    score: {
      correct: 'CORRECT',
      total: 'TOTAL',
      accuracy: 'ACCURACY',
    },
  },

  // ── PROGRESS ──────────────────────────────────────────────────────────────
  progress: {
    title: 'PROGRESS LOG',
    subtitle: 'SESSION HISTORY — STORED LOCALLY IN YOUR BROWSER',

    empty: 'Complete scenarios in the Simulator to track your progress here.',

    stats: {
      totalAttempts: 'TOTAL ATTEMPTS',
      passRate: 'PASS RATE',
      avgScore: 'AVG SCORE',
      passed: 'PASSED',
    },

    sections: {
      byCategory: 'BY CATEGORY',
      needsPractice: 'NEEDS PRACTICE',
      recentSessions: 'RECENT SESSIONS',
    },

    session: {
      passed: 'Passed',
      failed: 'Failed',
    },

    clearBtn: 'CLEAR ALL HISTORY',
    clearConfirm: 'Clear all session history? This cannot be undone.',
  },

  // ── FEEDBACK ──────────────────────────────────────────────────────────────
  feedback: {
    title: 'SUGGESTIONS',
    subtitle: 'HELP IMPROVE THIS TRAINER — YOUR FEEDBACK IS READ PERSONALLY',

    intro: {
      builtBy: 'Built by',
      description: 'If you find a phraseology error, want a new scenario, or have any feedback — every message is read and acted on personally. Use the form below to send directly to the developer\'s inbox.',
    },

    badges: {
      pilotLicense: 'SPL Holder',
      aircraft: 'Cessna 172R',
      ceh: 'CEH',
      research: 'IEEE / Springer',
    },

    contactLinks: {
      github: {
        title: 'Open a GitHub issue',
        desc: 'Best for bug reports and feature requests — publicly trackable',
        icon: '⌥',
      },
      linkedin: {
        title: 'Connect on LinkedIn',
        desc: 'Aviation, frontend engineering, and research discussions',
        icon: '◈',
      },
      stackoverflow: {
        title: 'Stack Overflow',
        desc: 'Technical questions and frontend engineering',
        icon: '◎',
      },
    },

    form: {
      title: 'SEND DIRECT MESSAGE',
      typeLabel: 'FEEDBACK TYPE',
      levelLabel: 'YOUR PILOT LEVEL',
      nameLabel: 'YOUR NAME',
      nameReq: '*',
      namePlaceholder: 'Your name',
      emailLabel: 'YOUR EMAIL',
      emailReq: '*',
      emailNote: '— required for reply',
      emailPlaceholder: 'your@email.com',
      messageLabel: 'MESSAGE',
      messageReq: '*',
      messagePlaceholder: 'Describe your scenario request, bug, or feedback in as much detail as possible...',

      privacyNote: 'Your message is delivered directly to the developer. Your email is used only to reply to you.',

      submitIdle: 'SEND MESSAGE →',
      submitSending: 'SENDING...',
    },

    types: [
      'New ATC scenario request',
      'Phraseology correction',
      'Bug report',
      'METAR / weather feedback',
      'Phonetics drill feedback',
      'New feature idea',
      'General feedback',
      'Other',
    ],

    success: {
      icon: '✓',
      title: 'MESSAGE RECEIVED',
      text: 'Your feedback has been sent directly to the developer\'s inbox. You will receive a reply if a response is needed.',
      reset: 'SEND ANOTHER',
    },

    errors: {
      sending: 'Sending failed. Please try again.',
    },
  },

  // ── PROFILE SETUP ────────────────────────────────────────────────────────
  profileSetup: {
    countryLabel: 'YOUR COUNTRY',
    countryHint: 'Pre-filled from your system timezone — change if incorrect.',
    levelLabel: 'PILOT LEVEL',
    levelPlaceholder: 'Select your level...',
    saving: 'SAVING...',
    startBtn: 'START TRAINING →',
    note: 'These details help personalise your experience. They are saved to your profile and will not be asked again.',
    countries: [
      'India',
      'United Kingdom',
      'United States',
      'Australia',
      'Canada',
      'South Africa',
      'UAE',
      'Singapore',
      'New Zealand',
      'Pakistan',
      'Sri Lanka',
      'Bangladesh',
      'Nepal',
      'Malaysia',
      'Philippines',
      'Nigeria',
      'Kenya',
      'Other',
    ],
  },

  // ── DONATIONS ─────────────────────────────────────────────────────────────
  donations: {
    title: 'SUPPORT THIS PROJECT',
    subtitle: 'This tool is free. If it helped your training, consider buying the developer a chai.',
    upiLabel: 'SCAN & PAY — ANY UPI APP',
    upiId: 'UPI ID',
    copyBtn: 'COPY ID',
    copiedBtn: 'COPIED ✓',
    howTo: 'Open GPay, PhonePe, Paytm, or any UPI app → Scan QR or enter UPI ID → Pay any amount.',
    thankYou: 'Every contribution keeps this tool free and ad-free for student pilots.',
  },

  // ── LEGAL PAGE ────────────────────────────────────────────────────────────
  legal: {
    title: 'LEGAL',
    subtitle: 'COPYRIGHT · DISCLAIMER · TERMS OF USE',
    sections: {
      copyright: 'COPYRIGHT',
      disclaimer: 'DISCLAIMER & LIABILITY',
      code: 'CODE & INTELLECTUAL PROPERTY',
      training: 'TRAINING USE NOTICE',
    },
    trainingText: 'This tool is designed to assist student pilots in practising ICAO radio telephony phraseology. It is a supplementary study aid only. It does not replace, and must not be used as a substitute for, certified ground school instruction, authorised flight training, or official DGCA / ICAO publications.',
    codeText: 'The source code, design, scenarios, and all associated content of this application are the intellectual property of the developer. Viewing the source code for personal reference is permitted. Copying, reproducing, distributing, or using any part of this code in any project — commercial or otherwise — without prior written permission from the developer is strictly prohibited.',
  },

  // ── USER PROFILE ──────────────────────────────────────────────────────────
  userProfile: {
    signedInAs: 'SIGNED IN AS',
    pilotLevel: 'PILOT LEVEL',
    clearProfile: 'Logout',
    clearConfirm: 'Are you sure you want to logout?',
  },
};

export type Locale = typeof en;
