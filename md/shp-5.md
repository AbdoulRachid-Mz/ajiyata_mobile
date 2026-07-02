# Chapitre 5 — Modèle de données (Drizzle + architecture financière avancée)

---

# 5.1 Objectif du modèle de données

Le système de données d’Ajiya Ta doit :

* fonctionner 100% offline (SQLite comme source de vérité)
* supporter la synchronisation multi-appareils (Firestore)
* gérer plusieurs comptes (Personnel / Commercial)
* supporter multi-devises
* être extensible vers SaaS (abonnements, équipes, entreprises)
* éviter toute migration destructrice future

---

# 5.2 Principes fondamentaux

## 1. Tout appartient à un Account

👉 Règle clé :

> Toute donnée financière appartient à un `account`

Cela permet :

* multi-comptes
* séparation Personnel / Business
* isolation des données
* futur SaaS

---

## 2. Sync-first design

Chaque table doit contenir :

```ts id="sync1"
id (uuid)

createdAt
updatedAt
deletedAt

syncStatus
lastSyncedAt

deviceId
version
metadata (JSON)
```

---

## 3. Offline-first priority

SQLite est :

* source de vérité
* jamais dépendant du cloud

Firestore = miroir.

---

# 5.3 Modèle global (vue système)

```text id="arch1"
User
  ├── Accounts (Personal / Business)
        ├── Transactions
        ├── Budgets
        ├── Saving Goals
        ├── Categories
        ├── Attachments
        ├── Reports
        ├── Devices
        ├── Sync Logs
```

---

# 5.4 TABLE USERS

```ts id="user1"
users {
  id: string

  name: string
  email?: string
  phoneNumber: string

  role: "user" | "admin"

  country?: string
  language?: string

  defaultCurrency: string

  accountType: "personal" | "business"

  isSynced: boolean

  createdAt: number
  updatedAt: number

  metadata: JSON
}
```

---

# 5.5 TABLE ACCOUNTS (IMPORTANT CORE)

👉 C’est la base du système multi-compte.

```ts id="acc1"
accounts {
  id: string

  userId: string

  name: string

  type: "personal" | "business"

  currency: string

  balance: number

  isActive: boolean

  createdAt: number
  updatedAt: number

  metadata: JSON
}
```

---

## Rôle de Accounts

Chaque compte représente :

* un portefeuille personnel
* une boutique
* un restaurant
* un business séparé

---

# 5.6 TABLE TRANSACTIONS (CORE FINANCIER)

```ts id="tx1"
transactions {
  id: string

  accountId: string

  type: "income" | "expense" | "transfer"

  title: string
  amount: number

  currency: string

  categoryId?: string

  note?: string

  date: number

  attachmentId?: string

  isSynced: boolean

  createdAt: number
  updatedAt: number

  metadata: JSON
}
```

---

## Logique métier

* income → augmente balance
* expense → diminue balance
* transfer → mouvement interne

---

# 5.7 TABLE CATEGORIES

```ts id="cat1"
categories {
  id: string

  accountId: string

  name: string

  type: "income" | "expense"

  color: string
  icon: string

  isDefault: boolean

  createdAt: number
  updatedAt: number

  metadata: JSON
}
```

---

# 5.8 TABLE BUDGETS

```ts id="bud1"
budgets {
  id: string

  accountId: string

  categoryId: string

  limit: number

  spent: number

  period: "daily" | "weekly" | "monthly"

  startDate: number
  endDate: number

  status: "active" | "exceeded" | "completed"

  createdAt: number
  updatedAt: number

  metadata: JSON
}
```

---

# 5.9 TABLE SAVING GOALS

```ts id="sav1"
saving_goals {
  id: string

  accountId: string

  title: string

  targetAmount: number

  currentAmount: number

  deadline?: number

  status: "active" | "completed" | "paused"

  createdAt: number
  updatedAt: number

  metadata: JSON
}
```

---

# 5.10 TABLE ATTACHMENTS (Cloudinary)

```ts id="att1"
attachments {
  id: string

  accountId: string

  transactionId?: string

  type: "image" | "receipt" | "document"

  localUri: string

  cloudinaryUrl?: string

  cloudinaryId?: string

  size?: number

  isSynced: boolean

  createdAt: number
  updatedAt: number

  metadata: JSON
}
```

---

# 5.11 TABLE EXCHANGE RATES

```ts id="cur1"
exchange_rates {
  id: string

  baseCurrency: string
  targetCurrency: string

  rate: number

  updatedAt: number

  metadata: JSON
}
```

---

# 5.12 TABLE DEVICES (SYNC SYSTEM)

```ts id="dev1"
devices {
  id: string

  userId: string

  name: string

  platform: "android" | "ios"

  lastActiveAt: number

  createdAt: number

  metadata: JSON
}
```

---

# 5.13 TABLE SYNC LOGS

```ts id="sync1"
sync_logs {
  id: string

  userId: string

  deviceId: string

  action: "create" | "update" | "delete"

  entity: string

  entityId: string

  status: "pending" | "synced" | "failed"

  createdAt: number

  metadata: JSON
}
```

---

# 5.14 TABLE SETTINGS

```ts id="set1"
settings {
  id: string

  userId: string

  theme: "light" | "dark" | "system"

  language: string

  currency: string

  biometricEnabled: boolean

  syncEnabled: boolean

  createdAt: number
  updatedAt: number

  metadata: JSON
}
```

---

# 5.15 RELATIONS IMPORTANTES

## User → Accounts

* 1 user = N accounts

---

## Account → Transactions

* 1 account = N transactions

---

## Account → Budgets

* 1 account = N budgets

---

## Account → Saving Goals

* 1 account = N goals

---

## Transaction → Attachment

* 1 transaction = 0 ou 1 attachment

---

# 5.16 STRATÉGIE DE CALCUL (IMPORTANT)

👉 Aucun total n’est stocké définitivement.

Tout est recalculé depuis transactions.

Exemple :

* balance
* profit
* expenses
* income

sont des **derived values**

---

# 5.17 STRATÉGIE OFFLINE-FIRST

## Source de vérité

```text id="of1"
SQLite
```

## Sync direction

```text id="of2"
SQLite → Firestore
Firestore → SQLite (restore)
```

---

## Règle critique

👉 Firestore ne doit JAMAIS être modifié directement par l’UI.

Seulement par Sync Service.

---

# 5.18 STRATÉGIE MULTI-COMPTE

Chaque action doit toujours inclure :

```ts id="mc1"
accountId
```

Sans exception.

---

# 5.19 EXTENSIBILITÉ FUTURE (IMPORTANT)

Ce modèle permet déjà :

* multi-business
* abonnements SaaS
* équipe multi-utilisateur
* comptabilité avancée
* audit financier
* export fiscal
* IA financière

---

# 5.20 CONCLUSION

Ce modèle de données garantit :

* stabilité long terme
* scalabilité SaaS
* offline-first réel
* séparation claire des responsabilités
* compatibilité Firebase + SQLite
* évolution sans refactor massif

---

👉 Prochaine étape : **Chapitre 6 — Moteur de synchronisation (SQLite ↔ Firestore ↔ Cloudinary)**

C’est là que l’application devient vraiment “multi-device intelligent”.
