/** The backend's document types (prisma DocumentType). */
export type DocumentType = 'ID_CARD' | 'PROFILE_PHOTO' | 'DRIVERS_LICENSE' | 'VEHICLE_REGISTRATION' | 'INSURANCE';

/**
 * How a document shows in the app. The backend stores UPLOADING / PENDING /
 * APPROVED / REJECTED; NOT_UPLOADED means nothing usable was sent for a
 * required type, and EXPIRING_SOON / EXPIRED are worked out from an approved
 * document's `expiresAt`, so they stay right as days pass.
 */
export type DocumentStatus =
  | 'NOT_UPLOADED'
  | 'PENDING'
  | 'VERIFIED'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'REJECTED';

export interface PartnerDocument {
  /** Server id, or `missing-<type>` for a required document not uploaded yet. */
  id: string;
  type: DocumentType;
  label: string;
  status: DocumentStatus;
  /** Whether this partner must have it approved to take jobs. */
  required: boolean;
  /** ISO date, for documents that expire. */
  expiresAt?: string;
  uploadedAt?: string;
  rejectionReason?: string;
  /** Local photo picked on this phone for the last upload (not from the server). */
  fileUri?: string;
}
