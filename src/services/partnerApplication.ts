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

export const EMPTY_APPLICATION: ApplicationForm = {
  phone: '',
  email: '',
  fullName: '',
  dateOfBirth: '',
  address: '',
  vehicleMode: 'MOTORCYCLE',
  plateNumber: '',
};

/** True when nothing has been typed yet, so there is nothing worth saving. */
export function isBlankApplication(form: ApplicationForm): boolean {
  return (['phone', 'email', 'fullName', 'dateOfBirth', 'address', 'plateNumber'] as const).every(
    (key) => form[key].trim() === '',
  );
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

/** Steps in order; the review step has no fields of its own. */
const STEP_CHECKS = [checkContact, checkPersonal, checkVehicle] as const;

/**
 * Where a saved application should reopen: the step the person was on, unless
 * an earlier step no longer passes (a rule changed, or they turned 18 later
 * than they typed...), in which case that step, so they can't skip past it.
 */
export function resumeStepIndex(form: ApplicationForm, savedStep: number, now: Date = new Date()): number {
  const target = Math.max(0, Math.min(Math.floor(savedStep) || 0, STEP_CHECKS.length));
  for (let i = 0; i < target; i++) {
    const errors = i === 1 ? checkPersonal(form, now) : STEP_CHECKS[i](form);
    if (Object.values(errors).some(Boolean)) return i;
  }
  return target;
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
