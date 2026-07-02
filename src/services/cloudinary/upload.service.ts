import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { getCloudinaryUploadUrl } from '@/configs/cloudinary';
import { Storage } from '@/lib/storage';

interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

interface UploadOptions {
  onProgress?: (progress: number) => void;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class CloudinaryUploadService {
  private static instance: CloudinaryUploadService;

  private constructor() {}

  static getInstance(): CloudinaryUploadService {
    if (!CloudinaryUploadService.instance) {
      CloudinaryUploadService.instance = new CloudinaryUploadService();
    }
    return CloudinaryUploadService.instance;
  }

  /**
   * Upload une image depuis l'URI locale vers Cloudinary
   */
  async uploadImage(
    uri: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Optimiser l'image avant upload
      const optimizedUri = await this.optimizeImage(uri, options);

      // Lire le fichier en base64
      const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Préparer le formulaire
      const formData = new FormData();
      formData.append('file', `data:image/jpeg;base64,${base64}`);
      formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
      formData.append('folder', 'ajiya-ta/attachments');

      // Upload vers Cloudinary
      const response = await fetch(getCloudinaryUploadUrl(), {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        publicId: data.public_id,
        url: data.url,
        secureUrl: data.secure_url,
        format: data.format,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  }

  /**
   * Optimiser l'image avant upload
   */
  private async optimizeImage(
    uri: string,
    options: UploadOptions
  ): Promise<string> {
    const { quality = 80, maxWidth = 1024, maxHeight = 1024 } = options;

    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality / 100,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      console.warn('Erreur lors de l\'optimisation, utilisation de l\'original:', error);
      return uri;
    }
  }

  /**
   * Supprimer une image de Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      // Note: La suppression nécessite une clé API, à implémenter avec une fonction Cloud
      // Pour l'instant, on simule la suppression locale
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }
}