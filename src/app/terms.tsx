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
            Dernière mise à jour : 1er mars 2026
          </ThemedText>
        </Card>

        {/* Objet */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            1. Objet et Acceptation
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation 
            de l'application mobile **Ajiya Ta**.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText style={{ lineHeight: 22 }}>
            L'utilisation de l'application implique l'acceptation sans réserve des présentes CGU par l'utilisateur.
          </ThemedText>
        </Card>

        {/* Description du Service */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            2. Nature du Service
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Ajiya Ta est un outil de gestion budgétaire et financière personnelle. 
            L'application permet d'enregistrer des flux financiers, de suivre des budgets et de gérer des comptes.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText variant="sm" color="mutedForeground">
            ⚠️ Ajiya Ta n'est pas un établissement de crédit ni un système de paiement électronique bancaire. L'application constitue un outil d'aide au suivi comptable personnel.
          </ThemedText>
        </Card>

        {/* Engagements de l'Utilisateur */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            3. Obligations de l'Utilisateur
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            L'utilisateur s'engage à :
            {'\n'}• Saisir des données exactes sous sa seule responsabilité.
            {'\n'}• Ne pas utiliser l'application à des fins frauduleuses ou illégales au regard des lois nigériennes et internationales.
            {'\n'}• Assurer la confidentialité de ses accès de déverrouillage (code, biométrie).
          </ThemedText>
        </Card>

        {/* Responsabilité */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            4. Limitation de Responsabilité
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Ajiya Ta fournit des calculs et statistiques à titre strictement indicatif. 
            Nous ne pourrons être tenus responsables en cas d'erreur de saisie par l'utilisateur, 
            de perte de données liée à la perte ou à la détérioration de l'appareil mobile, ou d'interruption temporaire du service.
          </ThemedText>
        </Card>

        {/* Loi Applicable et Juridiction */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            5. Droit Applicable et Règlement des Litiges
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Les présentes CGU sont régies et interprétées conformément au **Droit de la République du Niger**.
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText style={{ lineHeight: 22 }}>
            Tout litige relatif à l'interprétation ou à l'exécution des présentes qui ne pourrait être réglé à l'amiable sera soumis à la compétence exclusive des **Tribunaux compétents de Niamey**.
          </ThemedText>
        </Card>

        {/* Contact */}
        <Card style={{ padding: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            Contact
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            Pour toute question juridique ou réclamation :
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