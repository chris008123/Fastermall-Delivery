/** Formats a Ghana mobile number as the user types: 024 412 3456. */
export function formatGhanaPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean);
  return parts.join(' ');
}

export function stripPhoneFormatting(value: string) {
  return value.replace(/\D/g, '');
}
