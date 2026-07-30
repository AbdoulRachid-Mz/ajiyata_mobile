// src/features/categories/components/category-picker.tsx

import React, { useState } from 'react';
import { View, Pressable, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import Drawer from '@/components/ui/drawer';
import { useCategories } from '../hooks';
import { useCreateCategory } from '../hooks';
import { Category } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useDevice } from '@/hooks/use-device';
import { useTranslation } from 'react-i18next';

interface CategoryPickerProps {
  accountId: string;
  selectedId?: string | null;
  onSelect: (category: Category) => void;
  type?: 'income' | 'expense';
}

export const CategoryPicker = ({ accountId, selectedId, onSelect, type }: CategoryPickerProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newCategoryIcon, setNewCategoryIcon] = useState('wallet-outline');
  const [newCategoryColor, setNewCategoryColor] = useState('#16a34a');
  const { deviceId } = useDevice();
  
  const { data: categories, isLoading } = useCategories(accountId);
  const createCategory = useCreateCategory();

  const filteredCategories = type
    ? categories?.filter(c => c.type === type)
    : categories;

  const selectedCategory = categories?.find(c => c.id === selectedId);

  const isValidIconName = (iconName: string): boolean => {
    const validIcons = [
      'cash-outline', 'briefcase-outline', 'trending-up-outline', 'home-outline',
      'people-outline', 'cart-outline', 'gift-outline', 'wallet-outline',
      'restaurant-outline', 'bus-outline', 'medical-outline', 'game-controller-outline',
      'document-text-outline', 'bag-outline', 'school-outline', 'airplane-outline',
      'shield-outline', 'phone-portrait-outline', 'paw-outline', 'color-palette-outline',
      'basketball-outline', 'construct-outline', 'stats-chart-outline', 'create-outline',
      'wallet', 'cash', 'home', 'cart', 'gift', 'restaurant', 'bus', 'medical',
      'game-controller', 'document-text', 'bag', 'school', 'airplane', 'shield',
      'phone-portrait', 'paw', 'color-palette', 'basketball', 'construct',
      'stats-chart', 'create'
    ];
    const emojiRegex = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]/u;
    if (emojiRegex.test(iconName)) {
      return false;
    }
    return validIcons.includes(iconName);
  };

  const getValidIconName = (iconName: string): string => {
    if (isValidIconName(iconName)) {
      return iconName;
    }
    return 'wallet-outline';
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const validIcon = getValidIconName(newCategoryIcon);
    
    try {
      const newCategory = await createCategory.mutateAsync({
        accountId,
        name: newCategoryName.trim(),
        type: type || 'expense',
        color: newCategoryColor,
        icon: validIcon,
        id: '',
        deviceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: false,
        syncStatus: 'pending',
        version: 1,
        metadata: {},
      } as any);
      
      setNewCategoryName('');
      setNewCategoryIcon('wallet-outline');
      setNewCategoryColor('#16a34a');
      setShowCreateInput(false);
      onSelect(newCategory);
      setVisible(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleSelectCategory = (category: Category) => {
    onSelect(category);
    setVisible(false);
  };

  const presetColors = [
    '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6',
    '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1',
    '#84cc16', '#f43f5e', '#0ea5e9', '#a855f7', '#10b981'
  ];

  const presetIcons = [
    'wallet-outline', 'cash-outline', 'cart-outline', 'home-outline',
    'restaurant-outline', 'bus-outline', 'medical-outline', 'game-controller-outline',
    'document-text-outline', 'bag-outline', 'school-outline', 'airplane-outline',
    'shield-outline', 'phone-portrait-outline', 'paw-outline', 'gift-outline',
    'color-palette-outline', 'basketball-outline', 'construct-outline',
    'stats-chart-outline', 'create-outline', 'briefcase-outline', 'trending-up-outline'
  ];

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const iconName = getValidIconName(item.icon);
    
    return (
      <Pressable 
        style={[styles.item, { borderBottomColor: theme.colors.border }]} 
        onPress={() => handleSelectCategory(item)}
      >
        <View style={[styles.icon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={iconName as any} size={16} color={item.color} />
        </View>
        <ThemedText>{item.name}</ThemedText>
        {item.id === selectedId && (
          <Ionicons name="checkmark" size={20} color={theme.colors.primary} style={{ marginLeft: 'auto' }} />
        )}
      </Pressable>
    );
  };

  const styles = StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.input,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 0.5,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    inputContainer: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    input: {
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.foreground,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    colorPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginVertical: 8,
    },
    colorOption: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: '#000',
    },
    iconPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginVertical: 8,
    },
    iconOption: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    iconOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {selectedCategory ? (
            <>
              <View style={[styles.icon, { backgroundColor: selectedCategory.color + '20' }]}>
                <Ionicons name={getValidIconName(selectedCategory.icon) as any} size={16} color={selectedCategory.color} />
              </View>
              <ThemedText>{selectedCategory.name}</ThemedText>
            </>
          ) : (
            <ThemedText color="mutedForeground">{t('finance.select_category')}</ThemedText>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color={theme.colors.mutedForeground} />
      </Pressable>

      <Drawer visible={visible} onClose={() => setVisible(false)}>
        <View style={{ padding: theme.spacing.lg, maxHeight: '100%' }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            {t('finance.categories')}
          </ThemedText>

          {!showCreateInput && (
            <Pressable 
              style={styles.addButton} 
              onPress={() => setShowCreateInput(true)}
            >
              <Ionicons name="add" size={20} color={theme.colors.primary} />
              <ThemedText style={{ color: theme.colors.primary }}>{t('finance.add_category')}</ThemedText>
            </Pressable>
          )}

          {showCreateInput && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder={t('finance.category_name_placeholder')}
                placeholderTextColor={theme.colors.mutedForeground}
                autoFocus
              />
              
              <ThemedText variant="xs" color="mutedForeground" style={{ marginTop: 8 }}>
                {t('common.color')}
              </ThemedText>
              <View style={styles.colorPicker}>
                {presetColors.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </View>

              <ThemedText variant="xs" color="mutedForeground" style={{ marginTop: 8 }}>
                {t('common.icon')}
              </ThemedText>
              <View style={styles.iconPicker}>
                {presetIcons.slice(0, 12).map((icon) => (
                  <Pressable
                    key={icon}
                    style={[
                      styles.iconOption,
                      newCategoryIcon === icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setNewCategoryIcon(icon)}
                  >
                    <Ionicons name={icon as any} size={20} color={theme.colors.foreground} />
                  </Pressable>
                ))}
              </View>

              <View style={styles.row}>
                <Pressable 
                  style={{ flex: 1, padding: theme.spacing.sm, alignItems: 'center' }}
                  onPress={() => {
                    setShowCreateInput(false);
                    setNewCategoryName('');
                    setNewCategoryIcon('wallet-outline');
                    setNewCategoryColor('#16a34a');
                  }}
                >
                  <ThemedText color="mutedForeground">{t('common.cancel')}</ThemedText>
                </Pressable>
                <Pressable 
                  style={{ 
                    flex: 1, 
                    padding: theme.spacing.sm, 
                    alignItems: 'center',
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.sm,
                  }}
                  onPress={handleCreateCategory} 
                  disabled={createCategory.isPending || !newCategoryName.trim()}
                >
                  {createCategory.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                      {t('common.create')}
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : filteredCategories?.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText color="mutedForeground">{t('finance.no_categories_found')}</ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              renderItem={renderCategoryItem}
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Drawer>
    </>
  );
};