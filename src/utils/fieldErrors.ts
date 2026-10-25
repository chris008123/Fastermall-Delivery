/**
 * Pulls "this field has this problem" messages out of an error response, so
 * a form can show them under the right input instead of one vague banner.
 *
 * Understands the shapes backends commonly send:
 *   { errors: [{ field: 'email', message: 'Not valid' }] }   (also path / property)
 *   { errors: { email: 'Not valid' } }  or  { errors: { email: ['Not valid'] } }
 * Anything else gives no field errors, and the screen falls back to the
 * general message. The agreed format is in BACKEND_CHANGES_NEEDED.md (item 13).
 */
export type FieldErrors = Record<string, string>;

const NAME_KEYS = ['field', 'path', 'property', 'param'] as const;

function firstText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) return firstText(value.find((v) => typeof v === 'string' && v.trim()));
  return undefined;
}

export function extractFieldErrors(data: unknown): FieldErrors {
  if (typeof data !== 'object' || data === null) return {};
  const errors = (data as { errors?: unknown }).errors;
  const out: FieldErrors = {};

  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (typeof item !== 'object' || item === null) continue;
      const entry = item as Record<string, unknown>;
      const nameKey = NAME_KEYS.find((k) => typeof entry[k] === 'string');
      const message = firstText(entry.message) ?? firstText(entry.msg);
      if (nameKey && message && !(entry[nameKey] as string in out)) out[entry[nameKey] as string] = message;
    }
  } else if (errors && typeof errors === 'object') {
    for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
      const message = firstText(value);
      if (message) out[field] = message;
    }
  }

  return out;
}
