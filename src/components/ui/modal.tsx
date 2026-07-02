// @/components/ui/modal.tsx
import { useTheme } from "@/contexts/theme-context";
import { ReactNode, forwardRef, useMemo } from "react";
import {
  ModalProps,
  Modal as RNModal,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ThemedModalProps extends ModalProps {
  children: ReactNode;
  visible: boolean;
  onClose?: () => void;
  className?: string;
  style?: any;
  overlayStyle?: any;
  animationDuration?: number;
  dismissOnOverlayPress?: boolean;
}

const ThemedModal = forwardRef<RNModal, ThemedModalProps>(
  (
    {
      children,
      visible,
      onClose,
      animationDuration = 300,
      dismissOnOverlayPress = true,
      overlayStyle,
      style,
      ...props
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);
    const translateY = useSharedValue(20);

    const handleShow = () => {
      opacity.value = withTiming(1, {
        duration: animationDuration,
        easing: Easing.out(Easing.quad),
      });
      scale.value = withTiming(1, {
        duration: animationDuration,
        easing: Easing.out(Easing.quad),
      });
      translateY.value = withTiming(0, {
        duration: animationDuration,
        easing: Easing.out(Easing.quad),
      });
    };

    const handleHide = () => {
      opacity.value = withTiming(0, {
        duration: animationDuration,
        easing: Easing.in(Easing.quad),
      });
      scale.value = withTiming(0.9, {
        duration: animationDuration,
        easing: Easing.in(Easing.quad),
      });
      translateY.value = withTiming(20, {
        duration: animationDuration,
        easing: Easing.in(Easing.quad),
      });
    };

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
      opacity: opacity.value,
    }));

    const styles = useMemo(
      () =>
        StyleSheet.create({
          overlay: {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: theme.spacing.lg,
          },
          content: {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.lg,
            width: "100%",
            maxWidth: 500,
            maxHeight: "90%",
            overflow: "hidden",
          },
        }),
      [theme],
    );

    return (
      <RNModal
        ref={ref}
        visible={visible}
        transparent
        animationType="none"
        onShow={handleShow}
        onRequestClose={onClose}
        {...props}
      >
        <TouchableWithoutFeedback
          onPress={dismissOnOverlayPress ? onClose : undefined}
        >
          <Animated.View
            style={[styles.overlay, overlayStyle, overlayAnimatedStyle]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                style={[styles.content, style, contentAnimatedStyle]}
              >
                {children}
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNModal>
    );
  },
);

ThemedModal.displayName = "Modal";

export default ThemedModal;
