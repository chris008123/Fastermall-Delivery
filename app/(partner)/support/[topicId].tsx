import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  Ban,
  BellOff,
  Car,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileClock,
  HandCoins,
  MapPinOff,
  MapPinX,
  MessageCircleQuestion,
  Phone,
  PhoneOff,
  Receipt,
  ShieldAlert,
  Star,
  UserX,
  Wallet2,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { IconCircle } from '@/src/shared/components/IconCircle';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { supportTopics } from '@/src/data/mockSupport';
import { colors } from '@/src/theme';
import type { SupportFaqIconName, SupportTopicId } from '@/src/types/support';

const FAQ_ICON: Record<SupportFaqIconName, typeof Wallet2> = {
  Wallet2,
  Receipt,
  HandCoins,
  PhoneOff,
  ShieldAlert,
  MapPinOff,
  Ban,
  FileClock,
  Car,
  MapPinX,
  BellOff,
  UserX,
  Star,
};

export default function SupportTopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: SupportTopicId }>();
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const topic = supportTopics.find((t) => t.id === topicId);

  if (!topic) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top + 16, paddingHorizontal: 20, gap: 16 }}>
        <BackButton />
        <Text className="text-body" style={{ color: theme.textSecondary }}>We couldn't find that help topic.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>{topic.label}</Text>
      </View>

      <View style={{ gap: 10 }}>
        {topic.faqs.map((faq) => {
          const expanded = expandedId === faq.id;
          const Icon = FAQ_ICON[faq.icon];
          return (
            <GlassView key={faq.id} radius="card" style={{ padding: 16, gap: expanded ? 12 : 0 }}>
              <AnimatedPressable
                onPress={() => setExpandedId(expanded ? null : faq.id)}
                scaleTo={0.99}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <IconCircle tint={colors.brand.teal}>
                  <Icon size={18} color={colors.brand.teal} />
                </IconCircle>
                <View style={{ flex: 1 }}>
                  <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{faq.question}</Text>
                  <Text className="text-caption" style={{ color: theme.textSecondary }}>{faq.subtitle}</Text>
                </View>
                {expanded ? (
                  <ChevronUp size={18} color={theme.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={theme.textSecondary} />
                )}
              </AnimatedPressable>
              {expanded && (
                <Text className="text-body" style={{ color: theme.textSecondary, paddingLeft: 52 }}>{faq.answer}</Text>
              )}
            </GlassView>
          );
        })}
      </View>

      <View style={{ gap: 10, marginTop: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
          STILL NEED HELP?
        </Text>

        <AnimatedPressable onPress={() => router.push('/support/chat')} scaleTo={0.98}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.brand.teal,
              backgroundColor: colors.brand.tealTint,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageCircleQuestion size={18} color={colors.brand.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-body-lg font-bold" style={{ color: colors.brand.teal }}>Chat with Support</Text>
              <Text className="text-caption" style={{ color: theme.textSecondary }}>Get help from our support team.</Text>
            </View>
            <ChevronRight size={18} color={colors.brand.teal} />
          </View>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => Linking.openURL('tel:0800000000').catch(() => {})} scaleTo={0.98}>
          <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Phone size={18} color={colors.brand.teal} />
            <View style={{ flex: 1 }}>
              <Text className="text-body-lg font-bold" style={{ color: colors.brand.teal }}>Call Fastermall</Text>
              <Text className="text-caption" style={{ color: theme.textSecondary }}>Talk to us directly.</Text>
            </View>
          </GlassView>
        </AnimatedPressable>
      </View>
    </ScrollView>
  );
}
