/** Compteurs Prisma atomiques, partagés entre instances et protégés par verrou. */
import { prisma, lockMonth } from './database.js';
import { digest } from './crypto.js';
import { AppError } from './errors.js';
export async function limitAttempts(key, maximum = 10, db = prisma) {
  const hash = digest(key);
  const attempts = await db.$transaction(async (tx) => {
    await lockMonth(tx, 'rate-limit', hash);
    const row = await tx.rateLimit.findUnique({ where: { key: hash } });
    const now = new Date();
    const expired = !row || row.reset_at <= now;
    const data = {
      attempts: expired ? 1 : row.attempts + 1,
      reset_at: expired ? new Date(now.getTime() + 15 * 60_000) : row.reset_at,
    };
    await tx.rateLimit.upsert({ where: { key: hash }, create: { key: hash, ...data }, update: data });
    return data.attempts;
  });
  // Rejeter après commit pour conserver le compteur de la tentative refusée.
  if (attempts > maximum) throw new AppError('Trop de tentatives. Réessayez dans 15 minutes.', 429);
}
