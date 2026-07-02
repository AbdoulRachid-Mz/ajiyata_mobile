import React, { useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedText from '@/components/ui/text';
import ThemedView from '@/components/ui/view';
import Card from '@/components/ui/card';
import { useTheme } from '@/contexts/theme-context';
import { useAppStore } from '@/stores/app-store';
import { useUIStore } from '@/stores/ui-store';
import { generateUUID, getCurrentTimestamp } from "@/utils/uuid";
import { useBudgets, useCreateBudget, useDeleteBudget } from '@/features/budgets/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useTransactions } from '@/features/transactions/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { Budget, Category } from '@/types';
import { BudgetCard } from '@/components/finance/budget-card';

// ---- Helpers ----

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

function formatCurrency(amount: number, currency = 'XOF') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---- Budget Card ----

interface BudgetCardProps {
  budget: Budget;
  category?: Category;
  spent: number;
  currency: string;
}


// ---- Main Screen ----

export default function BudgetsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const { setTabBarVisible } = useUIStore();
  const accountId = currentAccount?.id || '';

  const { data: budgets, isLoading } = useBudgets(accountId);
  const { data: categories } = useCategories(accountId);
  const { data: transactions } = useTransactions(accountId);
  const deleteBudget = useDeleteBudget(accountId);
  const createBudget = useCreateBudget();

  const lastScrollY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY < 0) return;
    if (currentScrollY > lastScrollY.current + 10) {
      setTabBarVisible(false);
    } else if (currentScrollY < lastScrollY.current - 10) {
      setTabBarVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  // Calcul des dépenses par catégorie sur le mois courant
  const { start, end } = useMemo(() => getMonthRange(), []);

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    if (!transactions) return map;
    for (const tx of transactions) {
      if (!tx.categoryId) continue;
      const txDate = new Date(tx.date);
      if (txDate < start || txDate > end) continue;
      if (tx.type === 'expense') {
        map[tx.categoryId] = (map[tx.categoryId] || 0) + Number(tx.amount);
      }
    }
    return map;
  }, [transactions, start, end]);

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    if (!categories) return map;
    for (const cat of categories) {
      map[cat.id] = cat;
    }
    return map;
  }, [categories]);

  const activeBudgets = useMemo(
    () => (budgets || []).filter((b) => b.status === 'active'),
    [budgets]
  );

  // KPI summary
  const totalLimit = useMemo(
    () => activeBudgets.reduce((sum, b) => sum + Number(b.limit || 0), 0),
    [activeBudgets]
  );
  const totalSpent = useMemo(
    () => activeBudgets.reduce((sum, b) => sum + (spentByCategory[b.categoryId] || 0), 0),
    [activeBudgets, spentByCategory]
  );
  const overCount = useMemo(
    () => activeBudgets.filter((b) => (spentByCategory[b.categoryId] || 0) > Number(b.limit || 0)).length,
    [activeBudgets, spentByCategory]
  );

  const currency = currentAccount?.currency || 'XOF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <ThemedView
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <View>
            <ThemedText variant="sm" color="mutedForeground">
              Ce mois-ci
            </ThemedText>
            <ThemedText variant="2xl" weight="bold">
              Budgets
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/budget-create')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </ThemedView>

        {/* KPI Cards */}
        {activeBudgets.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: theme.spacing.lg }}>
            <Card style={styles.kpiCard}>
              <ThemedText variant="xs" color="mutedForeground" style={{ marginBottom: 4 }}>
                Total alloué
              </ThemedText>
              <ThemedText variant="lg" weight="bold" style={{ color: theme.colors.primary }}>
                {formatCurrency(totalLimit, currency)}
              </ThemedText>
            </Card>
            <Card style={styles.kpiCard}>
              <ThemedText variant="xs" color="mutedForeground" style={{ marginBottom: 4 }}>
                Total dépensé
              </ThemedText>
              <ThemedText
                variant="lg"
                weight="bold"
                style={{ color: totalSpent > totalLimit ? theme.colors.destructive : theme.colors.foreground }}
              >
                {formatCurrency(totalSpent, currency)}
              </ThemedText>
            </Card>
            {overCount > 0 && (
              <Card style={{ ...styles.kpiCard, backgroundColor: theme.colors.destructive + '15' }}>
                <ThemedText variant="xs" color="mutedForeground" style={{ marginBottom: 4 }}>
                  Dépassés
                </ThemedText>
                <ThemedText variant="lg" weight="bold" style={{ color: theme.colors.destructive }}>
                  {overCount}
                </ThemedText>
              </Card>
            )}
          </View>
        )}

        {/* Budget list */}
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="hourglass-outline" size={40} color={theme.colors.mutedForeground} />
            <ThemedText color="mutedForeground" style={{ marginTop: 12 }}>
              Chargement...
            </ThemedText>
          </View>
        ) : activeBudgets.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.primary + '15',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: theme.spacing.lg,
              }}
            >
              <Ionicons name="pie-chart-outline" size={36} color={theme.colors.primary} />
            </View>
            <ThemedText variant="xl" weight="bold" style={{ marginBottom: 8, textAlign: 'center' }}>
              Aucun budget
            </ThemedText>
            <ThemedText color="mutedForeground" style={{ textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
              Créez votre premier budget pour mieux contrôler vos dépenses par catégorie.
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/budget-create')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <ThemedText weight="semibold" style={{ color: '#fff' }}>
                Créer un budget
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ThemedText
              variant="sm"
              color="mutedForeground"
              weight="medium"
              style={{ marginBottom: theme.spacing.sm }}
            >
              {activeBudgets.length} budget{activeBudgets.length > 1 ? 's' : ''} actif{activeBudgets.length > 1 ? 's' : ''}
            </ThemedText>
            {activeBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={{
                  ...budget,
                  spent: spentByCategory[budget.categoryId] || 0,
                  account: { 
                    id: currentAccount?.id || '',
                    name: currentAccount?.name || '',
                    userId: currentAccount?.userId || '',
                    type: (currentAccount?.type as "personal" | "business" | undefined) || 'personal',
                    currency: currency || 'XOF'
                  },
                  category: categoryMap[budget.categoryId] || {
                    id: budget.categoryId,
                    accountId: currentAccount?.id || '',
                    name: 'Inconnue',
                    type: 'expense',
                    color: '#ccc',
                    icon: 'wallet-outline',
                  }
                }}
                category={categoryMap[budget.categoryId]}
                // @ts-ignore
                onEdit={(b) => router.push(`/budget-edit?id=${b.id}`)}
                onDuplicate={async (b) => {
                  try {
                    await createBudget.mutateAsync({
                      ...b,
                      id: generateUUID(),
                      createdAt: getCurrentTimestamp(),
                      updatedAt: getCurrentTimestamp(),
                      syncStatus: "pending",
                    } as any);
                    // Force refresh ou le hook s'en charge
                  } catch (e) {
                    console.error('Duplication error', e);
                  }
                }}
                onDelete={(b) => {
                  Alert.alert(
                    'Supprimer le budget',
                    'Êtes-vous sûr de vouloir supprimer ce budget ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { 
                        text: 'Supprimer', 
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deleteBudget.mutateAsync(b.id);
                          } catch (e) {
                            console.error('Delete error', e);
                          }
                        }
                      }
                    ]
                  );
                }}
                // onDuplicate={(b) => router.push('/budget-create?duplicate=' + b.id)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  kpiCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
});
