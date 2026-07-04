import { useTheme } from "@/contexts/theme-context";
import { ReactNode, forwardRef, useMemo } from "react";
import {
  Modal as RNModal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface DrawerProps {
  children: ReactNode;
  visible: boolean;
  onClose?: () => void;
  style?: any;
}

const Drawer = forwardRef<RNModal, DrawerProps>(
  ({ children, visible, onClose, style }, ref) => {
    const { theme } = useTheme();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(500);

    const handleShow = () => {
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
    };

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const styles = useMemo(() => StyleSheet.create({
      overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
      },
      content: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        width: "100%",
        maxHeight: "90%",
        overflow: "hidden",
        paddingBottom: 20,
      },
      handle: {
        width: 40,
        height: 5,
        backgroundColor: theme.colors.border,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
      }
    }), [theme]);

    return (
      <RNModal
        ref={ref}
        visible={visible}
        transparent
        animationType="none"
        onShow={handleShow}
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.content, style, contentAnimatedStyle]}>
                <View style={styles.handle} />
                {children}
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </RNModal>
    );
  }
);
Drawer.displayName = "Drawer";
export default Drawer;
