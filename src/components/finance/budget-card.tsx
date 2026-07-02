import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import Card from '@/components/ui/card';
import ThemedText from '@/components/ui/text';
import { useTheme } from '@/contexts/theme-context';
import { formatCurrency } from '@/lib/formatters/currency';
import { Budget, BudgetWithRelations, Category } from '@/types';

interface BudgetCardProps {
  budget: BudgetWithRelations;
  category?: Category;
  onPress?: (budget: Budget) => void;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
  onDuplicate?: (budget: Budget) => void;
  showActions?: boolean;
}

export const BudgetCard = ({
  budget,
  category,
  onPress,
  onEdit,
  onDelete,
  onDuplicate,
  showActions = true,
}: BudgetCardProps) => {
  const { theme } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const progress = Math.min(budget.spent / budget.limit, 1);
  const isExceeded = budget.spent > budget.limit;
  const isNearLimit = progress >= 0.8 && !isExceeded;

  // Haptique pour les actions importantes
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(budget);
    }
  };

  // Render des actions de swipe
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [120, 0],
    });

    return (
      <Animated.View
        style={[
          styles.swipeActionsContainer,
          { transform: [{ translateX }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.swipeAction, styles.duplicateAction]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (onDuplicate) {
              onDuplicate(budget);
            }
            swipeableRef.current?.close();
          }}
        >
          <Ionicons name="copy-outline" size={24} color="#fff" />
          <ThemedText style={styles.swipeActionText} color="primaryForeground">
            Dupliquer
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, styles.editAction]}
          onPress={() => {
            if (onEdit) {
              onEdit(budget);
            }
            swipeableRef.current?.close();
          }}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
          <ThemedText style={styles.swipeActionText} color="primaryForeground">
            Modifier
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            if (onDelete) {
              onDelete(budget);
            }
            swipeableRef.current?.close();
          }}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <ThemedText style={styles.swipeActionText} color="primaryForeground">
            Supprimer
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={showActions ? renderRightActions : undefined}
        overshootRight={false}
        rightThreshold={40}
        friction={2}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          disabled={!onPress}
        >
          <Card style={{ ...styles.container, marginBottom: 12 }}>
            {/* En-tête */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.categoryColor,
                    { backgroundColor: category?.color || theme.financialColors.budget },
                  ]}
                />
                <ThemedText weight="semibold" style={{ fontSize: 16 }}>
                  {category?.name || 'Catégorie'}
                </ThemedText>
              </View>
              <View style={styles.headerRight}>
                <View
                  style={[
                    styles.periodBadge,
                    { backgroundColor: theme.colors.muted },
                  ]}
                >
                  <ThemedText variant="xs" color="mutedForeground">
                    {budget.period === 'daily'
                      ? 'Quotidien'
                      : budget.period === 'weekly'
                      ? 'Hebdomadaire'
                      : 'Mensuel'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Progression */}
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: isExceeded
                      ? theme.colors.destructive
                      : isNearLimit
                      ? theme.financialColors.budget
                      : theme.financialColors.saving,
                  },
                ]}
              />
            </View>

            {/* Détails */}
            <View style={styles.details}>
              <View>
                <ThemedText variant="sm" color="mutedForeground">
                  Dépensé
                </ThemedText>
                <ThemedText weight="semibold">
                  {/* {formatCurrency(budget.spent, budget.currency)} */}
                  {formatCurrency(budget.spent, budget.account.currency || 'XOF')}
                </ThemedText>
              </View>

              <View style={styles.detailCenter}>
                <ThemedText variant="sm" color="mutedForeground">
                  Restant
                </ThemedText>
                <ThemedText
                  weight="semibold"
                  style={{
                    color: isExceeded
                      ? theme.colors.destructive
                      : isNearLimit
                      ? theme.financialColors.budget
                      : theme.financialColors.saving,
                  }}
                >
                  {formatCurrency(Math.max(0, budget.limit - budget.spent), budget.account.currency || 'XOF')}
                </ThemedText>
              </View>

              <View style={styles.detailRight}>
                <ThemedText variant="sm" color="mutedForeground">
                  Total
                </ThemedText>
                <ThemedText weight="semibold">
                  {formatCurrency(budget.limit, budget.account.currency || 'XOF')}
                </ThemedText>
              </View>
            </View>

            {/* Indicateur de statut */}
            <View style={styles.statusContainer}>
              {isExceeded && (
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.destructive }]}>
                  <Ionicons name="alert-circle" size={14} color="#fff" />
                  <ThemedText style={styles.statusText} color="destructiveForeground">
                    Dépassé
                  </ThemedText>
                </View>
              )}
              {isNearLimit && !isExceeded && (
                <View style={[styles.statusBadge, { backgroundColor: theme.financialColors.budget }]}>
                  <Ionicons name="warning" size={14} color="#fff" />
                  <ThemedText style={styles.statusText} color="primaryForeground">
                    Bientôt atteint
                  </ThemedText>
                </View>
              )}
              {!isNearLimit && !isExceeded && (
                <View style={[styles.statusBadge, { backgroundColor: theme.financialColors.saving }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  <ThemedText style={styles.statusText} color="primaryForeground">
                    En bonne voie
                  </ThemedText>
                </View>
              )}
              <ThemedText variant="xs" color="mutedForeground">
                {Math.round(progress * 100)}%
              </ThemedText>
            </View>
          </Card>
        </TouchableOpacity>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailCenter: {
    alignItems: 'center',
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    minWidth: 80,
  },
  editAction: {
    backgroundColor: '#3b82f6',
  },
  deleteAction: {
    backgroundColor: '#ef4444',
  },
  duplicateAction: {
    backgroundColor: '#8b5cf6',
  },
  swipeActionText: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
});