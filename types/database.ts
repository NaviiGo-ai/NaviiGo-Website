export type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number; // Timestamp
  totalStamps: number;
  completedCircuits: number;
};

export type PassportStamp = {
  id: string; // Auto-generated
  userId: string;
  templeId: string;
  templeName: string;
  location: string;
  visitedAt: number; // Timestamp
  verifiedVia: 'GPS' | 'QR' | 'MANUAL';
  notes: string;
};

export type TempleCircuit = {
  id: string; // e.g. "varanasi_ghats", "char_dham"
  name: string;
  description: string;
  region: string;
  templesIncluded: { templeId: string; name: string }[];
  rewardBadgeUrl: string;
};

export type UserCircuitProgress = {
  userId: string;
  circuitId: string;
  stampsCollected: string[]; // array of templeIds
  completedAt: number | null; // Timestamp or null
};

export type AIItinerary = {
  id: string;
  userId: string;
  destination: string;
  durationDays: number;
  budgetType: 'Budget' | 'Standard' | 'Premium';
  interests: string[];
  generatedAt: number;
  days: {
    dayNumber: number;
    activities: {
      time: string;
      title: string;
      description: string;
      type: 'Temple' | 'Food' | 'Transport' | 'Explore';
    }[];
  }[];
  // Storing simple JSON prevents deep nesting reads which eat up Firebase quotas.
};
