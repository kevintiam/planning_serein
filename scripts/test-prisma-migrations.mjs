/** Vérifie Prisma Migrate sur une base jetable ; ne touche jamais à votre Neon. */
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
// PostgreSQL en mémoire (PGlite), exposé sur une socket locale pour Prisma.
const pg = new PGlite();
const server = new PGLiteSocketServer({ db: pg, port: 0, host: '127.0.0.1', maxConnections: 5 });
/** Lance une commande Prisma CLI contre l’URL donnée ; rejette avec la sortie en cas d’échec. */
async function command(args, url) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/prisma/build/index.js', ...args], {
      env: { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve(output) : reject(new Error(output))));
  });
}
try {
  await server.start();
  const url = `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`;
  // Deux déploiements de suite : le second ne doit rien refaire (idempotence).
  await command(['migrate', 'deploy'], url);
  await command(['migrate', 'deploy'], url);
  const applied = await pg.query(
    'SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL',
  );
  assert.equal(applied.rows.length, 1);
  assert.equal(applied.rows[0].migration_name, '20261108000000_init');
  await command(
    ['migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code'],
    url,
  );
  console.log('PASS Prisma Migrate : déploiement initial, second passage idempotent et schéma conforme.');
} finally {
  await server.stop();
  await pg.close();
}
