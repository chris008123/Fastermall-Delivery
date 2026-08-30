import { Text, View } from 'react-native';
import { colors } from '@/src/theme';
import type { JobType } from '@/src/types/job';

interface BadgeProps {
  /** When given a job type, the badge auto-tints itself to that type's color. */
  jobType?: JobType;
  /** Otherwise pass an explicit color + label for statuses, etc. */
  color?: string;
  tint?: string;
  label: string;
}

const TYPE_LABEL: Record<JobType, string> = {
  MARKETPLACE: 'Marketplace',
  FOOD: 'Food',
  LAUNDRY: 'Laundry',
};

/** Small uppercase pill — the app-wide convention for section/type labels. */
export function Badge({ jobType, color, tint, label }: BadgeProps) {
  const resolvedColor = jobType ? colors.jobType[jobType].dark : color ?? colors.neutral[700];
  const resolvedTint = jobType ? colors.jobType[jobType].tint : tint ?? colors.neutral[100];
  const text = jobType ? TYPE_LABEL[jobType] : label;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: resolvedTint,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Text
        className="text-overline font-semibold"
        style={{ color: resolvedColor, letterSpacing: 0.8 }}
      >
        {text.toUpperCase()}
      </Text>
    </View>
  );
}
