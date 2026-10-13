/**
 * Central API Proxy Request & Response Type Definitions
 */

export interface ItineraryGenerateRequest {
  destination: string;
  operationId: string;
  destName?: string | null;
  purpose?: string | null;
  group?: string | null;
  days: number;
  budget: number;
  startDate?: string | null;
  endDate?: string | null;
  preferences?: Record<string, unknown> | null;
  browsingSignals?: Record<string, unknown> | null;
  travelerType?: string | null;
  originCity?: string | null;
  arrivalTime?: string | null;
  arrivalMode?: string | null;
  departureTime?: string | null;
  departureMode?: string | null;
  hotelArea?: string | null;
  mustDo?: Array<{ name: string; dayIndex: number | null }> | null;
  routeStops?: Array<{
    name: string;
    stayDays: number;
    travelMode: 'flight' | 'train' | 'bus' | 'car';
    travelTime: 'morning' | 'afternoon' | 'evening' | 'night';
  }> | null;
}

export interface ItineraryPersistence {
  status: 'saved' | 'unsaved' | 'ambiguous';
  durable: boolean;
  replayed: boolean;
}

export interface ItineraryPersistenceReceipt {
  operationId: string;
  itineraryId: string;
  ownerUid: string;
  revisionId: string;
  status: 'committed';
}

export interface ItineraryGenerateResponse {
  success: boolean;
  userId?: string;
  itinerary?: Record<string, unknown>;
  persistence?: ItineraryPersistence;
  receipt?: ItineraryPersistenceReceipt;
  code?: string;
  error?: string;
  retryAfter?: number;
}

export interface DeepDiveRequest {
  destination: string;
  companion?: string;
  vibe?: string;
}

export interface DeepDiveResponse {
  redditConsensus?: string;
  hiddenGems?: Array<{ name: string; desc: string }>;
  touristTrapsToAvoid?: Array<{ trap: string; betterAlternative: string }>;
  instagramWorthy?: Array<{ spot: string; bestTime: string }>;
  localFoodMustHaves?: Array<{ dish: string; where: string }>;
  error?: string;
}

export interface SearchApiRequest {
  type: 'flights' | 'trains' | 'cabs' | 'hotels';
  from: string;
  to: string;
  date: string;
  travelers?: number;
  page?: number;
}

export interface SearchApiResponse<T = any> {
  success: boolean;
  results: T[];
  cached?: boolean;
  error?: string;
}

export interface TasteUpdateRequest {
  userId: string;
  preferences: string[];
}

export interface TasteUpdateResponse {
  success: boolean;
  error?: string;
}
