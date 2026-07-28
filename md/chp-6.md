🚀 Chapitre X — Évolutions futures (Roadmap V2 & V3)
Vision

La première version d'Ajiya Ta est volontairement centrée sur la simplicité :

saisir rapidement ses revenus et dépenses ;
suivre son budget ;
consulter ses statistiques ;
synchroniser ses données lorsqu'on le souhaite.

Cette approche permet d'offrir une application légère, rapide et accessible à tous.

Les fonctionnalités décrites ci-dessous ne sont pas indispensables à la V1, mais constituent les évolutions prévues pour transformer progressivement Ajiya Ta en une véritable plateforme de gestion financière personnelle et professionnelle.

1. OCR - Numérisation automatique des reçus
Objectif

Éviter à l'utilisateur de saisir manuellement une transaction.

L'utilisateur photographie un reçu ou une facture.

L'application extrait automatiquement :

le montant
la date
le commerçant
éventuellement la catégorie

Puis crée une transaction préremplie.

Fonctionnement
Photo

↓

OCR

↓

Analyse du texte

↓

Extraction des données

↓

Pré-remplissage du formulaire

↓

Validation utilisateur

↓

Transaction créée
Exemple

Reçu :

Supermarché Bon Prix

Total : 14 250 FCFA

15/07/2026

L'application propose automatiquement :

Montant

14 250 FCFA

Catégorie

Alimentation

Date

15/07/2026

Type

Dépense

L'utilisateur valide simplement.

Technologies envisagées

Android

ML Kit OCR

iOS

Vision Framework

Alternative multiplateforme

Google ML Kit
Tesseract OCR
Avantages
gain de temps
moins d'erreurs
meilleure expérience utilisateur
2. Catégorisation intelligente des dépenses

Aujourd'hui :

L'utilisateur choisit lui-même une catégorie.

Demain :

L'application sera capable de proposer automatiquement la bonne catégorie.

Exemple

Utilisateur saisit :

Station Total

Suggestion :

Carburant
Orange Money

↓

Télécommunications
Pharmacie Centrale

↓

Santé
Fonctionnement

L'application apprend progressivement les habitudes de l'utilisateur.

Exemple :

Restaurant Le Palmier

↓

Toujours

↓

Restauration

Au bout de quelques utilisations, la catégorie sera automatiquement proposée.

Objectifs
moins de clics
meilleure qualité des statistiques
3. Prévisions financières intelligentes

Aujourd'hui

L'application montre le passé.

Demain

Elle prédit le futur.

Exemple

Historique :

Chaque mois

Salaire

200 000 FCFA

Loyer

80 000 FCFA

Carburant

35 000 FCFA

Internet

20 000 FCFA

Prévision :

Fin du mois estimée

+61 000 FCFA

ou

Attention

Votre budget alimentation risque d'être dépassé dans 5 jours.
Indicateurs possibles

Prévision :

dépenses
revenus
épargne
budget restant
évolution mensuelle
Intelligence utilisée

Dans un premier temps

Simple statistique.

Puis plus tard

Machine Learning local.

4. Widgets Android / iOS

Afficher les informations essentielles directement sur l'écran d'accueil du téléphone.

Sans ouvrir l'application.

Widgets envisagés
Solde actuel
Ajiya Ta

Solde

+245 000 FCFA
Budget du mois
Budget

62 %

restant
Dernière transaction
-2 500 FCFA

Carburant
Bouton rapide
+

Nouvelle transaction
Avantages

Ouverture beaucoup plus rapide.

5. Comptes partagés (Synchronisation familiale)

Aujourd'hui

Un compte = un utilisateur.

Demain

Un compte pourra être partagé.

Exemples

Famille

Papa

Maman

Enfant

Tous voient les mêmes dépenses.

Entreprise

Comptable

Caissier

Gérant

Chaque personne possède un rôle différent.

Gestion des permissions

Administrateur

Peut tout modifier.

Collaborateur

Ajoute uniquement des transactions.

Consultation

Lecture seule.

Cas d'utilisation

Petit commerce

Restaurant

Boutique

Association

ONG

Famille

6. Sauvegarde chiffrée de bout en bout

Aujourd'hui

Les données sont synchronisées.

Demain

Elles seront également entièrement chiffrées.

Même le serveur ne pourra pas les lire.

Principe
SQLite

↓

Chiffrement AES-256

↓

Firebase

↓

Synchronisation

↓

Déchiffrement uniquement sur l'appareil
Objectifs

Protection maximale.

Respect de la vie privée.

Technologies possibles
AES-256
Clé dérivée du Secure Storage
Android Keystore
iOS Keychain
7. Assistant financier intelligent (Vision V3)

À long terme, Ajiya Ta intégrera un assistant intelligent fonctionnant principalement en local.

Cet assistant analysera les habitudes financières de l'utilisateur afin de fournir des recommandations pertinentes tout en respectant sa confidentialité.

Exemples
Vous dépensez 35 % de plus en alimentation
que le mois dernier.
Vous pourriez économiser
environ 18 000 FCFA
ce mois-ci.
Votre budget carburant
est consommé à 92 %.
Vous n'avez enregistré
aucune transaction aujourd'hui.
Fonctionnement

Les calculs seront réalisés en priorité sur l'appareil.

Aucune donnée sensible ne sera transmise à un serveur sans le consentement explicite de l'utilisateur.

8. Écosystème Ajiya Ta

À long terme, l'application pourra évoluer vers un véritable écosystème de gestion financière.

Extensions envisagées
Synchronisation entre téléphone, tablette et Web.
Tableau de bord Web pour les comptes commerciaux.
Gestion avancée des employés et des caissiers.
Facturation et génération de devis.
Gestion des stocks pour les petits commerces.
Rapports comptables professionnels.
API publique pour les intégrations tierces.