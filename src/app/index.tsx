import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/stores/app-store';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentUser } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkState = async () => {
      if (currentUser) {
        router.replace('/(tabs)/dashboard');
        return;
      }
      // Vérifier si l'onboarding a déjà été effectué
      const completed = await AsyncStorage.getItem('hasCompletedOnboarding');
      if (completed === 'true') {
        // L'utilisateur a déjà fait l'onboarding -> aller directement au login
        router.replace('/auth/login');
      } else {
        router.replace('/onboarding');
      }
      setChecking(false);
    };
    checkState();
  }, [currentUser]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}