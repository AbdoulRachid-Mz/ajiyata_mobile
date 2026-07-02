# AJIYA TA

## Product Requirements Document (PRD) & Technical Architecture Document (Version 1.0)

---

# 1. Présentation du projet

## Nom du projet

**Ajiya Ta**

> En haoussa, "Ajiya" fait référence à l'épargne, à la réserve ou au capital, tandis que "Ta" signifie "ton" ou "ta". Le nom peut être compris comme **"Ton épargne"**, **"Ta trésorerie"** ou **"Ton argent"**, ce qui reflète parfaitement la mission de l'application.

---

# Vision

Ajiya Ta est une application mobile **offline-first** de gestion financière personnelle et commerciale.

Elle permet à un utilisateur d'enregistrer rapidement ses revenus, dépenses et ventes, tout en calculant automatiquement les indicateurs financiers en arrière-plan.

L'objectif principal est de proposer une application extrêmement simple à utiliser, mais suffisamment robuste pour évoluer vers une solution complète de gestion financière.

L'utilisateur ne fait jamais de calculs.

Il enregistre simplement ses opérations.

L'application calcule automatiquement :

* les revenus
* les dépenses
* les bénéfices
* les pertes
* les budgets
* les objectifs d'épargne
* les statistiques
* les graphiques
* les rapports

---

# Philosophie du projet

Ajiya Ta suit plusieurs principes fondamentaux.

## Simplicité

Chaque fonctionnalité doit demander le minimum d'actions possible.

L'utilisateur doit pouvoir enregistrer une opération en moins de cinq secondes.

---

## Offline First

Toutes les fonctionnalités principales doivent fonctionner sans connexion Internet.

Les données sont enregistrées localement.

Internet n'est utilisé que pour :

* la sauvegarde
* la synchronisation
* les notifications
* les mises à jour des taux de change
* le partage entre plusieurs appareils

---

## Performance

Toutes les opérations doivent être instantanées.

Aucun écran ne doit attendre Internet pour fonctionner.

---

## Évolutivité

L'architecture doit permettre d'ajouter ultérieurement :

* plusieurs entreprises
* plusieurs caisses
* plusieurs utilisateurs
* des abonnements
* un inventaire
* des clients
* des fournisseurs
* des employés
* des modules supplémentaires

sans refondre la base du projet.

---

## Sécurité

Les données financières sont privées.

Les sauvegardes doivent être sécurisées.

Les informations sensibles doivent être stockées de manière chiffrée lorsque cela est nécessaire.

---

# Public cible

L'application est destinée à plusieurs catégories d'utilisateurs.

## Compte Personnel

* particuliers
* étudiants
* salariés
* freelances
* artisans

Fonctionnalités simplifiées.

---

## Compte Commercial

* boutiques
* restaurants
* pharmacies
* alimentations
* vendeurs
* petites entreprises

Fonctionnalités avancées.

---

# Fonctionnalités principales

Le projet sera construit autour des modules suivants.

## Gestion des opérations

* revenus
* dépenses
* ventes
* achats
* transferts internes

---

## Comptabilité automatique

Calcul permanent :

* revenus
* dépenses
* résultat
* bénéfices
* pertes

---

## Statistiques

Visualisation par :

* jour
* semaine
* mois
* année
* période personnalisée

---

## Objectifs d'épargne

Création d'objectifs.

Suivi automatique de leur progression.

---

## Budgets

Définition d'un budget.

Suivi des dépassements.

Notifications.

---

## Rapports

Export :

* PDF
* Excel
* CSV

---

## Synchronisation

Synchronisation facultative.

Création de compte uniquement lorsque l'utilisateur souhaite sauvegarder ses données.

---

## Gestion multi-appareils

Les données pourront être restaurées sur un nouveau téléphone après authentification.

---

## Gestion des devises

Support de plusieurs devises.

Les taux de conversion seront mis à jour automatiquement via une API externe et conservés localement afin de permettre les conversions même hors connexion.

---

## Pièces jointes

Chaque opération pourra contenir :

* photo
* facture
* reçu

Les fichiers seront enregistrés localement puis synchronisés vers Cloudinary uniquement si la synchronisation est activée.

---

# Architecture générale

Le projet repose sur une architecture moderne basée sur le principe Offline First.

SQLite constitue la base de données principale.

Firestore constitue uniquement une base de synchronisation.

Cloudinary héberge les images synchronisées.

TanStack Query orchestre les accès aux données.

Toutes les règles métier sont exécutées localement avant toute synchronisation.

---

# Stack technique

## Framework

* Expo SDK (dernière version stable)
* React Native
* Expo Router
* TypeScript (mode strict)

---

## Interface

* NativeWind
* React Native Reanimated
* React Native Gesture Handler
* React Native Screens
* React Native Safe Area Context
* React Native SVG
* FlashList

Une bibliothèque UI externe ne sera pas utilisée comme fondation principale.

Le projet reposera sur une librairie UI interne (`components/ui`) entièrement maîtrisée, inspirée des bonnes pratiques de NativeWind, mais adaptée aux besoins spécifiques d'Ajiya Ta.

---

## Design System

Le Design System sera entièrement personnalisé.

Il comprendra notamment :

* thèmes clair et sombre
* palette métier (revenu, dépense, bénéfice, perte, épargne, budget...)
* typographie
* espacements
* rayons
* ombres
* animations
* tailles d'icônes
* composants réutilisables

L'ensemble des composants utilisera ce Design System sans dépendre de bibliothèques UI tierces.

---

## Base locale

* Expo SQLite
* Drizzle ORM
* Drizzle Kit

---

## Synchronisation Cloud

* Firebase Authentication
* Cloud Firestore

---

## Images

* Cloudinary

---

## Gestion d'état

* TanStack Query
* Zustand

---

## Validation

* React Hook Form
* Zod

---

## Notifications

* Expo Notifications
* Firebase Cloud Messaging

---

## Sécurité

* Expo Secure Store
* Expo Local Authentication

---

## Médias

* Expo Image Picker
* Expo File System
* Expo Sharing

---

## Internationalisation

* i18next
* react-i18next

---

## Utilitaires

* date-fns
* MMKV
* react-native-bottom-sheet
* react-native-toast-message

---

Ce document constitue la base de référence du projet. Les chapitres suivants détailleront l'architecture des dossiers, le Design System, la structure de la base de données, les flux de synchronisation, les conventions de code, les modules métier et le plan de développement.
