import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';
import { GlassView } from './GlassView';

/**
 * Skeleton loaders: grey shapes in the layout of the content that's on its
 * way, so a screen doesn't jump from a spinner to a full page. Every block
 * inside one <Skeleton> pulses together off a single shared value (so the
 * screen breathes as one, not as dozens of out-of-step blocks), and the
 * pulse stops when the phone is set to reduce motion.
 */

const PulseContext = createContext<SharedValue<number> | null>(null);

export function Skeleton({
  children,
  label = 'Loading',
  style,
}: {
  children: ReactNode;
  /** What screen readers announce in place of the grey shapes. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0.5;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduceMotion, pulse]);

  return (
    <PulseContext.Provider value={pulse}>
      {/* One announcement for the whole thing; the shapes themselves are hidden. */}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityState={{ busy: true }}
        style={style}
      >
        {children}
      </View>
    </PulseContext.Provider>
  );
}

/** One grey shape. Use inside <Skeleton>. */
export function Bone({
  width = '100%',
  height = 12,
  radius = 6,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useContext(PulseContext);
  const { isDark } = useResolvedTheme();
  const animated = useAnimatedStyle(() => ({ opacity: pulse ? 0.45 + pulse.value * 0.55 : 0.7 }));
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: isDark ? 'rgba(247, 243, 236, 0.12)' : 'rgba(28, 26, 22, 0.10)',
        },
        animated,
        style,
      ]}
    />
  );
}

const Row = ({ children, gap = 8, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
);

// ─── Pieces shaped like real cards ──────────────────────────────────────────

/** Matches JobCard on the Jobs tab: accent edge, badge + fee, two address
 * lines, trip summary. */
export function JobCardBones() {
  const { isDark } = useResolvedTheme();
  return (
    <GlassView radius="card" style={{ padding: 0, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 4, backgroundColor: isDark ? 'rgba(247, 243, 236, 0.12)' : 'rgba(28, 26, 22, 0.10)' }} />
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Bone width={56} height={20} radius={10} />
            <Bone width={84} height={18} />
          </Row>
          <View style={{ gap: 8 }}>
            <Bone width="72%" height={14} />
            <Bone width="55%" height={14} />
          </View>
          <Bone width="40%" height={11} />
        </View>
      </View>
    </GlassView>
  );
}

/** A plain list row: icon circle, two lines, trailing value. Ledger entries,
 * notifications and documents all have this shape. */
export function ListRowBones({ trailing = true, iconRadius = 17 }: { trailing?: boolean; iconRadius?: number }) {
  return (
    <Row gap={12} style={{ paddingVertical: 10 }}>
      <Bone width={34} height={34} radius={iconRadius} />
      <View style={{ flex: 1, gap: 7 }}>
        <Bone width="68%" height={13} />
        <Bone width="42%" height={10} />
      </View>
      {trailing ? <Bone width={64} height={14} /> : null}
    </Row>
  );
}

// ─── Whole-screen and section skeletons ─────────────────────────────────────

/** Home, while the dashboard loads for the first time. Mirrors the real
 * layout: greeting + bell, status card with the slider, job card, wallet. */
export function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  return (
    <Skeleton
      label="Loading your dashboard"
      style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top + 16, paddingHorizontal: 20, gap: 16 }}
    >
      <Row gap={12}>
        <View style={{ flex: 1, gap: 8 }}>
          <Bone width={90} height={11} />
          <Bone width="55%" height={26} radius={8} />
        </View>
        <Bone width={44} height={44} radius={22} />
      </Row>

      <GlassView radius="card" intensity="strong" style={{ padding: 20, gap: 16 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Bone width={90} height={13} />
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Bone width={40} height={9} />
            <Bone width={120} height={26} radius={8} />
          </View>
        </Row>
        <Bone height={64} radius={32} />
      </GlassView>

      <JobCardBones />

      <GlassView radius="card" style={{ padding: 20, gap: 12 }}>
        <Bone width={60} height={10} />
        <Bone width="50%" height={34} radius={8} />
        <Bone width="45%" height={11} />
        <Bone height={8} radius={4} />
      </GlassView>
    </Skeleton>
  );
}

