/** Outil opérateur : accès à la base requis ; révoque toutes les sessions du compte. */
import { input, password, confirm } from '@inquirer/prompts';
import { scriptPrisma } from './environment.mjs';
import { hashPassword } from '../src/lib/crypto.js';
import { isValidEmail, isValidPassword } from '../src/lib/validation.js';
// Usage : npm run password:reset — change le mot de passe d'un compte.
const db = scriptPrisma();
try {
  const email = (await input({ message: 'Courriel du compte à réinitialiser :' })).trim().toLowerCase();
  if (!isValidEmail(email)) throw new Error('Utilisez un courriel @lacitec.on.ca.');
  const secret = await password({ message: 'Nouveau mot de passe :', mask: '*' });
  if (!isValidPassword(secret)) throw new Error('Utilisez de 12 à 128 caractères.');
  const repeated = await password({ message: 'Confirmez le mot de passe :', mask: '*' });
  if (secret !== repeated) throw new Error('Les mots de passe ne correspondent pas.');
  if (
    !(await confirm({ message: `Réinitialiser ${email} et fermer toutes ses sessions ?`, default: false }))
  ) {
    throw new Error('Opération annulée.');
  }
  const password_hash = await hashPassword(secret);
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error('Compte introuvable.');
    await tx.user.update({ where: { id: user.id }, data: { password_hash } });
    // Déconnecte tous les appareils du compte.
    await tx.session.deleteMany({ where: { user_id: user.id } });
  });
  console.log('Mot de passe réinitialisé ; sessions révoquées.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
