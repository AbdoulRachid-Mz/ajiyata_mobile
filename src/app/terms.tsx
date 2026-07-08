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

export default function TermsScreen() {
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
            Conditions d'utilisation
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
            Bienvenue sur Ajiya Ta. En utilisant notre application, vous acceptez de vous 
            conformer aux présentes conditions d'utilisation. Veuillez les lire attentivement 
            avant d'utiliser nos services.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText style={{ lineHeight: 22 }}>
            Ces conditions s'appliquent à tous les utilisateurs de l'application Ajiya Ta, 
            qu'ils utilisent l'application en mode hors ligne ou en ligne.
          </ThemedText>
        </Card>

        {/* Acceptation des conditions */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Acceptation des conditions
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            En créant un compte et en utilisant Ajiya Ta, vous acceptez les présentes conditions. 
            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
          </ThemedText>
        </Card>

        {/* Utilisation de l'application */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Utilisation de l'application
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Vous acceptez d'utiliser Ajiya Ta conformément aux règles suivantes :
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            • Fournir des informations exactes et à jour
            {'\n'}• Utiliser l'application uniquement à des fins personnelles et légitimes
            {'\n'}• Respecter les lois et règlements en vigueur
            {'\n'}• Ne pas tenter d'accéder à des comptes non autorisés
            {'\n'}• Ne pas interférer avec le fonctionnement de l'application
            {'\n'}• Ne pas utiliser l'application pour des activités illégales
          </ThemedText>
        </Card>

        {/* Comptes utilisateur */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Comptes utilisateur
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Vous êtes responsable de :
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            • La sécurité de vos identifiants de connexion
            {'\n'}• Toutes les activités effectuées sous votre compte
            {'\n'}• La mise à jour de vos informations personnelles
            {'\n'}• La sauvegarde de vos données financières
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText variant="sm" color="mutedForeground">
            ⚠️ Note : L'application fonctionne en mode "offline-first". Vos données sont 
            stockées localement sur votre appareil.
          </ThemedText>
        </Card>

        {/* Données financières */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Données financières
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Ajiya Ta vous permet de gérer vos finances personnelles. Vous reconnaissez que :
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            • Vous êtes responsable de l'exactitude de vos données
            {'\n'}• L'application fournit des calculs à titre indicatif
            {'\n'}• Nous ne fournissons pas de conseils financiers professionnels
            {'\n'}• Vous devez consulter un professionnel pour des décisions financières importantes
          </ThemedText>
        </Card>

        {/* Synchronisation et backup */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Synchronisation et sauvegarde
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Ajiya Ta offre des fonctionnalités de synchronisation et de sauvegarde. 
            Vous êtes responsable de la sauvegarde régulière de vos données. 
            Bien que nous fassions notre possible pour protéger vos données, 
            nous ne pouvons garantir une disponibilité ininterrompue.
          </ThemedText>
        </Card>

        {/* Propriété intellectuelle */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Propriété intellectuelle
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            L'application Ajiya Ta, son code source, sa conception, ses fonctionnalités, 
            et son contenu sont protégés par les lois sur la propriété intellectuelle. 
            Vous n'êtes pas autorisé à :
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText style={{ lineHeight: 22 }}>
            • Copier ou modifier l'application
            {'\n'}• Décompiler ou désassembler le code
            {'\n'}• Utiliser l'application à des fins commerciales sans autorisation
            {'\n'}• Supprimer les mentions de copyright
          </ThemedText>
        </Card>

        {/* Limitation de responsabilité */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Limitation de responsabilité
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Ajiya Ta est fournie "telle quelle", sans garantie d'aucune sorte. 
            Nous ne sommes pas responsables des dommages directs ou indirects 
            résultant de l'utilisation de l'application, y compris :
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText style={{ lineHeight: 22 }}>
            • Perte de données
            {'\n'}• Perte financière
            {'\n'}• Interruption de service
            {'\n'}• Erreurs de calcul
          </ThemedText>
        </Card>

        {/* Résiliation */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Résiliation
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Vous pouvez cesser d'utiliser l'application à tout moment. 
            Nous nous réservons le droit de suspendre ou de résilier votre compte 
            en cas de violation de ces conditions.
          </ThemedText>
        </Card>

        {/* Modifications */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Modifications des conditions
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Nous pouvons modifier ces conditions à tout moment. Les modifications 
            entrent en vigueur dès leur publication dans l'application. 
            Votre utilisation continue de l'application constitue votre acceptation 
            des conditions modifiées.
          </ThemedText>
        </Card>

        {/* Loi applicable */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Loi applicable
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Les présentes conditions sont régies par les lois du Niger. 
            Tout litige sera soumis aux tribunaux compétents de Niamey.
          </ThemedText>
        </Card>

        {/* Contact */}
        <Card style={{ padding: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Contact
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Pour toute question concernant ces conditions d'utilisation, 
            veuillez nous contacter :
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