import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useJobsStore } from '@/src/stores/jobsStore';
import { colors } from '@/src/theme';
import { isOffline } from '@/src/utils/connectivity';

/**
 * Tells the partner when the phone has no connection, and refreshes the jobs
 * the moment it comes back. Purely informational: it never blocks a tap.
 */
export function ConnectivityWatcher() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const offline = isOffline(useNetInfo());
  const wasOffline = useRef(false);

  useEffect(() => {
    if (wasOffline.current && !offline) {
      useJobsStore.getState().loadJobs().catch(() => {});
    }
    wasOffline.current = offline;
  }, [offline]);

  if (!offline) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', top: insets.top, left: 0, right: 0, alignItems: 'center', zIndex: 50 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.borderStrong,
          backgroundColor: theme.surfaceRaised,
        }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.semantic.warning }} />
        <Text className="text-caption font-medium" style={{ color: theme.text }}>
          Offline · showing the last data loaded
        </Text>
      </View>
    </View>
  );
}
