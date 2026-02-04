/**
 * Database Types for Naviigo Travel Aggregator
 * Supabase PostgreSQL Schema Interfaces
 */

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string; // UUID from Supabase Auth
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD';
  preferred_language: string; // ISO 639-1 code (en, es, fr, etc.)
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  
  // Travel preferences
  travel_class_preference?: 'economy' | 'premium_economy' | 'business' | 'first';
  newsletter_subscribed: boolean;
  
  // Metadata
  total_searches: number;
  total_bookings: number;
}

export interface UserProfile extends Omit<User, 'id'> {
  id: string;
  auth_user_id: string; // Reference to Supabase auth.users
}

// ============================================================================
// FLIGHT TYPES
// ============================================================================

export interface Airport {
  code: string; // IATA code (e.g., "LAX", "JFK")
  name: string;
  city: string;
  country: string;
  timezone: string; // IANA timezone (e.g., "America/Los_Angeles")
}

export interface Airline {
  code: string; // IATA code (e.g., "AA", "UA")
  name: string;
  logo_url: string | null;
  alliance: 'star_alliance' | 'oneworld' | 'skyteam' | 'none';
}

export interface FlightSegment {
  id: string;
  departure_airport: Airport;
  arrival_airport: Airport;
  departure_time: string; // ISO 8601 timestamp
  arrival_time: string; // ISO 8601 timestamp
  duration_minutes: number;
  flight_number: string;
  airline: Airline;
  aircraft_type: string | null; // e.g., "Boeing 737-800"
  cabin_class: 'economy' | 'premium_economy' | 'business' | 'first';
  
  // Amenities
  wifi_available: boolean;
  power_outlets: boolean;
  entertainment: boolean;
  
  // Baggage
  baggage_included: {
    carry_on: number; // number of bags
    checked: number; // number of bags
  };
}

export interface Flight {
  id: string;
  
  // Route information
  origin: Airport;
  destination: Airport;
  departure_date: string; // ISO 8601 date (YYYY-MM-DD)
  return_date: string | null; // null for one-way flights
  
  // Flight details
  segments: FlightSegment[]; // Outbound segments
  return_segments: FlightSegment[] | null; // Return segments for round-trip
  total_duration_minutes: number; // Total travel time including layovers
  stops: number; // 0 for direct, 1+ for connections
  is_direct: boolean;
  
  // Pricing
  price: {
    amount: number;
    currency: string;
    display: string; // Formatted price (e.g., "$1,234.56")
  };
  price_per_passenger: number;
  total_price: number;
  taxes_and_fees: number;
  
  // Booking
  deep_link_url: string; // Affiliate link to partner site
  provider: string; // e.g., "Expedia", "Booking.com", "Kayak"
  provider_logo_url: string | null;
  booking_class: string; // Fare class code (e.g., "Y", "J", "F")
  
  // Metadata
  search_id: string; // Links to the search that generated this result
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  
  // Quality indicators
  carbon_emissions_kg: number | null;
  on_time_performance: number | null; // Percentage (0-100)
  user_rating: number | null; // 0-5 stars
  is_refundable: boolean;
  is_changeable: boolean;
  change_fee: number | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SEARCH TYPES (for caching and history)
// ============================================================================

export interface FlightSearch {
  id: string;
  user_id: string | null; // null for anonymous searches
  
  // Search parameters
  origin_code: string;
  destination_code: string;
  departure_date: string;
  return_date: string | null;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabin_class: 'economy' | 'premium_economy' | 'business' | 'first';
  
  // Results metadata
  results_count: number;
  cheapest_price: number | null;
  average_price: number | null;
  search_completed_at: string | null;
  
  // Tracking
  created_at: string;
  expires_at: string; // Cache expiration
}

// ============================================================================
// SAVED ITEMS (Wishlist/Favorites)
// ============================================================================

export interface SavedFlight {
  id: string;
  user_id: string;
  flight_id: string;
  flight: Flight; // Denormalized for quick access
  notes: string | null;
  created_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type TripType = 'one-way' | 'round-trip' | 'multi-city';
export type SortOption = 'cheapest' | 'fastest' | 'best' | 'earliest' | 'latest';
export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

// Supabase Database Schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      flights: {
        Row: Flight;
        Insert: Omit<Flight, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Flight, 'id'>>;
      };
      flight_searches: {
        Row: FlightSearch;
        Insert: Omit<FlightSearch, 'id' | 'created_at'>;
        Update: Partial<Omit<FlightSearch, 'id'>>;
      };
      saved_flights: {
        Row: SavedFlight;
        Insert: Omit<SavedFlight, 'id' | 'created_at'>;
        Update: Partial<Omit<SavedFlight, 'id'>>;
      };
    };
  };
}
