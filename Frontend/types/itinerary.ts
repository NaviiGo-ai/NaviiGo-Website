/**
 * Core Itinerary Engine Domain Interfaces
 */

export interface ActivityItem {
  id?: string;
  name: string;
  desc?: string;
  /** Activity kind: 'restaurant' | 'hotel' | 'attraction' | 'activity' … set by curated/AI itinerary data */
  type?: string;
  time?: string;
  lat?: number;
  lng?: number;
  crowd?: string;
  crowdTip?: string;
  slot?: string;
  tags?: string[];
  travelFromPrev?: string | boolean;
  cost?: string | number;
  bookingLink?: string;
  insiderTip?: string;
  category?: string;
  entryFee?: string;
  bestPhotoSpot?: string;
  nearbyGem?: string;
  whatToWear?: string;
  openingHours?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  date?: string;
  weather?: {
    rain?: number;
    temp?: string;
    condition?: string;
  };
  activities: ActivityItem[];
}

export interface HighlightItem {
  name: string;
  desc?: string;
  tags?: string[];
  lat?: number;
  lng?: number;
  duration?: string;
  img?: string;
  bestMonths?: string[];
}

export interface RestaurantItem {
  id?: string;
  name: string;
  desc?: string;
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  mustTry?: string;
  lat?: number;
  lng?: number;
  tags?: string[];
  img?: string;
}

export interface HotelItem {
  id?: string;
  name: string;
  desc?: string;
  type?: string;
  priceRange?: string;
  rating?: number;
  amenities?: string[];
  lat?: number;
  lng?: number;
  img?: string;
}

export interface ItineraryData {
  destName: string;
  description?: string;
  avgCost?: string;
  crowdLevel?: string;
  crowdNote?: string;
  logistics?: string;
  weather?: string;
  mapCenter?: { lat: number; lng: number };
  highlights?: HighlightItem[];
  restaurants?: RestaurantItem[];
  hotels?: HotelItem[];
  dayPlans: DayPlan[];
}
