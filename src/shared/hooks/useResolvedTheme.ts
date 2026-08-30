import { useColorScheme } from 'react-native';
import { useSettingsStore, type ThemeMode } from '@/src/stores/settingsStore';

export function useResolvedTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const systemScheme = useColorScheme();

  const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';

  return { isDark, theme };
}

export function setAppTheme(theme: ThemeMode) {
  useSettingsStore.getState().setTheme(theme);
}
