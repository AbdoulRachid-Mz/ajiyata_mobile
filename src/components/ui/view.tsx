// @/components/ui/view.tsx
import { useTheme } from "@/contexts/theme-context";
import { ReactNode, forwardRef, useEffect, useMemo } from "react";
import { StyleSheet, ViewStyle, View as RNView } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

type ViewBackground =
  | "background"
  | "card"
  | "secondary"
  | "muted"
  | "accent"
  | "transparent";

interface ViewProps {
  children: ReactNode;
  background?: ViewBackground;
  className?: string;
  style?: ViewStyle;
  animateBackgroundChange?: boolean;
  animationDuration?: number;
}

const ThemedView = forwardRef<RNView, ViewProps>(
  (
    {
      children,
      background = "transparent",
      style,
      animateBackgroundChange = true,
      animationDuration = 200,
    },
    ref,
  ) => {
    const { theme } = useTheme();


    const getBackgroundColor = () => {
      if (background === "transparent") return "transparent";
      return theme.colors[background];
    };

    
    const bg = useSharedValue(getBackgroundColor());

useEffect(() => {
  bg.value = withTiming(getBackgroundColor(), {
    duration: animationDuration,
    easing: Easing.inOut(Easing.quad),
  });
}, [theme.colors, background, animationDuration]);

    const staticStyles = useMemo(
      () =>
        StyleSheet.create({
          base: {},
        }),
      [],
    );
const animatedStyle = useAnimatedStyle(() => {
  return {
    backgroundColor: bg.value,
  };
});

    const baseStyles = [staticStyles.base, style];

    return (
      <Animated.View
        ref={ref as any}
        style={[...baseStyles, animatedStyle]}
      >
        {children}
      </Animated.View>
    );
  },
);

ThemedView.displayName = "View";

export default ThemedView;
