// @/components/ui/switch.tsx
import { Switch as RNSwitch, SwitchProps } from "react-native";
import { useTheme } from "@/contexts/theme-context";
import { forwardRef } from "react";

interface ThemedSwitchProps extends SwitchProps {
  className?: string;
}

const ThemedSwitch = forwardRef<RNSwitch, ThemedSwitchProps>(
  ({ ...props }, ref) => {
    const { theme } = useTheme();

    return (
      <RNSwitch
        ref={ref}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.card}
        ios_backgroundColor={theme.colors.border}
        {...props}
      />
    );
  },
);

ThemedSwitch.displayName = "Switch";

export default ThemedSwitch;
