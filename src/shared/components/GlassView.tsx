import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { radii, shadows } from '@/src/theme';

type GlassIntensity = 'regular' | 'strong';
type GlassRadius = 'sm' | 'md' | 'card' | 'glass' | 'tile' | 'pill';

interface GlassViewProps extends ViewProps {
  intensity?: GlassIntensity;
  radius?: GlassRadius;
  shadow?: boolean;
  className?: string;
}

/** Frosted glass panel, ported as-is from the customer app (same Android
 * blur-reliability workaround: solid tint instead of BlurView on Android). */
export function GlassView({
  intensity = 'regular',
  radius = 'glass',
  shadow = true,
  style,
  children,
  ...rest
}: GlassViewProps) {
  const { isDark } = useResolvedTheme();
  const borderRadius = radii[radius];

  const tint = isDark
    ? intensity === 'strong' ? 'rgba(28, 28, 26, 0.72)' : 'rgba(28, 28, 26, 0.55)'
    : intensity === 'strong' ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.6)';

  const solidTint = isDark
    ? intensity === 'strong' ? 'rgba(20, 20, 19, 0.94)' : 'rgba(20, 20, 19, 0.88)'
    : intensity === 'strong' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.9)';

  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)';

  return (
    // Shadow lives on the outermost view (elevation/shadow props don't play
    // well with overflow: hidden), while `style` — almost always padding,
    // gap, and alignment meant for the card's content — is applied on the
    // innermost view, where `children` actually render. Previously `style`
    // was applied to this outer wrapper instead, which left the visible
    // card with little to no real internal padding: text sat close enough
    // to the rounded corners to visually clip against them, and the whole
    // card rendered ~20px further right/narrower than sibling elements
    // that share the same screen padding.
    <View style={shadow ? shadows.glass : undefined} {...rest}>
      <View style={{ borderRadius, overflow: 'hidden' }}>
        {Platform.OS !== 'android' && (
          <BlurView
            intensity={isDark ? 40 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View
          style={[
            {
              backgroundColor: Platform.OS === 'android' ? solidTint : tint,
              borderWidth: StyleSheet.hairlineWidth * 2,
              borderColor,
              borderRadius,
            },
            style,
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}
