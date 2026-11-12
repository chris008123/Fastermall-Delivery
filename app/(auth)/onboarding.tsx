import { router } from 'expo-router';
import { Bike, Footprints, Mail, MapPin, Phone, User } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { Button } from '@/src/shared/components/Button';
import { PartnerAuthHeroHeader } from '@/src/shared/components/PartnerAuthHeroHeader';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { haptics } from '@/src/shared/utils/haptics';
import { formatGhanaPhone } from '@/src/shared/utils/phone';
import {
  checkContact,
  checkPersonal,
  checkVehicle,
  submitApplication,
  type ApplicationForm,
} from '@/src/services/partnerApplication';
import { colors } from '@/src/theme';
import type { PartnerMode } from '@/src/types/job';

// "Become a partner": the application an admin reviews in the console.
// Approval creates the account; the admin then sends the sign-in details.
// Documents (Ghana Card, selfie, licence…) are uploaded after signing in,
// from Documents, so nothing personal is held on the phone before then.

type StepKey = 'contact' | 'personal' | 'vehicle' | 'review';

const STEPS: { key: StepKey; title: string; subtitle: string }[] = [
  { key: 'contact', title: 'Become a delivery partner', subtitle: 'How can we reach you about your application?' },
  { key: 'personal', title: 'About you', subtitle: 'This should match your Ghana Card. We check it when you upload it.' },
  { key: 'vehicle', title: 'How will you deliver?', subtitle: 'Walking partners take nearby campus orders.' },
  { key: 'review', title: 'Check and send', subtitle: 'Make sure everything is right before you apply.' },
];

const INITIAL: ApplicationForm = {
  phone: '',
  email: '',
  fullName: '',
  dateOfBirth: '',
  address: '',
  vehicleMode: 'MOTORCYCLE',
  plateNumber: '',
};

