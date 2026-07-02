// @/components/shared/toggle-theme-button.tsx
import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Animated,
  AccessibilityState,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/theme-context';
import { ThemeMode } from '@/constants/theme';

interface ToggleThemeButtonProps {
  /**
   * Optional size override for the button (default: md)
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Optional custom style for the container
   */
  style?: any;
  /**
   * Optional callback when theme is toggled
   */
  onToggle?: (newMode: ThemeMode) => void;
}

export const ToggleThemeButton: React.FC<ToggleThemeButtonProps> = ({
  size = 'md',
  style,
  onToggle,
}) => {
  const { mode, isDark, toggleTheme, setMode } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotationAnim = React.useRef(new Animated.Value(0)).current;

  // Get size dimensions based on size prop
  const getDimensions = useCallback(() => {
    switch (size) {
      case 'sm':
        return { container: 36, icon: 18, padding: 8 };
      case 'lg':
        return { container: 56, icon: 28, padding: 14 };
      default:
        return { container: 44, icon: 22, padding: 11 };
    }
  }, [size]);

  const dimensions = getDimensions();

  // Handle press animation and theme toggle
  const handlePress = useCallback(() => {
    // Trigger press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotate icon animation
    Animated.timing(rotationAnim, {
      toValue: rotationAnim as unknown as number + 180,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Toggle theme
    toggleTheme();
    
    // Call optional callback
    if (onToggle) {
      onToggle(mode === 'light' ? 'dark' : 'light');
    }
  }, [scaleAnim, rotationAnim, toggleTheme, mode, onToggle]);

  // Handle long press to cycle through theme modes (light -> dark -> system)
  const handleLongPress = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setMode(nextMode);
    
    if (onToggle) {
      onToggle(nextMode);
    }
  }, [mode, setMode, onToggle]);

  // Accessibility label for screen readers
  const getAccessibilityLabel = useCallback(() => {
    return `Toggle theme, currently using ${mode} mode. Tap to switch to ${mode === 'light' ? 'dark' : 'light'} mode, long press to cycle through all modes.`;
  }, [mode]);

  const { theme } = useTheme();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
          backgroundColor: isDark ? theme.colors.card : theme.colors.secondary,
          transform: [{ scale: scaleAnim }],
          ...style,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.pressable,
          {
            opacity: pressed ? 0.8 : 1,
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: dimensions.container / 2,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityState={{ checked: isDark } as AccessibilityState}
        accessibilityHint="Long press to cycle through light, dark, and system themes"
        android_ripple={{
          color: theme.colors.primary,
          borderless: true,
          radius: dimensions.container / 2,
        }}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 180],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={dimensions.icon}
            color={theme.colors.primary}
          />
        </Animated.View>

        {/* System mode indicator dot */}
        {mode === 'system' && (
          <View
            style={[
              styles.systemIndicator,
              {
                backgroundColor: theme.colors.primary,
                width: 6,
                height: 6,
                borderRadius: 3,
                bottom: dimensions.padding / 2,
                right: dimensions.padding / 2,
              },
            ]}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pressable: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemIndicator: {
    position: 'absolute',
  },
});

export default ToggleThemeButton;
