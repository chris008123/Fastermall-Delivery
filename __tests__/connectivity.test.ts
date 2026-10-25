import { isOffline } from '@/src/utils/connectivity';

describe('isOffline', () => {
  it('is false while the phone is still working out its connection', () => {
    expect(isOffline({ isConnected: null, isInternetReachable: null })).toBe(false);
    expect(isOffline({ isConnected: true, isInternetReachable: undefined })).toBe(false);
  });

  it('is false when connected and the internet is reachable', () => {
    expect(isOffline({ isConnected: true, isInternetReachable: true })).toBe(false);
  });

  it('is true when there is no network connection', () => {
    expect(isOffline({ isConnected: false, isInternetReachable: false })).toBe(true);
    expect(isOffline({ isConnected: false, isInternetReachable: null })).toBe(true);
  });

  it('is true when connected to wifi that has no internet', () => {
    expect(isOffline({ isConnected: true, isInternetReachable: false })).toBe(true);
  });
});
