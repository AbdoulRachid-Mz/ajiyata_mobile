import React, { useRef, useState, useEffect, Children } from "react";
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewStyle,
  FlatList,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/theme-context";
import ThemedText from "./text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CarouselProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemsPerView?: number;
  itemWidth?: number;
  spacing?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  containerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  onItemPress?: (item: any, index: number) => void;
}

export const Carousel: React.FC<CarouselProps> = ({
  data,
  renderItem,
  itemsPerView = 1,
  itemWidth,
  spacing = 12,
  autoPlay = false,
  autoPlayInterval = 3000,
  showIndicators = true,
  showArrows = true,
  loop = false,
  containerStyle,
  contentContainerStyle,
  onItemPress,
}) => {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const autoPlayTimer = useRef<number | null>(null);

  const calculatedItemWidth =
    itemWidth ||
    (SCREEN_WIDTH - 32 - (itemsPerView - 1) * spacing) / itemsPerView;

  const scrollToIndex = (index: number) => {
    const targetIndex = Math.max(0, Math.min(index, data.length - 1));
    flatListRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
    });
    setCurrentIndex(targetIndex);
  };

  const handleNext = () => {
    if (loop) {
      const nextIndex = (currentIndex + 1) % data.length;
      scrollToIndex(nextIndex);
    } else {
      const nextIndex = Math.min(currentIndex + 1, data.length - 1);
      scrollToIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    if (loop) {
      const prevIndex = (currentIndex - 1 + data.length) % data.length;
      scrollToIndex(prevIndex);
    } else {
      const prevIndex = Math.max(currentIndex - 1, 0);
      scrollToIndex(prevIndex);
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (calculatedItemWidth + spacing));
    setCurrentIndex(index);
  };

  // Auto-play
  useEffect(() => {
    if (isAutoPlaying && autoPlay) {
      autoPlayTimer.current = window.setInterval(() => {
        handleNext();
      }, autoPlayInterval) as unknown as number;
    }
    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    };
  }, [isAutoPlaying, currentIndex]);

  // Rendu des indicateurs
  const renderIndicators = () => {
    if (!showIndicators || data.length <= 1) return null;

    return (
      <View style={styles.indicatorsContainer}>
        {data.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => scrollToIndex(index)}
              style={[
                styles.indicator,
                {
                  backgroundColor: isActive
                    ? theme.colors.primary
                    : theme.colors.border,
                  width: isActive ? 24 : 8,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  // Rendu des flèches
  const renderArrows = () => {
    if (!showArrows || data.length <= 1) return null;

    return (
      <>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[
              styles.arrow,
              styles.arrowLeft,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
            onPress={handlePrev}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {currentIndex < data.length - 1 && (
          <TouchableOpacity
            style={[
              styles.arrow,
              styles.arrowRight,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
            onPress={handleNext}
          >
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={calculatedItemWidth + spacing}
        decelerationRate="fast"
        contentContainerStyle={[
          { paddingHorizontal: 16 },
          contentContainerStyle,
        ]}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            key={index}
            onPress={() => onItemPress?.(item, index)}
            activeOpacity={0.8}
            style={{
              width: calculatedItemWidth,
              marginRight: index < data.length - 1 ? spacing : 0,
            }}
          >
            {renderItem(item, index)}
          </TouchableOpacity>
        )}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      {renderArrows()}
      {renderIndicators()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    transitionDuration: "300ms",
  },
  arrow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  arrowLeft: {
    left: 8,
  },
  arrowRight: {
    right: 8,
  },
});
