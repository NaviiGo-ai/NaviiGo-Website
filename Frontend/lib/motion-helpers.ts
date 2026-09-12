import { Variants } from 'framer-motion';

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
};

export const fadeInUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.5, ease: 'easeOut' } }
});

export const staggerContainer = (staggerChildren: number, delayChildren: number = 0) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren
    }
  }
});

export const hoverLift = {
  whileTap: { scale: 0.95 },
  whileHover: { y: -4, scale: 1.02 }
};

export const scaleOnHover = {
  whileTap: { scale: 0.95 },
  whileHover: { scale: 1.05 }
};