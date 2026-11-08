/** Vérifie les contraintes demandées : taille, commentaires et couches client. */
import { readdir, readFile } from 'node:fs/promises';
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else result.push(path);
  }
  return result;
}
let errors = 0;
const files = [
  ...(await walk('src')),
  ...(await walk('scripts')),
  ...(await walk('tests')),
  ...(await walk('prisma')),
];
for (const path of files) {
  const text = await readFile(path, 'utf8');
  const lines = text.trimEnd().split('\n').length;
  if (lines > 300) {
    console.error(`${path} : ${lines} lignes > 300`);
    errors++;
  }
  if (!/(\/\*|\/\/|--|^#)/m.test(text)) {
    console.error(`${path} : commentaire manquant`);
    errors++;
  }
  if (/\.(jsx)$/.test(path) && /(\bfetch\s*\(|from ['"].*\/api\/)/.test(text)) {
    console.error(`${path} : appel API interdit dans JSX`);
    errors++;
  }
  if (path.startsWith('src/hooks/') && /\bfetch\s*\(/.test(text)) {
    console.error(`${path} : fetch doit être dans src/api`);
    errors++;
  }
}
if (errors) process.exitCode = 1;
else console.log(`${files.length} fichiers contrôlés : <=300 lignes, commentaires, API/hooks/JSX séparés.`);
