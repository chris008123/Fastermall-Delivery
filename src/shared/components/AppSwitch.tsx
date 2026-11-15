import { Switch, type SwitchProps } from 'react-native';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

/**
 * The one switch style for the app: solid orange track when on, a neutral
 * track when off, white thumb either way. Several screens used the 10%
 * orange tint as the "on" track, which made an on switch look nearly the
 * same as an off one, especially in dark mode.
 */
export function AppSwitch(props: Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'>) {
  const { isDark } = useResolvedTheme();
  // Solid greys rather than the translucent border tokens, which are too
  // faint to read as a track on the frosted cards.
  const offTrack = isDark ? '#5c5c56' : '#c9c9c4';
  return (
    <Switch
      trackColor={{ false: offTrack, true: colors.partner.orange }}
      thumbColor="#ffffff"
      ios_backgroundColor={offTrack}
      {...props}
    />
  );
}
