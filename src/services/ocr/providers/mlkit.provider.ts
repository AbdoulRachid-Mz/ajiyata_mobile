// src/services/ocr/providers/mlkit.provider.ts

import * as ImageManipulator from "expo-image-manipulator";
import * as Image from "expo-image";
import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition";
import { OCRProvider, OCRResult, OCRProgress } from "./ocr-provider.interface";

// Interfaces enrichies pour le résultat ML Kit
interface MLKitElement {
  text: string;
}

interface MLKitLine {
  text: string;
  elements: MLKitElement[];
}

interface MLKitBlock {
  text: string;
  lines: MLKitLine[];
}

interface MLKitResult {
  text: string;
  blocks: MLKitBlock[];
}

export interface MLKitProviderOptions {
  /**
   * Taille maximale de l'image en pixels (par défaut: 1500)
   */
  maxImageSize?: number;

  /**
   * Qualité de compression (par défaut: 0.9)
   */
  compressionQuality?: number;
}

export class MLKitProvider implements OCRProvider {
  private isInitialized = false;
  private options: Required<MLKitProviderOptions>;

  constructor(options?: MLKitProviderOptions) {
    this.options = {
      maxImageSize: options?.maxImageSize || 1500,
      compressionQuality: options?.compressionQuality || 0.9,
    };
  }

  /**
   * Initialise le provider ML Kit
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.isInitialized = true;
    console.log("✅ ML Kit OCR initialisé avec succès");
  }

  /**
   * Reconnaît le texte dans une image
   */
  async recognize(
    imageUri: string,
    onProgress?: (progress: OCRProgress) => void,
  ): Promise<OCRResult> {
    try {
      // 1. Vérifier l'initialisation
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 2. Optimiser l'image si nécessaire
      onProgress?.({
        status: "loading",
        message: "Optimisation de l'image...",
      });

      const optimizedImage = await this.optimizeImage(imageUri);

      // 3. Lancer la reconnaissance ML Kit
      onProgress?.({
        status: "recognizing",
        message: "Analyse du texte...",
        progress: 0.1,
      });

      const result = await this.performRecognition(optimizedImage, onProgress);

      // 4. Valider le résultat
      if (!result || typeof result.text !== "string") {
        throw new Error("Résultat ML Kit invalide");
      }

      // 5. Calculer la confiance
      const confidence = this.calculateConfidence(result);

      onProgress?.({
        status: "done",
        message: "Analyse terminée !",
      });

      return {
        text: result.text,
        confidence,
      };
    } catch (error) {
      console.error("❌ Erreur de reconnaissance ML Kit:", error);
      onProgress?.({
        status: "error",
        message: "Erreur lors de l'analyse",
      });
      throw error;
    }
  }

  /**
   * Effectue la reconnaissance avec ML Kit
   */
  private async performRecognition(
    imageUri: string,
    onProgress?: (progress: OCRProgress) => void,
  ): Promise<MLKitResult> {
    try {
      // Mise à jour de la progression
      onProgress?.({
        status: "recognizing",
        message: "Analyse en cours...",
        progress: 0.4,
      });

      // Appel direct à recognizeText avec l'URI de l'image
      const result = await recognizeText(imageUri);

      // Mise à jour de la progression finale
      onProgress?.({
        status: "recognizing",
        message: "Analyse terminée",
        progress: 0.9,
      });

      // Validation du résultat
      if (!result || typeof result.text !== "string") {
        throw new Error("Résultat ML Kit invalide");
      }

      return result as MLKitResult;
    } catch (error) {
      console.error("Erreur lors de la reconnaissance ML Kit:", error);
      throw error;
    }
  }

  /**
   * Optimise l'image si nécessaire (nouvelle API Expo SDK 53+)
   */
  private async optimizeImage(uri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: this.options.maxImageSize,
            },
          },
        ],
        {
          compress: this.options.compressionQuality,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      return result.uri;
    } catch (e) {
      console.warn(e);
      return uri;
    }
  }

  /**
   * Calcule la confiance du résultat
   */
  private calculateConfidence(result: MLKitResult): number {
    if (!result.blocks || result.blocks.length === 0) {
      return 0;
    }

    // Calculer la confiance basée sur le nombre de blocs détectés
    const blockCount = result.blocks.length;
    let totalLines = 0;
    let totalElements = 0;

    for (const block of result.blocks) {
      if (block.lines) {
        totalLines += block.lines.length;
        for (const line of block.lines) {
          if (line.elements) {
            totalElements += line.elements.length;
          }
        }
      }
    }

    // Plus il y a d'éléments détectés, plus la confiance est élevée
    let confidence = Math.min(totalElements / 50, 0.6);

    // Bonus pour la présence de plusieurs lignes
    if (totalLines > 1) {
      confidence += 0.1;
    }

    // Bonus pour la présence de plusieurs blocs
    if (blockCount > 1) {
      confidence += 0.05;
    }

    // Bonus si le texte a une longueur significative
    if (result.text && result.text.length > 20) {
      confidence += 0.1;
    }

    // Bonus pour la présence de chiffres (indicateur de montant)
    if (result.text && /\d/.test(result.text)) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1);
  }

  /**
   * Vérifie si ML Kit est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Nettoie les ressources (rien à libérer pour ML Kit)
   */
  cleanup(): void {
    // ML Kit n'a pas de ressources à libérer
    console.log("🧹 ML Kit OCR nettoyé");
  }
}

// Export d'une instance unique (pas de singleton)
export const mlKitProvider = new MLKitProvider();
