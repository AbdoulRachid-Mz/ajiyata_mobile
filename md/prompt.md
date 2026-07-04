Plan de Refonte Totale - Ajiya Ta
🎯 Analyse de la Situation Actuelle
Forces
✅ Architecture modulaire bien pensée (features, composants, services)

✅ Design System complet et cohérent

✅ Offline-first avec SQLite + Drizzle

✅ Interface utilisateur fluide et réactive

✅ Gestion des sessions avec SecureStore + SQLite

Faiblesses / Problèmes
❌ Synchronisation: Trop agressive, écrasement des données, doublons dans Firestore

❌ Source de vérité: Conflit entre SQLite et Firestore

❌ Auth: Surcharge de gestionnaires (FirebaseAuthService, AuthManager, localAuthService, sessionService)

❌ Providers: Emboîtement profond et complexe

❌ Types: Duplication entre les fichiers types

❌ Imports circulaires: Risque potentiel

❌ Gestion des erreurs: Inconsistante

📋 Plan de Refonte - Super Prompt
Objectif Principal
Transformer Ajiya Ta en une application vraiment offline-first où :

SQLite est l'unique source de vérité

Firestore est un backup volontaire et manuel

L'authentification est optionnelle pour l'utilisation

La synchronisation est entièrement contrôlée par l'utilisateur

Phase 1: Restructuration des Services d'Authentification
1.1. Simplification du système d'auth
Supprimer:

services/auth/auth-manager.ts (fusionner avec FirebaseAuthService)

services/auth/local-auth.service.ts (intégrer dans un service unifié)

Créer:

services/auth/AuthService.ts - Service unifié qui gère :

Firebase Auth (connexion/déconnexion)

Session locale (SecureStore + SQLite)

Biométrie

Restauration de session

Nouvelle architecture d'auth:

text
AuthService (Unifié)
├── Firebase Authentication
│   ├── login()
│   ├── register()
│   ├── logout()
│   ├── resetPassword()
│   └── getCurrentUser()
├── Session Management
│   ├── getSession()
│   ├── createSession()
│   ├── updateSession()
│   └── destroySession()
├── Biometric Auth
│   ├── isAvailable()
│   ├── isEnabled()
│   ├── enable()
│   ├── disable()
│   └── authenticate()
└── Local Session
    ├── isLocal()
    └── createLocalSession()
Phase 2: Refonte du Système de Synchronisation
2.1. Principe de la nouvelle sync
typescript
// Nouveau paradigme
SQLite = Source de vérité (toujours)
Firestore = Backup volontaire (manuel)

// Opérations
backupToCloud() -> Push SQLite -> Firestore (sans écraser)
restoreFromCloud() -> Pull Firestore -> SQLite (écrase complet)
hasCloudData() -> Vérifier si des données existent
getLastBackupDate() -> Date de la dernière sauvegarde
getLastRestoreDate() -> Date de la dernière restauration
2.2. Détection des doublons
Règles de dédoublonnage:

Entité	Champ Unique
Users	email
Accounts	userId + name
Categories	accountId + name + type
Transactions	accountId + title + amount + date (approximatif)
Budgets	accountId + categoryId + period
SavingGoals	accountId + title
2.3. Fichier de sync simplifié
@/services/sync/SyncService.ts

typescript
export class SyncService {
  // Backup
  async backupToCloud(): Promise<{ success: boolean; message: string }>
  private async backupEntity(entity: SyncEntity, userId: string)
  
  // Restore
  async restoreFromCloud(): Promise<{ success: boolean; message: string }>
  private async restoreEntity(entity: SyncEntity, userId: string)
  
  // Status
  async hasCloudData(): Promise<boolean>
  async getLastBackupDate(): Promise<string | null>
  async getLastRestoreDate(): Promise<string | null>
  
  // Helpers
  private prepareForFirestore(entity: any)
  private prepareForSQLite(data: any)
  private checkDuplicate(entityName: string, data: any): Promise<boolean>
}
Phase 3: Réorganisation des Dossiers
3.1. Nouvelle structure
text
src/
├── app/                    # Expo Router (écrans)
│   ├── (tabs)/             # Onglets principaux
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── goals/
│   │   └── settings/
│   ├── auth/               # Authentification
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── onboarding/         # Onboarding
│   ├── _layout.tsx         # Layout principal
│   └── index.tsx           # Point d'entrée
│
├── components/             # Composants UI
│   ├── ui/                 # Design System
│   ├── finance/            # Composants métier
│   ├── charts/             # Graphiques
│   └── forms/              # Formulaires
│
├── features/               # Features (indépendantes)
│   ├── auth/               # Authentification
│   ├── accounts/           # Comptes
│   ├── transactions/       # Transactions
│   ├── categories/         # Catégories
│   ├── budgets/            # Budgets
│   ├── goals/              # Objectifs
│   └── sync/               # Synchronisation
│
├── services/               # Services
│   ├── auth/               # Auth Service unifié
│   ├── sync/               # Sync Service
│   ├── database/           # Database Service
│   └── cloudinary/         # Cloudinary Service
│
├── stores/                 # Zustand Stores
│   ├── app-store.ts        # App state
│   └── ui-store.ts         # UI state
│
├── contexts/               # React Contexts
│   ├── theme-context.tsx
│   ├── auth-context.tsx
│   └── sync-context.tsx
│
├── hooks/                  # Hooks globaux
│   ├── useAuth.ts
│   ├── useSync.ts
│   └── useBiometric.ts
│
├── lib/                    # Utilitaires
│   ├── formatters/
│   ├── validators/
│   ├── storage.ts
│   └── constants.ts
│
├── db/                     # Base de données
│   ├── schema.ts
│   ├── migrations/
│   └── index.ts
│
├── types/                  # Types globaux
│   ├── index.ts
│   └── database.ts
│
└── configs/                # Configurations
    ├── firebase/
    ├── cloudinary/
    └── notifications/
