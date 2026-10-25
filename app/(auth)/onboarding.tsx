import { router } from 'expo-router';
import {
  Bike,
  Camera,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  Footprints,
  MapPin,
  Phone,
  User,
} from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { PartnerAuthHeroHeader } from '@/src/shared/components/PartnerAuthHeroHeader';
import { PhotoSourceSheet } from '@/src/shared/components/PhotoSourceSheet';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { haptics } from '@/src/shared/utils/haptics';
import { formatGhanaPhone, stripPhoneFormatting } from '@/src/shared/utils/phone';
import { colors } from '@/src/theme';
import type { PartnerMode } from '@/src/types/job';

type StepKey = 'phone' | 'personal' | 'identity' | 'vehicle' | 'driver-docs' | 'selfie' | 'review';

const ALL_STEPS: { key: StepKey; title: string; subtitle: string }[] = [
  { key: 'phone', title: 'Create your Partner account', subtitle: "We'll text you a code to confirm this number." },
  { key: 'personal', title: 'Personal information', subtitle: "This should match your ID — we'll check it during review." },
  { key: 'identity', title: 'Verify your identity', subtitle: 'Upload a clear photo of your Ghana Card.' },
  { key: 'vehicle', title: 'Your vehicle', subtitle: 'How will you be making deliveries?' },
  { key: 'driver-docs', title: 'Driver documents', subtitle: "Upload your licence and vehicle registration." },
  { key: 'selfie', title: "Verify it's really you", subtitle: 'Take a selfie so we can match it to your Ghana Card.' },
  { key: 'review', title: "You're almost ready!", subtitle: 'Review your details before submitting for verification.' },
];

interface FormData {
  phone: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  vehicleMode: PartnerMode;
  plateNumber: string;
  /** Local photo URIs, null until the partner adds one. */
  photos: Record<PhotoKey, string | null>;
}

type PhotoKey = 'ghanaCard' | 'licence' | 'vehicleReg' | 'selfie';

const PHOTO_COPY: Record<PhotoKey, { title: string; guidance: string; front?: boolean }> = {
  ghanaCard: {
    title: 'Ghana Card',
    guidance: 'Place the card flat in good light, with all four corners and every word readable.',
  },
  licence: {
    title: "Driver's Licence",
    guidance: 'Place the licence flat in good light, with all four corners and every word readable.',
  },
  vehicleReg: {
    title: 'Vehicle Registration',
    guidance: 'Place the document flat in good light. The plate number must be readable.',
  },
  selfie: {
    title: 'Selfie',
    guidance: 'Look straight at the camera in good light, with no sunglasses or hat.',
    front: true,
  },
};

