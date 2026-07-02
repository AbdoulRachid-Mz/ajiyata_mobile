import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedView from '@/components/ui/view';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';
import Spacer from '@/components/ui/spacer';
import TextInput from '@/components/ui/text-input';
import KeyboardAvoidingView from '@/components/ui/keyboard-avoiding-view';
import { View, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { budgetFormSchema, BudgetFormData } from '@/lib/validation';
import { useCreateBudget } from '@/features/budgets/hooks';
import { useAppStore } from '@/stores/app-store';
import { CategoryPicker } from '@/features/categories/components/category-picker';
import { generateUUID, getCurrentTimestamp } from '@/utils/uuid';

export default function BudgetCreate() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const createBudget = useCreateBudget();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      limit: '',
      period: 'monthly',
    },
  });

  const onSubmit = async (data: BudgetFormData) => {
    if (!currentAccount) return;

    try {
      await createBudget.mutateAsync({
        id: generateUUID(),
        accountId: currentAccount.id,
        categoryId: data.categoryId,
        limit: data.limit,
        spent: 0,
        period: data.period,
        startDate: new Date(),
        endDate: new Date(), // Calculation logic needed here
        status: 'active',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        deviceId: 'temp-device-id',
        version: 1,
        syncStatus: 'pending',
        metadata: {},
      });
      router.back();
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing.lg }}>
          <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              ← Annuler
            </Button>
            <ThemedText variant="xl" weight="bold">Nouveau budget</ThemedText>
            <View style={{ width: 60 }} />
          </ThemedView>

          <ThemedText variant="sm" weight="medium" style={{ marginBottom: theme.spacing.xs }}>Catégorie</ThemedText>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <CategoryPicker
                accountId={currentAccount?.id || ''}
                selectedId={value}
                type="expense"
                onSelect={(cat) => onChange(cat.id)}
              />
            )}
          />
          {errors.categoryId && (
            <ThemedText variant="xs" style={{ color: theme.colors.destructive, marginTop: theme.spacing.xs }}>
              {errors.categoryId.message}
            </ThemedText>
          )}

          <Spacer height={theme.spacing.lg} />

          <Controller
            control={control}
            name="limit"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Limite de dépenses"
                placeholder="0.00"
                keyboardType="decimal-pad"
                onChangeText={onChange}
                value={value.toString()}
                error={!!errors.limit}
              />
            )}
          />
          {errors.limit && (
            <ThemedText variant="xs" style={{ color: theme.colors.destructive }}>{errors.limit.message}</ThemedText>
          )}

          <Spacer height={theme.spacing.lg} />

          <ThemedText variant="sm" weight="medium" style={{ marginBottom: theme.spacing.xs }}>Période</ThemedText>
          <Controller
            control={control}
            name="period"
            render={({ field: { onChange, value } }) => (
              <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                {['daily', 'weekly', 'monthly'].map((p) => (
                  <Button
                    key={p}
                    variant={value === p ? 'default' : 'outline'}
                    style={{ flex: 1 }}
                    onPress={() => onChange(p)}
                  >
                    {p === 'daily' ? 'Jour' : p === 'weekly' ? 'Semaine' : 'Mois'}
                  </Button>
                ))}
              </View>
            )}
          />

        </ScrollView>

        <ThemedView style={{ padding: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
          <Button
            size="lg"
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          >
            {isSubmitting ? 'Création...' : 'Créer le budget'}
          </Button>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
