
// @/components/ui/scroll-view.tsx
import {
  ScrollView,
  ScrollViewProps,
  RefreshControl,
} from "react-native";
import { useTheme } from "@/contexts/theme-context";
import { ReactNode, forwardRef } from "react";

interface ThemedScrollViewProps extends ScrollViewProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const ThemedScrollView = forwardRef<ScrollView, ThemedScrollViewProps>(
  (
    {
      children,
      refreshing,
      onRefresh,
      ...props
    },
    ref
  ) => {
    const { theme, isDark } = useTheme();

    const refreshControl =
      refreshing !== undefined && onRefresh ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
          progressBackgroundColor={isDark ? theme.colors.card : theme.colors.background}
        />
      ) : undefined;

    return (
      <ScrollView
        ref={ref}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
);

ThemedScrollView.displayName = "ScrollView";

export default ThemedScrollView;

