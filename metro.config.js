const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

// Same as Expo's default config, plus the ids Sentry needs to turn a crash
// report's minified stack trace back into readable file and line numbers.
const config = getSentryExpoConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
