// src/services/ocr/ocr.service.ts

import { OCRProvider, OCRProgress } from './providers/ocr-provider.interface';
import { mlKitProvider } from './providers/mlkit.provider';
import { OCRTextNormalizer } from './providers/ocr-text-normalizer';

export interface ExtractedReceiptData {
  title?: string;
  amount?: number;
  date?: string;
  category?: string;
  merchant?: string;
  confidence: number;
  rawText?: string;
}

export class OCRService {
  private static instance: OCRService;
  private provider: OCRProvider;
  private isInitialized = false;

  private constructor(provider?: OCRProvider) {
    this.provider = provider || mlKitProvider;
  }

  static getInstance(provider?: OCRProvider): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService(provider);
    }
    return OCRService.instance;
  }

  /**
   * Initialise le service OCR
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.provider.initialize();
      this.isInitialized = true;
      console.log('✅ OCR Service initialisé avec ML Kit');
    } catch (error) {
      console.error('❌ Erreur d\'initialisation OCR:', error);
      throw error;
    }
  }

  /**
   * Extrait les données d'un reçu à partir d'une image
   */
  async extractReceiptData(
    imageUri: string,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<ExtractedReceiptData> {
    try {
      // 1. Initialiser si nécessaire
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 2. Reconnaître le texte avec ML Kit
      onProgress?.({ 
        status: 'loading', 
        message: 'Reconnaissance du texte...' 
      });

      const result = await this.provider.recognize(imageUri, onProgress);

      // 3. Si le texte est vide, retourner une confiance nulle
      if (!result.text || result.text.trim().length === 0) {
        return {
          confidence: 0,
          rawText: '',
        };
      }

      // 4. Normaliser le texte OCR
      const { text: normalizedText, corrections } = OCRTextNormalizer.normalize(result.text);
      
      if (corrections > 0) {
        console.log(`🔧 ${corrections} corrections OCR appliquées`);
      }

      // 5. Extraire les données structurées
      const extractedData = this.parseReceiptText(normalizedText);

      // 6. Calculer la confiance finale (pondérée)
      // ML Kit confiance + Parser confiance
      const mlKitWeight = 0.7;
      const parserWeight = 0.3;
      
      const finalConfidence = Math.min(
        (result.confidence * mlKitWeight) + (extractedData.confidence * parserWeight),
        1
      );

      // 7. Améliorer la confiance si des corrections ont été appliquées
      const confidenceBonus = Math.min(corrections * 0.02, 0.1);
      const finalConfidenceWithBonus = Math.min(finalConfidence + confidenceBonus, 1);

      return {
        ...extractedData,
        confidence: finalConfidenceWithBonus,
        rawText: normalizedText,
      };
    } catch (error) {
      console.error('❌ Erreur d\'extraction OCR:', error);
      onProgress?.({ 
        status: 'error', 
        message: 'Erreur lors de l\'analyse' 
      });
      return {
        confidence: 0,
      };
    }
  }

  /**
   * Parse le texte extrait pour trouver les informations du reçu
   */
  parseReceiptText(text: string): Omit<ExtractedReceiptData, 'rawText'> {
    // Nettoyer le texte pour l'analyse
    const cleanText = OCRTextNormalizer.cleanForParsing(text);
    const lines = OCRTextNormalizer.getSignificantLines(text);
    
    let title = '';
    let amount = 0;
    let date = '';
    let merchant = '';
    let confidence = 0;
    let extractedCount = 0;
    let category = '';

    // 1. Extraire le montant
    const amountPatterns = [
      /(\d+[\s,.]?\d*)\s*(?:FCFA|CFA|XOF|francs?)\b/i,
      /(\d+[\s,.]?\d*)\s*XOF\b/i,
      /(\d+[\s,.]?\d*)\s*[€$]\b/i,
      /(?:total|montant|prix|somme)\s*[:.]?\s*(\d+[\s,.]?\d*)/i,
      /^\s*(\d+[\s,.]?\d*)\s*$/,
    ];

    for (const pattern of amountPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const rawAmount = match[1].replace(/\s/g, '').replace(',', '.');
        amount = parseFloat(rawAmount);
        if (amount > 0) {
          extractedCount++;
          confidence += 0.25;
          break;
        }
      }
    }

    // 2. Extraire la date
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
      /(\d{1,2})\s*(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc|january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{2,4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let day = match[1].padStart(2, '0');
        let month = match[2];
        let year = match[3];
        
        if (isNaN(parseInt(month))) {
          const months: Record<string, string> = {
            'janv': '01', 'févr': '02', 'mars': '03', 'avr': '04',
            'mai': '05', 'juin': '06', 'juil': '07', 'août': '08',
            'sept': '09', 'oct': '10', 'nov': '11', 'déc': '12',
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12',
          };
          month = months[month.toLowerCase()] || '01';
        } else {
          month = month.padStart(2, '0');
        }
        
        if (year.length === 2) {
          year = `20${year}`;
        }
        
        date = `${year}-${month}-${day}`;
        extractedCount++;
        confidence += 0.2;
        break;
      }
    }

    // 3. Extraire le marchand
    const merchantPatterns = [
      /(?:commerce|magasin|boutique|restaurant|bar|hôtel|super[\s-]?marché)\s*[:.]?\s*([^\n]+)/i,
      /facture\s*(?:n°|no)\s*[:.]?\s*([^\n]+)/i,
    ];

    for (const pattern of merchantPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        merchant = match[1].trim();
        extractedCount++;
        confidence += 0.2;
        break;
      }
    }

    if (!merchant && lines.length > 0) {
      const candidateLines = lines.slice(0, 3);
      merchant = candidateLines.find(line => 
        line.length > 3 && 
        line.length < 60 &&
        !/^\d+/.test(line) &&
        !/[\/\-]/.test(line)
      ) || lines[0] || '';
      
      if (merchant) {
        merchant = merchant.replace(/(?:facture|reçu|ticket)/i, '').trim();
        confidence += 0.1;
      }
    }

    // 4. Déterminer le titre
    title = merchant || (lines.length > 0 ? lines[0] : 'Reçu scanné');

    // 5. Déterminer la catégorie
    const categoryKeywords: Record<string, string[]> = {
      'Alimentation': ['super', 'marché', 'alimentation', 'épicerie', 'nourriture', 'restaurant', 'fast food', 'pizza', 'burger', 'pain', 'lait', 'fromage'],
      'Transport': ['essence', 'station', 'service', 'parking', 'taxi', 'bus', 'train', 'péage', 'carburant'],
      'Shopping': ['magasin', 'boutique', 'habillement', 'vêtement', 'chaussure', 'accessoire', 'électronique'],
      'Santé': ['pharmacie', 'médicament', 'clinique', 'hôpital', 'docteur', 'dentiste', 'ordonnance'],
      'Divertissement': ['cinéma', 'théâtre', 'concert', 'bar', 'restaurant', 'boîte de nuit', 'jeux'],
      'Factures': ['électricité', 'eau', 'internet', 'téléphone', 'gaz', 'assurance', 'abonnement'],
      'Éducation': ['école', 'université', 'formation', 'cours', 'livre', 'scolaire'],
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword)) {
          category = cat;
          confidence += 0.1;
          break;
        }
      }
      if (category) break;
    }

    // Limiter la confiance à 1
    confidence = Math.min(confidence, 1);

    return {
      title,
      amount,
      date,
      merchant,
      category,
      confidence,
    };
  }

  /**
   * Vérifie si l'OCR est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return await this.provider.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    this.provider.cleanup();
    this.isInitialized = false;
  }
}

// Export singleton
export const ocrService = OCRService.getInstance();