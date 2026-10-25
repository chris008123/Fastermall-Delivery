import AsyncStorage from '@react-native-async-storage/async-storage';

import { useDocumentsStore } from '@/src/stores/documentsStore';
import { useJobsStore } from '@/src/stores/jobsStore';
import { useNotificationsStore } from '@/src/stores/notificationsStore';
import { usePartnerStore } from '@/src/stores/partnerStore';
import { usePayoutStore } from '@/src/stores/payoutStore';
import { useWalletStore } from '@/src/stores/walletStore';

const LAST_USER_KEY = '@fastermall_delivery_last_user';

/**
 * Empties everything the app keeps about one partner's account, in memory
 * and on disk. Device preferences (theme, nav style, haptics, the unread-only
 * filter) are not account data and are left alone.
 *
 * Add any new per-account store here, or it will outlive sign-out.
 */
export async function resetAccountData(): Promise<void> {
  useJobsStore.setState(useJobsStore.getInitialState(), true);
  usePartnerStore.setState(usePartnerStore.getInitialState(), true);
  useWalletStore.setState(useWalletStore.getInitialState(), true);
  useNotificationsStore.setState(useNotificationsStore.getInitialState(), true);
  useDocumentsStore.setState(useDocumentsStore.getInitialState(), true);
  usePayoutStore.setState(usePayoutStore.getInitialState(), true);
  await usePayoutStore.persist.clearStorage();
}

/** Called when a partner signs in. If a different account (or an unknown one,
 * such as data left by an older app version) was last on this device, its
 * data is wiped before the new account sees any of it. */
export async function prepareAccountSession(userId: string): Promise<void> {
  const lastUserId = await AsyncStorage.getItem(LAST_USER_KEY);
  if (lastUserId !== userId) await resetAccountData();
  await AsyncStorage.setItem(LAST_USER_KEY, userId);
}

/** Called on sign-out and when the server ends the session. */
export async function clearAccountSession(): Promise<void> {
  await resetAccountData();
  await AsyncStorage.removeItem(LAST_USER_KEY);
}
