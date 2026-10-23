import * as Haptics from 'expo-haptics';
import { useInteractionStore } from '@/src/stores/interactionStore';

const enabled = () => useInteractionStore.getState().hapticsEnabled;
const safe = (p: Promise<void>) => p.catch(() => {});

/** Haptic feedback that respects the partner's setting. Safe to call from
 * anywhere (and on platforms without a haptic engine). From a worklet,
 * call through runOnJS. */
export const haptics = {
  select: () => {
    if (enabled()) void safe(Haptics.selectionAsync());
  },
  light: () => {
    if (enabled()) void safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  success: () => {
    if (enabled()) void safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
};
