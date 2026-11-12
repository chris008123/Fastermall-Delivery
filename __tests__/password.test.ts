/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
const mockApiFetch = jest.fn();
jest.mock('@/src/services/api', () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

import { changePassword, checkNewPassword, checkResetForm, requestResetCode, resetWithCode } from '@/src/services/password';

describe('change password', () => {
  it('accepts a valid change', () => {
    expect(checkNewPassword('Temp1234abcd', 'my-new-pass', 'my-new-pass')).toEqual({ current: undefined, next: undefined, confirm: undefined });
  });

  it('explains each problem like the server would', () => {
    const e = checkNewPassword('', 'short', 'other');
    expect(e.current).toBeDefined();
    expect(e.next).toMatch(/at least 8/);
    expect(e.confirm).toMatch(/match/);
    expect(checkNewPassword('samepassword', 'samepassword', 'samepassword').next).toMatch(/different/);
    expect(checkNewPassword('x', 'a'.repeat(73), 'a'.repeat(73)).next).toMatch(/at most 72/);
  });

  it('posts to the staff change-password route', async () => {
    mockApiFetch.mockResolvedValue({ changed: true });
    await changePassword('old-password', 'new-password');
    expect(mockApiFetch).toHaveBeenCalledWith('/staff/password/change', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'old-password', newPassword: 'new-password' }),
    });
  });

  it('sets up or resets a password with an emailed code, without signing in', async () => {
    mockApiFetch.mockReset().mockResolvedValue({});
    await requestResetCode(' Kojo@Example.com ');
    expect(mockApiFetch).toHaveBeenLastCalledWith('/staff/password/forgot', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email: 'kojo@example.com' }),
    });
    await resetWithCode('kojo@example.com', ' 482913 ', 'my-own-password');
    expect(mockApiFetch).toHaveBeenLastCalledWith('/staff/password/reset', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email: 'kojo@example.com', code: '482913', newPassword: 'my-own-password' }),
    });
  });

  it('checks the set-up form like the server', () => {
    expect(checkResetForm('kojo@example.com', '482913', 'my-own-password', 'my-own-password')).toEqual({
      email: undefined,
      code: undefined,
      next: undefined,
      confirm: undefined,
    });
    const e = checkResetForm('kojo@', '4829', 'short', 'x');
    expect(e.email).toBeDefined();
    expect(e.code).toMatch(/6-digit/);
    expect(e.next).toMatch(/at least 8/);
    expect(e.confirm).toMatch(/match/);
  });
});
