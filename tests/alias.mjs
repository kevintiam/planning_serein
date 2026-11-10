/**
 * Chargeur pour les tests Node : reproduit les résolutions faites par Next.js.
 * - « @/... »       → « src/... » (alias défini dans jsconfig.json)
 * - « next/server », « next/headers »… → « next/server.js »… (Node exige l'extension)
 * Utilisé par : node --import ./tests/alias.mjs --test
 */
import { registerHooks } from 'node:module';

const src = new URL('../src/', import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) return nextResolve(new URL(specifier.slice(2), src).href, context);
    if (/^next\/[a-z]+$/.test(specifier)) return nextResolve(specifier + '.js', context);
    return nextResolve(specifier, context);
  },
});
