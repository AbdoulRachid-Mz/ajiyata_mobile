
// @/components/ui/keyboard-avoiding-view.tsx
import { KeyboardAvoidingView, KeyboardAvoidingViewProps, Platform } from "react-native";
import { forwardRef } from "react";

interface ThemedKeyboardAvoidingViewProps extends KeyboardAvoidingViewProps {
  className?: string;
}

const ThemedKeyboardAvoidingView = forwardRef<KeyboardAvoidingView, ThemedKeyboardAvoidingViewProps>(
  (
    {
      behavior,
      ...props
    },
    ref
  ) => {
    return (
      <KeyboardAvoidingView
        ref={ref}
        behavior={behavior || (Platform.OS === "ios" ? "padding" : "height")}
        {...props}
      />
    );
  }
);

ThemedKeyboardAvoidingView.displayName = "KeyboardAvoidingView";

export default ThemedKeyboardAvoidingView;

