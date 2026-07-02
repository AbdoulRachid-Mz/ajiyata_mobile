import React, { useState } from 'react';
import { View, Pressable, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import Card from '@/components/ui/card';
import Modal from '@/components/ui/modal';
import { useCategories } from '../hooks';
import { Category } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface CategoryPickerProps {
  accountId: string;
  selectedId?: string | null;
  onSelect: (category: Category) => void;
  type?: 'income' | 'expense';
}

export const CategoryPicker = ({ accountId, selectedId, onSelect, type }: CategoryPickerProps) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const { data: categories, isLoading } = useCategories(accountId);

  const filteredCategories = type
    ? categories?.filter(c => c.type === type)
    : categories;

  const selectedCategory = categories?.find(c => c.id === selectedId);

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
      borderBottomColor: theme.colors.border,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    }
  });

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {selectedCategory ? (
            <>
              <View style={[styles.icon, { backgroundColor: selectedCategory.color + '20' }]}>
                <ThemedText style={{ fontSize: 16 }}>{selectedCategory.icon}</ThemedText>
              </>
              <ThemedText>{selectedCategory.name}</ThemedText>
            </>
          ) : (
            <ThemedText color="mutedForeground">Sélectionner une catégorie</ThemedText>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color={theme.colors.mutedForeground} />
      </Pressable>

      <Modal visible={visible} onClose={() => setVisible(false)}>
        <View style={{ padding: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Catégories
          </ThemedText>

          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}
              >
                <View style={[styles.icon, { backgroundColor: item.color + '20' }]}>
                  <ThemedText style={{ fontSize: 16 }}>{item.icon}</ThemedText>
                </View>
                <ThemedText weight={selectedId === item.id ? 'bold' : 'normal'}>
                  {item.name}
                </ThemedText>
              </Pressable>
            )}
            ListEmptyComponent={
              <ThemedText color="mutedForeground" style={{ textAlign: 'center', marginTop: 20 }}>
                Aucune catégorie trouvée
              </ThemedText>
            }
          />
        </View>
      </Modal>
    </>
  );
};