/** "12091995" -> "12/09/1995" while typing. */
function formatDob(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

const INITIAL: FormData = {
  phone: '',
  fullName: '',
  dateOfBirth: '',
  address: '',
  vehicleMode: 'MOTORCYCLE',
  plateNumber: '',
  photos: { ghanaCard: null, licence: null, vehicleReg: null, selfie: null },
};

export default function OnboardingScreen() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [form, setForm] = useState<FormData>(INITIAL);
  const [stepIndex, setStepIndex] = useState(0);
  const [capturing, setCapturing] = useState<PhotoKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Walking partners don't own a vehicle, so the driver-documents step
  // (licence + vehicle registration) doesn't apply to them — skipped
  // entirely rather than shown with nothing to do.
  const steps = useMemo(
    () => ALL_STEPS.filter((s) => !(s.key === 'driver-docs' && form.vehicleMode === 'WALKING')),
    [form.vehicleMode]
  );
  const step = steps[stepIndex];

  const update = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }));

  const canContinue = (() => {
    switch (step.key) {
      case 'phone':
        return stripPhoneFormatting(form.phone).length === 10;
      case 'personal':
        return form.fullName.trim().length > 1 && form.dateOfBirth.trim().length === 10 && form.address.trim().length > 3;
      case 'identity':
        return !!form.photos.ghanaCard;
      case 'vehicle':
        return form.vehicleMode === 'WALKING' || form.plateNumber.trim().length > 3;
      case 'driver-docs':
        return !!form.photos.licence && !!form.photos.vehicleReg;
      case 'selfie':
        return !!form.photos.selfie;
      default:
        return true;
    }
  })();

  const goNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setStepIndex((i) => i - 1);
  };

  const submit = () => {
    setSubmitting(true);
    // Mock-only submission — no backend yet to actually queue this for
    // review, same stand-in philosophy as auth and the delivery handover
    // code elsewhere in this app.
    setTimeout(() => {
      setSubmitting(false);
      router.replace('/(auth)/onboarding-submitted');
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PartnerAuthHeroHeader title={step.title} subtitle={step.subtitle} onBack={goBack} height={172} />

      <ScrollView
        className="-mt-6 flex-1 rounded-t-[24px] bg-white dark:bg-neutral-900"
        contentContainerStyle={{ padding: 24, paddingBottom: 32, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <StepDots count={steps.length} activeIndex={stepIndex} />

        {step.key === 'phone' && (
          <View style={{ gap: 18 }}>
            <Field label="Phone number" theme={theme} icon={<Phone size={18} color={theme.textSecondary} />}>
              <TextInput accessibilityLabel="Phone number"
                value={form.phone}
                onChangeText={(v) => update({ phone: formatGhanaPhone(v) })}
                placeholder="024 412 3456"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                style={{ flex: 1, fontSize: 16, color: theme.text }}
              />
            </Field>
          </View>
        )}

        {step.key === 'personal' && (
          <View style={{ gap: 18 }}>
            <Field label="Full name" theme={theme} icon={<User size={18} color={theme.textSecondary} />}>
              <TextInput accessibilityLabel="Full name"
                value={form.fullName}
                onChangeText={(v) => update({ fullName: v })}
                placeholder="As it appears on your Ghana Card"
                placeholderTextColor={theme.textSecondary}
                style={{ flex: 1, fontSize: 16, color: theme.text }}
              />
            </Field>
            <Field label="Date of birth" theme={theme} icon={<User size={18} color={theme.textSecondary} />}>
              <TextInput accessibilityLabel="Date of birth"
                value={form.dateOfBirth}
                onChangeText={(v) => update({ dateOfBirth: formatDob(v) })}
                maxLength={10}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numbers-and-punctuation"
                style={{ flex: 1, fontSize: 16, color: theme.text }}
              />
            </Field>
            <Field label="Home address" theme={theme} icon={<MapPin size={18} color={theme.textSecondary} />}>
              <TextInput accessibilityLabel="Home address"
                value={form.address}
                onChangeText={(v) => update({ address: v })}
                placeholder="e.g. Ayeduase, Kumasi"
                placeholderTextColor={theme.textSecondary}
                style={{ flex: 1, fontSize: 16, color: theme.text }}
              />
            </Field>
          </View>
        )}

        {step.key === 'identity' && (
          <UploadTile
            icon={CreditCard}
            label="Ghana Card"
            helper="Make sure all four corners are visible and the text is readable."
            captured={!!form.photos.ghanaCard}
            uri={form.photos.ghanaCard}
            onPress={() => setCapturing('ghanaCard')}
            theme={theme}
          />
        )}

        {step.key === 'vehicle' && (
          <View style={{ gap: 18 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(
                [
                  { value: 'WALKING' as PartnerMode, label: 'Walking', icon: Footprints },
                  { value: 'MOTORCYCLE' as PartnerMode, label: 'Motorcycle', icon: Bike },
                ] as const
              ).map(({ value, label, icon: Icon }) => {
                const active = form.vehicleMode === value;
                return (
                  <AnimatedPressable
                    key={value}
                    onPress={() => update({ vehicleMode: value })}
                    scaleTo={0.97}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={{
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 16,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: active ? colors.partner.orange : theme.border,
                        backgroundColor: active ? colors.partner.orangeTint : 'transparent',
                      }}
                    >
                      <Icon size={22} color={active ? colors.partner.orange : theme.textSecondary} />
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
            {form.vehicleMode === 'MOTORCYCLE' && (
              <Field label="Registration number" theme={theme} icon={<Bike size={18} color={theme.textSecondary} />}>
                <TextInput accessibilityLabel="Registration number"
                  value={form.plateNumber}
                  onChangeText={(v) => update({ plateNumber: v.toUpperCase() })}
                  placeholder="AS 1234-24"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="characters"
                  style={{ flex: 1, fontSize: 16, color: theme.text }}
                />
              </Field>
            )}
          </View>
        )}

        {step.key === 'driver-docs' && (
          <View style={{ gap: 14 }}>
            <UploadTile
              icon={FileText}
              label="Driver's Licence"
              helper="A valid, unexpired licence for your vehicle class."
              captured={!!form.photos.licence}
              uri={form.photos.licence}
              onPress={() => setCapturing('licence')}
              theme={theme}
            />
            <UploadTile
              icon={Bike}
              label="Vehicle Registration"
              helper="Must match the plate number you entered."
              captured={!!form.photos.vehicleReg}
              uri={form.photos.vehicleReg}
              onPress={() => setCapturing('vehicleReg')}
              theme={theme}
            />
          </View>
        )}

        {step.key === 'selfie' && (
          <UploadTile
            icon={Camera}
            label="Selfie"
            helper="Look straight at the camera in good lighting, no sunglasses or hats."
            captured={!!form.photos.selfie}
            uri={form.photos.selfie}
            onPress={() => setCapturing('selfie')}
            theme={theme}
            actionLabel="Take selfie"
          />
        )}

        {step.key === 'review' && (
          <View style={{ gap: 10 }}>
            <ReviewRow label="Personal information" theme={theme} />
            <ReviewRow label="Identity" theme={theme} />
            {form.vehicleMode === 'MOTORCYCLE' && <ReviewRow label="Driver's licence & vehicle" theme={theme} />}
            <ReviewRow label="Selfie" theme={theme} />
            <Text className="text-caption" style={{ color: theme.textSecondary, marginTop: 4 }}>
              We'll review everything and let you know within 24–48 hours. You can check your status anytime from
              Documents once you sign in.
            </Text>
          </View>
        )}

        <Button
          title={step.key === 'review' ? 'Submit for verification' : 'Continue'}
          variant="partner"
          fullWidth
          loading={submitting}
          disabled={!canContinue}
          onPress={step.key === 'review' ? submit : goNext}
        />
      </ScrollView>

      <PhotoSourceSheet
        visible={!!capturing}
        onClose={() => setCapturing(null)}
        title={capturing ? PHOTO_COPY[capturing].title : ''}
        guidance={capturing ? PHOTO_COPY[capturing].guidance : ''}
        front={capturing ? PHOTO_COPY[capturing].front : false}
        onPicked={(uri) => {
          if (capturing) setForm((f) => ({ ...f, photos: { ...f.photos, [capturing]: uri } }));
          haptics.success();
        }}
      />
    </KeyboardAvoidingView>
  );
}

function StepDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignSelf: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === activeIndex ? 20 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i <= activeIndex ? colors.partner.orange : colors.neutral[200],
          }}
        />
      ))}
    </View>
  );
}

function Field({
  label,
  icon,
  theme,
  children,
}: {
  label: string;
  icon: ReactNode;
  theme: { text: string; textSecondary: string; border: string; surface: string };
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text className="text-caption font-medium" style={{ color: theme.textSecondary }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1.5,
          borderColor: theme.border,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: theme.surface,
        }}
      >
        {icon}
        {children}
      </View>
    </View>
  );
}

