/** Prisma ORM + adaptateur PostgreSQL : seule porte d'entrée runtime vers Neon. */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const globalPrisma = globalThis;
export function createPrismaClient(connectionString, { max = 5 } = {}) {
  if (!connectionString) throw new Error('DATABASE_URL manque dans .env.local.');
  const adapter = new PrismaPg({ connectionString, max, connectionTimeoutMillis: 10_000 });
  return new PrismaClient({ adapter, transactionOptions: { maxWait: 10_000, timeout: 15_000 } });
}
export function getPrisma() {
  // Singleton conservé pendant les rechargements de Next en développement.
  globalPrisma.planningPrisma ??= createPrismaClient(process.env.DATABASE_URL);
  return globalPrisma.planningPrisma;
}
// Proxy paresseux : le build et les pages publiques ne demandent pas de connexion.
export const prisma = new Proxy(
  {},
  {
    get(_target, key) {
      const client = getPrisma();
      const value = client[key];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  },
);
/** Unique SQL brut runtime : verrou PostgreSQL, exécuté via Prisma et paramétré. */
export async function lockMonth(tx, teamId, month) {
  // SELECT externe renvoie un entier, pas le type PostgreSQL void non supporté.
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${`${teamId}:${month}`}, 0))`;
}
