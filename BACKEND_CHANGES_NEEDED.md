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

`GET /notifications` and `PATCH /notifications/:id/read` are also used (notifications list and mark-as-read).

Everything else in the app (wallet ledger, cash-out, documents, support, payout destination, demand map) runs on local mock data and has no endpoint yet.

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
- The app has two stages the backend does not know about: **PAY_VENDOR** and **DELIVERED** (the backend only has a status for the step before and after). The app now remembers these on the phone, so closing the app no longer loses them, but they are lost on a reinstall or a different phone, and support cannot see them. Add real statuses, or tell us how to store them.
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

## Added after the second app review (Section 11)

### 18. Saved preferences, and making them real
These settings are now saved on the phone only. They change nothing yet, and the app says so on each screen.
- `GET` and `PUT /logistics/me/preferences` for: notification choices (new jobs, job updates, payments, promotions, sound, vibration), delivery choices (auto-accept, pickup radius, maximum distance, job types) and navigation choices (preferred map app, avoid tolls and highways).
- **The backend must then act on them:** only offer jobs inside the partner's radius and chosen types, honour auto-accept, and respect quiet notification choices. Until it does, the app should keep showing them as "not active yet".
- Partner preferences should follow the account, not the phone, so they carry over to a new phone.

### 19. Partner location
Radius matching, the demand map and distance-to-pickup all need the partner's position, and the app does not collect it yet.
- `PUT /logistics/me/location` (latest position, with a timestamp), called only while the partner is online.
- The app will need a location permission and a privacy explanation before this goes live. Tell us how often you want updates (for example every 30 to 60 seconds while a job is active).
- Say how long positions are kept.

### 20. Partner profile edits
The profile screens (plate number, vehicle type, phone number, photo) save only on the phone.
- `PATCH /logistics/me` accepting `vehiclePlate`, `vehicleType` and `phone`, with validation errors in the standard format (item 13).
- `PUT /logistics/me/photo` for the profile photo.
- Decide which changes need re-verification by an admin (a new plate probably does).

### 21. Anything the app can show about "online"
`PATCH /logistics/me` for the online switch should return the saved state, and `GET /logistics/me` should include `lastSeenAt`. If the partner's phone dies while online, the backend should stop offering them jobs after a timeout (see item 16).

---

## Placeholders in the app that need real values
| Where | Placeholder |
|---|---|
| `src/config/contact.ts` | `support@fastermall.com` |
| Support screens | phone `0800000000` |
| `settings/privacy.tsx`, `settings/about.tsx` | `https://fastermall.com` as the legal base URL |

---

## Found in the backend code review (1 Nov 2026)

Read from `Fastermall-Backend-` at `main` @ `8cc6589`. These are concrete
problems in the current backend code, with the fix. R1 breaks a feature the
app already has (reporting a failed delivery).

### R1. Allow a partner to mark a delivery as FAILED — **required**

**Problem.** Commit `50e3567` restricted `PATCH /logistics/deliveries/:id/status`
to the `NEXT_STATUS` map, which only contains:

```
EN_ROUTE_TO_PICKUP → PICKED_UP
PICKED_UP          → EN_ROUTE_TO_CUSTOMER
```

The app's **"Can't complete this delivery?"** button sends `{ "status": "FAILED" }`,
so it now always gets `400 Cannot change a delivery from X to FAILED`.

**Fix** — `src/modules/logistics/logistics.service.ts`:

```ts
// A partner can give up on a delivery from any in-progress stage.
const FAILABLE_FROM: DeliveryStatus[] = [
  DeliveryStatus.EN_ROUTE_TO_PICKUP,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.EN_ROUTE_TO_CUSTOMER,
];
```

In `updateStatus`, replace the transition check:

```ts
// before
if (NEXT_STATUS[delivery.status] !== dto.status) {

// after
const isAllowedStep = NEXT_STATUS[delivery.status] === dto.status;
const isAllowedFailure =
  dto.status === DeliveryStatus.FAILED &&
  FAILABLE_FROM.includes(delivery.status);

if (!isAllowedStep && !isAllowedFailure) {
```

Leave `orderStatusMap` without a `FAILED` entry, so the order status is left
as-is for an admin to resolve (cancel/refund/re-dispatch). Consider emitting an
event (e.g. `delivery.failed`) so admins are notified.

**Tests** — add to `logistics.service.spec.ts`:
- FAILED is accepted from EN_ROUTE_TO_PICKUP, PICKED_UP, EN_ROUTE_TO_CUSTOMER.
- FAILED is rejected from ASSIGNED, DELIVERED and FAILED.
- A partner not assigned to the delivery still gets rejected.

#### R1b. (Optional, recommended) Store the failure reason

The app asks the partner why (`CUSTOMER_NOT_ANSWERING`, `WRONG_ADDRESS`,
`CUSTOMER_REFUSED`, `VEHICLE_PROBLEM`, `VENDOR_ISSUE`, `OTHER`) but can't send
it: the global `ValidationPipe` uses `forbidNonWhitelisted: true`, so an extra
`reason` field would be rejected with 400.

`prisma/schema.prisma`:

```prisma
enum DeliveryFailureReason {
  CUSTOMER_NOT_ANSWERING
  WRONG_ADDRESS
  CUSTOMER_REFUSED
  VEHICLE_PROBLEM
  VENDOR_ISSUE
  OTHER
}

model Delivery {
  // ...existing fields
  failureReason DeliveryFailureReason?
  failedAt      DateTime?
}
```

`dto/update-delivery-status.dto.ts`:

