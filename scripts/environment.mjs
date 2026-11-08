/** Charge .env.local pour les scripts opérateur Prisma. */
import dotenv from 'dotenv';
import { createPrismaClient } from '../src/server/database.js';
dotenv.config({ path: '.env.local', quiet: true });
export function scriptPrisma() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url || url.includes('YOUR-ENDPOINT'))
    throw new Error('Renseignez une vraie URL Neon dans .env.local.');
  return createPrismaClient(url);
}
