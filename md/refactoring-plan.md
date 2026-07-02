# Plan de Refactorisation - Ajiya Ta

## Date
Juillet 2026

## Objectif Général
Améliorer l'expérience utilisateur, ajouter des fonctionnalités clés et respecter la philosophie offline-first.

---

## Phase 1: Balance Initiale (Terminée ✅)
### Tâches réalisées
1. **Mise à jour du schéma DB**
   - Ajout de la colonne `initialBalance` dans la table `accounts` (src/db/schema.ts)
2. **Mise à jour des services**
   - Modification de `initializeAccount` pour prendre en charge `initialBalance` (src/features/accounts/services.ts)
3. **Mise à jour de l'onboarding**
   - Ajout d'une étape pour saisir la balance initiale (src/app/onboarding-config.tsx)
4. **Mise à jour des calculs**
   - Modification de `calculateFinancialSummary` pour inclure `initialBalance` (src/lib/finance/calculations.ts)

---

## Phase 2: Authentification Biométrique (En cours 🔄)
### Tâches à réaliser
1. **Configurer expo-local-authentication**
   - Vérifier la disponibilité de la biométrie
   - Ajouter les permissions nécessaires dans app.json
2. **Stocker les informations d'identification de manière sécurisée**
   - Utiliser expo-secure-store pour enregistrer les informations de connexion
3. **Intégrer dans les écrans auth**
   - Ajouter un bouton "Se connecter avec empreinte" sur l'écran de login
   - Implémenter la logique de déverrouillage biométrique
4. **Ajouter un paramètre pour activer/désactiver la biométrie**
   - Dans l'écran Paramètres

---

## Phase 3: Amélioration des Ecrans Auth
### Tâches à réaliser
1. **Redessiner les écrans login/register**
   - S'inspirer des exemples fournis dans `exemple/`
   - Améliorer le design avec des animations fluides
2. **Ajouter la vérification des champs en temps réel**
   - Utiliser Zod et React Hook Form pour une validation stricte
3. **Améliorer les états de chargement et d'erreur**
   - Afficher des messages clairs pour l'utilisateur

---

## Phase 4: Navigation par Tabs
### Tâches à réaliser
1. **Mettre à jour la navigation principale**
   - Utiliser le composant Tabs existant (src/components/ui/tabs.tsx)
   - Définir les onglets principaux : Accueil, Transactions, Budgets, Paramètres
2. **Intégrer le Floating Action Button (FAB)**
   - Pour ajouter rapidement une transaction
3. **Améliorer la Bottom Navigation**
   - Respecter les guidelines Material Design

---

## Phase 5: Calcul de Balance Précis
### Tâches à réaliser
1. **Mettre à jour les hooks pour récupérer initialBalance**
   - Dans src/features/accounts/hooks.ts
2. **Mettre à jour le Dashboard**
   - Afficher la balance initiale + revenus - dépenses
3. **Mettre à jour les composants financiers**
   - BalanceCard
   - QuickStats

---

## Phase 6: Différenciation Compte Personnel/Commercial
### Tâches à réaliser
1. **Adapter l'interface selon le type de compte**
   - Couleurs différentes
   - Composants spécifiques (ex: factures pour commercial)
2. **Ajouter des fonctionnalités spécifiques au compte commercial**
   - Gestion des clients
   - Facturation
   - TVA

---

## Phase 7: Notifications et Rappels
### Tâches à réaliser
1. **Configurer expo-notifications**
2. **Ajouter des rappels pour les budgets**
   - Lorsque le budget est dépassé
3. **Ajouter des rappels pour les objectifs d'épargne**
4. **Ajouter des notifications de synchronisation**

---

## Phase 8: Invalidation des Queries
### Tâches à réaliser
1. **Vérifier que les mutations invalident bien les queries**
   - Lors de l'ajout d'une transaction
   - Lors de la modification d'un budget
   - Lors de la modification d'un objectif

---

## Phase 9: Synchronisation Cloud
### Tâches à réaliser
1. **Vérifier la synchronisation offline-first**
   - Assurer que toutes les modifications sont stockées localement d'abord
2. **Améliorer la gestion des conflits**
3. **Ajouter une progression visible lors de la synchronisation**

---

## Priorités
1. **Haute**: Phase 2 (Biométrie), Phase 5 (Calcul Balance)
2. **Moyenne**: Phase 3 (Ecrans Auth), Phase 4 (Tabs)
3. **Basse**: Phase 6 à 9

---

## Prochaines Étapes Immédiates
- Terminer la Phase 2 (Authentification Biométrique)
- Vérifier les hooks pour récupérer `initialBalance` et mettre à jour le Dashboard
- Commencer la Phase 3 (Amélioration écrans Auth)
