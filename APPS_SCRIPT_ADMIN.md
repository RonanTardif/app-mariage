# Apps Script pour `/admin`

Le fichier complet prêt à copier/coller est dans :

- `APPS_SCRIPT_COMPLETE.gs`

Il contient déjà :
- `path=data`
- `path=rooms`
- `path=admin` avec `action=get` et `action=upsert`
- `path=leaderboard` avec `action=list`, `action=submit`, `action=reset`
- JSONP compatible avec le front (`callback=...`)
- fallback + normalisation de l'état admin.

## Pré-requis Google Sheet

Créer les feuilles suivantes :
- `people`
- `groups`
- `slots`
- `rooms`
- `admin_state`
- `leaderboard`

Pour `admin_state` :
- `A1`: `json_state`
- `A2`: JSON complet de l’état admin

Pour `leaderboard` :
- Ligne 1 (header) : `player | score | total | answered | time | created_at`
- Chaque ligne suivante = un résultat de quiz
