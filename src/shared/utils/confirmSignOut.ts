import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useAuthStore } from '@/src/stores/authStore';

/** Log out, after asking. A stray tap used to sign the partner out at once,
 * mid-shift, and they'd need their password to get back in. */
export function confirmSignOut() {
  Alert.alert('Log out?', 'You\u2019ll need your email and password to sign back in.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Log out',
      style: 'destructive',
      onPress: () => {
        useAuthStore.getState().signOut();
        router.replace('/(auth)/login');
      },
    },
  ]);
}
