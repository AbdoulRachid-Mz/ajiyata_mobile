import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';

// Animation d'entrée avec effet de rebond
export const useEntryAnimation = (delay = 0) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    progress.value = withDelay(delay, withSpring(1, {
      damping: 15,
      stiffness: 80,
      mass: 1,
    }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0.8, 0.95, 1],
          Extrapolate.CLAMP
        ),
      },
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [40, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  return animatedStyle;
};

// Animation de transition entre les slides
export const useSlideTransition = (index: number, currentIndex: number) => {
  const isActive = index === currentIndex;
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0.3, { duration: 300 }),
    transform: [
      {
        scale: withSpring(isActive ? 1 : 0.95, {
          damping: 20,
          stiffness: 200,
        }),
      },
    ],
  }));

  return animatedStyle;
};