function UploadTile({
  icon: Icon,
  label,
  helper,
  captured,
  uri,
  onPress,
  theme,
  actionLabel = 'Take photo',
}: {
  icon: typeof Camera;
  label: string;
  helper: string;
  captured: boolean;
  /** The photo that was added, shown as a thumbnail once captured. */
  uri?: string | null;
  onPress: () => void;
  theme: { text: string; textSecondary: string; border: string };
  actionLabel?: string;
}) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98}>
      <View
        style={{
          borderWidth: 1.5,
          borderStyle: captured ? 'solid' : 'dashed',
          borderColor: captured ? colors.semantic.success : theme.border,
          backgroundColor: captured ? 'rgba(26, 156, 92, 0.08)' : 'transparent',
          borderRadius: 18,
          padding: 20,
          alignItems: 'center',
          gap: 10,
        }}
      >
        {captured && uri ? (
          <Image
            source={{ uri }}
            accessibilityLabel={`Photo you added for ${label}`}
            style={{ width: 96, height: 72, borderRadius: 12, backgroundColor: theme.border }}
          />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: captured ? 'rgba(26, 156, 92, 0.14)' : colors.partner.orangeTint,
            }}
          >
            {captured ? (
              <Check size={22} color={colors.semantic.success} />
            ) : (
              <Icon size={22} color={colors.partner.orange} />
            )}
          </View>
        )}
        <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>
          {captured ? `${label} captured` : label}
        </Text>
        <Text className="text-caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>
          {captured ? 'Tap to retake if it came out blurry.' : helper}
        </Text>
        {!captured && (
          <Text className="text-caption font-semibold" style={{ color: colors.partner.orange }}>
            {actionLabel}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

function ReviewRow({ label, theme }: { label: string; theme: { text: string; textSecondary: string } }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(122, 122, 114, 0.15)',
      }}
    >
      <CheckCircle2 size={18} color={colors.semantic.success} />
      <Text className="text-body-lg" style={{ color: theme.text }}>{label}</Text>
    </View>
  );
}
