import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import type { JobType } from '@/src/types/job';
import { darkPalette, jobDark, jobLight, lightPalette, type JobPaletteEntry, type Palette } from './tokens';

export function useTheme(): {
  t: Palette;
  isDark: boolean;
  job: (type: JobType) => JobPaletteEntry;
} {
  const { isDark } = useResolvedTheme();
  const t = isDark ? darkPalette : lightPalette;
  const jobs = isDark ? jobDark : jobLight;
  return { t, isDark, job: (type) => jobs[type] };
}
