import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScrollView, View, Alert, ActivityIndicator } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';

// Hooks et contextes
import { useTheme } from '@/contexts/theme-context';
import { useAppStore } from '@/stores/app-store';
import { useTransactions, useUpdateTransaction } from '@/features/transactions/hooks';
import { useCategories } from '@/features/categories/hooks';

// Composants UI
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedView from '@/components/ui/view';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';
import TextInput from '@/components/ui/text-input';
import Spacer from '@/components/ui/spacer';
import { CategoryPicker } from '@/features/categories/components/category-picker';

// Validation
import {
  TransactionFormData,
  TransactionFormInput,
  transactionFormSchema,
} from '@/lib/validation';

// Utilitaires
import { getCurrentTimestamp } from '@/utils/uuid';

export default function TransactionEdit() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentAccount } = useAppStore();

  // Données
  const { data: transactions, isLoading: isLoadingTx } = useTransactions(currentAccount?.id || '');
  const { data: categories } = useCategories(currentAccount?.id || '');
  const updateTransaction = useUpdateTransaction();

  // Trouver la transaction
  const transaction = transactions?.find(tx => tx.id === id);

  // États
  const [isLoading, setIsLoading] = useState(true);

  // Formulaire
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormInput, any, TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'expense',
      amount: '0',
      title: '',
      date: new Date(),
      note: '',
      categoryId: null,
    },
  });

  const selectedType = watch('type');

  // Initialiser le formulaire avec les données de la transaction
  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount.toString(),
        title: transaction.title,
        date: new Date(transaction.date),
        note: transaction.note || '',
        categoryId: transaction.categoryId || null,
      });
      setIsLoading(false);
    } else if (!isLoadingTx) {
      // Transaction non trouvée
      Alert.alert('Erreur', 'Transaction introuvable');
      router.back();
    }
  }, [transaction, isLoadingTx]);

  // Soumission
  const onSubmit = async (data: TransactionFormData) => {
    if (!currentAccount || !transaction) return;

    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        accountId: currentAccount.id,
        title: data.title,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId || null,
        note: data.note || null,
        date: data.date,
        currency: currentAccount.currency,
        updatedAt: getCurrentTimestamp(),
      });
      router.back();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      Alert.alert('Erreur', 'Impossible de modifier la transaction.');
    }
  };

  // Chargement
  if (isLoading || isLoadingTx) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={{ marginTop: 16 }} color="mutedForeground">
            Chargement...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg }}>
          <ThemedText variant="xl" weight="bold" style={{ marginBottom: 8 }}>
            Transaction introuvable
          </ThemedText>
          <ThemedText color="mutedForeground" style={{ textAlign: 'center' }}>
            La transaction que vous cherchez n'existe pas ou a été supprimée.
          </ThemedText>
          <Spacer height={theme.spacing.lg} />
          <Button onPress={() => router.back()}>Retour</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
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
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </Button>
          <ThemedText variant="xl" weight="bold">
            Modifier la transaction
          </ThemedText>
          <View style={{ width: 44 }} />
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
                flexDirection: 'row',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.lg,
              }}
            >
              <Button
                variant={value === 'income' ? 'default' : 'outline'}
                style={{
                  flex: 1,
                  borderColor:
                    value === 'income'
                      ? theme.financialColors.income
                      : theme.colors.border,
                }}
                size="sm"
                onPress={() => onChange('income')}
              >
                Revenu
              </Button>
              <Button
                variant={value === 'expense' ? 'default' : 'outline'}
                style={{
                  flex: 1,
                  borderColor:
                    value === 'expense'
                      ? theme.financialColors.expense
                      : theme.colors.border,
                }}
                size="sm"
                onPress={() => onChange('expense')}
              >
                Dépense
              </Button>
              <Button
                variant={value === 'transfer' ? 'default' : 'outline'}
                style={{ flex: 1 }}
                size="sm"
                onPress={() => onChange('transfer')}
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
              accountId={currentAccount?.id || ''}
              selectedId={value}
              type={selectedType === 'transfer' ? undefined : selectedType}
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
              value={value || ''}
              multiline
              style={{ marginBottom: theme.spacing.lg, minHeight: 80 }}
            />
          )}
        />

        {/* Date (lecture seule) */}
        <ThemedText variant="sm" color="mutedForeground" style={{ marginBottom: 4 }}>
          Date de création
        </ThemedText>
        <ThemedText style={{ marginBottom: theme.spacing.lg }}>
          {new Date(transaction.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </ThemedText>

        <Spacer height={theme.spacing.lg} />

        {/* Boutons d'action */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Button
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => router.back()}
          >
            Annuler
          </Button>
          <Button
            style={{ flex: 2 }}
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}