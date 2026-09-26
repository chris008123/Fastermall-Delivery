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
    ? intensity === 'strong' ? 'rgba(43, 39, 33, 0.85)' : 'rgba(43, 39, 33, 0.72)'
    : intensity === 'strong' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.72)';

  const solidTint = isDark
    ? intensity === 'strong' ? 'rgba(23, 21, 18, 0.96)' : 'rgba(33, 30, 25, 0.92)'
    : intensity === 'strong' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.9)';

  // Tinted toward the mode's own text color (warm-white in dark, warm-black
  // in light) rather than a flat gray or an always-white highlight edge —
  // matches the border rule the rest of the design system now follows.
  const borderColor = isDark ? 'rgba(247, 243, 236, 0.16)' : 'rgba(28, 26, 22, 0.14)';

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
