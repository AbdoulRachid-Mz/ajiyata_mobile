
// @/components/ui/flat-list.tsx
import {
  FlatList as RNFlatList,
  FlatListProps,
  RefreshControl,
} from "react-native";
import { useTheme } from "@/contexts/theme-context";
import { forwardRef } from "react";

interface ThemedFlatListProps<T> extends FlatListProps<T> {
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
}

function ThemedFlatListComponent<T>(
  {
    refreshing,
    onRefresh,
    ...props
  }: ThemedFlatListProps<T>,
  ref: React.ForwardedRef<RNFlatList<T>>
) {
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
    <RNFlatList
      ref={ref}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      {...props}
    />
  );
}

const ThemedFlatList = forwardRef(ThemedFlatListComponent) as <T>(
  props: ThemedFlatListProps<T> & { ref?: React.ForwardedRef<RNFlatList<T>> }
) => React.ReactElement;

(ThemedFlatList as any).displayName = "FlatList";

export default ThemedFlatList;

