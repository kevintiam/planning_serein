/** Charge .env et fournit un client Prisma aux scripts opérateur (create-admin, reset-password). */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
dotenv.config({ path: '.env', quiet: true });
/**
 * Client Prisma pour les scripts en ligne de commande.
 * Préfère l'URL directe (non poolée) de Neon, conseillée hors de l'application.
 */
export function scriptPrisma() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url || url.includes('YOUR-ENDPOINT')) throw new Error('Renseignez une vraie URL Neon dans .env');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 1 }) });
}
