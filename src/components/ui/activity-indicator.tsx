
// @/components/ui/activity-indicator.tsx
import { ActivityIndicator as RNActivityIndicator, ActivityIndicatorProps } from "react-native";
import { useTheme } from "@/contexts/theme-context";
import { forwardRef } from "react";

interface ThemedActivityIndicatorProps extends ActivityIndicatorProps {
  className?: string;
}

const ThemedActivityIndicator = forwardRef<RNActivityIndicator, ThemedActivityIndicatorProps>(
  (
    {
      color,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();

    return (
      <RNActivityIndicator
        ref={ref}
        color={color || theme.colors.primary}
        {...props}
      />
    );
  }
);

ThemedActivityIndicator.displayName = "ActivityIndicator";

export default ThemedActivityIndicator;

