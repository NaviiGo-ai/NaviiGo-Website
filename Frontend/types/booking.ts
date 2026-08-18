/**
 * Universal Booking Hub Interfaces
 */

export interface FlightResult {
  id: string;
  airline: string;
  code: string;
  from: string;
  to: string;
  dep: string;
  arr: string;
  duration: string;
  stops: string | number;
  price: string | number;
  priceNum: number;
  class?: string;
  seats?: number;
  tags?: string[];
  logo?: string;
  badge?: string;
  priceDiff?: string;
  deepLink?: string;
  score?: number;
  _date?: string;
}

export interface TrainResult {
  id: string;
  name: string;
  number: string;
  from: string;
  to: string;
  dep: string;
  arr: string;
  duration: string;
  class?: string;
  price: string | number;
  priceNum: number;
  avail?: string;
  tags?: string[];
  days?: string;
  badge?: string;
  deepLink?: string;
  score?: number;
  _date?: string;
}

export interface CabResult {
  id: string;
  provider: string;
  type: string;
  category?: string;
  pax?: number;
  price: string | number;
  priceNum: number;
  perKm?: string;
  eta?: string;
  features?: string[];
  tags?: string[];
  rating?: number;
  trips?: number;
  badge?: string;
  from?: string;
  to?: string;
  deepLink?: string;
  score?: number;
  _date?: string;
}

export interface HotelResult {
  id: string;
  name: string;
  area: string;
  stars?: number;
  price: string | number;
  priceNum: number;
  perNight?: string;
  rating?: number;
  reviews?: number;
  amenities?: string[];
  tags?: string[];
  image?: string;
  refundable?: boolean;
  distance?: string;
  badge?: string;
  deepLink?: string;
  score?: number;
  _date?: string;
}

export type BookingResult = FlightResult | TrainResult | CabResult | HotelResult;
