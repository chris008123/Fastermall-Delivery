import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';

export default function Entry() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/(partner)' : '/(auth)/login'} />;
}
