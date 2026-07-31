// src/app/privacy.tsx

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
import { useTranslation } from 'react-i18next';

export default function PrivacyScreen() {
  const { t } = useTranslation();
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
            {t('privacy.title')}
          </ThemedText>
        </ThemedView>

        {/* Date de mise à jour */}
        <Card style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="sm" color="mutedForeground">
            {t('privacy.last_updated')} : 1er mars 2026
          </ThemedText>
        </Card>

        {/* Cadre Légal et Introduction */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            {t('privacy.legal_framework')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            {t('privacy.intro')}
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText style={{ lineHeight: 22 }}>
            {t('privacy.consent')}
          </ThemedText>
        </Card>

        {/* Informations collectées */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            {t('privacy.data_collected')}
          </ThemedText>

          <ThemedText variant="base" weight="semibold" style={{ marginBottom: 4 }}>
            {t('privacy.identification')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.md }}>
            {t('privacy.identification_list')}
          </ThemedText>

          <ThemedText variant="base" weight="semibold" style={{ marginBottom: 4 }}>
            {t('privacy.financial_data')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.md }}>
            {t('privacy.financial_list')}
          </ThemedText>

          <ThemedText variant="base" weight="semibold" style={{ marginBottom: 4 }}>
            {t('privacy.technical_data')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            {t('privacy.technical_list')}
          </ThemedText>
        </Card>

        {/* Principes de Traitement et Sécurité */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            {t('privacy.storage_security')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            {t('privacy.storage_desc')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            {t('privacy.encryption')}
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <ThemedText variant="sm" color="mutedForeground">
            🔒 {t('privacy.biometric_note')}
          </ThemedText>
        </Card>

        {/* Vos Droits selon la Loi du Niger */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            {t('privacy.your_rights')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            {t('privacy.rights_intro')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            {t('privacy.rights_list')}
          </ThemedText>
          <Spacer height={theme.spacing.sm} />
          <TouchableOpacity onPress={handleEmailPress}>
            <ThemedText color="primary" weight="semibold">
              {t('privacy.exercise_rights')}
            </ThemedText>
          </TouchableOpacity>
        </Card>

        {/* Autorité de Contrôle */}
        <Card style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            {t('privacy.regulatory_authority')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            {t('privacy.regulatory_desc')}
          </ThemedText>
        </Card>

        {/* Contact */}
        <Card style={{ padding: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            {t('common.contact')}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22, marginBottom: theme.spacing.sm }}>
            {t('privacy.contact_desc')}
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