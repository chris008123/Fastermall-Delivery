# What the app keeps and sends (draft for legal review)

Written from the code, as a starting point for the privacy policy, the store "data safety" form and the retention rules. It describes the app only. What the backend stores is for the backend team to add.

## Kept on the phone
| What | Where | Removed on sign-out |
|---|---|---|
| Sign-in token | Secure storage (keychain / keystore) | Yes |
| Payout destination (network and number) | Secure storage | Yes |
| Which two app-only delivery steps a job is in | App storage | Yes |
| Job list, profile, wallet, notifications, documents (in memory) | Memory only | Yes |
| Theme, navigation app and style, notification and delivery preferences, "unread only" filter | App storage | No (these are device settings) |

## Sent to the backend
Email and password at sign-in; the token on every request; the online/offline switch; accepting a job, each delivery step and the customer's 6-digit handover code; a failed-delivery reason. Photos for documents are not uploaded yet (that screen uses mock data).

## Crash and error reports (Sentry), only when a DSN is configured
When the app crashes, or the backend answers with a 5xx error, a report is sent to Sentry so the bug can be fixed. A report contains: the error and where in the code it happened, the app version and build type, the phone model and operating system version, and the partner's **account id** (nothing else about them). The report is cleaned on the phone before it is sent: email addresses and long numbers (phone numbers, codes) are replaced, query strings are cut from web addresses, and request headers, request bodies and anything named like a password, token, code, email or phone are removed (see `src/utils/scrub.ts`, covered by tests). No screenshots, no location, no advertising id.

For the store forms this counts as **crash logs / diagnostics**, linked to the account id. Add it to the privacy policy and to the Google Play data-safety and App Store privacy answers. Decide how long Sentry keeps events (its project setting) and write the period here.

## Not collected
Location (the app does not ask for it), contacts, advertising identifiers, usage analytics. This changes when partner location or push notifications are added; update this file and the store forms when it does.

## Permissions requested
Camera and photo library, only when the partner adds a document.

## To decide (with legal and the backend team)
- How long job, earnings and payout records are kept after an account is deleted, and what is legally required.
- What account deletion removes and what it keeps (see `BACKEND_CHANGES_NEEDED.md`, item 1).
- Retention for support conversations and uploaded documents.
- Whether delivery positions are stored once location is added, and for how long.
