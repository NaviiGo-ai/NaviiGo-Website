export const SECTION_ORDER = [
  '01-arrival-hero',
  '02-discover',
  '03-torn-banner',
  '04-plan-experience',
  '05-manage-chapter',
  '06-remember-memory-field',
  '07-next-journey-footer',
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