import { ReactNode } from 'react';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  illustration: string; // Nom de l'illustration
  color: string;
  icon: string; // Nom de l'icône Lucide
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur Ajiya Ta',
    description: 'Gérez vos revenus et dépenses en toute simplicité, où que vous soyez.',
    illustration: 'welcome',
    color: '#16a34a',
    icon: 'wallet',
  },
  {
    id: 'track',
    title: 'Suivez vos finances en temps réel',
    description: 'Enregistrez vos transactions en quelques secondes et visualisez instantanément votre solde.',
    illustration: 'track',
    color: '#3b82f6',
    icon: 'trending-up',
  },
  {
    id: 'categories',
    title: 'Catégories intelligentes',
    description: 'Organisez vos dépenses par catégorie et comprenez où va votre argent.',
    illustration: 'categories',
    color: '#8b5cf6',
    icon: 'grid',
  },
  {
    id: 'sync',
    title: 'Synchronisation automatique',
    description: 'Retrouvez vos données sur tous vos appareils. Hors ligne ? Pas de problème.',
    illustration: 'sync',
    color: '#f59e0b',
    icon: 'cloud',
  },
  {
    id: 'start',
    title: 'Prêt à commencer ?',
    description: 'Configurons votre compte en quelques étapes pour démarrer sur les chapeaux de roues.',
    illustration: 'start',
    color: '#ec4899',
    icon: 'rocket',
  },
];