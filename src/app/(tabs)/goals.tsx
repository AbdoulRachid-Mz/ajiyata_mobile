import React, { useRef, useState } from "react";
import {
  View,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeAreaView from "@/components/ui/safe-area-view";
import ScrollView from "@/components/ui/scroll-view";
import ThemedText from "@/components/ui/text";
import ThemedView from "@/components/ui/view";
import Modal from "@/components/ui/modal";
import TextInput from "@/components/ui/text-input";
import Button from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { useAppStore } from "@/stores/app-store";
import { useUIStore } from "@/stores/ui-store";
import {
  useSavingGoals,
  useUpdateSavingGoal,
  useDeleteSavingGoal,
} from "@/features/saving-goals/hooks";
import { SavingGoalCard } from "@/components/finance/saving-goal-card";
import { SavingGoalWithRelations } from "@/types";

export default function GoalsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const { setTabBarVisible } = useUIStore();
  
  const lastScrollY = useRef(0);

  const { data: goals, isLoading } = useSavingGoals(currentAccount?.id || "");
  const updateGoal = useUpdateSavingGoal();
  const deleteGoal = useDeleteSavingGoal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "withdraw">("add");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");

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

  const handleEdit = (id: string) => {
    router.push(`/saving-goal-edit?id=${id}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Supprimer l'objectif",
      "Voulez-vous vraiment supprimer cet objectif d'épargne ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteGoal.mutate(id),
        },
      ],
    );
  };

  const openFundsModal = (id: string, type: "add" | "withdraw") => {
    setSelectedGoalId(id);
    setModalType(type);
    setAmountInput("");
    setIsModalOpen(true);
  };

  const handleConfirmFunds = () => {
    if (!selectedGoalId || !amountInput) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un montant valide.");
      return;
    }

    const goal = goals?.find((g) => g.id === selectedGoalId);
    if (!goal) return;

    let newAmount = goal.currentAmount;
    if (modalType === "add") {
      newAmount += amount;
    } else {
      newAmount = Math.max(0, newAmount - amount);
    }

    updateGoal.mutate({
      goalId: selectedGoalId,
      data: { currentAmount: newAmount },
    });

    setIsModalOpen(false);
  };

  const goalsWithRelations = (goals || []).map((g) => ({
    ...g,
    account: currentAccount
      ? {
          id: currentAccount.id,
          userId: currentAccount.userId,
          name: currentAccount.name,
          type: currentAccount.type,
          currency: currentAccount.currency,
        }
      : null,
  })) as SavingGoalWithRelations[];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <ThemedView style={{ marginBottom: theme.spacing.lg }}>
          <ThemedText variant="2xl" weight="bold">
            Objectifs d'épargne
          </ThemedText>
        </ThemedView>

        {!isLoading && goalsWithRelations.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 100,
            }}
          >
            <Ionicons
              name="trophy-outline"
              size={64}
              color={theme.colors.mutedForeground}
            />
            <ThemedText
              color="mutedForeground"
              style={{ marginTop: theme.spacing.md, textAlign: "center" }}
            >
              Vous n'avez pas encore d'objectifs d'épargne. {"\n"}
              Créez-en un pour suivre vos économies !
            </ThemedText>
          </View>
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {goalsWithRelations.map((goal) => (
              <SavingGoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => handleEdit(goal.id)}
                onDelete={() => handleDelete(goal.id)}
                onAddFunds={() => openFundsModal(goal.id, "add")}
                onWithdraw={() => openFundsModal(goal.id, "withdraw")}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 100,
          right: theme.spacing.lg,
          backgroundColor: theme.colors.primary,
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
        onPress={() => router.push("/saving-goal-create")}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modal Add/Withdraw Funds */}
      <Modal visible={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ThemedView style={{ padding: theme.spacing.lg }}>
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.md }}
          >
            {modalType === "add" ? "Ajouter des fonds" : "Retirer des fonds"}
          </ThemedText>
          <TextInput
            label="Montant"
            placeholder="0.00"
            keyboardType="numeric"
            value={amountInput}
            onChangeText={setAmountInput}
            style={{ marginBottom: theme.spacing.lg }}
          />
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Button
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => setIsModalOpen(false)}
            >
              Annuler
            </Button>
            <Button style={{ flex: 1 }} onPress={handleConfirmFunds}>
              Confirmer
            </Button>
          </View>
        </ThemedView>
      </Modal>
    </SafeAreaView>
  );
}
