/** Provisionnement explicite : le premier inscrit public ne devient jamais admin. */
import { input, password } from '@inquirer/prompts';
import { z } from 'zod';
import { scriptPrisma } from './environment.mjs';
import { hashPassword, randomToken, digest } from '../src/server/crypto.js';
import { emailSchema, passwordSchema } from '../src/domain/validation.js';
// Usage : npm run admin:create — crée une équipe, son administrateur et le premier code d'invitation.
const db = scriptPrisma();
try {
  const name = z
    .string()
    .trim()
    .min(2)
    .max(100)
    .parse(await input({ message: 'Votre nom :' }));
  const email = emailSchema.parse(await input({ message: 'Courriel administrateur :' }));
  const teamName = z
    .string()
    .trim()
    .min(2)
    .max(100)
    .parse(await input({ message: 'Nom de l’équipe :' }));
  const secret = passwordSchema.parse(
    await password({ message: 'Mot de passe (12 caractères minimum) :', mask: '*' }),
  );
  const repeated = await password({ message: 'Confirmez le mot de passe :', mask: '*' });
  if (secret !== repeated) throw new Error('Les mots de passe ne correspondent pas.');
  // Équipe et admin sont créés dans la même transaction : tout ou rien.
  const passwordHash = await hashPassword(secret);
  const invitation = randomToken();
  await db.$transaction(async (tx) => {
    const team = await tx.team.create({ data: { name: teamName, invite_hash: digest(invitation) } });
    await tx.user.create({
      data: { team_id: team.id, name, email, password_hash: passwordHash, role: 'admin' },
    });
  });
  // Le code n'est affiché qu'ici : seule son empreinte est enregistrée.
  console.log('Équipe et administrateur créés. Code d’invitation à conserver :');
  console.log(invitation);
} catch (error) {
  console.error(error.code === 'P2002' ? 'Ce courriel possède déjà un compte.' : error.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
