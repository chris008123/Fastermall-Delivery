// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'web-build/*', 'coverage/*'],
  },
  {
    rules: {
      // Apostrophes in React Native <Text> are fine; there is no HTML to escape.
      'react/no-unescaped-entities': 'off',

      // This rule treats Reanimated shared values (`x.value = ...`) as
      // forbidden mutation of a hook value. That is how Reanimated works, so
      // it only produces false alarms here.
      'react-hooks/immutability': 'off',

      // Worth looking at, not worth failing the build over yet.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Jest's mock factories need require().
    files: ['__tests__/**'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
