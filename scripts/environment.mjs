/** Charge .env et fournit un client Prisma aux scripts opérateur (create-admin, reset-password). */
import dotenv from 'dotenv';
import { createPrismaClient } from '../src/server/database.js';
dotenv.config({ path: '.env', quiet: true });
/**
 * Client Prisma pour les scripts en ligne de commande.
 * Refuse l'URL d'exemple de .env.example pour éviter une erreur de connexion obscure.
 */
export function scriptPrisma() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url || url.includes('YOUR-ENDPOINT')) throw new Error('Renseignez une vraie URL Neon dans .env');
  return createPrismaClient(url);
}
