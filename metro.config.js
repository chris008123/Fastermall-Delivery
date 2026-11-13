const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

// Same as Expo's default config, plus the ids Sentry needs to turn a crash
// report's minified stack trace back into readable file and line numbers.
const config = getSentryExpoConfig(__dirname);

// Keeps the app small by leaving code out of the bundle:
//  - lucide-react-native ships ~1,800 icons and Metro can't drop the unused
//    ones, so imports are redirected to src/shared/lucideIcons.ts, which
//    re-exports only the icons the app uses.
//  - Sentry's browser-only replay, replay-canvas and feedback packages are
//    re-exported by @sentry/react-native for web, so they get bundled even
//    though they can't run on a phone. On iOS and Android they are replaced by
//    src/shims/sentryWebOnly.js (~400 KB of code).
const LUCIDE_BARREL = path.resolve(__dirname, 'src/shared/lucideIcons.ts');
const SENTRY_WEB_ONLY = path.resolve(__dirname, 'src/shims/sentryWebOnly.js');
const SENTRY_WEB_ONLY_PACKAGES = new Set([
  '@sentry-internal/replay',
  '@sentry-internal/replay-canvas',
  '@sentry-internal/feedback',
]);
const defaultResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'lucide-react-native') {
    return { type: 'sourceFile', filePath: LUCIDE_BARREL };
  }
  // NOTE: do NOT stub expo-symbols or @expo/ui on Android. expo-router's
  // Android toolbar files call @expo/ui functions the moment they load
  // (e.g. fillMaxHeight()), so an empty stub crashes every route with
  // "TypeError: undefined is not a function".
  if ((platform === 'android' || platform === 'ios') && SENTRY_WEB_ONLY_PACKAGES.has(moduleName)) {
    return { type: 'sourceFile', filePath: SENTRY_WEB_ONLY };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
