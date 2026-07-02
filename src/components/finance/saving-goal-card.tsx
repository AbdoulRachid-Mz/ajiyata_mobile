import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import Card from '@/components/ui/card';
import ThemedText from '@/components/ui/text';
import { useTheme } from '@/contexts/theme-context';
import { formatCurrency } from '@/lib/formatters/currency';
import { SavingGoal, SavingGoalWithRelations } from '@/types';

interface SavingGoalCardProps {
  goal: SavingGoalWithRelations;
  onPress?: (goal: SavingGoal) => void;
  onEdit?: (goal: SavingGoal) => void;
  onDelete?: (goal: SavingGoal) => void;
  onAddFunds?: (goal: SavingGoal) => void;
  onWithdraw?: (goal: SavingGoal) => void;
  showActions?: boolean;
}

export const SavingGoalCard = ({
  goal,
  onPress,
  onEdit,
  onDelete,
  onAddFunds,
  onWithdraw,
  showActions = true,
}: SavingGoalCardProps) => {
  const { theme } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
  const isCompleted = goal.status === 'completed';
  const isPaused = goal.status === 'paused';

  // Haptique pour les actions
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(goal);
    }
  };

  // Render des actions de swipe
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [160, 0],
    });

    return (
      <Animated.View
        style={[
          styles.swipeActionsContainer,
          { transform: [{ translateX }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.swipeAction, styles.addFundsAction]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (onAddFunds) {
              onAddFunds(goal);
            }
            swipeableRef.current?.close();
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <ThemedText style={styles.swipeActionText} color="primaryForeground">
            Ajouter
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, styles.editAction]}
          onPress={() => {
            if (onEdit) {
              onEdit(goal);
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
              onDelete(goal);
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
          <Card style={StyleSheet.flatten([styles.container, { marginBottom: 12 }])}>
            {/* En-tête */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isCompleted
                        ? theme.financialColors.saving + '20'
                        : isPaused
                        ? theme.colors.muted
                        : theme.financialColors.saving + '20',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      isCompleted
                        ? 'checkmark-circle'
                        : isPaused
                        ? 'pause-circle'
                        : 'trending-up'
                    }
                    size={24}
                    color={
                      isCompleted
                        ? theme.financialColors.saving
                        : isPaused
                        ? theme.colors.mutedForeground
                        : theme.financialColors.saving
                    }
                  />
                </View>
                <View>
                  <ThemedText weight="semibold" style={{ fontSize: 16 }}>
                    {goal.title}
                  </ThemedText>
                  {goal.deadline && (
                    <ThemedText variant="xs" color="mutedForeground">
                      Échéance : {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                    </ThemedText>
                  )}
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isCompleted
                      ? theme.financialColors.saving
                      : isPaused
                      ? theme.colors.muted
                      : theme.financialColors.budget,
                  },
                ]}
              >
                <ThemedText
                  variant="xs"
                  weight="medium"
                  style={{
                    color: isCompleted
                      ? '#fff'
                      : isPaused
                      ? theme.colors.mutedForeground
                      : '#fff',
                  }}
                >
                  {isCompleted
                    ? 'Terminé'
                    : isPaused
                    ? 'En pause'
                    : 'Actif'}
                </ThemedText>
              </View>
            </View>

            {/* Progression */}
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: isCompleted
                      ? theme.financialColors.saving
                      : isPaused
                      ? theme.colors.muted
                      : theme.financialColors.saving,
                  },
                ]}
              />
            </View>

            {/* Détails */}
            <View style={styles.details}>
              <View>
                <ThemedText variant="sm" color="mutedForeground">
                  Épargné
                </ThemedText>
                <ThemedText weight="semibold" style={{ fontSize: 18 }}>
                  {formatCurrency(goal.currentAmount, goal.account.currency || 'XOF')}
                </ThemedText>
              </View>

              <View style={styles.detailCenter}>
                <ThemedText variant="sm" color="mutedForeground">
                  Objectif
                </ThemedText>
                <ThemedText weight="semibold" style={{ fontSize: 18 }}>
                  {formatCurrency(goal.targetAmount, goal.account.currency || 'XOF')}
                </ThemedText>
              </View>

              <View style={styles.detailRight}>
                <ThemedText variant="sm" color="mutedForeground">
                  Progression
                </ThemedText>
                <ThemedText
                  weight="bold"
                  style={{
                    fontSize: 18,
                    color: isCompleted
                      ? theme.financialColors.saving
                      : isPaused
                      ? theme.colors.mutedForeground
                      : theme.financialColors.saving,
                  }}
                >
                  {Math.round(progress * 100)}%
                </ThemedText>
              </View>
            </View>

            {/* Actions rapides */}
            {!isCompleted && !isPaused && onAddFunds && (
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[
                    styles.quickAction,
                    {
                      backgroundColor: theme.financialColors.saving + '15',
                      borderColor: theme.financialColors.saving + '30',
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (onAddFunds) {
                      onAddFunds(goal);
                    }
                  }}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={theme.financialColors.saving}
                  />
                  <ThemedText variant="sm" style={{ color: theme.financialColors.saving }}>
                    Ajouter des fonds
                  </ThemedText>
                </TouchableOpacity>

                {onWithdraw && (
                  <TouchableOpacity
                    style={[
                      styles.quickAction,
                      {
                        backgroundColor: theme.colors.destructive + '15',
                        borderColor: theme.colors.destructive + '30',
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (onWithdraw) {
                        onWithdraw(goal);
                      }
                    }}
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={theme.colors.destructive}
                    />
                    <ThemedText variant="sm" style={{ color: theme.colors.destructive }}>
                      Retirer
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
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
  addFundsAction: {
    backgroundColor: '#22c55e',
  },
  swipeActionText: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
});