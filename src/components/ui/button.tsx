// @/components/ui/button.tsx
import { useTheme } from "@/contexts/theme-context";
import { ReactNode, forwardRef, useMemo } from "react";
import { Pressable, PressableProps, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import ThemedText from "./text";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  style?: ViewStyle;
  disabled?: boolean;
  isFullWidth?: boolean;
}

const Button = forwardRef(
  (
    {
      children,
      variant = "default",
      size = "md",
      disabled = false,
      isFullWidth = false,
      style,
      ...props
    }: ButtonProps,
    ref: any,
  ) => {
    const { theme } = useTheme();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(disabled ? 0.5 : 1);

    const getButtonColors = () => {
      switch (variant) {
        case "default":
          return {
            backgroundColor: theme.colors.primary,
            textColor: theme.colors.primaryForeground,
            borderColor: "transparent",
          };
        case "secondary":
          return {
            backgroundColor: theme.colors.secondary,
            textColor: theme.colors.secondaryForeground,
            borderColor: "transparent",
          };
        case "outline":
          return {
            backgroundColor: "transparent",
            textColor: theme.colors.foreground,
            borderColor: theme.colors.border,
          };
        case "ghost":
          return {
            backgroundColor: "transparent",
            textColor: theme.colors.foreground,
            borderColor: "transparent",
          };
        case "destructive":
          return {
            backgroundColor: theme.colors.destructive,
            textColor: theme.colors.destructiveForeground,
            borderColor: "transparent",
          };
        default:
          return {
            backgroundColor: theme.colors.primary,
            textColor: theme.colors.primaryForeground,
            borderColor: "transparent",
          };
      }
    };

    const getButtonSize = () => {
      switch (size) {
        case "sm":
          return {
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.borderRadius.sm,
          };
        case "md":
          return {
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
          };
        case "lg":
          return {
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.borderRadius.lg,
          };
        default:
          return {
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
          };
      }
    };

    const colors = getButtonColors();
    const sizeStyles = getButtonSize();

    const handlePressIn = () => {
      if (!disabled) {
        scale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
      }
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const buttonStyles = useMemo(
      () => ({
        container: {
          backgroundColor: colors.backgroundColor,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.borderColor,
          ...sizeStyles,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: theme.spacing.sm,
        },
      }),
      [colors, sizeStyles, variant, theme],
    );

    return (
      <Animated.View style={[buttonStyles.container, style, animatedStyle] as any}>
        <Pressable
          ref={ref}
          disabled={disabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ width: isFullWidth ? '100%' : 'auto', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm }}
          {...props}
        >
          {typeof children === "string" ? (
            <ThemedText
              style={{
                color: colors.textColor,
                fontWeight: "600",
                fontSize:
                  size === "sm"
                    ? theme.typography.sm
                    : size === "lg"
                      ? theme.typography.lg
                      : theme.typography.base,
              }}
            >
              {children}
            </ThemedText>
          ) : (
            children
          )}
        </Pressable>
      </Animated.View>
    );
  },
);

Button.displayName = "Button";

export default Button;
