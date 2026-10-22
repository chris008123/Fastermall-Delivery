import { Platform, type TextStyle } from 'react-native';
import type { JobType } from '@/src/types/job';

// Design system v2 ("Dispatch"). Lives alongside src/theme so screens that
// haven't migrated yet (and the Profile tab, which is intentionally frozen)
// keep reading the old `colors` export untouched.

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
  bg: '#F4F6F5',
  surface: '#FFFFFF',
  sunken: '#E9EDEC',
  ink: '#101417',
  inkSecondary: '#4A5559',
  inkTertiary: '#69757A',
  line: '#DCE2E0',
  lineStrong: '#C2CBC8',
  primary: '#067069',
  primaryPressed: '#04524D',
  primaryTint: 'rgba(6, 112, 105, 0.10)',
  onPrimary: '#FFFFFF',
  go: '#22C07A',
  goInk: '#0B7443',
  goTint: 'rgba(34, 192, 122, 0.14)',
  onGo: '#06251A',
  warn: '#F5B544',
  warnInk: '#8A5B00',
  warnTint: 'rgba(245, 181, 68, 0.20)',
  alert: '#D93A3F',
  alertInk: '#B42428',
  alertTint: 'rgba(217, 58, 63, 0.10)',
  onAlert: '#FFFFFF',
  info: '#2F7FC4',
  infoInk: '#1F62A0',
  infoTint: 'rgba(47, 127, 196, 0.10)',
  scrim: 'rgba(16, 20, 23, 0.45)',
};

export const darkPalette: Palette = {
  bg: '#0F1C1F',
  surface: '#162528',
  sunken: '#1D2F33',
  ink: '#EEF4F3',
  inkSecondary: '#A6B5B8',
  inkTertiary: '#7C8D91',
  line: '#26383C',
  lineStrong: '#35494E',
  primary: '#18B2A5',
  primaryPressed: '#12958A',
  primaryTint: 'rgba(24, 178, 165, 0.16)',
  onPrimary: '#04201E',
  go: '#2ED47F',
  goInk: '#4EE09A',
  goTint: 'rgba(46, 212, 127, 0.16)',
  onGo: '#05241A',
  warn: '#F5B544',
  warnInk: '#F5B544',
  warnTint: 'rgba(245, 181, 68, 0.16)',
  alert: '#F0585C',
  alertInk: '#FF8083',
  alertTint: 'rgba(240, 88, 92, 0.16)',
  onAlert: '#1F0506',
  info: '#4AA8F0',
  infoInk: '#7CC0F5',
  infoTint: 'rgba(74, 168, 240, 0.16)',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

// Job-type identity. These carry meaning (which kind of job this is), so
// they stay close to the original marketplace / food / laundry colors.
// `solid` is a fill with guaranteed-legible `onSolid` text; `ink` is for
// text on `tint`.
export interface JobPaletteEntry {
  solid: string;
  onSolid: string;
  ink: string;
  tint: string;
}

export const jobLight: Record<JobType, JobPaletteEntry> = {
  MARKETPLACE: { solid: '#067069', onSolid: '#FFFFFF', ink: '#04524D', tint: 'rgba(6, 112, 105, 0.10)' },
  FOOD: { solid: '#F8BB00', onSolid: '#2B2000', ink: '#7A5A00', tint: 'rgba(248, 187, 0, 0.20)' },
  LAUNDRY: { solid: '#0D6E99', onSolid: '#FFFFFF', ink: '#0D6E99', tint: 'rgba(18, 144, 201, 0.10)' },
};

export const jobDark: Record<JobType, JobPaletteEntry> = {
  MARKETPLACE: { solid: '#18B2A5', onSolid: '#04201E', ink: '#3CC4B8', tint: 'rgba(24, 178, 165, 0.16)' },
  FOOD: { solid: '#F8BB00', onSolid: '#2B2000', ink: '#F8BB00', tint: 'rgba(248, 187, 0, 0.16)' },
  LAUNDRY: { solid: '#37A7DE', onSolid: '#04202E', ink: '#6BBFE8', tint: 'rgba(55, 167, 222, 0.16)' },
};

export const JOB_LABEL: Record<JobType, string> = {
  MARKETPLACE: 'Marketplace',
  FOOD: 'Food',
  LAUNDRY: 'Laundry',
};

// Archivo, one family. Money and distances use tabular figures so digits
// don't jitter as values change. No all-caps tier on purpose.
export const fontFamily = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
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
  numeral: {
    fontFamily: fontFamily.extrabold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  display: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.1 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 23 },
  label: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 18, letterSpacing: 0.1 },
  caption: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fontFamily.semibold, fontSize: 11.5, lineHeight: 14 },
};

// Radius hierarchy: small things stay tight, panels are mid, sheets are
// the largest. The full pill is reserved for buttons.
export const radii = { xs: 6, sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;

// The only elevated things in the system: the floating nav, toasts, sheets.
export const lift = Platform.select({
  ios: { shadowColor: '#101417', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 18 },
  android: { elevation: 8 },
  default: {},
});
