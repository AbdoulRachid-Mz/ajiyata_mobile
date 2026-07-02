// @/components/ui/tooltip.tsx
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  LayoutChangeEvent,
  Pressable,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/contexts/theme-context";

// Types for tooltip positioning and state
type TooltipPlacement = "top" | "bottom" | "left" | "right";
type TooltipTrigger = "hover" | "press" | "longPress";

type TriggerProps = {
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
};

interface TooltipContextType {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  placement: TooltipPlacement;
  resolvedPlacement: TooltipPlacement;
  setMeasuredDimensions: (w: number, h: number) => void;
  tooltipWidth: number;
  tooltipHeight: number;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

// Custom hook to access tooltip context
const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within TooltipProvider");
  }
  return context;
};

// Main Tooltip Provider component
interface TooltipProps {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: TooltipPlacement;
  trigger?: TooltipTrigger;
  delayDuration?: number;
  skipDelayDuration?: number;
}

const Tooltip = ({
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  placement = "top",
  trigger = "press",
  delayDuration = 300,
  skipDelayDuration = 300,
}: TooltipProps) => {
  const [isInternalVisible, setIsInternalVisible] = useState(defaultOpen);
  const [resolvedPlacement, setResolvedPlacement] =
    useState<TooltipPlacement>(placement);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const isControlled = open !== undefined;
  const isVisible = isControlled ? open : isInternalVisible;

  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const timeoutId = setTimeout(() => {
      if (!isControlled) setIsInternalVisible(true);
      onOpenChange?.(true);
    }, delayDuration);
    // Type-safe assignment for cross-platform compatibility
    timeoutRef.current = timeoutId as unknown as number;
  }, [isControlled, onOpenChange, delayDuration]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const timeoutId = setTimeout(() => {
      if (!isControlled) setIsInternalVisible(false);
      onOpenChange?.(false);
    }, skipDelayDuration);
  }, [isControlled, onOpenChange, skipDelayDuration]);

  const toggle = useCallback(() => {
    if (isVisible) hide();
    else show();
  }, [isVisible, show, hide]);

  const setMeasuredDimensions = useCallback(
    (width: number, height: number) => {
      setTooltipWidth(width);
      setTooltipHeight(height);
      // Auto-adjust placement based on screen space
      const { width: screenWidth, height: screenHeight } =
        Dimensions.get("window");
      let newPlacement = placement;

      // Check if we have enough space in current placement
      if (placement === "top" && tooltipHeight > screenHeight * 0.1) {
        newPlacement = "bottom";
      } else if (placement === "bottom" && tooltipHeight > screenHeight * 0.1) {
        newPlacement = "top";
      } else if (placement === "left" && tooltipWidth > screenWidth * 0.2) {
        newPlacement = "right";
      } else if (placement === "right" && tooltipWidth > screenWidth * 0.2) {
        newPlacement = "left";
      }

      setResolvedPlacement(newPlacement);
    },
    [placement, tooltipWidth, tooltipHeight],
  );

  const contextValue: TooltipContextType = {
    isVisible,
    show,
    hide,
    toggle,
    placement,
    resolvedPlacement,
    setMeasuredDimensions,
    tooltipWidth,
    tooltipHeight,
  };

  return (
    <TooltipContext.Provider value={contextValue}>
      <View style={styles.container}>{children}</View>
    </TooltipContext.Provider>
  );
};

// Tooltip Trigger component
interface TooltipTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

const TooltipTrigger = ({ children, asChild = false }: TooltipTriggerProps) => {
  const { show, hide, toggle } = useTooltip();

  if (asChild && React.isValidElement<TriggerProps>(children)) {
    return React.cloneElement(children, {
      onPressIn: () => {
        children.props.onPressIn?.();
        show();
      },
      onPressOut: () => {
        children.props.onPressOut?.();
        hide();
      },
      onLongPress: () => {
        children.props.onLongPress?.();
        toggle();
      },
    });
  }

  return (
    <Pressable onPressIn={show} onPressOut={hide} onLongPress={toggle}>
      {children}
    </Pressable>
  );
};

// Tooltip Content component
interface TooltipContentProps {
  children: ReactNode;
  sideOffset?: number;
  alignOffset?: number;
  style?: ViewStyle;
  className?: string;
}

const TooltipContent = ({
  children,
  sideOffset = 8,
  alignOffset = 0,
  style,
}: TooltipContentProps) => {
  const { theme, isDark } = useTheme();
  const {
    isVisible,
    resolvedPlacement,
    setMeasuredDimensions,
    tooltipWidth,
    tooltipHeight,
  } = useTooltip();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [layoutMeasured, setLayoutMeasured] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  // Measure tooltip dimensions
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setMeasuredDimensions(width, height);
    setLayoutMeasured(true);
  };

  // Calculate position based on resolved placement
  const getPositionStyle = (): ViewStyle => {
    if (!layoutMeasured) return {};

    switch (resolvedPlacement) {
      case "top":
        return {
          marginBottom: sideOffset,
          alignSelf: "center",
          transform: [{ translateY: -tooltipHeight }],
        };
      case "bottom":
        return {
          marginTop: sideOffset,
          alignSelf: "center",
        };
      case "left":
        return {
          marginRight: sideOffset,
          alignSelf: "center",
          transform: [{ translateX: -tooltipWidth }],
        };
      case "right":
        return {
          marginLeft: sideOffset,
          alignSelf: "center",
        };
      default:
        return {};
    }
  };

  if (!isVisible && !layoutMeasured) return null;

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.tooltipContent,
        {
          backgroundColor: isDark ? theme.colors.card : theme.colors.background,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
          opacity: fadeAnim,
          transform: [
            {
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
              }),
            },
          ],
          ...getPositionStyle(),
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.tooltipText,
          {
            color: theme.colors.foreground,
            fontSize: theme.typography.xs,
            lineHeight: theme.typography.xs * 1.4,
          },
        ]}
      >
        {children}
      </Text>
      {/* Tooltip arrow */}
      <View
        style={[
          styles.arrow,
          {
            backgroundColor: isDark
              ? theme.colors.card
              : theme.colors.background,
            borderColor: theme.colors.border,
            borderWidth: 1,
            ...(resolvedPlacement === "top" && {
              borderLeftWidth: 0,
              borderTopWidth: 0,
              bottom: -6,
              transform: [{ rotate: "45deg" }],
            }),
            ...(resolvedPlacement === "bottom" && {
              borderRightWidth: 0,
              borderBottomWidth: 0,
              top: -6,
              transform: [{ rotate: "45deg" }],
            }),
            ...(resolvedPlacement === "left" && {
              borderLeftWidth: 0,
              borderBottomWidth: 0,
              right: -6,
              transform: [{ rotate: "45deg" }],
            }),
            ...(resolvedPlacement === "right" && {
              borderRightWidth: 0,
              borderTopWidth: 0,
              left: -6,
              transform: [{ rotate: "45deg" }],
            }),
          },
        ]}
      />
    </Animated.View>
  );
};

// Internal styles
const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tooltipContent: {
    position: "absolute",
    maxWidth: 280,
    zIndex: 1000,
  },
  tooltipText: {
    textAlign: "center",
    fontWeight: "500",
  },
  arrow: {
    position: "absolute",
    width: 12,
    height: 12,
  },
});

// Export all tooltip components
export { Tooltip, TooltipTrigger, TooltipContent };
