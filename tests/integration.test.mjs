/**
 * Tests d'intégration des vraies routes API sur un PostgreSQL embarqué (PGlite) :
 * les tests ne touchent jamais à Neon. Lancer avec : npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { NextRequest } from 'next/server';
import { sha256 } from '../src/lib/crypto.js';

/**
 * Appelle une route comme le ferait le navigateur.
 * @returns {{ status: number, data: Object, token?: string }} token = nouveau cookie de session
 */
async function call(handler, { method = 'GET', url = '/api', body, token } = {}) {
  const request = new NextRequest('http://localhost' + url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { cookie: `planning_session=${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const response = await handler(request);
  return {
    status: response.status,
    data: await response.json(),
    token: response.cookies.get('planning_session')?.value,
  };
}

test('Inscription, connexion, rôles, déclarations, tâches et publication', async () => {
  const pg = new PGlite();
  const server = new PGLiteSocketServer({ db: pg, port: 0, host: '127.0.0.1' });
  let prisma;
  try {
    // Applique la vraie migration SQL du projet, puis branche lib/prisma.js sur cette base.
    await pg.exec(await readFile('prisma/migrations/20261108000000_init/migration.sql', 'utf8'));
    await server.start();
    process.env.DATABASE_URL = `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`;
    process.env.DATABASE_POOL_MAX = '1';

    // Import après la configuration : lib/prisma.js lit DATABASE_URL au chargement.
    ({ prisma } = await import('../src/lib/prisma.js'));
    const register = (await import('../src/app/api/auth/register/route.js')).POST;
    const login = (await import('../src/app/api/auth/login/route.js')).POST;
    const logout = (await import('../src/app/api/auth/logout/route.js')).POST;
    const me = (await import('../src/app/api/auth/me/route.js')).GET;
    const planning = (await import('../src/app/api/planning/route.js')).GET;
    const declarations = (await import('../src/app/api/declarations/route.js')).PUT;
    const available = (await import('../src/app/api/available/route.js')).GET;
    const tasks = await import('../src/app/api/tasks/route.js');
    const publish = (await import('../src/app/api/publish/route.js')).POST;
    const invitationRoute = (await import('../src/app/api/invitation/route.js')).POST;

    // Équipe et administrateur créés directement, comme le fait « npm run admin:create ».
    const team = randomUUID();
    const invitation = 'test-invitation-code-long-enough';
    await prisma.team.create({ data: { id: team, name: 'Équipe A', invite_hash: sha256(invitation) } });
    const { hashPassword } = await import('../src/lib/crypto.js');
    await prisma.user.create({
      data: {
        team_id: team,
        name: 'Admin',
        email: 'admin@lacitec.on.ca',
        password_hash: await hashPassword('admin-password-test'),
        role: 'admin',
      },
    });

    // --- Authentification ---
    const signup = (name, email, extra = {}) =>
      call(register, {
        method: 'POST',
        body: { name, email, password: `${name}-password-test`, invitation, ...extra },
      });

    // Même avec role: 'admin' dans le corps, une inscription crée toujours un participant.
    const alice = await signup('alice', 'alice@lacitec.on.ca', { role: 'admin' });
    assert.equal(alice.status, 201);
    assert.equal((await call(me, { token: alice.token })).data.user.role, 'participant');
    const bob = await signup('bob', 'bob@lacitec.on.ca');
    assert.equal((await signup('alice', 'alice@lacitec.on.ca')).status, 409);
    assert.equal((await signup('eve', 'eve@gmail.com')).status, 400);

    assert.equal((await call(me)).status, 401);
    assert.equal((await call(me, { token: 'mauvais-jeton' })).status, 401);

    const loginBody = (email, password) => ({ method: 'POST', body: { email, password } });
    assert.equal((await call(login, loginBody('alice@lacitec.on.ca', 'mauvais-mot-de-passe'))).status, 401);
    assert.equal((await call(login, loginBody('inconnu@lacitec.on.ca', 'nimporte-quoi-123'))).status, 401);
    const admin = await call(login, loginBody('Admin@LaCitec.on.ca ', 'admin-password-test'));
    assert.equal(admin.status, 200);
    assert.equal(admin.data.user.role, 'admin');

    // Déconnexion : le jeton ne fonctionne plus.
    const temp = await call(login, loginBody('alice@lacitec.on.ca', 'alice-password-test'));
    await call(logout, { method: 'POST', token: temp.token });
    assert.equal((await call(me, { token: temp.token })).status, 401);

    // --- Disponibilités et déclarations ---
    const slot = '?day=2026-11-09&start=19:00&end=21:00';
    const availableAt = (query = slot) =>
      call(available, { url: '/api/available' + query, token: admin.token });
    assert.deepEqual((await availableAt()).data.members, []);
    assert.equal((await call(available, { url: '/api/available' + slot, token: alice.token })).status, 403);

    const declare = (who, days, confirm) =>
      call(declarations, { method: 'PUT', token: who.token, body: { month: '2026-11', days, confirm } });
    assert.equal((await declare(admin, [], true)).status, 403);
    assert.equal(
      (
        await call(declarations, {
          method: 'PUT',
          token: alice.token,
          body: { month: '2026-11', days: ['2026-12-01'], confirm: true },
        })
      ).status,
      400,
    );
    await declare(alice, ['2026-11-09'], true);
    await declare(bob, [], true);
    const free = await availableAt();
    assert.deepEqual(
      free.data.members.map((m) => m.name),
      ['bob'],
    );
    assert.deepEqual(free.data.summary, { total: 2, notValidated: 0, absent: 1, busy: 0 });

    // --- Tâches ---
    const aliceId = (await call(me, { token: alice.token })).data.user.id;
    const bobId = free.data.members[0].id;
    const task = (participantId) => ({
      method: 'POST',
      token: admin.token,
      body: { participantId, day: '2026-11-09', start: '19:00', end: '21:00', title: 'Accueil' },
    });
    assert.equal((await call(tasks.POST, task(aliceId))).status, 409); // absente ce jour-là
    const created = await call(tasks.POST, task(bobId));
    assert.equal(created.status, 201);
    assert.equal((await call(tasks.POST, task(bobId))).status, 409); // déjà occupé
    assert.equal((await availableAt('?day=2026-11-09&start=21:00&end=22:00')).data.members.length, 1);

    // --- Publication ---
    const monthOf = (who) => call(planning, { url: '/api/planning?month=2026-11', token: who.token });
    assert.equal((await monthOf(bob)).data.tasks.length, 0); // pas encore publié
    assert.equal(
      (await call(publish, { method: 'POST', token: admin.token, body: { month: '2026-11' } })).status,
      200,
    );
    assert.equal((await monthOf(bob)).data.tasks.length, 1);
    assert.equal((await monthOf(alice)).data.tasks.length, 0);

    // Bob se déclare absent : le planning repasse en brouillon et la publication est refusée.
    await declare(bob, ['2026-11-09'], true);
    assert.equal((await monthOf(admin)).data.published, false);
    assert.equal(
      (await call(publish, { method: 'POST', token: admin.token, body: { month: '2026-11' } })).status,
      409,
    );
    const del = { method: 'DELETE', token: admin.token, body: { id: created.data.id } };
    assert.equal((await call(tasks.DELETE, del)).status, 200);
    assert.equal((await call(tasks.DELETE, del)).status, 404);

    // --- Invitation : l'ancien code ne fonctionne plus ---
    const rotated = await call(invitationRoute, { method: 'POST', token: admin.token });
    assert.equal((await signup('old', 'old@lacitec.on.ca')).status, 400);
    const fresh = await signup('new', 'new@lacitec.on.ca', { invitation: rotated.data.invitation });
    assert.equal((await call(me, { token: fresh.token })).data.user.team_id, team);
  } finally {
    if (prisma) await prisma.$disconnect();
    await server.stop();
    await pg.close();
  }
});
