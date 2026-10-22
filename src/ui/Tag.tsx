import type { ReactNode } from 'react';
import { View } from 'react-native';
import { JOB_LABEL } from '@/src/ds/tokens';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import type { JobType } from '@/src/types/job';

type TagTone = 'neutral' | 'primary' | 'go' | 'warn' | 'alert' | 'info';

interface TagProps {
  label: string;
  tone?: TagTone;
  /** Explicit colors win over `tone` (used by JobTag). */
  ink?: string;
  tint?: string;
  /** Leading dot — for live states like "Online" or "Pending". */
  dot?: boolean;
  icon?: ReactNode;
}

/** Small status label. Sentence case, tinted fill, no border. */
export function Tag({ label, tone = 'neutral', ink, tint, dot, icon }: TagProps) {
  const { t } = useTheme();
  const tones: Record<TagTone, { ink: string; tint: string }> = {
    neutral: { ink: t.inkSecondary, tint: t.sunken },
    primary: { ink: t.primary, tint: t.primaryTint },
    go: { ink: t.goInk, tint: t.goTint },
    warn: { ink: t.warnInk, tint: t.warnTint },
    alert: { ink: t.alertInk, tint: t.alertTint },
    info: { ink: t.infoInk, tint: t.infoTint },
  };
  const resolvedInk = ink ?? tones[tone].ink;
  const resolvedTint = tint ?? tones[tone].tint;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: resolvedTint,
      }}
    >
      {icon ?? (dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: resolvedInk }} /> : null)}
      <Txt variant="micro" color={resolvedInk}>
        {label}
      </Txt>
    </View>
  );
}

/** Tag tinted to a job type's identity color. */
export function JobTag({ jobType }: { jobType: JobType }) {
  const { job } = useTheme();
  const j = job(jobType);
  return <Tag label={JOB_LABEL[jobType]} ink={j.ink} tint={j.tint} />;
}
