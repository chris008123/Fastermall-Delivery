// metro.config.js swaps Sentry's browser-only packages for src/shims/sentryWebOnly.js
// on iOS and Android. Jest can't run Metro, so these mocks do the same swap and
// prove the real SDK still loads and initialises with the shim in place.
jest.mock('@sentry-internal/replay', () => require('../src/shims/sentryWebOnly'));
jest.mock('@sentry-internal/replay-canvas', () => require('../src/shims/sentryWebOnly'));
jest.mock('@sentry-internal/feedback', () => require('../src/shims/sentryWebOnly'));

// Fake timers go on before Sentry loads so the timers it schedules can't keep
// the test process alive.
jest.useFakeTimers();
const Sentry: typeof import('@sentry/react-native') = require('@sentry/react-native');

describe('Sentry with the browser-only packages replaced', () => {
  it('loads and exposes the calls the app uses', () => {
    expect(typeof Sentry.init).toBe('function');
    expect(typeof Sentry.captureException).toBe('function');
    expect(typeof Sentry.setUser).toBe('function');
  });

  it('initialises and accepts a user without throwing', () => {
    expect(() => {
      Sentry.init({
        dsn: 'https://key@example.ingest.sentry.io/1',
        tracesSampleRate: 0,
        enableNative: false,
        enableAutoSessionTracking: false,
      });
      Sentry.setUser({ id: 'u1' });
    }).not.toThrow();
  });
});
