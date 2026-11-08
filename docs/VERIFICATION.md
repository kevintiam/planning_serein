# Vérifications de la version Prisma

- `npm run db:generate` : client Prisma 7.10.1 généré.
- `npm run db:validate` : schéma Prisma valide.
- `npm run check` : 58 fichiers contrôlés, commentés, de 300 lignes maximum.
- `npm test` : 4 tests réussis ; le scénario d’intégration comporte de nombreuses assertions.
- `npm run test:migrations` : migration initiale appliquée via la CLI Prisma,
  second passage idempotent, comparaison sans différence entre base et schéma.
- `npm run build` : génération du client et compilation Next.js réussies.
- `npm run test:http` : pages publiques, redirections, protection de session,
  origine des requêtes et validation HTTP vérifiées.

L’intégration utilise le véritable Prisma Client et l’adaptateur PostgreSQL,
connectés à PGlite via un serveur socket local. Les appels ORM ne sont pas simulés.
Les données de test sont fictives et les bases jetables.

Couverture : comptes, sessions, rôle imposé, isolation des équipes, déclarations,
absences, chevauchements, publication, changement d’invitation et limite de tentatives.
La concurrence multi-connexions réelle sur Neon n’a pas été simulée.

Aucune connexion à votre projet Neon n’a été effectuée : fournissez ses URL dans
.env.local et vérifiez le parcours complet sur votre environnement.
Les fichiers générés, dont package-lock.json et Prisma Client, sont exclus de la
limite de 300 lignes. node_modules et .next ne sont pas inclus dans le ZIP.
