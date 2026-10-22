import '../global.css';

import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
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

import { darkPalette, lightPalette } from '@/src/ds/tokens';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { ToastProvider } from '@/src/shared/toast/ToastProvider';
import { useAuthStore } from '@/src/stores/authStore';

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
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });

  const { isDark } = useResolvedTheme();

  const hydrate = useAuthStore(
    (state) => state.hydrate,
  );

  const isHydrating = useAuthStore(
    (state) => state.isHydrating,
  );

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  );

  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (fontError) {
      setBootError(String(fontError));
      setReady(true);
    }
  }, [fontError]);

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    const initializeApp = async () => {
      try {
        await hydrate();
      } catch (error) {
        setBootError(
          error instanceof Error
            ? error.message
            : 'Unable to initialize authentication.',
        );
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
        setReady(true);
      }
    };

    void initializeApp();
  }, [fontsLoaded, hydrate]);

  if (!ready || isHydrating) {
    return null;
  }

  if (bootError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={{ color: '#d64545' }}>
          Boot error: {bootError}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        className={`flex-1 ${isDark ? 'dark' : ''}`}
      >
        <SafeAreaProvider>
          <StatusBar
            style={isDark ? 'light' : 'dark'}
          />

          <ToastProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: isDark
                    ? darkPalette.bg
                    : lightPalette.bg,
                },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(partner)" />
            </Stack>
          </ToastProvider>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
