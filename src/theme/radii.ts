export const radii = {
  sm: 12,
  md: 16,
  card: 20,
  glass: 22,
  tile: 24,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radii;
