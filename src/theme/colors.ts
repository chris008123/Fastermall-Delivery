export const colors = {
  brand: {
    teal: '#067069',
    tealDark: '#04524d',
    tealBright: '#0a8f86',
    tealTint: 'rgba(6, 112, 105, 0.1)',
    gold: '#f8bb00',
    goldDark: '#c99400',
  },
  // The partner app's own identity color — used for anything that belongs
  // to the partner (availability, earnings, tab bar) rather than to one of
  // the three job types they carry for.
  partner: {
    orange: '#e07a2e',
    orangeDark: '#b85f1f',
    orangeBright: '#f2954f',
    orangeTint: 'rgba(224, 122, 46, 0.1)',
  },
  neutral: {
    50: '#fafafa',
    100: '#f2f2f0',
    200: '#e4e4e1',
    300: '#c9c9c4',
    400: '#a3a39c',
    500: '#7a7a72',
    600: '#5c5c56',
    700: '#42423e',
    800: '#2e2e2b',
    900: '#1c1c1a',
    950: '#121211',
  },
  semantic: {
    success: '#1a9c5c',
    warning: '#e0a300',
    error: '#d64545',
    info: '#3b82c4',
  },
  onBrand: '#ffffff',
  accent: {
    green: '#1a9c5c',
    orange: '#e07a2e',
    blue: '#3b82c4',
    purple: '#8b5cf6',
    red: '#d64545',
  },
  laundry: {
    blue: '#1290c9',
    blueDark: '#0d6e99',
    blueBright: '#2fa8de',
    blueTint: 'rgba(18, 144, 201, 0.1)',
  },
  // Job-type identity color — every job/order card, badge, and the active
  // delivery route line pick their tint from here based on `job.type`.
  jobType: {
    MARKETPLACE: { base: '#067069', dark: '#04524d', bright: '#0a8f86', tint: 'rgba(6, 112, 105, 0.1)' },
    FOOD: { base: '#c99400', dark: '#a67a00', bright: '#f8bb00', tint: 'rgba(248, 187, 0, 0.14)' },
    LAUNDRY: { base: '#1290c9', dark: '#0d6e99', bright: '#2fa8de', tint: 'rgba(18, 144, 201, 0.1)' },
  },
  light: {
    background: '#fafafa',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    text: '#1c1c1a',
    textSecondary: '#7a7a72',
    border: '#e4e4e1',
    glass: {
      background: 'rgba(255, 255, 255, 0.6)',
      backgroundStrong: 'rgba(255, 255, 255, 0.78)',
      border: 'rgba(255, 255, 255, 0.5)',
      shadow: 'rgba(28, 28, 26, 0.08)',
    },
  },
  dark: {
    background: '#121211',
    surface: '#1c1c1a',
    surfaceRaised: '#232320',
    text: '#f7f7f6',
    textSecondary: '#a3a39c',
    border: '#3a3a36',
    glass: {
      background: 'rgba(28, 28, 26, 0.55)',
      backgroundStrong: 'rgba(28, 28, 26, 0.72)',
      border: 'rgba(255, 255, 255, 0.08)',
      shadow: 'rgba(0, 0, 0, 0.35)',
    },
  },
} as const;

export type ColorScheme = 'light' | 'dark';
