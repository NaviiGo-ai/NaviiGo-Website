/**
 * Digital Pilgrim Passport & Leaderboard Models
 */

export interface PassportStamp {
  name: string;
  location: string;
  state: string;
  icon: string;
  type: string;
  xpEarned: number;
  visitedDate: string;
  activities?: string[];
  verificationMethod?: string;
}

export interface UserPassportStats {
  totalStamps: number;
  totalXP: number;
  level: number;
  streak: number;
  lastTripDate?: string;
  achievements: string[];
  statesVisited: string[];
  citiesVisited: string[];
  categoryCounts: Record<string, number>;
  totalActivitiesCompleted: number;
}

export interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalXP: number;
  level: number;
  stampsCount: number;
  rank?: number;
}
