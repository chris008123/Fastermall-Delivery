import { isValidMomoNumber, maskMomoNumber, sanitizeMomoInput } from '@/src/utils/momo';

describe('isValidMomoNumber', () => {
  it('accepts a leading 0 followed by nine digits', () => {
    expect(isValidMomoNumber('0241234567')).toBe(true);
    expect(isValidMomoNumber('0551234567')).toBe(true);
  });

  it('rejects numbers that are too short or too long', () => {
    expect(isValidMomoNumber('024123456')).toBe(false);
    expect(isValidMomoNumber('02412345678')).toBe(false);
    expect(isValidMomoNumber('')).toBe(false);
  });

  it('rejects numbers that do not start with 0', () => {
    expect(isValidMomoNumber('1241234567')).toBe(false);
    expect(isValidMomoNumber('2331234567')).toBe(false);
  });

  it('rejects anything that is not purely digits', () => {
    expect(isValidMomoNumber('024 123 4567')).toBe(false);
    expect(isValidMomoNumber('024-123-4567')).toBe(false);
    expect(isValidMomoNumber('+233241234567')).toBe(false);
    expect(isValidMomoNumber('024123456a')).toBe(false);
    expect(isValidMomoNumber(' 0241234567')).toBe(false);
  });
});

describe('sanitizeMomoInput', () => {
  it('strips spaces, dashes and letters', () => {
    expect(sanitizeMomoInput('024 123-4567')).toBe('0241234567');
    expect(sanitizeMomoInput('abc024def')).toBe('024');
  });

  it('caps the number at 10 digits', () => {
    expect(sanitizeMomoInput('024123456789')).toBe('0241234567');
  });

  it('turns a pasted valid number into one that validates', () => {
    expect(isValidMomoNumber(sanitizeMomoInput('024 123 4567'))).toBe(true);
  });

  it('returns an empty string when there are no digits', () => {
    expect(sanitizeMomoInput('hello')).toBe('');
    expect(sanitizeMomoInput('')).toBe('');
  });
});

describe('maskMomoNumber', () => {
  it('keeps the first three and last four digits', () => {
    expect(maskMomoNumber('0241234567')).toBe('024 ··· 4567');
  });
});
