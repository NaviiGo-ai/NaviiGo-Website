/**
 * Central API Proxy Request & Response Type Definitions
 */

export interface ItineraryGenerateRequest {
  destination: string;
  destName?: string;
  purpose?: string;
  group?: string;
  days: number;
  budget: number;
  startDate?: string;
  endDate?: string;
  userId?: string | null;
  preferences?: Record<string, unknown> | null;
  browsingSignals?: Record<string, unknown> | null;
  travelerType?: string | null;
  originCity?: string | null;
  uuid?: string | null;
  routeStops?: Array<{
    name: string;
    stayDays: number;
    travelMode: 'flight' | 'train' | 'bus' | 'car';
    travelTime: 'morning' | 'afternoon' | 'evening' | 'night';
  }>;
}

export interface ItineraryGenerateResponse {
  success: boolean;
  itinerary?: any;
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
