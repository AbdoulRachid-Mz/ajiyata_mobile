import React, { useState, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedText from "@/components/ui/text";
import ThemedView from "@/components/ui/view";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { useAppStore } from "@/stores/app-store";
import { useTransactions } from "@/features/transactions/hooks";
import { useBudgets } from "@/features/budgets/hooks";
import { useSavingGoals } from "@/features/saving-goals/hooks";
import { useCategories } from "@/features/categories/hooks";
import { structuredExport } from "@/lib/export/structured-export";

type ExportFormat = "json" | "csv";
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
  { key: "csv", label: "CSV", icon: "document-text-outline" },
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
  const [isExporting, setIsExporting] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    freeSpace: number;
    isEnough: boolean;
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
    if (
      counts.transactions === 0 &&
      counts.budgets === 0 &&
      counts.goals === 0
    ) {
      Alert.alert("Aucune donnée", "Aucune donnée à exporter.");
      return;
    }

    // Vérifier l'espace disque
    const storage = await structuredExport.getStorageInfo();
    if (!storage.isEnough) {
      Alert.alert(
        "Espace insuffisant",
        `Il ne reste que ${formatSize(storage.freeSpace)} d'espace libre. Libérez de l'espace pour exporter.`,
      );
      return;
    }

    setIsExporting(true);

    try {
      const result = await structuredExport.exportAllData({
        transactions:
          exportType === "all" || exportType === "transactions"
            ? transactions
            : [],
        budgets:
          exportType === "all" || exportType === "budgets" ? budgets : [],
        goals: exportType === "all" || exportType === "goals" ? goals : [],
        categories,
        account: currentAccount || undefined,
      });

      if (result.success) {
        Alert.alert(
          "Export terminé !",
          `${result.message}\n\nLes fichiers sont sauvegardés dans:\n${result.rootPath}\n\n${result.files.length} fichiers générés.`,
          [
            { text: "OK" },
            {
              text: "Voir les fichiers",
              onPress: () => {
                // Ouvrir le dossier (fonctionnalité à ajouter avec un gestionnaire de fichiers)
              },
            },
          ],
        );
      } else {
        Alert.alert("Erreur", result.message);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error?.message || "Erreur lors de l'export.");
    } finally {
      setIsExporting(false);
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

        {/* Structure d'export */}
        <Card
          style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}
        >
          <ThemedText
            variant="sm"
            weight="semibold"
            style={{ marginBottom: theme.spacing.sm }}
          >
            📁 Structure d'export
          </ThemedText>
          <ThemedText
            variant="xs"
            color="mutedForeground"
            style={{ lineHeight: 18 }}
          >
            Les fichiers seront organisés comme suit :{"\n"}
            {"  📁 ajiyata/\n"}
            {"    📁 transactions/\n"}
            {"      📁 income/\n"}
            {"      📁 expense/\n"}
            {"      📁 transfer/\n"}
            {"      📁 by_category/\n"}
            {"    📁 budgets/\n"}
            {"      📁 active/\n"}
            {"      📁 completed/\n"}
            {"      📁 exceeded/\n"}
            {"    📁 goals/\n"}
            {"      📁 active/\n"}
            {"      📁 completed/\n"}
            {"      📁 paused/\n"}
            {"    📁 categories/\n"}
            {"    📁 reports/\n"}
          </ThemedText>
        </Card>

        {/* Stockage info */}
        {storageInfo && (
          <Card
            style={{
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
            }}
          >
            <ThemedText
              variant="sm"
              weight="semibold"
              style={{ marginBottom: theme.spacing.sm }}
            >
              💾 Espace disponible
            </ThemedText>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <ThemedText variant="xs" color="mutedForeground">
                Espace libre
              </ThemedText>
              <ThemedText variant="xs" weight="bold">
                {formatSize(storageInfo.freeSpace)}
              </ThemedText>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Footer */}
      <ThemedView
        style={{
          padding: theme.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
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
                {getSelectedCount() > 1 ? "s" : ""})
              </ThemedText>
            </View>
          )}
        </Button>
      </ThemedView>
    </SafeAreaView>
  );
}
