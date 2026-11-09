/** Configuration de la CLI Prisma : lit .env, schéma et dossier des migrations, URL directe Neon. */
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';
dotenv.config({ path: '.env', quiet: true });
export default defineConfig({
  schema: 'prisma/schema.prisma',
  // DATABASE_URL_UNPOOLED (connexion directe Neon) est préférée pour les migrations :
  // le pooler de connexions ne supporte pas toutes les opérations de migration.
  migrations: { path: 'prisma/migrations' },
  // Pas de valeur obligatoire pour generate/validate : ces commandes sont hors ligne.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL },
});
