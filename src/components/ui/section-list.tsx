// @/components/ui/section-list.tsx
import { useTheme } from "@/contexts/theme-context";
import { forwardRef } from "react";
import { RefreshControl, SectionList, SectionListProps } from "react-native";

interface ThemedSectionListProps<T> extends SectionListProps<T> {
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const ThemedSectionList = forwardRef(
  <T,>(
    { refreshing, onRefresh, ...props }: ThemedSectionListProps<T>,
    ref: React.ForwardedRef<SectionList<T>>,
  ) => {
    const { theme, isDark } = useTheme();

    const refreshControl =
      refreshing !== undefined && onRefresh ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
          progressBackgroundColor={
            isDark ? theme.colors.card : theme.colors.background
          }
        />
      ) : undefined;

    return (
      <SectionList
        ref={ref}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        {...props}
      />
    );
  },
);

ThemedSectionList.displayName = "SectionList";

export default ThemedSectionList;
