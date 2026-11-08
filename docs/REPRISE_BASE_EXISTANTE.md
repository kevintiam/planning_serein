# Passer du premier ZIP PostgreSQL direct à Prisma

Ce guide concerne uniquement une base déjà initialisée avec le premier ZIP.
Pour une base vide, utilisez simplement `npm run db:migrate`.

## Préserver les données

1. Faites une sauvegarde ou une branche de votre base Neon.
2. Travaillez d'abord sur cette copie, avec ses URL dans `.env.local`.
3. Installez les dépendances : `npm ci`.
4. Vérifiez que les tables correspondent à la migration initiale fournie :
   teams, users, sessions, declarations, absences, tasks, schedules, rate_limits.
5. Si vous n'avez pas modifié le schéma du premier ZIP, marquez cette migration
   comme déjà appliquée (cela ne crée ni ne supprime les tables) :

```bash
npx prisma migrate resolve --applied 20261108000000_init
npm run db:migrate
npm run db:generate
npm run dev
```

La commande `resolve` initialise l'historique `_prisma_migrations` pour Prisma.
Ne l'utilisez pas sur une base vide : les tables ne seraient pas créées.
L'ancienne table `schema_migrations`, utilisée par le premier script, peut rester
présente ; elle n'est plus utilisée par l'application Prisma.

Les noms de tables, colonnes, clés et contraintes métier ont été conservés.
Les condensats de mots de passe scrypt restent compatibles ; aucun compte n'est
recréé automatiquement. Ne relancez pas `admin:create` pour un admin existant.

## Si vous avez modifié le schéma

Ne marquez pas automatiquement la migration comme appliquée. Comparez votre base
et le schéma Prisma sur une copie ; adaptez les modèles et établissez une migration
de référence correspondant à vos tables réelles selon le guide Prisma « Baselining ».
Ne lancez pas `migrate reset` ni `db push --accept-data-loss` sur vos données.

Les contraintes CHECK (rôle, mois, ordre des horaires) sont conservées dans le SQL.
Prisma Schema ne représente pas ces CHECK ; ne les retirez pas lors d'une future
modification de migration. Une migration déjà appliquée ne doit plus être éditée.

La reprise réelle de votre projet Neon n'a pas été exécutée : vos URL ne sont pas
présentes dans cette livraison. Testez inscription, connexion, calendrier et
publication sur la copie avant de basculer votre environnement de production.
