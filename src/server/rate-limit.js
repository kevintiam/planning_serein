/** Compteurs Prisma atomiques, partagés entre instances et protégés par verrou. */
import { prisma, lockMonth } from './database.js';
import { digest } from './crypto.js';
import { AppError } from './errors.js';
/**
 * Limite le nombre de tentatives (connexion, inscription) par clé, sur 15 minutes.
 * @param key identifiant de l'action, par exemple « login:<ip> »
 * @param maximum nombre de tentatives autorisées dans la fenêtre
 */
export async function limitAttempts(key, maximum = 10, db = prisma) {
  const hash = digest(key);
  const attempts = await db.$transaction(async (tx) => {
    // Réutilise le verrou PostgreSQL pour que deux requêtes simultanées ne se marchent pas dessus.
    await lockMonth(tx, 'rate-limit', hash);
    const row = await tx.rateLimit.findUnique({ where: { key: hash } });
    const now = new Date();
    // Fenêtre expirée ou première tentative : le compteur repart à 1.
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
