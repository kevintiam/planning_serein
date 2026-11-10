/** Provisionnement explicite : le premier inscrit public ne devient jamais admin. */
import { input, password } from '@inquirer/prompts';
import { scriptPrisma } from './environment.mjs';
import { hashPassword, randomToken, sha256 } from '../src/lib/crypto.js';
import { isValidEmail, isValidPassword, isValidText } from '../src/lib/validation.js';
// Usage : npm run admin:create — crée une équipe, son administrateur et le premier code d'invitation.
const db = scriptPrisma();
try {
  const name = (await input({ message: 'Votre nom :' })).trim();
  if (!isValidText(name, 2, 100)) throw new Error('Le nom doit contenir de 2 à 100 caractères.');
  const email = (await input({ message: 'Courriel administrateur (@lacitec.on.ca) :' })).trim().toLowerCase();
  if (!isValidEmail(email)) throw new Error('Utilisez un courriel @lacitec.on.ca.');
  const teamName = (await input({ message: 'Nom de l’équipe :' })).trim();
  if (!isValidText(teamName, 2, 100)) throw new Error('Le nom d’équipe doit contenir de 2 à 100 caractères.');
  const secret = await password({ message: 'Mot de passe (12 caractères minimum) :', mask: '*' });
  if (!isValidPassword(secret)) throw new Error('Utilisez de 12 à 128 caractères.');
  const repeated = await password({ message: 'Confirmez le mot de passe :', mask: '*' });
  if (secret !== repeated) throw new Error('Les mots de passe ne correspondent pas.');
  // Équipe et admin sont créés dans la même transaction : tout ou rien.
  const password_hash = await hashPassword(secret);
  const invitation = randomToken();
  await db.$transaction(async (tx) => {
    const team = await tx.team.create({ data: { name: teamName, invite_hash: sha256(invitation) } });
    await tx.user.create({ data: { team_id: team.id, name, email, password_hash, role: 'admin' } });
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
