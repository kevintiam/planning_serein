/** Smoke HTTP du build : lance et arrête son propre serveur, sans base distante. */
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
const port = 3187;
const origin = `http://127.0.0.1:${port}`;
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
  {
    env: { ...process.env, APP_URL: origin },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let output = '';
child.stdout.on('data', (chunk) => {
  output += chunk;
});
child.stderr.on('data', (chunk) => {
  output += chunk;
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(origin);
      ready = response.ok;
    } catch {
      /* Démarrage en cours. */
    }
    if (ready) break;
    await delay(250);
  }
  assert.ok(ready, 'Le serveur n’a pas démarré : ' + output);
  for (const path of ['/', '/connexion', '/inscription']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes('planning'));
  }
  for (const path of ['/admin', '/participant', '/espace']) {
    const response = await fetch(origin + path, { redirect: 'manual' });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), '/connexion');
  }
  assert.equal((await fetch(origin + '/api/auth/me')).status, 401);
  const denied = await fetch(origin + '/api/auth/login', {
    method: 'POST',
    headers: { Origin: 'https://autre-site.example', 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(denied.status, 403);
  const invalid = await fetch(origin + '/api/auth/register', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(invalid.status, 400);
  console.log(
    'PASS HTTP : pages publiques, redirections, session obligatoire, protection Origin et validation.',
  );
} finally {
  child.kill('SIGTERM');
}
