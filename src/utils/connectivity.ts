/** The parts of NetInfo's state we look at. */
export interface ConnectivityState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null | undefined;
}

/**
 * True only when the phone has told us it is offline. While NetInfo is still
 * working it out (null/undefined), we assume online, so the banner never
 * flashes up at launch.
 */
export function isOffline(state: ConnectivityState): boolean {
  if (state.isConnected === false) return true;
  return state.isInternetReachable === false;
}
