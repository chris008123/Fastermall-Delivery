import { apiFetch } from '@/src/services/api';
import type { PartnerMode } from '@/src/types/job';

// Applying to become a delivery partner (no account needed):
//   POST /partner-applications
//   { fullName, email, phone, dateOfBirth: "YYYY-MM-DD", address, partnerType, plateNumber? }
// An admin reviews it; approval creates the account and the admin sends the
// sign-in details. Documents are uploaded after signing in.

export interface ApplicationForm {
  phone: string;
  email: string;
  fullName: string;
  /** As typed: DD/MM/YYYY */
  dateOfBirth: string;
  address: string;
  vehicleMode: PartnerMode;
  plateNumber: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** DD/MM/YYYY → YYYY-MM-DD, or null when it isn't a real date. */
export function isoDate(ddmmyyyy: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy.trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(`${y}-${mo}-${d}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(d) || date.getUTCMonth() + 1 !== Number(mo)) return null;
  return `${y}-${mo}-${d}`;
}

export function ageOn(iso: string, now: Date): number {
  const b = new Date(`${iso}T00:00:00Z`);
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}

const digits = (s: string) => s.replace(/\D/g, '');

/** A message per field that needs fixing, matching the server's rules. */
export function checkContact(form: ApplicationForm) {
  return {
    phone: /^0\d{9}$/.test(digits(form.phone)) ? undefined : 'Enter a 10-digit number starting with 0',
    email: EMAIL.test(form.email.trim()) ? undefined : 'Enter a valid email address',
  };
}

export function checkPersonal(form: ApplicationForm, now: Date = new Date()) {
  const iso = isoDate(form.dateOfBirth);
  return {
    fullName: form.fullName.trim().length >= 2 ? undefined : 'Enter your full name',
    dateOfBirth: !iso
      ? 'Enter a real date as DD/MM/YYYY'
      : new Date(`${iso}T00:00:00Z`) > now
        ? 'Enter a real date as DD/MM/YYYY'
        : ageOn(iso, now) < 18
          ? 'You must be 18 or older to deliver with Fastermall'
          : undefined,
    address: form.address.trim().length >= 4 ? undefined : 'Enter where you live, e.g. Ayeduase, Kumasi',
  };
}

export function checkVehicle(form: ApplicationForm) {
  return {
    plateNumber:
      form.vehicleMode === 'WALKING' || form.plateNumber.trim().length >= 3 ? undefined : 'Enter your registration number',
  };
}

/** The request body. Exported for tests. */
export function toApplicationBody(form: ApplicationForm) {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: digits(form.phone),
    dateOfBirth: isoDate(form.dateOfBirth),
    address: form.address.trim(),
    partnerType: form.vehicleMode,
    ...(form.vehicleMode === 'MOTORCYCLE' ? { plateNumber: form.plateNumber.trim().toUpperCase() } : {}),
  };
}

export async function submitApplication(form: ApplicationForm): Promise<void> {
  await apiFetch('/partner-applications', { method: 'POST', auth: false, body: JSON.stringify(toApplicationBody(form)) });
}
