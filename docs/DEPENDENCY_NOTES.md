# Dependency notes

`npm audit` last reviewed 25 Oct 2026, after applying every fix that does not need a major upgrade (`npm audit fix`). The critical advisory (`shell-quote`) is gone. Four remain, and each needs a major version of Expo, Expo Router or Tailwind to clear:

| Package | Severity | Does it ship in the app? | Why it is accepted for now |
|---|---|---|---|
| `decode-uri-component` (via `expo-router` > `query-string`) | moderate | Yes, in link parsing | A specially built link could make the app slow to open that link. It cannot read data. Clears with the next Expo SDK. |
| `node-forge` (via Expo's code-signing tooling) | high | No, build tooling | Only used on a developer or build machine to sign updates. Not part of the app. |
| `zod` (inside the Expo CLI) | high | No, CLI | Runs on a developer machine. |
| `postcss-selector-parser` (via Tailwind / NativeWind) | moderate | No, build time | Runs while styles are compiled. |



## Schedule (proposed, change it to suit the team)
| When | What |
|---|---|
| Before every release | Run `npm audit`; read any new advisory; update this file |
| First week of each month | `npm audit fix` for safe updates, run typecheck, lint and tests, then test on a phone |
| Within 4 weeks of each new Expo SDK | Plan the upgrade (`npx expo install expo@latest`, then `npx expo install --fix`); it clears the three advisories that need a major version |
| Next dated review | **25 November 2026** |

`@sentry/react-native` is pinned to the version Expo recommends for this SDK (`~7.11.0`). Upgrade it with the SDK.
