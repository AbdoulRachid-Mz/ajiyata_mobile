// @/components/ui/badge.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/theme-context' ;

// Variants supported by the badge component
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';

// Sizes supported by the badge component
type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Content to display inside the badge */
  children?: React.ReactNode;
  /** Visual style variant of the badge */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Whether to show an icon before the text */
  icon?: React.ReactNode;
  /** Whether to show a loading indicator inside the badge */
  loading?: boolean;
  /** Whether the badge is in an error state */
  error?: boolean;
  /** Additional styles to apply to the container */
  style?: ViewStyle;
  /** Additional styles to apply to the text */
  textStyle?: TextStyle;
  /** Whether the badge should be rounded (pill shape) */
  rounded?: boolean;
  /** Whether the badge is clickable */
  onPress?: () => void;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/**
 * A professional, theme-aware badge component for React Native
 * Supports multiple variants, sizes, and states with full TypeScript support
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  loading = false,
  error = false,
  style,
  textStyle,
  rounded = true,
  onPress,
  accessibilityLabel,
}) => {
  const { theme, isDark } = useTheme();

  // Memoize styles to prevent unnecessary recalculations
  const { containerStyles, textStyles, iconColor, spinnerColor } = useMemo(() => {
    // Get base colors and styles based on variant
    const getVariantStyles = (): { 
      container: ViewStyle; 
      text: TextStyle;
      iconColor: string;
      spinnerColor: string;
    } => {
      const baseStyles = {
        iconColor: '',
        spinnerColor: '',
      };

      switch (variant) {
        case 'primary':
          return {
            container: {
              backgroundColor: theme.colors.primary,
              borderWidth: 0,
            },
            text: {
              color: theme.colors.primaryForeground,
            },
            ...baseStyles,
            iconColor: theme.colors.primaryForeground,
            spinnerColor: theme.colors.primaryForeground,
          };

        case 'secondary':
          return {
            container: {
              backgroundColor: theme.colors.secondary,
              borderWidth: 0,
            },
            text: {
              color: theme.colors.secondaryForeground,
            },
            ...baseStyles,
            iconColor: theme.colors.secondaryForeground,
            spinnerColor: theme.colors.secondaryForeground,
          };

        case 'outline':
          return {
            container: {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
            text: {
              color: theme.colors.foreground,
            },
            ...baseStyles,
            iconColor: theme.colors.foreground,
            spinnerColor: theme.colors.foreground,
          };

        case 'destructive':
          return {
            container: {
              backgroundColor: theme.colors.destructive,
              borderWidth: 0,
            },
            text: {
              color: theme.colors.destructiveForeground,
            },
            ...baseStyles,
            iconColor: theme.colors.destructiveForeground,
            spinnerColor: theme.colors.destructiveForeground,
          };

        case 'success':
          return {
            container: {
              backgroundColor: isDark ? 'hsl(162 85% 25%)' : 'hsl(160 85% 90%)',
              borderWidth: 0,
            },
            text: {
              color: isDark ? 'hsl(210 20% 98%)' : 'hsl(222 47% 11%)',
            },
            ...baseStyles,
            iconColor: isDark ? 'hsl(210 20% 98%)' : 'hsl(222 47% 11%)',
            spinnerColor: isDark ? 'hsl(210 20% 98%)' : 'hsl(222 47% 11%)',
          };

        case 'warning':
          return {
            container: {
              backgroundColor: isDark ? 'hsl(45 100% 51% / 0.2)' : 'hsl(45 100% 90%)',
              borderWidth: 0,
            },
            text: {
              color: isDark ? 'hsl(45 100% 51%)' : 'hsl(32 95% 38%)',
            },
            ...baseStyles,
            iconColor: isDark ? 'hsl(45 100% 51%)' : 'hsl(32 95% 38%)',
            spinnerColor: isDark ? 'hsl(45 100% 51%)' : 'hsl(32 95% 38%)',
          };

        case 'default':
        default:
          return {
            container: {
              backgroundColor: theme.colors.muted,
              borderWidth: 0,
            },
            text: {
              color: theme.colors.mutedForeground,
            },
            ...baseStyles,
            iconColor: theme.colors.mutedForeground,
            spinnerColor: theme.colors.mutedForeground,
          };
      }
    };

    // Get size-based styles
    const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
      switch (size) {
        case 'sm':
          return {
            container: {
              paddingHorizontal: theme.spacing.xs,
              paddingVertical: 2,
              gap: 4,
            },
            text: {
              fontSize: theme.typography.xs,
            },
          };
        case 'lg':
          return {
            container: {
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              gap: 6,
            },
            text: {
              fontSize: theme.typography.sm,
            },
          };
        case 'md':
        default:
          return {
            container: {
              paddingHorizontal: theme.spacing.xs + 2,
              paddingVertical: 4,
              gap: 5,
            },
            text: {
              fontSize: 13,
            },
          };
      }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    // Override styles for error state
    if (error) {
      variantStyles.container.backgroundColor = theme.colors.destructive;
      variantStyles.text.color = theme.colors.destructiveForeground;
      variantStyles.iconColor = theme.colors.destructiveForeground;
      variantStyles.spinnerColor = theme.colors.destructiveForeground;
    }

    return {
      containerStyles: {
        ...styles.baseContainer,
        ...variantStyles.container,
        ...sizeStyles.container,
        borderRadius: rounded ? theme.borderRadius.full : theme.borderRadius.sm,
        ...(onPress && styles.clickable),
        ...style,
      } as ViewStyle,
      textStyles: {
        ...styles.baseText,
        ...variantStyles.text,
        ...sizeStyles.text,
        fontWeight: '500',
        ...textStyle,
      } as TextStyle,
      iconColor: variantStyles.iconColor,
      spinnerColor: variantStyles.spinnerColor,
    };
  }, [theme, isDark, variant, size, error, rounded, onPress, style, textStyle]);

  // Render the icon with proper color if provided
  const renderIcon = () => {
    if (!icon || loading) return null;
    
    if (React.isValidElement(icon)) {
      // If the icon is a React element, we clone it to inject the correct color
      return React.cloneElement(icon as React.ReactElement<any>, {
        color: (icon.props as any).color ?? iconColor,
        size: (icon.props as any).size ?? (size === 'sm' ? 10 : size === 'lg' ? 14 : 12),
      });
    }
    return icon;
  };

  return (
    <View
      style={containerStyles}
      onTouchEnd={onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={accessibilityLabel}
    >
      {loading ? (
        <ActivityIndicator size={size === 'sm' ? 8 : size === 'lg' ? 12 : 10} color={spinnerColor} />
      ) : (
        renderIcon()
      )}
      {children && (
        <Text style={textStyles} numberOfLines={1}>
          {children}
        </Text>
      )}
    </View>
  );
};

// Base styles that don't depend on theme
const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  baseText: {
    textAlign: 'center',
    fontFamily: 'System',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  clickable: {
    opacity: 0.9,
    // @ts-ignore - for web support
    cursor: 'pointer',
  },
});

export default Badge;
