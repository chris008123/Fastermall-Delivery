import { create } from 'zustand';
import { fetchDocuments, uploadDocument } from '@/src/services/documents';
import type { DocumentType, PartnerDocument } from '@/src/types/document';

interface DocumentsState {
  documents: PartnerDocument[];
  /** The server's own verdict: every required document approved and current. */
  serverVerified: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
  /** Loads the partner's documents from the server. */
  load: () => Promise<void>;
  /**
   * Uploads a photo as a new document of this type and reloads. Throws with a
   * readable message so the screen can show it.
   */
  upload: (type: DocumentType, fileUri: string) => Promise<void>;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  serverVerified: false,
  status: 'idle',

  load: async () => {
    set({ status: get().documents.length ? 'ready' : 'loading', error: undefined });
    try {
      const { documents, verified } = await fetchDocuments();
      set({ documents, serverVerified: verified, status: 'ready' });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Unable to load your documents.' });
    }
  },

  upload: async (type, fileUri) => {
    await uploadDocument(type, fileUri);
    await get().load();
    // Show the picked photo on this phone until the screen is left.
    set((s) => ({ documents: s.documents.map((d) => (d.type === type ? { ...d, fileUri } : d)) }));
  },
}));

/**
 * Overall gate: a partner can go online only once every required document is
 * healthy. EXPIRED or REJECTED blocks it; EXPIRING_SOON doesn't (there's still
 * time). Nothing loaded yet is not "verified".
 */
export function selectVerificationSummary(documents: PartnerDocument[]) {
  const required = documents.filter((d) => d.required);
  const blocking = required.filter((d) => d.status === 'EXPIRED' || d.status === 'REJECTED');
  const attention = required.filter((d) => d.status === 'EXPIRING_SOON');
  const pending = required.filter((d) => d.status === 'PENDING' || d.status === 'NOT_UPLOADED');

  const allVerified =
    required.length > 0 && required.every((d) => d.status === 'VERIFIED' || d.status === 'EXPIRING_SOON');

  return {
    isFullyVerified: allVerified,
    isBlocked: blocking.length > 0,
    blockingCount: blocking.length,
    attentionCount: attention.length,
    pendingCount: pending.length,
  };
}
