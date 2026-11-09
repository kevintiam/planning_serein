/** Tests purs : jours réels, changement d'année et sélection récurrente. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyAvailability, monthDays, shiftMonth, toggleWeekday } from '../src/domain/calendar.js';
import { declarationSchema, taskSchema } from '../src/domain/validation.js';
import { hashPassword, verifyPassword, needsRehash } from '../src/server/crypto.js';
import { scryptSync } from 'node:crypto';
test('Calendrier bissextile et passage en janvier', () => {
  assert.equal(monthDays('2028-02').length, 29);
  assert.equal(monthDays('2027-02').length, 28);
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  const mondays = toggleWeekday('2026-11', [], 1);
  assert.deepEqual(mondays, ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']);
  assert.deepEqual(toggleWeekday('2026-11', mondays, 1), []);
});
test('Validation des dates inexistantes, du mois et des heures', () => {
  assert.equal(
    declarationSchema.safeParse({ month: '2026-02', days: ['2026-02-30'], confirm: true }).success,
    false,
  );
  assert.equal(
    declarationSchema.safeParse({ month: '2026-02', days: ['2026-03-01'], confirm: true }).success,
    false,
  );
  assert.equal(declarationSchema.safeParse({ month: '2026-02', days: [], confirm: true }).success, true);
  assert.equal(
    taskSchema.safeParse({
      participantId: crypto.randomUUID(),
      day: '2026-11-09',
      start: '21:00',
      end: '19:00',
      title: 'Accueil',
    }).success,
    false,
  );
});
test('Le mot de passe est salé et vérifié correctement', async () => {
  const hash = await hashPassword('une phrase de passe de test');
  assert.ok(!hash.includes('une phrase'));
  assert.equal(await verifyPassword('une phrase de passe de test', hash), true);
  assert.equal(await verifyPassword('autre phrase de passe', hash), false);
});
test('Disponibilités par jour : déclaration validée et absences', () => {
  const members = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const declarations = [
    { user_id: 'a', confirmed_at: '2026-11-01' },
    { user_id: 'b', confirmed_at: '2026-11-01' },
    { user_id: 'c', confirmed_at: null },
  ];
  const absences = [{ user_id: 'a', day: '2026-11-04' }];
  const counts = dailyAvailability('2026-11', members, declarations, absences);
  assert.equal(counts['2026-11-03'], 2);
  assert.equal(counts['2026-11-04'], 1);
  assert.equal(Object.keys(counts).length, 30);
});
/** Fabrique un hachage au format d'avant bcrypt, comme ceux déjà présents en base. */
function legacyScrypt(password) {
  const salt = 'abcd'.repeat(8);
  const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
  return `scrypt$${salt}$${scryptSync(password, salt, 64, options).toString('hex')}`;
}
test('bcrypt : format, phrases longues et anciens hachages scrypt', async () => {
  const hash = await hashPassword('une phrase de passe de test');
  assert.match(hash, /^\$2[aby]\$12\$/);
  assert.equal(needsRehash(hash), false);
  // Au-delà de 72 octets, bcrypt seul tronquerait : le pré-hachage SHA-256 garde toute la phrase.
  const long = 'é'.repeat(40);
  const longHash = await hashPassword(long + 'A');
  assert.equal(await verifyPassword(long + 'A', longHash), true);
  assert.equal(await verifyPassword(long + 'B', longHash), false);
  // Ancien format scrypt : toujours vérifiable, et signalé pour conversion.
  const legacy = legacyScrypt('ancien mot de passe');
  assert.equal(await verifyPassword('ancien mot de passe', legacy), true);
  assert.equal(await verifyPassword('mauvais mot de passe', legacy), false);
  assert.equal(needsRehash(legacy), true);
  assert.equal(await verifyPassword('x', 'format-inconnu'), false);
});
