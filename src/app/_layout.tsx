import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/theme-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/configs/query-client';
import { MigrationLoader } from '@/components/MigrationLoader';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SyncProvider } from '@/contexts/sync-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { AuthProvider } from '@/contexts/auth-context';
import Toast from 'react-native-toast-message';
// global.css
import '@/global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Toast position="top" />
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
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
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}