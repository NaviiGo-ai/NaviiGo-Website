// ─── Firestore Collection Schema ──────────────────────────────────────────────
// All TypeScript interfaces for the Firestore database structure.
// Collections: users/{uid}, users/{uid}/bookings, users/{uid}/tracking,
//              users/{uid}/preferences, users/{uid}/itineraries, itineraries/{shareId}

import { Timestamp } from 'firebase/firestore';

// ─── User Profile ─────────────────────────────────────────────────────────────
// Path: users/{uid}
export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  totalTrips: number;
  totalBookings: number;
}

// ─── User Preferences ─────────────────────────────────────────────────────────
// Path: users/{uid}/preferences/main
export interface UserPreferences {
  travelStyle: 'budget' | 'mid-range' | 'luxury' | null;
  preferredGroup: 'solo' | 'couple' | 'family' | 'friends' | 'large' | null;
  interests: string[]; // e.g. ['spiritual', 'adventure', 'cultural']
  dietaryPreferences: string[]; // e.g. ['vegetarian', 'jain']
  accessibilityNeeds: string[];
  homeCity: string | null;
  recentSearches: RecentSearch[];
  updatedAt: Timestamp;
}

export interface RecentSearch {
  query: string;
  type: 'flights' | 'hotels' | 'trains' | 'cabs';
  timestamp: Timestamp;
  from?: string;
  to?: string;
}

// ─── Booking ──────────────────────────────────────────────────────────────────
// Path: users/{uid}/bookings/{bookingId}
export interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'train' | 'cab';
  status: 'intent_created' | 'confirmed' | 'cancelled' | 'completed';
  bookingMethod: 'amadeus' | 'redirect';

  // Search context
  from: string;
  to: string;
  date: string;
  travelers: number;

  // Booking details
  providerName: string; // airline, hotel name, etc.
  providerCode: string; // flight number, hotel id, etc.
  pnr: string | null; // actual PNR from Amadeus, null for redirects
  totalPrice: number;
  currency: string;
  
  // Passenger/guest info
  passengers: PassengerInfo[];
  contactEmail: string;
  contactPhone: string;

  // Redirect info (for trains/cabs)
  redirectUrl: string | null;
  redirectProvider: string | null; // 'IRCTC', 'Cleartrip', 'Ola', 'Uber'

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PassengerInfo {
  title: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
}

// ─── Saved Itinerary ──────────────────────────────────────────────────────────
// Path: users/{uid}/itineraries/{itineraryId}
export interface SavedItineraryDoc {
  id: string;
  destId: string;
  destName: string;
  form: Record<string, unknown>; // wizard form data
  generatedData: Record<string, unknown> | null; // AI-generated itinerary
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean; // currently active trip?
}

// ─── Live Tracking ────────────────────────────────────────────────────────────
// Path: users/{uid}/tracking/{tripId}
export interface TrackingSession {
  tripId: string;
  itineraryId: string;
  destName: string;
  startedAt: Timestamp;
  lastUpdatedAt: Timestamp;
  isActive: boolean;

  // Current position
  currentLat: number;
  currentLng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;

  // Activity progress
  activities: TrackedActivity[];
  completedCount: number;
  totalCount: number;
}

export interface TrackedActivity {
  index: number;
  name: string;
  lat: number;
  lng: number;
  status: 'completed' | 'active' | 'upcoming';
  completedAt: Timestamp | null;
  completionMethod: 'manual' | 'gps_auto' | null;
  timeSpentMinutes: number | null;
}

// Path: users/{uid}/tracking/{tripId}/locations/{locationId}
export interface LocationPoint {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: Timestamp;
}

// ─── Shared Itinerary (collaborative) ─────────────────────────────────────────
// Path: itineraries/{shareId}
export interface SharedItinerary {
  form: Record<string, unknown>;
  customPlans: unknown[];
  destName: string;
  collaborators: number;
  ownerUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Digital Passport ─────────────────────────────────────────────────────────
// Path: users/{uid}/passport/stats
export interface PassportStatsDoc {
  totalStamps: number;
  totalXP: number;
  level: number;
  streak: number;
  lastTripDate: Timestamp | null;
  achievements: string[];
  statesVisited: string[];
  citiesVisited: string[];
  categoryCounts: Record<string, number>;
  totalActivitiesCompleted: number;
  updatedAt: Timestamp;
}

// Path: users/{uid}/passport/stamps/{stampId}
export interface PassportStampDoc {
  name: string;
  location: string;
  state: string;
  icon: string;
  type: 'Spiritual' | 'Heritage' | 'Adventure' | 'Nature' | 'Beach' | 'City';
  xpEarned: number;
  visitedDate: Timestamp;
  activities: string[];
  verificationMethod: 'itinerary_complete' | 'manual' | 'gps';
  itineraryId?: string;
  createdAt: Timestamp;
}

// ─── Destination Reviews ──────────────────────────────────────────────────────
// Path: reviews/{destId}/entries/{reviewId}
// ─── Leaderboard ──────────────────────────────────────────────────────────────
// Path: leaderboard/{uid}
export interface LeaderboardEntryDoc {
  uid: string;
  displayName: string;
  photoURL: string | null;
  totalXP: number;
  totalStamps: number;
  level: number;
  statesCount: number;
  lastUpdated: Timestamp;
}

export interface DestinationReview {
  id?: string;
  userId: string;
  userName: string;
  userPhoto: string;
  destId: string;
  destName: string;
  rating: number;
  title: string;
  body: string;
  travelDate: string;
  group: string;
  budget: string;
  pros: string[];
  cons: string[];
  helpfulCount: number;
  createdAt: Timestamp;
}

