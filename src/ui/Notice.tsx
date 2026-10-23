import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { radii } from '@/src/ds/tokens';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';

interface NoticeProps {
  title: string;
  message?: string;
  tone?: 'alert' | 'warn' | 'info' | 'go';
  actionLabel?: string;
  onAction?: () => void;
}

/** Inline message that stays on the screen until the problem is fixed
 * (a failed load, a document about to expire). For passing feedback use
 * the toast instead. */
export function Notice({ title, message, tone = 'alert', actionLabel, onAction }: NoticeProps) {
  const { t } = useTheme();
  const map = {
    alert: { ink: t.alertInk, tint: t.alertTint, Icon: CircleAlert },
    warn: { ink: t.warnInk, tint: t.warnTint, Icon: TriangleAlert },
    info: { ink: t.infoInk, tint: t.infoTint, Icon: Info },
    go: { ink: t.goInk, tint: t.goTint, Icon: CircleCheck },
  }[tone];

  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 14,
        borderRadius: radii.md,
        backgroundColor: map.tint,
      }}
    >
      <map.Icon size={20} color={map.ink} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong" color={map.ink}>
          {title}
        </Txt>
        {message ? (
          <Txt variant="caption" tone="secondary">
            {message}
          </Txt>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 16 }}
            style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}
          >
            <Txt variant="label" color={map.ink} style={{ textDecorationLine: 'underline' }}>
              {actionLabel}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
