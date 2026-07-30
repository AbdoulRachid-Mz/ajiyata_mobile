Markdown
# Chapitre 8 — Système d'Internationalisation (i18n) & Multi-Langues

## 8.1 Objectif et Vision

L'un des leviers majeurs d'adoption d'**Ajiya Ta** sur le marché ouest-africain et international réside dans son accessibilité linguistique. 

Afin de répondre aux besoins du secteur informel, des commerçants locaux, des familles et des professionnels, l'application intègre un système d'internationalisation réactif, performant et tolérant aux pannes (*fallback system*).

### Langues prises en charge :
1. **Français (`fr`)** — Langue de référence (Par défaut / Fallback).
2. **Anglais (`en`)** — Ouverture internationale et freelances.
3. **Haoussa (`ha`)** — Langue véhiculaire majeure (Niger, Nigéria, Ghana, Cameroun).
4. **Zarma (`zrm`)** — Langue régionale majeure au Niger.
5. **Arabe (`ar`)** — Support des caractères et direction d'écriture Droite-à-Gauche (RTL).

---

## 8.2 Philosophie d'intégration progressive

Puisque la structure de l'application est déjà avancée, le déploiement du module i18n repose sur le principe de **non-régression** :

* **Rétrocompatibilité :** Si une clé de traduction n'est pas trouvée dans une langue (ex: Zarma ou Haoussa), l'application affiche automatiquement le texte en **Français**.
* **Découplage :** La logique métier ne dépend jamais directement des chaînes de caractères brutes.
* **Persistance locale :** La langue choisie est conservée dans le stockage local via le Zustand Store et réappliquée à chaque démarrage.

---

## 8.3 Arborescence et Fichiers de Traduction

Toutes les traductions sont centralisées dans le dossier `locales/` à la racine du projet.

```text
locales/
├── index.ts
├── fr/
│   └── translation.json
├── en/
│   └── translation.json
├── ha/
│   └── translation.json
├── zrm/
│   └── translation.json
└── ar/
    └── translation.json
8.4 Structure des Dictionnaires (JSON)
Chaque fichier translation.json est structuré par espaces de noms (namespaces) correspondant aux modules de l'application.

Exemple : locales/fr/translation.json
JSON
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "back": "Retour",
    "loading": "Chargement..."
  },
  "finance": {
    "income": "Revenu",
    "expense": "Dépense",
    "balance": "Solde total",
    "savings": "Épargne",
    "tontine": "Tontine",
    "debt": "Dette",
    "receivable": "Créance"
  },
  "dashboard": {
    "welcome": "Bonjour, {{name}}",
    "recent_transactions": "Transactions récentes"
  }
}
Exemple : locales/ha/translation.json (Haoussa)
JSON
{
  "common": {
    "save": "Adana",
    "cancel": "Soke",
    "delete": "Goge",
    "edit": "Gyara",
    "back": "Koma baya",
    "loading": "Aiki yana tafiya..."
  },
  "finance": {
    "income": "Kuɗin shiga",
    "expense": "Fitaccen kuɗi",
    "balance": "Jimillar kuɗi",
    "savings": "Ajiya",
    "tontine": "Adashi",
    "debt": "Bashi (na bashi)",
    "receivable": "Bashi (ana bina)"
  },
  "dashboard": {
    "welcome": "Sannu, {{name}}",
    "recent_transactions": "Ayyukan baya-bayan nan"
  }
}
8.5 Configuration Technique (config/i18n.ts)
La configuration s'appuie sur i18next, react-i18next et expo-localization pour détecter automatiquement la langue du téléphone au premier démarrage.

TypeScript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import fr from '../locales/fr/translation.json';
import en from '../locales/en/translation.json';
import ha from '../locales/ha/translation.json';
import zrm from '../locales/zrm/translation.json';
import ar from '../locales/ar/translation.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  ha: { translation: ha },
  zrm: { translation: zrm },
  ar: { translation: ar },
};

const getDeviceLanguage = (): string => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const languageCode = locales[0].languageCode;
    if (languageCode && ['fr', 'en', 'ha', 'zrm', 'ar'].includes(languageCode)) {
      return languageCode;
    }
  }
  return 'fr';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
8.6 Gestion d'État et Persistance (stores/settings.store.ts)
Un store Zustand dédié gère le changement de langue dynamique et synchronise la préférence dans le stockage local du téléphone.

TypeScript
import { create } from 'zustand';
import i18n from '@/config/i18n';

interface SettingsState {
  language: string;
  setLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: i18n.language || 'fr',
  setLanguage: (lang: string) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
8.7 Hook Personnalisé & Support RTL (hooks/useLanguage.ts)
Ce hook met à disposition de l'UI une interface simple pour basculer de langue et ajuster automatiquement l'affichage pour les langues s'écrivant de droite à gauche comme l'Arabe (RTL).

TypeScript
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { I18nManager } from 'react-native';

export const useLanguage = () => {
  const { t, i18n } = useTranslation();
  const { setLanguage: setStoreLanguage } = useSettingsStore();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setStoreLanguage(lang);

    // Support des langues RTL (ex: Arabe)
    const isRTL = lang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }
  };

  return {
    t,
    currentLanguage: i18n.language,
    changeLanguage,
    isRTL: i18n.language === 'ar',
  };
};
8.8 Guide de Migration Progressive dans l'UI
Pour adapter l'interface utilisateur existante sans bloquer le développement, suivre ce processus étape par étape :

1. Démarrage global
Importer la configuration i18n dans l'entrée principale de l'application (app/_layout.tsx) :

TypeScript
import '@/config/i18n';
2. Remplacement dans les composants
Dans n'importe quel écran ou composant, remplacer les chaînes statiques par l'appel à la fonction t() :

Avant :

TypeScript
<ThemedText variant="xl" weight="bold">
  Transactions récentes
</ThemedText>
Après :

TypeScript
import { useTranslation } from 'react-i18next';

export function RecentTransactions() {
  const { t } = useTranslation();

  return (
    <ThemedText variant="xl" weight="bold">
      {t('dashboard.recent_transactions')}
    </ThemedText>
  );
}
3. Ordre de priorité des Écrans à Migrer :
Écran des Paramètres (Settings) : Ajouter le sélecteur de langue.

Dashboard & Navigation de base : En-têtes, soldes et menus.

Formulaires de Saisie : Création de transactions, catégories, budgets.

Modules Spécifiques : Tontines, Dettes & Créances.

Rapports & Modales : Messages de confirmation, exports.

8.9 Conclusion
Grâce à cette architecture, le système i18n d'Ajiya Ta s'intègre de manière transparente. Il garantit une expérience utilisateur fluide et adaptée aux réalités sociolinguistiques de l'Afrique de l'Ouest, tout en maintenant la stabilité globale de l'application.