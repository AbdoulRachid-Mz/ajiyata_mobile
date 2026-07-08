import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonText } from './skeleton';
import SafeAreaView from './safe-area-view';

// Skeleton pour le Dashboard
export const DashboardSkeleton = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <View>
            <Skeleton width={100} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width={150} height={28} />
          </View>
          <SkeletonCircle size={40} />
        </View>

        {/* Balance Card */}
        <SkeletonCard height={180} />

        {/* Quick Actions */}
        <View style={{ marginTop: theme.spacing.md }}>
          <Skeleton width={140} height={20} style={{ marginBottom: theme.spacing.md }} />
          <View style={{ flexDirection: 'row', gap: theme.spacing.md, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width="45%" height={56} borderRadius={theme.borderRadius.xl} />
            ))}
          </View>
        </View>

        {/* Charts */}
        <SkeletonCard height={200} />

        {/* Recent Transactions */}
        <View style={{ marginTop: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
            <Skeleton width={160} height={20} />
            <Skeleton width={80} height={16} />
          </View>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} height={60} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Skeleton pour la liste des transactions
export const TransactionsSkeleton = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.lg }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <Skeleton width={120} height={28} />
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>

        {/* Liste */}
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <SkeletonCircle size={44} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Skeleton width="60%" height={16} style={{ marginBottom: 4 }} />
              <Skeleton width="40%" height={12} />
            </View>
            <Skeleton width={80} height={18} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

// Skeleton pour les budgets
export const BudgetsSkeleton = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <Skeleton width={120} height={28} />
          <Skeleton width={44} height={44} borderRadius={22} />
        </View>

        {/* KPIs */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: theme.spacing.lg }}>
          {[1, 2].map((i) => (
            <SkeletonCard key={i} height={80} />
          ))}
        </View>

        {/* Budget Cards */}
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} height={100} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// Skeleton pour les objectifs d'épargne
export const GoalsSkeleton = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}>
        {/* Header */}
        <Skeleton width={200} height={32} style={{ marginBottom: theme.spacing.lg }} />

        {/* Goal Cards */}
        {[1, 2].map((i) => (
          <SkeletonCard key={i} height={140} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// Skeleton pour les paramètres
export const SettingsSkeleton = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}>
        {/* Header */}
        <Skeleton width={150} height={32} style={{ marginBottom: theme.spacing.lg }} />

        {/* Cards */}
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} height={100} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// Composant générique pour charger le bon skeleton selon l'écran
export const ScreenSkeleton = ({ type }: { type: 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'settings' }) => {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'transactions':
      return <TransactionsSkeleton />;
    case 'budgets':
      return <BudgetsSkeleton />;
    case 'goals':
      return <GoalsSkeleton />;
    case 'settings':
      return <SettingsSkeleton />;
    default:
      return <DashboardSkeleton />;
  }
};