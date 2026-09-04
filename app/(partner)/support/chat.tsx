import { Headset, Send } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

interface ChatMessage {
  id: string;
  from: 'agent' | 'me';
  text: string;
}

const INITIAL: ChatMessage[] = [
  {
    id: 'greet',
    from: 'agent',
    text: "Hi! I'm with Fastermall Support. What can I help you with today?",
  },
];

// Mock-only: no backend chat service exists yet, so this simulates one
// agent reply after the partner sends a message — enough to demo the
// flow without pretending there's a live queue behind it.
export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const mine: ChatMessage = { id: `me-${Date.now()}`, from: 'me', text };
    setMessages((m) => [...m, mine]);
    setDraft('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((m) => [
        ...m,
        {
          id: `agent-${Date.now()}`,
          from: 'agent',
          text: "Got it — thanks for the details. A support agent will follow up shortly. If this is urgent or you're mid-delivery, use the Safety button on the active delivery screen instead.",
        },
      ]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Support</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }} style={{ flex: 1 }}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={{
              flexDirection: 'row',
              alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: 8,
              maxWidth: '86%',
            }}
          >
            {m.from === 'agent' && (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.brand.tealTint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Headset size={14} color={colors.brand.teal} />
              </View>
            )}
            <View
              style={{
                backgroundColor: m.from === 'me' ? colors.partner.orange : theme.surface,
                borderWidth: m.from === 'me' ? 0 : 1,
                borderColor: theme.border,
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text
                className="text-body"
                style={{ color: m.from === 'me' ? colors.onBrand : theme.text }}
              >
                {m.text}
              </Text>
            </View>
          </View>
        ))}
        {isTyping && (
          <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'flex-end', gap: 8 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.brand.tealTint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Headset size={14} color={colors.brand.teal} />
            </View>
            <View
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text className="text-body" style={{ color: theme.textSecondary }}>Typing…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 16,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message"
          placeholderTextColor={theme.textSecondary}
          style={{
            flex: 1,
            fontSize: 16,
            color: theme.text,
            borderWidth: 1.5,
            borderColor: theme.border,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <AnimatedPressable onPress={send} scaleTo={0.9}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: colors.partner.orange,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={18} color={colors.onBrand} />
          </View>
        </AnimatedPressable>
      </View>
    </KeyboardAvoidingView>
  );
}
