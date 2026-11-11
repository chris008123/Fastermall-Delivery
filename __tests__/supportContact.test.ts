/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { parseSupportNumber, telUrl } from '@/src/services/supportContact';

describe('support number', () => {
  it('reads the number an admin set, wrapped or not', () => {
    expect(parseSupportNumber({ whatsappContactNumber: '233241234567' })).toBe('233241234567');
    expect(parseSupportNumber({ success: true, data: { whatsappContactNumber: '233241234567' } })).toBe('233241234567');
  });

  it('is null when unset or malformed, so buttons fall back to the Support screen', () => {
    expect(parseSupportNumber({ whatsappContactNumber: null })).toBeNull();
    expect(parseSupportNumber({ whatsappContactNumber: '0800-000' })).toBeNull();
    expect(parseSupportNumber(undefined)).toBeNull();
  });

  it('dials in international form', () => {
    expect(telUrl('233241234567')).toBe('tel:+233241234567');
  });
});
