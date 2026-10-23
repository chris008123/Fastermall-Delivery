export type DocumentType = 'GHANA_CARD' | 'DRIVERS_LICENCE' | 'VEHICLE_REGISTRATION' | 'SELFIE';

/**
 * NOT_UPLOADED / PENDING only happen mid-onboarding or right after a
 * re-upload (mocked here as a short timeout before flipping to VERIFIED —
 * in the real app this is a backend review queue). EXPIRING_SOON is
 * derived from `expiresAt` rather than being a status the backend sets
 * directly, so it stays in sync whenever "today" moves.
 */
export type DocumentStatus =
  | 'NOT_UPLOADED'
  | 'PENDING'
  | 'VERIFIED'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'REJECTED';

export interface PartnerDocument {
  id: string;
  type: DocumentType;
  label: string;
  status: DocumentStatus;
  /** ISO date. Selfie/ID docs without a hard expiry (e.g. Ghana Card) omit this. */
  expiresAt?: string;
  uploadedAt?: string;
  rejectionReason?: string;
  /** Local photo the partner attached on the last upload. */
  fileUri?: string;
}
