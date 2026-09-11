/**
 * Explore Bento Grid & Catalog Interfaces
 */

export interface DestinationExploreItem {
  id: string;
  name: string;
  state: string;
  image: string;
  tagline: string;
  category: string;
  rating?: number;
  bestTime?: string;
  duration?: string;
  budget?: string;
}

export interface HiddenGemItem {
  name: string;
  state: string;
  image: string;
  desc: string;
  crowdLevel?: string;
  bestSeason?: string;
  difficulty?: string;
}

export interface CuisineTrailItem {
  region: string;
  states: string[];
  icon: string;
  image: string;
  dishes: string[];
}

export interface TrendingItem {
  name: string;
  state: string;
  tag: string;
  image: string;
  travelers?: string;
}

export interface SeasonalPickItem {
  name: string;
  season: string;
  image: string;
  note?: string;
  bestFor?: string;
}

/**
 * A live local event, as returned by `POST {backend}/api/explore/events`
 * (see `backend/services/events_engine.py`).
 */
export interface LocalEvent {
  title: string;
  date: {
    start_date: string;
    when: string;
  };
  address: string[];
  link: string;
  description: string;
  thumbnail: string;
  venue: {
    name: string;
    rating?: number;
    reviews?: number;
    link?: string;
  };
}
