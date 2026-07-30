// @/components/ui/button.tsx
import { useTheme } from "@/contexts/theme-context";
import { ReactNode, forwardRef, useMemo } from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle, TextStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import ThemedText from "./text";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  isFullWidth?: boolean;
}

const Button = forwardRef<any, ButtonProps>(
  (
    {
      children,
      variant = "default",
      size = "md",
      disabled = false,
      isFullWidth = false,
      style,
      onPressIn,
      onPressOut,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const scale = useSharedValue(1);

    const colors = useMemo(() => {
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
    }, [variant, theme]);

    const sizeStyles = useMemo(() => {
      switch (size) {
        case "sm":
          return {
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.borderRadius.sm,
            minHeight: 36,
          };
        case "md":
          return {
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            minHeight: 44,
          };
        case "lg":
          return {
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.borderRadius.lg,
            minHeight: 52,
          };
        default:
          return {
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            minHeight: 44,
          };
      }
    }, [size, theme]);

    const handlePressIn = (e: any) => {
      if (!disabled) {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }
      onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
      if (!disabled) {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }
      onPressOut?.(e);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : 1,
    }));

    const baseContainerStyle: ViewStyle = useMemo(
      () => ({
        backgroundColor: colors.backgroundColor,
        borderWidth: variant === "outline" ? 1 : 0,
        borderColor: colors.borderColor,
        ...sizeStyles,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
        width: isFullWidth ? "100%" : undefined,
        alignSelf: isFullWidth ? "stretch" : "flex-start",
      }),
      [colors, variant, sizeStyles, isFullWidth, theme]
    );

    const renderChild = (child: ReactNode, index?: number) => {
      if (typeof child === "string" || typeof child === "number") {
        return (
          <ThemedText
            key={index}
            style={{
              color: colors.textColor,
              fontWeight: "600",
              fontSize:
                size === "sm"
                  ? theme.typography.sm
                  : size === "lg"
                  ? theme.typography.lg
                  : theme.typography.base,
              opacity: 1, // Garantit que le texte reste à 100% d'opacité
            }}
          >
            {child}
          </ThemedText>
        );
      }
      return child;
    };

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[baseContainerStyle, animatedStyle, style]}
        {...props}
      >
        {Array.isArray(children)
          ? children.map((child, index) => renderChild(child, index))
          : renderChild(children)}
      </AnimatedPressable>
    );
  }
);

Button.displayName = "Button";

export default Button;