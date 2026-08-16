# Carnet — planificateur personnel

4 fichiers doivent rester ensemble, dans le même dossier : `index.html`, `app.js`, `service-worker.js`, `manifest.json`.

## Nouveau : connexion + synchronisation entre appareils
L'app a maintenant un vrai compte (email + mot de passe) et synchronise ton planning via Firebase (Google), gratuitement. Avant que ça fonctionne, il faut créer ton propre projet Firebase — ça prend 5-10 minutes, une seule fois.

### 1. Créer le projet
- Va sur **console.firebase.google.com** → "Ajouter un projet" → donne-lui un nom (ex. `carnet-perso`) → tu peux désactiver Google Analytics, pas nécessaire ici.

### 2. Activer la connexion par email
- Menu de gauche → **Authentication** → "Get started" → onglet "Sign-in method" → active **Email/Password**.

### 3. Créer la base de données
- Menu de gauche → **Firestore Database** → "Créer une base de données" → choisis une région proche (ex. `eur3 (europe-west)`) → mode **production**.

### 4. Sécuriser l'accès aux données
- Dans Firestore, onglet **Règles** → remplace tout le contenu par :
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plans/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
- Clique **Publier**. Ça garantit que seul toi (une fois connecté) peux lire ou écrire ton propre planning.

### 5. Récupérer la config et l'ajouter au fichier
- Icône roue crantée (en haut à gauche) → **Paramètres du projet** → section "Vos applications" → clique l'icône `</>` (Web) → donne un nom → "Enregistrer l'application".
- Firebase affiche un objet `firebaseConfig` — copie ces valeurs.
- Ouvre `app.js`, tout en haut, et remplace les `"REMPLACE_MOI"` par tes vraies valeurs.
- Redépose le dossier sur Netlify/GitHub (comme avant) pour mettre à jour le site en ligne.

### Utilisation
- Premier appareil : "Pas encore de compte ? En créer un" → email + mot de passe → ton planning local existant est poussé vers le cloud automatiquement.
- Chaque appareil suivant : "Se connecter" avec les mêmes identifiants → le planning apparaît, et se synchronise ensuite en continu entre tous tes appareils.

## Ce qui fonctionne déjà
- Planning du jour avec horaires (comme Structured)
- Rituels récurrents par jour de semaine
- Capture rapide (inbox) → planification a posteriori
- **Décrire ma journée** (voix ou texte) : décris ta journée en langage naturel, l'app propose un découpage en tâches avec horaires détectés, à valider avant ajout — signale si une tâche est déjà couverte par un rituel existant, pour que tu décides toi-même quoi en faire
- Liste d'envies séparée
- Connexion par compte + synchronisation entre appareils (Firebase)
- Notes : présent dans le code mais mis de côté pour l'instant, pas une priorité actuelle

## Limites actuelles
- **Le parseur de langage naturel est basé sur des règles simples (détection d'heures, de mots-clés), pas une vraie IA.** Il fonctionne bien sur des phrases classiques ("sport à 18h30 pendant 1h") mais peut se tromper sur des tournures inhabituelles — d'où l'étape de vérification avant ajout.
- **Micro intégré peu fiable sur iPhone.** Le mieux reste le micro du clavier iOS natif, directement dans le champ de texte.
- **L'app a besoin d'internet pour démarrer** (le SDK Firebase se charge depuis le web). Les fichiers sont mis en cache après une première visite réussie pour limiter ça, mais ce n'est pas garanti à 100%.
- **Pas de notifications.** Toujours pas de quoi déclencher des alertes quand l'app est fermée — demanderait un serveur de notifications push en plus.
- **Pas de sync Calendrier / Rappels iOS natif.**
- **Un seul éditeur à la fois recommandé.** En cas de modification simultanée sur deux appareils au même moment, c'est la dernière sauvegarde qui l'emporte (pas de fusion intelligente).

## Pistes pour la suite
- Notifications locales tant que l'app est ouverte
- Icône personnalisée sur l'écran d'accueil
- Reprendre la fonctionnalité Notes quand ce sera prioritaire
