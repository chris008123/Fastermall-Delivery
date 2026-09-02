import { router } from 'expo-router';
import { AlertTriangle, Bike, ChevronRight, FileCheck2, Footprints, LifeBuoy, Settings, ShieldCheck, User } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Badge } from '@/src/shared/components/Badge';
import { Button } from '@/src/shared/components/Button';
import { GlassView } from '@/src/shared/components/GlassView';
import { StarRating } from '@/src/shared/components/StarRating';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { selectVerificationSummary, useDocumentsStore } from '@/src/stores/documentsStore';
import { selectPartnerRating, useJobsStore } from '@/src/stores/jobsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import { colors } from '@/src/theme';
import type { PartnerMode } from '@/src/types/job';

const MODES: { value: PartnerMode; label: string; icon: typeof Bike }[] = [
  { value: 'WALKING', label: 'Walking', icon: Footprints },
  { value: 'MOTORCYCLE', label: 'Motorcycle', icon: Bike },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const partner = usePartnerStore();
  const jobs = useJobsStore((s) => s.jobs);
  // selectPartnerRating returns a fresh object every call — computing it
  // *inside* the zustand selector (as this used to) hands
  // useSyncExternalStore a non-stable snapshot and trips React's
  // infinite-loop guard. Pulling the raw array out of the store first and
  // memoizing the derived value keeps the store selector itself stable.
  const { average, count } = useMemo(() => selectPartnerRating(jobs), [jobs]);
  const documents = useDocumentsStore((s) => s.documents);
  const verification = selectVerificationSummary(documents);

  return (
    // Switched from a fixed View to a ScrollView, matching the main app's
    // profile screen: this list only grows over time (more settings rows
    // are a near-certainty), and a fixed View risks the Sign out button
    // sitting under the floating nav on shorter screens. paddingBottom: 100
    // clears the nav, same convention as the other tabs.
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 100, gap: 16 }}
    >
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 12 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.partner.orangeTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <User size={32} color={colors.partner.orange} />
        </View>
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>{partner.name}</Text>
        {count > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <StarRating rating={average} size={16} />
            <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>
              {average.toFixed(1)} \u00b7 {count} deliver{count === 1 ? 'y' : 'ies'}
            </Text>
          </View>
        )}
        <Text className="text-caption font-medium" style={{ color: partner.isAvailable ? colors.semantic.success : theme.textSecondary }}>
          {partner.isAvailable ? 'Online \u2014 receiving jobs' : 'Offline'}
        </Text>
      </View>

      <GlassView radius="card" style={{ padding: 18, gap: 12 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
          TRAVEL MODE
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {MODES.map(({ value, label, icon: Icon }) => {
            const active = partner.mode === value;
            return (
              <AnimatedPressable key={value} onPress={() => partner.setMode(value)} scaleTo={0.97} style={{ flex: 1 }}>
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 14,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: active ? colors.partner.orange : theme.border,
                    backgroundColor: active ? colors.partner.orangeTint : 'transparent',
                  }}
                >
                  <Icon size={20} color={active ? colors.partner.orange : theme.textSecondary} />
                  <Text
                    className="text-caption font-semibold"
                    style={{ color: active ? colors.partner.orange : theme.textSecondary }}
                  >
                    {label}
                  </Text>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
        {partner.vehiclePlate && (
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            Plate: {partner.vehiclePlate}
          </Text>
        )}
      </GlassView>

      <AnimatedPressable onPress={() => router.push('/documents')} scaleTo={0.98}>
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {verification.isBlocked || verification.attentionCount > 0 ? (
            <AlertTriangle size={18} color={colors.semantic.warning} />
          ) : (
            <FileCheck2 size={18} color={theme.textSecondary} />
          )}
          <Text className="text-body-lg font-medium" style={{ color: theme.text, flex: 1 }}>Documents</Text>
          {verification.isBlocked ? (
            <Badge label="Action needed" color={colors.semantic.error} tint="rgba(214, 69, 69, 0.12)" />
          ) : verification.attentionCount > 0 ? (
            <Badge label="Expiring soon" color={colors.semantic.warning} tint="rgba(224, 163, 0, 0.14)" />
          ) : (
            <ShieldCheck size={16} color={colors.semantic.success} />
          )}
          <ChevronRight size={18} color={theme.textSecondary} />
        </GlassView>
      </AnimatedPressable>

      <AnimatedPressable onPress={() => router.push('/settings')} scaleTo={0.98}>
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Settings size={18} color={theme.textSecondary} />
          <Text className="text-body-lg font-medium" style={{ color: theme.text, flex: 1 }}>Settings</Text>
          <ChevronRight size={18} color={theme.textSecondary} />
        </GlassView>
      </AnimatedPressable>

      <AnimatedPressable onPress={() => router.push('/support')} scaleTo={0.98}>
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <LifeBuoy size={18} color={theme.textSecondary} />
          <Text className="text-body-lg font-medium" style={{ color: theme.text, flex: 1 }}>Support</Text>
          <ChevronRight size={18} color={theme.textSecondary} />
        </GlassView>
      </AnimatedPressable>

      <Button
        title="Sign out"
        variant="ghost"
        onPress={() => {
          useAuthStore.getState().signOut();
          router.replace('/(auth)/login');
        }}
      />
    </ScrollView>
  );
}