```ts
import { IsEnum, IsOptional } from 'class-validator';
import { DeliveryFailureReason, DeliveryStatus } from '@prisma/client';

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @IsOptional()
  @IsEnum(DeliveryFailureReason)
  reason?: DeliveryFailureReason;
}
```

In `updateStatus`, when `dto.status === FAILED`, also set
`failureReason: dto.reason ?? 'OTHER'` and `failedAt: new Date()` in the
`updateMany` data. Then run `npx prisma migrate dev --name add_delivery_failure_reason`.

> **Order of deploys:** ship this backend change first. Only then update the
> app's `failJob` in `src/stores/jobsStore.ts` to send `{ status: 'FAILED', reason }`.
> Sending `reason` to the current backend causes a 400.

---

### R2. Decide how admins handle Marketplace and Laundry deliveries — **decision needed**

**Problem.** After commit `62657e8`, admins can *see* Marketplace and Laundry
deliveries in `GET /logistics/deliveries/unassigned`. But `claim`, `updateStatus`
and `verifyDeliveryCode` all look up a `DeliveryPartnerProfile` for the caller
and throw `404 You are not registered as a delivery partner` if there isn't one.
A normal admin account has no such profile, so admins can't move these
deliveries forward at all.

**Options (pick one):**

- **A. Admin endpoints (recommended).** Add admin-only routes, e.g.
  - `PATCH /admin/deliveries/:id/status` — set any status without the partner
    ownership check (still record a `DeliveryStatusEvent`, update the order, and
    emit `delivery.status.updated`).
  - `POST /admin/deliveries/:id/assign` — `{ partnerId }` to assign a specific
    partner (e.g. an in-house courier) to a Marketplace or Laundry delivery.
- **B. Give admin accounts a `DeliveryPartnerProfile`** so the existing
  endpoints work for them. Quicker, but mixes up admin and courier records and
  their earnings.

If admins use the existing `updateStatus` with a partner profile, note that the
`claim` role check is skipped only for `role === ADMIN` — that's correct as written.

---

### R3. Delivery earning is hard-coded to GH₵15 — **confirm intent**

`verifyDeliveryCode` always creates:

```ts
await tx.driverEarning.create({
  data: { partnerId: delivery.partnerId, amount: 15, note: `Delivery ${deliveryId}` },
});
```

The app shows `order.deliveryFee` as the job's fare on the job list, job detail
and completion screen, so the partner sees one number and is paid another.
Either:

- pay from the order: `amount: delivery.order?.deliveryFee ?? 15` (include
  `deliveryFee` in the `order` select at the top of `verifyDeliveryCode`), or
- keep the flat rate, and the app will stop showing `deliveryFee` as "your earning".

Also store the delivery ID in a proper column (e.g. `deliveryId String? @unique`
on `DriverEarning`) instead of matching on the `note` text — it makes the
duplicate check reliable and lets the app link an earning to its job.

---

### R4. Data the app displays but the backend doesn't send yet — **nice to have**

| App field | Where it's shown | Suggested backend source |
|---|---|---|
| `vendorPayoutAmount` | FOOD "Pay the vendor" step, job detail, "Reimbursed to you" | Food subtotal = Σ `OrderItem.unitPrice × quantity` (or `totalAmount − deliveryFee`). Return it on delivery responses, e.g. `order.vendorPayoutAmount`. |
| Reimbursement ledger entries | Wallet "already reimbursed" total | When a FOOD delivery is verified, record the vendor amount as a separate earning type (add `type EARNING \| REIMBURSEMENT` to `DriverEarning`). |
| Customer `rating` | Completion screen, profile rating | Customer app endpoint to rate a delivered order; return the rating on `/logistics/me/deliveries`. |
| Cash out | Wallet "Cash out" / "Instant cash out" | `POST /logistics/me/withdrawals` (balance ≥ GH₵50 threshold), recorded as a negative entry. Currently the app only adds a local entry. |
| Pickup/drop-off coordinates | External navigation (Google Maps/Waze) | `pickupLat/Lng`, `dropoffLat/Lng` already exist on `Delivery` — populate them when the order is created. The app currently searches by address label instead. |

---

### R5. Support tickets don't work for staff accounts — **needed for in-app support**

`POST /support/tickets` and `GET /support/tickets` are open to any logged-in
user, but `SupportTicket.userId` is a foreign key to **`User`** (customers).
A partner's token carries a `StaffUser` id, so creating a ticket fails on the
foreign key (500) and listing returns nothing. The app's support chat stays
mocked until this is fixed.

`prisma/schema.prisma`:

```prisma
model SupportTicket {
  id          String       @id @default(uuid())
  userId      String?
  staffUserId String?
  // ...existing fields
  user        User?        @relation(fields: [userId], references: [id])
  staffUser   StaffUser?   @relation(fields: [staffUserId], references: [id])
}
```

(`StaffUser` also needs `supportTickets SupportTicket[]`.) Then in
`support.controller.ts` / `support.service.ts`, pass the caller's role and use
`staffUserId` when the caller is staff, `userId` otherwise — the same
owner-switch `NotificationsService.ownerWhere()` already does.

---

### Contract notes (no change needed — keep these stable)

- Every response is wrapped as `{ success: true, data: ... }` by
  `ResponseInterceptor`. The app now unwraps this for all endpoints it uses.
- The app decides a delivery is Food from **`order.type === 'FOOD'`**. Keep
  `order.type` in the `unassigned`, `me/deliveries`, `claim` and `status`
  responses — if it disappears, partners see an empty jobs list.
- `claim` moves a delivery straight to `EN_ROUTE_TO_PICKUP`; the app expects that.
- `/staff/me` must keep including `deliveryProfile` (the app reads `type`,
  `isAvailable`, `vehiclePlate`, `id` from it).
