import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bottom padding for a scrolling screen that has no tab bar under it.
 * Includes the phone's bottom inset (Android's button/gesture bar, the iOS
 * home indicator), so the last card always scrolls fully clear of it
 * instead of stopping underneath. Screens with the nav use useNavClearance. */
export function useScreenBottomPadding(extra = 32) {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}
