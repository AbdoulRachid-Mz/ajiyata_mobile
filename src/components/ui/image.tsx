
// @/components/ui/image.tsx
import { Image as ExpoImage, ImageProps, ImageStyle } from "expo-image";
import { useTheme } from "@/contexts/theme-context";
import { ReactNode, forwardRef, useMemo } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  AnimatedProps,
} from "react-native-reanimated";


interface ThemedImageProps extends ImageProps {
  className?: string;
  style?: ImageStyle;
  animated?: boolean;
  animationDuration?: number;
}

const AnimatedImage = Animated.createAnimatedComponent(ExpoImage);

const ThemedImage = forwardRef<ExpoImage, ThemedImageProps>(
  (
    {
      style,
      animated = true,
      animationDuration = 300,
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const opacity = useSharedValue(0);

    const onLoadEnd = () => {
      if (animated) {
        opacity.value = withTiming(1, {
          duration: animationDuration,
          easing: Easing.out(Easing.quad),
        });
      } else {
        opacity.value = 1;
      }
    };

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return (
      <AnimatedImage
        ref={ref}
        style={[style, animatedStyle]}
        onLoadEnd={onLoadEnd}
        {...props}
      />
    );
  }
);

ThemedImage.displayName = "Image";

export default ThemedImage;