function formatDob(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export default function OnboardingScreen() {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [form, setForm] = useState<ApplicationForm>(INITIAL);
  const [stepIndex, setStepIndex] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const step = STEPS[stepIndex];

  const update = (patch: Partial<ApplicationForm>) => setForm((f) => ({ ...f, ...patch }));

  const errors = useMemo<Record<string, string | undefined>>(() => {
    if (step.key === 'contact') return checkContact(form);
    if (step.key === 'personal') return checkPersonal(form);
    if (step.key === 'vehicle') return checkVehicle(form);
    return {};
  }, [form, step.key]);
  const stepOk = Object.values(errors).every((e) => !e);
  const shown = (key: string) => (showErrors ? errors[key] : undefined);

  const goNext = () => {
    if (!stepOk) {
      setShowErrors(true);
      haptics.select();
      return;
    }
    setShowErrors(false);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setSubmitError(null);
    setStepIndex((i) => i - 1);
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitApplication(form);
      haptics.success();
      router.replace('/(auth)/onboarding-submitted');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not send your application. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const motorcycle = form.vehicleMode === 'MOTORCYCLE';

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
        <StepDots count={STEPS.length} activeIndex={stepIndex} />

        {step.key === 'contact' && (
          <View style={{ gap: 18 }}>
            <Field label="Phone number" error={shown('phone')} theme={theme} icon={<Phone size={18} color={theme.textSecondary} />}>
              <TextInput
                accessibilityLabel="Phone number"
                value={form.phone}
                onChangeText={(v) => update({ phone: formatGhanaPhone(v) })}
                placeholder="024 412 3456"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                autoComplete="tel"
                style={{ flex: 1, fontSize: 16, color: theme.text }}
              />
            </Field>
            <Field label="Email" error={shown('email')} theme={theme} icon={<Mail size={18} color={theme.textSecondary} />}>
              <TextInput
                accessibilityLabel="Email"
                value={form.email}
                onChangeText={(v) => update({ email: v })}
                placeholder="you@gmail.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={{ flex: 1, fontSize: 16, color: theme.text }}
              />
            </Field>
            <Text className="text-caption" style={{ color: theme.textSecondary }}>
              If you’re approved, this email is how you sign in.
            </Text>
          </View>
        )}

        {step.key === 'personal' && (
          <View style={{ gap: 18 }}>
            <Field label="Full name" error={shown('fullName')} theme={theme} icon={<User size={18} color={theme.textSecondary} />}>
              <TextInput
                accessibilityLabel="Full name"
                value={form.fullName}
                onChangeText={(v) => update({ fullName: v })}
                placeholder="As it appears on your Ghana Card"
                placeholderTextColor={theme.textSecondary}
                autoComplete="name"
                style={{ flex: 1, fontSize: 16, color: theme.text }}
              />
            </Field>
            <Field label="Date of birth" error={shown('dateOfBirth')} theme={theme} icon={<User size={18} color={theme.textSecondary} />}>
              <TextInput
                accessibilityLabel="Date of birth, day month year"
                value={form.dateOfBirth}
                onChangeText={(v) => update({ dateOfBirth: formatDob(v) })}
                maxLength={10}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                style={{ flex: 1, fontSize: 16, color: theme.text }}
              />
            </Field>
            <Field label="Home address" error={shown('address')} theme={theme} icon={<MapPin size={18} color={theme.textSecondary} />}>
              <TextInput
                accessibilityLabel="Home address"
                value={form.address}
                onChangeText={(v) => update({ address: v })}
                placeholder="e.g. Ayeduase, Kumasi"
                placeholderTextColor={theme.textSecondary}
                style={{ flex: 1, fontSize: 16, color: theme.text }}
              />
            </Field>
          </View>
        )}

        {step.key === 'vehicle' && (
          <View style={{ gap: 18 }}>
            <View style={{ flexDirection: 'row', gap: 10 }} accessibilityRole="radiogroup">
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
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={label}
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
                      <Text className="text-caption font-semibold" style={{ color: active ? colors.partner.orange : theme.textSecondary }}>
                        {label}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
            {motorcycle && (
              <Field label="Registration number" error={shown('plateNumber')} theme={theme} icon={<Bike size={18} color={theme.textSecondary} />}>
                <TextInput
                  accessibilityLabel="Registration number"
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

        {step.key === 'review' && (
          <View style={{ gap: 14 }}>
            <View>
              <ReviewRow label="Name" value={form.fullName.trim()} theme={theme} />
              <ReviewRow label="Phone" value={form.phone} theme={theme} />
              <ReviewRow label="Email" value={form.email.trim().toLowerCase()} theme={theme} />
              <ReviewRow label="Date of birth" value={form.dateOfBirth} theme={theme} />
              <ReviewRow label="Address" value={form.address.trim()} theme={theme} />
              <ReviewRow
                label="Delivering by"
                value={motorcycle ? `Motorcycle, ${form.plateNumber.trim().toUpperCase()}` : 'Walking'}
                theme={theme}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>What happens next</Text>
              {[
                'We review your application, usually within 1–2 days.',
                'If you’re approved, we call or WhatsApp you with your sign-in details.',
                motorcycle
                  ? 'Sign in and upload your Ghana Card, a selfie, your licence, vehicle registration and insurance.'
                  : 'Sign in and upload your Ghana Card and a selfie.',
              ].map((line, i) => (
                <Text key={line} className="text-body" style={{ color: theme.textSecondary }}>
                  {i + 1}. {line}
                </Text>
              ))}
            </View>
            {submitError ? (
              <Text accessibilityRole="alert" className="text-body" style={{ color: colors.semantic.error }}>
                {submitError}
              </Text>
            ) : null}
          </View>
        )}

        <Button
          title={step.key === 'review' ? 'Send application' : 'Continue'}
          variant="partner"
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={step.key === 'review' ? () => void submit() : goNext}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View
      style={{ flexDirection: 'row', gap: 6, alignSelf: 'center' }}
      accessible
      accessibilityLabel={`Step ${activeIndex + 1} of ${count}`}
    >
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
  error,
  theme,
  children,
}: {
  label: string;
  icon: ReactNode;
  error?: string;
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
          borderColor: error ? colors.semantic.error : theme.border,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: theme.surface,
        }}
      >
        {icon}
        {children}
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="text-caption" style={{ color: colors.semantic.error }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function ReviewRow({ label, value, theme }: { label: string; value: string; theme: { text: string; textSecondary: string } }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(122, 122, 114, 0.15)',
      }}
    >
      <Text className="text-body" style={{ color: theme.textSecondary }}>{label}</Text>
      <Text className="text-body font-medium" style={{ color: theme.text, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
