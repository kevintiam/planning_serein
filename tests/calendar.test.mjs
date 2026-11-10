/** Tests purs : calendrier, validateurs et hachage des mots de passe. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyAvailability, monthDays, shiftMonth, toggleWeekday } from '../src/domain/calendar.js';
import { isValidDate, isValidMonth, isValidTime, isValidEmail, isValidUuid } from '../src/lib/validation.js';
import { hashPassword, verifyPassword } from '../src/lib/crypto.js';

test('Calendrier bissextile et passage en janvier', () => {
  assert.equal(monthDays('2028-02').length, 29);
  assert.equal(monthDays('2027-02').length, 28);
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  const mondays = toggleWeekday('2026-11', [], 1);
  assert.deepEqual(mondays, ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']);
  assert.deepEqual(toggleWeekday('2026-11', mondays, 1), []);
});

test('Validateurs : dates inexistantes, mois, heures, courriels et UUID', () => {
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2028-02-29'), true);
  assert.equal(isValidMonth('2026-13'), false);
  assert.equal(isValidMonth('2026-02'), true);
  assert.equal(isValidTime('24:00'), false);
  assert.equal(isValidTime('19:30'), true);
  assert.equal(isValidEmail('kevin@lacitec.on.ca'), true);
  assert.equal(isValidEmail('kevin@gmail.com'), true);
  assert.equal(isValidEmail('pas-un-courriel'), false);
  assert.equal(isValidUuid(crypto.randomUUID()), true);
  assert.equal(isValidUuid('pas-un-uuid'), false);
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

test('bcrypt : format, sel et phrases longues', async () => {
  const hash = await hashPassword('une phrase de passe de test');
  assert.match(hash, /^\$2[aby]\$12\$/);
  assert.ok(!hash.includes('une phrase'));
  assert.equal(await verifyPassword('une phrase de passe de test', hash), true);
  assert.equal(await verifyPassword('autre phrase de passe', hash), false);
  // Au-delà de 72 octets, bcrypt seul tronquerait : le pré-hachage SHA-256 garde toute la phrase.
  const long = 'é'.repeat(40);
  const longHash = await hashPassword(long + 'A');
  assert.equal(await verifyPassword(long + 'A', longHash), true);
  assert.equal(await verifyPassword(long + 'B', longHash), false);
});
