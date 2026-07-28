// src/services/ocr/providers/ocr-provider.interface.ts

export interface OCRResult {
  text: string;
  confidence: number;
  languages?: string[];
}

export interface OCRProgress {
  status: 'loading' | 'recognizing' | 'done' | 'error';
  progress?: number;
  message?: string;
}

export interface OCRProvider {
  /**
   * Initialise le provider OCR
   */
  initialize(): Promise<void>;
  
  /**
   * Reconnaît le texte dans une image
   * @param imageUri - URI de l'image à analyser
   * @param onProgress - Callback de progression (optionnel)
   * @returns Résultat de la reconnaissance
   */
  recognize(
    imageUri: string,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult>;
  
  /**
   * Vérifie si le provider est disponible
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Nettoie les ressources
   */
  cleanup(): void;
}