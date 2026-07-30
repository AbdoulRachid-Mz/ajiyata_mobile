// src/app/transaction-details.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ScrollView, Alert, Share, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

// Hooks et contextes
import { useTheme } from '@/contexts/theme-context';
import { useAppStore } from '@/stores/app-store';
import { useTransactions } from '@/features/transactions/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useDeleteTransaction } from '@/features/transactions/hooks';

// attachments
import { attachmentRepository } from '@/features/attachments/repositories';
import { getCloudinaryImageUrl } from '@/configs/cloudinary';

// Composants UI
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedView from '@/components/ui/view';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Spacer from '@/components/ui/spacer';
import { Badge } from '@/components/ui/badge';
import { TransactionItem } from '@/components/finance/transaction-item';

// Utilitaires
import { formatCurrency } from '@/lib/formatters/currency';
import { Attachment, Transaction } from '@/types';

export default function TransactionDetails() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentAccount } = useAppStore();

  // Données
  const { data: transactions, isLoading } = useTransactions(currentAccount?.id || '');
  const { data: categories } = useCategories(currentAccount?.id || '');
  const deleteTransaction = useDeleteTransaction(currentAccount?.id || '');

  // Ajouter l'état
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Trouver la transaction
  const transaction = useMemo(() => {
    if (!transactions) return null;
    return transactions.find(tx => tx.id === id);
  }, [transactions, id]);

  // Trouver la catégorie
  const category = useMemo(() => {
    if (!categories || !transaction?.categoryId) return null;
    return categories.find(cat => cat.id === transaction.categoryId);
  }, [categories, transaction]);

  // Transactions de la même catégorie
  const sameCategoryTransactions = useMemo(() => {
    if (!transactions || !transaction?.categoryId) return [];
    return transactions.filter(tx => 
      tx.categoryId === transaction.categoryId && tx.id !== transaction.id
    ).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, transaction]);

  // États
  const [isDeleting, setIsDeleting] = useState(false);

  // Gestionnaires
  const handleDelete = () => {
    Alert.alert(
      t('transactions.delete_title'),
      t('transactions.delete_confirm_details', { title: transaction?.title || '' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteTransaction.mutateAsync(id);
              router.back();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert(t('common.error'), t('errors.delete_failed'));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Charger les attachments
  useEffect(() => {
    if (transaction?.id) {
      loadAttachments();
    }
  }, [transaction?.id]);

  const loadAttachments = async () => {
    if (!transaction?.id) return;
    const data = await attachmentRepository.getAllForTransaction(transaction.id);
    setAttachments(data);
  };

  const handleEdit = () => {
    router.push({
      pathname: '/transaction-edit',
      params: { id: transaction?.id },
    });
  };

  const handleShare = async () => {
    if (!transaction) return;
    try {
      const isIncome = transaction.type === 'income';
      const transactionType = transaction.type === 'income' 
        ? t('finance.income') 
        : transaction.type === 'expense' 
          ? t('finance.expense') 
          : t('finance.transfer');
      const amountLabel = `${isIncome ? '+' : '-'} ${formatCurrency(transaction.amount, transaction.currency)}`;
      
      const lines = [
        '📊 *Ajiya Ta - Transaction*',
        '',
        `📌 *${transaction.title}*`,
        `💰 ${t('finance.amount')}: ${amountLabel}`,
        `📅 ${t('finance.date')}: ${format(new Date(transaction.date), 'dd MMMM yyyy', { locale: fr })}`,
        `📂 ${t('transactions.type')}: ${transactionType}`,
      ];

      if (category) lines.push(`🏷️ ${t('finance.category')}: ${category.name}`);
      if (transaction.note) lines.push(`📝 ${t('finance.note')}: ${transaction.note}`);
      
      lines.push('');
      lines.push('---');
      lines.push('Ajiya Ta - Gestion financière simplifiée');

      const message = lines.join('\n').trim();

      await Share.share({
        message,
        title: t('transactions.share_title'),
      });
    } catch (error) {
      console.error('Erreur de partage:', error);
    }
  };

  // Chargement
  if (isLoading || !transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={{ marginTop: 16 }} color="mutedForeground">
            {t('common.loading')}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';

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
            {t('transactions.details')}
          </ThemedText>
          <View style={{ width: 44 }} />
        </ThemedView>

        {/* Carte principale */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.xl, overflow: 'hidden' }}>
          {/* Icône et type */}
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isIncome
                  ? theme.financialColors.income + '20'
                  : isExpense
                  ? theme.financialColors.expense + '20'
                  : theme.financialColors.budget + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: theme.spacing.sm,
              }}
            >
              <Ionicons
                name={
                  isIncome
                    ? 'arrow-up'
                    : isExpense
                    ? 'arrow-down'
                    : 'swap-horizontal'
                }
                size={40}
                color={
                  isIncome
                    ? theme.financialColors.income
                    : isExpense
                    ? theme.financialColors.expense
                    : theme.financialColors.budget
                }
              />
            </View>
            <Badge
              variant={isIncome ? 'success' : isExpense ? 'destructive' : 'warning'}
              style={{ marginTop: 4, paddingHorizontal: 16 }}
            >
              {isIncome ? t('finance.income') : isExpense ? t('finance.expense') : t('finance.transfer')}
            </Badge>
          </View>

          {/* Montant */}
          <ThemedText
            variant="4xl"
            weight="bold"
            style={{
              textAlign: 'center',
              color: isIncome
                ? theme.financialColors.income
                : isExpense
                ? theme.financialColors.expense
                : theme.financialColors.budget,
              marginBottom: theme.spacing.xs,
            }}
          >
            {isIncome ? '+' : isExpense ? '-' : ''}
            {formatCurrency(transaction.amount, transaction.currency)}
          </ThemedText>

          <ThemedText
            variant="lg"
            weight="semibold"
            style={{ textAlign: 'center', marginBottom: theme.spacing.md }}
          >
            {transaction.title}
          </ThemedText>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: theme.colors.border,
              marginVertical: theme.spacing.md,
            }}
          />
        </Card>

        {/* Informations détaillées */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.xl }}>
          <ThemedText variant="lg" weight="semibold" style={{ marginBottom: theme.spacing.md }}>
            {t('transactions.information')}
          </ThemedText>

          {/* Date */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.mutedForeground} />
              <ThemedText color="mutedForeground">{t('finance.date')}</ThemedText>
            </View>
            <ThemedText weight="medium">
              {format(new Date(transaction.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </ThemedText>
          </View>

          {/* Catégorie */}
          {category && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pricetag-outline" size={18} color={theme.colors.mutedForeground} />
                <ThemedText color="mutedForeground">{t('finance.category')}</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: category.color,
                  }}
                />
                <ThemedText weight="medium">{category.name}</ThemedText>
              </View>
            </View>
          )}

          {/* Devise */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="cash-outline" size={18} color={theme.colors.mutedForeground} />
              <ThemedText color="mutedForeground">{t('settings.currency')}</ThemedText>
            </View>
            <ThemedText weight="medium">{transaction.currency}</ThemedText>
          </View>

          {/* Note */}
          {transaction.note && (
            <View style={{ marginTop: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ionicons name="document-text-outline" size={18} color={theme.colors.mutedForeground} />
                <ThemedText color="mutedForeground">{t('finance.note')}</ThemedText>
              </View>
              <Card style={{ padding: theme.spacing.md, backgroundColor: theme.colors.muted }}>
                <ThemedText>{transaction.note}</ThemedText>
              </Card>
            </View>
          )}
        </Card>

        {/* Attachments */}
        {attachments.length > 0 && (
          <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.xl }}>
            <ThemedText variant="lg" weight="semibold" style={{ marginBottom: theme.spacing.md }}>
              {t('transactions.attachments')}
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {attachments.map((attachment) => (
                  <TouchableOpacity
                    key={attachment.id}
                    onPress={() => {
                      router.push({
                        pathname: '/image-viewer',
                        params: { uri: attachment.uploadUrl || attachment.localUri },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: attachment.uploadUrl || attachment.localUri }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: theme.borderRadius.lg,
                        backgroundColor: theme.colors.muted,
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Transactions de la même catégorie */}
        {sameCategoryTransactions.length > 0 && (
          <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.xl }}>
            <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <ThemedText variant="lg" weight="semibold">
                {t('transactions.same_category', { category: category?.name || '' })}
              </ThemedText>
              <Ionicons name="repeat-outline" size={18} color={theme.colors.mutedForeground} />
            </ThemedView>
            {sameCategoryTransactions.slice(0, 5).map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() => {
                  router.push({
                    pathname: '/transaction-details',
                    params: { id: tx.id },
                  });
                }}
                onEdit={() => router.push({ pathname: '/transaction-edit', params: { id: tx.id } })}
                onDelete={() => {}}
                onDoubleTap={() => router.push({ pathname: '/transaction-edit', params: { id: tx.id } })}
                style={{ 
                  borderBottomWidth: sameCategoryTransactions.slice(0, 5).indexOf(tx) !== sameCategoryTransactions.slice(0, 5).length - 1 ? 1 : 0, 
                  borderBottomColor: theme.colors.border 
                }}
              />
            ))}
          </Card>
        )}

        {/* Actions */}
        <Card style={{ padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button
              variant="outline"
              style={{ flex: 1, borderRadius: theme.borderRadius.xl, borderWidth: 1.5 }}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color={theme.colors.foreground} />
              <ThemedText style={{ marginLeft: 6, fontWeight: '600' }}>{t('transactions.share')}</ThemedText>
            </Button>
            <Button
              variant="default"
              style={{ flex: 1, borderRadius: theme.borderRadius.xl }}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.primaryForeground} />
              <ThemedText style={{ marginLeft: 6, fontWeight: '600', color: theme.colors.primaryForeground }}>
                {t('common.edit')}
              </ThemedText>
            </Button>
          </View>
          <Spacer height={theme.spacing.sm} />
          <Button
            variant="destructive"
            onPress={handleDelete}
            disabled={isDeleting}
            style={{ borderRadius: theme.borderRadius.xl }}
          >
            {isDeleting ? t('common.loading') : t('common.delete')}
          </Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}