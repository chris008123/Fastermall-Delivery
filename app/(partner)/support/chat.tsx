import { useLocalSearchParams } from 'expo-router';
import { Headset, Send } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { Button } from '@/src/shared/components/Button';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import {
  getConversation,
  isOpen,
  listConversations,
  sendMessage,
  startConversation,
  type Conversation,
} from '@/src/services/supportTickets';
import { colors } from '@/src/theme';

const REFRESH_MS = 15_000;
const MIN_FIRST_MESSAGE = 5;

/**
 * Messages with Fastermall support, backed by a support ticket that admins
 * answer in the console. Opens the conversation from a SUPPORT_REPLY push
 * (?ticketId=), or the latest open one, or lets the partner start one.
 * Replies are checked every 15 seconds while the screen is open.
 */
export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const params = useLocalSearchParams<{ ticketId?: string; deliveryId?: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      let id = typeof params.ticketId === 'string' ? params.ticketId : undefined;
      if (!id) id = (await listConversations()).find((t) => isOpen(t.status))?.id;
      setConversation(id ? await getConversation(id) : null);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load your messages.');
    } finally {
      setLoading(false);
    }
  }, [params.ticketId]);

  useEffect(() => {
    // load() only sets state after awaiting the network, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Pick up support's answers while the screen is open.
  const conversationId = conversation?.id;
  useEffect(() => {
    if (!conversationId) return undefined;
    const timer = setInterval(() => {
      getConversation(conversationId).then(setConversation).catch(() => {});
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [conversationId]);

  const closed = conversation ? !isOpen(conversation.status) : false;

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (!conversation || closed) {
      if (text.length < MIN_FIRST_MESSAGE) {
        setSendError('Tell us a little more so we can help.');
        return;
      }
    }
    setSending(true);
    setSendError(null);
    try {
      if (!conversation || closed) {
        const deliveryId = typeof params.deliveryId === 'string' ? params.deliveryId : undefined;
        setConversation(await startConversation(text, deliveryId));
      } else {
        await sendMessage(conversation.id, text);
        setConversation(await getConversation(conversation.id));
      }
      setDraft('');
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Your message wasn’t sent. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const messages = conversation?.messages ?? [];
  const waiting = conversation && !closed && messages.every((m) => !m.fromSupport);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Support</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20, gap: 10, flexGrow: 1 }}
        style={{ flex: 1 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {loading ? (
          <ActivityIndicator color={colors.partner.orange} style={{ marginTop: 24 }} />
        ) : loadError ? (
          <View style={{ gap: 10 }}>
            <Text className="text-body" style={{ color: theme.textSecondary }}>{loadError}</Text>
            <Button
              title="Try again"
              variant="secondary"
              size="sm"
              onPress={() => {
                setLoading(true);
                void load();
              }}
            />
          </View>
        ) : messages.length === 0 ? (
          <Bubble fromSupport theme={theme}>
            Hi! Tell us what’s wrong and we’ll reply here. If you’re in danger or mid-delivery and it’s urgent, use the Safety button on the active delivery screen.
          </Bubble>
        ) : (
          messages.map((m) => (
            <Bubble key={m.id} fromSupport={m.fromSupport} theme={theme}>
              {m.text}
            </Bubble>
          ))
        )}
        {waiting ? (
          <Text className="text-caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Sent to Fastermall support. Replies appear here and as a notification.
          </Text>
        ) : null}
        {closed ? (
          <Text className="text-caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            This conversation is closed. Send a message to start a new one.
          </Text>
        ) : null}
      </ScrollView>

      {sendError ? (
        <Text accessibilityRole="alert" className="text-caption" style={{ color: colors.semantic.error, paddingHorizontal: 20 }}>
          {sendError}
        </Text>
      ) : null}
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
          accessibilityLabel="Type a message"
          value={draft}
          onChangeText={setDraft}
          placeholder={conversation && !closed ? 'Type a message' : 'Describe the problem'}
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={2000}
          editable={!loading}
          style={{
            flex: 1,
            fontSize: 16,
            color: theme.text,
            borderWidth: 1.5,
            borderColor: theme.border,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            maxHeight: 120,
          }}
        />
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: sending || !draft.trim() }}
          disabled={sending || !draft.trim()}
          onPress={() => void send()}
          scaleTo={0.9}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: colors.partner.orange,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sending || !draft.trim() ? 0.5 : 1,
            }}
          >
            {sending ? <ActivityIndicator color={colors.onBrand} size="small" /> : <Send size={18} color={colors.onBrand} />}
          </View>
        </AnimatedPressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({
  fromSupport,
  theme,
  children,
}: {
  fromSupport: boolean;
  theme: { surface: string; border: string; text: string };
  children: React.ReactNode;
}) {
  return (
    <View
      style={{ flexDirection: 'row', alignSelf: fromSupport ? 'flex-start' : 'flex-end', alignItems: 'flex-end', gap: 8, maxWidth: '86%' }}
      accessible
      accessibilityLabel={`${fromSupport ? 'Fastermall support' : 'You'}: ${typeof children === 'string' ? children : ''}`}
    >
      {fromSupport ? (
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brand.tealTint, alignItems: 'center', justifyContent: 'center' }}>
          <Headset size={14} color={colors.brand.teal} />
        </View>
      ) : null}
      <View
        style={{
          backgroundColor: fromSupport ? theme.surface : colors.partner.orange,
          borderWidth: fromSupport ? 1 : 0,
          borderColor: theme.border,
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text className="text-body" style={{ color: fromSupport ? theme.text : colors.onBrand }}>
          {children}
        </Text>
      </View>
    </View>
  );
}
