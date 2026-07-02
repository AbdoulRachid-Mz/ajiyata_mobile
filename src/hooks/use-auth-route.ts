import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';

export const useAuthRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth' as any;

    if (!isAuthenticated && !inAuthGroup) {
      // Rediriger vers la page de connexion
    //   @ts-ignore
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Rediriger vers le dashboard
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);
};