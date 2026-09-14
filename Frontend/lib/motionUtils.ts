import gsap from 'gsap';

export const easing = {
  power4: 'power4.out',
  expo: 'expo.out',
  cubic: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

export const durations = {
  fast: 0.3,
  medium: 0.5,
  slow: 0.8,
  slower: 1.2,
};

export const createTimeline = (vars: GSAPTimelineVars = {}) => {
  // Assuming gsap is available globally or imported where used
  // This is a helper function that returns a new gsap.timeline instance
  return gsap.timeline(vars);
};