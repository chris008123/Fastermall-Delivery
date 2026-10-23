import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';

export type RouteStepStatus = 'done' | 'current' | 'upcoming';

export interface RouteStep {
  key: string;
  label: string;
  sublabel?: string;
  status: RouteStepStatus;
}

interface RouteStepperProps {
  steps: RouteStep[];
  accentColor: string;
  /** Rendered under a step's text, only for the one step that's `current` —
   * this is where each screen plugs in the actual button/input for that stage. */
  renderAction?: (step: RouteStep) => ReactNode;
}

const DOT_SIZE = 14;
const LINE_WIDTH = 3;

/**
 * The Pickup & Handover flow is a literal physical journey (pickup → maybe
 * pay the vendor → collect → travel → hand over), so it's rendered as a
 * route: a vertical line the partner moves down, not a generic numbered
 * list or a progress percentage. The line itself fills in as ground is
 * covered, and the current stop pulses so it's readable at a glance.
 */
export function RouteStepper({ steps, accentColor, renderAction }: RouteStepperProps) {
  const { isDark } = useResolvedTheme();
  const mutedLine = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(28,28,26,0.12)';
  const mutedDot = isDark ? 'rgba(255,255,255,0.24)' : 'rgba(28,28,26,0.2)';

  return (
    <View>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View key={step.key} style={{ flexDirection: 'row' }}>
            <View style={{ width: DOT_SIZE + 4, alignItems: 'center' }}>
              <StepDot status={step.status} accentColor={accentColor} mutedDot={mutedDot} />
              {!isLast && (
                <View
                  style={{
                    width: LINE_WIDTH,
                    flex: 1,
                    minHeight: 24,
                    backgroundColor: step.status === 'done' ? accentColor : mutedLine,
                    marginTop: 2,
                    borderRadius: LINE_WIDTH / 2,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 18, paddingLeft: 12 }}>
              <StepContent step={step} renderAction={renderAction} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StepDot({
  status,
  accentColor,
  mutedDot,
}: {
  status: RouteStepStatus;
  accentColor: string;
  mutedDot: string;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (status === 'current') {
      pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      pulse.value = 0;
    }
  }, [status, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: status === 'current' ? 0.3 * (1 - pulse.value) + 0.05 : 0,
    transform: [{ scale: 1 + pulse.value * 0.7 }],
  }));

  return (
    <View style={{ width: DOT_SIZE, height: DOT_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {status === 'current' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: accentColor,
            },
            ringStyle,
          ]}
        />
      )}
      <View
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: status === 'upcoming' ? 'transparent' : accentColor,
          borderWidth: status === 'upcoming' ? 2 : 0,
          borderColor: mutedDot,
        }}
      />
    </View>
  );
}

function StepContent({ step, renderAction }: { step: RouteStep; renderAction?: (step: RouteStep) => ReactNode }) {
  const { isDark } = useResolvedTheme();
  const text = isDark ? '#f7f7f6' : '#1c1c1a';
  const textSecondary = isDark ? '#a3a39c' : '#7a7a72';
  const muted = step.status === 'upcoming';

  return (
    <View style={{ gap: 4 }}>
      <Text
        className={step.status === 'current' ? 'text-card-title font-semibold' : 'text-body-lg font-medium'}
        style={{ color: muted ? textSecondary : text }}
      >
        {step.label}
      </Text>
      {step.sublabel && (
        <Text className="text-caption" style={{ color: textSecondary }}>
          {step.sublabel}
        </Text>
      )}
      {step.status === 'current' && renderAction && <View style={{ marginTop: 10 }}>{renderAction(step)}</View>}
    </View>
  );
}
