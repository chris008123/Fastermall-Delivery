import { Platform } from 'react-native';

export const shadows = {
  soft: Platform.select({
    ios: { shadowColor: '#1c1c1a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
    android: { elevation: 2 },
    default: {},
  }),
  card: Platform.select({
    ios: { shadowColor: '#1c1c1a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20 },
    android: { elevation: 4 },
    default: {},
  }),
  raised: Platform.select({
    ios: { shadowColor: '#1c1c1a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 28 },
    android: { elevation: 8 },
    default: {},
  }),
  glass: Platform.select({
    ios: { shadowColor: '#1c1c1a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 32 },
    android: { elevation: 6 },
    default: {},
  }),
} as const;
