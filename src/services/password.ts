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
