import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import ThemedText from "@/components/ui/text";
import { useTheme } from "@/contexts/theme-context";
import { Transaction } from "@/types";
import { formatAmountWithSign } from "@/lib/formatters/currency";

// Types pour les actions
interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
  onLongPress?: (transaction: Transaction) => void;
  onDoubleTap?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onSwipeLeft?: (transaction: Transaction) => void;
  onSwipeRight?: (transaction: Transaction) => void;
  showActions?: boolean;
  style?: ViewStyle;
}

export const TransactionItem = ({
  transaction,
  onPress,
  onLongPress,
  onDoubleTap,
  onDelete,
  onEdit,
  onSwipeLeft,
  onSwipeRight,
  showActions = true,
  style,
}: TransactionItemProps) => {
  const { theme } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const lastTap = useRef<number>(0);

  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";

  // Gestion du double tap
  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (onDoubleTap) {
        onDoubleTap(transaction);
      } else if (onEdit) {
        onEdit(transaction);
      }
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      // Simple tap avec délai pour exécuter l'action
      setTimeout(() => {
        if (lastTap.current !== 0 && onPress) {
          onPress(transaction);
        }
        lastTap.current = 0;
      }, DOUBLE_TAP_DELAY + 50);
    }
  };

  // Gestion du long press
  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (onLongPress) {
      onLongPress(transaction);
    }
  };

  // Render des actions de swipe
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 0],
    });

    return (
      <Animated.View
        style={[
          styles.swipeAction,
          styles.swipeRightAction,
          { transform: [{ translateX }] },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeActionButton}
          onPress={() => {
            if (onSwipeRight) {
              onSwipeRight(transaction);
            }
            swipeableRef.current?.close();
          }}
        >
          <Ionicons name="checkmark-circle" size={28} color="#fff" />
          <ThemedText style={styles.swipeActionText} color="primaryForeground">
            Valider
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    return (
      <Animated.View
        style={[
          styles.swipeAction,
          styles.swipeLeftActions,
          { transform: [{ translateX }] },
        ]}
      >
        {/* Action Modifier */}
        <TouchableOpacity
          style={[styles.swipeActionButton, styles.editAction]}
          onPress={() => {
            if (onEdit) {
              onEdit(transaction);
            }
            swipeableRef.current?.close();
          }}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
          <ThemedText style={styles.swipeActionText} color="primaryForeground">
            Modifier
          </ThemedText>
        </TouchableOpacity>

        {/* Action Supprimer */}
        <TouchableOpacity
          style={[styles.swipeActionButton, styles.deleteAction]}
          onPress={() => {
            if (onDelete) {
              onDelete(transaction);
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
        renderLeftActions={showActions ? renderLeftActions : undefined}
        renderRightActions={showActions ? renderRightActions : undefined}
        overshootLeft={false}
        overshootRight={false}
        onSwipeableLeftOpen={() => {
          if (onSwipeLeft) {
            onSwipeLeft(transaction);
          }
        }}
        onSwipeableRightOpen={() => {
          if (onSwipeRight) {
            onSwipeRight(transaction);
          }
        }}
        friction={2}
        rightThreshold={40}
        leftThreshold={40}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
        >
          <View
            style={[
              styles.container,
              style,
              {
                backgroundColor: theme.colors.card,
                borderBottomColor: theme.colors.border,
                paddingVertical: 14,
              },
            ]}
          >
            {/* Indicateur de type */}
            <View
              style={[
                styles.typeIndicator,
                {
                  backgroundColor: isIncome
                    ? theme.financialColors.income
                    : isExpense
                      ? theme.financialColors.expense
                      : theme.financialColors.budget,
                },
              ]}
            />

            {/* Icône */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isIncome
                    ? theme.financialColors.income + "20"
                    : isExpense
                      ? theme.financialColors.expense + "20"
                      : theme.financialColors.budget + "20",
                },
              ]}
            >
              <Ionicons
                name={
                  isIncome
                    ? "arrow-up"
                    : isExpense
                      ? "arrow-down"
                      : "swap-horizontal"
                }
                size={20}
                color={
                  isIncome
                    ? theme.financialColors.income
                    : isExpense
                      ? theme.financialColors.expense
                      : theme.financialColors.budget
                }
              />
            </View>

            {/* Contenu */}
            <View style={styles.content}>
              <ThemedText weight="semibold" numberOfLines={1}>
                {transaction.title}
              </ThemedText>
              {transaction.metadata?.client && (
                <ThemedText variant="xs" color="primary" numberOfLines={1}>
                  🏢 Client/Fournisseur : {transaction.metadata.client}
                </ThemedText>
              )}
              {transaction.metadata?.paidBy && (
                <ThemedText variant="xs" color="primary" numberOfLines={1}>
                  👤 Payé par : {transaction.metadata.paidBy}
                </ThemedText>
              )}
              <View style={styles.metaContainer}>
                <ThemedText variant="sm" color="mutedForeground">
                  {new Date(transaction.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </ThemedText>
                {transaction.categoryId && (
                  <>
                    <View style={styles.dot} />
                    <ThemedText variant="sm" color="mutedForeground">
                      Catégorie
                    </ThemedText>
                  </>
                )}
              </View>
            </View>

            {/* Montant */}
            <ThemedText
              weight="bold"
              style={{
                color: isIncome
                  ? theme.financialColors.income
                  : isExpense
                    ? theme.financialColors.expense
                    : theme.financialColors.budget,
                fontSize: 16,
              }}
            >
              {formatAmountWithSign(
                transaction.amount,
                transaction.type,
                transaction.currency,
              )}
            </ThemedText>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    position: "relative",
  },
  typeIndicator: {
    position: "absolute",
    left: 0,
    top: "10%",
    bottom: "10%",
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#94a3b8",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  swipeRightAction: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 16,
  },
  swipeLeftActions: {
    flexDirection: "row",
    backgroundColor: "transparent",
  },
  swipeActionButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    height: "100%",
    minWidth: 80,
  },
  editAction: {
    backgroundColor: "#3b82f6",
  },
  deleteAction: {
    backgroundColor: "#ef4444",
  },
  swipeActionText: {
    color: "#ffffff",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600",
  },
});
