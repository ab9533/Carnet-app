# Carnet — planificateur personnel

4 fichiers doivent rester ensemble, dans le même dossier : `index.html`, `app.js`, `service-worker.js`, `manifest.json`.

## Utilisation immédiate
Ouvrir `index.html` dans un navigateur fonctionne pour tester. Mais l'installation sur l'écran d'accueil et le fonctionnement hors-ligne nécessitent un vrai hébergement en HTTPS — les service workers ne fonctionnent pas sur un fichier ouvert localement.

## Héberger gratuitement (5 minutes)
- **Netlify Drop** (le plus rapide) : https://app.netlify.com/drop — dépose le dossier `carnet-app`, tu obtiens une URL en quelques secondes.
- **GitHub Pages** : dépôt existant `Carnet-app` déjà en place → https://ab9533.github.io/Carnet-app/

## Installer sur iPhone
1. Ouvrir l'URL hébergée dans Safari (pas Chrome)
2. Bouton Partager → "Sur l'écran d'accueil"
3. L'app s'ouvre ensuite en plein écran, sans barre d'adresse

## Ce qui fonctionne déjà
- Planning du jour avec horaires (comme Structured)
- Rituels récurrents par jour de semaine
- Capture rapide (inbox) → planification a posteriori
- **Décrire ma journée** (voix ou texte) : décris ta journée en langage naturel, l'app propose un découpage en tâches avec horaires détectés, à valider avant ajout — signale si une tâche est déjà couverte par un rituel existant, pour que tu décides toi-même quoi en faire
- Liste d'envies séparée
- Sauvegarde automatique sur l'appareil (`localStorage`) — propre à ce navigateur
- Notes : présent dans le code mais mis de côté pour l'instant, pas une priorité actuelle

## Limites actuelles (assumées, pour rester simple)
- **Pas de synchronisation entre appareils.** Chaque appareil a sa propre copie des données, indépendante des autres. (Une synchro via compte + cloud a été envisagée puis écartée pour l'instant — possible à ajouter plus tard si le besoin revient.)
- **Le parseur de langage naturel est basé sur des règles simples (détection d'heures, de mots-clés), pas une vraie IA.** Fonctionne bien sur des phrases classiques ("sport à 18h30 pendant 1h"), peut se tromper sur des tournures inhabituelles — d'où l'étape de vérification avant ajout.
- **Micro intégré peu fiable sur iPhone.** Le mieux reste le micro du clavier iOS natif, directement dans le champ de texte.
- **Pas de notifications.**
- **Pas de sync Calendrier / Rappels iOS.**

## Pistes pour la suite
- Export/import des données en JSON, pour changer d'appareil manuellement
- Icône personnalisée sur l'écran d'accueil
- Notifications locales tant que l'app est ouverte
- Reprendre la fonctionnalité Notes quand ce sera prioritaire
- Synchronisation entre appareils, si le besoin revient
