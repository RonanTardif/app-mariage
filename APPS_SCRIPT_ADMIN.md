# Apps Script pour `/admin`

Le fichier complet prêt à copier/coller est dans :

- `APPS_SCRIPT_COMPLETE.gs`

Il contient déjà :
- `path=data`
- `path=rooms`
- `path=admin` avec `action=get` et `action=upsert`
- JSONP compatible avec le front (`callback=...`)
- fallback + normalisation de l'état admin.

## Pré-requis Google Sheet

Créer les feuilles suivantes :
- `people`
- `groups`
- `slots`
- `rooms`
- `admin_state`

Pour `admin_state` :
- `A1`: `json_state`
- `A2`: JSON complet de l’état admin
