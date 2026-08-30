import { Easing } from 'react-native-reanimated';

export const durations = {
  fast: 150,
  base: 250,
  slow: 400,
  slower: 500,
} as const;

export const easings = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
} as const;

export const springs = {
  snappy: { damping: 18, stiffness: 380, mass: 0.6 },
  gentle: { damping: 20, stiffness: 200, mass: 0.9 },
} as const;

export function staggerDelay(index: number, step = 40, max = 8) {
  return Math.min(index, max) * step;
}
