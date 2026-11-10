/**
 * @module lib/prisma
 * @description Instance unique de Prisma Client.
 * Prisma 7 exige un adaptateur : on passe par @prisma/adapter-pg (PostgreSQL / Neon).
 * En développement, l'instance est gardée dans `globalThis` pour survivre au rechargement à chaud.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis;

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // 5 connexions au plus (les tests en mettent 1 avec DATABASE_POOL_MAX=1).
    max: Number(process.env.DATABASE_POOL_MAX) || 5,
    // Neon peut mettre quelques secondes à se réveiller.
    connectionTimeoutMillis: 10_000,
  });
  // Les transactions du planning font plusieurs requêtes : 15 s au lieu de 5 s par défaut.
  return new PrismaClient({ adapter, transactionOptions: { maxWait: 10_000, timeout: 15_000 } });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
