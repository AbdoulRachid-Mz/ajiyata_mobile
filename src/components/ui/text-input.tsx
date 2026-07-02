// @/components/ui/text-input.tsx
import { useTheme } from "@/contexts/theme-context";
import { ReactNode, forwardRef, useMemo, useState } from "react";
import {
  Platform,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  ViewStyle,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import ThemedText from "./text";

interface TextInputProps extends Omit<RNTextInputProps, "style"> {
  className?: string;
  style?: any;
  containerStyle?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: boolean;
  label?: string;
}

const AnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

const TextInput = forwardRef(
  (
    {
      style,
      containerStyle,
      leftIcon,
      rightIcon,
      error = false,
      onFocus,
      onBlur,
      label,
      ...props
    }: TextInputProps,
    ref: any,
  ) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const borderWidth = useSharedValue(1);
    const borderColor = useSharedValue(theme.colors.border);

    const getBorderColor = () => {
      if (error) return theme.colors.destructive;
      if (isFocused) return theme.colors.ring;
      return theme.colors.border;
    };

    const getBorderWidth = () => {
      if (isFocused || error) return 2;
      return 1;
    };

    const handleFocus = (e: any) => {
      setIsFocused(true);
      borderColor.value = withTiming(getBorderColor(), {
        duration: 200,
        easing: Easing.inOut(Easing.quad),
      });
      borderWidth.value = withTiming(getBorderWidth(), {
        duration: 200,
        easing: Easing.inOut(Easing.quad),
      });
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      borderColor.value = withTiming(getBorderColor(), {
        duration: 200,
        easing: Easing.inOut(Easing.quad),
      });
      borderWidth.value = withTiming(getBorderWidth(), {
        duration: 200,
        easing: Easing.inOut(Easing.quad),
      });
      onBlur?.(e);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      borderWidth: borderWidth.value,
      borderColor: borderColor.value,
    }));

    const styles = useMemo(
      () =>
        StyleSheet.create({
          wrapper: {
            gap: theme.spacing.xs,
          },
          container: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.input,
            borderRadius: theme.borderRadius.md,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            gap: theme.spacing.sm,
          },
          input: {
            flex: 1,
            color: theme.colors.foreground,
            fontSize: theme.typography.base,
            ...(Platform.OS === "web" && {
              outlineStyle: "none",
              outlineWidth: 0,
              borderWidth: 0,
            }),
          },
        }),
      [theme],
    );

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label && (
          <ThemedText variant="sm" weight="medium" color={error ? "destructive" : "foreground"}>
            {label}
          </ThemedText>
        )}
        <Animated.View style={[styles.container, animatedStyle]}>
          {leftIcon}
          <AnimatedTextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={theme.colors.mutedForeground}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {rightIcon}
        </Animated.View>
      </View>
    );
  },
);

TextInput.displayName = "TextInput";

export default TextInput;
