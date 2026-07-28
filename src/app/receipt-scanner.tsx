import React, { useState, useEffect } from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  ActivityIndicator,
  Alert,
} from 'react-native';
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedText from '@/components/ui/text';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import TextInput from '@/components/ui/text-input';
import { useTheme } from '@/contexts/theme-context';
import { useAppStore } from '@/stores/app-store';
import { useCreateTransaction } from '@/features/transactions/hooks';
import { CategoryPicker } from '@/features/categories/components/category-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { generateUUID, getCurrentTimestamp } from '@/utils/uuid';
import { attachmentRepository } from '@/features/attachments/repositories';
import { ocrService } from '@/services/ocr/ocr.service';
import { useDevice } from '@/hooks/use-device';
import { OCRProgress } from '@/services/ocr/providers/ocr-provider.interface';

export default function ReceiptScanner() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const createTransaction = useCreateTransaction();
  const { deviceId } = useDevice();

  // State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    title?: string;
    amount?: number;
    date?: string;
    category?: string;
    merchant?: string;
    confidence: number;
  } | null>(null);

  // Initialiser l'OCR
  useEffect(() => {
    ocrService.initialize().catch(console.error);
  }, []);

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      };

      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ 
            type: 'error', 
            text1: 'Permission requise', 
            text2: 'Autorisez l\'accès à la caméra pour scanner.' 
          });
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ 
            type: 'error', 
            text1: 'Permission requise', 
            text2: 'Autorisez l\'accès à la galerie pour scanner.' 
          });
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        
        // Démarrer l'OCR automatiquement
        await processReceipt(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({ 
        type: 'error', 
        text1: 'Erreur', 
        text2: 'Impossible de sélectionner l\'image.' 
      });
    }
  };

  const processReceipt = async (uri: string) => {
    setIsProcessing(true);
    setOcrProgress({ status: 'loading', message: 'Préparation de l\'image...' });
    
    try {
      // Extraire les données du reçu avec Tesseract
      const result = await ocrService.extractReceiptData(uri, (progress) => {
        setOcrProgress(progress);
      });
      
      if (result.confidence > 0.2) {
        setExtractedData(result);
        
        // Auto-remplir le formulaire
        if (result.title) setTitle(result.title);
        if (result.amount && result.amount > 0) {
          setAmount(result.amount.toString());
        }
        if (result.date) setDate(result.date);
        
        // Proposer une catégorie si détectée
        if (result.category) {
          // La catégorie sera sélectionnée par l'utilisateur
          Toast.show({
            type: 'success',
            text1: '📄 Données extraites',
            text2: `Catégorie suggérée: ${result.category}`,
          });
        } else {
          Toast.show({
            type: 'success',
            text1: '📄 Données extraites',
            text2: 'Vérifiez et complétez les informations ci-dessous.',
          });
        }
      } else {
        Toast.show({
          type: 'info',
          text1: 'ℹ️ Aucune donnée extraite',
          text2: 'L\'image ne semble pas être un reçu. Veuillez remplir les informations manuellement.',
        });
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      Toast.show({
        type: 'info',
        text1: 'ℹ️ Erreur d\'analyse',
        text2: 'Veuillez remplir les informations manuellement.',
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
    }
  };

  const handleCreate = async () => {
    if (!currentAccount) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Compte non trouvé.' });
      return;
    }
    
    if (!title.trim() || !amount.trim()) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Le titre et le montant sont requis.' });
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Montant invalide.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDate = new Date(date);
      if (isNaN(selectedDate.getTime())) {
        throw new Error('Date invalide');
      }

      const txId = generateUUID();
      await createTransaction.mutateAsync({
        id: txId,
        accountId: currentAccount.id,
        title: title.trim(),
        amount: numAmount,
        type: type,
        categoryId: categoryId,
        note: note.trim() || null,
        date: selectedDate,
        currency: currentAccount.currency,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        deviceId,
        version: 1,
        syncStatus: 'pending',
        metadata: {},
        isSynced: false,
      });

      // Save the scanned receipt as an attachment
      if (imageUri) {
        await attachmentRepository.create({
          id: generateUUID(),
          accountId: currentAccount.id,
          transactionId: txId,
          type: 'image',
          localUri: imageUri,
          uploadUrl: null,
          uploadId: null,
          size: 0,
          isSynced: false,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
          deviceId,
          version: 1,
          syncStatus: 'pending',
          metadata: { fileName: 'receipt_scan.jpg' }
        });
      }

      Toast.show({ type: 'success', text1: 'Succès', text2: 'Transaction créée avec succès.' });
      router.back();
    } catch (error) {
      console.error('Error creating transaction:', error);
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de créer la transaction.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 1: Sélection de l'image
  if (!imageUri) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: theme.spacing.md }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <ThemedText variant="lg" weight="bold">Scanner un reçu</ThemedText>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.lg }}>
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
            <View style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              backgroundColor: theme.colors.primary + '20', 
              justifyContent: 'center', 
              alignItems: 'center', 
              marginBottom: theme.spacing.md 
            }}>
              <Ionicons name="scan" size={40} color={theme.colors.primary} />
            </View>
            <ThemedText variant="lg" weight="semibold" style={{ textAlign: 'center' }}>
              Numérisez vos reçus
            </ThemedText>
            <ThemedText style={{ 
              textAlign: 'center', 
              color: theme.colors.mutedForeground, 
              marginTop: theme.spacing.sm 
            }}>
              Prenez en photo ou sélectionnez un reçu. L'application extraira automatiquement 
              les informations pour créer la transaction.
            </ThemedText>
          </View>

          <Button 
            onPress={() => pickImage(true)} 
            style={{ 
              width: '100%', 
              paddingVertical: theme.spacing.lg, 
              borderRadius: theme.borderRadius.lg 
            }}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <ThemedText style={{ color: '#fff', marginLeft: theme.spacing.sm, fontWeight: 'bold' }}>
              Prendre une photo
            </ThemedText>
          </Button>

          <Button 
            variant="outline" 
            onPress={() => pickImage(false)}
            style={{ 
              width: '100%', 
              paddingVertical: theme.spacing.lg, 
              borderRadius: theme.borderRadius.lg, 
              borderWidth: 1.5 
            }}
          >
            <Ionicons name="images" size={24} color={theme.colors.foreground} />
            <ThemedText style={{ marginLeft: theme.spacing.sm, fontWeight: 'bold' }}>
              Choisir depuis la galerie
            </ThemedText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Phase 2: Formulaire de complétion
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          padding: theme.spacing.lg, 
          justifyContent: 'space-between' 
        }}>
          <TouchableOpacity onPress={() => setImageUri(null)}>
            <Ionicons name="close" size={28} color={theme.colors.foreground} />
          </TouchableOpacity>
          <ThemedText variant="lg" weight="bold">Compléter les infos</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={{ padding: theme.spacing.md }}>
          {/* Image du reçu */}
          <TouchableOpacity 
            onPress={() => setIsImageFullscreen(true)}
            activeOpacity={0.8}
            style={{ 
              height: 200, 
              width: '100%', 
              borderRadius: theme.borderRadius.lg, 
              overflow: 'hidden',
              marginBottom: theme.spacing.lg,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Image 
              source={{ uri: imageUri }} 
              style={{ width: '100%', height: '100%' }} 
              resizeMode="cover"
            />
            
            {/* Indicateur de traitement OCR */}
            {isProcessing && ocrProgress && (
              <View style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
              }}>
                <ActivityIndicator size="large" color="#fff" />
                <ThemedText style={{ color: '#fff', marginTop: 12, textAlign: 'center' }}>
                  {ocrProgress.message || 'Analyse du reçu...'}
                </ThemedText>
                {ocrProgress.progress !== undefined && (
                  <View style={{ 
                    width: '80%',
                    height: 4,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: 2,
                    marginTop: 12,
                    overflow: 'hidden',
                  }}>
                    <View style={{ 
                      width: `${ocrProgress.progress * 100}%`,
                      height: '100%',
                      backgroundColor: theme.colors.primary,
                      borderRadius: 2,
                    }} />
                  </View>
                )}
              </View>
            )}

            {/* Bouton agrandir */}
            <View style={{ 
              position: 'absolute', 
              bottom: 8, 
              right: 8, 
              backgroundColor: 'rgba(0,0,0,0.6)', 
              padding: 6, 
              borderRadius: 20, 
              flexDirection: 'row', 
              alignItems: 'center' 
            }}>
              <Ionicons name="expand" size={16} color="#fff" />
              <ThemedText style={{ color: '#fff', fontSize: 12, marginLeft: 4 }}>
                Agrandir
              </ThemedText>
            </View>
          </TouchableOpacity>

          {/* Données extraites */}
          {extractedData && extractedData.confidence > 0.2 && (
            <Card style={{ 
              padding: theme.spacing.md, 
              marginBottom: theme.spacing.lg,
              backgroundColor: extractedData.confidence > 0.7 
                ? theme.financialColors.income + '15'
                : theme.financialColors.budget + '15',
              borderColor: extractedData.confidence > 0.7 
                ? theme.financialColors.income
                : theme.financialColors.budget,
              borderWidth: 1,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons 
                  name={extractedData.confidence > 0.7 ? "checkmark-circle" : "information-circle"} 
                  size={20} 
                  color={extractedData.confidence > 0.7 
                    ? theme.financialColors.income
                    : theme.financialColors.budget
                  } 
                />
                <ThemedText variant="sm" weight="semibold" style={{ marginLeft: 8 }}>
                  {extractedData.confidence > 0.7 ? 'Données extraites avec succès' : 'Données partiellement extraites'}
                </ThemedText>
              </View>
              {extractedData.merchant && (
                <ThemedText variant="sm" color="mutedForeground">
                  🏪 {extractedData.merchant}
                </ThemedText>
              )}
              {extractedData.category && (
                <ThemedText variant="sm" color="mutedForeground">
                  📂 Catégorie suggérée: {extractedData.category}
                </ThemedText>
              )}
              <ThemedText variant="xs" color="mutedForeground">
                Confiance: {Math.round(extractedData.confidence * 100)}%
              </ThemedText>
            </Card>
          )}

          {/* Formulaire */}
          <Card style={{ padding: theme.spacing.lg }}>
            {/* Type de transaction */}
            <View style={{ 
              flexDirection: 'row', 
              backgroundColor: theme.colors.muted, 
              borderRadius: theme.borderRadius.md, 
              padding: 4, 
              marginBottom: theme.spacing.lg 
            }}>
              <TouchableOpacity
                style={{ 
                  flex: 1, 
                  paddingVertical: 8, 
                  alignItems: 'center', 
                  backgroundColor: type === 'expense' ? theme.colors.card : 'transparent', 
                  borderRadius: theme.borderRadius.sm, 
                  shadowColor: type === 'expense' ? '#000' : 'transparent', 
                  shadowOpacity: 0.1, 
                  shadowRadius: 2, 
                  elevation: type === 'expense' ? 2 : 0 
                }}
                onPress={() => setType('expense')}
              >
                <ThemedText 
                  weight={type === 'expense' ? 'bold' : 'normal'} 
                  style={{ color: type === 'expense' ? theme.financialColors.expense : theme.colors.foreground }}
                >
                  Dépense
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ 
                  flex: 1, 
                  paddingVertical: 8, 
                  alignItems: 'center', 
                  backgroundColor: type === 'income' ? theme.colors.card : 'transparent', 
                  borderRadius: theme.borderRadius.sm, 
                  shadowColor: type === 'income' ? '#000' : 'transparent', 
                  shadowOpacity: 0.1, 
                  shadowRadius: 2, 
                  elevation: type === 'income' ? 2 : 0 
                }}
                onPress={() => setType('income')}
              >
                <ThemedText 
                  weight={type === 'income' ? 'bold' : 'normal'} 
                  style={{ color: type === 'income' ? theme.financialColors.income : theme.colors.foreground }}
                >
                  Revenu
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Champs du formulaire */}
            <View style={{ gap: theme.spacing.md }}>
              <View>
                <ThemedText style={{ marginBottom: theme.spacing.xs, fontSize: 14 }}>
                  Titre *
                </ThemedText>
                <TextInput
                  placeholder="Ex: Supermarché, Essence..."
                  value={title}
                  onChangeText={setTitle}
                  style={{ backgroundColor: theme.colors.muted }}
                />
              </View>

              <View>
                <ThemedText style={{ marginBottom: theme.spacing.xs, fontSize: 14 }}>
                  Montant *
                </ThemedText>
                <TextInput
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  style={{ backgroundColor: theme.colors.muted, fontSize: 18, fontWeight: 'bold' }}
                />
              </View>

              <View>
                <ThemedText style={{ marginBottom: theme.spacing.xs, fontSize: 14 }}>
                  Date (YYYY-MM-DD)
                </ThemedText>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  style={{ backgroundColor: theme.colors.muted }}
                  placeholder={new Date().toISOString().split('T')[0]}
                />
              </View>

              <View>
                <ThemedText style={{ marginBottom: theme.spacing.xs, fontSize: 14 }}>
                  Catégorie
                </ThemedText>
                <View style={{ 
                  borderWidth: 1, 
                  borderColor: theme.colors.border, 
                  borderRadius: theme.borderRadius.md, 
                  overflow: 'hidden' 
                }}>
                  <CategoryPicker
                    accountId={currentAccount?.id || ''}
                    type={type}
                    selectedId={categoryId}
                    onSelect={(category) => setCategoryId(category.id)}
                  />
                </View>
              </View>

              <View>
                <ThemedText style={{ marginBottom: theme.spacing.xs, fontSize: 14 }}>
                  Note (optionnelle)
                </ThemedText>
                <TextInput
                  placeholder="Informations additionnelles..."
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={2}
                  style={{ backgroundColor: theme.colors.muted, height: 60 }}
                />
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Bouton de création */}
      <View style={{ 
        padding: theme.spacing.lg, 
        borderTopWidth: 1, 
        borderTopColor: theme.colors.border, 
        backgroundColor: theme.colors.card 
      }}>
        <Button 
          onPress={handleCreate} 
          disabled={isSubmitting || isProcessing} 
          style={{ paddingVertical: theme.spacing.md }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <ThemedText style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>
                Créer la transaction
              </ThemedText>
            </View>
          )}
        </Button>
      </View>

      {/* Modal plein écran */}
      <Modal visible={isImageFullscreen} transparent={false} animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity 
              onPress={() => setIsImageFullscreen(false)}
              style={{ 
                position: 'absolute', 
                top: 50, 
                right: 20, 
                zIndex: 10, 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: 20, 
                padding: 8 
              }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Image 
              source={{ uri: imageUri }} 
              style={{ flex: 1 }} 
              resizeMode="contain"
            />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}