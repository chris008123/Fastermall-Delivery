# Backend changes needed for the Fastermall Partner app

What the partner app needs from the backend, in priority order. Written from the app's current code (24 Oct 2026).

**Endpoints the app uses today**

| Endpoint | Used for |
|---|---|
| `POST /staff/login` | Sign in (email, password) |
| `GET /staff/me` | Load the signed-in account and check the role is `DELIVERY_PARTNER` |
| `GET /logistics/me` / `PATCH /logistics/me` | Partner profile and online/offline toggle |
| `GET /logistics/deliveries/unassigned` | Jobs available to accept |
| `GET /logistics/me/deliveries` | The partner's own jobs and history |
| `GET /logistics/me/earnings` | Earnings figures |
| accept / advance-stage calls under `/logistics/deliveries/:id/...` | Accepting a job and moving it through its stages |

Everything else in the app (wallet ledger, cash-out, notifications, documents, support, payout destination, demand map) runs on local mock data and has no endpoint yet.

---

## P1: needed before a store release

### 1. Account deletion and data export
The app can only email support for now (Settings > Privacy & data). Apple and Google both expect deletion to be started inside the app.
- `DELETE /staff/me` (or `POST /staff/me/deletion-request`) that starts deletion for the signed-in partner. Return a status the app can show, for example `{ status: "PENDING", completesBy: "<date>" }`.
- Decide and document what is kept and for how long (completed deliveries, payouts and financial records usually have legal retention). The app's wording says some records "may have to be kept"; legal should confirm it.
- Revoke every session and device token for the account when deletion completes.
- `POST /staff/me/data-export`: emails or returns a copy of the partner's data.

### 2. Sessions: expiry, logout and refresh
The app now signs the partner out on **any 401** from a signed-in request, and treats 401 or 403 from `GET /staff/me` as an ended session.
- **Return 401 only for a missing, invalid or expired token.** Use **403** for "you are signed in but not allowed to do this". Mixing them up will sign partners out by mistake.
- `POST /staff/logout` that invalidates the access token server-side (the app currently just deletes its copy).
- Preferred: short-lived access token plus `POST /staff/refresh`, so partners are not signed out mid-shift. The app's 401 handler (`authStore.expireSession`) is the place to use it.
- Say how long a token lives.

### 3. Login protection and password recovery
- Rate-limit and lock out repeated failed logins per account and per IP. Return `429` with `Retry-After`.
- Same generic message for "unknown email" and "wrong password".
- `POST /staff/password/forgot` and `POST /staff/password/reset`, plus `POST /staff/password/change` (the Security screen's "Change password / PIN" is not connected).
- Two-factor authentication and trusted devices: the Security screen now says "Not available yet" for both. Tell us if and when to build them.

### 4. Enforce the rules on the server, not only in the app
The app checks these, but anyone can call the API directly.
- Only `DELIVERY_PARTNER` accounts may use `/logistics/*`.
- A partner can read and advance **only jobs assigned to them**.
- Stage changes must follow the allowed order; reject skips and repeats.
- **Handover code:** verify the 6-digit code on the server, and limit attempts (for example 5, then lock that job for a few minutes). A 6-digit code can be guessed in a short time without a limit.
- Accepting a job that was just taken must return **409 Conflict** with a clear message, so the app can show "already taken".

### 5. Idempotency for actions that change money or job state
Accept job, advance stage and cash-out must be safe to repeat. Accept an `Idempotency-Key` header and return the original result if the same key is sent again. This lets the app retry safely after a timeout (it does not retry automatically yet).

---

## P2: needed so the app stops using mock data

### 6. Job stages and the timeline
- The app has two stages the backend does not know about: **PAY_VENDOR** and **DELIVERED** (the backend only has a status for the step before and after). If the app is closed during PAY_VENDOR, the stage is lost. Add real statuses, or tell us how to store them.
- Return a **stage history** on each job: `[{ "stage": "PICKED_UP", "at": "2026-10-24T14:14:00Z" }, ...]`. The timeline can then show when each step happened (useful in disputes).
- Add `?status=` filtering and **cursor pagination** to `GET /logistics/me/deliveries`.
- Add `updatedSince=` or `ETag` support to both delivery lists. The app refreshes every 30 seconds, and this would make most refreshes empty and cheap.

### 7. Payout destination
Currently kept on the phone only.
- `GET`, `PUT` and `DELETE /logistics/me/payout-destination` with `{ network, number }` (return the number masked).
- Require the password (or an OTP) to change it.
- Optionally verify the account name with the network before saving.

### 8. Wallet and cash-out
- Ledger endpoint with pagination: entries, type, amount, status, date.
- `POST /logistics/me/cash-out` with an idempotency key, returning a status (`PENDING`, `PAID`, `FAILED`) and any fee.
- **Send money as integer pesewas (or decimal strings) with a currency code, not floating-point numbers.**

### 9. Notifications and push
- `GET /notifications` with read state, `PATCH /notifications/:id` (read or unread), `DELETE /notifications/:id`, and "mark all read".
- Register the phone for push: `POST /devices` with the Expo push token; remove it on logout. Without this the app cannot alert a partner to a new job while it is closed.
- New-job push payload, for example `{ "type": "JOB_AVAILABLE", "jobId": "..." }`, so tapping opens the job.
- `GET` and `PUT /staff/me/notification-preferences` (the settings are local and reset on restart).

### 10. Documents and verification
- Upload endpoint (multipart or signed URLs) with size and type limits, and virus scanning.
- Status per document (`PENDING`, `APPROVED`, `REJECTED` with a reason) and expiry dates.

### 11. Support
- Ticket or chat endpoints, with the job reference attached.
- Real support phone and email (the app has placeholders).

### 12. Demand map
Only if you want it live: an endpoint returning zones with demand level.

---

## P3: platform and quality

### 13. A consistent error format
Every error should look the same, with a stable `code` the app can rely on:
```json
{ "success": false, "message": "Readable text", "code": "JOB_ALREADY_TAKEN",
  "errors": [{ "field": "number", "message": "Must be 10 digits" }] }
```
Echo an `X-Request-Id` header on every response, so a partner can quote it to support and logs can be matched.

### 14. App config endpoint
`GET /app/config` returning the minimum supported app version (to force an update), a maintenance flag, support phone and email, and the privacy and terms URLs. Today they are hard-coded in the app.

### 15. Environments and hosting
- A **staging** API separate from production (the app currently has one hard-coded URL; a per-environment setting will be added).
- If the API runs on a free tier that sleeps, the first request after idle can take 30 seconds or more. The app waits up to 30 seconds. Always-on hosting, or a scheduled ping, avoids partners seeing "took too long".
- HTTPS only.

### 16. Availability toggle
`PATCH /logistics/me` should return the new state. Consider automatic offline after a period without a heartbeat, so partners are not shown as online when their phone is off.

### 17. Content to publish
Privacy policy and terms at `/privacy` and `/terms` on the domain the app links to (`https://fastermall.com`, currently a placeholder).

---

## Placeholders in the app that need real values
| Where | Placeholder |
|---|---|
| `src/config/contact.ts` | `support@fastermall.com` |
| Support screens | phone `0800000000` |
| `settings/privacy.tsx`, `settings/about.tsx` | `https://fastermall.com` as the legal base URL |
