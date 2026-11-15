// Semantic type scale, ported from the customer app so both apps describe
// text in the same vocabulary (display/h1/h2/cardTitle/bodyLg/body/caption/
// overline) instead of the delivery app's previous raw fontFamily map.
export const typography = {
  // Large Title — 30-32px SemiBold. Screen-level headers.
  display: { fontSize: 32, lineHeight: 40, fontFamily: 'Fredoka_600SemiBold', letterSpacing: -1 },
  // Section Titles — 22-24px Bold. "Available Jobs", "Today's Earnings".
  h1: { fontSize: 24, lineHeight: 32, fontFamily: 'Fredoka_700Bold', letterSpacing: -0.6 },
  h2: { fontSize: 20, lineHeight: 28, fontFamily: 'Fredoka_600SemiBold' },
  // Card Titles — 16-18px Medium.
  cardTitle: { fontSize: 17, lineHeight: 24, fontFamily: 'Fredoka_500Medium' },
  bodyLg: { fontSize: 16, lineHeight: 24, fontFamily: 'Fredoka_400Regular' },
  // Descriptions — 14-15px Regular.
  body: { fontSize: 15, lineHeight: 21, fontFamily: 'Fredoka_400Regular' },
  // Metadata — 12-13px Medium.
  caption: { fontSize: 13, lineHeight: 18, fontFamily: 'Fredoka_500Medium' },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Fredoka_500Medium',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  // Money — Plus Jakarta Sans, which (unlike Fredoka) has the cedi sign
  // and tabular figures, so amounts line up and don't jiggle as they change.
  money: {
    display: { fontSize: 34, lineHeight: 42, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.8 },
    h1: { fontSize: 26, lineHeight: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.5 },
    h2: { fontSize: 20, lineHeight: 26, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.3 },
    title: { fontSize: 17, lineHeight: 22, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.2 },
    body: { fontSize: 15, lineHeight: 20, fontFamily: 'PlusJakartaSans_600SemiBold' },
    caption: { fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans_600SemiBold' },
  },
  // Kept for any existing call sites relying on the old raw family map.
  fontFamily: {
    regular: 'Fredoka_400Regular',
    medium: 'Fredoka_500Medium',
    semibold: 'Fredoka_600SemiBold',
    bold: 'Fredoka_700Bold',
  },
} as const;
