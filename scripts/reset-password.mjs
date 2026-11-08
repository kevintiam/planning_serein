/** Outil opérateur : accès à la base requis ; révoque toutes les sessions du compte. */
import { input, password, confirm } from '@inquirer/prompts';
import { scriptPrisma } from './environment.mjs';
import { emailSchema, passwordSchema } from '../src/domain/validation.js';
import { hashPassword } from '../src/server/crypto.js';
const db = scriptPrisma();
try {
  const email = emailSchema.parse(await input({ message: 'Courriel du compte à réinitialiser :' }));
  const secret = passwordSchema.parse(await password({ message: 'Nouveau mot de passe :', mask: '*' }));
  const repeated = await password({ message: 'Confirmez le mot de passe :', mask: '*' });
  if (secret !== repeated) throw new Error('Les mots de passe ne correspondent pas.');
  if (
    !(await confirm({ message: `Réinitialiser ${email} et fermer toutes ses sessions ?`, default: false }))
  ) {
    throw new Error('Opération annulée.');
  }
  const hash = await hashPassword(secret);
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error('Compte introuvable.');
    await tx.user.update({ where: { id: user.id }, data: { password_hash: hash } });
    await tx.session.deleteMany({ where: { user_id: user.id } });
  });
  console.log('Mot de passe réinitialisé ; sessions révoquées.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
