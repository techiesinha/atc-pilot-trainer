export interface Aerodrome {
  icao: string;
  name: string;
  city: string;
  atcName: string;
  groundFreq: string;
  towerFreq: string;
  approachFreq: string;
  atisFreq: string;
  emergencyFreq: string;
  runways: string[];
  controlled: boolean;
  ctafFreq?: string;
  trainingArea?: string;
}

/**
 * Shared QNH pool — Indian subcontinent, all seasons.
 * All values in hPa (whole numbers only — ICAO standard).
 * Decimals only appear in inHg (USA) — never in hPa.
 *
 * NOTE: Duplicates are intentional. Values like 1013, 1014, 1010 appear
 * multiple times to reflect their higher real-world statistical frequency.
 */
export const QNH_POOL: readonly number[] = [
  998, 999, 999, 1000, 1000,
  1001, 1001, 1002, 1002, 1003,
  1003, 1004, 1004, 1005, 1005,
  1006, 1006, 1007, 1007, 1008,
  1008, 1009, 1010, 1010, 1011,
  1011, 1012, 1012, 1013, 1013,
  1013, 1014, 1014, 1015, 1015,
  1016, 1016, 1017, 1017, 1018,
  1018, 1019, 1019, 1020, 1021,
] as const;

export const pickRandomQnh = (): number => {
  const randomIndex = Math.floor(Math.random() * QNH_POOL.length);
  return QNH_POOL[randomIndex];
};

export const AERODROMES: Aerodrome[] = [
  {
    icao: 'VAPO',
    name: 'Pune (Lohegaon)',
    city: 'Pune',
    atcName: 'Pune',
    groundFreq: '121.900',
    towerFreq: '118.100',
    approachFreq: '119.500',
    atisFreq: '126.350',
    emergencyFreq: '121.500',
    runways: ['09', '27'],
    controlled: true,
    trainingArea: 'Pune sector',
  },
  {
    icao: 'VABB',
    name: 'Mumbai (Chhatrapati Shivaji)',
    city: 'Mumbai',
    atcName: 'Mumbai',
    groundFreq: '121.900',
    towerFreq: '118.400',
    approachFreq: '119.400',
    atisFreq: '126.450',
    emergencyFreq: '121.500',
    runways: ['09', '27', '14', '32'],
    controlled: true,
    trainingArea: 'Mumbai sector',
  },
  {
    icao: 'VIDP',
    name: 'Delhi (Indira Gandhi)',
    city: 'Delhi',
    atcName: 'Delhi',
    groundFreq: '121.900',
    towerFreq: '118.100',
    approachFreq: '125.800',
    atisFreq: '126.150',
    emergencyFreq: '121.500',
    runways: ['10', '28', '11', '29'],
    controlled: true,
    trainingArea: 'Delhi sector',
  },
  {
    icao: 'VOBG',
    name: 'Bangalore (Kempegowda)',
    city: 'Bangalore',
    atcName: 'Bangalore',
    groundFreq: '121.900',
    towerFreq: '118.300',
    approachFreq: '119.700',
    atisFreq: '126.450',
    emergencyFreq: '121.500',
    runways: ['09', '27'],
    controlled: true,
    trainingArea: 'Bangalore sector',
  },
  {
    icao: 'VOMM',
    name: 'Chennai (Anna International)',
    city: 'Chennai',
    atcName: 'Chennai',
    groundFreq: '121.900',
    towerFreq: '118.100',
    approachFreq: '119.900',
    atisFreq: '126.750',
    emergencyFreq: '121.500',
    runways: ['07', '25'],
    controlled: true,
    trainingArea: 'Chennai sector',
  },
  {
    icao: 'VAAH',
    name: 'Ahmedabad (SVP)',
    city: 'Ahmedabad',
    atcName: 'Ahmedabad',
    groundFreq: '121.900',
    towerFreq: '118.100',
    approachFreq: '120.100',
    atisFreq: '126.250',
    emergencyFreq: '121.500',
    runways: ['05', '23'],
    controlled: true,
    trainingArea: 'Ahmedabad sector',
  },
  {
    // VADN Dhule — Bombay Flying Club
    // Operated by senior pilots as AFISO — uncontrolled aerodrome.
    // Single frequency 123.450 MHz for all communications.
    // Called "Dhule Tower" despite being uncontrolled — Indian convention.
    // No VOR, NDB, ILS, approach radar, or ATIS.
    // North and South sectors only.
    icao: 'VADN',
    name: 'Dhule (Bombay Flying Club)',
    city: 'Dhule',
    atcName: 'Dhule',
    groundFreq: '123.450',
    towerFreq: '123.450',
    approachFreq: '',
    atisFreq: '',
    emergencyFreq: '121.500',
    runways: ['08', '26'],
    controlled: false,
    ctafFreq: '123.450',
    trainingArea: 'Dhule sector',
  },
  {
    icao: 'VAJJ',
    name: 'Jalgaon (uncontrolled)',
    city: 'Jalgaon',
    atcName: 'Jalgaon',
    groundFreq: '',
    towerFreq: '',
    approachFreq: '',
    atisFreq: '',
    emergencyFreq: '121.500',
    runways: ['08', '26'],
    controlled: false,
    ctafFreq: '122.800',
    trainingArea: 'Jalgaon area',
  },
  {
    icao: 'VAKP',
    name: 'Kolhapur (uncontrolled)',
    city: 'Kolhapur',
    atcName: 'Kolhapur',
    groundFreq: '',
    towerFreq: '',
    approachFreq: '',
    atisFreq: '',
    emergencyFreq: '121.500',
    runways: ['06', '24'],
    controlled: false,
    ctafFreq: '122.800',
    trainingArea: 'Kolhapur area',
  },
];

export const DEFAULT_AERODROME = AERODROMES[0];
