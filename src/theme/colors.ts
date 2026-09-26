// Redesigned per the Fastermall Partner Figma brief's 4-layer color model:
// Layer 1 (neutral foundation) — light/dark below now have four background
// steps (background/surface/surfaceRaised/surfaceOverlay) and three text
// tones, with borders tinted toward the mode's text color instead of a flat
// gray. Dark mode's steps get *lighter* as they elevate and stay warm-tinted
// rather than a pure color-negative of light mode. Layer 2 (functional
// accent — partner + job-type ramps) and Layer 3 (semantic status colors)
// are below. All existing keys keep their original shape so every screen
// still reading `theme.text`/`colors.partner.orange`/etc. picks up the
// refreshed values automatically; new keys (surfaceOverlay, textTertiary,
// borderStrong) are additive for screens migrating to the fuller system.
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
  // the three job types they carry for. Now a proper 400/500/600/700 ramp
  // instead of hand-picked single values per state.
  partner: {
    orange: '#e07a2e', // 500 — base
    orangeDark: '#c96420', // 600 — hover/pressed
    orangeBright: '#f3985a', // 400 — link/tint accents
    orange700: '#a44f18', // 700 — active/deepest state
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
  // Layer 3 — deliberately breaks the brand palette. Destructive actions
  // ("Report failed delivery", "Cancel job") always use `error` here, never
  // a job-type or partner-orange color.
  semantic: {
    success: '#3ecf8e',
    warning: '#f5b544',
    error: '#f26d6d',
    info: '#4aa8f0',
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
  // `bright` is the refreshed, more vivid identity tone; `base`/`dark` stay
  // as the mid/darkest text-on-tint contrast steps.
  jobType: {
    MARKETPLACE: { base: '#067069', dark: '#04524d', bright: '#14a89c', tint: 'rgba(6, 112, 105, 0.1)' },
    FOOD: { base: '#c48f00', dark: '#a67a00', bright: '#f8bb00', tint: 'rgba(248, 187, 0, 0.14)' },
    LAUNDRY: { base: '#1290c9', dark: '#0d6e99', bright: '#37a7de', tint: 'rgba(18, 144, 201, 0.1)' },
  },
  light: {
    background: '#f4f1ec',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    // Elevation in light mode reads through shadow, not a lighter fill —
    // surface/surfaceRaised/surfaceOverlay are intentionally the same white.
    surfaceOverlay: '#ffffff',
    text: '#1c1a16',
    textSecondary: 'rgba(28, 26, 22, 0.6)',
    textTertiary: 'rgba(28, 26, 22, 0.4)',
    border: 'rgba(28, 26, 22, 0.09)',
    borderStrong: 'rgba(28, 26, 22, 0.14)',
    glass: {
      background: 'rgba(255, 255, 255, 0.72)',
      backgroundStrong: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(28, 26, 22, 0.14)',
      shadow: 'rgba(60, 42, 20, 0.4)',
    },
  },
  dark: {
    background: '#171512',
    surface: '#211e19',
    surfaceRaised: '#2b2721',
    surfaceOverlay: '#37322a',
    text: '#f7f3ec',
    textSecondary: 'rgba(247, 243, 236, 0.62)',
    textTertiary: 'rgba(247, 243, 236, 0.38)',
    border: 'rgba(247, 243, 236, 0.09)',
    borderStrong: 'rgba(247, 243, 236, 0.16)',
    glass: {
      background: 'rgba(43, 39, 33, 0.72)',
      backgroundStrong: 'rgba(43, 39, 33, 0.85)',
      border: 'rgba(247, 243, 236, 0.16)',
      shadow: 'rgba(0, 0, 0, 0.75)',
    },
  },
} as const;

export type ColorScheme = 'light' | 'dark';
