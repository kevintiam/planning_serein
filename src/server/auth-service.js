/** Authentification Prisma : mots de passe hachés, sessions et rôle imposé. */
import { prisma } from './database.js';
import { AppError } from './errors.js';
import { digest, randomToken, hashPassword, verifyPassword } from './crypto.js';
export function createAuthService(db = prisma) {
  async function createSession(userId, executor = db) {
    const token = randomToken();
    await executor.session.create({
      data: { token_hash: digest(token), user_id: userId, expires_at: new Date(Date.now() + 7 * 86400_000) },
    });
    return token;
  }
  return {
    async register(input) {
      const team = await db.team.findUnique({
        where: { invite_hash: digest(input.invitation) },
        select: { id: true },
      });
      if (!team) throw new AppError('Code d’invitation invalide.', 400);
      const password_hash = await hashPassword(input.password);
      try {
        return await db.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              team_id: team.id,
              name: input.name,
              email: input.email,
              password_hash,
              role: 'participant',
            },
            select: { id: true },
          });
          return createSession(user.id, tx);
        });
      } catch (error) {
        if (error.code === 'P2002')
          throw new AppError('Inscription impossible avec cette adresse. Essayez de vous connecter.', 409);
        throw error;
      }
    },
    async login(input) {
      const user = await db.user.findUnique({
        where: { email: input.email },
        select: { id: true, password_hash: true },
      });
      const encoded = user?.password_hash ?? (await hashPassword(randomToken()));
      if (!(await verifyPassword(input.password, encoded)) || !user)
        throw new AppError('Courriel ou mot de passe incorrect.', 401);
      return createSession(user.id);
    },
    async session(token) {
      if (!token) return null;
      const session = await db.session.findUnique({
        where: { token_hash: digest(token) },
        include: {
          user: {
            select: {
              id: true,
              team_id: true,
              name: true,
              email: true,
              role: true,
              team: { select: { name: true } },
            },
          },
        },
      });
      if (!session || session.expires_at <= new Date()) return null;
      const { team, ...user } = session.user;
      return { ...user, team_name: team.name };
    },
    async logout(token) {
      if (token) await db.session.deleteMany({ where: { token_hash: digest(token) } });
    },
  };
}
export const authService = createAuthService();
