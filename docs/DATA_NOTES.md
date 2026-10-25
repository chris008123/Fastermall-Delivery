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

## Not collected
Location (the app does not ask for it), contacts, advertising identifiers, analytics, crash reports. This changes when partner location, push notifications or crash reporting are added; update this file and the store forms when it does.

## Permissions requested
Camera and photo library, only when the partner adds a document.

## To decide (with legal and the backend team)
- How long job, earnings and payout records are kept after an account is deleted, and what is legally required.
- What account deletion removes and what it keeps (see `BACKEND_CHANGES_NEEDED.md`, item 1).
- Retention for support conversations and uploaded documents.
- Whether delivery positions are stored once location is added, and for how long.
