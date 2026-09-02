import { router } from 'expo-router';
import { AlertTriangle, Bike, Check, ChevronRight, CreditCard, FileCheck2, Footprints, LifeBuoy, LogOut, Pencil, Settings, ShieldCheck, User } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Badge } from '@/src/shared/components/Badge';
import { EditPlateSheet } from '@/src/shared/components/EditPlateSheet';
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
  const [editPlateVisible, setEditPlateVisible] = useState(false);
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
          <View
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.semantic.success,
              borderWidth: 2,
              borderColor: theme.background,
            }}
          />
        </View>
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>{partner.name}</Text>
        {count > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <StarRating rating={average} size={16} />
            <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>
              {`${average.toFixed(1)} \u00b7 ${count} deliver${count === 1 ? 'y' : 'ies'}`}
            </Text>
          </View>
        )}
        <Text className="text-caption font-medium" style={{ color: partner.isAvailable ? colors.semantic.success : theme.textSecondary }}>
          {partner.isAvailable ? 'Online \u2014 receiving jobs' : 'Offline'}
        </Text>
      </View>

      <GlassView radius="card" style={{ padding: 18, gap: 12 }}>
        <View style={{ gap: 2 }}>
          <Text className="text-card-title font-medium" style={{ color: theme.text }}>
            Travel mode
          </Text>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            Choose how you want to move
          </Text>
        </View>
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
                  {active && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colors.partner.orange,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={13} color={colors.onBrand} strokeWidth={3} />
                    </View>
                  )}
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <CreditCard size={18} color={theme.textSecondary} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text className="text-caption" style={{ color: theme.textSecondary }}>
                Plate number
              </Text>
              <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>
                {partner.vehiclePlate}
              </Text>
            </View>
            <AnimatedPressable onPress={() => setEditPlateVisible(true)} scaleTo={0.95}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: colors.partner.orangeTint,
                }}
              >
                <Pencil size={13} color={colors.partner.orange} />
                <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>
                  Edit
                </Text>
              </View>
            </AnimatedPressable>
          </View>
        )}
      </GlassView>

      <EditPlateSheet
        visible={editPlateVisible}
        onClose={() => setEditPlateVisible(false)}
        initialValue={partner.vehiclePlate ?? ''}
        onSave={(plate) => partner.setVehiclePlate(plate)}
      />

      <AnimatedPressable onPress={() => router.push('/documents')} scaleTo={0.98}>
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(26, 156, 92, 0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {verification.isBlocked || verification.attentionCount > 0 ? (
              <AlertTriangle size={18} color={colors.semantic.warning} />
            ) : (
              <FileCheck2 size={18} color={colors.accent.green} />
            )}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="text-body-lg font-medium" style={{ color: theme.text }}>Documents</Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>Manage your documents</Text>
          </View>
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
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(139, 92, 246, 0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={18} color={colors.accent.purple} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="text-body-lg font-medium" style={{ color: theme.text }}>Settings</Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>App preferences and account</Text>
          </View>
          <ChevronRight size={18} color={theme.textSecondary} />
        </GlassView>
      </AnimatedPressable>

      <AnimatedPressable onPress={() => router.push('/support')} scaleTo={0.98}>
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(59, 130, 196, 0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LifeBuoy size={18} color={colors.accent.blue} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="text-body-lg font-medium" style={{ color: theme.text }}>Support</Text>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>Get help and contact us</Text>
          </View>
          <ChevronRight size={18} color={theme.textSecondary} />
        </GlassView>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={() => {
          useAuthStore.getState().signOut();
          router.replace('/(auth)/login');
        }}
        scaleTo={0.98}
      >
        <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={18} color={colors.semantic.error} />
          <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.error }}>Sign out</Text>
        </GlassView>
      </AnimatedPressable>
    </ScrollView>
  );
}
