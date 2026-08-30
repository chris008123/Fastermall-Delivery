import '../global.css';

import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  useFonts,
} from '@expo-google-fonts/fredoka';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';

export { ErrorBoundary } from 'expo-router';

try {
  SplashScreen.preventAutoHideAsync();
} catch {
  // no-op — splash screen may already be hidden on some platforms
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });
  const { isDark } = useResolvedTheme();
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (fontError) {
      setBootError(String(fontError));
      setReady(true);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
        .catch(() => {})
        .finally(() => setReady(true));
    }
  }, [fontsLoaded]);

  if (!ready) return null;

  if (bootError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#d64545' }}>Boot error: {bootError}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: isDark ? '#121211' : '#fafafa' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(partner)" />
          </Stack>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
