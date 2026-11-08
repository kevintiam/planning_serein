# Contrats HTTP

Toutes les réponses sont JSON. En cas d'échec : `{ "error": "Message" }`.
Les sessions sont transmises automatiquement par cookie HttpOnly.
Les mutations exigent `Origin: APP_URL`, fourni automatiquement par le navigateur.

| Méthode | Route | Accès | Objet / paramètres |
|---|---|---|---|
| POST | `/api/auth/register` | Public avec invitation | name, email, password, invitation |
| POST | `/api/auth/login` | Public | email, password |
| POST | `/api/auth/logout` | Session éventuelle | objet vide |
| GET | `/api/auth/me` | Connecté | aucun |
| GET | `/api/planning` | Connecté | month=YYYY-MM |
| PUT | `/api/declarations` | Participant | month, days: string[], confirm: boolean |
| GET | `/api/available` | Admin | day=YYYY-MM-DD, start=HH:mm, end=HH:mm |
| POST | `/api/tasks` | Admin | participantId, day, start, end, title |
| DELETE | `/api/tasks` | Admin | id |
| POST | `/api/publish` | Admin | month |
| POST | `/api/invitation` | Admin | objet vide |

## Exemple : valider les indisponibilités

```json
{
  "month": "2026-11",
  "days": ["2026-11-02", "2026-11-09"],
  "confirm": true
}
```

L'utilisateur est déduit de la session, pas d'un userId du navigateur.
`days: []` avec `confirm: true` confirme une disponibilité sur tout le mois.
Les années acceptées dans cette version vont de 2000 à 2099.

## Exemple : créer une tâche

```json
{
  "participantId": "UUID_DU_PARTICIPANT",
  "day": "2026-11-10",
  "start": "19:00",
  "end": "21:00",
  "title": "Accueil"
}
```

L'équipe est déduite de la session. Le serveur revérifie la déclaration,
l'absence et les chevauchements dans une transaction avant l'insertion.

## Codes de statut

- 400 : données invalides.
- 401 : session absente ou identifiants incorrects.
- 403 : rôle ou origine refusé.
- 404 : tâche introuvable dans l'équipe.
- 409 : affectation incompatible ou inscription déjà existante.
- 413 : corps de requête trop volumineux.
- 429 : trop de tentatives d'authentification.
- 500 : erreur technique masquée au client.

Le code d'invitation retourné lors d'une rotation doit être copié à ce moment-là.
Il n'est pas récupérable en clair depuis la base.
