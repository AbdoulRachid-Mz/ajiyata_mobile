import React from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedView from '@/components/ui/view';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';
import ScrollView from '@/components/ui/scroll-view';
import Card from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { View, Switch } from 'react-native';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { currentUser, setCurrentUser, setCurrentAccount } = useAppStore();

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentAccount(null);
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg }}>
        {/* Header */}
        <ThemedView style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            ← Retour
          </Button>
          <ThemedText variant="xl" weight="bold" style={{ marginLeft: theme.spacing.md }}>
            Paramètres
          </ThemedText>
        </ThemedView>

        {/* Profile Card */}
        <Card style={{ marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold">{currentUser?.name || 'Utilisateur'}</ThemedText>
          <ThemedText variant="sm" color="mutedForeground">{currentUser?.phoneNumber}</ThemedText>
        </Card>

        {/* Preferences */}
        <ThemedText variant="lg" weight="semibold" style={{ marginBottom: theme.spacing.md }}>
          Préférences
        </ThemedText>
        <Card style={{ marginBottom: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemedText>Mode sombre</ThemedText>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        </Card>

        {/* Account */}
        <ThemedText variant="lg" weight="semibold" style={{ marginBottom: theme.spacing.md }}>
          Compte
        </ThemedText>
        <Button variant="destructive" onPress={handleLogout}>
          Déconnexion
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
