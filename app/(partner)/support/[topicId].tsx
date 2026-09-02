import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { Button } from '@/src/shared/components/Button';
import { GlassView } from '@/src/shared/components/GlassView';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { supportTopics } from '@/src/data/mockSupport';
import { colors } from '@/src/theme';
import type { SupportTopicId } from '@/src/types/support';

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
          return (
            <GlassView key={faq.id} radius="card" style={{ padding: 16, gap: expanded ? 10 : 0 }}>
              <AnimatedPressable
                onPress={() => setExpandedId(expanded ? null : faq.id)}
                scaleTo={0.99}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Text className="text-body-lg font-semibold" style={{ color: theme.text, flex: 1 }}>{faq.question}</Text>
                {expanded ? (
                  <ChevronUp size={18} color={theme.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={theme.textSecondary} />
                )}
              </AnimatedPressable>
              {expanded && (
                <Text className="text-body" style={{ color: theme.textSecondary }}>{faq.answer}</Text>
              )}
            </GlassView>
          );
        })}
      </View>

      <View style={{ gap: 10, marginTop: 8 }}>
        <Text className="text-overline font-semibold" style={{ color: theme.textSecondary, letterSpacing: 0.8 }}>
          STILL NEED HELP?
        </Text>
        <Button
          title="Chat with Support"
          variant="secondary"
          fullWidth
          onPress={() => router.push('/support/chat')}
        />
        <Button
          title="Call Fastermall"
          variant="ghost"
          fullWidth
          onPress={() => Linking.openURL('tel:0800000000').catch(() => {})}
        />
      </View>
    </ScrollView>
  );
}
