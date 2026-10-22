import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { lift, radii } from '@/src/ds/tokens';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { useNavClearance } from '@/src/ui/AppNav';
import type { ToastTone } from './ToastProvider';

interface ToastProps {
  message: string;
  tone: ToastTone;
}

// Slides up and fades; sits just above whichever nav style is active.
export function Toast({ message, tone }: ToastProps) {
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
      pointerEvents="none"
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
        <Txt variant="body" style={{ flexShrink: 1 }}>
          {message}
        </Txt>
      </View>
    </Animated.View>
  );
}
