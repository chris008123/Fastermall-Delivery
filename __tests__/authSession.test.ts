import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, apiFetch, clearAccessToken, getAccessToken } from '@/src/services/api';
import { useAuthStore } from '@/src/stores/authStore';
import { useJobsStore } from '@/src/stores/jobsStore';
import { usePayoutStore } from '@/src/stores/payoutStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/src/services/api', () => ({
  ...jest.requireActual('@/src/services/api'),
  apiFetch: jest.fn(),
  getAccessToken: jest.fn(),
  saveAccessToken: jest.fn(),
  clearAccessToken: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.Mock;
const mockGetToken = getAccessToken as jest.Mock;
const mockClearToken = clearAccessToken as jest.Mock;

const partner = { id: 'u1', email: 'a@b.co', fullName: 'Ama', role: 'DELIVERY_PARTNER' };

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useAuthStore.setState({ isAuthenticated: false, isHydrating: true, user: null });
  mockGetToken.mockResolvedValue('token');
});

describe('hydrate (opening the app)', () => {
  it('keeps the partner signed in when there is no connection', async () => {
    mockApiFetch.mockRejectedValue(new TypeError('Network request failed'));
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockClearToken).not.toHaveBeenCalled();
  });

  it('keeps the partner signed in when the server has a bad moment', async () => {
    mockApiFetch.mockRejectedValue(new ApiError('Bad gateway', 502));
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockClearToken).not.toHaveBeenCalled();
  });

  it('signs out when the server says the session is over', async () => {
    mockApiFetch.mockRejectedValue(new ApiError('Unauthorized', 401));
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockClearToken).toHaveBeenCalled();
  });

  it('signs out an account that is not a delivery partner', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { ...partner, role: 'ADMIN' } });
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockClearToken).toHaveBeenCalled();
  });

  it('stays signed out when there is no saved token', async () => {
    mockGetToken.mockResolvedValue(null);
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

describe('signOut', () => {
  it('empties the previous account\'s jobs and payout details', async () => {
    useAuthStore.setState({ isAuthenticated: true, isHydrating: false, user: partner });
    useJobsStore.setState({ jobs: [{ id: 'j1' } as never] });
    usePayoutStore.setState({ network: 'MTN', number: '0241234567' });

    await useAuthStore.getState().signOut();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useJobsStore.getState().jobs).toEqual([]);
    expect(usePayoutStore.getState().number).toBeNull();
    expect(await AsyncStorage.getItem('fastermall-partner-payout')).toBeNull();
  });

  it('leaves device preferences alone', async () => {
    const { useNavStyleStore } = require('@/src/stores/navStyleStore');
    useNavStyleStore.setState({ navStyle: 'compact' });
    await useAuthStore.getState().signOut();
    expect(useNavStyleStore.getState().navStyle).toBe('compact');
  });
});

describe('signIn as a different account', () => {
  it('wipes the last account\'s data before the new one sees it', async () => {
    await AsyncStorage.setItem('@fastermall_delivery_last_user', 'someone-else');
    usePayoutStore.setState({ network: 'MTN', number: '0241234567' });
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { accessToken: 't' } })
      .mockResolvedValueOnce({ success: true, data: partner });

    await useAuthStore.getState().signIn('a@b.co', 'pw');

    expect(usePayoutStore.getState().number).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('keeps the data when the same partner signs back in', async () => {
    await AsyncStorage.setItem('@fastermall_delivery_last_user', 'u1');
    usePayoutStore.setState({ network: 'MTN', number: '0241234567' });
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { accessToken: 't' } })
      .mockResolvedValueOnce({ success: true, data: partner });

    await useAuthStore.getState().signIn('a@b.co', 'pw');

    expect(usePayoutStore.getState().number).toBe('0241234567');
  });
});
