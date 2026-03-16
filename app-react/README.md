# app-react — migration front moderne

Nouvelle implémentation **parallèle** de l'application mariage (sans toucher la version HTML/CSS/JS actuelle).

## Audit rapide de l'existant
Pages détectées : `home`, `programme`, `plan`, `chambre`, `photos`, `quiz`, `leaderboard`, `infos`, `whatsapp`, `admin`.

Fonctionnalités migrées dans cette base React :
- navigation mobile avec pages dédiées,
- programme du week-end avec mise en avant du prochain moment,
- plan + fiches lieux,
- recherche chambre par nom + colocataires,
- recherche créneaux photos,
- quiz + stockage score,
- leaderboard Top 10,
- infos pratiques,
- CTA WhatsApp.

Sources de données couvertes :
- JSON locaux (`/public/data/*.json`),
- APIs Google Apps Script via JSONP (rooms/photos/leaderboard),
- fallback localStorage pour scores quiz.

## Stack
- React + Vite
- Tailwind CSS
- base shadcn/ui (composants `ui/` + `cn` util)
- Lucide icons
- Framer Motion

## Démarrage local
```bash
cd app-react
npm install
npm run dev
```

## Assets binaires (copie manuelle)
Les fichiers image binaires **ne sont plus versionnés** dans `app-react/public/assets/`.

Tu dois les copier manuellement depuis la racine du projet existant vers le nouveau front :

- source : `assets/plan-domaine.jpg`
  - destination : `app-react/public/assets/plan-domaine.jpg`
- source : `assets/plan-domaine-color.jpg`
  - destination : `app-react/public/assets/plan-domaine-color.jpg`
- source : `assets/domaine_de_la_corbe_all_good_black_andwhite.jpg`
  - destination : `app-react/public/assets/domaine_de_la_corbe_all_good_black_andwhite.jpg`

Exemple de commande :
```bash
cp assets/plan-domaine.jpg app-react/public/assets/
cp assets/plan-domaine-color.jpg app-react/public/assets/
cp assets/domaine_de_la_corbe_all_good_black_andwhite.jpg app-react/public/assets/
```

## Build GitHub Pages
`vite.config.js` gère un `base` compatible Pages via variables d'environnement (`GITHUB_PAGES`, `GITHUB_REPOSITORY`).


## Déploiement GitHub Pages (pas à pas)

### 1) Pré-requis
- Le dépôt doit être sur GitHub.
- La branche de référence est `main` (adapte le workflow si tu utilises une autre branche).
- Les assets binaires doivent être présents localement dans `app-react/public/assets/` avant build.

### 2) Installer le workflow CI/CD
Un workflow prêt est fourni dans :
- `.github/workflows/deploy-app-react-pages.yml`

Il va :
1. installer les dépendances dans `app-react/` (`npm install`),
2. builder avec `GITHUB_PAGES=true` (pour activer le bon `base` Vite),
3. publier `app-react/dist` sur GitHub Pages.

### 3) Activer GitHub Pages dans les settings
Sur GitHub :
- `Settings` → `Pages`
- `Build and deployment` → `Source: GitHub Actions`

### 4) Lancer un premier déploiement
- Push sur `main`, ou lance le workflow manuellement via l’onglet `Actions`.
- URL attendue : `https://<owner>.github.io/<repo>/app-react/`

### 5) Vérification locale avant push
```bash
cd app-react
npm install
npm run build
```
Puis vérifie que le build contient bien les assets nécessaires.

### 6) Dépannage rapide
- **Page blanche / assets 404**: vérifier que l’URL inclut bien `/app-react/`.
- **Workflow échoue sur npm install**: vérifier la présence de `package-lock.json` et la version Node.
- **Images manquantes**: vérifier la copie manuelle dans `app-react/public/assets/`.
