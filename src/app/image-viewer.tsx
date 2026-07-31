// src/app/image-viewer.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/contexts/theme-context';
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedText from '@/components/ui/text';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Vérifier si on est dans un environnement qui supporte MediaLibrary
const isExpoGo = Constants.appOwnership === 'expo';
let MediaLibrary: any = null;

// Importer MediaLibrary uniquement si ce n'est pas Expo Go
if (!isExpoGo) {
  try {
    // @ts-ignore
    MediaLibrary = require('expo-media-library');
  } catch (e) {
    console.log('MediaLibrary non disponible');
  }
}

export default function ImageViewer() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { uri, title } = useLocalSearchParams<{
    uri: string;
    title?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  // Zoom avec Pinch
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Gestion du double tap
  const handleDoubleTap = () => {
    if (scale.value > 1.5) {
      scale.value = withSpring(1);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      setIsZoomed(false);
    } else {
      scale.value = withSpring(2.5);
      savedScale.value = 2.5;
      setIsZoomed(true);
    }
  };

  // Gestion du double tap avec Gesture Handler
  const tapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTap)();
    });

  // Gestion du pan (déplacement)
  const panGesture = Gesture.Pan()
    .onChange((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Gestion du pinch (zoom)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = Math.min(Math.max(event.scale * savedScale.value, 0.5), 4);
      scale.value = newScale;
      
      if (scale.value > 1) {
        const maxTranslate = 100 * (scale.value - 1);
        translateX.value = Math.min(Math.max(savedTranslateX.value, -maxTranslate), maxTranslate);
        translateY.value = Math.min(Math.max(savedTranslateY.value, -maxTranslate), maxTranslate);
      } else {
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      
      if (scale.value < 0.8) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        setIsZoomed(false);
      } else if (scale.value > 1) {
        setIsZoomed(true);
      } else {
        setIsZoomed(false);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    tapGesture
  );

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleSingleTap = () => {
    setTimeout(() => {
      if (!isZoomed) {
        toggleControls();
      }
    }, 250);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('image_viewer.share_message', { title: title || t('image_viewer.image') }),
        url: uri,
      });
    } catch (error) {
      console.error('Erreur de partage:', error);
    }
  };

  const handleDownload = async () => {
    if (!uri) return;

    if (isExpoGo || !MediaLibrary) {
      Alert.alert(
        t('common.not_available'),
        t('notifications.expo_go_warning')
      );
      return;
    }

    try {
      setIsSaving(true);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.error'),
          t('receipt_scanner.gallery_permission_denied')
        );
        setIsSaving(false);
        return;
      }

      const fileUri = FileSystem.Directory + `${Date.now()}.jpg`;
      
      let downloadUri = uri;
      if (uri.includes('cloudinary.com')) {
        downloadUri = uri + '?quality=90&format=jpg';
      }

      const { uri: savedUri } = await FileSystem.downloadAsync(
        downloadUri,
        fileUri
      );

      await MediaLibrary.saveToLibraryAsync(savedUri);

      Alert.alert(t('common.success'), t('export.success'));
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      Alert.alert(t('common.error'), t('export.share_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar hidden={!showControls} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={styles.imageContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleSingleTap}
              style={styles.imageTouchable}
            >
              <Animated.Image
                source={{ uri }}
                style={[styles.image, imageAnimatedStyle]}
                resizeMode="contain"
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
              />
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <ThemedText style={{ marginTop: 12 }} color="mutedForeground">
              {t('common.loading')}
            </ThemedText>
          </View>
        )}

        {showControls && (
          <>
            <Animated.View
              style={[
                styles.header,
                { backgroundColor: 'rgba(0,0,0,0.7)' },
              ]}
            >
              <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              
              {title && (
                <ThemedText style={styles.headerTitle} numberOfLines={1}>
                  {title}
                </ThemedText>
              )}
              
              <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.footer,
                { backgroundColor: 'rgba(0,0,0,0.7)' },
              ]}
            >
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={[styles.footerButton, { borderColor: 'rgba(255,255,255,0.3)' }]}
                  onPress={handleDownload}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={20} color="#fff" />
                      <ThemedText style={styles.footerButtonText}>
                        {t('image_viewer.download')}
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.footerButton, { borderColor: 'rgba(255,255,255,0.3)' }]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <ThemedText style={styles.footerButtonText}>
                    {t('image_viewer.share')}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.footerInfo}>
                <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.6)" />
                <ThemedText style={styles.footerInfoText}>
                  {t('image_viewer.zoom_hint')}
                </ThemedText>
              </View>
            </Animated.View>
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  imageTouchable: {
    flex: 1,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  iconButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerInfoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});