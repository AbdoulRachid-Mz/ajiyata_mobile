import React, { useRef } from 'react';
import {
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/theme-context';
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedText from '@/components/ui/text';
import ThemedView from '@/components/ui/view';
import Card from '@/components/ui/card';
import Spacer from '@/components/ui/spacer';
import { useUIStore } from '@/stores/ui-store';

export default function PrivacyScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { setTabBarVisible } = useUIStore();
  const lastScrollY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY < 0) return;
    if (currentScrollY > lastScrollY.current + 10) {
      setTabBarVisible(false);
    } else if (currentScrollY < lastScrollY.current - 10) {
      setTabBarVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@ajiyata.com');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <ThemedText variant="xl" weight="bold" style={{ marginLeft: theme.spacing.md }}>
            Politique de confidentialité
          </ThemedText>
        </ThemedView>

        {/* Date de mise à jour */}
        <Card style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="sm" color="mutedForeground">
            Dernière mise à jour : 1er mars 2026
          </ThemedText>
        </Card>

        {/* Cadre Légal et Introduction */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Cadre Légal & Introduction
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Ajiya Ta ("nous", "notre", "nos") s'engage à protéger la vie privée de ses utilisateurs. 
            La présente politique est établie conformément à la **Loi n° 2017-28 du 3 mai 2017** 
            relative à la protection des données à caractère personnel en République du Niger ainsi 
            qu'à l'**Acte Additionnel A/SA.1/01/10 de la CEDEAO**.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText style={{ lineHeight: 22 }}>
            En utilisant Ajiya Ta, vous consentez à la collecte et au traitement de vos informations 
            selon les modalités définies ci-après.
          </ThemedText>
        </Card>

        {/* Informations collectées */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Données collectées
          </ThemedText>

          <ThemedText variant="base" weight="semibold" style={{ marginBottom: 4 }}>
            Informations d'identification
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.md }}>
            • Nom, prénom et pseudo
            {'\n'}• Adresse email et/ou numéro de téléphone
            {'\n'}• Préférences de compte et devises (XOF, USD, etc.)
          </ThemedText>

          <ThemedText variant="base" weight="semibold" style={{ marginBottom: 4 }}>
            Données financières et de gestion
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.md }}>
            • Relevé des transactions (revenus, dépenses, transferts)
            {'\n'}• Budgets, objectifs d'épargne et catégories
            {'\n'}• Photos/scans de reçus ou factures (si autorisés)
          </ThemedText>

          <ThemedText variant="base" weight="semibold" style={{ marginBottom: 4 }}>
            Informations techniques
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            • Modèle de l'appareil et version du système Android/iOS
            {'\n'}• Identifiants uniques d'installation de l'application
          </ThemedText>
        </Card>

        {/* Principes de Traitement et Sécurité */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Stockage et Sécurité des Données
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Conformément au principe d'architecture "Offline-First", l'ensemble de vos registres 
            financiers est stocké en priorité localement sur votre appareil.
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            En cas de synchronisation en ligne, vos données sont chiffrées selon les standards 
            de sécurité recommandés par les réglementations en matière de cybersécurité.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText variant="sm" color="mutedForeground">
            🔒 Vos identifiants biométriques (empreinte digitale, Face ID) sont traités exclusivement par le système sécurisé de votre téléphone et ne nous sont jamais transmis.
          </ThemedText>
        </Card>

        {/* Vos Droits selon la Loi du Niger */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Vos Droits
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Conformément à la réglementation nigérienne et communautaire, vous bénéficiez des droits suivants :
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            • **Droit d'accès :** Obtenir la confirmation que vos données sont traitées.
            {'\n'}• **Droit de rectification :** Exiger la correction d'informations inexactes.
            {'\n'}• **Droit de suppression :** Demander l'effacement définitif de vos données.
            {'\n'}• **Droit d'opposition :** S'opposer au traitement de vos données pour motifs légitimes.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <TouchableOpacity onPress={handleEmailPress}>
            <ThemedText color="primary" weight="semibold">
              Exercer mes droits : support@ajiyata.com
            </ThemedText>
          </TouchableOpacity>
        </Card>

        {/* Autorité de Contrôle */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Recours et Autorité de Régulation
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            En cas de litige relatif à la protection de vos données personnelles non résolu par notre support, 
            vous avez le droit de saisir la **Haute Autorité de Protection des Données à caractère Personnel (HAPDP)** de la République du Niger.
          </ThemedText>
        </Card>

        {/* Contact */}
        <Card style={{ padding: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Contact
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Pour toute question concernant cette politique :
          </ThemedText>
          <TouchableOpacity onPress={handleEmailPress}>
            <ThemedText color="primary" weight="semibold">
              📧 support@ajiyata.com
            </ThemedText>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}