Phase 4: Refonte des Contextes
4.1. AuthContext simplifié
typescript
interface AuthContextType {
  // États
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  isLocal: boolean; // Mode local vs connecté
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // Session
  isBiometricEnabled: boolean;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  authenticateBiometric: () => Promise<boolean>;
}
4.2. SyncContext simplifié
typescript
interface SyncContextType {
  // États
  isSyncing: boolean;
  hasCloudData: boolean;
  lastBackupDate: string | null;
  lastRestoreDate: string | null;
  
  // Actions
  backupToCloud: () => Promise<void>;
  restoreFromCloud: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}
Phase 5: Refonte des Providers
5.1. Nouvel ordre dans _layout.tsx
typescript
<GestureHandlerRootView>
  <SafeAreaProvider>
    <QueryClientProvider>
      <ThemeProvider>
        <AuthProvider>          {/* Authentification */}
          <SyncProvider>        {/* Synchronisation */}
            <NotificationProvider>
              <MigrationLoader>
                <Stack />
              </MigrationLoader>
            </NotificationProvider>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>
Supprimer:

NetworkProvider (intégrer dans SyncProvider)

Le provider en trop (vérifier les doublons)

Phase 6: Correction des Services Métier
6.1. Repository Pattern uniformisé
Chaque repository doit avoir:

typescript
interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  getById(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
6.2. Gestion des syncStatus
Règle: Chaque entité a syncStatus: 'pending' | 'synced' | 'failed'

Utilisation:

'pending' = Nouvelle/modifiée, pas encore sauvegardée dans le cloud

'synced' = Sauvegardée dans le cloud

'failed' = Erreur lors de la sauvegarde

Phase 7: Nettoyage des Types
7.1. Types unifiés dans @/types
Supprimer les duplications:

features/auth/types → déplacer dans @/types/auth

features/attachments/types → déplacer dans @/types/attachments

features/sync/types → déplacer dans @/types/sync

7.2. Types de base
typescript
// @/types/index.ts
export * from './database';
export * from './auth';
export * from './sync';
export * from './finance';

// @/types/database.ts
export type { User, Account, Transaction, Category, Budget, SavingGoal, Attachment };

// @/types/auth.ts
export type { AuthUser, AuthCredentials, AuthRegisterData, AuthResponse };

// @/types/sync.ts
export type { SyncEntity, SyncStatus, SyncOperation };
Phase 8: Amélioration de la Gestion des Erreurs
8.1. Créer un service d'erreurs
typescript
// @/services/error/ErrorService.ts
export class ErrorService {
  static handle(error: unknown, context?: string): void {
    // Logging
    console.error(`[${context}]`, error);
    
    // User feedback
    const message = this.getUserMessage(error);
    // Show toast/alert
    
    // Crash reporting (optionnel)
    // Sentry/Crashlytics
  }
  
  static getUserMessage(error: unknown): string {
    // Retourner un message utilisateur compréhensible
  }
}
Phase 9: Migration des Données
9.1. Script de migration
typescript
// scripts/migrate-sync.ts
async function migrateSyncData() {
  // 1. Identifier les données avec syncStatus='pending'
  // 2. Les marquer comme 'failed' avec raison "Migration"
  // 3. Créer un backup local
  // 4. Nettoyer Firestore des doublons
}
📊 Planning de Refonte
Semaine 1: Fondations
Restructurer les services d'auth

Créer le nouveau SyncService

Simplifier les providers

Semaine 2: Core Features
Refactoriser les repositories

Uniformiser les types

Nettoyer les fichiers inutiles

Semaine 3: UI/UX
Ajouter SyncManager dans Settings

Indicateurs de statut de sync

Tests des flux de backup/restore

Semaine 4: Tests & Documentation
Tests des cas critiques

Documentation technique

Guide d'utilisation

🚀 Commandes de Nettoyage
bash
# Supprimer les fichiers inutiles
rm -rf src/services/auth/auth-manager.ts
rm -rf src/services/auth/local-auth.service.ts
rm -rf src/services/firebase/sync.service.ts (ancien)

# Créer les nouveaux fichiers
touch src/services/auth/AuthService.ts
touch src/services/sync/SyncService.ts

# Réorganiser les providers
# Modifier src/app/_layout.tsx
# Modifier src/app/(tabs)/settings.tsx
✅ Checklist de Validation
L'application démarre sans erreurs

L'authentification fonctionne (login/register/logout)

Les données locales persistent après logout

Le backup vers Firestore fonctionne sans doublons

La restauration depuis Firestore fonctionne

Les indicateurs de sync sont précis

La biométrie fonctionne

Les transactions, budgets et objectifs sont correctement synchronisés