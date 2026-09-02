import { router } from 'expo-router';
import {
  ChevronRight,
  MessageCircleQuestion,
  Package,
  Phone,
  Search,
  Smartphone,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { supportTopics } from '@/src/data/mockSupport';
import { colors } from '@/src/theme';
import type { SupportTopicId } from '@/src/types/support';

const TOPIC_ICON: Record<SupportTopicId, typeof Wallet> = {
  PAYMENT: Wallet,
  DELIVERY: Package,
  ACCOUNT: UserCog,
  APP: Smartphone,
  CUSTOMER: Users,
};

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();

  const matchedFaqs = useMemo(() => {
    if (!trimmed) return [];
    return supportTopics.flatMap((topic) =>
      topic.faqs
        .filter((f) => f.question.toLowerCase().includes(trimmed) || f.answer.toLowerCase().includes(trimmed))
        .map((f) => ({ ...f, topicId: topic.id, topicLabel: topic.label }))
    );
  }, [trimmed]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>How can we help?</Text>
      </View>

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
        <Search size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search help"
          placeholderTextColor={theme.textSecondary}
          style={{ flex: 1, fontSize: 16, color: theme.text }}
        />
      </View>

      {trimmed ? (
        <View style={{ gap: 10 }}>
          <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
            RESULTS
          </Text>
          {matchedFaqs.length === 0 ? (
            <GlassView radius="card" style={{ padding: 18 }}>
              <Text className="text-body" style={{ color: theme.textSecondary }}>
                No matches for "{query}". Try a different search, or contact support below.
              </Text>
            </GlassView>
          ) : (
            matchedFaqs.map((f) => (
              <AnimatedPressable key={f.id} onPress={() => router.push(`/support/${f.topicId}`)} scaleTo={0.98}>
                <GlassView radius="card" style={{ padding: 16, gap: 4 }}>
                  <Text className="text-overline font-semibold" style={{ color: colors.partner.orange, letterSpacing: 0.6 }}>
                    {f.topicLabel.toUpperCase()}
                  </Text>
                  <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{f.question}</Text>
                </GlassView>
              </AnimatedPressable>
            ))
          )}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
            POPULAR TOPICS
          </Text>
          {supportTopics.map((topic) => {
            const Icon = TOPIC_ICON[topic.id];
            return (
              <AnimatedPressable key={topic.id} onPress={() => router.push(`/support/${topic.id}`)} scaleTo={0.98}>
                <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      backgroundColor: colors.partner.orangeTint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} color={colors.partner.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{topic.label}</Text>
                    <Text className="text-caption" style={{ color: theme.textSecondary }}>{topic.description}</Text>
                  </View>
                  <ChevronRight size={18} color={theme.textSecondary} />
                </GlassView>
              </AnimatedPressable>
            );
          })}
        </View>
      )}

      <View style={{ gap: 10, marginTop: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
          NEED MORE HELP?
        </Text>
        <AnimatedPressable onPress={() => router.push('/support/chat')} scaleTo={0.98}>
          <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <MessageCircleQuestion size={18} color={colors.partner.orange} />
            <Text className="text-body-lg font-medium" style={{ color: theme.text, flex: 1 }}>Chat with Support</Text>
            <ChevronRight size={18} color={theme.textSecondary} />
          </GlassView>
        </AnimatedPressable>
        <AnimatedPressable onPress={() => Linking.openURL('tel:0800000000').catch(() => {})} scaleTo={0.98}>
          <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Phone size={18} color={colors.partner.orange} />
            <Text className="text-body-lg font-medium" style={{ color: theme.text, flex: 1 }}>Call Fastermall</Text>
            <ChevronRight size={18} color={theme.textSecondary} />
          </GlassView>
        </AnimatedPressable>
      </View>
    </ScrollView>
  );
}
