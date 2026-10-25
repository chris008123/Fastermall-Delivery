# Release checklist

Work through this before every store release. Tick it in the pull request.

## Before building
- [ ] `main` is green in CI (typecheck, lint, tests).
- [ ] `npm audit` reviewed: nothing new that ships inside the app. Known items and reasons are in `docs/DEPENDENCY_NOTES.md`.
- [ ] No secrets in the repo: `git ls-files | Select-String -Pattern '\.env|\.jks|\.keystore|\.p8|\.p12|\.pem|\.key|mobileprovision|credentials\.json'` prints nothing.
- [ ] `eas.json` production profile points `EXPO_PUBLIC_API_URL` at the production API (https).
- [ ] App version and name are right in `app.json`; `autoIncrement` is on for the build number.
- [ ] Placeholders replaced: support email (`src/config/contact.ts`), support phone in the support screens, legal links.
- [ ] Crash reporting is set up: `EXPO_PUBLIC_SENTRY_DSN` is set for the production profile (as an EAS environment variable), and `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are set as EAS secrets so readable stack traces are uploaded. Without the token the build still works, but crash reports show minified code.
- [ ] The backend items marked P1 in `BACKEND_CHANGES_NEEDED.md` are live (account deletion, logout, refresh/401 behaviour, handover-code limits), or you have decided to ship without them.

## Build and test
- [ ] `eas build -p android --profile production` (and iOS) succeeds.
- [ ] Install the build on a real phone and run `docs/DEVICE_TEST_CHECKLIST.md`.
- [ ] Compare the Android download size with the previous release. Note it below.
- [ ] Sign in, go online, accept a job, run it to handover with a real code, and check the wallet.
- [ ] Open the app with the phone in airplane mode: it stays signed in and shows the offline banner.
- [ ] Crash reporting works: with the production build, trigger a test error (ask for a one-line temporary test) and check it appears in Sentry with a readable stack trace, the account id only, and no email, token or phone number.
- [ ] Sign out and sign in as a different account: nothing from the first account is visible.

## Store
- [ ] Privacy policy and terms pages are live at the addresses the app links to.
- [ ] Store listing data-safety / privacy answers match `docs/DATA_NOTES.md`, including crash logs.
- [ ] Release notes written (what changed for partners, in plain words).
- [ ] Account deletion route in place (Apple and Google both ask for one).

## After release
- [ ] Watch crash and error reports for the first 24 hours (once crash reporting exists).
- [ ] Keep the build number, date and commit in the table below.

| Version | Build | Date | Commit | Android size | Notes |
|---|---|---|---|---|---|
| | | | | | |
