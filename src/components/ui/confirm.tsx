// @/components/ui/confirm.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/theme-context';

// Confirmation types
export type ConfirmType = 'dialog' | 'drawer' | 'alert';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmContextType {
  showConfirm: (options: ConfirmOptions) => void;
  hideConfirm: () => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const ConfirmProvider = ({ children }: { children: ReactNode  }) => {
  const { theme, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const slideAnim = useState(new Animated.Value(0))[0];

  const showConfirm = useCallback((newOptions: ConfirmOptions) => {
    setOptions({
      ...newOptions,
      type: newOptions.type || 'dialog',
      confirmText: newOptions.confirmText || 'Confirm',
      cancelText: newOptions.cancelText || 'Cancel',
    });
    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 25,
    }).start();
  }, [slideAnim]);

  const hideConfirm = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setOptions(null);
    });
  }, [slideAnim]);

  const handleConfirm = useCallback(() => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    hideConfirm();
  }, [options, hideConfirm]);

  const handleCancel = useCallback(() => {
    if (options?.onCancel) {
      options.onCancel();
    }
    hideConfirm();
  }, [options, hideConfirm]);

  if (!options) return <>{children}</>;

  const renderAlert = () => (
    <View style={[styles.alertContainer, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.title, { color: theme.colors.foreground }]}>
        {options.title}
      </Text>
      {options.message && (
        <Text style={[styles.message, { color: theme.colors.mutedForeground }]}>
          {options.message}
        </Text>
      )}
      <View style={styles.alertButtons}>
        <TouchableOpacity
          style={[styles.button, { borderColor: theme.colors.border }]}
          onPress={handleCancel}
        >
          <Text style={[styles.buttonText, { color: theme.colors.foreground }]}>
            {options.cancelText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            {
              backgroundColor: options.isDestructive
                ? theme.colors.destructive
                : theme.colors.primary,
            },
          ]}
          onPress={handleConfirm}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: options.isDestructive
                  ? theme.colors.destructiveForeground
                  : theme.colors.primaryForeground,
              },
            ]}
          >
            {options.confirmText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDialog = () => (
    <View style={[styles.dialogContainer, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.title, { color: theme.colors.foreground }]}>
        {options.title}
      </Text>
      {options.message && (
        <Text style={[styles.message, { color: theme.colors.mutedForeground }]}>
          {options.message}
        </Text>
      )}
      <View style={styles.divider} />
      <View style={styles.dialogButtons}>
        <TouchableOpacity
          style={[styles.dialogButton, { borderRightColor: theme.colors.border }]}
          onPress={handleCancel}
        >
          <Text style={[styles.dialogButtonText, { color: theme.colors.foreground }]}>
            {options.cancelText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dialogButton}
          onPress={handleConfirm}
        >
          <Text
            style={[
              styles.dialogButtonText,
              {
                color: options.isDestructive
                  ? theme.colors.destructive
                  : theme.colors.primary,
              },
            ]}
          >
            {options.confirmText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDrawer = () => {
    const translateY = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [SCREEN_HEIGHT * 0.4, 0],
    });

    return (
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            backgroundColor: theme.colors.card,
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          style={[styles.drawerHandle, { backgroundColor: theme.colors.border }]}
        />
        <Text style={[styles.drawerTitle, { color: theme.colors.foreground }]}>
          {options.title}
        </Text>
        {options.message && (
          <Text
            style={[styles.drawerMessage, { color: theme.colors.mutedForeground }]}
          >
            {options.message}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.drawerAction,
            {
              backgroundColor: options.isDestructive
                ? theme.colors.destructive
                : theme.colors.primary,
            },
          ]}
          onPress={handleConfirm}
        >
          <Text
            style={[
              styles.drawerActionText,
              {
                color: options.isDestructive
                  ? theme.colors.destructiveForeground
                  : theme.colors.primaryForeground,
              },
            ]}
          >
            {options.confirmText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.drawerAction, { backgroundColor: theme.colors.secondary }]}
          onPress={handleCancel}
        >
          <Text
            style={[styles.drawerActionText, { color: theme.colors.secondaryForeground }]}
          >
            {options.cancelText}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderContent = () => {
    switch (options.type) {
      case 'alert':
        return renderAlert();
      case 'drawer':
        return renderDrawer();
      case 'dialog':
      default:
        return renderDialog();
    }
  };

  return (
    <>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={hideConfirm}
      >
        <Pressable style={styles.overlay} onPress={handleCancel}>
          <View
            style={[
              styles.centeredContainer,
              options.type === 'drawer' && styles.drawerWrapper,
            ]}
          >
            <Pressable>{renderContent()}</Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  drawerWrapper: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  alertContainer: {
    width: Math.min(SCREEN_WIDTH - 48, 320),
    borderRadius: 14,
    padding: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dialogContainer: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    borderRadius: 12,
    padding: 20,
    overflow: 'hidden',
  },
  drawerContainer: {
    width: SCREEN_WIDTH,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  drawerHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  drawerMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
    marginHorizontal: -20,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRightWidth: 1,
  },
  dialogButtonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  drawerAction: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  drawerActionText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
