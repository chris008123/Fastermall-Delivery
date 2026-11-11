import { useEffect, useState } from 'react';
import { apiFetch } from '@/src/services/api';

// Fastermall's support line for partners. The backend has one contact an
// admin sets: the manager's number (GET /settings → whatsappContactNumber,
// stored as international digits, e.g. 233241234567). It is null until set,
// and then every "call support" button falls back to the in-app Support screen.

type SettingsJson = { whatsappContactNumber?: string | null };

let cached: string | null | undefined;
let pending: Promise<string | null> | null = null;

/** International digits ("233…"), or null when no number is set or it can't be read. */
export function parseSupportNumber(raw: unknown): string | null {
  const body = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: unknown }).data : raw;
  const n = (body as SettingsJson | null)?.whatsappContactNumber;
  return typeof n === 'string' && /^\d{10,15}$/.test(n) ? n : null;
}

/** Reads the number once per app session (a failed read is tried again next time). */
export function getSupportNumber(): Promise<string | null> {
  if (cached !== undefined) return Promise.resolve(cached);
  pending ??= apiFetch<unknown>('/settings', { auth: false })
    .then((raw) => (cached = parseSupportNumber(raw)))
    .catch(() => null)
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** tel: link for a number in international digits. */
export const telUrl = (international: string) => `tel:+${international}`;

/** The support number for buttons; undefined while loading, null when unavailable. */
export function useSupportNumber(): string | null | undefined {
  const [number, setNumber] = useState<string | null | undefined>(cached);
  useEffect(() => {
    let alive = true;
    void getSupportNumber().then((n) => alive && setNumber(n));
    return () => {
      alive = false;
    };
  }, []);
  return number;
}
