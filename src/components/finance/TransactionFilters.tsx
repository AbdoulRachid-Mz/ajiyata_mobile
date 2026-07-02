import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput as RNTextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Spacer from '@/components/ui/spacer';
import { Badge } from '@/components/ui/badge';
import { TransactionFilters, TransactionType, SortField, SortDirection, DatePreset } from '@/features/transactions/types/filters';
import { useCategories } from '@/features/categories/hooks';
import { useAppStore } from '@/stores/app-store';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onClose: () => void;
  visible: boolean;
}

export const TransactionFiltersModal = ({
  filters,
  onFiltersChange,
  onClose,
  visible,
}: TransactionFiltersProps) => {
  const { theme } = useTheme();
  const { currentAccount } = useAppStore();
  const { data: categories } = useCategories(currentAccount?.id || '');
  const searchInputRef = useRef<RNTextInput>(null);

  const [localFilters, setLocalFilters] = useState<TransactionFilters>({ ...filters });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleTypePress = (type: TransactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(prev => ({ ...prev, type }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(prev => {
      const current = prev.categoryIds || [];
      const newCategories = current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId];
      return { ...prev, categoryIds: newCategories };
    });
  };

  const handleSortPress = (field: SortField) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(prev => {
      if (prev.sortField === field) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
        };
      }
      return { ...prev, sortField: field, sortDirection: 'desc' };
    });
  };

  const handleDatePreset = (preset: DatePreset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters(prev => ({ ...prev, presetDate: preset }));
  };

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const resetFilters: TransactionFilters = {
      type: 'all',
      sortField: 'date',
      sortDirection: 'desc',
      search: '',
      categoryIds: [],
      presetDate: 'month',
    };
    setLocalFilters(resetFilters);
  };

  const getSortIcon = (field: SortField) => {
    if (localFilters.sortField !== field) return 'swap-vertical-outline';
    return localFilters.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
  };

  const getSortLabel = (field: SortField): string => {
    const labels = {
      date: 'Date',
      amount: 'Montant',
      type: 'Type',
      title: 'Titre',
    };
    return labels[field];
  };

  const typeOptions: { label: string; value: TransactionType; icon: string }[] = [
    { label: 'Tous', value: 'all', icon: 'apps-outline' },
    { label: 'Revenus', value: 'income', icon: 'arrow-up' },
    { label: 'Dépenses', value: 'expense', icon: 'arrow-down' },
    { label: 'Virements', value: 'transfer', icon: 'swap-horizontal' },
  ];

  const datePresets: { label: string; value: DatePreset; icon: string }[] = [
    { label: "Aujourd'hui", value: 'today', icon: 'today-outline' },
    { label: 'Cette semaine', value: 'week', icon: 'calendar-outline' },
    { label: 'Ce mois', value: 'month', icon: 'calendar-outline' },
    { label: 'Cette année', value: 'year', icon: 'calendar-outline' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <ThemedText variant="xl" weight="bold">Filtres</ThemedText>
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <ThemedText variant="sm" color="mutedForeground">Réinitialiser</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Recherche */}
          <View style={styles.section}>
            <ThemedText variant="sm" weight="semibold" style={styles.sectionTitle}>
              Recherche
            </ThemedText>
            <View style={[styles.searchContainer, { borderColor: theme.colors.border }]}>
              <Ionicons name="search" size={20} color={theme.colors.mutedForeground} />
              <RNTextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: theme.colors.foreground }]}
                placeholder="Rechercher une transaction..."
                placeholderTextColor={theme.colors.mutedForeground}
                value={localFilters.search}
                onChangeText={(text) => setLocalFilters(prev => ({ ...prev, search: text }))}
              />
              {localFilters.search && (
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, search: '' }))}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Type */}
          <View style={styles.section}>
            <ThemedText variant="sm" weight="semibold" style={styles.sectionTitle}>
              Type
            </ThemedText>
            <View style={styles.typeContainer}>
              {typeOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeButton,
                    {
                      borderColor: localFilters.type === option.value
                        ? theme.colors.primary
                        : theme.colors.border,
                      backgroundColor: localFilters.type === option.value
                        ? theme.colors.primary + '10'
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleTypePress(option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={18}
                    color={localFilters.type === option.value
                      ? theme.colors.primary
                      : theme.colors.mutedForeground}
                  />
                  <ThemedText
                    variant="sm"
                    style={{
                      color: localFilters.type === option.value
                        ? theme.colors.primary
                        : theme.colors.mutedForeground,
                    }}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Période */}
          <View style={styles.section}>
            <ThemedText variant="sm" weight="semibold" style={styles.sectionTitle}>
              Période
            </ThemedText>
            <View style={styles.dateContainer}>
              {datePresets.map(preset => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.dateButton,
                    {
                      borderColor: localFilters.presetDate === preset.value
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => handleDatePreset(preset.value)}
                >
                  <ThemedText
                    variant="sm"
                    style={{
                      color: localFilters.presetDate === preset.value
                        ? theme.colors.primary
                        : theme.colors.mutedForeground,
                    }}
                  >
                    {preset.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Catégories */}
          {categories && categories.length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="sm" weight="semibold" style={styles.sectionTitle}>
                Catégories
              </ThemedText>
              <View style={styles.categoriesContainer}>
                {categories.map(category => {
                  const isSelected = localFilters.categoryIds?.includes(category.id) || false;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        {
                          borderColor: isSelected ? category.color : theme.colors.border,
                          backgroundColor: isSelected ? category.color + '15' : 'transparent',
                        },
                      ]}
                      onPress={() => handleCategoryToggle(category.id)}
                    >
                      <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                      <ThemedText
                        variant="sm"
                        style={{
                          color: isSelected ? category.color : theme.colors.foreground,
                        }}
                      >
                        {category.name}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Tri */}
          <View style={styles.section}>
            <ThemedText variant="sm" weight="semibold" style={styles.sectionTitle}>
              Trier par
            </ThemedText>
            <View style={styles.sortContainer}>
              {(['date', 'amount', 'type', 'title'] as SortField[]).map(field => (
                <TouchableOpacity
                  key={field}
                  style={[
                    styles.sortButton,
                    {
                      borderColor: localFilters.sortField === field
                        ? theme.colors.primary
                        : theme.colors.border,
                      backgroundColor: localFilters.sortField === field
                        ? theme.colors.primary + '10'
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleSortPress(field)}
                >
                  <ThemedText
                    variant="sm"
                    style={{
                      color: localFilters.sortField === field
                        ? theme.colors.primary
                        : theme.colors.mutedForeground,
                    }}
                  >
                    {getSortLabel(field)}
                  </ThemedText>
                  <Ionicons
                    name={getSortIcon(field) as any}
                    size={16}
                    color={localFilters.sortField === field
                      ? theme.colors.primary
                      : theme.colors.mutedForeground}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Résumé des filtres */}
          <View style={styles.section}>
            <Card style={styles.summaryCard}>
              <ThemedText variant="sm" weight="medium" style={styles.summaryTitle}>
                Résumé des filtres
              </ThemedText>
              <ThemedText variant="xs" color="mutedForeground" style={styles.summaryText}>
                {getFilterSummary(localFilters)}
              </ThemedText>
            </Card>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Button
            isFullWidth={false}
            variant="outline"
            style={styles.footerButton}
            onPress={onClose}
          >
            Annuler
          </Button>
          <Button
            isFullWidth={false}
            style={styles.applyButton}
            onPress={handleApply}
          >
            Appliquer
          </Button>
        </View>
      </View>
    </Modal>
  );
};

// Helper pour le résumé
const getFilterSummary = (filters: TransactionFilters): string => {
  const parts: string[] = [];

  if (filters.type && filters.type !== 'all') {
    parts.push(filters.type === 'income' ? 'Revenus' : filters.type === 'expense' ? 'Dépenses' : 'Virements');
  }

  if (filters.search && filters.search.trim()) {
    parts.push(`"${filters.search.trim()}"`);
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    parts.push(`${filters.categoryIds.length} catégorie(s)`);
  }

  if (filters.presetDate && filters.presetDate !== 'custom') {
    const labels: Record<DatePreset, string> = {
      today: "Aujourd'hui",
      week: 'Cette semaine',
      month: 'Ce mois',
      year: 'Cette année',
      custom: 'Personnalisé',
    };
    parts.push(labels[filters.presetDate]);
  }

  return parts.length > 0 ? `Filtres: ${parts.join(' • ')}` : 'Toutes les transactions';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  summaryCard: {
    padding: 12,
  },
  summaryTitle: {
    marginBottom: 4,
  },
  summaryText: {
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
  applyButton: {
    backgroundColor: '#16a34a',
    flex: 1,
  },
});