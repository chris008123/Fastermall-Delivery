import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { lift, radii } from '@/src/ds/tokens';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { useNavClearance } from '@/src/ui/AppNav';
import type { ToastTone } from './ToastProvider';

interface ToastProps {
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

// Slides up and fades; sits just above whichever nav style is active.
export function Toast({ message, tone, actionLabel, onAction }: ToastProps) {
  const { t } = useTheme();
  const clearance = useNavClearance();

  const toneMap = {
    success: { color: t.goInk, Icon: CircleCheck },
    error: { color: t.alertInk, Icon: CircleAlert },
    warning: { color: t.warnInk, Icon: TriangleAlert },
    info: { color: t.infoInk, Icon: Info },
  } as const;
  const { color, Icon } = toneMap[tone];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(220)}
      exiting={FadeOutDown.duration(200)}
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: clearance - 8,
        alignItems: 'center',
        paddingHorizontal: 20,
      }}
    >
      <View
        pointerEvents={onAction ? 'auto' : 'none'}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            maxWidth: 440,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: radii.md,
            backgroundColor: t.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.lineStrong,
          },
          lift,
        ]}
      >
        <Icon size={20} color={color} />
        <Txt variant="body" style={{ flexShrink: 1, flexGrow: 1 }}>
          {message}
        </Txt>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            hitSlop={8}
            style={{ minHeight: 44, justifyContent: 'center', marginVertical: -12, marginRight: -4 }}
          >
            <Txt variant="label" tone="primary">
              {actionLabel}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
