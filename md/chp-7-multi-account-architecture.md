# Chapitre 7 — Architecture Multi-Type de Comptes

## Objectif

L'application Ajiya Ta est conçue pour gérer trois types de comptes principaux :
1. **Personnel** (`personal`) : Gestion des finances individuelles (salaire, dépenses quotidiennes, épargne).
2. **Commercial / Business** (`business`) : Gestion de petite entreprise (chiffre d'affaires, charges, bénéfice net).
3. **Famille / Partagé** (`family`) : Gestion commune (dépenses du foyer, contributions de chaque membre).

Ce document explique comment l'architecture UI s'adaptera à ces différents types de comptes sans dupliquer le code de manière excessive.

## Architecture UI Dynamique

L'idée principale est de **ne pas créer trois applications différentes**, mais d'adapter l'interface et les fonctionnalités affichées selon le champ `currentAccount.type` du store Zustand.

### 1. Le Dashboard (Tableau de bord)

Le `dashboard.tsx` est le point d'entrée principal. Il doit s'adapter de manière dynamique.

**Approche technique :**
- Utiliser un composant parent `DashboardContainer`
- Rendre dynamiquement des "widgets" ou des sous-composants selon le type de compte :

```tsx
// Exemple conceptuel de rendu dynamique
function Dashboard() {
  const { currentAccount } = useAppStore();

  switch (currentAccount.type) {
    case 'business':
      return <BusinessDashboard />;
    case 'family':
      return <FamilyDashboard />;
    case 'personal':
    default:
      return <PersonalDashboard />;
  }
}
```

**Différences de contenu :**
- **Personnel** : KPIs classiques (Revenus, Dépenses, Solde), Graphique de progression, Objectifs d'épargne.
- **Commercial** : Chiffre d'affaires (CA), Charges, Bénéfice Net, TVA/Taxes (éventuellement), Top produits/services.
- **Famille** : Budget global du foyer, Répartition des dépenses par membre (qui a payé quoi), Cotisations.

### 2. Formulaire de Transaction

Le formulaire (`transaction-create.tsx`) reste majoritairement identique (Titre, Montant, Date, Catégorie), mais avec des champs optionnels selon le contexte :

- **Business** : Ajout possible d'un champ "Client / Fournisseur", d'un "Numéro de facture", ou d'une case "TVA applicable".
- **Famille** : Ajout d'un champ "Payé par" (membre de la famille) et "Concerne" (pour qui la dépense a été faite).

**Implémentation :**
Des champs conditionnels basés sur `currentAccount.type` :
```tsx
{currentAccount.type === 'business' && (
  <InvoiceNumberInput value={invoice} onChange={setInvoice} />
)}
```

### 3. Catégories par défaut

Chaque type de compte aura un jeu de catégories par défaut différent lors de sa création.
- *Personnel* : Logement, Alimentation, Transport, Loisirs...
- *Business* : Ventes de marchandises, Prestations de services, Salaires, Loyer commercial, Impôts...
- *Famille* : Épicerie, Éducation/École, Santé familiale, Vacances...

### 4. Rapports et Exports

Les exports de données (`export-service.ts`) et les écrans de rapports (`reports.tsx`) s'adapteront.
- **Business** : Génération d'un "Compte de résultat" simplifié.
- **Famille** : Rapport de "Qui doit combien à qui" (équilibrage des comptes).

## Conclusion technique

La table `accounts` et l'enum TypeScript `AccountType` centralisent la logique. Partout dans l'application, nous utiliserons `if (currentAccount.type === '...')` pour masquer, afficher ou renommer des éléments, garantissant une base de code unifiée tout en offrant une expérience spécialisée.
