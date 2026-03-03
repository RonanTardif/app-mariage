# Apps Script requis pour `/admin`

Oui : pour que la page admin fonctionne en **mode réel** (lecture au chargement + écriture en temps réel), votre Apps Script doit exposer un endpoint `path=admin`.

## Contrat attendu par le front

- Lecture initiale:
  - `GET ...?path=admin&action=get&callback=...`
  - Réponse JSONP contenant un objet `state` (ou directement l'objet d'état).
- Écriture:
  - `GET ...?path=admin&action=upsert&state=<json-encodé>&callback=...`
  - Réponse JSONP sans `error` en cas de succès.

État attendu:

```json
{
  "delayMinutes": 8,
  "photoStart": "2026-06-20T16:00",
  "groupIntervalMinutes": 12,
  "groups": [
    { "name": "Famille mariée", "done": false }
  ]
}
```

## Exemple minimal à ajouter dans `doGet(e)`

```javascript
if (path === "admin") {
  const action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : "get";
  const sh = ss.getSheetByName("admin_state");
  if (!sh) throw new Error("Missing sheet: admin_state");

  if (action === "get") {
    const raw = String(sh.getRange("A2").getValue() || "").trim();
    const state = raw ? JSON.parse(raw) : {
      delayMinutes: 8,
      photoStart: "2026-06-20T16:00",
      groupIntervalMinutes: 12,
      groups: []
    };
    return respond_(e, { state, updated_at: new Date().toISOString() });
  }

  if (action === "upsert") {
    const rawState = (e && e.parameter && e.parameter.state) ? String(e.parameter.state) : "";
    if (!rawState) return respond_(e, { error: "Missing state" });

    const state = JSON.parse(rawState);
    sh.getRange("A2").setValue(JSON.stringify(state));

    return respond_(e, { ok: true, updated_at: new Date().toISOString() });
  }

  return respond_(e, { error: "Unknown action for path=admin" });
}
```

## Structure sheet suggérée

Créer une feuille `admin_state`:
- `A1`: `json_state`
- `A2`: contenu JSON complet de l'état admin

> C'est le plus simple pour démarrer. Ensuite, vous pourrez normaliser en colonnes si nécessaire.
