/** Authentification Prisma : mots de passe hachés, sessions et rôle imposé. */
import { prisma } from './database.js';
import { AppError } from './errors.js';
import { digest, randomToken, hashPassword, verifyPassword, needsRehash } from './crypto.js';
// Hachage factice pour les courriels inconnus : calculé une seule fois, au premier besoin.
let dummyHash;
const getDummyHash = () => (dummyHash ??= hashPassword(randomToken()));
/** Fabrique du service : `db` est injectable pour que les tests utilisent une base temporaire. */
export function createAuthService(db = prisma) {
  /**
   * Crée une session de 7 jours. Le jeton en clair part dans le cookie ;
   * seule son empreinte SHA-256 est stockée en base.
   */
  async function createSession(userId, executor = db) {
    const token = randomToken();
    await executor.session.create({
      data: { token_hash: digest(token), user_id: userId, expires_at: new Date(Date.now() + 7 * 86400_000) },
    });
    return token;
  }
  return {
    /** Inscription d'un participant : le code d'invitation désigne l'équipe à rejoindre. */
    async register(input) {
      // On compare des empreintes : le code d'invitation n'est jamais stocké en clair.
      const team = await db.team.findUnique({
        where: { invite_hash: digest(input.invitation) },
        select: { id: true },
      });
      if (!team) throw new AppError('Code d’invitation invalide.', 400);
      const password_hash = await hashPassword(input.password);
      try {
        // Compte et session sont créés ensemble : si l’un échoue, rien n’est enregistré.
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
        // P2002 = contrainte d'unicité Prisma : ce courriel existe déjà.
        // Le message reste vague pour ne pas révéler quels courriels sont inscrits.
        if (error.code === 'P2002')
          throw new AppError('Inscription impossible avec cette adresse. Essayez de vous connecter.', 409);
        throw error;
      }
    },
    /** Connexion par courriel et mot de passe ; renvoie un nouveau jeton de session. */
    async login(input) {
      const user = await db.user.findUnique({
        where: { email: input.email },
        select: { id: true, password_hash: true },
      });
      // Si le courriel est inconnu, on vérifie quand même contre un hachage factice :
      // une seule vérification bcrypt dans les deux cas, donc le même temps de réponse,
      // ce qui empêche de deviner quels courriels ont un compte.
      const encoded = user?.password_hash ?? (await getDummyHash());
      if (!(await verifyPassword(input.password, encoded)) || !user)
        throw new AppError('Courriel ou mot de passe incorrect.', 401);
      // Migration en douceur : un ancien hachage scrypt (ou un coût bcrypt dépassé)
      // est remplacé par un hachage bcrypt à jour, maintenant qu'on connaît le mot de passe.
      if (needsRehash(user.password_hash)) {
        await db.user.update({
          where: { id: user.id },
          data: { password_hash: await hashPassword(input.password) },
        });
      }
      return createSession(user.id);
    },
    /** Retrouve l'utilisateur lié à un jeton de cookie, ou null si absent ou expiré. */
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
      // Aplatit la réponse : { ...utilisateur, team_name } est plus simple à utiliser côté vues.
      const { team, ...user } = session.user;
      return { ...user, team_name: team.name };
    },
    /** Supprime la session en base : le cookie devient inutilisable immédiatement. */
    async logout(token) {
      if (token) await db.session.deleteMany({ where: { token_hash: digest(token) } });
    },
  };
}
/** Instance unique utilisée par l'application (branchée sur la vraie base). */
export const authService = createAuthService();
