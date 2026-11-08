# Planning Serein — Next.js + Prisma + Neon

Projet JavaScript/JSX autonome : inscription, connexion, espaces administrateur et
participant, indisponibilités mensuelles et attribution des tâches.
**Prisma ORM gère désormais les accès à la base Neon/PostgreSQL.**

## Première installation sur une base vide

Prérequis : Node.js 22.13+ (Node 24 conseillé), npm et un projet Neon.
Décompressez le ZIP et ouvrez le dossier dans VS Code.

1. Copiez `.env.example` vers `.env.local`.
   - Windows : `Copy-Item .env.example .env.local`
   - macOS/Linux : `cp .env.example .env.local`
2. Dans Neon > Connect, renseignez :
   - `DATABASE_URL` : URL poolée, utilisée par Prisma Client dans l'application.
   - `DATABASE_URL_UNPOOLED` : URL directe, utilisée par Prisma Migrate.
   - `APP_URL=http://localhost:3000` pour le développement.
3. Lancez :

```bash
npm ci
npm run db:migrate
npm run admin:create
npm run dev
```

`npm ci` génère automatiquement Prisma Client grâce au script `postinstall`.
`admin:create` demande votre nom, courriel, mot de passe masqué et nom d'équipe,
puis affiche le code d'invitation pour les participants.
Ouvrez http://localhost:3000. Aucun compte ChatGPT n'est nécessaire.

**Si votre base contient déjà les données du premier ZIP, lisez d'abord
`docs/REPRISE_BASE_EXISTANTE.md`. N'appliquez pas la migration initiale dessus
comme s'il s'agissait d'une base vide.**

## Architecture conservée

| Dossier | Rôle |
|---|---|
| `src/components` | Composants JSX sans fetch ni appels directs aux API |
| `src/hooks` | État React et fonctions appelant les fonctions réseau |
| `src/api` | Fonctions HTTP côté navigateur ; fetch uniquement dans client.js |
| `src/app/api` | Routes serveur Next.js : session, validation et délégation |
| `src/server` | Services métier utilisant Prisma Client |
| `src/domain` | Calculs du calendrier et validation Zod |
| `prisma` | schema.prisma et migrations SQL versionnées |
| `scripts` | Initialisation administrateur, mot de passe et contrôles |
| `tests` | Tests unitaires et intégration Prisma/PostgreSQL |
| `docs` | Guides installation, architecture, API et reprise des données |

Flux : **JSX → hook → src/api → route Next → service → Prisma → Neon**.
Tous les fichiers sources sont commentés et limités à 300 lignes.
Les fichiers générés (package-lock.json et Prisma Client) sont exclus de cette
limite ; les JSON ne contiennent pas de commentaires non valides.

## Fichiers Prisma à connaître

- `prisma/schema.prisma` : modèles Team, User, Session, Declaration, Absence,
  Task, Schedule et RateLimit, avec relations et clés composées.
- `prisma.config.ts` : configuration de la CLI et chargement de `.env.local`.
- `src/server/database.js` : singleton Prisma Client et adaptateur PostgreSQL.
- `prisma/migrations/20261108000000_init/migration.sql` : tables et contraintes.

Les opérations métier utilisent `findMany`, `findUnique`, `create`, `update`,
`upsert`, `deleteMany` et `$transaction`. Il n'y a plus de requêtes `pg.query`
dans les services ou les scripts opérateur.
Le pilote `pg` reste une dépendance technique de `@prisma/adapter-pg`.
Une seule requête SQL brute paramétrée, exécutée par Prisma, acquiert le verrou
transactionnel PostgreSQL qui protège les affectations concurrentes.

## Commandes

| Commande | Utilité |
|---|---|
| `npm ci` | Installer les versions verrouillées et générer Prisma Client |
| `npm run db:generate` | Régénérer le client après modification du schéma |
| `npm run db:validate` | Valider le schéma Prisma hors ligne |
| `npm run db:migrate` | Appliquer les migrations avec prisma migrate deploy |
| `npm run db:dev -- --name nom_modification` | Créer/appliquer une migration en développement |
| `npm run db:studio` | Ouvrir Prisma Studio pour inspecter les données |
| `npm run admin:create` | Créer l'admin et son équipe via Prisma |
| `npm run password:reset` | Réinitialiser un mot de passe et révoquer ses sessions |
| `npm run dev` | Démarrer Next.js en développement |
| `npm run build` | Générer le client et compiler Next.js |
| `npm start` | Serveur de production à servir derrière HTTPS |
| `npm run check` | Vérifier commentaires, taille et séparation des couches |
| `npm test` | Tests du calendrier et des services via Prisma |
| `npm run test:migrations` | Tester les migrations Prisma sur une base jetable |
| `npm run test:http` | Contrôles HTTP après compilation |
| `npm run format` | Formater les sources JavaScript/JSX |

`db:dev` s'utilise sur une base de développement, jamais sur la production.
Il peut nécessiter une base « shadow » ; consultez la documentation Prisma pour
configurer un rôle ou une base de développement adaptés.

## Parcours de l'application

Le participant s'inscrit avec le code d'équipe et un mot de passe d'au moins
12 caractères. Il est redirigé vers son interface et déclare les jours où il
n'est pas disponible, individuellement ou par jour de semaine. Il peut enregistrer
un brouillon puis valider le mois.

L'admin voit les membres et leurs déclarations. En choisissant une date et un
horaire, il voit uniquement les personnes ayant validé le mois, sans absence
ce jour-là et sans tâche qui chevauche le créneau. La vérification est refaite
côté serveur au moment de l'enregistrement.

Une modification de déclaration remet le planning en brouillon. L'admin résout
les conflits puis publie le mois. Les participants voient uniquement leurs tâches
publiées. Une date non cochée n'est pas disponible avant validation du mois.

## Personnalisation et limites

- Styles : `src/app/globals.css` ; titre : `src/app/layout.jsx`.
- Interface : `src/components/Workspace.jsx`.
- Règles métier : `src/server/planning-service.js` et `planning-queries.js`.
- Schéma : `prisma/schema.prisma`.

Les URL Neon réelles restent à fournir : aucune base distante n'est créée ni
connectée automatiquement par la livraison. Les tests utilisent Prisma Client
avec un PostgreSQL embarqué local ; votre connexion Neon doit être vérifiée après
configuration. Les anciennes données du site ChatGPT ne sont pas importées.

Les absences couvrent une journée entière ; les tâches ne traversent pas minuit.
Un compte appartient à une équipe. Aucun email automatique ni vérification de
courriel n'est configuré. La récupération de mot de passe utilise le script
opérateur fourni. L'inscription passe par un code d'invitation renouvelable.

## Références

- https://www.prisma.io/docs/orm/v7
- https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
- https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining
- https://nextjs.org/docs/app
- https://neon.com/docs/connect/connect-from-any-app
