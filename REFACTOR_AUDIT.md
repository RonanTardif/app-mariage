# Audit rapide de refactorisation

## Verdict
Oui, une refactorisation **ciblée** serait utile. Le projet est lisible et fonctionne comme SPA statique, mais `assets/inits.js` concentre trop de responsabilités et augmente le risque de régressions.

## Signaux principaux

1. **Fichier “god module”**
   - `assets/inits.js` gère plusieurs pages (plan, chambre, photos, quiz, leaderboard, whatsapp), le stockage local, du rendu HTML, et de la logique réseau.
   - Conséquence: faible cohésion et difficulté de test.

2. **Duplication de patterns de rendu**
   - Plusieurs blocs reconstruisent des cartes/lignes HTML avec des helpers locaux (`line`, `render`, logique de badges, etc.).
   - Conséquence: évolution visuelle plus coûteuse et risque d'incohérences UX.

3. **Configuration hardcodée dans le code**
   - Les URLs Apps Script et le lien WhatsApp sont dans `inits.js`.
   - Conséquence: maintenance plus fragile selon les environnements ou changements de back-end.

4. **Événements et timers dispersés**
   - Plusieurs listeners et intervals sont attachés localement selon les pages.
   - Conséquence: complexité de cycle de vie et nettoyage partiel.

## Plan de refacto recommandé (progressif)

### Étape 1 (faible risque)
- Extraire une couche de config (`assets/config.js`):
  - `ROOMS_API`
  - `PHOTOS_API`
  - `WHATSAPP_LINK`
- Extraire des helpers UI réutilisables (badge statut, row key/value, card wrappers).

### Étape 2 (impact moyen)
- Découper `inits.js` en modules par feature:
  - `assets/features/plan.js`
  - `assets/features/chambre.js`
  - `assets/features/photos.js`
  - `assets/features/quiz.js`
  - `assets/features/leaderboard.js`
  - `assets/features/whatsapp.js`
- Garder `initPage()` comme point d’orchestration uniquement.

### Étape 3 (qualité/test)
- Isoler la logique pure testable:
  - normalisation/recherche
  - tri leaderboard
  - mapping statut => label/style
- Ajouter un jeu minimal de tests unitaires pour ces fonctions pures.

## Priorité concrète
1. Découpage de `inits.js` (priorité haute).
2. Sortie de la config hardcodée (priorité haute).
3. Standardisation du rendu de composants répétitifs (priorité moyenne).

## Estimation rapide
- Étape 1: ~0.5 jour
- Étape 2: ~1 à 1.5 jours
- Étape 3: ~0.5 jour

Total: ~2 à 2.5 jours, avec un gain net en maintenabilité.
