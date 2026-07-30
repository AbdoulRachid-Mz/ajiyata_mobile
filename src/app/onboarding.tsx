// src/app/onboarding.tsx

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Hooks et contextes
import { useTheme } from '@/contexts/theme-context';
import { useAppStore } from '@/stores/app-store';

// Composants UI
import ThemedSafeAreaView from '@/components/ui/safe-area-view';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';
import ThemedView from '@/components/ui/view';

// Constantes
import { ONBOARDING_SLIDES } from '@/constants/onboarding-slides';

// Services
import { initializeAccount } from '@/features/accounts/services';

// i18n
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Composant de pagination
const Pagination = ({ 
  length, 
  activeIndex,
  theme 
}: { 
  length: number; 
  activeIndex: number;
  theme: any;
}) => {
  return (
    <View style={styles.paginationContainer}>
      {Array.from({ length }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor: index === activeIndex 
                ? theme.colors.primary 
                : theme.colors.border,
              width: index === activeIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Composant de bouton "Suivant" avec animation
const NextButton = ({
  onPress,
  isLastSlide,
  theme,
}: {
  onPress: () => void;
  isLastSlide: boolean;
  theme: any;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.nextButton,
        {
          backgroundColor: isLastSlide 
            ? theme.financialColors.income 
            : theme.colors.primary,
        },
      ]}
      activeOpacity={0.8}
    >
      <Ionicons
        name={isLastSlide ? 'checkmark-outline' : 'arrow-forward-outline'}
        size={24}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
};

export default function Onboarding() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router: any = useRouter();
  const { setCurrentUser, setCurrentAccount } = useAppStore();
  
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Valeurs partagées pour les animations
  const scrollX = useSharedValue(0);
  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  // Gestionnaire du scroll
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      runOnJS(setCurrentIndex)(index);
    },
  });

  // Navigation vers la slide suivante
  const goToNextSlide = useCallback(() => {
    if (isLastSlide) {
      // Dernière slide -> aller à l'étape de configuration
      handleStart();
      return;
    }
    
    const nextIndex = currentIndex + 1;
    scrollRef.current?.scrollTo({
      x: nextIndex * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentIndex(nextIndex);
  }, [currentIndex, isLastSlide]);

  // Navigation vers la slide précédente
  const goToPreviousSlide = useCallback(() => {
    if (currentIndex === 0) return;
    const prevIndex = currentIndex - 1;
    scrollRef.current?.scrollTo({
      x: prevIndex * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentIndex(prevIndex);
  }, [currentIndex]);

  // Démarrage de l'application
  const handleStart = async () => {
    try {
      setLoading(true);
      // Rediriger vers la page de configuration
      router.push('/onboarding-config');
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rendu d'une slide
  const renderSlide = (slide: typeof ONBOARDING_SLIDES[0], index: number) => {
    // Animations d'entrée/sortie
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const imageScale = useDerivedValue(() => {
      return interpolate(
        scrollX.value,
        inputRange,
        [0.6, 1, 0.6],
        Extrapolate.CLAMP
      );
    });

    const imageTranslateY = useDerivedValue(() => {
      return interpolate(
        scrollX.value,
        inputRange,
        [40, 0, 40],
        Extrapolate.CLAMP
      );
    });

    const titleOpacity = useDerivedValue(() => {
      return interpolate(
        scrollX.value,
        inputRange,
        [0.3, 1, 0.3],
        Extrapolate.CLAMP
      );
    });

    const titleTranslateY = useDerivedValue(() => {
      return interpolate(
        scrollX.value,
        inputRange,
        [30, 0, 30],
        Extrapolate.CLAMP
      );
    });

    const imageAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: imageScale.value },
        { translateY: imageTranslateY.value },
      ],
    }));

    const titleAnimatedStyle = useAnimatedStyle(() => ({
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateY.value }],
    }));

    const isActive = index === currentIndex;

    return (
      <View key={slide.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {/* Arrière-plan avec gradient */}
        <LinearGradient
          colors={[slide.color + '20', slide.color + '05']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Illustration */}
        <Animated.View style={[styles.illustrationContainer, imageAnimatedStyle]}>
          <View
            style={[
              styles.illustrationCircle,
              {
                backgroundColor: slide.color + '15',
                borderColor: slide.color + '30',
              },
            ]}
          >
            <Ionicons
              name={slide.icon as any}
              size={80}
              color={slide.color}
              style={styles.illustrationIcon}
            />
          </View>
        </Animated.View>

        {/* Texte - Utiliser les traductions */}
        <Animated.View style={[styles.textContainer, titleAnimatedStyle]}>
          <ThemedText
            variant="3xl"
            weight="bold"
            style={[styles.title, { color: slide.color }]}
          >
            {t(`onboarding.${slide.id}.title`)}
          </ThemedText>
          
          <ThemedText
            variant="lg"
            color="mutedForeground"
            style={styles.description}
          >
            {t(`onboarding.${slide.id}.description`)}
          </ThemedText>
        </Animated.View>
      </View>
    );
  };

  return (
    <ThemedSafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.push('/onboarding-config')}
      >
        <ThemedText variant="sm" color="mutedForeground">
          {t('common.skip')}
        </ThemedText>
      </TouchableOpacity>

      {/* ScrollView des slides */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {ONBOARDING_SLIDES.map((slide, index) => renderSlide(slide, index))}
      </Animated.ScrollView>

      {/* Footer avec pagination et boutons */}
      <View style={styles.footer}>
        <Pagination
          length={ONBOARDING_SLIDES.length}
          activeIndex={currentIndex}
          theme={theme}
        />

        <View style={styles.footerButtons}>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.prevButton, { borderColor: theme.colors.border }]}
              onPress={goToPreviousSlide}
            >
              <Ionicons name="arrow-back-outline" size={20} color={theme.colors.foreground} />
            </TouchableOpacity>
          )}

          <NextButton
            onPress={goToNextSlide}
            isLastSlide={isLastSlide}
            theme={theme}
          />
        </View>
      </View>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  illustrationCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  illustrationIcon: {
    marginLeft: 4,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 340,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    transitionDuration: '300ms',
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prevButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});