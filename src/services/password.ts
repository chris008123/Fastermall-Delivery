import { apiFetch } from '@/src/services/api';

// POST /staff/password/change { currentPassword, newPassword }
// Wrong current password: 400 INVALID_CURRENT_PASSWORD; same as before: 400
// SAME_PASSWORD. Other devices are signed out; this one stays signed in.

const MIN = 8;
const MAX = 72; // bcrypt's limit, as the server enforces

/** A message per field that needs fixing (same rules as the server). */
export function checkNewPassword(current: string, next: string, confirm: string) {
  return {
    current: current ? undefined : 'Enter your current password',
    next:
      next.length < MIN
        ? `Use at least ${MIN} characters`
        : next.length > MAX
          ? `Use at most ${MAX} characters`
          : next === current
            ? 'Choose a password different from your current one'
            : undefined,
    confirm: confirm === next ? undefined : 'The passwords don’t match',
  };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch('/staff/password/change', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
}

// Signed out: set up a new account (code from the approval email) or reset a
// forgotten password. POST /staff/password/forgot { email } always answers the
// same way, whether or not the account exists. POST /staff/password/reset
// { email, code, newPassword }: 400 INVALID_RESET_CODE when wrong or expired.

/** Emails a fresh 6-digit code (valid 15 minutes). */
export async function requestResetCode(email: string): Promise<void> {
  await apiFetch('/staff/password/forgot', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

/** Sets the password with an emailed code; the partner then signs in. */
export async function resetWithCode(email: string, code: string, newPassword: string): Promise<void> {
  await apiFetch('/staff/password/reset', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), newPassword }),
  });
}

/** Messages for the set-up / reset form (same rules as the server). */
export function checkResetForm(email: string, code: string, next: string, confirm: string) {
  return {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? undefined : 'Enter the email you applied with',
    code: /^\d{6}$/.test(code.trim()) ? undefined : 'Enter the 6-digit code from your email',
    next: next.length < MIN ? `Use at least ${MIN} characters` : next.length > MAX ? `Use at most ${MAX} characters` : undefined,
    confirm: confirm === next ? undefined : 'The passwords don\u2019t match',
  };
}
