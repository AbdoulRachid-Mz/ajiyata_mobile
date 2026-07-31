// src/services/ocr/ocr.service.ts

import { OCRProvider, OCRProgress } from './providers/ocr-provider.interface';
import { mlKitProvider } from './providers/mlkit.provider';
import { OCRTextNormalizer } from './providers/ocr-text-normalizer';

export interface ExtractedReceiptData {
  title?: string;
  amount?: number;
  suggestedAmounts?: number[]; // <-- NOUVEAU: Pour suggérer d'autres montants dans l'UI
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

  async extractReceiptData(
    imageUri: string,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<ExtractedReceiptData> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      onProgress?.({ 
        status: 'loading', 
        message: 'Reconnaissance du texte...' 
      });

      const result = await this.provider.recognize(imageUri, onProgress);

      if (!result.text || result.text.trim().length === 0) {
        return {
          confidence: 0,
          rawText: '',
          suggestedAmounts: [],
        };
      }

      const { text: normalizedText, corrections } = OCRTextNormalizer.normalize(result.text);
      
      if (corrections > 0) {
        console.log(`🔧 ${corrections} corrections OCR appliquées`);
      }

      const extractedData = this.parseReceiptText(normalizedText);

      const mlKitWeight = 0.7;
      const parserWeight = 0.3;
      
      const finalConfidence = Math.min(
        (result.confidence * mlKitWeight) + (extractedData.confidence * parserWeight),
        1
      );

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
        suggestedAmounts: [],
      };
    }
  }

  /**
   * Parse le texte extrait avec une stratégie basée sur les mots-clés et les candidats
   */
  parseReceiptText(text: string): Omit<ExtractedReceiptData, 'rawText'> {
    const cleanText = OCRTextNormalizer.cleanForParsing(text);
    const lines = OCRTextNormalizer.getSignificantLines(text);
    
    let title = '';
    let amount = 0;
    let suggestedAmounts: number[] = [];
    let date = '';
    let merchant = '';
    let confidence = 0;
    let category = '';

    // Mots-clés pour repérer le VRAI total
    const totalKeywords = ['total', 'net a payer', 'net a payer', 'montant total', 'solde due', 'ttc', 'nap'];
    // Mots-clés de montants à ignorer
    const ignoreKeywords = ['tva', 'ht', 'sous-total', 'subtotal', 'rendu', 'espece', 'cash', 'monnaie', 'change'];

    // Regex globale pour capturer tous les nombres ayant la forme d'un prix (ex: 15.00, 1500, 15,50)
    const priceRegex = /\b\d{1,3}(?:[\s.,]\d{3})*(?:[.,]\d{2})?\b/g;

    let bestTotalMatch = 0;
    const allFoundAmounts: number[] = [];

    // Analyse ligne par ligne
    lines.forEach((line) => {
      const lowerLine = line.toLowerCase();
      
      // Si la ligne contient un mot-clé de monnaie rendue ou de sous-total, on saute
      if (ignoreKeywords.some(kw => lowerLine.includes(kw))) {
        return;
      }

      // Recherche de prix dans la ligne
      const matches = line.match(priceRegex);
      if (matches) {
        matches.forEach(matchStr => {
          // Normalisation du nombre
          const cleaned = matchStr.replace(/\s/g, '').replace(',', '.');
          const parsed = parseFloat(cleaned);

          if (!isNaN(parsed) && parsed > 0) {
            allFoundAmounts.push(parsed);

            // Si la ligne contient un mot-clé "TOTAL", ce montant devient le candidat N°1
            if (totalKeywords.some(kw => lowerLine.includes(kw))) {
              bestTotalMatch = parsed;
            }
          }
        });
      }
    });

    // Éliminer les doublons et trier du plus grand au plus petit
    suggestedAmounts = Array.from(new Set(allFoundAmounts)).sort((a, b) => b - a);

    // Attribution du montant final
    if (bestTotalMatch > 0) {
      amount = bestTotalMatch;
      confidence += 0.35; // Forte confiance si trouvé via mot-clé TOTAL
    } else if (suggestedAmounts.length > 0) {
      // Si aucun mot-clé trouvé, on sélectionne le plus grand montant détecté
      amount = suggestedAmounts[0];
      confidence += 0.15;
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
      'Alimentation': ['super', 'marché', 'alimentation', 'épicerie', 'nourriture', 'restaurant', 'fast food', 'pizza', 'burger', 'pain', 'lait', 'fromage', 'auchan', 'carrefour', 'lidl'],
      'Transport': ['essence', 'station', 'service', 'parking', 'taxi', 'bus', 'train', 'péage', 'carburant', 'total', 'shell', 'uber'],
      'Shopping': ['magasin', 'boutique', 'habillement', 'vêtement', 'chaussure', 'accessoire', 'électronique', 'zara', 'fnac'],
      'Santé': ['pharmacie', 'médicament', 'clinique', 'hôpital', 'docteur', 'dentiste', 'ordonnance'],
      'Divertissement': ['cinéma', 'théâtre', 'concert', 'bar', 'boîte de nuit', 'jeux'],
      'Factures': ['électricité', 'eau', 'internet', 'téléphone', 'gaz', 'assurance', 'abonnement'],
      'Éducation': ['école', 'université', 'formation', 'cours', 'livre', 'scolaire'],
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword)) {
          category = cat;
          confidence += 0.15;
          break;
        }
      }
      if (category) break;
    }

    return {
      title,
      amount,
      suggestedAmounts: suggestedAmounts.slice(0, 4), // Garde les 4 montants les plus pertinents
      date,
      merchant,
      category,
      confidence: Math.min(confidence, 1),
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return await this.provider.isAvailable();
    } catch {
      return false;
    }
  }

  cleanup(): void {
    this.provider.cleanup();
    this.isInitialized = false;
  }
}

export const ocrService = OCRService.getInstance();