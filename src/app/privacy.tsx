import React, { useRef } from 'react';
import {
  View,
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
            Dernière mise à jour : 1er janvier 2025
          </ThemedText>
        </Card>

        {/* Introduction */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Introduction
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Ajiya Ta ("nous", "notre", "nos") s'engage à protéger votre vie privée. 
            Cette politique de confidentialité explique comment nous collectons, utilisons, 
            divulguons et protégeons vos informations lorsque vous utilisez notre application 
            mobile et nos services.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText style={{ lineHeight: 22 }}>
            En utilisant Ajiya Ta, vous acceptez les pratiques décrites dans cette politique. 
            Si vous n'êtes pas d'accord avec cette politique, veuillez ne pas utiliser notre application.
          </ThemedText>
        </Card>

        {/* Informations collectées */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Informations que nous collectons
          </ThemedText>

          <ThemedText variant="base" weight="semibold" style={{ marginBottom: 4 }}>
            Informations que vous nous fournissez
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.md }}>
            • Nom et prénom
            {'\n'}• Adresse email
            {'\n'}• Numéro de téléphone
            {'\n'}• Informations de compte et préférences
          </ThemedText>

          <ThemedText variant="base" weight="semibold" style={{ marginBottom: 4 }}>
            Informations financières
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.md }}>
            • Transactions (revenus, dépenses, virements)
            {'\n'}• Catégories de dépenses
            {'\n'}• Budgets et objectifs d'épargne
            {'\n'}• Devises utilisées
          </ThemedText>

          <ThemedText variant="base" weight="semibold" style={{ marginBottom: 4 }}>
            Informations techniques
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            • Type d'appareil et modèle
            {'\n'}• Système d'exploitation
            {'\n'}• Version de l'application
            {'\n'}• Identifiant unique de l'appareil
            {'\n'}• Adresse IP
          </ThemedText>
        </Card>

        {/* Utilisation des informations */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Utilisation de vos informations
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Nous utilisons vos informations pour :
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText style={{ lineHeight: 22 }}>
            • Fournir et maintenir nos services
            {'\n'}• Gérer vos transactions et budgets
            {'\n'}• Vous envoyer des notifications et rappels
            {'\n'}• Améliorer notre application et nos services
            {'\n'}• Analyser l'utilisation de l'application
            {'\n'}• Assurer la sécurité de vos données
          </ThemedText>
        </Card>

        {/* Stockage des données */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Stockage et sécurité des données
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Vos données sont stockées localement sur votre appareil et, si vous le souhaitez, 
            synchronisées de manière sécurisée avec nos serveurs cloud.
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Nous utilisons des mesures de sécurité conformes aux normes de l'industrie pour 
            protéger vos données contre tout accès non autorisé, modification ou destruction.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText variant="sm" color="mutedForeground">
            ⚠️ Note : Ajiya Ta utilise le chiffrement pour protéger vos données en transit et au repos.
          </ThemedText>
        </Card>

        {/* Partage des données */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Partage des données
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. 
            Nous pouvons partager vos informations dans les cas suivants :
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            • Avec votre consentement explicite
            {'\n'}• Pour respecter une obligation légale
            {'\n'}• Avec nos prestataires de services (hébergement, notifications, etc.)
            {'\n'}• En cas de fusion ou d'acquisition
          </ThemedText>
        </Card>

        {/* Vos droits */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Vos droits
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Conformément au RGPD, vous disposez des droits suivants :
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            • Droit d'accès à vos données
            {'\n'}• Droit de rectification
            {'\n'}• Droit à l'effacement
            {'\n'}• Droit à la limitation du traitement
            {'\n'}• Droit à la portabilité des données
            {'\n'}• Droit d'opposition
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <TouchableOpacity onPress={handleEmailPress}>
            <ThemedText color="primary" weight="semibold">
              Contactez-nous pour exercer vos droits
            </ThemedText>
          </TouchableOpacity>
        </Card>

        {/* Cookies */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Cookies et technologies similaires
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Ajiya Ta n'utilise pas de cookies tiers. Nous utilisons des technologies de stockage 
            local pour améliorer votre expérience et mémoriser vos préférences.
          </ThemedText>
        </Card>

        {/* Modifications */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Modifications de la politique
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Nous pouvons modifier cette politique de temps à autre. Nous vous informerons de 
            tout changement majeur par une notification dans l'application ou par email.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText variant="sm" color="mutedForeground">
            La date de la dernière mise à jour est indiquée en haut de cette page.
          </ThemedText>
        </Card>

        {/* Contact */}
        <Card style={{ padding: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Contact
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Pour toute question concernant cette politique de confidentialité, veuillez nous contacter :
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