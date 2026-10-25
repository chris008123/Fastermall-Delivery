import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { AppNav } from '@/src/shared/components/AppNav';
import { ConnectivityWatcher } from '@/src/shared/components/ConnectivityWatcher';
import { useAuthStore } from '@/src/stores/authStore';

// Ported from the customer app's (main)/_layout.tsx pattern: a header-less
// Stack with the floating glass nav mounted as a sibling, not inside any
// one screen. AppNav is absolutely positioned so it needs this
// full-screen flex:1 parent to anchor to, and it needs to live above the
// Stack so it persists across screen transitions instead of remounting per
// screen. Its own segment-matching logic decides which screens show it —
// section roots only (home, jobs, wallet, notifications, profile); job
// detail, active delivery, and settings hide it since those are
// task-focused screens.
//
// Replaces the previous native Tabs navigator so the partner app's chrome
// matches the customer app's floating-nav visual language instead of a
// platform-default tab bar. AppNav keeps the original frosted floating pill
// as its default and adds two docked styles the partner can switch to in
// Settings > Appearance.
// Every partner screen sits behind this check, so a deep link, a restored
// navigation state or a back-swipe after signing out can never show them to
// a signed-out device.
export default function PartnerLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <AppNav />
      <ConnectivityWatcher />
    </View>
  );
}
