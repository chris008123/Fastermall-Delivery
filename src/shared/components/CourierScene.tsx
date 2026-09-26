import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '@/src/theme';
import type { ColorScheme } from '@/src/theme/colors';

interface CourierSceneProps {
  scheme: ColorScheme;
  height?: number;
}

/** Flat-style hero illustration for the Login screen — a scooter courier
 * carrying a package along a dashed route line, in the partner-orange +
 * job-type palette. Ported from the Figma redesign's `CourierScene` (a web
 * SVG) into react-native-svg with the same viewBox and paths. */
export function CourierScene({ scheme, height = 180 }: CourierSceneProps) {
  const theme = colors[scheme];
  const marketplace = colors.jobType.MARKETPLACE;
  const laundry = colors.jobType.LAUNDRY;
  const food = colors.jobType.FOOD;

  return (
    <Svg viewBox="0 0 320 220" width="100%" height={height}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={marketplace.bright} stopOpacity={0.16} />
          <Stop offset="1" stopColor={colors.partner.orange} stopOpacity={0.05} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={320} height={220} rx={26} fill="url(#sky)" />
      {/* route line */}
      <Path
        d="M20 176 C90 176 90 86 160 86 S250 44 300 44"
        fill="none"
        stroke={colors.partner.orange}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="2 9"
        opacity={0.8}
      />
      <Circle cx={300} cy={44} r={9} fill={colors.partner.orange} />
      <Circle cx={300} cy={44} r={3.4} fill="#fff" />
      {/* buildings */}
      <Rect x={238} y={70} width={30} height={70} rx={5} fill={marketplace.base} opacity={0.3} />
      <Rect x={272} y={86} width={24} height={54} rx={5} fill={laundry.bright} opacity={0.28} />
      {/* shadow */}
      <Ellipse cx={120} cy={188} rx={70} ry={8} fill="#000" opacity={0.18} />
      {/* scooter body */}
      <Circle cx={86} cy={176} r={18} fill="none" stroke={theme.text} strokeWidth={5} />
      <Circle cx={158} cy={176} r={18} fill="none" stroke={theme.text} strokeWidth={5} />
      <Path
        d="M86 176 L120 176 L134 150 L150 150"
        fill="none"
        stroke={colors.partner.orange}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M108 150 L142 150 L138 176" fill={colors.partner.orange} />
      <Path d="M150 150 L162 132" stroke={theme.text} strokeWidth={5} strokeLinecap="round" />
      {/* rider */}
      <Circle cx={128} cy={112} r={12} fill={food.bright} />
      <Path d="M120 104 a10 10 0 0 1 18 3 l-3 4 h-13 z" fill={colors.partner.orangeDark} />
      <Path d="M124 124 q6 -8 16 -6 l6 22 h-24 z" fill={marketplace.bright} />
      {/* delivery box */}
      <Rect x={96} y={120} width={26} height={24} rx={4} fill={colors.partner.orangeDark} />
      <Path d="M96 130 h26 M109 120 v24" stroke={colors.partner.orange700} strokeWidth={2} />
    </Svg>
  );
}
