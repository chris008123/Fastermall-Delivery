import { Stack } from 'expo-router';
import { View } from 'react-native';
import { FloatingNav } from '@/src/shared/components/FloatingNav';

// Ported from the customer app's (main)/_layout.tsx pattern: a header-less
// Stack with the floating glass nav mounted as a sibling, not inside any
// one screen. FloatingNav is absolutely positioned so it needs this
// full-screen flex:1 parent to anchor to, and it needs to live above the
// Stack so it persists across screen transitions instead of remounting per
// screen. Its own segment-matching logic decides which screens show it —
// section roots only (home, jobs, wallet, notifications, profile); job
// detail, active delivery, and settings hide it since those are
// task-focused screens.
//
// Replaces the previous native Tabs navigator so the partner app's chrome
// matches the customer app's floating-nav visual language instead of a
// platform-default tab bar.
export default function PartnerLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <FloatingNav />
    </View>
  );
}
