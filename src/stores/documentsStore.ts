import { create } from 'zustand';
import { mockDocuments } from '@/src/data/mockDocuments';
import type { PartnerDocument } from '@/src/types/document';

interface DocumentsState {
  documents: PartnerDocument[];
  /** Mock-only: no backend to actually receive an upload, so this just
   * flips the document to PENDING and, after a short delay, VERIFIED
   * with a fresh 2-year expiry — the same "flow is real, verification is
   * a stand-in" philosophy as the mock delivery handover code. */
  reuploadDocument: (id: string, fileUri?: string) => void;
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
  documents: mockDocuments,

  reuploadDocument: (id, fileUri) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id
          ? { ...doc, status: 'PENDING', uploadedAt: new Date().toISOString(), fileUri: fileUri ?? doc.fileUri }
          : doc
      ),
    }));

    setTimeout(() => {
      set((state) => ({
        documents: state.documents.map((doc) => {
          if (doc.id !== id) return doc;
          const hasExpiry = doc.expiresAt !== undefined;
          const nextExpiry = new Date();
          nextExpiry.setFullYear(nextExpiry.getFullYear() + 2);
          return {
            ...doc,
            status: 'VERIFIED',
            expiresAt: hasExpiry ? nextExpiry.toISOString() : undefined,
          };
        }),
      }));
    }, 1800);
  },
}));

/** Overall gate: a partner can go online only once every document is in a
 * healthy state — EXPIRED or REJECTED blocks it, EXPIRING_SOON doesn't
 * (there's still time), matching "a lapsed licence blocks new shifts,
 * not just a checked-once-at-signup status" from the research. */
export function selectVerificationSummary(documents: PartnerDocument[]) {
  const blocking = documents.filter((d) => d.status === 'EXPIRED' || d.status === 'REJECTED');
  const attention = documents.filter((d) => d.status === 'EXPIRING_SOON');
  const pending = documents.filter((d) => d.status === 'PENDING' || d.status === 'NOT_UPLOADED');

  const allVerified = documents.every((d) => d.status === 'VERIFIED' || d.status === 'EXPIRING_SOON');

  return {
    isFullyVerified: allVerified,
    isBlocked: blocking.length > 0,
    blockingCount: blocking.length,
    attentionCount: attention.length,
    pendingCount: pending.length,
  };
}
