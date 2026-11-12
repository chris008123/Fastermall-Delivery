/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
const mockApiFetch = jest.fn();
jest.mock('@/src/services/api', () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

import { changePassword, checkNewPassword } from '@/src/services/password';

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
});
