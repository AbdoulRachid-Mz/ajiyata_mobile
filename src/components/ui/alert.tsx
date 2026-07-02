// @/components/ui/alert.tsx
import React, { createContext, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/theme-context";

// Alert variant types that match our theme color system
type AlertVariant = "default" | "primary" | "destructive" | "muted";

// Component props definition
interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  style?: ViewStyle;
  className?: string;
}

interface AlertTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface AlertIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
}

// Context to pass theme and variant down to compound components
interface AlertContextType {
  theme: ReturnType<typeof useTheme>["theme"];
  isDark: boolean;
  variant: AlertVariant;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Main alert hook for child components
const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context === undefined) {
    throw new Error(
      "Alert compound components must be used within an Alert parent",
    );
  }
  return context;
};

// Get variant-specific styles based on current theme
const getVariantStyles = (
  variant: AlertVariant,
  theme: ReturnType<typeof useTheme>["theme"],
) => {
  const variantConfig = {
    default: {
      background: theme.colors.card,
      border: theme.colors.border,
      iconColor: theme.colors.foreground,
    },
    primary: {
      background: theme.colors.accent,
      border: theme.colors.primary,
      iconColor: theme.colors.primary,
    },
    destructive: {
      background:
        "hsla(" +
        theme.colors.destructive.split(" ")[0] +
        " " +
        theme.colors.destructive.split(" ")[1] +
        " " +
        theme.colors.destructive.split(" ")[2] +
        " / 0.1)",
      border: theme.colors.destructive,
      iconColor: theme.colors.destructive,
    },
    muted: {
      background: theme.colors.muted,
      border: theme.colors.border,
      iconColor: theme.colors.mutedForeground,
    },
  };

  return variantConfig[variant];
};

// Main Alert component
const Alert = ({
  children,
  variant = "default",
  style,
  ...props
}: AlertProps) => {
  const { theme, isDark } = useTheme();
  const variantStyles = getVariantStyles(variant, theme);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Fade in animation on mount
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <AlertContext.Provider value={{ theme, isDark, variant }}>
      <Animated.View
        style={[
          styles.base,
          {
            backgroundColor: variantStyles.background,
            borderColor: variantStyles.border,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
            ],
          },
          style,
        ]}
        {...props}
      >
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </AlertContext.Provider>
  );
};

// Alert Title subcomponent
const AlertTitle = ({ children, style }: AlertTitleProps) => {
  const theme = useAlertContext()?.theme;

  return (
    <Text
      style={[
        styles.title,
        {
          color: theme?.colors?.cardForeground || theme?.colors?.cardForeground,
          fontSize: theme?.typography?.base,
          fontFamily: "Inter-SemiBold",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// Alert Description subcomponent
const AlertDescription = ({ children, style }: AlertDescriptionProps) => {
  const theme = useAlertContext()?.theme;

  return (
    <Text
      style={[
        styles.description,
        {
          color:
            theme?.colors?.mutedForeground || theme?.colors?.mutedForeground,
          fontSize: theme?.typography?.sm,
          marginTop: theme?.spacing?.xs,
          fontFamily: "Inter-Regular",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// Alert Icon subcomponent
const AlertIcon = ({ name, size = 20 }: AlertIconProps) => {
  const theme = useAlertContext()?.theme;

  return (
    <Ionicons
      name={name}
      size={size}
      color={
        theme?.colors?.foreground ||
        theme?.colors?.foreground ||
        theme?.colors?.foreground
      }
      style={styles.icon}
    />
  );
};

// Base styles
const styles = StyleSheet.create({
  base: {
    width: "100%",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    lineHeight: 24,
    letterSpacing: -0.01,
  },
  description: {
    lineHeight: 20,
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
});

// Attach subcomponents for clean imports
Alert.Title = AlertTitle;
Alert.Description = AlertDescription;
Alert.Icon = AlertIcon;

export { Alert };
