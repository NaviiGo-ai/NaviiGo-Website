// Frontend/lib/constants.ts
export const SECTION_ORDER = [
  '01-hero',
  '02-brand-philosophy',
  '03-destination-discovery',
  '04-travel-designed',
  '05-private-corporate',
  '06-immersive-story',
  '07-concierge-support',
  '08-featured-journey',
  '09-numbers-trust',
  '10-testimonials',
  '11-travel-styles',
  '12-fullscreen-cta',
  '13-contact',
  '14-oversized-footer'
] as const;

export type SectionName = typeof SECTION_ORDER[number];

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const ANIMATION_DURATIONS = {
  fast: 0.3,
  medium: 0.5,
  slow: 0.8,
  slower: 1.2,
};