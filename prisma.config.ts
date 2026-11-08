/** Prisma CLI charge .env.local comme Next ; migrations sur l'URL directe Neon. */
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';
dotenv.config({ path: '.env.local', quiet: true });
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Pas de valeur obligatoire pour generate/validate : ces commandes sont hors ligne.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL },
});
