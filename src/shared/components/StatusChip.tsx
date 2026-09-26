import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface StatusChipProps {
  label: string;
  /** A solid 6-digit hex color — shared by the dot/icon, border, and text. */
  tone: string;
  /** Optional icon shown instead of the plain dot — for statuses (like
   * document verification) where the icon itself carries meaning, not just
   * the color. */
  icon?: ReactNode;
}

/** Small outlined status pill — verified/pending/rejected/expiring-soon on
 * documents, or any other glanceable status label. Thin border, never
 * filled with a primary CTA color, per the design system's rule that status
 * color and action color stay visually distinct. Ported from the Figma
 * redesign's primitive of the same name. */
export function StatusChip({ label, tone, icon }: StatusChipProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        borderRadius: 999,
        borderWidth: 1,
        // ~45% opacity border via hex alpha suffix — expects `tone` to be a
        // plain 6-digit hex color (e.g. colors.semantic.success).
        borderColor: `${tone}73`,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      {icon ?? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone }} />}
      <Text className="text-overline font-semibold" style={{ color: tone, letterSpacing: 0.8 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
