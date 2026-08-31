import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';
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
 * decorative-circle + gradient + centered title/subtitle language.
 *
 * NOTE: the customer app's header also renders an image wordmark
 * (`assets/images/logo-mark.png`). That asset isn't present anywhere in
 * this delivery app's uploaded project (no `assets/images` directory at
 * all, despite app.json referencing icon/splash paths there), so it's
 * left out here rather than requiring a file that doesn't exist and
 * crashing Metro. If you have a logo asset for the partner app, drop it
 * in `assets/images/` and this can gain the same badge treatment as the
 * customer app.
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
      {/* Text-only wordmark badge in place of the customer app's image
          logo mark — see the note above. */}
      <View className="mb-4 flex-row items-center justify-center" style={{ alignSelf: 'center' }}>
        <Text
          className="text-overline font-bold"
          style={{ color: '#ffffff', letterSpacing: 1.2, opacity: 0.92 }}
        >
          FASTERMALL PARTNER
        </Text>
      </View>
      <Text className="text-h1 font-bold text-white text-center">{title}</Text>
      {subtitle ? <Text className="text-body text-white/80 mt-1 text-center">{subtitle}</Text> : null}
    </LinearGradient>
  );
}
