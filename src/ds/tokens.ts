import { Platform, type TextStyle } from 'react-native';
import { colors } from '@/src/theme';
import type { JobType } from '@/src/types/job';

// A small themed layer used by the Wallet screen and its sheets. It's wired
// to the app's own palette and fonts (partner orange, warm neutrals,
// Fredoka) so those screens sit naturally next to the rest of the app —
// nothing here introduces new colors.

export interface Palette {
  bg: string;
  surface: string;
  sunken: string;
  ink: string;
  inkSecondary: string;
  inkTertiary: string;
  line: string;
  lineStrong: string;
  primary: string;
  primaryPressed: string;
  primaryTint: string;
  onPrimary: string;
  go: string;
  goInk: string;
  goTint: string;
  onGo: string;
  warn: string;
  warnInk: string;
  warnTint: string;
  alert: string;
  alertInk: string;
  alertTint: string;
  onAlert: string;
  info: string;
  infoInk: string;
  infoTint: string;
  scrim: string;
}

export const lightPalette: Palette = {
  bg: colors.light.background,
  surface: colors.light.surface,
  sunken: '#ece8e1',
  ink: colors.light.text,
  inkSecondary: colors.light.textSecondary,
  inkTertiary: colors.light.textTertiary,
  line: colors.light.border,
  lineStrong: colors.light.borderStrong,
  primary: colors.partner.orange,
  primaryPressed: colors.partner.orangeDark,
  primaryTint: colors.partner.orangeTint,
  onPrimary: colors.onBrand,
  go: colors.semantic.success,
  goInk: colors.accent.green,
  goTint: 'rgba(62, 207, 142, 0.16)',
  onGo: '#06251a',
  warn: colors.semantic.warning,
  warnInk: '#a8700a',
  warnTint: 'rgba(245, 181, 68, 0.2)',
  alert: colors.semantic.error,
  alertInk: colors.accent.red,
  alertTint: 'rgba(242, 109, 109, 0.14)',
  onAlert: colors.onBrand,
  info: colors.semantic.info,
  infoInk: colors.accent.blue,
  infoTint: 'rgba(74, 168, 240, 0.14)',
  scrim: 'rgba(0, 0, 0, 0.45)',
};

export const darkPalette: Palette = {
  bg: colors.dark.background,
  surface: colors.dark.surface,
  sunken: colors.dark.surfaceRaised,
  ink: colors.dark.text,
  inkSecondary: colors.dark.textSecondary,
  inkTertiary: colors.dark.textTertiary,
  line: colors.dark.border,
  lineStrong: colors.dark.borderStrong,
  primary: colors.partner.orange,
  primaryPressed: colors.partner.orangeDark,
  primaryTint: 'rgba(224, 122, 46, 0.18)',
  onPrimary: colors.onBrand,
  go: colors.semantic.success,
  goInk: colors.semantic.success,
  goTint: 'rgba(62, 207, 142, 0.16)',
  onGo: '#06251a',
  warn: colors.semantic.warning,
  warnInk: colors.semantic.warning,
  warnTint: 'rgba(245, 181, 68, 0.16)',
  alert: colors.semantic.error,
  alertInk: colors.semantic.error,
  alertTint: 'rgba(242, 109, 109, 0.16)',
  onAlert: colors.onBrand,
  info: colors.semantic.info,
  infoInk: colors.semantic.info,
  infoTint: 'rgba(74, 168, 240, 0.16)',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

export interface JobPaletteEntry {
  solid: string;
  onSolid: string;
  ink: string;
  tint: string;
}

const jobEntry = (type: JobType, onSolid: string): JobPaletteEntry => ({
  solid: colors.jobType[type].bright,
  onSolid,
  ink: colors.jobType[type].dark,
  tint: colors.jobType[type].tint,
});

export const jobLight: Record<JobType, JobPaletteEntry> = {
  MARKETPLACE: jobEntry('MARKETPLACE', '#ffffff'),
  FOOD: jobEntry('FOOD', '#2b2000'),
  LAUNDRY: jobEntry('LAUNDRY', '#ffffff'),
};
export const jobDark = jobLight;

export const fontFamily = {
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
  extrabold: 'Fredoka_700Bold',
} as const;

export type TypeVariant =
  | 'numeral'
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'micro';

export const type: Record<TypeVariant, TextStyle> = {
  numeral: { fontFamily: fontFamily.bold, fontSize: 44, lineHeight: 50, letterSpacing: -1 },
  display: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.6 },
  title: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 30, letterSpacing: -0.3 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fontFamily.semibold, fontSize: 11.5, lineHeight: 15 },
};

export const radii = { xs: 6, sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;

export const lift = Platform.select({
  ios: { shadowColor: '#3c2a14', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 18 },
  android: { elevation: 8 },
  default: {},
});
