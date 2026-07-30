import React, { useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated, Text, Dimensions, Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { LinearGradient } from "expo-linear-gradient";

SplashScreen.preventAutoHideAsync().catch(() => {});

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  const { width, height } = Dimensions.get("window");
  
  // Valeurs d'animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(30)).current;
  const containerFadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Interpolation pour la rotation (Transforme le nombre en degrés string)
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ["0deg", "5deg", "-5deg", "3deg", "0deg"],
  });

  useEffect(() => {
    // Masquer le splash screen natif d'Expo
    SplashScreen.hideAsync().catch(() => {});

    // Séquence d'animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.timing(rotateAnim, {
        toValue: 4,
        duration: 600,
        useNativeDriver: true,
      }),
      
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
      
      Animated.delay(800),
      
      Animated.parallel([
        Animated.timing(containerFadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onAnimationComplete();
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-200, 0, 200],
  });

  const primaryColor = "#15803D";
  const primaryLight = "#22C55E";
  const background = "#FAF7EE";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerFadeAnim,
          backgroundColor: background,
          transform: [{ scale: containerFadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1.05, 1],
          }) }],
        },
      ]}
    >
      <LinearGradient
        colors={[background, `${primaryColor}08`, background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.decorativeCircle,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.3, 0.1],
            }),
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.2],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.decorativeCircle2,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.2, 0.05],
            }),
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
              },
            ],
          },
        ]}
      />

      <View style={styles.contentContainer}>
        <View style={styles.logoWrapper}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: rotate }, // <-- Corrigé ici
              ],
            }}
          >
            <Image
              source={require("@/assets/images/primary-2.png")}
              style={[styles.logo, { width: width * 0.4, height: width * 0.4 }]}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslate }],
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.15, 0],
                }),
              },
            ]}
          />
        </View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textFadeAnim,
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          <Text style={[styles.title, { color: primaryColor }]}>
            Ajiya Ta
          </Text>
          <Text style={[styles.subtitle, { color: "#667085" }]}>
            Gérez vos finances & budgets en toute simplicité
          </Text>

          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                  backgroundColor: primaryLight,
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: textFadeAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.8, 1],
            }),
          },
        ]}
      >
        <View style={styles.footerDots}>
          <View style={[styles.dot, { backgroundColor: primaryColor }]} />
          <View style={[styles.dot, { backgroundColor: primaryLight, opacity: 0.5 }]} />
          <View style={[styles.dot, { backgroundColor: primaryLight, opacity: 0.2 }]} />
        </View>
        <Text style={[styles.footerText, { color: "#98A2B3" }]}>
          Secured Financial Intelligence
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeCircle: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: "#15803D",
    top: -width * 0.3,
    right: -width * 0.3,
  },
  decorativeCircle2: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: "#22C55E",
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  logoWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logo: {
    marginBottom: 0,
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
    transform: [{ skewX: "-20deg" }],
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 24,
  },
  progressContainer: {
    width: width * 0.5,
    height: 3,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  footer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
    alignItems: "center",
    zIndex: 1,
  },
  footerDots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "500",
  },
});