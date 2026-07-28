import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from './text';
import { Carousel } from './carousel';

export interface ActionItem {
  id: string;
  label: string;
  icon: string;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  badge?: string | number;
  disabled?: boolean;
}

interface ActionsGridProps {
  actions: ActionItem[];
  title?: string;
  subtitle?: string;
  layout?: 'carousel' | 'grid' | 'scroll';
  columns?: number;
  itemsPerView?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  cardStyle?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  compact?: boolean;
  variant?: 'default' | 'premium' | 'minimal';
  onActionPress?: (action: ActionItem) => void;
}

export const ActionsGrid: React.FC<ActionsGridProps> = ({
  actions,
  title,
  subtitle,
  layout = 'grid',
  columns = 4,
  itemsPerView = 4,
  showIndicators = false,
  showArrows = false,
  autoPlay = false,
  autoPlayInterval = 3000,
  cardStyle,
  textStyle,
  iconSize = 24,
  compact = false,
  variant = 'default',
  onActionPress,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const handleActionPress = (action: ActionItem) => {
    if (!action.disabled) {
      onActionPress?.(action);
      action.onPress();
    }
  };

  // Styles selon la variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'premium':
        return {
          card: {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 4,
          },
          iconContainer: {
            backgroundColor: theme.colors.primary + '15',
          },
          label: {
            color: theme.colors.foreground,
            fontWeight: '600' as const,
          },
        };
      case 'minimal':
        return {
          card: {
            backgroundColor: 'transparent',
            borderRadius: 0,
            borderWidth: 0,
          },
          iconContainer: {
            backgroundColor: 'transparent',
          },
          label: {
            color: theme.colors.mutedForeground,
            fontWeight: '400' as const,
          },
        };
      default:
        return {
          card: {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.md,
          },
          iconContainer: {
            backgroundColor: theme.colors.muted,
          },
          label: {
            color: theme.colors.foreground,
            fontWeight: '500' as const,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();

  const renderActionCard = (action: ActionItem) => {
    const color = action.color || theme.colors.primary;
    const bgColor = action.backgroundColor || color + '15';

    return (
      <TouchableOpacity
        key={action.id}
        style={[
          styles.actionCard,
          variantStyles.card,
          compact && styles.compactCard,
          cardStyle,
          action.disabled && styles.disabledCard,
        ]}
        onPress={() => handleActionPress(action)}
        disabled={action.disabled}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            variantStyles.iconContainer,
            { backgroundColor: bgColor },
            compact && styles.compactIconContainer,
          ]}
        >
          <Ionicons
            name={action.icon as any}
            size={compact ? iconSize * 0.8 : iconSize}
            color={color}
          />
          {action.badge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.destructive,
                },
              ]}
            >
              <ThemedText
                variant="xs"
                style={{ color: '#fff', fontWeight: '700' }}
              >
                {action.badge}
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText
          variant={compact ? 'xs' : 'sm'}
          weight="medium"
          style={[
            styles.actionLabel,
            variantStyles.label,
            textStyle,
            compact && styles.compactLabel,
          ]}
          numberOfLines={1}
        >
          {action.label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  // Layout en carousel
  if (layout === 'carousel') {
    return (
      <View style={styles.container}>
        {(title || subtitle) && (
          <View style={styles.header}>
            {title && (
              <ThemedText variant="lg" weight="bold">
                {title}
              </ThemedText>
            )}
            {subtitle && (
              <ThemedText variant="sm" color="mutedForeground">
                {subtitle}
              </ThemedText>
            )}
          </View>
        )}
        <Carousel
          data={actions}
          renderItem={(item) => renderActionCard(item)}
          itemsPerView={itemsPerView}
          showIndicators={showIndicators}
          showArrows={showArrows}
          autoPlay={autoPlay}
          autoPlayInterval={autoPlayInterval}
        />
      </View>
    );
  }

  // Layout en grille
  if (layout === 'grid') {
    const itemWidth = (screenWidth - 32 - (columns - 1) * 12) / columns;

    return (
      <View style={styles.container}>
        {(title || subtitle) && (
          <View style={styles.header}>
            {title && (
              <ThemedText variant="lg" weight="bold">
                {title}
              </ThemedText>
            )}
            {subtitle && (
              <ThemedText variant="sm" color="mutedForeground">
                {subtitle}
              </ThemedText>
            )}
          </View>
        )}
        <View style={styles.gridContainer}>
          {actions.map((action) => (
            <View
              key={action.id}
              style={{
                width: itemWidth,
                marginBottom: 12,
              }}
            >
              {renderActionCard(action)}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Layout en scroll horizontal
  return (
    <View style={styles.container}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <ThemedText variant="lg" weight="bold">
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText variant="sm" color="mutedForeground">
              {subtitle}
            </ThemedText>
          )}
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {actions.map((action) => (
          <View key={action.id} style={{ marginRight: 12 }}>
            {renderActionCard(action)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scrollContainer: {
    paddingHorizontal: 4,
  },
  actionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    minWidth: 64,
    minHeight: 80,
  },
  compactCard: {
    padding: 8,
    minWidth: 56,
    minHeight: 64,
  },
  disabledCard: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  actionLabel: {
    textAlign: 'center',
    fontSize: 12,
  },
  compactLabel: {
    fontSize: 10,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
});