import { apiFetch } from '@/src/services/api';
import type { DocumentStatus, DocumentType, PartnerDocument } from '@/src/types/document';

// The partner's verification documents (Fastermall-Backend documents.controller):
//   GET  /logistics/me/documents                 → { items, verification }
//   POST /logistics/me/documents                 { type, contentType, sizeBytes, expiresAt? }
//        → { document, upload: { url } }         (step 1: a signed upload URL)
//   PUT  <upload.url> with the file                (step 2: straight to storage)
//   POST /logistics/me/documents/:id/complete    (step 3: the server checks the file)
// An admin then approves or rejects it.

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  ID_CARD: 'Ghana Card',
  PROFILE_PHOTO: 'Selfie',
  DRIVERS_LICENSE: 'Driver’s licence',
  VEHICLE_REGISTRATION: 'Vehicle registration',
  INSURANCE: 'Insurance',
};

const ORDER: DocumentType[] = ['ID_CARD', 'PROFILE_PHOTO', 'DRIVERS_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE'];
const EXPIRING_SOON_DAYS = 30; // same as the backend
const DAY = 24 * 60 * 60 * 1000;

type ServerStatus = 'UPLOADING' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';

type ServerDocument = {
  id: string;
  type: DocumentType;
  status: ServerStatus;
  expiresAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
};

type ListResponse = {
  items?: ServerDocument[];
  verification?: { status?: string; required?: DocumentType[] };
};

const unwrap = <T,>(raw: unknown): T =>
  (raw && typeof raw === 'object' && 'data' in raw && 'success' in raw ? (raw as { data: T }).data : raw) as T;

function appStatus(d: ServerDocument, now: Date): DocumentStatus {
  if (d.status === 'PENDING') return 'PENDING';
  if (d.status === 'REJECTED') return 'REJECTED';
  if (d.status !== 'APPROVED') return 'NOT_UPLOADED'; // an upload that never finished
  if (!d.expiresAt) return 'VERIFIED';
  const left = new Date(d.expiresAt).getTime() - now.getTime();
  if (left <= 0) return 'EXPIRED';
  return left <= EXPIRING_SOON_DAYS * DAY ? 'EXPIRING_SOON' : 'VERIFIED';
}

/**
 * One row per document type: the newest upload of each type, plus a "Not
 * uploaded" row for every required type with none. Exported for tests.
 */
export function toPartnerDocuments(raw: unknown, now: Date = new Date()): { documents: PartnerDocument[]; verified: boolean } {
  const body = unwrap<ListResponse>(raw) ?? {};
  const items = [...(body.items ?? [])]
    .filter((d) => d.status !== 'SUPERSEDED' && ORDER.includes(d.type))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const required = new Set(body.verification?.required ?? []);
  const types = ORDER.filter((t) => required.has(t) || items.some((d) => d.type === t));

  const documents = types.map((type): PartnerDocument => {
    const latest = items.find((d) => d.type === type);
    if (!latest) {
      return { id: `missing-${type}`, type, label: DOCUMENT_LABELS[type], status: 'NOT_UPLOADED', required: true };
    }
    return {
      id: latest.id,
      type,
      label: DOCUMENT_LABELS[type],
      status: appStatus(latest, now),
      required: required.has(type),
      expiresAt: latest.expiresAt ?? undefined,
      uploadedAt: latest.createdAt,
      rejectionReason: latest.rejectionReason ?? undefined,
    };
  });
  return { documents, verified: body.verification?.status === 'VERIFIED' };
}

export async function fetchDocuments() {
  return toPartnerDocuments(await apiFetch<unknown>('/logistics/me/documents'));
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/** The upload's content type: what the file says, else its extension. Exported for tests. */
export function contentTypeFor(uri: string, reported?: string): string | null {
  if (reported && ALLOWED.includes(reported)) return reported;
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  const byExt: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' };
  return (ext && byExt[ext]) || null;
}

/** Uploads a picked photo as a new document of `type`; it then waits for review. */
export async function uploadDocument(type: DocumentType, fileUri: string, expiresAt?: string): Promise<void> {
  const file = await (await fetch(fileUri)).blob();
  const contentType = contentTypeFor(fileUri, file.type);
  if (!contentType) throw new Error('Use a JPEG, PNG or WebP photo, or a PDF.');

  const started = unwrap<{ document: { id: string }; upload: { url: string } }>(
    await apiFetch<unknown>('/logistics/me/documents', {
      method: 'POST',
      body: JSON.stringify({ type, contentType, sizeBytes: file.size, ...(expiresAt ? { expiresAt } : {}) }),
    }),
  );

  const put = await fetch(started.upload.url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'x-upsert': 'false' },
    body: file,
  });
  if (!put.ok) throw new Error('The upload didn’t go through. Check your connection and try again.');

  await apiFetch(`/logistics/me/documents/${encodeURIComponent(started.document.id)}/complete`, { method: 'POST' });
}
