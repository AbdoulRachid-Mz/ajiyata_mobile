import Card from "@/components/ui/card";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import { useTheme } from "@/contexts/theme-context";
import { formatCurrency } from "@/lib/formatters/currency";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

interface BalanceCardProps {
  balance: number;
  income: number;
  expense: number;
  currency: string;
  transactionsCount?: number;
}

export const BalanceCard = ({
  balance,
  income,
  expense,
  currency,
  transactionsCount = 0,
}: BalanceCardProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  // `balance` is already the final calculated balance from calculateFinancialSummary
  const finalBalance = balance || 0;
  const isExceeded = finalBalance < 0;
  const balanceLength = formatCurrency(finalBalance, currency).length;
  let balanceStyleSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  
  if (balanceLength > 12) {
    balanceStyleSize = 'xl';
  } else if (balanceLength > 10) {
    balanceStyleSize = '2xl';
  } else if (balanceLength > 7) {
    balanceStyleSize = '3xl';
  } else {
    balanceStyleSize = '4xl';
  }

  return (
    <Card
      style={{
        marginBottom: theme.spacing.lg,
        padding: 0,
        borderRadius: theme.borderRadius.xl,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary + "CC"]}
        style={{ padding: theme.spacing.xl }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: theme.spacing.sm,
          }}
        >
          <View>
            <ThemedText variant="sm" color="primaryForeground">
              {t('balance_card.total_balance')}
            </ThemedText>
            <ThemedText variant={balanceStyleSize} weight="bold">
              {formatCurrency(finalBalance , currency)}
            </ThemedText>
          </View>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: "rgba(255,255,255,0.2)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="wallet"
              size={28}
              color={theme.colors.primaryForeground}
            />
          </View>
        </View>

        <Spacer height={theme.spacing.lg} />

        <View style={{ flexDirection: "row", gap: theme.spacing.lg }}>
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <Ionicons
                name="trending-up"
                size={16}
                color={theme.financialColors.income}
              />
              <ThemedText
                variant="sm"
                color="primaryForeground"
                style={{ opacity: 0.8 }}
              >
                {t('balance_card.income')}
              </ThemedText>
            </View>
            <ThemedText
              variant="lg"
              weight="semibold"
              style={{ color: theme.financialColors.income }}
            >
              + {formatCurrency(income, currency)}
            </ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <Ionicons
                name="trending-down"
                size={16}
                color={theme.financialColors.expense}
              />
              <ThemedText
                variant="sm"
                color="primaryForeground"
                style={{ opacity: 0.8 }}
              >
                {t('balance_card.expense')}
              </ThemedText>
            </View>
            <ThemedText
              variant="lg"
              weight="semibold"
              style={{ color: theme.financialColors.expense }}
            >
              - {formatCurrency(expense, currency)}
            </ThemedText>

            {/* <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <Ionicons
                name="document-text"
                size={16}
                color={theme.financialColors.transactionsCount}
              />
              <ThemedText
                variant="sm"
                color="primaryForeground"
                style={{ opacity: 0.8 }}
              >
                Transactions
              </ThemedText>
            </View>
            <ThemedText
              variant="xs"
              color="mutedForeground"
              style={{ textAlign: "center", marginBottom: theme.spacing.xs }}
            >
              {transactionsCount} transactions
            </ThemedText> */}
          </View>
        </View>
      </LinearGradient>
    </Card>
  );
};
