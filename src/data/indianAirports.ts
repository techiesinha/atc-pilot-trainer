export interface AirportEntry {
  icao: string;
  iata?: string;
  name: string;
  city: string;
  state: string;
  aliases: string[];  // search aliases
}

export const INDIAN_AIRPORTS: AirportEntry[] = [
  { icao:'VABB', iata:'BOM', name:'Chhatrapati Shivaji International', city:'Mumbai',    state:'Maharashtra', aliases:['mumbai','bombay','csia','bom'] },
  { icao:'VIDP', iata:'DEL', name:'Indira Gandhi International',       city:'Delhi',     state:'Delhi',       aliases:['delhi','new delhi','igi','del','indira gandhi'] },
  { icao:'VOBG', iata:'BLR', name:'Kempegowda International',          city:'Bangalore', state:'Karnataka',   aliases:['bangalore','bengaluru','kia','blr'] },
  { icao:'VAPO', iata:'PNQ', name:'Pune Airport (Lohegaon)',           city:'Pune',      state:'Maharashtra', aliases:['pune','poona','lohegaon','pnq'] },
  { icao:'VOMM', iata:'MAA', name:'Chennai International',             city:'Chennai',   state:'Tamil Nadu',  aliases:['chennai','madras','maa'] },
  { icao:'VOHY', iata:'HYD', name:'Rajiv Gandhi International',        city:'Hyderabad', state:'Telangana',   aliases:['hyderabad','rgia','hyd','shamshabad'] },
  { icao:'VOGO', iata:'GOI', name:'Manohar International',             city:'Goa',       state:'Goa',         aliases:['goa','dabolim','mopa','goi'] },
  { icao:'VAAH', iata:'AMD', name:'Sardar Vallabhbhai Patel Int\'l',   city:'Ahmedabad', state:'Gujarat',     aliases:['ahmedabad','amd','svp'] },
  { icao:'VEGY', iata:'GAU', name:'Lokpriya Gopinath Bordoloi Int\'l', city:'Guwahati',  state:'Assam',       aliases:['guwahati','gauhati','gau'] },
  { icao:'VECL', iata:'CCU', name:'Netaji Subhas Chandra Bose Int\'l', city:'Kolkata',   state:'West Bengal', aliases:['kolkata','calcutta','ccu','nscbi'] },
  { icao:'VOCI', iata:'COK', name:'Cochin International',              city:'Kochi',     state:'Kerala',      aliases:['kochi','cochin','cok','cial'] },
  { icao:'VOCL', iata:'CCJ', name:'Calicut International',             city:'Kozhikode', state:'Kerala',      aliases:['kozhikode','calicut','ccj'] },
  { icao:'VOJV', iata:'IXB', name:'Bagdogra Airport',                  city:'Bagdogra',  state:'West Bengal', aliases:['bagdogra','siliguri','ixb'] },
  { icao:'VECC', iata:'IXC', name:'Chandigarh Airport',                city:'Chandigarh',state:'Punjab',      aliases:['chandigarh','ixc'] },
  { icao:'VAOZ', iata:'IXU', name:'Aurangabad Airport',                city:'Aurangabad',state:'Maharashtra', aliases:['aurangabad','ixu'] },
  { icao:'VANP', iata:'NAG', name:'Dr. Babasaheb Ambedkar Int\'l',     city:'Nagpur',    state:'Maharashtra', aliases:['nagpur','nag'] },
  { icao:'VASU', iata:'STV', name:'Surat Airport',                     city:'Surat',     state:'Gujarat',     aliases:['surat','stv'] },
  { icao:'VARP', iata:'IXR', name:'Birsa Munda Airport',               city:'Ranchi',    state:'Jharkhand',   aliases:['ranchi','ixr'] },
  { icao:'VELP', iata:'LKO', name:'Chaudhary Charan Singh Int\'l',     city:'Lucknow',   state:'UP',          aliases:['lucknow','lko'] },
  { icao:'VIAG', iata:'AGR', name:'Agra Airport',                      city:'Agra',      state:'UP',          aliases:['agra'] },
];

/**
 * Search airports by city name, ICAO, IATA, or alias.
 * Returns matches sorted by relevance.
 */
export function searchAirports(query: string): AirportEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return INDIAN_AIRPORTS
    .filter((a) =>
      a.icao.toLowerCase().includes(q) ||
      a.iata?.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.aliases.some((al) => al.includes(q))
    )
    .sort((a, b) => {
      const aExact = a.city.toLowerCase() === q || a.icao.toLowerCase() === q;
      const bExact = b.city.toLowerCase() === q || b.icao.toLowerCase() === q;
      return (bExact ? 1 : 0) - (aExact ? 1 : 0);
    });
}
