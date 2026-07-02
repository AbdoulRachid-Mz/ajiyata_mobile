# Chapitre 3 — Design System d’Ajiya Ta

---

# 3.1 Philosophie du Design System

Le Design System d’Ajiya Ta est conçu autour de 4 principes :

## 1. Clarté avant décoration

Chaque élément UI doit aider l’utilisateur à comprendre rapidement :

* combien il gagne
* combien il dépense
* son solde
* ses objectifs

Aucune décoration inutile.

---

## 2. Hiérarchie visuelle forte

Les chiffres financiers doivent être immédiatement lisibles.

Exemple :

* Revenus → vert
* Dépenses → rouge
* Épargne → bleu
* Budget → orange
* Profit → violet

---

## 3. Cohérence totale

Tous les composants utilisent :

* le même thème
* les mêmes espacements
* les mêmes tailles de texte
* les mêmes animations

---

## 4. Mobile-first

Tout est optimisé pour :

* une main
* écran petit
* usage rapide
* interactions courtes

---

# 3.2 Structure du Theme System

Le thème est la **source unique de vérité visuelle**.

Il est divisé en 6 blocs :

```text id="t0a1"
theme
│
├── colors
├── spacing
├── typography
├── borderRadius
├── shadows
├── animations
```

---

# 3.3 Couleurs (Core + Finance Layer)

## 3.3.1 Couleurs de base (UI)

### Light Theme

* background
* foreground
* card
* border
* muted
* accent
* destructive
* primary

### Dark Theme

Même structure mais adaptée au contraste.

---

## 3.3.2 Couleurs métier (IMPORTANT)

C’est ce qui rend Ajiya Ta spécial.

```text id="c3f2"
financialColors
```

### Revenus

```text
income: #16a34a
```

### Dépenses

```text
expense: #ef4444
```

### Profit

```text
profit: #22c55e
```

### Perte

```text
loss: #dc2626
```

### Épargne

```text
saving: #3b82f6
```

### Budget

```text
budget: #f59e0b
```

### Investissement

```text
investment: #8b5cf6
```

---

## Règle importante

👉 Les composants UI ne doivent jamais définir de couleurs en dur.

Ils doivent toujours utiliser :

```ts
theme.colors.*
theme.financialColors.*
```

---

# 3.4 Typographie

## Système typographique

```text id="tpo3"
xs → 12
sm → 14
base → 16
lg → 18
xl → 20
2xl → 24
3xl → 30
4xl → 36
```

---

## Règles

* Les chiffres financiers utilisent **bold**
* Les titres utilisent **semibold**
* Le texte secondaire utilise mutedForeground

---

## Hiérarchie recommandée

* Balance principale → 3xl / bold
* Totaux → 2xl / semibold
* Labels → base / medium
* Metadata → sm / regular

---

# 3.5 Espacement (Spacing System)

Basé sur une grille simple :

```text id="sp1"
4 → xs
8 → sm
16 → md
24 → lg
32 → xl
48 → 2xl
```

---

## Règle

Aucune valeur arbitraire dans les styles.

Seulement :

```ts
theme.spacing.*
```

---

# 3.6 Border Radius

```text id="br1"
sm → 4
md → 8
lg → 12
xl → 16
full → 9999
```

---

## Utilisation

* Cards → md / lg
* Buttons → md
* Avatars → full
* Sheets → xl

---

# 3.7 Shadows

```text id="sh1"
sm → léger
md → standard
lg → important
```

---

## Règle

* Light mode → shadows visibles
* Dark mode → shadows plus subtiles

---

# 3.8 Animation System

Les animations doivent être :

* rapides
* naturelles
* non distrayantes

---

## Types d’animation

```text id="an1"
fast → 150ms
normal → 250ms
slow → 400ms
spring → bouncy UI
```

---

## Usage

* Button press → fast
* Screen transition → normal
* Modal → spring

---

# 3.9 Icon System

Tous les icônes doivent être uniformes.

## Recommandation

* Lucide Icons (ou equivalent Expo compatible)

---

## Tailles

```text id="ic1"
sm → 16
md → 20
lg → 24
xl → 32
```

---

# 3.10 Design Tokens (Standardisation)

Tous les styles doivent passer par des tokens.

## Exemple

```ts id="dt1"
color: theme.colors.primary
padding: theme.spacing.md
radius: theme.borderRadius.md
fontSize: theme.typography.base
```

---

# 3.11 Structure UI Components

Tous les composants UI doivent respecter :

## 1. Stateless

Aucune logique métier.

---

## 2. Theme-driven

Tout dépend du theme.

---

## 3. Variant-based

Exemple :

```ts id="vb1"
<Button variant="default" />
<Button variant="destructive" />
<Button variant="outline" />
```

---

## 4. Size-based

```ts
<Button size="sm" />
<Button size="md" />
<Button size="lg" />
```

---

# 3.12 Règles UI strictes

## Interdictions

❌ couleurs en dur
❌ styles inline non liés au theme
❌ logique métier dans UI
❌ accès Firebase dans UI
❌ accès SQLite dans UI

---

## Obligations

✔ tout passe par Theme
✔ tout est typé TypeScript
✔ tout est réutilisable
✔ tout est composable

---

# 3.13 Structure UI Library

```text id="ui1"
components/ui/
```

Organisation :

```text
button/
input/
card/
modal/
sheet/
toast/
tabs/
switch/
checkbox/
radio/
select/
tooltip/
avatar/
badge/
progress/
calendar/
date-picker/
amount-input/
currency-input/
```

---

# 3.14 Composants financiers spécifiques

C’est ce qui différencie Ajiya Ta des autres apps.

```text id="fin1"
BalanceCard
IncomeCard
ExpenseCard
ProfitCard
BudgetCard
SavingGoalCard
TransactionCard
AccountCard
StatCard
```

---

# 3.15 UX Principles (très important)

## 1. Rapid input

Ajouter une transaction doit prendre < 5 secondes.

---

## 2. Zero friction UI

Moins de clics = mieux.

---

## 3. Smart defaults

* devise pré-sélectionnée
* date automatique
* type intelligent (revenu/dépense suggéré)

---

## 4. Immediate feedback

Chaque action doit avoir :

* animation
* haptique
* mise à jour instantanée

---

# 3.16 Résumé

Le Design System d’Ajiya Ta repose sur :

* un thème centralisé
* des tokens stricts
* une séparation UI / logique métier
* des couleurs financières dédiées
* un système de composants maison
* une UX ultra rapide et simple

---

Ce Design System constitue la base visuelle et comportementale de toute l’application. Il garantit une expérience cohérente, prévisible et évolutive sur l’ensemble des modules d’Ajiya Ta.
