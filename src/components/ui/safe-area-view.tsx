// @/components/ui/safe-area-view.tsx
import { forwardRef } from "react";
import {
  SafeAreaView,
  SafeAreaViewProps,
} from "react-native-safe-area-context";

interface ThemedSafeAreaViewProps extends SafeAreaViewProps {
  className?: string;
}

const ThemedSafeAreaView = forwardRef(
  (props: ThemedSafeAreaViewProps, ref: any) => {
    return <SafeAreaView ref={ref} {...props} />;
  },
);

ThemedSafeAreaView.displayName = "SafeAreaView";

export default ThemedSafeAreaView;
