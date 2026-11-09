/** Tests Prisma réels via adaptateur pg et PostgreSQL embarqué en socket locale. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { createPrismaClient } from '../src/server/database.js';
import { limitAttempts } from '../src/server/rate-limit.js';
import { PGlite } from '@electric-sql/pglite';
import { randomUUID, scryptSync } from 'node:crypto';
import { createPlanningService } from '../src/server/planning-service.js';
import { createAuthService } from '../src/server/auth-service.js';
import { digest } from '../src/server/crypto.js';
test('Inscription, rôles, équipes, validation et affectations', async () => {
  // Base PostgreSQL jetable en mémoire : les tests ne touchent jamais à Neon.
  const pg = new PGlite();
  const server = new PGLiteSocketServer({ db: pg, port: 0, host: '127.0.0.1' });
  let db;
  try {
    // Applique la vraie migration SQL du projet.
    await pg.exec(await readFile('prisma/migrations/20261108000000_init/migration.sql', 'utf8'));
    await server.start();
    db = createPrismaClient(
      `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`,
      { max: 1 },
    );
    // Services branchés sur la base de test grâce à l’injection de `db`.
    const planning = createPlanningService(db);
    const auth = createAuthService(db);
    const team = randomUUID(),
      otherTeam = randomUUID();
    const invitation = 'test-invitation-code-long-enough';
    await db.team.create({ data: { id: team, name: 'Équipe A', invite_hash: digest(invitation) } });
    await db.team.create({ data: { id: otherTeam, name: 'Équipe B', invite_hash: digest('other') } });
    // Limitation : la 2e tentative dépasse le maximum de 1 et doit être refusée (429).
    await limitAttempts('login:test', 1, db);
    await assert.rejects(limitAttempts('login:test', 1, db), { status: 429 });
    const admin = { id: randomUUID(), team_id: team, role: 'admin' };
    // Même si on envoie role: 'admin', une inscription publique crée toujours un participant.
    const aliceToken = await auth.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'alice-password-test',
      invitation,
      role: 'admin',
    });
    const alice = await auth.session(aliceToken);
    const bobToken = await auth.register({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'bob-password-test',
      invitation,
    });
    const bob = await auth.session(bobToken);
    assert.equal(alice.role, 'participant');
    assert.equal(await auth.session('bad-token'), null);
    await assert.rejects(auth.login({ email: 'alice@example.com', password: 'wrong-password' }), {
      status: 401,
    });
    const loginToken = await auth.login({ email: 'alice@example.com', password: 'alice-password-test' });
    assert.equal((await auth.session(loginToken)).id, alice.id);
    await auth.logout(loginToken);
    assert.equal(await auth.session(loginToken), null);
    // Un compte créé avant bcrypt (hachage scrypt) se connecte, puis est converti en bcrypt.
    const salt = 'ef01'.repeat(8);
    const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
    const legacy = `scrypt$${salt}$${scryptSync('alice-password-test', salt, 64, scryptOptions).toString('hex')}`;
    await db.user.update({ where: { id: alice.id }, data: { password_hash: legacy } });
    await auth.login({ email: 'alice@example.com', password: 'alice-password-test' });
    const converted = await db.user.findUnique({ where: { id: alice.id }, select: { password_hash: true } });
    assert.match(converted.password_hash, /^\$2[aby]\$12\$/);
    await auth.login({ email: 'alice@example.com', password: 'alice-password-test' });
    await assert.rejects(auth.login({ email: 'inconnu@example.com', password: 'nimporte-quoi-123' }), {
      status: 401,
    });
    const slot = {
      day: '2026-11-09',
      start: '19:00',
      end: '21:00',
      participantId: alice.id,
      title: 'Accueil',
    };
    assert.deepEqual(await planning.available(admin, slot), []);
    await assert.rejects(planning.available(alice, slot), { status: 403 });
    assert.deepEqual(await planning.availabilitySummary(admin, slot), {
      total: 2,
      notValidated: 2,
      absent: 0,
      busy: 0,
    });
    await assert.rejects(planning.availabilitySummary(alice, slot), { status: 403 });
    await planning.saveDeclaration(alice, { month: '2026-11', days: ['2026-11-09'], confirm: false });
    assert.deepEqual(await planning.available(admin, slot), []);
    await planning.saveDeclaration(alice, { month: '2026-11', days: ['2026-11-09'], confirm: true });
    await planning.saveDeclaration(bob, { month: '2026-11', days: [], confirm: true });
    assert.deepEqual(
      (await planning.available(admin, slot)).map((u) => u.name),
      ['Bob'],
    );
    assert.equal((await planning.available(admin, { ...slot, day: '2026-11-10' })).length, 2);
    assert.deepEqual(await planning.availabilitySummary(admin, slot), {
      total: 2,
      notValidated: 0,
      absent: 1,
      busy: 0,
    });
    await assert.rejects(planning.createTask(admin, slot), { status: 409 });
    await assert.rejects(planning.createTask(alice, { ...slot, participantId: bob.id }), { status: 403 });
    const task = await planning.createTask(admin, { ...slot, participantId: bob.id });
    await assert.rejects(planning.createTask(admin, { ...slot, participantId: bob.id }), { status: 409 });
    assert.deepEqual(await planning.availabilitySummary(admin, slot), {
      total: 2,
      notValidated: 0,
      absent: 1,
      busy: 1,
    });
    assert.deepEqual(await planning.available(admin, slot), []);
    assert.equal((await planning.available(admin, { ...slot, start: '21:00', end: '22:00' })).length, 1);
    assert.equal((await planning.overview(bob, '2026-11')).tasks.length, 0);
    await planning.publish(admin, '2026-11');
    assert.equal((await planning.overview(bob, '2026-11')).tasks.length, 1);
    assert.equal((await planning.overview(alice, '2026-11')).tasks.length, 0);
    assert.deepEqual((await planning.overview({ ...admin, team_id: otherTeam }, '2026-11')).members, []);
    await assert.rejects(planning.deleteTask({ ...admin, team_id: otherTeam }, task.id), { status: 404 });
    await planning.saveDeclaration(bob, { month: '2026-11', days: ['2026-11-09'], confirm: true });
    assert.equal((await planning.overview(admin, '2026-11')).published, false);
    await assert.rejects(planning.publish(admin, '2026-11'), { status: 409 });
    await planning.deleteTask(admin, task.id);
    assert.equal((await planning.overview(admin, '2026-11')).tasks.length, 0);
    const rotated = await planning.rotateInvitation(admin);
    await assert.rejects(
      auth.register({ name: 'Old', email: 'old@example.com', password: 'old-password-test', invitation }),
      { status: 400 },
    );
    const newToken = await auth.register({
      name: 'New',
      email: 'new@example.com',
      password: 'new-password-test',
      invitation: rotated.invitation,
    });
    assert.equal((await auth.session(newToken)).team_id, team);
  } finally {
    if (db) await db.$disconnect();
    await server.stop();
    await pg.close();
  }
});
