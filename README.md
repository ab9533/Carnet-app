# Carnet — planificateur personnel

Site statique, sans build, sans dépendance externe (à part les polices Google Fonts). Les 4 fichiers (`index.html`, `app.js`, `service-worker.js`, `manifest.json`) doivent rester ensemble, dans le même dossier.

## Utilisation immédiate
Ouvrir `index.html` dans un navigateur fonctionne pour tester l'interface. Mais l'installation sur l'écran d'accueil et le fonctionnement hors-ligne nécessitent un vrai hébergement en HTTPS — les service workers ne fonctionnent pas sur un fichier ouvert localement.

## Héberger gratuitement (5 minutes)
- **Netlify Drop** (le plus rapide) : https://app.netlify.com/drop — dépose le dossier `carnet-app`, tu obtiens une URL en quelques secondes.
- **GitHub Pages** : crée un dépôt, mets les 4 fichiers à la racine, active "Pages" dans les paramètres du dépôt.

## Installer sur iPhone
1. Ouvrir l'URL hébergée dans Safari (pas Chrome — l'installation PWA sur iOS passe par Safari)
2. Bouton Partager → "Sur l'écran d'accueil"
3. L'app s'ouvre ensuite en plein écran, sans barre d'adresse

## Ce qui fonctionne déjà
- Planning du jour avec horaires (comme Structured)
- Rituels récurrents par jour de semaine
- Capture rapide (inbox) → planification a posteriori
- Notes filtrables par sujet
- Liste d'envies séparée
- Sauvegarde automatique sur l'appareil (`localStorage`) — propre à ce navigateur, pas de synchronisation entre appareils

## Limites actuelles (volontaires, pour rester simple aujourd'hui)
- **Pas de notifications.** Ce site seul ne peut pas déclencher d'alertes quand l'app est fermée — cela demande un serveur de notifications push, une étape technique en plus.
- **Pas de sync Calendrier / Rappels iOS.** Nécessiterait un accès aux API Apple, hors de portée d'un simple site web.
- **Un seul appareil.** Les données ne quittent pas le navigateur où elles ont été saisies (pas de compte, pas de cloud).

## Pistes pour la suite
- Export/import des données en JSON, pour changer d'appareil manuellement
- Icône personnalisée (actuellement aucune — iOS utilisera une capture d'écran par défaut)
- Notifications locales tant que l'app est ouverte (faisable sans backend)
- Vraies notifications push + sync Calendrier : demande un petit serveur, à envisager seulement si le concept a fait ses preuves
