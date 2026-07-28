// src/services/ocr/ocr-text-normalizer.ts

export interface NormalizedTextResult {
  text: string;
  corrections: number;
}

export class OCRTextNormalizer {
  /**
   * Normalise le texte OCR en corrigeant les erreurs courantes
   */
  static normalize(text: string): NormalizedTextResult {
    let normalized = text;
    let corrections = 0;

    // 1. Nettoyer les caractères superflus
    normalized = normalized
      .replace(/\r/g, '')                    // Supprimer les retours chariot
      .replace(/[ ]+/g, ' ')                  // Réduire les espaces multiples
      .replace(/\n{2,}/g, '\n')               // Réduire les sauts de ligne multiples
      .trim();

    // 2. Corriger les erreurs de chiffres dans les montants
    // 2.1. Corriger les 0 confondus avec O
    const digitCorrections = [
      { pattern: /O/g, replacement: '0' },
      { pattern: /o/g, replacement: '0' },
      { pattern: /I/g, replacement: '1' },
      { pattern: /l/g, replacement: '1' },
      { pattern: /S/g, replacement: '5' },
      { pattern: /s/g, replacement: '5' },
      { pattern: /B/g, replacement: '8' },
      { pattern: /b/g, replacement: '8' },
    ];

    // Appliquer les corrections sur les nombres
    const numberRegex = /\d+[\s,.]?\d*/g;
    const matches = normalized.match(numberRegex);

    if (matches) {
      for (const match of matches) {
        let corrected = match;
        for (const correction of digitCorrections) {
          const newCorrected = corrected.replace(correction.pattern, correction.replacement);
          if (newCorrected !== corrected) {
            corrections++;
            corrected = newCorrected;
          }
        }
        if (corrected !== match) {
          normalized = normalized.replace(match, corrected);
        }
      }
    }

    // 3. Corriger les espaces dans les nombres
    // Exemple: "5 000" → "5000"
    normalized = normalized.replace(/(\d)\s+(\d{3})/g, '$1$2');

    // 4. Corriger les virgules dans les nombres
    // Exemple: "1,500" → "1500" (si c'est un séparateur de milliers)
    normalized = normalized.replace(/(\d),(\d{3})/g, '$1$2');

    // 5. Corriger les dates
    // Exemple: "15/06/2025" → "15/06/2025" (déjà correct)
    // Exemple: "15-06-2025" → "15/06/2025"
    normalized = normalized.replace(/(\d{1,2})-(\d{1,2})-(\d{2,4})/g, '$1/$2/$3');

    // 6. Corriger les erreurs de casse sur les montants
    const amountWords = ['fcfa', 'xof', 'cfa', 'francs', 'euro', 'usd'];
    for (const word of amountWords) {
      const regex = new RegExp(word, 'gi');
      normalized = normalized.replace(regex, word.toUpperCase());
    }

    return {
      text: normalized,
      corrections,
    };
  }

  /**
   * Nettoie le texte pour l'analyse
   */
  static cleanForParsing(text: string): string {
    return text
      .replace(/[^\w\s\d\/:,.\-€$%]/g, ' ') // Garder les caractères utiles
      .replace(/[ ]+/g, ' ')                 // Réduire les espaces
      .trim();
  }

  /**
   * Extrait les lignes significatives d'un texte
   */
  static getSignificantLines(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 200) // Ignorer les lignes trop longues
      .filter(line => !/^\s*[-=*_]+\s*$/.test(line));       // Ignorer les séparateurs
  }
}