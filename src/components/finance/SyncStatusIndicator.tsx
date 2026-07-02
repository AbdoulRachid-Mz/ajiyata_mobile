import React, { useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import Card from '@/components/ui/card';
import { useSyncAll, useSyncStatus } from '@/hooks/use-sync';
import { useNetwork } from '@/providers/network-provider';

export const SyncStatusIndicator = () => {
  const { theme } = useTheme();
  const { isConnected } = useNetwork();
  const syncAll = useSyncAll();
  const { data: syncStatus, refetch } = useSyncStatus();

  // Rafraîchir le statut au chargement
  useEffect(() => {
    refetch();
  }, []);

  const isSyncing = syncAll.isPending;
  const hasPending = (syncStatus?.pending || 0) > 0;

  const handlePress = () => {
    if (!isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    syncAll.mutate();
  };

  if (!isConnected) {
    return (
      <Card style={{ 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: theme.colors.destructive + '10',
        borderColor: theme.colors.destructive,
        borderWidth: 1,
      }}>
        <Ionicons name="cloud-offline" size={16} color={theme.colors.destructive} />
        <ThemedText variant="xs" style={{ marginLeft: 6, color: theme.colors.destructive }}>
          Hors ligne
        </ThemedText>
      </Card>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center' }}
    >
      <Card style={{ 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: hasPending ? theme.financialColors.budget + '10' : 'transparent',
        borderColor: hasPending ? theme.financialColors.budget : 'transparent',
        borderWidth: hasPending ? 1 : 0,
      }}>
        {isSyncing ? (
          <>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <ThemedText variant="xs" style={{ marginLeft: 6 }}>
              Synchronisation...
            </ThemedText>
          </>
        ) : hasPending ? (
          <>
            <Ionicons name="cloud-outline" size={16} color={theme.financialColors.budget} />
            <ThemedText variant="xs" style={{ marginLeft: 6, color: theme.financialColors.budget }}>
              {syncStatus?.pending ?? 0} en attente
            </ThemedText>
          </>
        ) : (
          <>
            <Ionicons name="cloud-done" size={16} color={theme.financialColors.saving} />
            <ThemedText variant="xs" style={{ marginLeft: 6 }}>
              Synchronisé
            </ThemedText>
          </>
        )}
      </Card>
    </TouchableOpacity>
  );
};