# Fastermall Partner

Delivery-partner app for Fastermall food deliveries (Expo, React Native, TypeScript).

## Run it

```
npm install
npx expo start
```

Some features need a development build instead of Expo Go (secure storage, network status). Use `eas build --profile development` or `npx expo run:android` / `run:ios`.

## Checks

```
npm run typecheck   # TypeScript
npm run lint        # ESLint (errors fail CI; a few warnings are known)
npm test            # Jest unit tests
```

The same three run on every push and pull request (`.github/workflows/ci.yml`).

## Configuration

The API address comes from `EXPO_PUBLIC_API_URL`. EAS builds read it from the build profile in `eas.json`; for local work copy `.env.example` to `.env`. It must be `https://` (plain `http://` is allowed only in development). Everything starting with `EXPO_PUBLIC_` is baked into the app, so never put a secret in it.

Crash reporting (Sentry) is off unless `EXPO_PUBLIC_SENTRY_DSN` is set, and it is always off in development. Reports are cleaned of personal details on the phone first (`src/utils/scrub.ts`). To upload readable stack traces from EAS builds, set `SENTRY_AUTH_TOKEN` (a secret), `SENTRY_ORG` and `SENTRY_PROJECT`. See `docs/DATA_NOTES.md` for what a report contains.

## What is real and what is not

| Area | State |
|---|---|
| Sign-in, session, profile, online switch | Real (backend) |
| Job list, accepting, stages, handover code | Real (backend). Two steps, paying the vendor and typing the customer's code, exist only in the app and are remembered on the phone |
| Wallet and cash-out, notifications, documents, support, demand | Mock data |
| Payout destination | Saved on the phone only |
| Delivery, navigation and notification preferences | Saved on the phone; they do not change behaviour yet (the screens say so) |
| Push notifications, partner location, live map | Not built. The map component is saved in `docs/maps/` |
| Account deletion | A request to support by email; no in-app deletion yet |

What the backend still has to provide is in `BACKEND_CHANGES_NEEDED.md`.

## Where things are

- `app/` — screens (Expo Router): `(auth)`, `(partner)`
- `src/stores/` — app state (zustand). Anything tied to one partner's account must be cleared in `src/stores/sessionReset.ts`
- `src/services/api.ts` — the API client (30 second timeout, ends the session on a 401)
- `src/utils/` — small pure helpers, all covered by tests in `__tests__/`
- `src/theme/` — colours, spacing, motion
- `docs/` — release checklist, device test checklist, data notes, map restore steps
