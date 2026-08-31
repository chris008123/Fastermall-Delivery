import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';
import { AnimatedPressable } from './AnimatedPressable';

interface PartnerAuthHeroHeaderProps {
  title: string;
  subtitle?: string;
  height?: number;
  onBack?: () => void;
}

/**
 * Ported from the customer app's AuthHeroHeader, recolored to the
 * partner app's own orange identity instead of brand teal — same
 * decorative-circle + gradient + centered title/subtitle language, and
 * now the same white badge + wordmark treatment using this app's own
 * `assets/images/logo-mark.png` (added once a logo was supplied).
 */
export function PartnerAuthHeroHeader({ title, subtitle, height = 196, onBack }: PartnerAuthHeroHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.partner.orangeDark, colors.partner.orange]}
      style={{ height: height + insets.top, paddingTop: insets.top }}
      className="justify-end overflow-hidden rounded-b-[32px] px-6 pb-8"
    >
      <View
        className="absolute h-40 w-40 rounded-full bg-white/10"
        style={{ top: insets.top - 40, right: -40 }}
      />
      <View
        className="absolute h-16 w-16 rounded-full bg-white/10"
        style={{ top: insets.top + 64, right: 28 }}
      />
      {onBack ? (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          scaleTo={0.92}
          onPress={onBack}
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: 20,
            height: 38,
            width: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.28)',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.4} color="#ffffff" />
        </AnimatedPressable>
      ) : null}
      <View className="mb-4 flex-row items-center justify-center gap-3" style={{ alignSelf: 'center' }}>
        {/* Same white raised-badge treatment as the customer app's
            AuthHeroHeader, shadow recolored to orangeDark to match this
            header's own gradient instead of brand teal. */}
        <View
          className="h-16 w-16 items-center justify-center rounded-3xl bg-white/95"
          style={{
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.55)',
            shadowColor: colors.partner.orangeDark,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Image
            source={require('@/assets/images/logo-mark.png')}
            style={{ width: 52, height: 36 }}
            resizeMode="contain"
          />
        </View>
        <Text className="text-h2 font-bold text-white" style={{ letterSpacing: 0.3 }}>
          Partner
        </Text>
      </View>
      <Text className="text-h1 font-bold text-white text-center">{title}</Text>
      {subtitle ? <Text className="text-body text-white/80 mt-1 text-center">{subtitle}</Text> : null}
    </LinearGradient>
  );
}
