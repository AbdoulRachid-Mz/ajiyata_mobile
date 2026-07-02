// @/components/ui/text.tsx
import { StyleSheet, StyleProp, TextStyle, Text as RNText } from "react-native";
import { useTheme } from "@/contexts/theme-context";
import { ReactNode, forwardRef, useEffect, useMemo } from "react";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
} from "react-native-reanimated";

type TextVariant = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

type TextColor =
  | "foreground"
  | "mutedForeground"
  | "primary"
  | "primaryForeground"
  | "secondaryForeground"
  | "accentForeground"
  | "destructive"
  | "destructiveForeground";

type TextWeight = "normal" | "medium" | "semibold" | "bold";

interface TextProps {
  children: ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
  className?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  selectable?: boolean;
  onPress?: () => void;
  animateColorChange?: boolean;
  animationDuration?: number;
}

const ThemedText = forwardRef<RNText, TextProps>(
  (
    {
      children,
      variant = "base",
      color = "foreground",
      weight = "normal",
      style,
      numberOfLines,
      selectable = false,
      onPress,
      animateColorChange = true,
      animationDuration = 200,
    },
    ref,
  ) => {
    const { theme } = useTheme();

    const staticStyles = useMemo(
      () =>
        StyleSheet.create({
          base: {
            fontFamily:
              weight === "bold"
                ? "Inter-Bold"
                : weight === "semibold"
                  ? "Inter-SemiBold"
                  : weight === "medium"
                    ? "Inter-Medium"
                    : "Inter-Regular",
            fontSize: theme.typography[variant],
            lineHeight: theme.typography[variant] * 1.5,
          },
        }),
      [theme.typography, variant, weight],
    );

    const colorValue = useSharedValue(theme.colors[color]);

    useEffect(() => {
      colorValue.value = withTiming(theme.colors[color], {
        duration: animationDuration,
        easing: Easing.inOut(Easing.quad),
      });
    }, [theme.colors, color, animationDuration]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        color: colorValue.value,
      };
    });

    const baseStyles = [staticStyles.base, style];

    return (
      <Animated.Text
        ref={ref as any}
        style={[...baseStyles, animatedStyle]}
        numberOfLines={numberOfLines}
        selectable={selectable}
        onPress={onPress}
      >
        {children}
      </Animated.Text>
    );
  },
);

ThemedText.displayName = "Text";

export default ThemedText;
