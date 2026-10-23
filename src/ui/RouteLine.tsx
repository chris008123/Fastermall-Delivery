import { View } from 'react-native';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';

interface Stop {
  title: string;
  sub?: string;
}

interface RouteLineProps {
  pickup: Stop;
  dropoff: Stop;
  /** Fill color of the pickup dot — pass the job type's solid color. */
  color: string;
  /** Single-line stops, no subtitles, tighter spacing (for list cards). */
  compact?: boolean;
}

const DOT = 10;
const DOT_TOP = 7;

/** Pickup to drop-off as one connected line: filled dot to hollow dot. */
export function RouteLine({ pickup, dropoff, color, compact }: RouteLineProps) {
  const { t } = useTheme();
  const gap = compact ? 8 : 18;

  const row = (stop: Stop, filled: boolean, connector: boolean) => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View
        style={{
          width: DOT,
          height: DOT,
          marginTop: DOT_TOP,
          borderRadius: DOT / 2,
          backgroundColor: filled ? color : 'transparent',
          borderWidth: filled ? 0 : 2,
          borderColor: t.ink,
        }}
      />
      <View style={{ flex: 1 }}>
        <Txt variant={filled || !compact ? 'bodyStrong' : 'body'} tone={!filled && compact ? 'secondary' : 'ink'} numberOfLines={compact ? 1 : 2}>
          {stop.title}
        </Txt>
        {!compact && stop.sub ? (
          <Txt variant="caption" tone="secondary">
            {stop.sub}
          </Txt>
        ) : null}
      </View>
      {connector ? (
        <View
          style={{
            position: 'absolute',
            left: DOT / 2 - 1,
            top: DOT_TOP + DOT + 2,
            bottom: -(gap + DOT_TOP - 2),
            width: 2,
            borderRadius: 1,
            backgroundColor: t.lineStrong,
          }}
        />
      ) : null}
    </View>
  );

  return (
    <View style={{ gap }}>
      {row(pickup, true, true)}
      {row(dropoff, false, false)}
    </View>
  );
}
