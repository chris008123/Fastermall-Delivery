import type { PartnerDocument } from '@/src/types/document';

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function daysAgo(days: number): string {
  return daysFromNow(-days);
}

/**
 * The demo partner (Kojo Mensah) is already approved, so every document
 * starts VERIFIED — except the driver's licence, deliberately set to
 * expire in 14 days so the Documents screen has a real EXPIRING_SOON case
 * to show, matching the "expires in 14 days → renew" pattern called out
 * in the UI research.
 */
export const mockDocuments: PartnerDocument[] = [
  {
    id: 'doc-ghana-card',
    type: 'GHANA_CARD',
    label: 'Ghana Card',
    status: 'VERIFIED',
    uploadedAt: daysAgo(210),
  },
  {
    id: 'doc-licence',
    type: 'DRIVERS_LICENCE',
    label: "Driver's Licence",
    status: 'EXPIRING_SOON',
    expiresAt: daysFromNow(14),
    uploadedAt: daysAgo(400),
  },
  {
    id: 'doc-vehicle-reg',
    type: 'VEHICLE_REGISTRATION',
    label: 'Vehicle Registration',
    status: 'VERIFIED',
    expiresAt: daysFromNow(68),
    uploadedAt: daysAgo(300),
  },
  {
    id: 'doc-selfie',
    type: 'SELFIE',
    label: 'Selfie Verification',
    status: 'VERIFIED',
    uploadedAt: daysAgo(210),
  },
];
