
// @/components/ui/spacer.tsx
import { View } from "react-native";
import { useTheme } from "@/contexts/theme-context";

interface SpacerProps {
  size?: keyof ReturnType<typeof useTheme>['theme']['spacing'];
  height?: number;
}

export default function Spacer({ size, height }: SpacerProps) {
  const { theme } = useTheme();
  const finalHeight = size ? theme.spacing[size] : height || theme.spacing.md;
  return <View style={{ height: finalHeight }} />;
}
