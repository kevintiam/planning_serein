/** Vérifie les contraintes demandées : taille, commentaires et fetch hors des composants JSX. */
import { readdir, readFile } from 'node:fs/promises';
/** Liste récursivement tous les fichiers d’un dossier. */
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
  // Règle 1 : 300 lignes maximum par fichier.
  const lines = text.trimEnd().split('\n').length;
  if (lines > 300) {
    console.error(`${path} : ${lines} lignes > 300`);
    errors++;
  }
  // Règle 2 : chaque fichier contient au moins un commentaire (/* // -- ou #).
  if (!/(\/\*|\/\/|--|^#)/m.test(text)) {
    console.error(`${path} : commentaire manquant`);
    errors++;
  }
  // Règle 3 : les composants JSX n'appellent jamais le réseau : le fetch se fait dans les hooks.
  if (/\.(jsx)$/.test(path) && /\bfetch\s*\(/.test(text)) {
    console.error(`${path} : fetch interdit dans JSX (à mettre dans un hook)`);
    errors++;
  }
}
if (errors) process.exitCode = 1;
else console.log(`${files.length} fichiers contrôlés : <=300 lignes, commentaires, fetch dans les hooks.`);
