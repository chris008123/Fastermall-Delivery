import { useRouter, useSegments } from 'expo-router';
import { Bell, Home, Package, User, Wallet } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/src/ds/haptics';
import { lift } from '@/src/ds/tokens';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { useNavStyleStore, type NavStyle } from '@/src/stores/navStyleStore';
import { selectUnreadCount, useNotificationsStore } from '@/src/stores/notificationsStore';

type NavKey = 'home' | 'jobs' | 'wallet' | 'notifications' | 'profile';

const ITEMS: { key: NavKey; href: string; icon: typeof Home; label: string }[] = [
  { key: 'home', href: '/(partner)', icon: Home, label: 'Home' },
  { key: 'jobs', href: '/(partner)/jobs', icon: Package, label: 'Jobs' },
  { key: 'wallet', href: '/(partner)/wallet', icon: Wallet, label: 'Wallet' },
  { key: 'notifications', href: '/(partner)/notifications', icon: Bell, label: 'Alerts' },
  { key: 'profile', href: '/(partner)/profile', icon: User, label: 'Profile' },
];

// Section roots only. Job detail, active delivery and settings are
// task-focused screens and hide the nav.
const SEGMENT_MAP: Record<string, NavKey> = {
  jobs: 'jobs',
  wallet: 'wallet',
  notifications: 'notifications',
  profile: 'profile',
};

// `height` excludes the bottom safe-area inset; `offset` is the gap under
// a floating bar.
const GEOMETRY: Record<NavStyle, { height: number; offset: number }> = {
  docked: { height: 62, offset: 0 },
  compact: { height: 52, offset: 0 },
  floating: { height: 68, offset: 12 },
};

/** Bottom padding a screen needs so its content clears the nav, whichever
 * style the partner picked. Includes the safe-area inset. */
export function useNavClearance() {
  const insets = useSafeAreaInsets();
  const navStyle = useNavStyleStore((s) => s.navStyle);
  const g = GEOMETRY[navStyle];
  return insets.bottom + g.offset + g.height + 16;
}

interface NavItemProps {
  item: (typeof ITEMS)[number];
  active: boolean;
  badge: number;
  navStyle: NavStyle;
  onPress: () => void;
}

function NavItem({ item, active, badge, navStyle, onPress }: NavItemProps) {
  const { t } = useTheme();
  const Icon = item.icon;
  const color = active ? t.primary : t.inkSecondary;
  const showLabel = navStyle !== 'compact';
  const iconSize = navStyle === 'compact' ? 24 : 22;

  const icon = (
    <View>
      <Icon size={iconSize} color={color} strokeWidth={active ? 2.4 : 1.8} />
      {badge > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -5,
            right: -9,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 4,
            borderRadius: 8,
            backgroundColor: t.alert,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="micro" color={t.onAlert} style={{ fontSize: 10, lineHeight: 12 }}>
            {badge > 9 ? '9+' : String(badge)}
          </Txt>
        </View>
      )}
    </View>
  );

  const label = showLabel ? (
    <Txt variant="micro" color={color}>
      {item.label}
    </Txt>
  ) : null;

  let inner;
  if (navStyle === 'docked') {
    inner = (
      <View style={{ height: GEOMETRY.docked.height, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        {active && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              width: 28,
              height: 3,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              backgroundColor: t.primary,
            }}
          />
        )}
        {icon}
        {label}
      </View>
    );
  } else if (navStyle === 'compact') {
    inner = (
      <View style={{ height: GEOMETRY.compact.height, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 52,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active ? t.primaryTint : 'transparent',
          }}
        >
          {icon}
        </View>
      </View>
    );
  } else {
    inner = (
      <View
        style={{
          paddingVertical: 8,
          paddingHorizontal: 6,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          backgroundColor: active ? t.primaryTint : 'transparent',
        }}
      >
        {icon}
        {label}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
    >
      {inner}
    </AnimatedPressable>
  );
}

/** The partner app's bottom navigation. Three styles, chosen by the partner
 * in Settings > Appearance: docked (full-width, labels), compact (docked,
 * icons only) and floating (detached pill over content). */
export function AppNav() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { t } = useTheme();
  const navStyle = useNavStyleStore((s) => s.navStyle);
  const navAlign = useNavStyleStore((s) => s.navAlign);
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = selectUnreadCount(notifications);

  const segs = segments as string[];
  if (segs[0] !== '(partner)') return null;

  let activeSection: NavKey | undefined;
  if (segs.length === 1) {
    activeSection = 'home';
  } else if (segs.length === 2) {
    activeSection = SEGMENT_MAP[segs[1]];
  }
  if (!activeSection) return null;

  const g = GEOMETRY[navStyle];
  const floating = navStyle === 'floating';

  const items = ITEMS.map((item) => (
    <View key={item.key} style={floating ? { minWidth: 60 } : { flex: 1 }}>
      <NavItem
        item={item}
        active={item.key === activeSection}
        badge={item.key === 'notifications' ? unreadCount : 0}
        navStyle={navStyle}
        onPress={() => {
          if (item.key !== activeSection) haptics.select();
          router.push(item.href as never);
        }}
      />
    </View>
  ));

  if (floating) {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: insets.bottom + g.offset,
          paddingHorizontal: navAlign === 'center' ? 0 : 16,
          alignItems: navAlign === 'start' ? 'flex-start' : navAlign === 'end' ? 'flex-end' : 'center',
        }}
      >
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              padding: 6,
              borderRadius: 24,
              backgroundColor: t.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: t.lineStrong,
            },
            lift,
          ]}
        >
          {items}
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        paddingBottom: insets.bottom,
        backgroundColor: t.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: t.line,
      }}
    >
      {items}
    </View>
  );
}
