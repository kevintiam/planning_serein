/** Tests purs : jours réels, changement d'année et sélection récurrente. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { monthDays, shiftMonth, toggleWeekday } from '../src/domain/calendar.js';
import { declarationSchema, taskSchema } from '../src/domain/validation.js';
import { hashPassword, verifyPassword } from '../src/server/crypto.js';
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
