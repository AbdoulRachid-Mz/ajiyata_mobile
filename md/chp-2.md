# Chapitre 2 — Architecture générale du projet

## Philosophie de l'architecture

Ajiya Ta est conçu comme une application évolutive.

L'objectif n'est pas seulement de créer une application de gestion de revenus et dépenses, mais une plateforme financière pouvant accueillir de nombreux modules sans nécessiter une refonte de son architecture.

L'application suit les principes suivants :

* Offline First
* Modularité
* Séparation des responsabilités
* Réutilisation maximale
* Évolutivité
* Simplicité de maintenance

Chaque fonctionnalité doit être indépendante.

Aucune feature ne doit dépendre directement d'une autre.

Toutes les communications passent par des services clairement définis.

---

# Architecture globale

L'application sera organisée en plusieurs couches.

```
Application

│

├── UI Layer
│

├── Features Layer
│

├── Services Layer
│

├── Database Layer
│

├── Synchronization Layer
│

├── Core Layer
│

└── Shared Layer
```

Chaque couche possède une responsabilité unique.

---

# Arborescence du projet

```
app/

assets/

components/

config/

constants/

contexts/

database/

features/

hooks/

lib/

providers/

services/

stores/

types/

utils/

locales/

scripts/
```

---

# Description des dossiers

## app/

Gestion de la navigation via Expo Router.

Contient uniquement :

* layouts
* groupes de routes
* écrans

Aucune logique métier.

Aucun accès direct à SQLite.

Aucun accès Firebase.

Les écrans ne font qu'afficher des données.

---

## assets/

Contient :

```
fonts/

icons/

images/

animations/

illustrations/

lottie/
```

Aucune image ne sera placée directement à la racine.

---

## components/

Composants réutilisables.

```
components

ui/

charts/

finance/

forms/

layout/

shared/

feedback/
```

---

### ui/

Notre bibliothèque UI.

Elle remplacera complètement les bibliothèques UI externes.

Elle contiendra :

```
Button

IconButton

Card

Input

Textarea

Select

Dropdown

Checkbox

Radio

Switch

Avatar

Badge

Chip

Dialog

BottomSheet

AlertDialog

Modal

Toast

Tooltip

Tabs

Progress

ProgressCircle

Separator

Divider

Skeleton

Spinner

Calendar

DatePicker

TimePicker

CurrencyInput

AmountInput
```

Tous utilisent le ThemeContext.

---

### charts/

Graphiques.

```
BarChart

LineChart

PieChart

IncomeExpenseChart

MonthlyChart

WeeklyChart

TrendChart
```

---

### finance/

Composants spécifiques.

```
BalanceCard

BudgetCard

SavingCard

AccountCard

CurrencyCard

TransactionCard

SummaryCard

ProfitCard

ExpenseCard

IncomeCard

StatCard
```

---

### forms/

Composants React Hook Form.

```
TransactionForm

BudgetForm

GoalForm

LoginForm

RegisterForm

SettingsForm

CalculatorInput
```

---

### layout/

Composants structurels.

```
Header

Footer

Page

Screen

Container

Section

EmptyState

LoadingState
```

---

# config/

Configuration générale.

```
firebase.ts

cloudinary.ts

query-client.ts

drizzle.ts

i18n.ts

notifications.ts

env.ts
```

---

# constants/

Toutes les constantes.

```
colors.ts

spacing.ts

typography.ts

radius.ts

animations.ts

currencies.ts

countries.ts

roles.ts

permissions.ts

routes.ts

account-types.ts

transaction-types.ts

budget-status.ts
```

---

# contexts/

Tous les Contexts.

```
ThemeContext

AuthContext

CurrencyContext

NetworkContext

SyncContext

AccountContext
```

Ils exposent uniquement l'état global.

La logique métier est externalisée dans les services.

---

# database/

Toute la base SQLite.

```
schema/

migrations/

repositories/

queries/

seed/

index.ts
```

Le schéma Drizzle est totalement indépendant de Firebase.

---

# features/

Le cœur de l'application.

Chaque fonctionnalité possède son propre dossier.

```
authentication/

dashboard/

transactions/

accounts/

categories/

statistics/

budgets/

saving-goals/

reports/

calculator/

currencies/

notifications/

settings/

subscriptions/

sync/
```

Chaque feature possède la même structure.

```
feature

components/

hooks/

services/

types/

schemas/

utils/

constants/
```

Cette organisation garantit que chaque module reste autonome.

---

# hooks/

Hooks globaux.

```
useTheme

useCurrency

useAuth

useSync

useBiometric

useCalculator

useNetwork

usePermissions
```

---

# lib/

Fonctions indépendantes.

```
currency/

finance/

dates/

validation/

formatters/

math/

storage/

```

Aucune dépendance React.

Uniquement du TypeScript pur.

---

# providers/

Tous les Providers.

```
ThemeProvider

QueryProvider

AuthProvider

SyncProvider

ToastProvider
```

Ils sont enregistrés une seule fois dans le Layout principal.

---

# services/

Tous les accès externes.

```
firebase/

cloudinary/

notifications/

exchange-rate/

pdf/

camera/

sharing/

permissions/

storage/
```

Les Features ne parlent jamais directement aux SDK.

Elles utilisent uniquement ces services.

---

# stores/

Zustand.

```
theme.store

auth.store

settings.store

currency.store

network.store

sync.store
```

Les données métiers (transactions, budgets, etc.) ne seront pas stockées dans Zustand.

Elles seront gérées par TanStack Query avec SQLite comme source principale.

---

# types/

Tous les types globaux.

```
api.ts

database.ts

finance.ts

common.ts

theme.ts

user.ts
```

---

# utils/

Fonctions utilitaires.

```
formatCurrency()

formatDate()

formatPhone()

sleep()

uuid()

debounce()

throttle()
```

---

# locales/

```
fr

en

ha
```

L'application est pensée dès le départ pour être multilingue.

---

# scripts/

Scripts de développement.

```
seed

generate-icons

generate-db

sync-schema
```

---

# Les responsabilités

## Les écrans

Ils affichent uniquement les données.

Ils ne calculent rien.

---

## Les composants

Ils affichent l'interface.

Ils ne parlent jamais à Firebase.

Ils ne parlent jamais directement à SQLite.

---

## Les Features

Elles contiennent la logique métier.

---

## Les Services

Ils communiquent avec :

* Firebase
* Cloudinary
* SQLite
* Notifications
* API de devises

---

## La base de données

Elle est la source de vérité de l'application.

Toutes les opérations passent d'abord par SQLite.

---

## Synchronisation

Firestore est uniquement un miroir sécurisé de SQLite.

L'utilisateur peut donc utiliser l'application sans connexion Internet pendant plusieurs semaines sans aucune perte de données.

---

# Principes de développement

Toutes les nouvelles fonctionnalités devront respecter les règles suivantes :

* aucune logique métier dans les écrans
* aucun accès Firebase dans les composants
* aucun accès SQLite dans les composants
* aucune duplication de code
* toutes les validations utilisent Zod
* tous les formulaires utilisent React Hook Form
* toutes les requêtes utilisent TanStack Query
* toutes les données persistantes passent par SQLite
* toute synchronisation passe par le module Sync
* tous les composants utilisent le Design System
* tous les types sont strictement typés avec TypeScript

Cette architecture constitue la fondation technique de l'application Ajiya Ta et garantit sa maintenabilité, sa performance et son évolutivité sur le long terme.
