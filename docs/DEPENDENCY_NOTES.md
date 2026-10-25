# Dependency notes

`npm audit` last reviewed 25 Oct 2026, after applying every fix that does not need a major upgrade (`npm audit fix`). The critical advisory (`shell-quote`) is gone. Four remain, and each needs a major version of Expo, Expo Router or Tailwind to clear:

| Package | Severity | Does it ship in the app? | Why it is accepted for now |
|---|---|---|---|
| `decode-uri-component` (via `expo-router` > `query-string`) | moderate | Yes, in link parsing | A specially built link could make the app slow to open that link. It cannot read data. Clears with the next Expo SDK. |
| `node-forge` (via Expo's code-signing tooling) | high | No, build tooling | Only used on a developer or build machine to sign updates. Not part of the app. |
| `zod` (inside the Expo CLI) | high | No, CLI | Runs on a developer machine. |
| `postcss-selector-parser` (via Tailwind / NativeWind) | moderate | No, build time | Runs while styles are compiled. |

Next review: when upgrading to the next Expo SDK, and before each release.
