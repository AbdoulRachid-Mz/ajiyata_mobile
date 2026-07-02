import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/theme-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/configs/query-client';
import { MigrationLoader } from '@/components/MigrationLoader';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SyncProvider } from '@/providers/sync-provider';
import { NetworkProvider } from '@/providers/network-provider';
import { NotificationProvider } from '@/contexts/notification-context';
import { AuthProvider } from '@/contexts/auth-context';
// global.css
import './../../global.css';



// S'assurer que le composant est exporté par défaut
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <NetworkProvider>
                <SyncProvider>
                  <NotificationProvider>
                    <MigrationLoader>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          animation: 'slide_from_right',
                        }}
                      />
                    </MigrationLoader>
                  </NotificationProvider>
                </SyncProvider>
              </NetworkProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}