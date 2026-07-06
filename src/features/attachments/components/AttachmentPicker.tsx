import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Attachment, NewAttachment } from '@/types';
import { generateUUID, getCurrentTimestamp } from '@/utils/uuid';
import { useAppStore } from '@/stores/app-store';

interface AttachmentPickerProps {
  transactionId?: string;
  onAttachmentAdded: (attachment: Attachment) => void;
  onAttachmentRemoved: (attachmentId: string) => void;
  existingAttachments?: Attachment[];
  maxAttachments?: number;
}

export const AttachmentPicker = ({
  transactionId,
  onAttachmentAdded,
  onAttachmentRemoved,
  existingAttachments = [],
  maxAttachments = 5,
}: AttachmentPickerProps) => {
  const { theme } = useTheme();
  const { currentAccount } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions requises',
        'L\'application a besoin d\'accéder à votre appareil photo et galerie pour ajouter des pièces jointes.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    if (existingAttachments.length >= maxAttachments) {
      Alert.alert('Limite atteinte', `Vous ne pouvez pas ajouter plus de ${maxAttachments} pièces jointes.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result;

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadAttachment(asset.uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image.');
    }
  };

  const pickDocument = async () => {
    if (existingAttachments.length >= maxAttachments) {
      Alert.alert('Limite atteinte', `Vous ne pouvez pas ajouter plus de ${maxAttachments} pièces jointes.`);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAttachment(result.assets[0].uri, result.assets[0].name);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le document.');
    }
  };

  const uploadAttachment = async (uri: string, fileName?: string) => {
    if (!currentAccount) {
      Alert.alert('Erreur', 'Compte non trouvé.');
      return;
    }

    setIsUploading(true);
    const attachmentId = generateUUID();

    try {
      // Créer l'attachment local (l'upload Cloudinary se fera lors de la synchronisation)
      const newAttachment: NewAttachment = {
        id: attachmentId,
        accountId: currentAccount.id,
        transactionId: transactionId || null,
        type: 'image',
        localUri: uri,
        uploadUrl: null,
        uploadId: null,
        size: 0,
        isSynced: false, // Sera synchronisé plus tard
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        deviceId: 'temp-device-id',
        version: 1,
        syncStatus: 'pending', // 'pending' pour indiquer qu'il doit être synchronisé
        metadata: {
          fileName: fileName || 'image.jpg',
        },
      };

      onAttachmentAdded(newAttachment as Attachment);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Erreur lors du traitement de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de traiter l\'image.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    Alert.alert(
      'Supprimer la pièce jointe',
      'Voulez-vous vraiment supprimer cette pièce jointe ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onAttachmentRemoved(attachmentId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Attachments existants */}
      {existingAttachments.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentList}>
          {existingAttachments.map((attachment) => (
            <View key={attachment.id} style={[styles.attachmentItem, { borderColor: theme.colors.border }]}>
              {attachment.localUri || attachment.uploadUrl ? (
                <Image
                  source={{ uri: attachment.localUri || attachment.uploadUrl || '' }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.attachmentPlaceholder, { backgroundColor: theme.colors.muted }]}>
                  <Ionicons name="document-outline" size={32} color={theme.colors.mutedForeground} />
                </View>
              )}
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: theme.colors.destructive }]}
                onPress={() => removeAttachment(attachment.id)}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Upload button */}
      {existingAttachments.length < maxAttachments && (
        <View style={styles.uploadButtons}>
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: theme.colors.border }]}
            onPress={() => pickImage('gallery')}
            disabled={isUploading}
          >
            <Ionicons name="images-outline" size={24} color={theme.colors.foreground} />
            <ThemedText variant="xs" style={{ marginTop: 4 }}>Galerie</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: theme.colors.border }]}
            onPress={() => pickImage('camera')}
            disabled={isUploading}
          >
            <Ionicons name="camera-outline" size={24} color={theme.colors.foreground} />
            <ThemedText variant="xs" style={{ marginTop: 4 }}>Appareil photo</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: theme.colors.border }]}
            onPress={pickDocument}
            disabled={isUploading}
          >
            <Ionicons name="document-outline" size={24} color={theme.colors.foreground} />
            <ThemedText variant="xs" style={{ marginTop: 4 }}>Document</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload progress */}
      {isUploading && (
        <View style={[styles.uploadProgress, { backgroundColor: theme.colors.muted }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <ThemedText variant="xs" style={{ marginLeft: 8 }}>
            Téléchargement en cours...
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  attachmentList: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  attachmentItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  attachmentPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
});