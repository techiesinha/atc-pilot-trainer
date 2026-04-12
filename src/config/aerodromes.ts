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
  typicalQNH: number;
  controlled: boolean;
  ctafFreq?: string;
  trainingArea?: string;
}

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
    typicalQNH: 1013,
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
    typicalQNH: 1010,
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
    typicalQNH: 1015,
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
    typicalQNH: 1013,
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
    typicalQNH: 1010,
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
    typicalQNH: 1014,
    controlled: true,
    trainingArea: 'Ahmedabad sector',
  },
  {
    icao: 'VADN',
    name: 'Dhule Airport',
    city: 'Dhule',
    atcName: 'Dhule',
    groundFreq: '121.900',
    towerFreq: '118.100',
    approachFreq: '',
    atisFreq: '',
    emergencyFreq: '121.500',
    runways: ['08', '26'],
    typicalQNH: 1013,
    controlled: true,
    trainingArea: 'Dhule sector',
  },
  // Uncontrolled aerodromes — CTAF training
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
    typicalQNH: 1013,
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
    typicalQNH: 1013,
    controlled: false,
    ctafFreq: '122.800',
    trainingArea: 'Kolhapur area',
  },
];

export const DEFAULT_AERODROME = AERODROMES[0];
