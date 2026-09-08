/**
 * Master Destination Registry
 * Authoritative single source of truth for Indian destinations, IATA codes,
 * railway station codes, coordinates, and state mapping.
 */

export interface MasterDestination {
  id: string;
  name: string;
  state: string;
  iata: string;
  station: string;
  lat: number;
  lng: number;
  image: string;
  category: string;
  rating?: number;
  bestTime?: string;
}

export const MASTER_DESTINATIONS: MasterDestination[] = [
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', iata: 'VNS', station: 'BSB', lat: 25.3176, lng: 82.9739, image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1000&q=80', category: 'Spiritual', rating: 4.9, bestTime: 'Oct - Mar' },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', iata: 'JAI', station: 'JP', lat: 26.9124, lng: 75.7873, image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80', category: 'Heritage', rating: 4.8, bestTime: 'Nov - Feb' },
  { id: 'goa', name: 'Goa', state: 'Goa', iata: 'GOI', station: 'MAO', lat: 15.2993, lng: 74.1240, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80', category: 'Nature', rating: 4.7, bestTime: 'Nov - Feb' },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', iata: 'COK', station: 'ERS', lat: 9.9312, lng: 76.2673, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80', category: 'Nature', rating: 4.8, bestTime: 'Sep - Mar' },
  { id: 'udaipur', name: 'Udaipur', state: 'Rajasthan', iata: 'UDR', station: 'UDZ', lat: 24.5854, lng: 73.7125, image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1000&q=80', category: 'Heritage', rating: 4.9, bestTime: 'Oct - Mar' },
  { id: 'agra', name: 'Agra', state: 'Uttar Pradesh', iata: 'AGR', station: 'AGC', lat: 27.1767, lng: 78.0081, image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1000&q=80', category: 'Heritage', rating: 4.9, bestTime: 'Oct - Mar' },
  { id: 'rishikesh', name: 'Rishikesh', state: 'Uttarakhand', iata: 'DED', station: 'HW', lat: 30.0869, lng: 78.2676, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80', category: 'Spiritual', rating: 4.8, bestTime: 'Sep - Apr' },
  { id: 'manali', name: 'Manali', state: 'Himachal Pradesh', iata: 'KUU', station: 'CDG', lat: 32.2432, lng: 77.1892, image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80', category: 'Nature', rating: 4.7, bestTime: 'Oct - Jun' },
  { id: 'amritsar', name: 'Amritsar', state: 'Punjab', iata: 'ATQ', station: 'ASR', lat: 31.6340, lng: 74.8723, image: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1000&q=80', category: 'Spiritual', rating: 4.9, bestTime: 'Oct - Mar' },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', iata: 'BOM', station: 'CSMT', lat: 19.0760, lng: 72.8777, image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1000&q=80', category: 'Metropolis', rating: 4.6, bestTime: 'Nov - Feb' },
  { id: 'delhi', name: 'Delhi', state: 'Delhi', iata: 'DEL', station: 'NDLS', lat: 28.6139, lng: 77.2090, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1000&q=80', category: 'Metropolis', rating: 4.7, bestTime: 'Oct - Mar' },
  { id: 'bangalore', name: 'Bangalore', state: 'Karnataka', iata: 'BLR', station: 'SBC', lat: 12.9716, lng: 77.5946, image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1000&q=80', category: 'Metropolis', rating: 4.6, bestTime: 'Sep - Feb' },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', iata: 'MAA', station: 'MAS', lat: 13.0827, lng: 80.2707, image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80', category: 'Heritage', rating: 4.5, bestTime: 'Nov - Feb' },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', iata: 'CCU', station: 'HWH', lat: 22.5726, lng: 88.3639, image: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1000&q=80', category: 'Heritage', rating: 4.7, bestTime: 'Oct - Feb' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', iata: 'HYD', station: 'SC', lat: 17.3850, lng: 78.4867, image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1000&q=80', category: 'Heritage', rating: 4.7, bestTime: 'Oct - Mar' },
  { id: 'madurai', name: 'Madurai', state: 'Tamil Nadu', iata: 'IXM', station: 'MDU', lat: 9.9252, lng: 78.1198, image: 'https://images.unsplash.com/photo-1600100397608-f090e8a75e3c?auto=format&fit=crop&w=1000&q=80', category: 'Spiritual', rating: 4.8, bestTime: 'Oct - Mar' },
  { id: 'haridwar', name: 'Haridwar', state: 'Uttarakhand', iata: 'DED', station: 'HW', lat: 29.9457, lng: 78.1642, image: 'https://images.unsplash.com/photo-1566375638491-0322c3664d4b?auto=format&fit=crop&w=1000&q=80', category: 'Spiritual', rating: 4.9, bestTime: 'Oct - Apr' },
  { id: 'tirupati', name: 'Tirupati', state: 'Andhra Pradesh', iata: 'TIR', station: 'TPTY', lat: 13.6288, lng: 79.4192, image: 'https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&w=1000&q=80', category: 'Spiritual', rating: 4.9, bestTime: 'Sep - Mar' },
];

export const CITY_CODES_MAP: Record<string, { iata: string; station: string }> = MASTER_DESTINATIONS.reduce(
  (acc, item) => {
    acc[item.name.toLowerCase()] = { iata: item.iata, station: item.station };
    acc[item.id.toLowerCase()] = { iata: item.iata, station: item.station };
    return acc;
  },
  {} as Record<string, { iata: string; station: string }>
);

export function getDestinationById(idOrName: string): MasterDestination | undefined {
  const norm = idOrName?.toLowerCase().trim();
  return MASTER_DESTINATIONS.find((d) => d.id === norm || d.name.toLowerCase() === norm);
}
