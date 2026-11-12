/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
const mockApiFetch = jest.fn();
jest.mock('@/src/services/api', () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

import { contentTypeFor, toPartnerDocuments, uploadDocument } from '@/src/services/documents';
import { selectVerificationSummary } from '@/src/stores/documentsStore';

const now = new Date('2026-11-12T12:00:00Z');
const day = 24 * 60 * 60 * 1000;
const iso = (offsetDays: number) => new Date(now.getTime() + offsetDays * day).toISOString();

describe('toPartnerDocuments', () => {
  it('lists required types, marking missing ones Not uploaded', () => {
    const { documents, verified } = toPartnerDocuments(
      { items: [], verification: { status: 'INCOMPLETE', required: ['ID_CARD', 'PROFILE_PHOTO'] } },
      now,
    );
    expect(documents.map((d) => [d.type, d.status, d.required])).toEqual([
      ['ID_CARD', 'NOT_UPLOADED', true],
      ['PROFILE_PHOTO', 'NOT_UPLOADED', true],
    ]);
    expect(verified).toBe(false);
  });

  it('uses the newest upload of each type and works out expiry', () => {
    const { documents } = toPartnerDocuments(
      {
        success: true,
        data: {
          items: [
            { id: 'old', type: 'DRIVERS_LICENSE', status: 'APPROVED', expiresAt: iso(-3), createdAt: iso(-400) },
            { id: 'new', type: 'DRIVERS_LICENSE', status: 'PENDING', createdAt: iso(-1) },
            { id: 'id', type: 'ID_CARD', status: 'APPROVED', expiresAt: iso(10), createdAt: iso(-200) },
            { id: 'ins', type: 'INSURANCE', status: 'APPROVED', expiresAt: iso(-1), createdAt: iso(-300) },
            { id: 'pic', type: 'PROFILE_PHOTO', status: 'REJECTED', rejectionReason: 'Blurry', createdAt: iso(-2) },
            { id: 'veh', type: 'VEHICLE_REGISTRATION', status: 'APPROVED', expiresAt: iso(90), createdAt: iso(-50) },
          ],
          verification: { status: 'INCOMPLETE', required: ['ID_CARD', 'PROFILE_PHOTO', 'DRIVERS_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE'] },
        },
      },
      now,
    );
    const byType = Object.fromEntries(documents.map((d) => [d.type, d]));
    expect(byType.DRIVERS_LICENSE).toMatchObject({ id: 'new', status: 'PENDING' });
    expect(byType.ID_CARD.status).toBe('EXPIRING_SOON');
    expect(byType.INSURANCE.status).toBe('EXPIRED');
    expect(byType.PROFILE_PHOTO).toMatchObject({ status: 'REJECTED', rejectionReason: 'Blurry' });
    expect(byType.VEHICLE_REGISTRATION.status).toBe('VERIFIED');
  });

  it('treats an unfinished upload as not uploaded', () => {
    const { documents } = toPartnerDocuments(
      { items: [{ id: 'u', type: 'ID_CARD', status: 'UPLOADING', createdAt: iso(0) }], verification: { required: ['ID_CARD'] } },
      now,
    );
    expect(documents[0].status).toBe('NOT_UPLOADED');
  });
});

describe('selectVerificationSummary', () => {
  it('is not verified before anything has loaded', () => {
    expect(selectVerificationSummary([]).isFullyVerified).toBe(false);
  });
});

describe('uploadDocument', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    mockApiFetch.mockReset();
  });

  it('asks for an upload URL, sends the file there, then completes', async () => {
    const blob = { type: 'image/jpeg', size: 1234 };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ blob: async () => blob }) // reading the local file
      .mockResolvedValueOnce({ ok: true }); // PUT to storage
    globalThis.fetch = fetchMock as never;
    mockApiFetch
      .mockResolvedValueOnce({ document: { id: 'doc-1' }, upload: { url: 'https://storage/signed?token=t' } })
      .mockResolvedValueOnce({ id: 'doc-1', status: 'PENDING' });

    await uploadDocument('ID_CARD', 'file:///photo.jpg');

    expect(JSON.parse(mockApiFetch.mock.calls[0][1].body)).toEqual({ type: 'ID_CARD', contentType: 'image/jpeg', sizeBytes: 1234 });
    expect(fetchMock.mock.calls[1][0]).toBe('https://storage/signed?token=t');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: blob });
    expect(mockApiFetch.mock.calls[1][0]).toBe('/logistics/me/documents/doc-1/complete');
  });

  it('stops before the server if the storage upload fails', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({ blob: async () => ({ type: 'image/png', size: 10 }) }).mockResolvedValueOnce({ ok: false }) as never;
    mockApiFetch.mockResolvedValueOnce({ document: { id: 'doc-2' }, upload: { url: 'https://storage/x' } });
    await expect(uploadDocument('PROFILE_PHOTO', 'file:///a.png')).rejects.toThrow(/didn.t go through/);
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });
});

describe('contentTypeFor', () => {
  it('trusts a known reported type, else the extension', () => {
    expect(contentTypeFor('file:///x', 'image/webp')).toBe('image/webp');
    expect(contentTypeFor('file:///scan.PDF', '')).toBe('application/pdf');
    expect(contentTypeFor('file:///x.heic', 'image/heic')).toBeNull();
  });
});
