import { Info } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

/** Tells the partner, plainly, that the settings on this screen are saved on
 * the phone but don't change anything yet. */
export function InactiveSettingNotice({ children }: { children: ReactNode }) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <GlassView radius="card" style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Info size={18} color={colors.semantic.warning} style={{ marginTop: 1 }} />
        <Text className="text-caption" style={{ color: theme.textSecondary, flex: 1 }}>
          {children}
        </Text>
      </View>
    </GlassView>
  );
}
