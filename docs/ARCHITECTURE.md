# Architecture et règles à conserver

## Répartition des responsabilités

| Couche | Responsabilité | Interdit |
|---|---|---|
| `components/*.jsx` | Rendu, champs, interactions visuelles | SQL, fetch, import src/api |
| `hooks/*.js` | État React, chargement, validation de parcours | SQL, fetch direct |
| `api/*.js` | Requêtes HTTP et décodage des erreurs | JSX, accès base |
| `app/api/*/route.js` | Authentification, validation des entrées | Règles métier volumineuses |
| `server/*-service.js` | Règles métier et requêtes Prisma | Interface React |
| `domain/*.js` | Calculs purs, schémas Zod | Cookies, accès réseau |

`useWorkspace` compose `usePlanning` et `useDeclaration`.
`useTaskForm` recharge les personnes éligibles quand la date ou l'horaire change.
Un AbortController annule les réponses devenues inutiles.
`src/api/client.js` est l'unique fonction utilisant fetch côté navigateur.

## Modèle de données

- `teams` : nom et condensat du code d'invitation.
- `users` : équipe, identité, mot de passe haché et rôle.
- `sessions` : condensats des jetons, expiration, utilisateur.
- `declarations` : une ligne par participant et mois ; validation facultative.
- `absences` : une ligne par participant et journée indisponible.
- `tasks` : date, début, fin, activité et participant.
- `schedules` : état de publication de chaque mois d'équipe.
- `rate_limits` : compteurs d'authentification partagés entre instances.
- `_prisma_migrations` : historique interne de Prisma Migrate.

Les clés étrangères `(user_id, team_id)` empêchent l'association d'une absence
à la mauvaise équipe. L'affectation vérifie aussi le rôle participant.
Les requêtes passent par Prisma ; le verrou SQL utilise un template paramétré Prisma.

## Authentification et autorisations

- Inscription publique avec code d'équipe à forte entropie.
- Le rôle créé par le serveur est toujours `participant`.
- Les administrateurs sont créés uniquement via le script opérateur.
- Mot de passe : scrypt, sel aléatoire, comparaison à temps constant.
- Session : jeton aléatoire de 32 octets, seul son SHA-256 est stocké en base.
- Cookie HttpOnly, SameSite=Lax, Secure en production, durée 7 jours.
- Les mutations HTTP exigent un en-tête Origin égal à APP_URL.
- Les pages et chaque route administrative vérifient le rôle serveur.
- Les listes participant ne contiennent ni les courriels ni les absences des autres.
- Une réinitialisation de mot de passe révoque toutes les sessions du compte.

La connexion limite les tentatives par courriel en base, sur 15 minutes.
La création limite les tentatives par courriel et par code d'invitation.
Le code doit être transmis à des personnes autorisées ; il n'expire pas mais peut
être remplacé. Sa rotation n'affecte pas les membres déjà inscrits.

## Disponibilité et concurrence

Disponible = participant de l'équipe + mois validé + absence inexistante ce jour
+ aucune tâche chevauchant les horaires demandés.
Deux tâches adjacentes (19h–20h et 20h–21h) sont autorisées.

La création de tâche refait la vérification serveur, même après affichage de la
liste. Une requête manipulée ne peut contourner cette règle.
Toutes les mutations de planning et de disponibilité prennent le même verrou
transactionnel PostgreSQL `teamId:month`. Ce verrou utilise
`pg_advisory_xact_lock` et est compatible avec le pool Neon en mode transaction.
Une erreur annule toute la transaction.

Un brouillon ne rend personne disponible. Confirmer un mois sans aucune absence
signifie « disponible tous les jours de ce mois ».
Modifier une déclaration remet la publication en brouillon, et l'admin doit
résoudre les tâches désormais incompatibles avant de publier à nouveau.

## Faire évoluer le schéma avec Prisma

Modifiez `prisma/schema.prisma`, puis sur une base de développement :

```bash
npm run db:dev -- --name description_modification
npm run db:generate
```

Inspectez le SQL généré et conservez les migrations dans le dépôt. En production,
utilisez uniquement `npm run db:migrate` (Prisma migrate deploy).
Pour une base existant avant Prisma, suivez `REPRISE_BASE_EXISTANTE.md`.
Ne modifiez pas une migration déjà appliquée.
