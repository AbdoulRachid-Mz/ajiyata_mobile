import { Stack } from "expo-router";
import { ThemeProvider } from "@/contexts/theme-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/configs/query-client";
import { MigrationLoader } from "@/components/MigrationLoader";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SyncProvider } from "@/contexts/sync-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { AuthProvider } from "@/contexts/auth-context";
import { PermissionProvider } from "@/contexts/permission-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/configs/toast-config";
import { AppLock } from "@/components/auth/app-lock";
import Tesseract from "tesseract.js";

// global.css
import "@/global.css";
Tesseract.setLogging(false);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <SyncProvider>
                <PermissionProvider>
                  <NotificationProvider>
                    {/* AppLock en dehors de MigrationLoader */}
                    <AppLock />
                    <MigrationLoader>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          animation: "slide_from_right",
                        }}
                      />
                    </MigrationLoader>
                  </NotificationProvider>
                </PermissionProvider>
              </SyncProvider>
            </AuthProvider>
            <Toast config={toastConfig} position="top" topOffset={50} />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}