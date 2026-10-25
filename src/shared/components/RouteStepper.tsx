import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { colors } from '@/src/theme';

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
  const theme = isDark ? colors.dark : colors.light;
  const mutedLine = theme.border;
  const mutedDot = theme.borderStrong;

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
              <StepContent step={step} position={index + 1} total={steps.length} renderAction={renderAction} />
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
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  // The current stop pulses; with reduce motion on it holds a steady ring.
  useEffect(() => {
    if (status === 'current' && reduceMotion) {
      cancelAnimation(pulse);
      pulse.value = 0.5;
    } else if (status === 'current') {
      pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
    return () => cancelAnimation(pulse);
  }, [status, reduceMotion, pulse]);

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

const STATUS_SPOKEN: Record<RouteStepStatus, string> = {
  done: 'completed',
  current: 'current step',
  upcoming: 'upcoming',
};

function StepContent({
  step,
  position,
  total,
  renderAction,
}: {
  step: RouteStep;
  position: number;
  total: number;
  renderAction?: (step: RouteStep) => ReactNode;
}) {
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const text = theme.text;
  const textSecondary = theme.textSecondary;
  const muted = step.status === 'upcoming';

  return (
    <View style={{ gap: 4 }}>
      {/* Only the label is announced as a unit, so the button or code field
          under the current step stays separately reachable. */}
      <Text
        accessible
        accessibilityLabel={`Step ${position} of ${total}: ${step.label}, ${STATUS_SPOKEN[step.status]}`}
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
