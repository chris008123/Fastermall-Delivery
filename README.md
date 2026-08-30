# Fastermall Partner

Delivery-partner companion app for Fastermall (Marketplace, Food, Laundry).
Frontend-only for now — screens run on mock in-memory data (`src/data`,
`src/stores`) so the Pickup & Handover flow and wallet/ledger can be reviewed
and iterated on before the backend contract is finalized.

## Run it

```
npm install
npx expo start
```

## What's here

- `app/(partner)/index.tsx` — dashboard: availability toggle, active job, wallet snapshot
- `app/(partner)/jobs/` — browse and accept available jobs
- `app/(partner)/active/[id].tsx` — the Pickup & Handover flow for an accepted job
- `app/(partner)/wallet/` — earnings + reimbursement ledger, GH₵50 cash-out threshold
- `src/theme/` — ported from the customer app so both apps share one visual identity

## Notes on what's mocked vs real

- **Auth** (`app/(auth)/login.tsx`) accepts any valid-shaped phone + password — there's no backend to check credentials against yet.
- **Live map** (`src/shared/components/DeliveryMap.tsx`) uses `react-native-maps` with mock coordinates around KNUST campus, and derives the partner's on-map position from `job.stage` rather than real GPS — see `src/utils/geo.ts`.
  - `react-native-maps` needs a development build, not plain Expo Go — run `npx expo run:ios` / `npx expo run:android` (or an EAS dev client) to see the map render.
  - Android also needs a Google Maps API key added under `expo.android.config.googleMaps.apiKey` in `app.json` before the map will show anything on that platform.
- **Notifications** are seeded mock data plus whatever the mock delivery flow generates (e.g. completing a delivery adds a payment notification) — no push notifications are wired up.
- **Delivery handover code** accepts any 4 digits typed in — there's no real code to check it against yet.
