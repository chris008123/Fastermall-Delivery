import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AppNav } from '@/src/ui/AppNav';

// A header-less Stack with the bottom nav mounted as a sibling, so it
// persists across screen transitions instead of remounting per screen.
// AppNav decides for itself which screens show it (section roots only) and
// which style it renders in (docked, compact or floating — the partner's
// choice in Settings > Appearance).
export default function PartnerLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <AppNav />
    </View>
  );
}
