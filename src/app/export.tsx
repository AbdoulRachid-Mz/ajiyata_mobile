import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedText from "@/components/ui/text";
import ThemedView from "@/components/ui/view";
import { useTheme } from "@/contexts/theme-context";
import { useBudgets } from "@/features/budgets/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useSavingGoals } from "@/features/saving-goals/hooks";
import { useTransactions } from "@/features/transactions/hooks";
import { exportData } from "@/lib/export/export-service";
import { structuredExport } from "@/lib/export/structured-export";
import { useAppStore } from "@/stores/app-store";

type ExportFormat = "json" | "excel" | "pdf";
type ExportType = "transactions" | "budgets" | "goals" | "all";

const TYPE_OPTIONS: {
  key: ExportType;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    key: "all",
    label: "Tout exporter",
    icon: "folder-outline",
    desc: "Export complet de toutes vos données",
  },
  {
    key: "transactions",
    label: "Transactions",
    icon: "list-outline",
    desc: "Export des transactions",
  },
  {
    key: "budgets",
    label: "Budgets",
    icon: "wallet-outline",
    desc: "Export des budgets",
  },
  {
    key: "goals",
    label: "Objectifs",
    icon: "trophy-outline",
    desc: "Export des objectifs d'épargne",
  },
];

const FORMAT_OPTIONS: { key: ExportFormat; label: string; icon: string }[] = [
  { key: "json", label: "JSON", icon: "code-slash-outline" },
  { key: "excel", label: "Excel", icon: "document-text-outline" },
  { key: "pdf", label: "PDF", icon: "document-outline" },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ExportScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();

  const { data: transactions } = useTransactions(currentAccount?.id || "");
  const { data: budgets } = useBudgets(currentAccount?.id || "");
  const { data: goals } = useSavingGoals(currentAccount?.id || "");
  const { data: categories } = useCategories(currentAccount?.id || "");

  const [exportType, setExportType] = useState<ExportType>("all");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
    files?: string[];
    rootPath?: string;
  } | null>(null);

  const currency = currentAccount?.currency || "XOF";

  const counts = useMemo(
    () => ({
      transactions: transactions?.length || 0,
      budgets: budgets?.length || 0,
      goals: goals?.length || 0,
      categories: categories?.length || 0,
    }),
    [transactions, budgets, goals, categories],
  );

  const handleExport = async () => {
    const selectedTransactions =
      exportType === "all" || exportType === "transactions" ? transactions : [];

    if (!selectedTransactions || selectedTransactions.length === 0) {
      Alert.alert(
        "Aucune donnée",
        "Seules les transactions peuvent être exportées en PDF/Excel pour l'instant.",
      );
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      if (exportFormat === "json" && exportType !== "transactions") {
        // Use structured export for all data types
        const result = await structuredExport.exportAllData({
          transactions: selectedTransactions,
          budgets:
            exportType === "all" || exportType === "budgets" ? budgets : [],
          goals: exportType === "all" || exportType === "goals" ? goals : [],
          categories,
          account: currentAccount || undefined,
        });

        setExportResult(result);
        Toast.show({ type: "success", text1: result.message });
      } else {
        // Use export service for transactions
        await exportData({
          format: exportFormat,
          transactions: selectedTransactions || [],
          accountName: currentAccount?.name,
          currency: currency,
          categories: categories || [],
        });
        Toast.show({ type: "success", text1: "Export terminé avec succès !" });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error?.message || "Erreur lors de l'export.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (exportResult?.files && exportResult.files.length > 0) {
        // Share the first file (simplified)
        await Sharing.shareAsync(exportResult.files[0], {
          dialogTitle: "Partager l'export",
        });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Erreur lors du partage." });
    }
  };

  const getSelectedCount = () => {
    switch (exportType) {
      case "all":
        return counts.transactions + counts.budgets + counts.goals;
      case "transactions":
        return counts.transactions;
      case "budgets":
        return counts.budgets;
      case "goals":
        return counts.goals;
      default:
        return 0;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40 }}
      >
        {/* Header */}
        <ThemedView
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <ThemedText variant="2xl" weight="bold">
            Exporter les données
          </ThemedText>
        </ThemedView>

        {/* Type selection */}
        <ThemedText
          variant="sm"
          weight="semibold"
          style={{ marginBottom: theme.spacing.sm }}
        >
          Quelles données exporter ?
        </ThemedText>
        <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {TYPE_OPTIONS.map((opt) => {
            const count =
              opt.key === "all"
                ? counts.transactions + counts.budgets + counts.goals
                : opt.key === "transactions"
                  ? counts.transactions
                  : opt.key === "budgets"
                    ? counts.budgets
                    : counts.goals;

            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setExportType(opt.key)}
                activeOpacity={0.7}
                disabled={count === 0 && opt.key !== "all"}
              >
                <Card
                  style={{
                    padding: theme.spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.md,
                    borderWidth: exportType === opt.key ? 2 : 1,
                    borderColor:
                      exportType === opt.key
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor:
                      exportType === opt.key
                        ? theme.colors.primary + "08"
                        : theme.colors.card,
                    opacity: count === 0 && opt.key !== "all" ? 0.5 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor:
                        exportType === opt.key
                          ? theme.colors.primary + "20"
                          : theme.colors.muted,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={22}
                      color={
                        exportType === opt.key
                          ? theme.colors.primary
                          : theme.colors.mutedForeground
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="base" weight="semibold">
                      {opt.label}
                    </ThemedText>
                    <ThemedText variant="xs" color="mutedForeground">
                      {opt.desc} ({count} élément{count > 1 ? "s" : ""})
                    </ThemedText>
                  </View>
                  {exportType === opt.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Format selection */}
        <ThemedText
          variant="sm"
          weight="semibold"
          style={{ marginBottom: theme.spacing.sm }}
        >
          Format d'export
        </ThemedText>
        <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {FORMAT_OPTIONS.map((opt) => {
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setExportFormat(opt.key)}
                activeOpacity={0.7}
              >
                <Card
                  style={{
                    padding: theme.spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.md,
                    borderWidth: exportFormat === opt.key ? 2 : 1,
                    borderColor:
                      exportFormat === opt.key
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor:
                      exportFormat === opt.key
                        ? theme.colors.primary + "08"
                        : theme.colors.card,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor:
                        exportFormat === opt.key
                          ? theme.colors.primary + "20"
                          : theme.colors.muted,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={22}
                      color={
                        exportFormat === opt.key
                          ? theme.colors.primary
                          : theme.colors.mutedForeground
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="base" weight="semibold">
                      {opt.label}
                    </ThemedText>
                  </View>
                  {exportFormat === opt.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.primary}
                    />
                  )}
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Prévisualisation */}
        <Card
          style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}
        >
          <ThemedText
            variant="sm"
            weight="semibold"
            style={{ marginBottom: theme.spacing.sm }}
          >
            Résumé de l'export
          </ThemedText>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <ThemedText variant="xs" color="mutedForeground">
              Transactions
            </ThemedText>
            <ThemedText variant="xs" weight="bold">
              {counts.transactions}
            </ThemedText>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <ThemedText variant="xs" color="mutedForeground">
              Budgets
            </ThemedText>
            <ThemedText variant="xs" weight="bold">
              {counts.budgets}
            </ThemedText>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <ThemedText variant="xs" color="mutedForeground">
              Objectifs d'épargne
            </ThemedText>
            <ThemedText variant="xs" weight="bold">
              {counts.goals}
            </ThemedText>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <ThemedText variant="xs" color="mutedForeground">
              Catégories
            </ThemedText>
            <ThemedText variant="xs" weight="bold">
              {counts.categories}
            </ThemedText>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <ThemedView
        style={{
          padding: theme.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          gap: theme.spacing.sm,
        }}
      >
        <Button
          size="lg"
          disabled={isExporting || getSelectedCount() === 0}
          onPress={handleExport}
        >
          {isExporting ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                Exportation...
              </ThemedText>
            </View>
          ) : (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
              <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                Exporter ({getSelectedCount()} élément
                {getSelectedCount() > 1 ? "s" : ""}
              </ThemedText>
            </View>
          )}
        </Button>

        {exportResult?.success && (
          <Button variant="secondary" size="lg" onPress={handleShare}>
            <Ionicons name="share-outline" size={20} />
            <ThemedText style={{ marginLeft: 8, fontWeight: "600" }}>
              Partager
            </ThemedText>
          </Button>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
