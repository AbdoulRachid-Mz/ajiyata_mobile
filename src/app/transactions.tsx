import React from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedView from '@/components/ui/view';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';
import FlatList from '@/components/ui/flat-list';
import { useTransactions } from '@/features/transactions/hooks';
import { useAppStore } from '@/stores/app-store';
import { TransactionItem } from '@/components/finance/transaction-item';
import { ActivityIndicator, View } from 'react-native';

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const { data: transactions, isLoading, refetch } = useTransactions(currentAccount?.id || '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <ThemedView style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: theme.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border
        }}>
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            ← Retour
          </Button>
          <ThemedText variant="xl" weight="bold">
            Toutes les transactions
          </ThemedText>
          <View style={{ width: 60 }} />
        </ThemedView>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <TransactionItem transaction={item} />
              </View>
            )}
            onRefresh={refetch}
            refreshing={isLoading}
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ThemedText color="mutedForeground">Aucune transaction trouvée</ThemedText>
              </View>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
