import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';

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
  /** Rendered under the current step's text, if a screen wants to plug an
   * action in there. The active-delivery screen pins its action to the
   * bottom of the screen instead, so it doesn't use this. */
  renderAction?: (step: RouteStep) => ReactNode;
}

const DOT_SIZE = 14;
const LINE_WIDTH = 3;

const STATUS_WORD: Record<RouteStepStatus, string> = {
  done: 'done',
  current: 'current step',
  upcoming: 'upcoming',
};

/**
 * The Pickup & Handover flow is a literal physical journey (pickup → maybe
 * pay the vendor → collect → travel → hand over), so it's rendered as a
 * route: a vertical line the partner moves down. The line fills in as
 * ground is covered and the current stop pulses so it reads at a glance.
 */
export function RouteStepper({ steps, accentColor, renderAction }: RouteStepperProps) {
  const { t } = useTheme();

  return (
    <View>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View
            key={step.key}
            accessible
            accessibilityLabel={`${step.label}, ${STATUS_WORD[step.status]}`}
            style={{ flexDirection: 'row' }}
          >
            <View style={{ width: DOT_SIZE + 4, alignItems: 'center' }}>
              <StepDot status={step.status} accentColor={accentColor} mutedDot={t.lineStrong} />
              {!isLast && (
                <View
                  style={{
                    width: LINE_WIDTH,
                    flex: 1,
                    minHeight: 24,
                    backgroundColor: step.status === 'done' ? accentColor : t.line,
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
  return (
    <View style={{ gap: 2 }}>
      <Txt
        variant={step.status === 'current' ? 'heading' : 'body'}
        tone={step.status === 'current' ? 'ink' : step.status === 'done' ? 'secondary' : 'tertiary'}
      >
        {step.label}
      </Txt>
      {step.sublabel && step.status === 'current' ? (
        <Txt variant="caption" tone="secondary">
          {step.sublabel}
        </Txt>
      ) : null}
      {step.status === 'current' && renderAction && <View style={{ marginTop: 10 }}>{renderAction(step)}</View>}
    </View>
  );
}