/** A few job cards: the Jobs tab's first load, and Home's job slot. */
export function JobListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Skeleton label="Checking for nearby jobs" style={{ gap: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <JobCardBones key={i} />
      ))}
    </Skeleton>
  );
}

/** Job detail and active delivery, until the job arrives. Back button, badge,
 * big fee, then the route and summary cards. */
export function JobDetailSkeleton() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  return (
    <Skeleton
      label="Loading delivery"
      style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top + 16, paddingHorizontal: 20, gap: 16 }}
    >
      <Bone width={40} height={40} radius={20} />
      <Bone width={64} height={22} radius={11} />
      <Bone width="48%" height={36} radius={8} />
      <Bone width="35%" height={12} />

      <GlassView radius="card" style={{ padding: 18, gap: 18 }}>
        {[0, 1].map((i) => (
          <Row key={i} gap={12} style={{ alignItems: 'flex-start' }}>
            <Bone width={22} height={22} radius={11} />
            <View style={{ flex: 1, gap: 7 }}>
              <Bone width={70} height={10} />
              <Bone width="80%" height={14} />
              <Bone width="50%" height={11} />
            </View>
          </Row>
        ))}
      </GlassView>

      <GlassView radius="card" style={{ padding: 18, gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <Row key={i} style={{ justifyContent: 'space-between' }}>
            <Bone width="38%" height={12} />
            <Bone width={70} height={14} />
          </Row>
        ))}
      </GlassView>

      <View style={{ flex: 1 }} />
      <Bone height={54} radius={27} style={{ marginBottom: insets.bottom + 16 }} />
    </Skeleton>
  );
}

/** Wallet transactions, before the first page arrives. */
export function LedgerSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Skeleton label="Loading transactions" style={{ marginTop: 16, gap: 4 }}>
      <Bone width={70} height={10} style={{ marginBottom: 6 }} />
      {Array.from({ length: rows }, (_, i) => (
        <ListRowBones key={i} />
      ))}
    </Skeleton>
  );
}

/** Notifications list, before the first page arrives. */
export function NotificationListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Skeleton label="Loading notifications" style={{ gap: 10 }}>
      <Bone width={60} height={10} style={{ marginTop: 8 }} />
      {Array.from({ length: rows }, (_, i) => (
        <GlassView key={i} radius="card" style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
          <ListRowBones trailing={false} />
        </GlassView>
      ))}
    </Skeleton>
  );
}

/** Documents screen: status banner, then one card per document. */
export function DocumentListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Skeleton label="Loading your documents" style={{ gap: 12 }}>
      <GlassView radius="card" style={{ padding: 16 }}>
        <ListRowBones trailing={false} iconRadius={11} />
      </GlassView>
      {Array.from({ length: rows }, (_, i) => (
        <GlassView key={i} radius="card" style={{ padding: 16, gap: 12 }}>
          <Row gap={12}>
            <Bone width={48} height={48} radius={12} />
            <View style={{ flex: 1, gap: 7 }}>
              <Bone width="60%" height={14} />
              <Bone width="40%" height={10} />
            </View>
            <Bone width={70} height={22} radius={11} />
          </Row>
        </GlassView>
      ))}
    </Skeleton>
  );
}

/** Support chat: alternating bubbles, theirs on the left, yours on the right. */
export function ChatSkeleton() {
  const bubbles: { mine: boolean; width: DimensionValue; height: number }[] = [
    { mine: false, width: '70%', height: 54 },
    { mine: true, width: '55%', height: 38 },
    { mine: false, width: '62%', height: 38 },
    { mine: true, width: '48%', height: 54 },
  ];
  return (
    <Skeleton label="Loading conversation" style={{ gap: 10, paddingTop: 4 }}>
      {bubbles.map((b, i) => (
        <Bone
          key={i}
          width={b.width}
          height={b.height}
          radius={18}
          style={{ alignSelf: b.mine ? 'flex-end' : 'flex-start' }}
        />
      ))}
    </Skeleton>
  );
}
