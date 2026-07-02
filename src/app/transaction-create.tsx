import Button from "@/components/ui/button";
import KeyboardAvoidingView from "@/components/ui/keyboard-avoiding-view";
import SafeAreaView from "@/components/ui/safe-area-view";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import ThemedView from "@/components/ui/view";
import { useTheme } from "@/contexts/theme-context";
import { CategoryPicker } from "@/features/categories/components/category-picker";
import { useCreateTransaction } from "@/features/transactions/hooks";
import {
  TransactionFormData,
  TransactionFormInput,
  transactionFormSchema,
} from "@/lib/validation";
import { useAppStore } from "@/stores/app-store";
import { generateUUID, getCurrentTimestamp } from "@/utils/uuid";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";
// Ajouter l'import
import { AttachmentPicker } from '@/features/attachments/components/AttachmentPicker';
import { attachmentRepository } from '@/features/attachments/repositories';
import { AttachmentType } from "@/features/attachments/types";
import { Attachment } from "@/types";
import { useState } from "react";

export default function TransactionCreate() {
  const { theme } = useTheme();
  const router = useRouter();
  const { type: initialType } = useLocalSearchParams<{
    type: "income" | "expense" | "transfer";
  }>();
  const { currentAccount } = useAppStore();
  const createTransaction = useCreateTransaction();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<
    TransactionFormInput,
    any,
    TransactionFormData
  >({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: initialType || "expense",
      amount: "0",
      title: "",
      date: new Date(),
      note: "",
      categoryId: null,
    },
  });

  const selectedType = watch("type");

  const [attachments, setAttachments] = useState<Attachment[]>([]);

// Ajouter les gestionnaires
const handleAttachmentAdded = async (attachment: Attachment) => {
  setAttachments(prev => [...prev, attachment]);
};

const handleAttachmentRemoved = async (attachmentId: string) => {
  await attachmentRepository.delete(attachmentId);
  setAttachments(prev => prev.filter(a => a.id !== attachmentId));
};

  const onSubmit = async (data: TransactionFormData) => {
    if (!currentAccount) return;

    try {
      await createTransaction.mutateAsync({
        id: generateUUID(),
        accountId: currentAccount.id,
        title: data.title,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId || null,
        note: data.note || null,
        date: data.date,
        currency: currentAccount.currency,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        deviceId: "temp-device-id",
        version: 1,
        syncStatus: "pending",
        metadata: {},
        isSynced: false,
      });
      router.back();
    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing.lg }}
        >
          {/* Header */}
          <ThemedView
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={theme.colors.foreground} />
            </Button>
            <ThemedText variant="xl" weight="bold">
              Nouvelle transaction
            </ThemedText>
            <View style={{ width: 60 }} />
          </ThemedView>

          {/* Type selection */}
          <ThemedText
            variant="lg"
            weight="semibold"
            style={{ marginBottom: theme.spacing.md }}
          >
            Type de transaction
          </ThemedText>
          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <View
                style={{
                  flexDirection: "row",
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.lg,
                }}
              >
                <Button
                  variant={value === "income" ? "default" : "outline"}
                  style={{
                    flex: 1,
                    borderColor:
                      value === "income"
                        ? theme.financialColors.income
                        : theme.colors.border,
                  }}
                  size="sm"
                  onPress={() => onChange("income")}
                >
                  Revenu
                </Button>
                <Button
                  variant={value === "expense" ? "default" : "outline"}
                  style={{
                    flex: 1,
                    borderColor:
                      value === "expense"
                        ? theme.financialColors.expense
                        : theme.colors.border,
                  }}
                  size="sm"
                  onPress={() => onChange("expense")}
                >
                  Dépense
                </Button>
                <Button
                  variant={value === "transfer" ? "default" : "outline"}
                  style={{ flex: 1 }}
                  size="sm"
                  onPress={() => onChange("transfer")}
                >
                  Virement
                </Button>
              </View>
            )}
          />

          {/* Amount */}
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Montant"
                placeholder="0.00"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.amount}
                style={{ marginBottom: theme.spacing.xs }}
              />
            )}
          />
          {errors.amount && (
            <ThemedText
              variant="xs"
              style={{
                color: theme.colors.destructive,
                marginBottom: theme.spacing.md,
              }}
            >
              {errors.amount.message}
            </ThemedText>
          )}

          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Titre"
                placeholder="Ex: Achat de nourriture"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.title}
                style={{ marginBottom: theme.spacing.xs }}
              />
            )}
          />
          {errors.title && (
            <ThemedText
              variant="xs"
              style={{
                color: theme.colors.destructive,
                marginBottom: theme.spacing.md,
              }}
            >
              {errors.title.message}
            </ThemedText>
          )}

          {/* Category */}
          <ThemedText
            variant="sm"
            weight="medium"
            style={{ marginBottom: theme.spacing.xs }}
          >
            Catégorie
          </ThemedText>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <CategoryPicker
                accountId={currentAccount?.id || ""}
                selectedId={value}
                type={selectedType === "transfer" ? undefined : selectedType}
                onSelect={(cat) => onChange(cat.id)}
              />
            )}
          />
          {errors.categoryId && (
            <ThemedText
              variant="xs"
              style={{
                color: theme.colors.destructive,
                marginTop: theme.spacing.xs,
                marginBottom: theme.spacing.md,
              }}
            >
              {errors.categoryId.message}
            </ThemedText>
          )}

          <Spacer height={theme.spacing.lg} />

          {/* Note */}
          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Note (optionnel)"
                placeholder="Ajouter une note..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ""}
                multiline
                style={{ marginBottom: theme.spacing.lg, minHeight: 80 }}
              />
            )}
          />

          <View style={{ height: theme.spacing.xl * 2 }} />

          <ThemedText
  variant="sm"
  weight="medium"
  style={{ marginBottom: theme.spacing.xs }}
>
  Pièces jointes ({attachments.length}/5)
</ThemedText>
<AttachmentPicker
  onAttachmentAdded={handleAttachmentAdded}
  onAttachmentRemoved={handleAttachmentRemoved}
  existingAttachments={attachments}
  maxAttachments={5}
/>

<Spacer height={theme.spacing.lg} />
        </ScrollView>

        {/* Save button */}
        <ThemedView
          style={{
            padding: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Button
            size="lg"
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
