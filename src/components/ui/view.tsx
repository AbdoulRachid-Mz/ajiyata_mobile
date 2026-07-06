import { useTheme } from "@/contexts/theme-context";
import React, { forwardRef } from "react";
import {
  StyleProp,
  ViewStyle,
  View as RNView,
} from "react-native";
import Animated from "react-native-reanimated";

interface ViewProps {
  children: React.ReactNode;
  background?:
    | "background"
    | "card"
    | "secondary"
    | "muted"
    | "accent"
    | "transparent";
  style?: StyleProp<ViewStyle>;
}

const ThemedView = forwardRef<RNView, ViewProps>(
  ({ children, background = "transparent", style }, ref) => {
    const { theme } = useTheme();

    const backgroundColor =
      background === "transparent"
        ? "transparent"
        : theme.colors[background];

    return (
      <Animated.View
        ref={ref}
        style={[
          { backgroundColor },
          style,
        ]}
      >
        {children}
      </Animated.View>
    );
  }
);

export default ThemedView;