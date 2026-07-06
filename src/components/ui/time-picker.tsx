import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import ThemedView from '@/components/ui/view';

const ITEM_HEIGHT = 50;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface Props {
  visible: boolean;
  value: string; // "HH:mm"
  onConfirm: (time: string) => void;
  onClose: () => void;
}

function WheelPicker({
  data,
  selected,
  onSelect,
}: {
  data: string[];
  selected: string;
  onSelect: (val: string) => void;
}) {
  const { theme } = useTheme();
  const listRef = useRef<FlatList>(null);
  const selectedIndex = data.indexOf(selected);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    onSelect(data[clampedIndex]);
  };

  return (
    <View style={{ height: ITEM_HEIGHT * 5, width: 80, overflow: 'hidden' }}>
      {/* Highlight bar for selected item */}
      <View
        pointerEvents="none"
        style={[
          styles.highlightBar,
          {
            top: ITEM_HEIGHT * 2,
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary + '18',
          },
        ]}
      />
      <FlatList
        ref={listRef}
        data={['', '', ...data, '', '']}
        keyExtractor={(_, idx) => idx.toString()}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item, index }) => {
          // Real index (accounting for 2 padding items)
          const realIndex = index - 2;
          const isSelected = item === selected;
          return (
            <View
              style={{
                height: ITEM_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ThemedText
                style={{
                  fontSize: isSelected ? 22 : 17,
                  fontWeight: isSelected ? '700' : '400',
                  color: isSelected
                    ? theme.colors.primary
                    : theme.colors.mutedForeground,
                  opacity: item === '' ? 0 : 1,
                }}
              >
                {item}
              </ThemedText>
            </View>
          );
        }}
      />
    </View>
  );
}

export function TimePicker({ visible, value, onConfirm, onClose }: Props) {
  const { theme } = useTheme();
  const [hour, setHour] = useState(value.split(':')[0] || '08');
  const [minute, setMinute] = useState(value.split(':')[1] || '00');

  useEffect(() => {
    if (visible) {
      setHour(value.split(':')[0] || '08');
      setMinute(value.split(':')[1] || '00');
    }
  }, [visible, value]);

  const handleConfirm = () => {
    onConfirm(`${hour}:${minute}`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.centeredContainer} pointerEvents="box-none">
        <ThemedView
        
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.foreground,
            } as const,
          ]}
        >
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: 16, textAlign: 'center' }}
          >
            Heure du rappel
          </ThemedText>

          <View style={styles.wheelRow}>
            <WheelPicker data={HOURS} selected={hour} onSelect={setHour} />
            <ThemedText
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: theme.colors.foreground,
                marginHorizontal: 8,
                marginTop: 2,
              }}
            >
              :
            </ThemedText>
            <WheelPicker data={MINUTES} selected={minute} onSelect={setMinute} />
          </View>

          <ThemedText
            style={{
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.primary,
              marginTop: 12,
            }}
          >
            {hour}:{minute}
          </ThemedText>

          <View style={styles.buttons}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.btn,
                {
                  backgroundColor: theme.colors.muted,
                  borderRadius: theme.spacing.sm,
                },
              ]}
            >
              <ThemedText weight="semibold">Annuler</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.btn,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.spacing.sm,
                },
              ]}
            >
              <ThemedText weight="semibold" style={{ color: '#fff' }}>
                Confirmer
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  centeredContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  container: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  wheelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRadius: 8,
    zIndex: 1,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
