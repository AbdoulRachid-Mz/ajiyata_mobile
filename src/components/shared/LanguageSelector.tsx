// src/components/shared/LanguageSelector.tsx

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import Card from '@/components/ui/card';
import Drawer from '@/components/ui/drawer';
import { useLanguage } from '@/hooks/use-language';
import { SupportedLanguage, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/configs/i18n';
import Toast from 'react-native-toast-message';

export const LanguageSelector = () => {
  const { theme } = useTheme();
  const { currentLanguage, changeLanguage, languageNames, languageFlags, reloadApp, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = async (lang: SupportedLanguage) => {
    if (lang === currentLanguage) {
      setIsOpen(false);
      return;
    }

    const isCurrentRTL = currentLanguage === 'ar';
    const isNewRTL = lang === 'ar';
    const needsRestart = isCurrentRTL !== isNewRTL;

    if (needsRestart) {
      Alert.alert(
        t('language.restart_title', '🔄 Redémarrage nécessaire'),
        t('language.restart_message', 'Le changement de cette langue nécessite un redémarrage de l\'application pour une expérience optimale.'),
        [
          { text: t('common.cancel', 'Annuler'), style: 'cancel' },
          {
            text: t('language.restart', 'Redémarrer'),
            style: 'default',
            onPress: () => {
              changeLanguage(lang);
              setIsOpen(false);
              Toast.show({ 
                type: 'success', 
                text1: t('language.changed', 'Langue changée'), 
                text2: `${t('language.new_language', 'Nouvelle langue')}: ${languageNames[lang]}` 
              });
              setTimeout(() => reloadApp(), 500);
            }
          }
        ]
      );
    } else {
      changeLanguage(lang);
      setIsOpen(false);
      Toast.show({ 
        type: 'success', 
        text1: t('language.changed', 'Langue changée'), 
        text2: `${t('language.new_language', 'Nouvelle langue')}: ${languageNames[lang]}` 
      });
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.muted,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="language-outline" size={24} color={theme.colors.foreground} />
          <View>
            <ThemedText weight="medium">{t('settings.language', 'Langue')}</ThemedText>
            <ThemedText variant="xs" color="mutedForeground">
              {LANGUAGE_FLAGS[currentLanguage]} {LANGUAGE_NAMES[currentLanguage]}
            </ThemedText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
      </TouchableOpacity>

      <Drawer visible={isOpen} onClose={() => setIsOpen(false)}>
        <View style={{ padding: theme.spacing.lg }}>
          <ThemedText variant="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
            {t('language.select_title', 'Choisir une langue')}
          </ThemedText>
          
          {Object.keys(LANGUAGE_NAMES).map((lang) => {
            const isSelected = lang === currentLanguage;
            return (
              <TouchableOpacity
                key={lang}
                onPress={() => handleLanguageSelect(lang as SupportedLanguage)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.primary + '10' : 'transparent',
                  borderRadius: theme.borderRadius.sm,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <ThemedText style={{ fontSize: 24 }}>
                    {LANGUAGE_FLAGS[lang as SupportedLanguage]}
                  </ThemedText>
                  <ThemedText weight={isSelected ? 'bold' : 'normal'}>
                    {LANGUAGE_NAMES[lang as SupportedLanguage]}
                  </ThemedText>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
          
          <ThemedText variant="xs" color="mutedForeground" style={{ marginTop: theme.spacing.md, textAlign: 'center' }}>
            {t('language.rtl_hint', '💡 Les langues RTL (arabe) nécessitent un redémarrage')}
          </ThemedText>
        </View>
      </Drawer>
    </>
  );
};