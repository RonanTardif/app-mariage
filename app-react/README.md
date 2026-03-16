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
