import { Tabs } from 'expo-router';
import { Home, Package, User, Wallet } from 'lucide-react-native';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

export default function PartnerTabsLayout() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // The partner's own accent, not any single job-type color — the
        // tab bar is chrome that belongs to the partner, not to a job.
        tabBarActiveTintColor: colors.partner.orange,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: { fontFamily: 'Fredoka_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="jobs/index"
        options={{ title: 'Jobs', tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="jobs/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="active/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="wallet/index"
        options={{ title: 'Wallet', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
