import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/theme-context';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  animated = true,
}: SkeletonProps) => {
  const { theme, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animated]);

  const backgroundColor = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.08)';

  return (
    <Animated.View
      style={[
        {
          width: width as number | `${number}%` | 'auto',
          height,
          borderRadius,
          backgroundColor,
          opacity: animated ? opacity : 0.3,
          overflow: 'hidden',
        },
        style,
      ]}
    />
  );
};

// Skeleton circulaire (avatar)
export const SkeletonCircle = ({
  size = 40,
  ...props
}: Omit<SkeletonProps, 'width' | 'height' | 'borderRadius'> & { size?: number }) => {
  return <Skeleton width={size} height={size} borderRadius={size / 2} {...props} />;
};

// Skeleton en ligne (pour les textes)
export const SkeletonText = ({
  lines = 1,
  width = '100%',
  spacing = 8,
  lastLineWidth = '60%',
}: {
  lines?: number;
  width?: number | string;
  spacing?: number;
  lastLineWidth?: number | string;
}) => {
  return (
    <View style={{ gap: spacing }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : width}
          height={16}
          borderRadius={4}
        />
      ))}
    </View>
  );
};

// Skeleton Card
export const SkeletonCard = ({
  height = 100,
  children,
}: {
  height?: number;
  children?: React.ReactNode;
}) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minHeight: height,
      }}
    >
      {children || (
        <>
          <Skeleton width="60%" height={20} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} />
        </>
      )}
    </View>
  );
};