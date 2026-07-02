// @/components/ui/popup.tsx
import { useTheme } from "@/contexts/theme-context";
import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Button from "./button";
import ThemedModal from "./modal";
import ThemedText from "./text";
import ThemedView from "./view";

interface PopupProps {
  title?: string;
  message?: string;
  children?: ReactNode;
  visible: boolean;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancelButton?: boolean;
  variant?: "default" | "destructive";
}

const Popup = ({
  title,
  message,
  children,
  visible,
  onClose,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  showCancelButton = true,
  variant = "default",
}: PopupProps) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    header: {
      gap: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.xl,
      fontWeight: "700",
    },
    message: {
      fontSize: theme.typography.base,
    },
    actions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    cancelButton: {
      flex: 1,
    },
    confirmButton: {
      flex: 1,
    },
  });

  return (
    <ThemedModal visible={visible} onClose={onClose}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          {title && <ThemedText style={styles.title}>{title}</ThemedText>}
          {message && (
            <ThemedText color="mutedForeground" style={styles.message}>
              {message}
            </ThemedText>
          )}
        </ThemedView>
        {children}
        <ThemedView style={styles.actions}>
          {showCancelButton && (
            <Button
              variant="outline"
              style={styles.cancelButton}
              onPress={onClose}
            >
              {cancelText}
            </Button>
          )}
          {onConfirm && (
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              style={styles.confirmButton}
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
          )}
        </ThemedView>
      </ThemedView>
    </ThemedModal>
  );
};

export default Popup;
