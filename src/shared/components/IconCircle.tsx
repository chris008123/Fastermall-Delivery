import type { ReactNode } from 'react';
import { View } from 'react-native';

interface IconCircleProps {
  children: ReactNode;
  /** A solid 6-digit hex color — used as-is for the icon, and at ~20%
   * opacity for the circle's background. */
  tint: string;
  size?: number;
}

/** Colored icon-in-a-circle chip — the shared treatment for settings rows,
 * document status rows, and support topic rows. Ported from the Figma
 * redesign's primitive of the same name so every row that needs one uses
 * the identical shape instead of each screen inventing its own container. */
export function IconCircle({ children, tint, size = 40 }: IconCircleProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.325,
        // ~20% opacity tint via hex alpha suffix — expects `tint` to be a
        // plain 6-digit hex color (e.g. colors.partner.orange), not rgba.
        backgroundColor: `${tint}33`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}
